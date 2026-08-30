/*
    user-profile-store.js

    Authoritative server-side persistence store for User Profiles and Settings in LANZAR AI.

    Responsibilities:
    - Persist user profiles and settings to data/user-profiles.json
    - Enforce authoritative UID scoping (users can only access/modify their own profile and settings)
    - Provide default fallback profiles and settings for new authenticated users and guests
*/

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

class UserProfileStore {
  #store = new Map(); // uid -> { profile, settings }

  constructor() {
    this.#ensureDataDir();
    this.#load();
  }

  #ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  #load() {
    try {
      if (fs.existsSync(PROFILES_FILE)) {
        const raw = fs.readFileSync(PROFILES_FILE, 'utf8');
        const json = JSON.parse(raw);
        for (const [uid, data] of Object.entries(json)) {
          this.#store.set(uid, data);
        }
        console.log(`[UserProfileStore] Loaded ${this.#store.size} user profile(s) from disk.`);
      } else {
        this.#save();
      }
    } catch (err) {
      console.error('[UserProfileStore] Failed to load user profiles from disk:', err);
      this.#store = new Map();
    }
  }

  #save() {
    try {
      const obj = {};
      for (const [uid, data] of this.#store.entries()) {
        obj[uid] = data;
      }
      fs.writeFileSync(PROFILES_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('[UserProfileStore] Failed to save user profiles to disk:', err);
    }
  }

  #getDefaultProfile(uid, initialMeta = {}) {
    const isGuest = uid === 'user_default';
    return {
      uid,
      displayName: initialMeta.displayName || (isGuest ? 'Guest Pilot' : uid.replace(/^(test_|user_|mock_)/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
      email: initialMeta.email || (isGuest ? 'default@lanzar.me' : `${uid}@lanzar.me`),
      photoURL: initialMeta.photoURL || '',
      preferredName: initialMeta.preferredName || (isGuest ? 'Guest' : initialMeta.displayName || 'Pilot'),
      occupation: initialMeta.occupation || (isGuest ? 'Observer' : 'Research Pilot / Engineer'),
      interests: initialMeta.interests || ['Propulsion', 'Orbital Mechanics', 'AI Architecture'],
      skills: initialMeta.skills || ['Systems Engineering', 'Telemetry Analysis'],
      hobbies: initialMeta.hobbies || ['Astronomy', 'Rocketry'],
      goals: initialMeta.goals || ['Explore advanced dual-mind AI reasoning'],
      aboutMe: initialMeta.aboutMe || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  #getDefaultSettings() {
    return {
      enabledCharacters: ['penny', 'pete', 'mina'],
      selectedCharacter: 'auto',
      activeModelProvider: 'stub',
      perspectiveMode: 'auto',
      banterFrequency: 'natural',
      technicalDepth: 'advanced',
      conversationalPace: 'brisk',
      explanationStyle: 'systems'
    };
  }

  /**
   * Retrieves or initializes a user profile and settings.
   * @param {string} uid
   * @param {Object} [initialMeta={}]
   * @returns {{ profile: Object, settings: Object }}
   */
  getUserData(uid, initialMeta = {}) {
    if (!uid) {
      uid = 'user_default';
    }

    if (!this.#store.has(uid)) {
      const data = {
        profile: this.#getDefaultProfile(uid, initialMeta),
        settings: this.#getDefaultSettings()
      };
      this.#store.set(uid, data);
      this.#save();
    }

    return this.#store.get(uid);
  }

  /**
   * Updates user profile fields.
   * @param {string} uid
   * @param {Object} updates
   * @returns {Object} Updated profile
   */
  updateProfile(uid, updates = {}) {
    const data = this.getUserData(uid);
    const forbiddenFields = ['uid', 'createdAt'];

    for (const [k, v] of Object.entries(updates)) {
      if (!forbiddenFields.includes(k) && v !== undefined) {
        data.profile[k] = v;
      }
    }

    data.profile.updatedAt = new Date().toISOString();
    this.#save();
    return data.profile;
  }

  /**
   * Updates user settings.
   * @param {string} uid
   * @param {Object} updates
   * @returns {Object} Updated settings
   */
  updateSettings(uid, updates = {}) {
    const data = this.getUserData(uid);

    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        data.settings[k] = v;
      }
    }

    this.#save();
    return data.settings;
  }
}

const userProfileStore = new UserProfileStore();

module.exports = { UserProfileStore, userProfileStore };
