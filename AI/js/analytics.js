/*
    analytics.js

    Centralized analytics implementation for LANZAR AI.

    Responsibilities
    - Route interaction, persona, and conversation events through standardized API
    - Protect user privacy by stripping sensitive data
    - Provide fallback logging when external analytics are unavailable
*/

// =====================================
// Analytics Singleton
// =====================================

export class Analytics {
  static #initialized = false;
  static #debugMode = false;

  // =====================================
  // Initialization
  // =====================================

  static init(debug = false) {
    if (this.#initialized) {
      return;
    }

    this.#debugMode = debug;
    this.#initialized = true;

    if (this.#debugMode) {
      console.log("[LANZAR Analytics] Initialized in debug mode.");
    }
  }

  // =====================================
  // Public Tracking Method
  // =====================================

  static track(category, action, metadata = {}) {
    // Sanitize and filter sensitive data
    const sanitizedMetadata = this.#sanitize(metadata);

    const payload = {
      category,
      action,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString()
    };

    if (this.#debugMode) {
      console.log(`[LANZAR Analytics] Event: ${category} / ${action}`, sanitizedMetadata);
    }

    // Dispatch custom DOM event for listening integrations
    try {
      window.dispatchEvent(
        new CustomEvent("lanzar:analytics", { detail: payload })
      );
    } catch (e) {
      console.warn("[LANZAR Analytics] Event dispatch failed", e);
    }
  }

  // =====================================
  // Private Methods
  // =====================================

  static #sanitize(data) {
    if (!data || typeof data !== "object") {
      return {};
    }

    const clean = {};
    const prohibitedKeys = [
      "password",
      "token",
      "apiKey",
      "secret",
      "email",
      "creditCard"
    ];

    for (const [key, value] of Object.entries(data)) {
      if (prohibitedKeys.includes(key.toLowerCase())) {
        clean[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 500) {
        clean[key] = value.substring(0, 500) + "...[TRUNCATED]";
      } else {
        clean[key] = value;
      }
    }

    return clean;
  }
}
