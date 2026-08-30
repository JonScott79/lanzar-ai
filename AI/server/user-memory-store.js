/*
    user-memory-store.js

    Server-Authoritative Long-Term Memory Store for LANZAR AI.

    Responsibilities:
    - Persist user-owned long-term memories in AI/data/user-memories.json
    - Enforce strict UID isolation (User A cannot access/mutate User B memories)
    - Support Memory CRUD (List, Add, Update/Confirm, Delete)
    - Detect duplicates and update/supersede previous facts
    - Provide relevance filtering for character context assembly
*/

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MEMORIES_FILE = path.join(DATA_DIR, 'user-memories.json');

// Initial valid taxonomy
const MEMORY_CATEGORIES = [
  'preference',
  'project',
  'skill',
  'goal',
  'interest',
  'workflow',
  'personal_context',
  'technical_context'
];

class UserMemoryStore {
  constructor() {
    this.#ensureDataDir();
  }

  #ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MEMORIES_FILE)) {
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify({}, null, 2), 'utf8');
    }
  }

  #readAll() {
    try {
      this.#ensureDataDir();
      const raw = fs.readFileSync(MEMORIES_FILE, 'utf8');
      return JSON.parse(raw || '{}');
    } catch (err) {
      console.warn('[UserMemoryStore] Failed to read memories, resetting:', err);
      return {};
    }
  }

  #writeAll(data) {
    try {
      this.#ensureDataDir();
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[UserMemoryStore] Failed to write memories:', err);
    }
  }

  /**
   * Returns all memories for the authenticated UID.
   * @param {string} userId
   * @param {Object} filters - optional { category, status }
   * @returns {Array}
   */
  getMemories(userId, filters = {}) {
    const all = this.#readAll();
    const userMemories = all[userId] || [];
    
    return userMemories.filter(m => {
      if (filters.category && m.category !== filters.category) return false;
      if (filters.status && m.status !== filters.status) return false;
      return true;
    });
  }

  /**
   * Fetches a specific memory record by ID for a user.
   * @param {string} userId
   * @param {string} memoryId
   * @returns {Object|null}
   */
  getMemory(userId, memoryId) {
    const memories = this.getMemories(userId);
    return memories.find(m => m.id === memoryId) || null;
  }

  /**
   * Adds a new long-term memory or updates an existing duplicate/conflicting memory.
   * @param {string} userId
   * @param {Object} memoryData
   * @returns {Object} { memory, isUpdate: boolean, supersededId?: string }
   */
  addMemory(userId, memoryData) {
    const all = this.#readAll();
    if (!all[userId]) {
      all[userId] = [];
    }

    const category = MEMORY_CATEGORIES.includes(memoryData.category)
      ? memoryData.category
      : 'personal_context';

    const factText = (memoryData.fact || '').trim();
    if (!factText) {
      throw new Error('Memory fact text cannot be empty');
    }

    // Check for exact duplicate or superseding relationship
    const existingIndex = all[userId].findIndex(m => {
      if (m.category !== category) return false;
      // Exact fact match
      if (m.fact.toLowerCase() === factText.toLowerCase()) return true;
      // Subject overlap for project/goal/preference
      if (memoryData.supersedesSubject && m.fact.toLowerCase().includes(memoryData.supersedesSubject.toLowerCase())) {
        return true;
      }
      return false;
    });

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update existing memory
      const existing = all[userId][existingIndex];
      existing.fact = factText;
      existing.confidence = memoryData.confidence || existing.confidence || 'high';
      existing.status = memoryData.status || existing.status || 'active';
      existing.updatedAt = now;
      if (memoryData.sourceConversationId) existing.sourceConversationId = memoryData.sourceConversationId;
      if (memoryData.sourceMessageId) existing.sourceMessageId = memoryData.sourceMessageId;

      this.#writeAll(all);
      return { memory: existing, isUpdate: true };
    }

    // Create new memory
    const newMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      category,
      fact: factText,
      sourceConversationId: memoryData.sourceConversationId || null,
      sourceMessageId: memoryData.sourceMessageId || null,
      createdAt: now,
      updatedAt: now,
      confidence: memoryData.confidence || 'high',
      status: memoryData.status || 'active',
      characterId: memoryData.characterId || null,
      lastConfirmedAt: memoryData.status === 'active' ? now : null
    };

    all[userId].unshift(newMemory);
    this.#writeAll(all);
    return { memory: newMemory, isUpdate: false };
  }

  /**
   * Updates an existing memory record.
   * @param {string} userId
   * @param {string} memoryId
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateMemory(userId, memoryId, updates = {}) {
    const all = this.#readAll();
    const userMemories = all[userId] || [];
    const index = userMemories.findIndex(m => m.id === memoryId);

    if (index === -1) return null;

    const memory = userMemories[index];
    if (updates.fact) memory.fact = updates.fact.trim();
    if (updates.category && MEMORY_CATEGORIES.includes(updates.category)) {
      memory.category = updates.category;
    }
    if (updates.confidence) memory.confidence = updates.confidence;
    if (updates.status) {
      memory.status = updates.status;
      if (updates.status === 'active') {
        memory.lastConfirmedAt = new Date().toISOString();
      }
    }
    memory.updatedAt = new Date().toISOString();

    all[userId][index] = memory;
    this.#writeAll(all);
    return memory;
  }

  /**
   * Deletes a memory record for the authenticated user.
   * @param {string} userId
   * @param {string} memoryId
   * @returns {boolean}
   */
  deleteMemory(userId, memoryId) {
    const all = this.#readAll();
    const userMemories = all[userId] || [];
    const index = userMemories.findIndex(m => m.id === memoryId);

    if (index === -1) return false;

    userMemories.splice(index, 1);
    all[userId] = userMemories;
    this.#writeAll(all);
    return true;
  }

  /**
   * Retrieves relevant active memories for a given query/context.
   * Model-independent keyword and category matcher.
   * @param {string} userId
   * @param {string} contextQuery
   * @param {number} limit
   * @returns {Array}
   */
  getRelevantMemories(userId, contextQuery = '', limit = 5) {
    const memories = this.getMemories(userId, { status: 'active' });
    if (!contextQuery || !contextQuery.trim()) {
      return memories.slice(0, limit);
    }

    const queryTerms = contextQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    // Score memories by term overlap
    const scored = memories.map(m => {
      let score = 0;
      const text = `${m.fact} ${m.category}`.toLowerCase();
      queryTerms.forEach(term => {
        if (text.includes(term)) score += 1;
      });
      if (m.confidence === 'high') score += 0.5;
      return { memory: m, score };
    });

    return scored
      .filter(s => s.score > 0 || memories.length <= limit)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory);
  }
}

const userMemoryStore = new UserMemoryStore();
module.exports = { UserMemoryStore, userMemoryStore, MEMORY_CATEGORIES };
