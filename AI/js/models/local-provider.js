/*
    local-provider.js

    Local PyTorch LANZAR-001 Model Provider for LANZAR AI.

    Responsibilities:
    - Interface with local PyTorch HTTP engine on http://localhost:5050
    - Support real-time Server-Sent Events (SSE) token streaming for responsive live typing
    - Construct structured multi-persona prompts incorporating persona instructions and active mind context
    - Provide engine health monitoring and automatic graceful fallback notice if offline
*/

import { ModelProvider } from "./model-provider.js";
import { CognitiveRouter } from "./cognitive-router.js";

// =====================================
// Lanzar001Provider Class
// =====================================

export class Lanzar001Provider extends ModelProvider {
  #baseUrl = "http://localhost:5050";
  #isOnline = false;
  #modelInfo = null;

  constructor(baseUrl = "http://localhost:5050") {
    super("LANZAR-001 PyTorch", "local_pytorch");
    this.#baseUrl = baseUrl;
    this.checkHealth();
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get isOnline() {
    return this.#isOnline;
  }

  get modelInfo() {
    return this.#modelInfo;
  }

  /**
   * Checks connectivity and parameters of the local PyTorch server.
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${this.#baseUrl}/health`, { 
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const stats = await res.json();
        this.#isOnline = true;
        this.#modelInfo = stats;
        return true;
      }
      this.#isOnline = false;
      return false;
    } catch {
      this.#isOnline = false;
      this.#modelInfo = null;
      return false;
    }
  }

  /**
   * Generates a non-streaming response from LANZAR-001.
   */
  async generateResponse(messages, options = {}) {
    const isUp = await this.checkHealth();
    if (!isUp) {
      return this.#getOfflineFallbackResponse(messages, options);
    }

    const { promptMessages, routingDecision } = this.#buildChatPayload(messages, options);

    // 0. Platform Content Safety Boundary Intercept
    if (routingDecision.isSafetyBlocked && routingDecision.refusal) {
      return routingDecision.refusal;
    }

    try {
      const response = await fetch(`${this.#baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "lanzar-001",
          messages: promptMessages,
          max_tokens: 120,
          temperature: 0.75,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || data.text || "";

      return {
        perspective: routingDecision.owner,
        isMultiTurn: false,
        persona: routingDecision.owner === "dual" ? "lanzar" : routingDecision.owner,
        authorName: this.#getAuthorNameForOwner(routingDecision.owner),
        content: generatedText.trim() || "(Empty response from LANZAR-001)"
      };

    } catch (err) {
      console.warn("[Lanzar001Provider] Generation error:", err);
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

    const { promptMessages, routingDecision } = this.#buildChatPayload(messages, options);

    // 0. Platform Content Safety Boundary Intercept
    if (routingDecision.isSafetyBlocked && routingDecision.refusal) {
      if (typeof onToken === "function") {
        onToken(routingDecision.refusal.content);
      }
      return routingDecision.refusal;
    }

    try {
      const response = await fetch(`${this.#baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "lanzar-001",
          messages: promptMessages,
          max_tokens: 140,
          temperature: 0.75,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
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
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.substring(6).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullContent += token;
              if (typeof onToken === "function") {
                onToken(fullContent);
              }
            }
          } catch {
            // Ignore partial JSON chunks
          }
        }
      }

      return {
        perspective: routingDecision.owner,
        isMultiTurn: false,
        persona: routingDecision.owner === "dual" ? "lanzar" : routingDecision.owner,
        authorName: this.#getAuthorNameForOwner(routingDecision.owner),
        content: fullContent.trim()
      };

    } catch (err) {
      console.warn("[Lanzar001Provider] Streaming error:", err);
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

  #buildChatPayload(messages, options) {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    const rawQuery = lastUserMessage ? lastUserMessage.content : "";
    const routingDecision = CognitiveRouter.route(rawQuery, messages, options);

    // Build persona system prompt directly from Canonical Character Portfolio
    let systemPrompt = "You are LANZAR AI, an advanced aerospace and systems engineering intelligence.";
    const personaManager = options.personaManager;
    const targetCharacter = personaManager ? personaManager.getPersona(routingDecision.owner) : null;

    if (targetCharacter && typeof targetCharacter.getSystemPrompt === "function") {
      const adaptation = {
        ...(options.adaptation || {}),
        minaMathCompetenceDiscovered: options.minaMathCompetenceDiscovered ?? (personaManager ? personaManager.isMinaMathCompetenceDiscovered : false)
      };
      systemPrompt = targetCharacter.getSystemPrompt(adaptation);
    } else if (routingDecision.owner === "penny") {
      systemPrompt = "You are Penelope ('Penny'), LANZAR's Chief of Possibility and Experimental Engineering. Be bold, innovative, rapid-prototyping, and enthusiastically optimistic.";
    } else if (routingDecision.owner === "pete") {
      systemPrompt = "You are Peter ('Pete'), LANZAR's Director of Systems Architecture and Diagnostics. Be analytical, rigorous, precise, mathematical, and grounded in physical principles.";
    } else if (routingDecision.owner === "mina") {
      systemPrompt = "You are Mina, LANZAR's Art Director and Visual Creative Intelligence. Focus on Atomic Age aesthetics, color harmony, typography, and visual soul.";
    }

    const promptMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content, persona: m.persona || "" }))
    ];

    return { promptMessages, routingDecision };
  }

  #getAuthorNameForOwner(owner) {
    switch (owner) {
      case "penny": return "Penny (LANZAR-001)";
      case "pete": return "Pete (LANZAR-001)";
      case "mina": return "Mina (LANZAR-001)";
      case "dual": return "Penny & Pete (LANZAR-001)";
      default: return "LANZAR-001 PyTorch";
    }
  }

  #getOfflineFallbackResponse(messages, options, errorMsg = "") {
    return {
      perspective: "lanzar",
      isMultiTurn: false,
      persona: "lanzar",
      authorName: "LANZAR Engine Bridge",
      content: `⚠️ **LANZAR-001 PyTorch Engine Offline**\n\nThe local inference server on \`http://localhost:5050\` is currently unreachable.\n\n**To start the local model engine:**\n\`\`\`powershell\npython AI/engine/server.py\n\`\`\`\n\n*You can switch back to **LANZAR Triad (Simulated)** using the Model Switcher in the top bar to continue with simulated multi-mind intelligence.*`
    };
  }
}
