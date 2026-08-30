/*
    command-history.js

    Terminal-style Command History Buffer for LANZAR AI Chat Composer.

    Responsibilities:
    - Maintain an ordered list of user-submitted prompts for the active conversation
    - Enable shell-like history navigation via ArrowUp (older) and ArrowDown (newer)
    - Preserve uncommitted working drafts when navigating away from the active input
    - Deduplicate consecutive identical submissions
    - Prevent accidental mutation of historical entries when recalled and edited
    - Separate composer input history cleanly from conversation persistence and AI memory
*/

import { STORAGE_KEYS } from "../config.js";

// =====================================
// Command History Class
// =====================================

export class CommandHistory {
  #history = [];
  #cursor = 0; // Pointer index in #history. When cursor === #history.length, pointing at the uncommitted draft
  #draft = "";
  #storageKey = null;

  /**
   * @param {Array<string>} initialEntries - Existing user prompts from current conversation
   * @param {string} storageKey - Optional localStorage key for session persistence
   */
  constructor(initialEntries = [], storageKey = STORAGE_KEYS.CHAT_COMMAND_HISTORY) {
    this.#storageKey = storageKey;
    this.#loadFromStorage(initialEntries);
  }

  get length() {
    return this.#history.length;
  }

  get cursor() {
    return this.#cursor;
  }

  get isAtDraft() {
    return this.#cursor === this.#history.length;
  }

  get isAtOldest() {
    return this.#cursor === 0;
  }

  getAllEntries() {
    return [...this.#history];
  }

  // =====================================
  // History Insertion & Navigation
  // =====================================

  /**
   * Pushes a newly submitted user prompt to the history.
   * Avoids consecutive duplicates and resets the navigation cursor to the draft position.
   * @param {string} text - Raw user input text
   */
  push(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    // Avoid consecutive duplicate
    const lastEntry = this.#history[this.#history.length - 1];
    if (lastEntry !== trimmed) {
      this.#history.push(trimmed);
      this.#persist();
    }

    // Reset cursor to end (pointing at new draft)
    this.#cursor = this.#history.length;
    this.#draft = "";
  }

  /**
   * Navigates backward in history (ArrowUp / Previous Command).
   * @param {string} currentInputValue - The text currently in the input before navigating
   * @returns {string|null} The recalled historical prompt, or null if history is empty
   */
  navigateUp(currentInputValue = "") {
    if (this.#history.length === 0) return null;

    // If currently at the draft position (cursor === length), stash the current draft
    if (this.#cursor === this.#history.length) {
      this.#draft = currentInputValue;
    }

    if (this.#cursor > 0) {
      this.#cursor--;
      return this.#history[this.#cursor];
    } else if (this.#cursor === 0) {
      // Already at the oldest entry: stay at index 0
      return this.#history[0];
    }

    return null;
  }

  /**
   * Navigates forward in history (ArrowDown / Next Command).
   * @returns {string|null} The next newer prompt, or the stashed working draft when reaching the end
   */
  navigateDown() {
    if (this.#history.length === 0) return null;

    if (this.#cursor < this.#history.length - 1) {
      this.#cursor++;
      return this.#history[this.#cursor];
    } else if (this.#cursor === this.#history.length - 1) {
      // Step past the newest entry back to the working draft
      this.#cursor = this.#history.length;
      return this.#draft;
    } else {
      // Already at the working draft
      return this.#draft;
    }
  }

  /**
   * Resets cursor back to draft position without altering historical entries.
   */
  resetCursor() {
    this.#cursor = this.#history.length;
    this.#draft = "";
  }

  /**
   * Returns a copy of all stored command entries.
   * @returns {Array<string>}
   */
  getEntries() {
    return [...this.#history];
  }

  // =====================================
  // Private Storage Utilities
  // =====================================

  #loadFromStorage(initialEntries = []) {
    let loaded = false;

    if (this.#storageKey) {
      try {
        const saved = localStorage.getItem(this.#storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.#history = parsed.filter(item => typeof item === "string" && item.trim().length > 0);
            loaded = true;
          }
        }
      } catch (err) {
        console.warn("[CommandHistory] Failed to read history from localStorage:", err);
      }
    }

    if (!loaded && Array.isArray(initialEntries) && initialEntries.length > 0) {
      initialEntries.forEach(item => {
        if (typeof item === "string" && item.trim().length > 0) {
          const last = this.#history[this.#history.length - 1];
          if (last !== item.trim()) {
            this.#history.push(item.trim());
          }
        }
      });
    }

    this.#cursor = this.#history.length;
  }

  #persist() {
    if (!this.#storageKey) return;
    try {
      // Keep up to 100 recent entries in buffer
      const slice = this.#history.slice(-100);
      localStorage.setItem(this.#storageKey, JSON.stringify(slice));
    } catch (err) {
      console.warn("[CommandHistory] Failed to persist command history:", err);
    }
  }
}
