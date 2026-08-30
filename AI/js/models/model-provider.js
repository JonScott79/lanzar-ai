/*
    model-provider.js

    Base abstraction interface for LANZAR AI model providers.

    Responsibilities
    - Define pluggable contract for all AI model implementations
    - Support synchronous and streaming token generation
    - Decouple application frontend from backend inference engine
*/

// =====================================
// Model Provider Base Class
// =====================================

export class ModelProvider {
  constructor(name, providerType) {
    this.name = name;
    this.providerType = providerType;
  }

  // =====================================
  // Core Inference Contract
  // =====================================

  /**
   * Generates a complete response for a conversation
   * @param {Array} messages - Chat history array [{role, content, persona}]
   * @param {Object} options - {persona, adaptation, memoryContext, toolContext}
   * @returns {Promise<Object>} {content, persona, metadata}
   */
  async generateResponse(messages, options = {}) {
    throw new Error("generateResponse() must be implemented by concrete ModelProvider.");
  }

  /**
   * Streams tokens for a response
   * @param {Array} messages
   * @param {Object} options
   * @param {Function} onToken - Callback (token: string) => void
   * @returns {Promise<Object>} Final complete response object
   */
  async streamResponse(messages, options = {}, onToken) {
    const response = await this.generateResponse(messages, options);
    if (typeof onToken === "function") {
      onToken(response.content);
    }
    return response;
  }
}
