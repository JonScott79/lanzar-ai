/*
    user-settings-manager.js

    Client-Side User Profile and Persistent Settings Manager for LANZAR AI.

    Responsibilities:
    - Load and synchronize user profile and settings from /api/user/profile and /api/user/settings
    - Persist character enabled/disabled states (Penny, Pete, Mina) per authenticated user
    - Persist model provider preference per authenticated user
    - Persist technical depth and communication preferences
    - Reactively reload user configuration when authenticating or switching identities
*/

import { authService } from "./auth-service.js";
import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";

class UserSettingsManager {
  #profile = null;
  #settings = null;
  #isInitialized = false;

  constructor() {
    globalBus.on("auth:changed", async () => {
      await this.reloadUserSettings();
    });
  }

  async init() {
    if (this.#isInitialized) return { profile: this.#profile, settings: this.#settings };
    await this.reloadUserSettings();
    this.#isInitialized = true;
    return { profile: this.#profile, settings: this.#settings };
  }

  async reloadUserSettings() {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        this.#profile = data.profile;
        this.#settings = data.settings;

        globalBus.emit("user-settings:loaded", {
          profile: this.#profile,
          settings: this.#settings
        });
      }
    } catch (err) {
      console.warn("[UserSettingsManager] Failed to load user profile/settings from server:", err);
    }
  }

  getProfile() {
    return this.#profile ? { ...this.#profile } : null;
  }

  getSettings() {
    return this.#settings ? { ...this.#settings } : null;
  }

  /**
   * Updates user profile fields on the server.
   * @param {Object} partialProfile
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(partialProfile) {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(partialProfile)
      });
      if (res.ok) {
        const data = await res.json();
        this.#profile = data.profile;
        Analytics.track("Profile", "Updated", { uid: this.#profile.uid });
        globalBus.emit("user-profile:updated", { profile: this.#profile });
        return this.#profile;
      }
    } catch (err) {
      console.error("[UserSettingsManager] Error updating profile:", err);
    }
    return this.#profile;
  }

  /**
   * Updates user settings fields on the server.
   * @param {Object} partialSettings
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(partialSettings) {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(partialSettings)
      });
      if (res.ok) {
        const data = await res.json();
        this.#settings = data.settings;
        Analytics.track("Settings", "Updated", { settings: Object.keys(partialSettings) });
        globalBus.emit("user-settings:updated", { settings: this.#settings });
        return this.#settings;
      }
    } catch (err) {
      console.error("[UserSettingsManager] Error updating settings:", err);
    }
    return this.#settings;
  }

  /**
   * Helper to persist enabled character list for current user.
   * @param {Array<string>} enabledIds
   */
  async saveEnabledCharacters(enabledIds) {
    if (this.#settings) {
      this.#settings.enabledCharacters = enabledIds;
    }
    await this.updateSettings({ enabledCharacters: enabledIds });
  }

  /**
   * Helper to persist model provider for current user.
   * @param {string} providerKey
   */
  async saveModelProvider(providerKey) {
    if (this.#settings) {
      this.#settings.activeModelProvider = providerKey;
    }
    await this.updateSettings({ activeModelProvider: providerKey });
  }
}

export const userSettingsManager = new UserSettingsManager();
