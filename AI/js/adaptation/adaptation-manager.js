/*
    adaptation-manager.js

    Orchestrates user-tailored communication modulation for LANZAR AI.

    Responsibilities
    - Tune conversational style, vocabulary, and pacing without compromising core reasoning or honesty
    - Provide adaptation parameters for prompt generation
*/

import { UserProfile } from "./user-profile.js";

// =====================================
// Adaptation Manager Class
// =====================================

export class AdaptationManager {
  constructor() {
    this.userProfile = new UserProfile();
  }

  // =====================================
  // Dynamic Modulation Settings
  // =====================================

  getAdaptationParameters() {
    const p = this.userProfile.profile;
    return {
      technicalDepth: p.technicalDepth,
      pace: p.conversationalPace,
      initiative: p.initiativeLevel,
      style: p.explanationStyle
    };
  }
}
