/*
    hosted-provider.js

    Hosted Cloud AI Model Provider for LANZAR AI.

    Responsibilities:
    - Interface with LANZAR server proxy endpoints (/api/inference/chat, /api/inference/stream)
    - Support real-time Server-Sent Events (SSE) token streaming
    - Retain zero API keys on the client (all auth & endpoint resolution handled server-side)
    - Respect dynamic character modelConfig (temperature, maxTokens, system prompt)
    - Provide robust error handling and graceful offline fallback notices
*/

import { ModelProvider } from "./model-provider.js";
import { CognitiveRouter } from "./cognitive-router.js";
import { globalBus } from "../core/event-bus.js";

// =====================================
// HostedModelProvider Class
// =====================================

export class HostedModelProvider extends ModelProvider {
  #apiBaseUrl = "/api/inference";
  #isAvailable = false;
  #serverConfig = null;

  constructor(apiBaseUrl = "/api/inference") {
    super("LANZAR Hosted AI (Cloud)", "hosted_ai");
    this.#apiBaseUrl = apiBaseUrl;
    this.checkHealth();
  }

  get apiBaseUrl() {
    return this.#apiBaseUrl;
  }

  get isOnline() {
    return this.#isAvailable;
  }

  get serverConfig() {
    return this.#serverConfig;
  }

