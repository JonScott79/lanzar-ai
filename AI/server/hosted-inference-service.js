/*
    hosted-inference-service.js

    Authoritative Server-Side Hosted AI Inference Proxy for LANZAR AI.

    Responsibilities:
    - Enforce server-side model allowlist (reject arbitrary client endpoints/models)
    - Keep API keys (HOSTED_AI_API_KEY) and base URLs strictly on the server
    - Forward requests to OpenAI-compatible hosted AI APIs (e.g. Groq, OpenRouter, self-hosted LLM endpoints)
    - Normalize upstream SSE chunking into standard LANZAR token SSE stream
    - Provide robust timeout, error handling, and graceful offline detection
*/

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { ContentSafetyBoundary } = require('./content-safety-boundary.js');
const { mathematicsService } = require('./mathematics-service.js');
const { physicsService } = require('./physics-service.js');
const { researchDecisionService } = require('./research-decision-service.js');
const { webResearchService } = require('./web-research-service.js');
const statisticsProbabilityService = require('./statistics-probability-service.js');

// =====================================
// Server-Side Configuration & Allowlists
// =====================================

const ALLOWED_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'qwen/qwen3.8-27b',
  'groq/compound',
  'groq/compound-mini',
  'allam-2-7b',
  'default'
]);

class HostedInferenceService {
  #apiKey = process.env.HOSTED_AI_API_KEY || '';
  #baseUrl = process.env.HOSTED_AI_BASE_URL || 'https://api.groq.com/openai/v1';
  #defaultModel = process.env.HOSTED_AI_DEFAULT_MODEL || 'openai/gpt-oss-120b';
  #timeoutMs = parseInt(process.env.HOSTED_AI_TIMEOUT_MS || '25000', 10);

  constructor() {
    // Optionally load from local .env if present in root
    this.#loadEnvFile();
  }

