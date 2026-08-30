/*
    short-term.js

    Short-term working memory and active conversation buffer for LANZAR AI.

    Responsibilities
    - Maintain active conversational turn history for current thread
    - Enforce sliding window context buffer
    - Coordinate with ConversationManager for multi-thread isolation
*/

import { StorageAdapter } from "./storage-adapter.js";
import { STORAGE_KEYS, DEFAULT_CONFIG } from "../config.js";

// =====================================
// Short Term Memory Class
// =====================================

export class ShortTermMemory {
  #messages = [];
  #maxHistory = DEFAULT_CONFIG.maxContextHistory;
  #conversationManager = null;

  constructor(conversationManager = null) {
    this.#conversationManager = conversationManager;
    const saved = StorageAdapter.get(STORAGE_KEYS.CONVERSATION_HISTORY, []);
    this.#messages = Array.isArray(saved) ? saved : [];
  }

  setConversationManager(convManager) {
    this.#conversationManager = convManager;
  }

  addMessage(role, content, persona = null, authorName = "") {
    const assignedPersona = persona || (role === "user" ? "user" : "lanzar");
    const assignedAuthorName = authorName || (role === "user" ? "You" : assignedPersona === "pete" ? "Pete" : assignedPersona === "mina" ? "Mina" : assignedPersona === "penny" ? "Penny" : "LANZAR AI");

    const entry = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      role, // 'user' | 'assistant' | 'system'
      content,
      persona: assignedPersona,
      authorName: assignedAuthorName,
      timestamp: new Date().toISOString()
    };

    if (this.#conversationManager) {
      this.#conversationManager.addMessage(entry);
    } else {
      this.#messages.push(entry);
      if (this.#messages.length > this.#maxHistory) {
        this.#messages = this.#messages.slice(-this.#maxHistory);
      }
      this.#save();
    }

    return entry;
  }

  getMessages() {
    if (this.#conversationManager) {
      return this.#conversationManager.getMessages();
    }
    return [...this.#messages];
  }

  /**
   * Retrieves the ISO timestamp of the most recent user input in the active thread.
   * @param {string} [excludeMessageId] - Optional ID of current message to exclude from search
   * @returns {string|null}
   */
  getLastUserMessageTimestamp(excludeMessageId = null) {
    const msgs = this.getMessages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role === "user" && (!excludeMessageId || m.id !== excludeMessageId)) {
        return m.timestamp || null;
      }
    }
    return null;
  }

  /**
   * Calculates elapsed milliseconds since the user's previous input.
   * @param {string} [excludeMessageId] - Optional current message ID to find preceding user turn
   * @param {number} [currentTimeMs] - Optional reference time in ms (defaults to Date.now())
   * @returns {number|null} Elapsed milliseconds, or null if no prior user input exists or timestamp is invalid
   */
  getElapsedSinceLastUserInput(excludeMessageId = null, currentTimeMs = null) {
    const lastTs = this.getLastUserMessageTimestamp(excludeMessageId);
    if (!lastTs) return null;
    const parsed = new Date(lastTs).getTime();
    if (isNaN(parsed) || parsed <= 0) return null;
    const now = currentTimeMs !== null ? currentTimeMs : Date.now();
    return Math.max(0, now - parsed);
  }

  /**
   * Static helper for calculating elapsed time between two timestamps.
   * @param {string|number|Date} prevTimestamp
   * @param {string|number|Date} [currentTimestamp]
   * @returns {number|null} Elapsed milliseconds, or null if previous timestamp is invalid
   */
  static calculateElapsed(prevTimestamp, currentTimestamp = null) {
    if (!prevTimestamp) return null;
    const prev = new Date(prevTimestamp).getTime();
    if (isNaN(prev) || prev <= 0) return null;
    const curr = currentTimestamp ? new Date(currentTimestamp).getTime() : Date.now();
    if (isNaN(curr)) return null;
    return Math.max(0, curr - prev);
  }

  clear() {
    this.#messages = [];
    this.#save();
  }

  #save() {
    StorageAdapter.set(STORAGE_KEYS.CONVERSATION_HISTORY, this.#messages);
  }
}
