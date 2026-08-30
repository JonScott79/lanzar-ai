/*
    user-profile.js

    User profile and communication preference schema for LANZAR AI.

    Responsibilities
    - Store user adaptation parameters (technical depth, pace, explanation detail, initiative)
    - Preserve preferences across sessions
*/

import { StorageAdapter } from "../memory/storage-adapter.js";
import { STORAGE_KEYS } from "../config.js";

// =====================================
// User Profile Class
// =====================================

export class UserProfile {
  #profile = {
    displayName: "Commander",
    technicalDepth: "advanced", // 'simplified' | 'standard' | 'advanced' | 'deep-theoretical'
    conversationalPace: "brisk", // 'measured' | 'brisk' | 'rapid'
    initiativeLevel: "proactive", // 'reactive' | 'balanced' | 'proactive'
    explanationStyle: "systems", // 'bulleted' | 'narrative' | 'systems'
    humorTolerance: "moderate"
  };

  constructor() {
    const saved = StorageAdapter.get(STORAGE_KEYS.USER_PROFILE, null);
    if (saved) {
      this.#profile = { ...this.#profile, ...saved };
    }
  }

  get profile() {
    return { ...this.#profile };
  }

  update(partial) {
    this.#profile = { ...this.#profile, ...partial };
    StorageAdapter.set(STORAGE_KEYS.USER_PROFILE, this.#profile);
  }
}
