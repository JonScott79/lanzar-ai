/*
    long-term.js

    Durable long-term memory for user facts, learnings, and persistent concepts in LANZAR AI.

    Responsibilities
    - Store permanent knowledge fragments and user context
    - Allow querying and updating durable memory facts
*/

import { StorageAdapter } from "./storage-adapter.js";
import { STORAGE_KEYS } from "../config.js";

// =====================================
// Long Term Memory Class
// =====================================

export class LongTermMemory {
  #facts = [];

  constructor() {
    const saved = StorageAdapter.get(STORAGE_KEYS.LONG_TERM_MEMORY, [
      { id: "fact_1", category: "domain", text: "User is engineering aerospace & high-efficiency thermal systems.", confidence: 0.95 },
      { id: "fact_2", category: "interest", text: "Prefers rigorous mathematical modeling combined with rapid experimental testing.", confidence: 0.9 }
    ]);
    this.#facts = Array.isArray(saved) ? saved : [];
  }

  addFact(category, text, confidence = 1.0) {
    const fact = {
      id: "fact_" + Date.now(),
      category,
      text,
      confidence,
      createdAt: new Date().toISOString()
    };
    this.#facts.push(fact);
    this.#save();
    return fact;
  }

  getFacts(category = null) {
    if (!category) return [...this.#facts];
    return this.#facts.filter(f => f.category === category);
  }

  removeFact(id) {
    this.#facts = this.#facts.filter(f => f.id !== id);
    this.#save();
  }

  #save() {
    StorageAdapter.set(STORAGE_KEYS.LONG_TERM_MEMORY, this.#facts);
  }
}
