/*
    cognitive-router.js

    Cognitive Perspective Router for LANZAR AI.

    Responsibilities:
    - Analyze user intent, task complexity, and the need for creativity, analysis, or visual direction
    - Filter routing exclusively through currently ENABLED personalities
    - Honor DIRECT SELECTION when user explicitly locks focus to a single personality
    - Prevent disabled personalities from silently participating in automatic routing or Dual Mind
    - Provide graceful LANZAR Core fallbacks when specialized minds are disabled
    - Provide reasoning metadata for telemetry and UI perspective badging
*/

import { ContentSafetyBoundary } from "../core/content-safety-boundary.js";
import { ResearchDecisionService } from "../services/research-decision-service.js";
import { PennyPersona } from "../personas/penny.js";
import { PetePersona } from "../personas/pete.js";
import { MinaPersona } from "../personas/mina.js";

// =====================================
// Cognitive Router Class
// =====================================

export class CognitiveRouter {
  /**
   * Evaluates the query and conversation context to select the response owner.
   *
   * @param {string} userText - Raw user input text
   * @param {Array} history - Previous conversation messages
   * @param {Object} options - Configuration overrides (e.g. personaManager, selectedPersonaId, perspectiveMode)
   * @returns {Object} Routing decision { owner: 'lanzar'|'penny'|'pete'|'mina'|'dual'|'mina_penny'|'mina_pete'|'triad', taskType: string, reason: string, disabledPersona?: string, provenance?: string, requiresResearch?: boolean }
   */
  static route(userText, history = [], options = {}) {
    const raw = (userText || "").trim();
    const query = raw.toLowerCase();

    // Evaluate Information Requirement & Provenance
    const infoRequirement = ResearchDecisionService.evaluateInformationRequirement(userText, history);

    // Helper to test if a persona is enabled
    const isEnabled = (id) => {
      if (options.personaManager && typeof options.personaManager.isPersonaEnabled === "function") {
        return options.personaManager.isPersonaEnabled(id);
      }
      if (Array.isArray(options.enabledPersonas)) {
        return options.enabledPersonas.some(p => (typeof p === "string" ? p : p.id) === id);
      }
      return true;
    };

    const selectedPersonaId = options.selectedPersonaId || (options.personaManager ? options.personaManager.getSelectedPersonaId() : "auto");
    const manualMode = options.perspectiveMode || selectedPersonaId;

    // 0. Universal Platform Content Safety Boundary
    const safetyCheck = ContentSafetyBoundary.evaluateContent(userText);
    if (safetyCheck.isBlocked) {
      const targetPersona = (selectedPersonaId !== "auto" && selectedPersonaId) ? selectedPersonaId : "lanzar";
      return {
        owner: targetPersona,
        taskType: "safety_refusal",
        isSafetyBlocked: true,
        violationType: safetyCheck.violationType,
        provenance: "UNCERTAIN",
        requiresResearch: false,
        reason: safetyCheck.reason,
        refusal: ContentSafetyBoundary.generateRefusal(targetPersona, userText)
      };
    }

    // 1. Dynamic Registry Address / Mention Detection
    const defaultMinds = {
      penny: new PennyPersona(),
      pete: new PetePersona(),
      mina: new MinaPersona()
    };

    let allPersonas = [];
    if (options.personaManager && typeof options.personaManager.getAllPersonas === "function") {
      allPersonas = options.personaManager.getAllPersonas();
    } else if (Array.isArray(options.enabledPersonas) && options.enabledPersonas.length > 0 && typeof options.enabledPersonas[0] === "object") {
      allPersonas = options.enabledPersonas;
    } else {
      // Fallback default triad if manager not provided
      allPersonas = [
        defaultMinds.penny,
        defaultMinds.pete,
        defaultMinds.mina
      ];
    }

    // 2. Check if ALL specialized personas are disabled
    const anySpecializedEnabled = allPersonas.some(p => isEnabled(p.id));
    if (!anySpecializedEnabled) {
      return {
        owner: "lanzar",
        taskType: "all_disabled_fallback",
        reason: "All specialized personalities are currently disabled; resolved by LANZAR Core fallback"
      };
    }

    // 3. Find Last Responding Assistant Persona in History (for handoff detection)
    let previousAssistantPersona = null;
    const pastAssistantMsgs = history.filter(m => m.role === "assistant" && m.persona && m.persona !== "lanzar" && m.persona !== "dual" && m.persona !== "triad");
    if (pastAssistantMsgs.length > 0) {
      previousAssistantPersona = pastAssistantMsgs[pastAssistantMsgs.length - 1].persona;
    }

    // 4. Targeted Team / Multi-Mind Addressing (e.g. "team,", "hey team", "hi guys", "hey guys", "folks", "all of you", "everyone:")
    const isAddressingTeam = /^\s*(hey\s+|hi\s+|hello\s+)?(team|guys|folks|crew|everyone|everybody|gang|all minds|all three|both of you)\b/i.test(query) ||
      /\b(to the team|addressing the team|for the team|to all of you|to everyone|how are we all doing|how are you all|how is the team|how are we doing|hi guys|hey guys|hello guys)\b/i.test(query);
    if (isAddressingTeam) {
      const enabledCount = allPersonas.filter(p => isEnabled(p.id)).length;
      if (enabledCount >= 3) {
        return {
          owner: "triad",
          taskType: "team_addressed",
          setFocus: "auto",
          reason: "User addressed the entire team; synthesizing response across Penny, Pete, and Mina"
        };
      } else if (enabledCount === 2) {
        return {
          owner: "dual",
          taskType: "team_addressed",
          setFocus: "auto",
          reason: "User addressed the team with 2 minds active"
        };
      } else if (enabledCount === 1) {
        const singleActive = allPersonas.find(p => isEnabled(p.id));
        return {
          owner: singleActive.id,
          taskType: "addressed_persona",
          setFocus: singleActive.id,
          reason: `User addressed team with only ${singleActive.shortName || singleActive.name} active`
        };
      }
    }

    // 5. Generalized Domain Affinity & Autonomous Bidding Scoring
    const personaScores = this.evaluatePersonaBids(query, allPersonas, isEnabled);

    // 6. Direct Persona Address Check (e.g. "Mina, what do you think?", "Penny and Pete, should we...", "Pete, explain this")
    const allMatches = allPersonas.filter(rawP => {
      const p = (typeof rawP.matchesAddress === "function")
        ? rawP
        : ((defaultMinds && defaultMinds[rawP.id]) || rawP);

      if (typeof p.matchesAddress === "function") {
        return p.matchesAddress(query);
      }
      const aliases = p.addressAliases || [p.id, (p.shortName || p.name || "").toLowerCase()];
      return aliases.some(alias => {
        if (!alias) return false;
        // Check for ASCII boundary or Unicode/CJK character boundaries
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(alias)
          ? new RegExp(escaped, "i")
          : new RegExp(`\\b${escaped}\\b`, "i");
        return regex.test(query);
      });
    });

    let addressedPersonas = allMatches;
    // If multiple personas were found, check if it was just mentioning others in a question to one leader (e.g. "Penny, what do you think of Pete?")
    if (allMatches.length > 1) {
      const leadingMatches = allPersonas.filter(p => {
        const aliases = p.addressAliases || [p.id, (p.shortName || p.name || '').toLowerCase()];
        return aliases.some(alias => new RegExp(`^\\s*${alias}\\b`, 'i').test(query));
      });
      // If "Penny and Pete, ..." or "Pete & Penny, ...", keep all addressed
      const isMultiLeading = /^\s*(?:penny\s+(?:and|&)\s+pete|pete\s+(?:and|&)\s+penny|mina\s+(?:and|&)\s+pete|pete\s+(?:and|&)\s+mina)\b/i.test(query);
      if (!isMultiLeading && leadingMatches.length === 1) {
        addressedPersonas = leadingMatches;
      }
    }

    if (addressedPersonas.length === 1) {
      const target = addressedPersonas[0];
      if (isEnabled(target.id)) {
        // Natural In-Character Deference:
        // If user directly asks Mina a pure calculus/physics calculation, Mina defers to Pete
        if (target.id === "mina" && (CognitiveRouter._isMathOrEquation(query) || CognitiveRouter._isCalculusOrTheory(query) || CognitiveRouter._isPurePhysicsOrAerospace(query))) {
          if (isEnabled("pete")) {
            return {
              owner: "mina_to_pete_deference",
              taskType: "character_deference",
              setFocus: "pete",
              reason: "Mina playfully defers deep math/physics calculation to Pete"
            };
          }
        }
        // If user directly asks Pete pure pop-culture art/collectibles, Pete defers to Mina
        if (target.id === "pete" && CognitiveRouter._isPokemonOrCollectibles(query)) {
          if (isEnabled("mina")) {
            return {
              owner: "pete_to_mina_deference",
              taskType: "character_deference",
              setFocus: "mina",
              reason: "Pete methodically defers Pokémon collectibles to Mina"
            };
          }
        }

        return {
          owner: target.id,
          taskType: "addressed_persona",
          previousOwner: previousAssistantPersona,
          targetOwner: target.id,
          setFocus: target.id,
          reason: `User explicitly addressed ${target.shortName || target.name}`
        };
      } else {
        const disabledTaskType = target.id === "penny" ? "brainstorming_disabled" : (target.id === "pete" ? "technical_disabled" : (target.id === "mina" ? "art_direction_disabled" : `${target.id}_disabled`));
        return {
          owner: "lanzar",
          taskType: disabledTaskType,
          disabledPersona: target.id,
          reason: `${target.shortName || target.name} was addressed, but is currently disabled in Active Minds`
        };
      }
    } else if (addressedPersonas.length > 1) {
      const enabledAddressed = addressedPersonas.filter(p => isEnabled(p.id));
      if (enabledAddressed.length >= 2) {
        return {
          owner: "dual",
          taskType: "addressed_multiple",
          setFocus: "auto",
          reason: `User addressed multiple active minds (${enabledAddressed.map(p => p.shortName || p.name).join(", ")})`
        };
      }
    }

    // 7. Direct Perspective Manual Lock (Only when explicit perspectiveMode is set)
    if (options.perspectiveMode === "direct") {
      return { owner: "lanzar", taskType: "manual_override", reason: "User locked perspective to Direct LANZAR Core" };
    }
    if (options.perspectiveMode && options.perspectiveMode !== "auto") {
      if (isEnabled(options.perspectiveMode)) {
        return {
          owner: options.perspectiveMode,
          taskType: "manual_override",
          reason: `User locked perspective to ${options.perspectiveMode}`
        };
      }
    }

    if (selectedPersonaId && selectedPersonaId !== "auto" && !isEnabled(selectedPersonaId)) {
      return {
        owner: "lanzar",
        taskType: "selected_persona_disabled",
        disabledPersona: selectedPersonaId,
        reason: `Conversational focus is on ${selectedPersonaId}, but that persona is disabled`
      };
    }

    // 8. Temporal Re-entry Context Evaluation (Behavioral Guideline)
    const reEntryAssessment = this.evaluateTemporalReentry(query, history, options);
    if (reEntryAssessment.shouldRecap) {
      return {
        owner: "lanzar",
        taskType: "temporal_reentry_recap",
        reason: `Temporal re-entry: ${reEntryAssessment.reason}`,
        temporalContext: reEntryAssessment
      };
    }

    // 9. Generic Greetings / Salutations -> Route to Active Character or Team
    if (this._isGreeting(query)) {
      if (previousAssistantPersona && isEnabled(previousAssistantPersona)) {
        return {
          owner: previousAssistantPersona,
          taskType: "addressed_persona",
          setFocus: previousAssistantPersona,
          reason: `Continuing conversation with ${previousAssistantPersona}`
        };
      }
      
      const enabledList = allPersonas.filter(p => isEnabled(p.id));
      if (enabledList.length >= 3) {
        return {
          owner: "triad",
          taskType: "team_addressed",
          setFocus: "auto",
          reason: "Generic greeting greeted collaboratively by active Triad"
        };
      } else if (enabledList.length === 2) {
        return {
          owner: "dual",
          taskType: "team_addressed",
          setFocus: "auto",
          reason: "Generic greeting greeted collaboratively by Dual Mind"
        };
      } else if (enabledList.length === 1) {
        return {
          owner: enabledList[0].id,
          taskType: "addressed_persona",
          setFocus: enabledList[0].id,
          reason: `Generic greeting answered by single active mind ${enabledList[0].shortName || enabledList[0].name}`
        };
      }

      return {
        owner: "lanzar",
        taskType: "all_disabled_fallback",
        reason: "All specialized personalities are currently disabled; resolved by LANZAR Core fallback"
      };
    }

    // 7. Conversational Context & Task Continuation (e.g. "build it", "make it", "let's do it", "go ahead")
    const isExecutionFollowUp = /^\s*(build it|make it|do it|let's do it|lets do it|go for it|ship it|execute|create it|implement it|proceed)\b/i.test(query);
    if (isExecutionFollowUp && history.length > 0) {
      // Find the last substantive topic or plan in history
      const recentHistory = [...history].reverse();
      const lastSubstantiveMsg = recentHistory.find(m => m.content && m.content.length > 20);
      const priorText = (lastSubstantiveMsg ? lastSubstantiveMsg.content : "").toLowerCase();
      
      const isWebsiteContext = priorText.includes("website") || priorText.includes("landing page") || priorText.includes("design system");
      const isRocketContext = priorText.includes("rocket") || priorText.includes("engine") || priorText.includes("cooling") || priorText.includes("propulsion");
      
      if (isWebsiteContext) {
        if (isEnabled("penny") && isEnabled("pete") && isEnabled("mina")) {
          return {
            owner: "triad",
            taskType: "fullstack_website_build",
            setFocus: "auto",
            reason: "Execution follow-up ('Build it') on active website plan routed across Triad"
          };
        }
      }
      if (isRocketContext) {
        if (isEnabled("penny") && isEnabled("pete")) {
          return {
            owner: "dual",
            taskType: "prototype_execution",
            setFocus: "penny",
            reason: "Execution follow-up on rocket engineering plan routed to Penny & Pete"
          };
        }
      }
    }

    // 8. Unknown / Ambiguous Concept Check (e.g. "what do you know of the chairman???")
    // If user asks about an unknown entity not in history/project/memory, ask clarification rather than picking a random specialist template
    const isUnknownEntityQuestion = /what (do you know of|is|about) (the )?([a-zA-Z0-9_\-\s]+)\??/i.test(query);
    if (isUnknownEntityQuestion && !personaScores.some(b => b.score > 0) && !this._isGreeting(query) && !this._isFactualOrTechnical(query)) {
      const match = query.match(/what (do you know of|is|about) (the )?([a-zA-Z0-9_\-\s]+)\??/i);
      const entity = match && match[3] ? match[3].trim() : "";
      if (entity && !["rocket", "engine", "ai", "lanzar", "math", "calculus", "design"].includes(entity)) {
        // Return clarification request from active character / team
        const activeLeader = previousAssistantPersona && isEnabled(previousAssistantPersona) 
          ? previousAssistantPersona 
          : (isEnabled("pete") ? "pete" : (isEnabled("penny") ? "penny" : "mina"));
        return {
          owner: activeLeader,
          taskType: "unknown_concept_clarification",
          unknownEntity: entity,
          reason: `Concept '${entity}' is not recognized in active context; asking user for clarification`
        };
      }
    }

    // 8b. High-Impact Architectural Tradeoff Collaboration (Penny + Pete)
    const isExplicitDualCandidate = this._isHighImpactTradeoff(query) && (query.includes("penny and pete") || query.includes("pete and penny") || query.includes("should we rewrite") || (query.includes("rewrite") && query.includes("prototype")));
    if (isExplicitDualCandidate && isEnabled("penny") && isEnabled("pete")) {
      return {
        owner: "dual",
        taskType: "architecture_tradeoff",
        setFocus: "auto",
        reason: "Dual-domain engineering and scientific analysis synthesized between Penny and Pete"
      };
    }

    // 9. Multi-Mind Triad Collaboration & Dual-Domain Analysis
    const isPurePokemon = this._isPokemonOrCollectibles(query);
    const hasMathOrScience = this._isMathOrEquation(query) || this._isCalculusOrTheory(query) || this._isPurePhysicsOrAerospace(query) || query.includes("technically sound") || query.includes("works well") || query.includes("head loss") || query.includes("internal resistance") || query.includes("lift-to-drag");
    const hasVisuals = (this._isVisualOrArtDirection(query) || this._isPureArtOrPokemon(query) || query.includes("looks great") || query.includes("beautiful") || query.includes("hud layout") || query.includes("atomic age") || query.includes("retro") || query.includes("styling") || query.includes("illustration") || query.includes("front panel")) && !isPurePokemon;
    const hasPrototyping = this._isDivergentCreative(query) || query.includes("rapid prototype") || query.includes("finished quickly") || (query.includes("fast") && query.includes("build")) || query.includes("build a website") || query.includes("calculate aerodynamic") || query.includes("chassis") || (query.includes("dashboard") && query.includes("charts live cell")) || query.includes("3d print") || query.includes("3d print winglets") || query.includes("machine them");
    const isExplicit3DomainConvergence = hasMathOrScience && hasVisuals && hasPrototyping;
    const hasClearSingleSpecialistDominance = !isExplicit3DomainConvergence && personaScores.length > 0 && personaScores[0].score >= 12.0 && (!personaScores[1] || personaScores[0].score >= personaScores[1].score * 1.5);
    const isMultiDomain3 = isExplicit3DomainConvergence || (!hasClearSingleSpecialistDominance && personaScores.filter(p => p.score >= 8.0).length >= 3);

    // 9a. Dual-Domain Collaboration (Engineering + Science OR Science + Art OR Engineering + Art)
    // Science + Art (Pete + Mina) -> e.g. "Make this technically sound and beautiful"
    if (hasMathOrScience && hasVisuals && !hasPrototyping && isEnabled("pete") && isEnabled("mina") && (query.includes("technically sound") || query.includes("beautiful and accurate") || (query.includes("thermal") && query.includes("color ramp")))) {
      return {
        owner: "mina_pete",
        taskType: "science_art_collaboration",
        setFocus: "auto",
        reason: "Dual-domain request requiring technical precision (Pete) and visual aesthetics (Mina)"
      };
    }

    // Engineering + Art (Penny + Mina) -> e.g. "Prototype a visually stunning UI"
    if ((hasPrototyping || query.includes("prototype")) && hasVisuals && !hasMathOrScience && isEnabled("penny") && isEnabled("mina") && (query.includes("visually stunning") || query.includes("prototype a ui") || query.includes("prototype a visually") || (query.includes("prototype") && query.includes("settings screen")))) {
      return {
        owner: "mina_penny",
        taskType: "engineering_art_collaboration",
        setFocus: "auto",
        reason: "Dual-domain request requiring fast prototyping (Penny) and aesthetic design (Mina)"
      };
    }

    const isPureVisualDesign = this._isVisualOrArtDirection(query) && !query.includes("calculate") && !query.includes("derive") && !query.includes("lift-to-drag") && !query.includes("winglet") && !query.includes("build a website") && !query.includes("build me a website") && !query.includes("prototype sprint");
    const isFoodOrPersonalTeamQuestion = query.includes("favorite food") || query.includes("like to eat") || query.includes("favorite thing") || query.includes("what do you all");

    if (!isPurePokemon && !isPureVisualDesign && !hasClearSingleSpecialistDominance && (this._isTriadSynthesisCandidate(query) || this._isFullStackWebsiteBuild(query) || isMultiDomain3 || isFoodOrPersonalTeamQuestion)) {
      const enabledList = allPersonas.filter(p => isEnabled(p.id));
      if (enabledList.length >= 3) {
        return {
          owner: "triad",
          taskType: "triad_synthesis",
          setFocus: "auto",
          reason: "Multi-domain project synthesized collaboratively across all three minds (Penny, Pete, Mina)"
        };
      } else if (enabledList.length === 2) {
        return {
          owner: "dual",
          taskType: "triad_synthesis",
          setFocus: "auto",
          reason: "Multi-domain request synthesized across 2 active minds"
        };
      }
    }

    // 10. Autonomous Bid Winner Resolution (Dynamic Capability Evaluation)
    const requestAnalysis = this.analyzeRequest(query, history);
    const positiveBids = personaScores.filter(b => b.score > 0);
    const topBid = positiveBids.length > 0 ? positiveBids[0] : null;
    const secondaryBids = positiveBids.slice(1);

    // Calculate dynamic confidence score
    let confidence = 0.5;
    if (topBid) {
      const runnerUpScore = secondaryBids.length > 0 ? secondaryBids[0].score : 0;
      const scoreLead = topBid.score - runnerUpScore;
      confidence = Math.min(1.0, Math.max(0.4, (topBid.score >= 4.0 ? 0.8 : 0.6) + (scoreLead >= 2.0 ? 0.15 : 0.05)));
    }

    if (topBid && topBid.score >= 3.0) {
      const primaryCandidate = topBid.id;
      const secondaryCandidates = secondaryBids.map(b => b.id);
      const collaborationPotential = secondaryBids.length > 0 && (secondaryBids[0].score >= 4.0 || secondaryBids[0].score >= topBid.score * 0.35);

      if (topBid.isEnabled) {
        return {
          owner: topBid.id,
          selectedMind: topBid.id,
          confidence: Math.round(confidence * 100) / 100,
          taskType: topBid.taskType || requestAnalysis.taskType || "autonomous_bid_winner",
          setFocus: "auto",
          requiredCapabilities: requestAnalysis.requiredCapabilities,
          toolsRequired: requestAnalysis.toolsRequired,
          candidates: personaScores.map(b => ({ id: b.id, name: b.name, score: b.score, reasons: b.reasons })),
          primaryCandidate,
          secondaryCandidates,
          collaborationPotential,
          reason: `${topBid.name} won autonomous bid with score ${topBid.score} (${topBid.reasons.join(", ")})`
        };
      } else {
        const disabledTaskType = topBid.id === "mina" ? "art_direction_disabled" : (topBid.id === "pete" ? "technical_disabled" : "brainstorming_disabled");
        return {
          owner: "lanzar",
          selectedMind: "lanzar",
          confidence: Math.round(confidence * 100) / 100,
          taskType: disabledTaskType,
          disabledPersona: topBid.id,
          requiredCapabilities: requestAnalysis.requiredCapabilities,
          toolsRequired: requestAnalysis.toolsRequired,
          candidates: personaScores.map(b => ({ id: b.id, name: b.name, score: b.score, reasons: b.reasons })),
          primaryCandidate,
          secondaryCandidates,
          collaborationPotential,
          reason: `${topBid.name} was best suited for this task, but is currently toggled OFF in Active Minds`
        };
      }
    }

    // Lower confidence single bidder
    if (topBid && topBid.score > 0) {
      if (topBid.isEnabled) {
        return {
          owner: topBid.id,
          selectedMind: topBid.id,
          confidence: Math.round(confidence * 100) / 100,
          taskType: topBid.taskType || requestAnalysis.taskType || "autonomous_bid_winner",
          setFocus: "auto",
          requiredCapabilities: requestAnalysis.requiredCapabilities,
          toolsRequired: requestAnalysis.toolsRequired,
          candidates: personaScores.map(b => ({ id: b.id, name: b.name, score: b.score, reasons: b.reasons })),
          primaryCandidate: topBid.id,
          secondaryCandidates: secondaryBids.map(b => b.id),
          collaborationPotential: secondaryBids.length > 0,
          reason: `${topBid.name} won autonomous bid with score ${topBid.score} (${topBid.reasons.join(", ")})`
        };
      }
    }

    // 12. Conversational Focus / Continuity / Default Active Mind
    if (selectedPersonaId && selectedPersonaId !== "auto" && isEnabled(selectedPersonaId)) {
      return {
        owner: selectedPersonaId,
        selectedMind: selectedPersonaId,
        confidence: 0.9,
        taskType: "general_inquiry",
        setFocus: selectedPersonaId,
        requiredCapabilities: requestAnalysis.requiredCapabilities,
        toolsRequired: requestAnalysis.toolsRequired,
        candidates: personaScores.map(b => ({ id: b.id, name: b.name, score: b.score, reasons: b.reasons })),
        primaryCandidate: selectedPersonaId,
        secondaryCandidates: [],
        collaborationPotential: false,
        reason: `General conversational inquiry routed to focused mind ${selectedPersonaId}`
      };
    }

    if (previousAssistantPersona && isEnabled(previousAssistantPersona)) {
      return {
        owner: previousAssistantPersona,
        selectedMind: previousAssistantPersona,
        confidence: 0.8,
        taskType: "general_inquiry",
        setFocus: previousAssistantPersona,
        requiredCapabilities: requestAnalysis.requiredCapabilities,
        toolsRequired: requestAnalysis.toolsRequired,
        candidates: personaScores.map(b => ({ id: b.id, name: b.name, score: b.score, reasons: b.reasons })),
        primaryCandidate: previousAssistantPersona,
        secondaryCandidates: [],
        collaborationPotential: false,
        reason: `Conversational continuation with active character ${previousAssistantPersona}`
      };
    }

    const firstActive = allPersonas.find(p => isEnabled(p.id));
    if (firstActive) {
      return {
        owner: firstActive.id,
        selectedMind: firstActive.id,
        confidence: 0.6,
        taskType: "general_inquiry",
        setFocus: firstActive.id,
        requiredCapabilities: requestAnalysis.requiredCapabilities,
        toolsRequired: requestAnalysis.toolsRequired,
        candidates: personaScores.map(b => ({ id: b.id, name: b.name, score: b.score, reasons: b.reasons })),
        primaryCandidate: firstActive.id,
        secondaryCandidates: [],
        collaborationPotential: false,
        reason: `General conversational inquiry routed to active mind ${firstActive.shortName || firstActive.name}`
      };
    }

    return {
      owner: "lanzar",
      selectedMind: "lanzar",
      confidence: 1.0,
      taskType: "all_disabled_fallback",
      requiredCapabilities: [],
      toolsRequired: requestAnalysis.toolsRequired,
      candidates: [],
      primaryCandidate: "lanzar",
      secondaryCandidates: [],
      collaborationPotential: false,
      reason: "All specialized personalities are disabled"
    };
  }

  // =====================================
  // Autonomous Persona Bidding Evaluator
  // =====================================

  /**
   * Semantically analyzes an incoming user request to identify required capabilities,
   * domains, task types, tool requirements, and reasoning depth without hardcoding personas.
   *
   * @param {string} rawQuery
   * @param {Array} history
   * @returns {Object} { taskType, requiredCapabilities, domains, isCurrent, isCalculation, reasoningDepth, toolsRequired }
   */
  static analyzeRequest(rawQuery = "", history = []) {
    const text = (rawQuery || "").toLowerCase().trim();
    const requiredCapabilities = [];
    const domains = [];
    let reasoningDepth = "medium";
    let taskType = "general_inquiry";

    const toolsRequired = {
      webResearch: false,
      deterministicMath: false,
      deterministicPhysics: false,
      deterministicStats: false
    };

    // 1. Engineering / Hardware / Prototyping Domain & Capabilities
    const isPureStats = this._isPureStatisticalTheory(text);
    if (!isPureStats && (this._isEngineeringDecisionOrTradeoff(text) || /\b(replace|repair|upgrade|swap|solder|wire|circuit|gpio|pinout|pcb|motor|driver|batter(y|ies)|kart|drone|ssd|laptop|hardware|rig|bench|firmware|cad|dimension|tolerance|actuator|machine|aluminum|carbon fiber|winglets?|3d print)\b/i.test(text))) {
      domains.push("engineering", "hardware", "troubleshooting");
      requiredCapabilities.push("engineering", "hardware_specs", "troubleshooting", "tradeoff_analysis");
      taskType = "engineering_decision";
    }
    if (this._isExperimentalDesign(text) || /\b(prototype|bench test|load cell|rapid prototype|test rig|build a working|breadboard)\b/i.test(text)) {
      domains.push("rapid_prototyping", "experimental_design", "bench_testing", "engineering");
      requiredCapabilities.push("rapid_prototyping", "experimental_design", "bench_testing", "engineering");
      taskType = "experimental_design";
    }
    if (this._isAppliedProbabilityOrRisk(text)) {
      domains.push("applied_probability", "engineering");
      requiredCapabilities.push("applied_probability", "engineering", "tradeoff_analysis");
      taskType = "engineering_decision";
    }
    if (this._isOptimizationOrDiscrete(text)) {
      domains.push("optimization", "engineering");
      requiredCapabilities.push("optimization", "engineering");
      taskType = "optimization";
    }
    if (this._isDivergentCreative(text) || /\b(wild idea|crazy idea|unconventional|brainstorm ideas|different way to build)\b/i.test(text)) {
      domains.push("prototyping", "brainstorming");
      requiredCapabilities.push("divergent_ideas", "brainstorming");
    }

    // 2. Science / Physics / Math / Deep Architecture Domain & Capabilities
    if (this._isMathOrEquation(text) || /\b(solve for|equation|derivative|integral|matrix|arithmetic|calculate|algebra|derive)\b/i.test(text)) {
      if (!/\b(laptop|pcb|hardware)\b/i.test(text)) {
        domains.push("mathematics", "linear_equations");
        requiredCapabilities.push("mathematics");
        toolsRequired.deterministicMath = true;
        taskType = "math";
      }
    }
    if (this._isCalculusOrTheory(text) || /\b(calculus|theoretical|governing equations|prove|derivation|why does the formula work)\b/i.test(text)) {
      if (!/\b(laptop|hardware)\b/i.test(text)) {
        domains.push("calculus", "formal_derivation", "science");
        requiredCapabilities.push("calculus", "scientific_analysis", "formal_derivation");
        reasoningDepth = "high";
        taskType = "theory_math";
      }
    }
    if (/\b(defensible|three possible solutions|analytical evaluation|tradeoff framework|defensibility)\b/i.test(text)) {
      domains.push("systems_architecture", "science");
      requiredCapabilities.push("scientific_analysis", "formal_derivation");
      reasoningDepth = "high";
      taskType = "architecture_tradeoff";
    }
    if (this._isPurePhysicsOrAerospace(text) || /\b(orbital velocity|altitude|gravity|thermodynamics|thrust|specific impulse|bernoulli|kinetic energy|free fall|physics|lift-to-drag|aerodynamics|faster than light|speed of light)\b/i.test(text)) {
      domains.push("physics", "orbital_mechanics", "thermodynamics", "science");
      requiredCapabilities.push("physics", "scientific_analysis");
      toolsRequired.deterministicPhysics = true;
      taskType = "technical_explanation";
      reasoningDepth = "high";
    }
    if (this._isStatisticsOrProbability(text) || /\b(probability|expected value|bayes|simpson|distribution|standard deviation|statistical)\b/i.test(text)) {
      domains.push("statistics", "probability");
      requiredCapabilities.push("statistics", "scientific_analysis");
      toolsRequired.deterministicStats = true;
      taskType = "statistics";
    }
    if (this._isDebuggingOrCrash(text) || /\b(stack trace|segfault|crash log|traceback|panic|null pointer|memory leak)\b/i.test(text)) {
      domains.push("systems_architecture", "failure_diagnostics");
      requiredCapabilities.push("failure_diagnostics", "code_review");
      taskType = "debugging";
      reasoningDepth = "high";
    }
    if (/\b(scientific paper|paper on|journal|empirical data|cite\b|peer-reviewed|literature|quantum|tachyon|orbital debris|latest research|astrophysics)\b/i.test(text)) {
      domains.push("scientific_literature", "science", "physics");
      requiredCapabilities.push("scientific_literature", "scientific_analysis", "physics");
      toolsRequired.webResearch = true;
      taskType = "technical_explanation";
      reasoningDepth = "high";
    }

    // 3. Art / Visual / UI-UX / Pop Culture / Pokémon Domain & Capabilities
    if (this._isPokemonOrCollectibles(text) || /\b(pokemon|pokémon|pikachu|charizard|card rare|illustration rare|tcg|pokedex|game freak)\b/i.test(text)) {
      domains.push("pokemon", "pokemon_lore", "pop_culture");
      requiredCapabilities.push("pokemon_and_collectibles", "pop_culture_art");
      taskType = "pokemon_lore";
    }
    if (/\b(pokemon go|raid boss|community day|pokestop|niantic)\b/i.test(text)) {
      domains.push("pokemon_go", "pokemon");
      requiredCapabilities.push("pokemon_go", "pokemon_and_collectibles");
      toolsRequired.webResearch = true;
      taskType = "pokemon_lore";
    }
    if (this._isVisualOrArtDirection(text) || /\b(color palette|palette|typography|typeface|font|layout|branding|logo|visual design|aesthetic|cel shading|illustration|ui\/ux|styling|graphic design)\b/i.test(text)) {
      domains.push("art", "design", "visual_design", "color_palette", "typography", "ui_ux_aesthetics", "branding");
      requiredCapabilities.push("art_direction", "visual_design", "palette_composition", "typography");
      taskType = "art_direction";
    }
    if (/\b(presentation concept|pitch deck visual|slide deck layout|infographic|diagram layout)\b/i.test(text)) {
      domains.push("presentation_design", "infographics", "visual_design");
      requiredCapabilities.push("art_direction", "visual_design");
      taskType = "presentation_concept";
    }
    if (/\b(pop culture|movie|tv show|trend|fashion|viral|entertainment|anime|music trend|video game)\b/i.test(text)) {
      domains.push("pop_culture", "entertainment", "cultural_trends", "video_games");
      requiredCapabilities.push("pop_culture_art", "entertainment", "music_and_trends");
      taskType = "cultural_trends";
    }

    // 4. Current Information / Web Research Evaluation
    const infoRequirement = ResearchDecisionService.evaluateInformationRequirement(text, history);
    if (infoRequirement.requiresResearch) {
      toolsRequired.webResearch = true;
    }

    // 4b. Dynamic Chemistry / Spectroscopy / Molecular Domain Extraction
    if (/\b(chemistry|spectroscopy|molecular|orbital energy|propellant|octahedral|coordination complex|reaction kinetics|stoichiometry)\b/i.test(text)) {
      domains.push("chemistry", "quantum_chemistry", "spectroscopy", "molecular_modeling");
      requiredCapabilities.push("quantum_chemistry", "spectroscopy", "molecular_orbital_theory", "reaction_kinetics");
      taskType = "chemistry_analysis";
    }

    // 5. Dynamic Semantic Vocabulary Token Extraction (Discovers domains & capabilities for any registered character)
    const stopWords = new Set([
      'and', 'the', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'had', 'your', 'about',
      'some', 'were', 'make', 'give', 'tell', 'need', 'into', 'then', 'will', 'does', 'would',
      'could', 'should', 'work', 'what', 'how', 'who', 'why', 'when', 'where', 'which', 'our',
      'two', 'days', 'nothing', 'exists', 'yet', 'something', 'between', 'also', 'over', 'than',
      'just', 'like', 'such', 'very', 'much', 'more', 'most', 'only', 'same', 'them', 'they'
    ]);
    const tokens = (text.toLowerCase().match(/\b[a-z_]{3,}\b/g) || []).filter(t => !stopWords.has(t));
    for (const token of tokens) {
      domains.push(token);
      requiredCapabilities.push(token);
    }

    return {
      taskType,
      requiredCapabilities: [...new Set(requiredCapabilities)],
      domains: [...new Set(domains)],
      reasoningDepth,
      toolsRequired,
      infoRequirement
    };
  }

  /**
   * Evaluates all registered personas against the analyzed query to compute dynamic capability affinity scores.
   * Returns a sorted array of bids: [{ id, name, score, taskType, isEnabled, reasons: [] }]
   */
  static evaluatePersonaBids(query, allPersonas = [], isEnabled = () => true) {
    const analysis = this.analyzeRequest(query);
    const bids = [];

    const defaultMinds = {
      penny: new PennyPersona(),
      pete: new PetePersona(),
      mina: new MinaPersona()
    };

    for (const rawP of allPersonas) {
      const p = (typeof rawP.evaluateBid === "function") 
        ? rawP 
        : (defaultMinds[rawP.id] || rawP);

      const enabled = isEnabled(p.id);
      let bidResult = null;

      // 1. Dynamic Evaluation if Persona exposes evaluateBid
      if (typeof p.evaluateBid === "function") {
        bidResult = p.evaluateBid(analysis);
      } else {
        // Fallback for custom or legacy unregistered objects
        let score = 0;
        const reasons = [];
        const reqCaps = analysis.requiredCapabilities || [];
        const domains = analysis.domains || [];

        for (const cap of reqCaps) {
          if (Array.isArray(p.capabilities) && p.capabilities.includes(cap)) {
            score += 2.0;
            reasons.push(`cap:${cap}`);
          }
        }
        for (const dom of domains) {
          if (Array.isArray(p.domainAffinities) && p.domainAffinities.includes(dom)) {
            score += 2.5;
            reasons.push(`dom:${dom}`);
          }
        }
        bidResult = {
          id: p.id,
          name: p.shortName || p.name || p.id,
          score,
          taskType: analysis.taskType || "general_inquiry",
          reasons
        };
      }

      // Add enabled state
      bidResult.isEnabled = enabled;

      if (bidResult.score > 0) {
        bids.push(bidResult);
      }
    }

    return bids.sort((a, b) => b.score - a.score);
  }

  /**
   * Evaluates all enabled personas against the query to determine the full set of participating minds.
   * Returns: { participants: string[], primary: string, reason: string, confidence: number }
   */
  static evaluatePersonaParticipation(userText, history = [], options = {}) {
    const raw = (userText || "").trim();
    const query = raw.toLowerCase();

    const isEnabled = (id) => {
      if (options.personaManager && typeof options.personaManager.isPersonaEnabled === "function") {
        return options.personaManager.isPersonaEnabled(id);
      }
      if (Array.isArray(options.enabledPersonas)) {
        return options.enabledPersonas.some(p => (typeof p === "string" ? p : p.id) === id);
      }
      return true;
    };

    let allPersonas = [];
    if (options.personaManager && typeof options.personaManager.getAllPersonas === "function") {
      allPersonas = options.personaManager.getAllPersonas();
    } else {
      allPersonas = [
        { id: "penny", shortName: "Penny", matchesAddress: (q) => /\b(penny|penelope|penelope vance)\b/i.test(q) || /(ペニー|페니|佩妮)/.test(q) },
        { id: "pete", shortName: "Pete", matchesAddress: (q) => /\b(pete|peter|peter sterling)\b/i.test(q) || /(ピート|피特)/.test(q) },
        { id: "mina", shortName: "Mina", matchesAddress: (q) => /\b(mina|mina chen)\b/i.test(q) || /(ミナ|미나|米娜)/.test(q) }
      ];
    }

    const enabledList = allPersonas.filter(p => isEnabled(p.id));
    if (enabledList.length === 0) {
      return { participants: ["lanzar"], primary: "lanzar", reason: "All specialized personalities disabled", confidence: 1.0 };
    }

    // 1. Explicit Leading Address Check (e.g. "Penny, is Pete always...", "Pete, what do you think of Mina...")
    let leadingAddressed = null;
    for (const p of allPersonas) {
      const aliases = p.addressAliases || [p.id, (p.shortName || p.name || '').toLowerCase()];
      const isLeading = aliases.some(alias => new RegExp(`^\\s*(hey\\s+|yo\\s+|hi\\s+)?${alias}\\b[,:]?`, 'i').test(query));
      if (isLeading) {
        leadingAddressed = p;
        break;
      }
    }

    // Explicit Combined Address Check (e.g. "Penny and Pete", "Penny, Pete, and Mina")
    const isMultiPersonAddress = /\b(and|&)\b/i.test(query) && allPersonas.filter(p => new RegExp(`\\b(${p.id}|${(p.shortName || p.name).toLowerCase()})\\b`, 'i').test(query)).length > 1;

    if (leadingAddressed && !isMultiPersonAddress) {
      if (isEnabled(leadingAddressed.id)) {
        return {
          participants: [leadingAddressed.id],
          primary: leadingAddressed.id,
          reason: `User explicitly addressed ${leadingAddressed.shortName || leadingAddressed.name}`,
          confidence: 0.98
        };
      }
    }

    const addressedPersonas = allPersonas.filter(p => {
      if (typeof p.matchesAddress === "function") return p.matchesAddress(query);
      const regex = new RegExp(`\\b(${p.id}|${(p.shortName || p.name).toLowerCase()})\\b`, "i");
      return regex.test(query);
    });

    if (addressedPersonas.length === 1) {
      const target = addressedPersonas[0];
      if (isEnabled(target.id)) {
        return {
          participants: [target.id],
          primary: target.id,
          reason: `User explicitly addressed ${target.shortName || target.name}`,
          confidence: 0.98
        };
      }
    } else if (addressedPersonas.length > 1) {
      const enabledAddressed = addressedPersonas.filter(p => isEnabled(p.id));
      if (enabledAddressed.length > 0) {
        return {
          participants: enabledAddressed.map(p => p.id),
          primary: enabledAddressed[0].id,
          reason: `User explicitly addressed multiple minds: ${enabledAddressed.map(p => p.shortName || p.name).join(", ")}`,
          confidence: 0.95
        };
      }
    }

    // 2. Team / Conversational Check-ins & Social Banter
    const isTeamOrCasualSocial = this._isGreeting(query) ||
      /^\s*(hey\s+|hi\s+|hello\s+)?(team|guys|folks|crew|everyone|everybody|gang|all minds|all three|both of you|ustedes)\b/i.test(query) ||
      /\b(to the team|addressing the team|for the team|to all of you|to everyone|how are we all doing|how are you all|how is everyone|how's everyone|hows everyone|how is the team|how are we doing|hi guys|hey guys|hello guys|anything good happening|anything interesting happening|what's going on|whats going on|what's everybody|whats everybody|what's everyone up to|whats everyone up to|what are you all doing|how's your day|how is your day|i'm bored|im bored|funny to say|what's new|whats new|doing anything interesting|don't know what i want to do|dont know what i want to do|crew up to|having a good day)\b/i.test(query) ||
      query.includes("how's everyone") || query.includes("how is everyone") || query.includes("favorite food") || query.includes("like to eat") || query.includes("what do you all") || query.includes("opinan ustedes");

    if (isTeamOrCasualSocial && enabledList.length >= 2) {
      return {
        participants: enabledList.map(p => p.id),
        primary: enabledList[0].id,
        reason: "Casual social check-in or team inquiry engaged across all active minds",
        confidence: 0.9
      };
    }

    // 3. Multi-Domain & Cross-Discipline Synthesis (e.g. Website, Telemetry Dashboard, Educational App)
    const isWebsiteOrPortal = query.includes("website") || query.includes("landing page") || query.includes("web app") || query.includes("portal");
    const isTelemetryDashboard = (query.includes("dashboard") || query.includes("telemetry") || query.includes("hud") || query.includes("interface")) && (query.includes("rocket") || query.includes("flight") || query.includes("science") || query.includes("sensor"));
    const isEducationalApp = (query.includes("app") || query.includes("game") || query.includes("learn") || query.includes("teach") || query.includes("education")) && (query.includes("mechanics") || query.includes("physics") || query.includes("science") || query.includes("thermodynamics") || query.includes("engineering"));
    
    if (isWebsiteOrPortal || isTelemetryDashboard || isEducationalApp) {
      return {
        participants: enabledList.map(p => p.id),
        primary: enabledList[0].id,
        reason: "Multi-domain engineering, architecture, and design synthesized across active minds",
        confidence: 0.92
      };
    }

    // 4. Dynamic Multi-Mind Participation from Autonomous Bids
    const bids = this.evaluatePersonaBids(query, allPersonas, isEnabled);
    const positiveBids = bids.filter(b => b.score > 0 && b.isEnabled);

    // If 3 or more personas have strong positive bids (including dynamic custom brains), engage them all
    const strongBidders = positiveBids.filter(b => b.score >= 3.0);
    if (strongBidders.length >= 3) {
      return {
        participants: strongBidders.map(b => b.id),
        primary: strongBidders[0].id,
        reason: `Multi-disciplinary synthesis across ${strongBidders.length} active specialists (${strongBidders.map(b => `${b.name}: ${b.score}`).join(", ")})`,
        confidence: 0.92
      };
    }

    // Multi-domain project (e.g. Website, App, Multi-Domain Collaboration)
    const isPurePokemon = this._isPokemonOrCollectibles(query);
    const hasMathOrScience = this._isMathOrEquation(query) || this._isCalculusOrTheory(query) || this._isPurePhysicsOrAerospace(query) || query.includes("works well") || query.includes("technically sound") || query.includes("technically accurate") || query.includes("thermal") || query.includes("fluid") || query.includes("loss through") || query.includes("calculate");
    const hasVisuals = (this._isVisualOrArtDirection(query) || this._isPureArtOrPokemon(query) || query.includes("looks great") || query.includes("beautiful") || query.includes("retro") || query.includes("aesthetic") || query.includes("diagram") || query.includes("acrylic") || query.includes("panel")) && !isPurePokemon;
    const hasPrototyping = this._isDivergentCreative(query) || query.includes("prototype") || query.includes("finished quickly") || query.includes("fast") || query.includes("build") || query.includes("website") || query.includes("chassis") || query.includes("laser-cut") || query.includes("distro");
    
    if (!isPurePokemon && ((hasMathOrScience && hasVisuals && hasPrototyping) || (query.includes("idea for a website") || query.includes("make a website") || query.includes("build a website")))) {
      return {
        participants: enabledList.map(p => p.id),
        primary: enabledList[0].id,
        reason: "Multi-domain engineering, architecture, and design synthesized across active minds",
        confidence: 0.92
      };
    }

    // 2-domain combinations
    if (hasMathOrScience && hasVisuals && isEnabled("pete") && isEnabled("mina")) {
      return { participants: ["mina", "pete"], primary: "mina", reason: "Dual-domain science and aesthetics", confidence: 0.88 };
    }
    if (hasPrototyping && hasVisuals && isEnabled("penny") && isEnabled("mina")) {
      return { participants: ["penny", "mina"], primary: "penny", reason: "Dual-domain rapid prototype and visual styling", confidence: 0.88 };
    }
    if ((this._isHighImpactTradeoff(query) || (hasPrototyping && hasMathOrScience)) && isEnabled("penny") && isEnabled("pete")) {
      return { participants: ["penny", "pete"], primary: "penny", reason: "Dual-domain engineering & scientific tradeoff", confidence: 0.88 };
    }

    // Threshold / Relative Scoring
    if (positiveBids.length > 0) {
      const topScore = positiveBids[0].score;
      // Minds that have significant affinity (within 50% of top score) participate
      const relevant = positiveBids.filter(b => b.score >= topScore * 0.6);
      return {
        participants: relevant.map(b => b.id),
        primary: positiveBids[0].id,
        reason: `${positiveBids[0].name} lead participant (${positiveBids.map(b => `${b.name}: ${b.score}`).join(", ")})`,
        confidence: 0.85
      };
    }

    // Default to first active or conversational focus
    const defaultMind = enabledList[0].id;
    return {
      participants: [defaultMind],
      primary: defaultMind,
      reason: `Conversational inquiry routed to ${defaultMind}`,
      confidence: 0.7
    };
  }

  // =====================================
  // Intent Classification Helpers
  // =====================================

  static _isGreeting(query) {
    // If the query has substantive technical/engineering/creative requests, it is not a pure greeting
    if (query.includes("design") || query.includes("prototype") || query.includes("calculate") || query.includes("system") || query.includes("equation") || query.includes("build") || query.includes("solve") || query.includes("palette") || query.includes("choose") || query.includes("explain") || query.includes("analyze")) {
      return false;
    }
    const fullGreetings = [
      "how are you", "how's it going", "hows it going", "hows ya", "hows yall", "how's yall",
      "how are we", "how is everyone", "how was your day", "how is your day", "good morning",
      "good afternoon", "good evening", "who are you", "what are you", "whats up", "what's up", "whatsup"
    ];
    if (fullGreetings.some(g => query.includes(g))) return true;

    // Single standalone greetings or salutations
    const clean = query.trim();
    if (/^(hi|hello|hey|greetings|howdy|yo|sup|whatsup|whats up|what's up)[!.,?]?$/i.test(clean)) {
      return true;
    }
    return false;
  }

  static _isVisualOrArtDirection(query) {
    if (this._isStatisticsOrProbability(query) || this._isMathOrEquation(query)) {
      return false;
    }
    const visualKeywords = [
      "picture", "make me a picture", "make a picture", "generate a picture",
      "image of", "generate an image", "illustration",
      "make this look better", "aesthetic", "aesthetics", "color palette",
      "typography", "font", "fonts", "typeface", "sans-serif", "serif", "infographic", "poster", "layout styling",
      "visual identity", "branding", "retro-futurist style", "retro futurist style",
      "atomic age style", "character design", "graphic design", "decal", "skin", "hud layout",
      "critique this design", "color scheme", "styling", "visual concept", "what accent color", "color creates", "what color"
    ];
    const hasSubstring = visualKeywords.some(p => query.includes(p));
    const hasWord = /\b(ui|ux|art|draw|sketch|render an image|paint|color|typeface|typography|contrast)\b/i.test(query);
    return hasSubstring || hasWord;
  }

  static _isMathOrEquation(query) {
    // Arithmetic expressions e.g. 12 x 17, 12 * 17, 12 + 17, 12 - 17, 12 / 17, 12 × 17, 12(17), 2³ × 4, twelve times seventeen
    const numWordRegex = "(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|\\d+)";
    const verbalOpRegex = new RegExp(`\\b${numWordRegex}\\s*(times|multiplied by|divided by|plus|minus)\\s*${numWordRegex}\\b`, 'i');

    const hasEquation = /[0-9]+[a-z]?\s*[\+\-\*\/=×x\^]\s*[0-9]+/i.test(query) ||
      /[0-9]+[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(query) ||
      verbalOpRegex.test(query) ||
      /\b\d+\s*\(\s*\d+\s*\)/.test(query) ||
      /\(\s*\d+\s*\)\s*\(\s*\d+\s*\)/.test(query);
    const hasSolveMath = query.includes("solve") || query.includes("calculate") || query.includes("equation") || query.includes("integral") || query.includes("derivative") || query.includes("multiplied by");
    return hasEquation || hasSolveMath;
  }

  static _isCalculusOrTheory(query) {
    const mathKeywords = ["calculus", "differential", "integration", "derivative", "trigonometry", "algebra", "matrix", "vector calculus", "navier-stokes", "vorticity transport"];
    return mathKeywords.some(k => query.includes(k));
  }

  static _isDebuggingOrCrash(query) {
    const debugKeywords = [
      "crash", "crashing", "segfault", "segmentation fault", "null pointer",
      "bug", "error", "exception", "core dump", "stack overflow", "memory leak",
      "undefined behavior", "valgrind", "gdb", "why is this failing", "broken"
    ];
    return debugKeywords.some(k => query.includes(k));
  }

  static _isDivergentCreative(query) {
    const creativePatterns = [
      "crazy idea", "crazy ideas", "10 ideas", "ideas for", "brainstorm",
      "wild idea", "invent", "imagine a", "creative name", "story about",
      "unconventional idea", "concept for a", "website ideas"
    ];
    return creativePatterns.some(p => query.includes(p));
  }

  static _isHighImpactTradeoff(query) {
    const tradeoffPatterns = [
      "should we rewrite", "rewrite the", "rewrite this", "rewrite entire",
      "rebuild the", "rebuild this", "will it actually work", "will this actually work",
      "is this feasible", "build or buy", "monolith vs microservices", "tradeoff",
      "trade-off", "competing approach", "pros and cons of rewriting"
    ];
    return tradeoffPatterns.some(p => query.includes(p));
  }

  static _isPokemonOrCollectibles(query) {
    const pokemonKeywords = [
      "pokemon", "pokémon", "pikachu", "charizard", "mew", "eevee", "togepi",
      "holo", "holographic", "card collection", "card binder", "tcg", "booster pack",
      "shiny pokemon", "illustration rare", "pokedex", "pokédex", "trainer", "blastoise", "gengar"
    ];
    return pokemonKeywords.some(k => query.includes(k));
  }

  static _isFullStackWebsiteBuild(query) {
    const websiteKeywords = [
      "corporate website", "build a website", "build me a website", "make a website",
      "landing page", "corporate site", "web app", "build an entire website",
      "full stack site", "homepage and about", "pricing page and landing page"
    ];
    return websiteKeywords.some(k => query.includes(k));
  }

  static _isTriadSynthesisCandidate(query) {
    const triadKeywords = [
      "redesign our", "synthesize", "all minds", "team perspective", "collaborate", "whole team",
      "what do you all think", "what does everyone think", "what does the team think",
      "collaborative design", "from all three of you", "all three minds", "next generation rocket",
      "redesign the engine architecture", "engine architecture for our", "mission architecture"
    ];
    return triadKeywords.some(k => query.includes(k));
  }

  static _isPurePhysicsOrAerospace(query) {
    if (query.includes("prototyping") || query.includes("prototype") || query.includes("test rig") || query.includes("bench test") || query.includes("hardware")) {
      return false;
    }
    const physKeywords = [
      "how does a rocket work", "how do rockets work", "how does a rocket engine work", "rocket engine", "aerospike", "propulsion",
      "thermodynamics", "heat flux", "isp", "specific impulse", "combustion chamber", "carnot", "efficiency limit", "heat engine",
      "throat geometry", "boundary condition", "thermal margin", "mach number", "supersonic", "physics of",
      "velocity", "acceleration", "kinetic energy", "potential energy", "friction", "thrust", "rocket sled",
      "free fall", "dropped from rest", "orbital velocity", "escape velocity", "bernoulli", "momentum", "impulse",
      "newton's", "newtons", "f=ma", "coulomb", "electric field", "resistor", "ohm's", "joules",
      "orbital period", "gravitational parameter", "circular orbit", "orbital mechanics", "celestial mechanics",
      "orbit around", "gravitational force", "kepler", "semi-major axis", "geostationary", "apogee", "perigee"
    ];
    const unitMatch = /\b(\d+(?:\.\d+)?)\s*(kg|m\/s\^?2|m\/s|meters?|newtons?|joules?|pascals?|watts?|km|m\^3\/s\^2|k\b)/i.test(query);
    return physKeywords.some(k => query.includes(k)) || unitMatch;
  }

  static _isStatisticsOrProbability(query) {
    if (query.includes("mitigate") || query.includes("component failure") || query.includes("design fails") || query.includes("expected travel time")) {
      return false;
    }
    const statsKeywords = [
      "simpson", "paradox", "probability", "statistics", "bayes", "prior", "posterior",
      "defect rate", "false positive", "true positive", "subgroup", "confounding",
      "kidney stone", "kidney stones", "treatment a", "treatment b", "weighted average",
      "p(a|b)", "p(b|a)", "conditional probability", "birthday problem", "gibbs", "mcmc", "metropolis-hastings", "sampling"
    ];
    return statsKeywords.some(k => query.toLowerCase().includes(k));
  }

  static _isPureArtOrPokemon(query) {
    return this._isPokemonOrCollectibles(query) || query.includes("color palette") || query.includes("draw") || query.includes("cute") || query.includes("aesthetic");
  }

  static _isEngineeringDecisionOrTradeoff(query) {
    const patterns = [
      "which design is more reliable", "which option gives us the best", "which route",
      "which design should we prototype", "which configuration gives us the best tradeoff",
      "choose between two", "choose between 2", "which one should we choose", "which option should we pick",
      "which route has the lower expected", "tradeoff analysis", "trade-off analysis",
      "design tradeoff", "component selection", "material selection", "structural tradeoff",
      "cost/performance", "weight/performance", "should we optimize for speed or reliability",
      "what additional factor would you consider", "engineering consideration"
    ];
    return patterns.some(p => query.includes(p)) || 
      (/\b(which|choose|compare)\b/i.test(query) && /\b(route|design|prototype|configuration|option|tradeoff|reliability)\b/i.test(query));
  }

  static _isExperimentalDesign(query) {
    const patterns = [
      "how would you test this", "what experiment should we run", "how would you experimentally",
      "how would we test", "how to test", "test experimentally", "experimentally on",
      "design an experiment", "experimentally verify", "experimentally compare", "controlled experiment",
      "hypothesis testing", "prototype iteration", "empirical comparison",
      "test design", "instrumentation", "measurement setup", "failure analysis", "bench test",
      "test bench", "experiment design", "can we test this", "how could we test", "how do we test"
    ];
    return patterns.some(p => query.includes(p)) ||
      (/\b(experiment|test|experimentally|bench test|prototype test|test bench)\b/i.test(query) && /\b(how|design|verify|compare|setup|measure|run|conduct|would we|would you)\b/i.test(query));
  }

  static _isOptimizationOrDiscrete(query) {
    const patterns = [
      "most efficient approach", "parameter optimization", "constrained optimization",
      "shortest path", "resource allocation", "combinatorics", "graph algorithm",
      "state machine", "monte carlo", "parameter sweep", "sensitivity analysis",
      "nonlinear behavior", "chaotic system", "how could we simulate this", "simulate this",
      "what's the most efficient approach", "whats the most efficient approach",
      "optimal configuration", "scheduling algorithm", "boolean logic"
    ];
    return patterns.some(p => query.includes(p));
  }

  static _isAppliedProbabilityOrRisk(query) {
    if (this._isPureStatisticalTheory(query)) {
      return false;
    }
    const patterns = [
      "expected travel time", "expected value", "probability this design fails",
      "failure probability", "risk analysis", "decision under uncertainty",
      "chance of encountering", "expected result", "risk/reward", "expected cost",
      "expected payoff", "variance in travel time", "reliability risk"
    ];
    return patterns.some(p => query.includes(p)) ||
      (/\b(expected|chance|risk|probability|variance)\b/i.test(query) && /\b(travel time|route|obstacle|failure|delay|prototype|design|cost)\b/i.test(query));
  }

  static _isPureStatisticalTheory(query) {
    const pureTheory = [
      "simpson's paradox", "simpsons paradox", "yule-simpson", "bayes theorem", "bayesian theorem",
      "bayes' theorem", "prior probability", "posterior probability", "false positive rate",
      "prove this statistical theorem", "derive bayes", "birthday problem", "kidney stone paradox"
    ];
    return pureTheory.some(k => query.includes(k));
  }

  static _isFactualOrTechnical(query) {
    const techKeywords = ["how does", "why does", "explain", "physics", "thermodynamic", "rocket", "engine", "cooling", "architecture", "mechanism", "definition"];
    return techKeywords.some(k => query.includes(k));
  }

  // =====================================
  // Temporal Re-entry Behavioral Guideline Evaluation
  // =====================================

  /**
   * Evaluates elapsed time, user query, conversation history, and project context
   * to determine whether conversational reorientation / recap is appropriate.
   *
   * Behavioral ranges:
   *  < 30 min: Continuous conversation
   *  30m - 4h: Normal continuation
   *  4h - 12h: Consider whether context needs re-establishing
   *  12h - 24h: Stronger consideration of brief recap
   *  1d - 3d: Offer recap when returning to ongoing work
   *  3d - 7d: Reasonable recap when returning to substantial work
   *  7d+: Strong case for "where we left off" recap
   *  Weeks/Months: Definite reorientation for dormant work
   *
   * IMPORTANT: Time passage alone NEVER forces a recap if the user is giving direct instructions.
   */
  static evaluateTemporalReentry(query, history = [], options = {}) {
    const elapsedMs = options.elapsedSinceLastUserInput ?? options.memoryContext?.elapsedSinceLastUserInput ?? null;

    // Categorize temporal range
    let temporalBracket = "continuous"; // < 30 min
    if (elapsedMs !== null && elapsedMs !== undefined) {
      const ms = Math.max(0, elapsedMs);
      const minutes = ms / (1000 * 60);
      const hours = minutes / 60;
      const days = hours / 24;

      if (minutes < 30) {
        temporalBracket = "continuous";
      } else if (hours < 4) {
        temporalBracket = "normal_continuation";
      } else if (hours < 12) {
        temporalBracket = "consider_reorientation";
      } else if (hours < 24) {
        temporalBracket = "stronger_consideration";
      } else if (days < 3) {
        temporalBracket = "offer_recap_1_to_3_days";
      } else if (days < 7) {
        temporalBracket = "reasonable_recap_3_to_7_days";
      } else if (days < 30) {
        temporalBracket = "strong_case_7_plus_days";
      } else {
        temporalBracket = "dormant_weeks_months";
      }
    }

    // Has prior substantive conversation happened?
    const priorTurns = history.filter(m => m.role === "user" || m.role === "assistant");
    const hasSubstantialWork = priorTurns.length >= 2;

    // Check query intent: explicit recap request vs open re-entry greeting vs direct instruction
    const isExplicitRecapRequest = this._isExplicitRecapRequest(query);
    const isOpenReentryGreeting = this._isOpenReentryGreeting(query);
    const isDirectInstruction = this._isDirectInstruction(query);

    // Decision Logic
    let shouldRecap = false;
    let recapType = "none";
    let reason = "Continuous active dialogue";

    if (isExplicitRecapRequest) {
      // User directly asked "what were we doing?", "catch me up", "where did we leave off?"
      shouldRecap = true;
      recapType = "explicit_request";
      reason = "User explicitly requested a context recap";
    } else if (isDirectInstruction) {
      // User returns with a specific command (e.g. "Change nozzle diameter to 42mm", "solve 5x+2=12")
      // TIME DOES NOT FORCE A RECAP. Proceed directly with instruction.
      shouldRecap = false;
      recapType = "none";
      reason = "User provided a specific task/instruction; context maintained without interrupting recap";
    } else if (hasSubstantialWork && isOpenReentryGreeting) {
      // User says "Hey, I'm back", "Let's continue", "hi", "good morning" after elapsed time
      if (temporalBracket === "consider_reorientation" || temporalBracket === "stronger_consideration") {
        shouldRecap = true;
        recapType = "offer_brief";
        reason = `User re-entered after moderate elapsed time (${temporalBracket}); offering brief reorientation`;
      } else if (
        temporalBracket === "offer_recap_1_to_3_days" ||
        temporalBracket === "reasonable_recap_3_to_7_days" ||
        temporalBracket === "strong_case_7_plus_days" ||
        temporalBracket === "dormant_weeks_months"
      ) {
        shouldRecap = true;
        recapType = "where_we_left_off";
        reason = `User re-entered after extended dormant period (${temporalBracket}) with open greeting; re-establishing context`;
      }
    }

    return {
      elapsedMs,
      temporalBracket,
      hasSubstantialWork,
      isExplicitRecapRequest,
      isOpenReentryGreeting,
      isDirectInstruction,
      shouldRecap,
      recapType,
      reason
    };
  }

  static _isExplicitRecapRequest(query) {
    const recapPatterns = [
      "what were we doing",
      "what was i doing",
      "where were we",
      "where did we leave off",
      "what's our status",
      "whats our status",
      "catch me up",
      "recap",
      "give me a recap",
      "what are we working on",
      "remind me what we were doing",
      "what was the plan"
    ];
    return recapPatterns.some(p => query.includes(p));
  }

  static _isOpenReentryGreeting(query) {
    const openPatterns = [
      "i'm back", "im back", "i am back", "hey i'm back", "hey im back",
      "let's continue", "lets continue", "continue", "ready to continue",
      "back again", "we're back", "were back", "picking this back up",
      "ready to work", "where were we"
    ];
    const isGreeting = this._isGreeting(query);
    return isGreeting || openPatterns.some(p => query.includes(p));
  }

  static _isDirectInstruction(query) {
    // If the user is asking to solve a formula, change a dimension, write code, run a test, or ask a concrete domain question
    const startsWithImperative = /^(change|set|update|modify|calculate|solve|derive|generate|build|create|add|remove|delete|make|write|implement|test|simulate|run)\b/i.test(query);
    const hasMath = /[0-9]+[a-z]?\s*[\+\-\*\/=]\s*[0-9]+/.test(query);
    const hasDimension = /\b\d+(\.\d+)?\s*(mm|cm|m|km|kn|kg|psi|bar|k|deg|sec|s)\b/i.test(query);
    return startsWithImperative || hasMath || hasDimension;
  }
}