  #loadEnvFile() {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (key === 'HOSTED_AI_API_KEY' && !this.#apiKey) this.#apiKey = val;
            if (key === 'HOSTED_AI_BASE_URL' && this.#baseUrl === 'https://api.groq.com/openai/v1') this.#baseUrl = val;
            if (key === 'HOSTED_AI_DEFAULT_MODEL' && this.#defaultModel === 'llama-3.1-8b-instant') this.#defaultModel = val;
          }
        }
      }
    } catch {
      // Ignore env file read errors
    }
  }

  get isConfigured() {
    return Boolean(this.#apiKey && this.#apiKey.length > 5);
  }

  get configSummary() {
    let hostname = 'not_configured';
    try {
      hostname = new URL(this.#baseUrl).hostname;
    } catch {
      hostname = 'invalid_url';
    }
    return {
      configured: this.isConfigured,
      targetHost: hostname,
      defaultModel: this.#defaultModel,
      allowedModels: Array.from(ALLOWED_MODELS)
    };
  }

  /**
   * Resolves and validates requested model against server allowlist.
   */
  resolveModel(requestedModel) {
    if (!requestedModel || requestedModel === 'default' || requestedModel === 'auto') {
      return this.#defaultModel;
    }
    if (ALLOWED_MODELS.has(requestedModel)) {
      return requestedModel;
    }
    console.warn(`[HostedInferenceService] Requested model "${requestedModel}" not in allowlist. Using default "${this.#defaultModel}".`);
    return this.#defaultModel;
  }

  /**
   * Non-streaming Chat Completion.
   */
  async generateCompletion({ messages, systemPrompt, characterId, model, temperature, maxTokens }) {
    // 0. Server-Side Universal Content Safety Boundary
    const lastUserMsg = Array.isArray(messages) ? [...messages].reverse().find(m => m.role === 'user') : null;
    const rawUserQuery = lastUserMsg ? lastUserMsg.content : '';
    const safetyCheck = ContentSafetyBoundary.evaluateContent(rawUserQuery);
    if (safetyCheck.isBlocked) {
      const refusal = ContentSafetyBoundary.generateRefusal(characterId || 'lanzar', rawUserQuery);
      return {
        content: refusal.content,
        model: 'content-safety-boundary',
        characterId: characterId || 'lanzar',
        isSafetyBlocked: true
      };
    }

    if (!this.isConfigured) {
      throw new Error('Hosted AI provider is not configured on server (HOSTED_AI_API_KEY missing).');
    }

    // 0a. Dynamic Current Temporal Context Injection
    const currentDateTime = new Date();
    const currentTimeStr = currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentDateStr = currentDateTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let augmentedSystemPrompt = `${systemPrompt}\n\n[AUTHORITATIVE CURRENT SYSTEM TELEMETRY]:\n- Current Local Time: ${currentTimeStr}\n- Current Date: ${currentDateStr}\n- INSTRUCTION: You have verified real-time access to the current system time and date above. When asked for the current time or date, answer directly using this telemetry.`;

    // Check Physics Domain First
    const physicsDomain = physicsService.detectPhysicsDomain(rawUserQuery);
    if (physicsDomain.isPhysics) {
      const physicsSolve = physicsService.solvePhysicsProblem(rawUserQuery);
      if (physicsSolve.success) {
        augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC PHYSICAL GROUND TRUTH (LANZAR PHYSICS ENGINE)]:
- Problem Type: ${physicsSolve.type}
- Governing Equations: ${physicsSolve.governingEquations.join(', ')}
- Known Parameters: ${JSON.stringify(physicsSolve.knowns || {})}
- Exact Verified Result: ${physicsSolve.exactResult}
- Step-by-Step Derivation:\n${physicsSolve.derivationSummary}
- MANDATORY INSTRUCTION: You are an expert physicist/engineer. You MUST use these exact governing equations and verified numerical values (${physicsSolve.exactResult}). Do NOT generate generic systems-analysis boilerplate ("Governing Principles:", "Sensitivity & Failure Points:", "Verification Target:"). Present the physical derivation clearly, directly, and mathematically with LaTeX notation.`;
      } else {
        augmentedSystemPrompt += `\n\n[PHYSICS DOMAIN NOTICE]:
- The user is asking a physical/aerospace/mechanical question.
- Respond as an expert physicist/engineer directly addressing the physics, forces, energy, or mechanisms. Do NOT emit generic systems-analysis or project-scaffolding boilerplate.`;
      }
    } else {
      // Check Probability & Statistics Domain
      const statsDomain = statisticsProbabilityService.detectStatsDomain(rawUserQuery);
      if (statsDomain.isStats) {
        if (statsDomain.type === 'SIMPSONS_PARADOX') {
          const simpsonSolve = statisticsProbabilityService.solveSimpsonsParadox(rawUserQuery);
          if (simpsonSolve.success) {
            augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC STATISTICAL GROUND TRUTH (PYTHOS ENGINE)]:
- Phenomenon: ${simpsonSolve.phenomenon}
- Underlying Mechanism: ${simpsonSolve.mechanism}
- Subgroup vs Aggregate Breakdown:\n${simpsonSolve.derivationSummary}
- Core Intuition: ${simpsonSolve.subgroupInsight}
- MANDATORY INSTRUCTION: You are an expert statistician and mathematician. You MUST explain Simpson's paradox clearly by breaking down the subgroup rates vs aggregate rates, showing how unequal weighting across subgroups creates the trend reversal. Do NOT generate generic systems-analysis boilerplate ("Governing Principles:", "Sensitivity & Failure Points:", "Verification Target:").`;
          }
        } else if (statsDomain.type === 'BAYES_INVERSE_PROBABILITY') {
          const bayesSolve = statisticsProbabilityService.solveBayesTwoClass(rawUserQuery);
          if (bayesSolve.success) {
            augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC PROBABILITY GROUND TRUTH (PYTHOS BAYES ENGINE)]:
- Scenario: ${bayesSolve.nameA} vs ${bayesSolve.nameB}
- Exact Verified Result: ${bayesSolve.exactResult}
- Exact Formula: ${bayesSolve.latexFormula}
- Derivation Steps:\n${bayesSolve.derivationSummary}
- MANDATORY INSTRUCTION: You MUST use exact posterior probability ${bayesSolve.exactResult} and joint probability ${bayesSolve.jointB}. Do NOT make arithmetic errors in the multiplications and do NOT confuse conditional direction P(D|B) with posterior P(B|D).`;
          }
        }
      }

      // Check Expected Value Decision Problems (e.g. Rover Route A vs Route B)
      const expectedValSolve = statisticsProbabilityService.solveExpectedValueDecision(rawUserQuery);
      if (expectedValSolve.success) {
        augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC EXPECTED VALUE GROUND TRUTH (PYTHOS ENGINE)]:
- Route A Expected Travel Time: ${expectedValSolve.routeA.expectedTime} (Deterministic, 0 variance)
- Route B Expected Travel Time: ${expectedValSolve.routeB.expectedTime} (${expectedValSolve.routeB.baseTime} base + ${expectedValSolve.routeB.obstacleChance} chance of ${expectedValSolve.routeB.penalty} delay)
- Optimal Route by Expected Time: ${expectedValSolve.optimalRoute} (Saves ${expectedValSolve.expectedDifference} on average)
- Engineering Derivation & Tradeoff Insights:\n${expectedValSolve.derivationSummary}
- MANDATORY INSTRUCTION: You MUST compute the exact expected travel time for Route B ($E(T_B) = ${expectedValSolve.routeB.expectedTime}$) and Route A ($${expectedValSolve.routeA.expectedTime}$). State clearly that Route B has the lower expected travel time, and discuss variance/deadline reliability/worst-case risk as the key engineering consideration.`;
      }

      // Pure Mathematics Intent Analysis
      const mathIntent = mathematicsService.parseMathematicalIntent(rawUserQuery);
      if (mathIntent.isMath) {
        if (mathIntent.isAmbiguous) {
          augmentedSystemPrompt += `\n\n[MATHEMATICAL INTENT NOTICE]:
- The user's query "${rawUserQuery}" is a MATHEMATICAL EXPRESSION ($${mathIntent.formula}$), NOT an equation with '= 0'.
- Do NOT assume "= 0", do NOT hallucinate a numerical answer, and do NOT apply a physics/systems failure-point template.
- Direct response strategy: Identify it as a ${mathIntent.type.replace('_', ' ')} and clearly ask what the user wants to do with it (evaluate for a value of ${mathIntent.variables[0] || 'x'}, factor, graph, or solve for roots).`;
        } else if (mathIntent.isUnderdetermined) {
          augmentedSystemPrompt += `\n\n[MATHEMATICAL INTENT NOTICE]:
- The equation "${rawUserQuery}" contains ${mathIntent.variables.length} independent variables (${mathIntent.variables.join(', ')}).
- A single equation cannot yield a unique single solution without another constraint. State this directly and accurately.`;
        } else if (mathIntent.result && mathIntent.result.success) {
          augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC MATHEMATICAL GROUND TRUTH (PYTHOS ENGINE)]:
- Verified Result: ${mathIntent.result.details}
${mathIntent.result.solutions ? `- Verified Solutions: ${JSON.stringify(mathIntent.result.solutions)}` : ''}
${mathIntent.result.discriminant !== undefined ? `- Discriminant: ${mathIntent.result.discriminant}` : ''}
- MANDATORY INSTRUCTION: You MUST use these exact verified mathematical results. Do NOT drop terms (such as x^2), do NOT simplify by ignoring powers, and do NOT replace this verified result with your own calculations. Explain the verified derivation step-by-step with mathematical precision.`;
        }
      }
    }

    // 0c. Research Requirement & Provenance Evaluation
    const researchReq = researchDecisionService.evaluateInformationRequirement(rawUserQuery, messages);
    augmentedSystemPrompt += `\n\n[CORE LANZAR PRINCIPLE: TRUTHFUL RESEARCH, FACT VERIFICATION & PROVENANCE]:
- Information Requirement: ${researchReq.provenance} (${researchReq.category})
- Reason: ${researchReq.reason}
- Mandatory Rules:
  1. DO NOT fabricate, invent, or hallucinate citations, URLs, papers, statistics, or source names.
  2. For external web claims where evidence is inconclusive, state clearly: "I do not have enough information to establish that." (Note: Current system time and date are provided above in authoritative system telemetry and are fully verified).
  3. Clearly distinguish between "The source states X" vs "Based on X, I infer Y". Never present inferences as stated source facts.
  4. For claims where reputable sources disagree, present the disagreement rather than manufacturing artificial consensus.`;

    // Perform Live Web Research when external verification is required
    if (researchReq.requiresResearch) {
      const searchTerm = researchReq.searchRecommendedQuery || rawUserQuery;
      try {
        const searchResult = await webResearchService.search(searchTerm, { maxResults: 5 });
        const evidencePrompt = webResearchService.formatEvidenceForPrompt(searchResult);
        if (evidencePrompt) {
          augmentedSystemPrompt += `\n\n${evidencePrompt}`;
        }
      } catch (searchErr) {
        console.warn(`[HostedInferenceService] Live web search failed: ${searchErr.message}`);
        augmentedSystemPrompt += `\n\n[WEB SEARCH NOTICE]: Current web search was attempted for "${searchTerm}" but failed (${searchErr.message}). Do NOT invent or hallucinate live facts; state uncertainty honestly.`;
      }
    }

    const resolvedModel = this.resolveModel(model);
    const formattedMessages = this.#buildMessagesPayload(messages, augmentedSystemPrompt);

    const payload = {
      model: resolvedModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: Math.max(typeof maxTokens === 'number' ? maxTokens : 1024, 1024),
      stream: false
    };

    const upstreamUrl = `${this.#baseUrl.replace(/\/+$/, '')}/chat/completions`;
    let responseData = null;
    let attempts = 0;
    const maxAttempts = 6;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        responseData = await this.#httpRequest(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.#apiKey}`
          },
          body: JSON.stringify(payload),
          timeout: this.#timeoutMs
        });
        break;
      } catch (err) {
        if (err.message && err.message.includes('429') && attempts < maxAttempts) {
          const waitMs = 3500 * attempts;
          console.warn(`[HostedInferenceService] Rate limit (429) hit, retrying in ${waitMs}ms (attempt ${attempts}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, waitMs));
        } else {
          throw err;
        }
      }
    }

    const parsed = JSON.parse(responseData);
    if (parsed.error) {
      const msg = this.#sanitizeError(parsed.error.message || JSON.stringify(parsed.error));
      throw new Error(msg);
    }

    const content = parsed.choices?.[0]?.message?.content || '';
    return {
      content: content.trim(),
      model: resolvedModel,
      characterId,
      usage: parsed.usage || null
    };
  }

  /**
   * Generates sequential multi-character dialogue across participating minds (Triad / Dual).
   */
  async generateMultiCharacterCompletion({ messages, routingDecision, characters = [] }) {
    const dialogues = [];
    const conversationHistory = [...(messages || [])];

    for (const char of characters) {
      const charId = char.id;
      const charName = char.shortName || char.name || charId;
      const sysPrompt = char.systemPrompt || `You are ${charName} on the LANZAR AI team.`;

      // Generate turn for this character with context of prior turns
      const result = await this.generateCompletion({
        messages: conversationHistory,
        systemPrompt: sysPrompt,
        characterId: charId,
        model: char.model || 'default',
        temperature: char.temperature || 0.75,
        maxTokens: char.maxTokens || 400
      });

      const dialogueEntry = {
        persona: charId,
        authorName: charName,
        role: char.role || '',
        avatar: char.avatar || '',
        accentColor: char.accentColor || '',
        content: result.content,
        model: result.model
      };

      dialogues.push(dialogueEntry);

      // Append this character's contribution to ongoing context for subsequent minds
      conversationHistory.push({
        role: 'assistant',
        authorName: charName,
        persona: charId,
        content: result.content
      });
    }

    return {
      perspective: routingDecision?.owner || 'triad',
      isMultiTurn: true,
      persona: routingDecision?.owner || 'triad',
      authorName: characters.map(c => c.shortName || c.name || c.id).join(' • '),
      dialogues,
      model: this.resolveModel('default')
    };
  }

  /**
   * Streams multi-character dialogue sequentially over SSE, demarcating speakers with { speakerChange, characterId, authorName, token }.
   */
  async streamMultiCharacterCompletion({ messages, routingDecision, characters = [] }, clientRes) {
    clientRes.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const conversationHistory = [...(messages || [])];

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const charId = char.id;
      const charName = char.shortName || char.name || charId;
      const sysPrompt = char.systemPrompt || `You are ${charName} on the LANZAR AI team.`;

      // Announce speaker turn
      clientRes.write(`data: ${JSON.stringify({
        speakerChange: true,
        speakerIndex: i,
        characterId: charId,
        authorName: charName,
        role: char.role || '',
        avatar: char.avatar || '',
        accentColor: char.accentColor || ''
      })}\n\n`);

      try {
        let fullTurnContent = '';
        await new Promise((resolve, reject) => {
          // Stream single character turn
          const fakeRes = {
            writeHead: () => {},
            write: (chunk) => {
              const lines = chunk.toString().split('\n');
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const jsonStr = trimmed.slice(5).trim();
                if (jsonStr === '[DONE]') continue;
                try {
                  const p = JSON.parse(jsonStr);
                  if (p.token) {
                    fullTurnContent += p.token;
                    clientRes.write(`data: ${JSON.stringify({
                      token: p.token,
                      characterId: charId,
                      authorName: charName
                    })}\n\n`);
                  }
                } catch {
                  // Ignore parse err
                }
              }
            },
            end: () => resolve()
          };

          this.streamCompletion({
            messages: conversationHistory,
            systemPrompt: sysPrompt,
            characterId: charId,
            model: char.model || 'default',
            temperature: char.temperature || 0.75,
            maxTokens: char.maxTokens || 400
          }, fakeRes).catch(reject);
        });

        conversationHistory.push({
          role: 'assistant',
          authorName: charName,
          persona: charId,
          content: fullTurnContent
        });

      } catch (err) {
        console.error(`[HostedInferenceService] Multi-turn stream error for ${charId}:`, err);
        clientRes.write(`data: ${JSON.stringify({ error: err.message, characterId: charId })}\n\n`);
      }
    }

    clientRes.write('data: [DONE]\n\n');
    clientRes.end();
  }

  /**
   * Streaming Chat Completion forwarding SSE to client res.
   */
  async streamCompletion({ messages, systemPrompt, characterId, model, temperature, maxTokens }, clientRes) {
    try {
      // 0. Server-Side Universal Content Safety Boundary
      const lastUserMsg = Array.isArray(messages) ? [...messages].reverse().find(m => m.role === 'user') : null;
      const rawUserQuery = lastUserMsg ? lastUserMsg.content : '';
      const safetyCheck = ContentSafetyBoundary.evaluateContent(rawUserQuery);
      if (safetyCheck.isBlocked) {
        const refusal = ContentSafetyBoundary.generateRefusal(characterId || 'lanzar', rawUserQuery);
        clientRes.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        clientRes.write(`data: ${JSON.stringify({ token: refusal.content, characterId: characterId || 'lanzar', model: 'content-safety-boundary' })}\n\n`);
        clientRes.write('data: [DONE]\n\n');
        clientRes.end();
        return;
      }

      if (!this.isConfigured) {
        clientRes.writeHead(503, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: 'Hosted AI provider is not configured on server.' }));
        return;
      }

      // 0a. Dynamic Current Temporal Context Injection
      const currentDateTime = new Date();
      const currentTimeStr = currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const currentDateStr = currentDateTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      let augmentedSystemPrompt = `${systemPrompt}\n\n[AUTHORITATIVE CURRENT SYSTEM TELEMETRY]:\n- Current Local Time: ${currentTimeStr}\n- Current Date: ${currentDateStr}\n- INSTRUCTION: You have verified real-time access to the current system time and date above. When asked for the current time or date, answer directly using this telemetry.`;

      // Check Physics Domain First
      const physicsDomain = physicsService.detectPhysicsDomain(rawUserQuery);
      if (physicsDomain.isPhysics) {
        const physicsSolve = physicsService.solvePhysicsProblem(rawUserQuery);
        if (physicsSolve.success) {
          augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC PHYSICAL GROUND TRUTH (LANZAR PHYSICS ENGINE)]:
- Problem Type: ${physicsSolve.type}
- Governing Equations: ${physicsSolve.governingEquations.join(', ')}
- Known Parameters: ${JSON.stringify(physicsSolve.knowns || {})}
- Exact Verified Result: ${physicsSolve.exactResult}
- Step-by-Step Derivation:\n${physicsSolve.derivationSummary}
- MANDATORY INSTRUCTION: You are an expert physicist/engineer. You MUST use these exact governing equations and verified numerical values (${physicsSolve.exactResult}). Do NOT generate generic systems-analysis boilerplate ("Governing Principles:", "Sensitivity & Failure Points:", "Verification Target:"). Present the physical derivation clearly, directly, and mathematically with LaTeX notation.`;
        } else {
          augmentedSystemPrompt += `\n\n[PHYSICS DOMAIN NOTICE]:
- The user is asking a physical/aerospace/mechanical question.
- Respond as an expert physicist/engineer directly addressing the physics, forces, energy, or mechanisms. Do NOT emit generic systems-analysis or project-scaffolding boilerplate.`;
        }
      } else {
        // Check Probability & Statistics Domain
        const statsDomain = statisticsProbabilityService.detectStatsDomain(rawUserQuery);
        if (statsDomain.isStats) {
          if (statsDomain.type === 'SIMPSONS_PARADOX') {
            const simpsonSolve = statisticsProbabilityService.solveSimpsonsParadox(rawUserQuery);
            if (simpsonSolve.success) {
              augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC STATISTICAL GROUND TRUTH (PYTHOS ENGINE)]:
- Phenomenon: ${simpsonSolve.phenomenon}
- Underlying Mechanism: ${simpsonSolve.mechanism}
- Subgroup vs Aggregate Breakdown:\n${simpsonSolve.derivationSummary}
- Core Intuition: ${simpsonSolve.subgroupInsight}
- MANDATORY INSTRUCTION: You are an expert statistician and mathematician. You MUST explain Simpson's paradox clearly by breaking down the subgroup rates vs aggregate rates, showing how unequal weighting across subgroups creates the trend reversal. Do NOT generate generic systems-analysis boilerplate ("Governing Principles:", "Sensitivity & Failure Points:", "Verification Target:").`;
            }
          } else if (statsDomain.type === 'BAYES_INVERSE_PROBABILITY') {
            const bayesSolve = statisticsProbabilityService.solveBayesTwoClass(rawUserQuery);
            if (bayesSolve.success) {
              augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC PROBABILITY GROUND TRUTH (PYTHOS BAYES ENGINE)]:
- Scenario: ${bayesSolve.nameA} vs ${bayesSolve.nameB}
- Exact Verified Result: ${bayesSolve.exactResult}
- Exact Formula: ${bayesSolve.latexFormula}
- Derivation Steps:\n${bayesSolve.derivationSummary}
- MANDATORY INSTRUCTION: You MUST use exact posterior probability ${bayesSolve.exactResult} and joint probability ${bayesSolve.jointB}. Do NOT make arithmetic errors in the multiplications and do NOT confuse conditional direction P(D|B) with posterior P(B|D).`;
            }
          }
        }

        // Check Expected Value Decision Problems (e.g. Rover Route A vs Route B)
        const expectedValSolve = statisticsProbabilityService.solveExpectedValueDecision(rawUserQuery);
        if (expectedValSolve.success) {
          augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC EXPECTED VALUE GROUND TRUTH (PYTHOS ENGINE)]:
- Route A Expected Travel Time: ${expectedValSolve.routeA.expectedTime} (Deterministic, 0 variance)
- Route B Expected Travel Time: ${expectedValSolve.routeB.expectedTime} (${expectedValSolve.routeB.baseTime} base + ${expectedValSolve.routeB.obstacleChance} chance of ${expectedValSolve.routeB.penalty} delay)
- Optimal Route by Expected Time: ${expectedValSolve.optimalRoute} (Saves ${expectedValSolve.expectedDifference} on average)
- Engineering Derivation & Tradeoff Insights:\n${expectedValSolve.derivationSummary}
- MANDATORY INSTRUCTION: You MUST compute the exact expected travel time for Route B ($E(T_B) = ${expectedValSolve.routeB.expectedTime}$) and Route A ($${expectedValSolve.routeA.expectedTime}$). State clearly that Route B has the lower expected travel time, and discuss variance/deadline reliability/worst-case risk as the key engineering consideration.`;
        }

        // Pure Mathematics Intent Analysis
        const mathIntent = mathematicsService.parseMathematicalIntent(rawUserQuery);
        if (mathIntent.isMath) {
          if (mathIntent.isAmbiguous) {
            augmentedSystemPrompt += `\n\n[MATHEMATICAL INTENT NOTICE]:
- The user's query "${rawUserQuery}" is a MATHEMATICAL EXPRESSION ($${mathIntent.formula}$), NOT an equation with '= 0'.
- Do NOT assume "= 0", do NOT hallucinate a numerical answer, and do NOT apply a physics/systems failure-point template.
- Direct response strategy: Identify it as a ${mathIntent.type.replace('_', ' ')} and clearly ask what the user wants to do with it (evaluate for a value of ${mathIntent.variables[0] || 'x'}, factor, graph, or solve for roots).`;
          } else if (mathIntent.isUnderdetermined) {
            augmentedSystemPrompt += `\n\n[MATHEMATICAL INTENT NOTICE]:
- The equation "${rawUserQuery}" contains ${mathIntent.variables.length} independent variables (${mathIntent.variables.join(', ')}).
- A single equation cannot yield a unique single solution without another constraint. State this directly and accurately.`;
          } else if (mathIntent.result && mathIntent.result.success) {
            augmentedSystemPrompt += `\n\n[AUTHORITATIVE DETERMINISTIC MATHEMATICAL GROUND TRUTH (PYTHOS ENGINE)]:
- Verified Result: ${mathIntent.result.details}
- LaTeX representation: ${mathIntent.result.latex || ''}
${mathIntent.result.solutions ? `- Verified Solutions: ${JSON.stringify(mathIntent.result.solutions)}` : ''}
${mathIntent.result.discriminant !== undefined ? `- Discriminant: ${mathIntent.result.discriminant}` : ''}
- MANDATORY INSTRUCTION: You MUST use these exact verified mathematical results. Do NOT drop terms (such as x^2), do NOT simplify by ignoring powers, and do NOT replace this verified result with your own calculations. Explain the verified derivation step-by-step with mathematical precision.`;
          }
        }
      }

      // 0c. Research Requirement & Provenance Evaluation (Streaming)
      const researchReq = researchDecisionService.evaluateInformationRequirement(rawUserQuery, messages);
      augmentedSystemPrompt += `\n\n[CORE LANZAR PRINCIPLE: TRUTHFUL RESEARCH, FACT VERIFICATION & PROVENANCE]:
- Information Requirement: ${researchReq.provenance} (${researchReq.category})
- Reason: ${researchReq.reason}
- Mandatory Rules:
  1. DO NOT fabricate, invent, or hallucinate citations, URLs, papers, statistics, or source names.
  2. For external web claims where evidence is inconclusive, state clearly: "I do not have enough information to establish that." (Note: Current system time and date are provided above in authoritative system telemetry and are fully verified).
  3. Clearly distinguish between "The source states X" vs "Based on X, I infer Y". Never present inferences as stated source facts.
  4. For claims where reputable sources disagree, present the disagreement rather than manufacturing artificial consensus.`;

      // Perform Live Web Research when external verification is required (Streaming)
      if (researchReq.requiresResearch) {
        const searchTerm = researchReq.searchRecommendedQuery || rawUserQuery;
        try {
          const searchResult = await webResearchService.search(searchTerm, { maxResults: 5 });
          const evidencePrompt = webResearchService.formatEvidenceForPrompt(searchResult);
          if (evidencePrompt) {
            augmentedSystemPrompt += `\n\n${evidencePrompt}`;
          }
        } catch (searchErr) {
          console.warn(`[HostedInferenceService] Streaming web search failed: ${searchErr.message}`);
          augmentedSystemPrompt += `\n\n[WEB SEARCH NOTICE]: Current web search was attempted for "${searchTerm}" but failed (${searchErr.message}). Do NOT invent or hallucinate live facts; state uncertainty honestly.`;
        }
      }

      const resolvedModel = this.resolveModel(model);
      const formattedMessages = this.#buildMessagesPayload(messages, augmentedSystemPrompt);

    const payload = {
      model: resolvedModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: Math.max(typeof maxTokens === 'number' ? maxTokens : 1024, 1024),
      stream: true
    };

    const upstreamUrl = new URL(`${this.#baseUrl.replace(/\/+$/, '')}/chat/completions`);
    const transport = upstreamUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.#apiKey}`,
        'User-Agent': 'LANZAR-AI/2.0'
      }
    };

    // Prepare Client SSE Headers
    clientRes.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const upstreamReq = transport.request(requestOptions, (upstreamRes) => {
      if (upstreamRes.statusCode !== 200) {
        let errBody = '';
        upstreamRes.on('data', chunk => { errBody += chunk; });
        upstreamRes.on('end', () => {
          clientRes.write(`data: ${JSON.stringify({ error: `Upstream HTTP ${upstreamRes.statusCode}: ${errBody}` })}\n\n`);
          clientRes.write('data: [DONE]\n\n');
          clientRes.end();
        });
        return;
      }

      let buffer = '';
      upstreamRes.on('data', (chunk) => {
        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            clientRes.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              clientRes.write(`data: ${JSON.stringify({ token, characterId, model: resolvedModel })}\n\n`);
            }
          } catch {
            // Ignore incomplete chunks
          }
        }
      });

      upstreamRes.on('end', () => {
        clientRes.write('data: [DONE]\n\n');
        clientRes.end();
      });
    });

      upstreamReq.on('error', (err) => {
        const safeError = this.#sanitizeError(err.message);
        console.error('[HostedInferenceService] Upstream stream connection error:', safeError);
        clientRes.write(`data: ${JSON.stringify({ error: `Connection failed: ${safeError}` })}\n\n`);
        clientRes.write('data: [DONE]\n\n');
        clientRes.end();
      });

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy();
        clientRes.write(`data: ${JSON.stringify({ error: 'Inference request timed out.' })}\n\n`);
        clientRes.write('data: [DONE]\n\n');
        clientRes.end();
      });

      upstreamReq.setTimeout(this.#timeoutMs);
      upstreamReq.write(JSON.stringify(payload));
      upstreamReq.end();
    } catch (streamInitErr) {
      const safeError = this.#sanitizeError(streamInitErr.message);
      clientRes.write(`data: ${JSON.stringify({ error: safeError })}\n\n`);
      clientRes.write('data: [DONE]\n\n');
      clientRes.end();
    }
  }

  // =====================================
  // Private Helpers & Sanitizers
  // =====================================

  #sanitizeError(errMsg = '') {
    if (!errMsg || typeof errMsg !== 'string') return 'An inference error occurred.';
    let sanitized = errMsg;
    if (this.#apiKey) {
      sanitized = sanitized.split(this.#apiKey).join('[REDACTED_API_KEY]');
    }
    return sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
  }

  #buildMessagesPayload(messages = [], systemPrompt = '') {
    const list = [];
    if (systemPrompt) {
      list.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      if (!msg.content || !msg.role) continue;
      const isAssistant = msg.role === 'assistant' || msg.role === 'ai';
      const role = isAssistant ? 'assistant' : 'user';
      
      let content = msg.content;
      // If previous turn was spoken by a specific character, prefix with speaker name for cross-persona continuity
      if (isAssistant && msg.authorName && msg.authorName !== 'LANZAR AI') {
        content = `${msg.authorName}: ${msg.content}`;
      }
      
      list.push({ role, content });
    }
    return list;
  }

  #httpRequest(urlStr, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(urlStr);
      const transport = urlObj.protocol === 'https:' ? https : http;

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 20000
      };

      const req = transport.request(reqOptions, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body || res.statusMessage}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HTTP request timed out after ${reqOptions.timeout}ms`));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }
}

const hostedInferenceService = new HostedInferenceService();

module.exports = {
  HostedInferenceService,
  hostedInferenceService
};