  /**
   * Checks connectivity and configuration of the server-side hosted inference gateway.
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.#apiBaseUrl}/status`, {
        method: "GET",
        headers: this.#getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.#serverConfig = data;
        this.#isAvailable = Boolean(data.configured);
        return this.#isAvailable;
      }
      this.#isAvailable = false;
      return false;
    } catch {
      this.#isAvailable = false;
      return false;
    }
  }

  /**
   * Generates a non-streaming response via server-side hosted proxy.
   */
  async generateResponse(messages, options = {}) {
    const isUp = await this.checkHealth();
    if (!isUp) {
      return this.#getOfflineFallbackResponse(messages, options);
    }

    const { payload, routingDecision, authorName, isMultiCharacter, characters } = this.#buildInferencePayload(messages, options);

    // 0. Platform Content Safety Boundary Intercept
    if (routingDecision.isSafetyBlocked && routingDecision.refusal) {
      return routingDecision.refusal;
    }

    // 1. Multi-Character (Triad / Dual) Coordinated Synthesis
    if (isMultiCharacter && characters.length > 1) {
      try {
        const res = await fetch(`${this.#apiBaseUrl}/multi-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.#getAuthHeaders()
          },
          body: JSON.stringify({
            messages,
            routingDecision,
            characters
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        return {
          perspective: routingDecision.owner,
          isMultiTurn: true,
          persona: routingDecision.owner,
          authorName: data.authorName || authorName,
          dialogues: data.dialogues || [],
          model: data.model
        };
      } catch (err) {
        console.warn("[HostedModelProvider] Multi-chat error:", err);
        return this.#getOfflineFallbackResponse(messages, options, err.message);
      }
    }

    try {
      const res = await fetch(`${this.#apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.#getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        perspective: routingDecision.owner,
        isMultiTurn: false,
        persona: routingDecision.owner === "dual" ? "lanzar" : routingDecision.owner,
        authorName,
        content: data.content || "(No response content returned from hosted model)",
        model: data.model
      };

    } catch (err) {
      console.warn("[HostedModelProvider] Generation error:", err);
      return this.#getOfflineFallbackResponse(messages, options, err.message);
    }
  }

  /**
   * Streams token completions in real time using Server-Sent Events (SSE).
   */
  async streamResponse(messages, options = {}, onToken) {
    const isUp = await this.checkHealth();
    if (!isUp) {
      const fallback = this.#getOfflineFallbackResponse(messages, options);
      if (typeof onToken === "function") {
        onToken(fallback.content);
      }
      return fallback;
    }

    const { payload, routingDecision, authorName, isMultiCharacter, characters } = this.#buildInferencePayload(messages, options);

    // 0. Platform Content Safety Boundary Intercept
    if (routingDecision.isSafetyBlocked && routingDecision.refusal) {
      if (typeof onToken === "function") {
        onToken(routingDecision.refusal.content);
      }
      return routingDecision.refusal;
    }

    // 1. Multi-Character Streaming (Triad / Dual)
    if (isMultiCharacter && characters.length > 1) {
      try {
        const res = await fetch(`${this.#apiBaseUrl}/multi-stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.#getAuthHeaders()
          },
          body: JSON.stringify({
            messages,
            routingDecision,
            characters
          })
        });

        if (!res.ok || !res.body) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.speakerChange) {
                // Speaker change event (can be passed to onToken or handled as structured marker)
                if (typeof onToken === "function") {
                  onToken(`\n\n**${parsed.authorName}**: `, parsed);
                }
              } else if (parsed.token) {
                fullContent += parsed.token;
                if (typeof onToken === "function") {
                  onToken(parsed.token, parsed);
                }
              }
            } catch {
              // Ignore incomplete chunks
            }
          }
        }

        return {
          perspective: routingDecision.owner,
          isMultiTurn: true,
          persona: routingDecision.owner,
          authorName: characters.map(c => c.shortName || c.name || c.id).join(" • "),
          content: fullContent.trim()
        };
      } catch (err) {
        console.warn("[HostedModelProvider] Multi-stream error:", err);
        const fallback = this.#getOfflineFallbackResponse(messages, options, err.message);
        if (typeof onToken === "function") {
          onToken(fallback.content);
        }
        return fallback;
      }
    }

    try {
      const res = await fetch(`${this.#apiBaseUrl}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.#getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.token) {
              fullContent += parsed.token;
              if (typeof onToken === "function") {
                onToken(parsed.token);
              }
            }
          } catch (e) {
            if (e.message && !e.message.startsWith("JSON")) {
              throw e;
            }
            // Ignore incomplete chunks
          }
        }
      }

      return {
        perspective: routingDecision.owner,
        isMultiTurn: false,
        persona: routingDecision.owner === "dual" ? "lanzar" : routingDecision.owner,
        authorName,
        content: fullContent.trim()
      };

    } catch (err) {
      console.warn("[HostedModelProvider] Streaming error:", err);
      const fallback = this.#getOfflineFallbackResponse(messages, options, err.message);
      if (typeof onToken === "function") {
        onToken(fallback.content);
      }
      return fallback;
    }
  }

  // =====================================
  // Private Helper Methods
  // =====================================

  #getAuthHeaders() {
    // Authoritative session tokens from localStorage / Auth state
    const token = localStorage.getItem("lanzar_auth_token");
    const userId = localStorage.getItem("lanzar_user_id") || "user_default";
    const headers = { "X-User-Id": userId };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  #buildInferencePayload(messages, options) {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    const rawQuery = lastUserMessage ? lastUserMessage.content : "";
    const routingDecision = CognitiveRouter.route(rawQuery, messages, options);

    const personaManager = options.personaManager;
    const targetCharacter = personaManager ? personaManager.getPersona(routingDecision.owner) : null;

    let systemPrompt = "You are LANZAR AI, an advanced aerospace, systems engineering, and creative intelligence.";
    let temperature = 0.7;
    let maxTokens = 350;
    let model = "default";

    if (targetCharacter) {
      const adaptation = {
        ...(options.adaptation || {}),
        minaMathCompetenceDiscovered: options.minaMathCompetenceDiscovered ?? (personaManager ? personaManager.isMinaMathCompetenceDiscovered : false)
      };
      if (typeof targetCharacter.getSystemPrompt === "function") {
        systemPrompt = targetCharacter.getSystemPrompt(adaptation);
      }
      if (targetCharacter.modelConfig) {
        temperature = targetCharacter.modelConfig.temperature ?? 0.7;
        maxTokens = targetCharacter.modelConfig.maxTokens ?? 350;
        model = targetCharacter.modelConfig.model || "default";
      }
    }

    // Append long-term memory context if present for this user
    if (options.memoryContext && options.memoryContext.relevantFacts && options.memoryContext.relevantFacts.length > 0) {
      systemPrompt += `\n\nRelevant user context from long-term memory:\n${options.memoryContext.relevantFacts.map(f => `- ${f}`).join('\n')}`;
    }

    const authorName = this.#getAuthorNameForOwner(routingDecision.owner);

    // Multi-Character Resolution (Triad, Dual, or multi-domain synthesis)
    const isMultiCharacter = ["triad", "dual", "mina_penny", "mina_pete"].includes(routingDecision.owner);
    let characters = [];

    if (isMultiCharacter) {
      const participation = CognitiveRouter.evaluatePersonaParticipation(rawQuery, messages, options);
      const participantIds = participation.participants && participation.participants.length > 0
        ? participation.participants
        : (routingDecision.owner === "dual" ? ["penny", "pete"] : ["penny", "pete", "mina"]);

      for (const pId of participantIds) {
        const char = personaManager ? personaManager.getPersona(pId) : null;
        let charSysPrompt = `You are ${pId} on the LANZAR AI character team.`;
        let charModel = "default";
        let charTemp = 0.75;
        let charMax = 400;

        if (char) {
          const adaptation = {
            ...(options.adaptation || {}),
            minaMathCompetenceDiscovered: options.minaMathCompetenceDiscovered ?? (personaManager ? personaManager.isMinaMathCompetenceDiscovered : false)
          };
          if (typeof char.getSystemPrompt === "function") {
            charSysPrompt = char.getSystemPrompt(adaptation);
          }
          if (char.modelConfig) {
            charTemp = char.modelConfig.temperature ?? 0.75;
            charMax = char.modelConfig.maxTokens ?? 400;
            charModel = char.modelConfig.model || "default";
          }
        }

        characters.push({
          id: pId,
          name: char ? (char.shortName || char.name || pId) : pId,
          shortName: char ? (char.shortName || char.name || pId) : pId,
          role: char ? char.role : "",
          avatar: char ? char.avatar : "",
          accentColor: char ? char.accentColor : "",
          systemPrompt: charSysPrompt,
          model: charModel,
          temperature: charTemp,
          maxTokens: charMax
        });
      }
    }

    return {
      payload: {
        messages,
        systemPrompt,
        characterId: routingDecision.owner,
        model,
        temperature,
        maxTokens
      },
      routingDecision,
      authorName,
      isMultiCharacter,
      characters
    };
  }

  #getAuthorNameForOwner(owner) {
    switch (owner) {
      case "penny": return "Penny";
      case "pete": return "Pete";
      case "mina": return "Mina";
      case "dual": return "Penny & Pete";
      default: return "LANZAR AI";
    }
  }

  #getOfflineFallbackResponse(messages, options, errorMsg = "") {
    return {
      perspective: "lanzar",
      isMultiTurn: false,
      persona: "lanzar",
      authorName: "LANZAR Cloud Bridge",
      content: `⚠️ **Hosted AI Inference Unreachable**\n\n${errorMsg ? `*Reason: ${errorMsg}*\n\n` : ''}The server-side hosted AI provider is not currently configured or reachable.\n\n**To configure Hosted Cloud Inference:**\n1. Add your API key to \`.env\` in the project root:\n\`\`\`bash\nHOSTED_AI_API_KEY=your_api_key_here\nHOSTED_AI_DEFAULT_MODEL=openai/gpt-oss-120b\n\`\`\`\n2. Or switch to **LANZAR-001 (PyTorch)** or **Simulated Triad** in the top-bar model switcher to continue working offline.`
    };
  }
}
