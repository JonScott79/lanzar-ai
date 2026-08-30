/*
    user-memory-service.js

    Client-Side Long-Term Memory & Fact Extraction Service for LANZAR AI.

    Responsibilities:
    - Synchronize long-term user memories with server-side /api/user/memory
    - Run conservative asynchronous FactExtractor on user messages
    - Provide shared, character-agnostic memory context retrieval for all active minds
    - Reactive state management with globalBus
*/

import { authService } from "../auth/auth-service.js";
import { globalBus } from "../core/event-bus.js";
import { FactExtractor } from "./fact-extractor.js";
import { Analytics } from "../analytics.js";

class UserMemoryService {
  #memories = [];
  #isLoaded = false;

  constructor() {
    globalBus.on("auth:changed", async () => {
      await this.reload();
    });
  }

  /**
   * Initializes or reloads user memories from server.
   */
  async init() {
    if (this.#isLoaded) return;
    await this.reload();
  }

  async reload() {
    try {
      const res = await fetch("/api/user/memory", {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        this.#memories = Array.isArray(data.memories) ? data.memories : [];
      } else {
        this.#memories = [];
      }
      this.#isLoaded = true;
      globalBus.emit("memories:changed", { memories: this.getMemories() });
    } catch (err) {
      console.warn("[UserMemoryService] Failed to fetch memories from server:", err);
      this.#memories = [];
      this.#isLoaded = true;
    }
  }

  /**
   * Returns memories, optionally filtered by category.
   * @param {string|null} category
   * @returns {Array}
   */
  getMemories(category = null) {
    if (!category) return [...this.#memories];
    return this.#memories.filter(m => m.category === category);
  }

  /**
   * Creates a new user memory on server.
   * @param {Object} memoryData
   */
  async addMemory(memoryData) {
    try {
      const res = await fetch("/api/user/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(memoryData)
      });

      if (res.ok) {
        const data = await res.json();
        const memory = data.memory || data;
        
        if (data.isUpdate) {
          const idx = this.#memories.findIndex(m => m.id === memory.id);
          if (idx !== -1) this.#memories[idx] = memory;
          else this.#memories.unshift(memory);
        } else {
          this.#memories.unshift(memory);
        }

        Analytics.track("Memory", "Created", { category: memory.category });
        globalBus.emit("memories:changed", { memories: this.getMemories() });
        return memory;
      }
    } catch (err) {
      console.error("[UserMemoryService] Error adding memory:", err);
    }
    return null;
  }

  /**
   * Updates an existing memory record.
   * @param {string} memoryId
   * @param {Object} updates
   */
  async updateMemory(memoryId, updates) {
    try {
      const res = await fetch(`/api/user/memory/${memoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.memory || data;
        const idx = this.#memories.findIndex(m => m.id === memoryId);
        if (idx !== -1) {
          this.#memories[idx] = updated;
          globalBus.emit("memories:changed", { memories: this.getMemories() });
        }
        Analytics.track("Memory", "Updated", { memoryId });
        return updated;
      }
    } catch (err) {
      console.error("[UserMemoryService] Error updating memory:", err);
    }
    return null;
  }

  /**
   * Deletes a memory record.
   * @param {string} memoryId
   */
  async deleteMemory(memoryId) {
    try {
      const res = await fetch(`/api/user/memory/${memoryId}`, {
        method: "DELETE",
        headers: { ...authService.getAuthHeaders() }
      });

      if (res.ok) {
        this.#memories = this.#memories.filter(m => m.id !== memoryId);
        globalBus.emit("memories:changed", { memories: this.getMemories() });
        Analytics.track("Memory", "Deleted", { memoryId });
        return true;
      }
    } catch (err) {
      console.error("[UserMemoryService] Error deleting memory:", err);
    }
    return false;
  }

  /**
   * Character memory retrieval interface.
   * Fetches memories relevant to the active prompt/task.
   * @param {string} contextQuery
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRelevantMemories(contextQuery = "", limit = 5) {
    try {
      const encoded = encodeURIComponent(contextQuery);
      const res = await fetch(`/api/user/memory/relevant?q=${encoded}&limit=${limit}`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.memories) ? data.memories : [];
      }
    } catch (err) {
      console.warn("[UserMemoryService] Failed to query relevant memories:", err);
    }

    // Fallback to local memory filter
    return this.#memories.slice(0, limit);
  }

  /**
   * Asynchronously examines a user message, extracts candidate facts,
   * and persists high-confidence memories without delaying conversation response.
   * @param {Object} message - { role: 'user', content: string, conversationId?: string }
   */
  async processUserMessageAsync(message) {
    if (!message || message.role !== "user") return;

    try {
      const candidates = FactExtractor.extractCandidateFacts(message, this.#memories);
      if (candidates.length === 0) return;

      for (const candidate of candidates) {
        // High confidence automatically persisted to user memory
        if (candidate.confidence === "high") {
          await this.addMemory(candidate);
          console.log(`[UserMemoryService] Remembered user fact (${candidate.category}): "${candidate.fact}"`);
        }
      }
    } catch (err) {
      console.warn("[UserMemoryService] Error in background fact extraction:", err);
    }
  }
}

export const userMemoryService = new UserMemoryService();
