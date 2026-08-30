/*
    persona-manager.js

    Orchestrates the Dynamic Personality Registry & Control Surface for LANZAR AI.

    Responsibilities
    - Maintain the authoritative registry of independent AI personas (Penny, Pete, Mina, etc.)
    - Manage ENABLED / DISABLED states (controlling eligibility for cognitive routing & collaboration)
    - Manage DIRECT SELECTION states (locking focus to an individual mind vs. The LANZAR Way)
    - Persist user configuration per personality
    - Emit lifecycle events across the system for reactive UI updates
*/

import { PennyPersona } from "./penny.js";
import { PetePersona } from "./pete.js";
import { MinaPersona } from "./mina.js";
import { BrainPackageLoader } from "./brain-package-loader.js";
import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";
import { STORAGE_KEYS } from "../config.js";
import { userSettingsManager } from "../auth/user-settings-manager.js";

// =====================================
// Persona Manager / Registry Class
// =====================================

export class PersonaManager {
  #registry = new Map(); // id -> BasePersona instance
  #enabledStates = new Map(); // id -> boolean
  #selectedPersonaId = "auto"; // 'auto' (The LANZAR Way) | specific persona id
  #perspectiveMode = "auto"; // 'auto' | 'penny' | 'pete' | 'mina' | 'direct'
  #banterFrequency = "natural"; // 'natural' | 'high' | 'minimal' | 'off'
  #statusMap = new Map(); // id -> 'available' | 'active' | 'thinking' | 'disabled'
  #minaMathCompetenceDiscovered = false;

  // =====================================
  // Initialization & Boot
  // =====================================

  constructor() {
    // 1. Register Core Personalities
    this.register(new PennyPersona());
    this.register(new PetePersona());
    this.register(new MinaPersona());

    // 2. Load Persisted Enabled States
    this.#loadPersistedStates();

    // 2b. Load Mina Math Competence Discovered State
    try {
      if (typeof localStorage !== "undefined") {
        const savedMinaMath = localStorage.getItem("lanzar_ai_mina_math_competence_discovered");
        if (savedMinaMath === "true") {
          this.#minaMathCompetenceDiscovered = true;
        }
      }
    } catch { /* Node test environment fallback */ }

    // 3. Load Persisted Selection
    let savedSelected = null;
    try {
      if (typeof localStorage !== "undefined") {
        savedSelected = localStorage.getItem(STORAGE_KEYS.SELECTED_PERSONA);
      }
    } catch { /* Node test environment fallback */ }

    if (savedSelected && (savedSelected === "auto" || this.isPersonaEnabled(savedSelected))) {
      this.#selectedPersonaId = savedSelected;
    } else {
      this.#selectedPersonaId = "auto";
    }

    // 4. Load Legacy Perspective Mode (Settings fallback)
    try {
      if (typeof localStorage !== "undefined") {
        const savedMode = localStorage.getItem("lanzar_ai_perspective_mode");
        if (savedMode) {
          this.#perspectiveMode = savedMode;
        }
      }
    } catch { /* Node test environment fallback */ }

    // 5. Listen for user settings sync from server
    globalBus.on("user-settings:loaded", (data) => {
      if (data && data.settings && Array.isArray(data.settings.enabledCharacters)) {
        this.loadUserCharacterSettings(data.settings.enabledCharacters);
      }
    });

    globalBus.on("user-settings:updated", (data) => {
      if (data && data.settings && Array.isArray(data.settings.enabledCharacters)) {
        this.loadUserCharacterSettings(data.settings.enabledCharacters);
      }
    });
  }

  #loadPersistedStates() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEYS.PERSONA_ENABLED_STATES);
        if (raw) {
          const parsed = JSON.parse(raw);
          for (const [id, enabled] of Object.entries(parsed)) {
            if (this.#registry.has(id)) {
              this.#enabledStates.set(id, Boolean(enabled));
              const persona = this.#registry.get(id);
              persona.enabled = Boolean(enabled);
              persona.status = enabled ? "available" : "disabled";
            }
          }
        }
      }
    } catch (e) {
      console.warn("[PersonaManager] Could not load persisted persona states:", e);
    }

    // Ensure all registered personas have default state (true)
    for (const [id, persona] of this.#registry.entries()) {
      if (!this.#enabledStates.has(id)) {
        this.#enabledStates.set(id, true);
        persona.enabled = true;
        persona.status = "available";
      }
    }
  }

  #savePersistedStates() {
    try {
      const obj = {};
      for (const [id, enabled] of this.#enabledStates.entries()) {
        obj[id] = enabled;
      }
      localStorage.setItem(STORAGE_KEYS.PERSONA_ENABLED_STATES, JSON.stringify(obj));
    } catch (e) {
      console.warn("[PersonaManager] Failed to persist persona states:", e);
    }
  }

  // =====================================
  // Registry & Dynamic Brain Package Management
  // =====================================

  register(persona) {
    if (!persona || !persona.id) return;
    this.#registry.set(persona.id, persona);
    if (!this.#enabledStates.has(persona.id)) {
      this.#enabledStates.set(persona.id, true);
      persona.enabled = true;
      persona.status = "available";
    }
  }

  /**
   * Dynamically loads and registers a Brain Package manifest or module.
   * @param {Object} manifest
   * @returns {Character}
   */
  loadBrainPackage(manifest) {
    const character = BrainPackageLoader.createCharacterFromManifest(manifest);
    this.register(character);

    globalBus.emit("personas:changed", {
      selectedPersonaId: this.#selectedPersonaId,
      allPersonas: this.getAllPersonas()
    });
    globalBus.emit("personas:status-changed", {
      enabledPersonas: this.getEnabledPersonas()
    });

    return character;
  }

  /**
   * Unloads and unregisters a dynamically loaded persona.
   * @param {string} id
   * @returns {boolean}
   */
  unloadBrainPackage(id) {
    if (!this.#registry.has(id)) return false;
    // Protect core built-in triad minds from accidental unload
    if (["penny", "pete", "mina"].includes(id)) {
      throw new Error(`Cannot unload core built-in mind '${id}'. Use setPersonaEnabled('${id}', false) instead.`);
    }

    this.#registry.delete(id);
    this.#enabledStates.delete(id);

    if (this.#selectedPersonaId === id) {
      this.#selectedPersonaId = "auto";
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_PERSONA, "auto");
      } catch {}
    }

    globalBus.emit("personas:changed", {
      selectedPersonaId: this.#selectedPersonaId,
      allPersonas: this.getAllPersonas()
    });
    globalBus.emit("personas:status-changed", {
      enabledPersonas: this.getEnabledPersonas()
    });

    return true;
  }

  /**
   * Returns list of all installed packages with metadata.
   */
  getInstalledBrainPackages() {
    return this.getAllPersonas().map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      isCore: ["penny", "pete", "mina"].includes(p.id),
      enabled: this.isPersonaEnabled(p.id),
      capabilities: p.capabilities,
      domainAffinities: p.domainAffinities,
      toolAffinities: p.toolAffinities
    }));
  }

  getAllPersonas() {
    return Array.from(this.#registry.values());
  }

  getPersona(id) {
    return this.#registry.get(id) || null;
  }

  getPenny() {
    return this.#registry.get("penny") || null;
  }

  getPete() {
    return this.#registry.get("pete") || null;
  }

  getMina() {
    return this.#registry.get("mina") || null;
  }

  // =====================================
  // Enabled / Disabled Lifecycle
  // =====================================

  loadUserCharacterSettings(enabledList) {
    if (!Array.isArray(enabledList)) return;
    for (const [id, persona] of this.#registry.entries()) {
      const isEnabled = enabledList.includes(id);
      this.#enabledStates.set(id, isEnabled);
      persona.enabled = isEnabled;
      persona.status = isEnabled ? "available" : "disabled";
    }

    if (this.#selectedPersonaId !== "auto" && !this.isPersonaEnabled(this.#selectedPersonaId)) {
      this.#selectedPersonaId = "auto";
      localStorage.setItem(STORAGE_KEYS.SELECTED_PERSONA, "auto");
    }

    this.#savePersistedStates();

    globalBus.emit("personas:changed", {
      selectedPersonaId: this.#selectedPersonaId,
      allPersonas: this.getAllPersonas()
    });
    globalBus.emit("personas:status-changed", {
      enabledPersonas: this.getEnabledPersonas()
    });
  }

  isPersonaEnabled(id) {
    return this.#enabledStates.get(id) ?? true;
  }

  getEnabledPersonas() {
    return this.getAllPersonas().filter(p => this.isPersonaEnabled(p.id));
  }

  getDisabledPersonas() {
    return this.getAllPersonas().filter(p => !this.isPersonaEnabled(p.id));
  }

  setPersonaEnabled(id, enabled) {
    const persona = this.#registry.get(id);
    if (!persona) return false;

    const isCurrentlyEnabled = this.isPersonaEnabled(id);
    if (isCurrentlyEnabled === enabled) return true;

    this.#enabledStates.set(id, enabled);
    persona.enabled = enabled;
    persona.status = enabled ? "available" : "disabled";

    // If currently selected persona is disabled, revert selection to Auto
    if (!enabled && this.#selectedPersonaId === id) {
      this.#selectedPersonaId = "auto";
      localStorage.setItem(STORAGE_KEYS.SELECTED_PERSONA, "auto");
    }

    this.#savePersistedStates();

    // Persist to user settings on server
    userSettingsManager.saveEnabledCharacters(this.getEnabledPersonas().map(p => p.id));

    Analytics.track("Persona", enabled ? "Enabled" : "Disabled", { personaId: id });
    globalBus.emit("personas:changed", {
      personaId: id,
      enabled,
      selectedPersonaId: this.#selectedPersonaId,
      allPersonas: this.getAllPersonas()
    });
    globalBus.emit("personas:status-changed", {
      personaId: id,
      enabled,
      enabledPersonas: this.getEnabledPersonas()
    });

    return true;
  }

  // =====================================
  // Direct Selection (Focus vs. The LANZAR Way)
  // =====================================

  getSelectedPersonaId() {
    return this.#selectedPersonaId;
  }

  getSelectedPersona() {
    if (this.#selectedPersonaId === "auto") return null;
    return this.#registry.get(this.#selectedPersonaId) || null;
  }

  setSelectedPersonaId(id) {
    if (id !== "auto") {
      const persona = this.#registry.get(id);
      if (!persona || !this.isPersonaEnabled(id)) {
        console.warn(`[PersonaManager] Cannot select disabled or unknown persona: ${id}`);
        return false;
      }
    }

    this.#selectedPersonaId = id;
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_PERSONA, id);
      } catch (e) {
        console.warn("[PersonaManager] Failed to persist selected persona:", e);
      }
    }

    Analytics.track("Persona", "SelectionChanged", { selectedPersonaId: id });
    globalBus.emit("personas:changed", {
      selectedPersonaId: id,
      allPersonas: this.getAllPersonas()
    });

    return true;
  }

  setSelectedPersona(id) {
    return this.setSelectedPersonaId(id);
  }

  // =====================================
  // Real-Time Status & Thinking State
  // =====================================

  getPersonaStatus(id) {
    if (!this.isPersonaEnabled(id)) return "disabled";
    if (this.#statusMap.has(id)) return this.#statusMap.get(id);
    if (this.#selectedPersonaId === id) return "active";
    return "available";
  }

  setPersonaThinking(id, isThinking) {
    const persona = this.#registry.get(id);
    if (!persona) return;

    if (isThinking) {
      this.#statusMap.set(id, "thinking");
      persona.status = "thinking";
    } else {
      this.#statusMap.delete(id);
      persona.status = this.isPersonaEnabled(id) ? "available" : "disabled";
    }

    globalBus.emit("personas:status-changed", {
      personaId: id,
      status: persona.status
    });
  }

  // =====================================
  // Character Capability & Address Resolution
  // =====================================

  getAllCharacters() {
    return this.getAllPersonas();
  }

  getCharacter(id) {
    return this.getPersona(id);
  }

  getEnabledCharacters() {
    return this.getEnabledPersonas();
  }

  getDisabledCharacters() {
    return this.getDisabledPersonas();
  }

  isCharacterEnabled(id) {
    return this.isPersonaEnabled(id);
  }

  setCharacterEnabled(id, enabled) {
    return this.setPersonaEnabled(id, enabled);
  }

  /**
   * Finds all currently enabled characters that match direct address aliases in a query.
   * @param {string} query
   * @returns {Array<Character>}
   */
  findAddressedCharacters(query) {
    return this.getEnabledPersonas().filter(p => {
      if (typeof p.matchesAddress === "function") {
        return p.matchesAddress(query);
      }
      return false;
    });
  }

  /**
   * Finds all currently enabled characters that provide a given capability.
   * @param {string} capability
   * @returns {Array<Character>}
   */
  findCharactersByCapability(capability) {
    return this.getEnabledPersonas().filter(p => {
      if (typeof p.hasCapability === "function") {
        return p.hasCapability(capability);
      }
      return Array.isArray(p.capabilities) && p.capabilities.includes(capability);
    });
  }

  // =====================================
  // Persona Relationship & Revelation States
  // =====================================

  get isMinaMathCompetenceDiscovered() {
    return this.#minaMathCompetenceDiscovered;
  }

  setMinaMathCompetenceDiscovered(val) {
    this.#minaMathCompetenceDiscovered = Boolean(val);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lanzar_ai_mina_math_competence_discovered", this.#minaMathCompetenceDiscovered ? "true" : "false");
      }
    } catch { /* Node test environment fallback */ }
    globalBus.emit("relationship:mina-math-discovered", { discovered: this.#minaMathCompetenceDiscovered });
  }

  // =====================================
  // Legacy / Global Perspective Settings
  // =====================================

  get perspectiveMode() {
    return this.#perspectiveMode;
  }

  get banterFrequency() {
    return this.#banterFrequency;
  }

  setPerspectiveMode(mode) {
    this.#perspectiveMode = mode;
    localStorage.setItem("lanzar_ai_perspective_mode", mode);

    if (mode === "penny" || mode === "pete" || mode === "mina") {
      if (this.isPersonaEnabled(mode)) {
        this.#selectedPersonaId = mode;
      }
    } else {
      this.#selectedPersonaId = "auto";
    }

    Analytics.track("Perspective", "ModeChanged", { mode });
    globalBus.emit("perspective:changed", { mode });
    globalBus.emit("personas:changed", { selectedPersonaId: this.#selectedPersonaId });
  }

  setBanterFrequency(freq) {
    this.#banterFrequency = freq;
    Analytics.track("Perspective", "BanterChanged", { freq });
  }
}

// Named alias for Character Registry architecture
export { PersonaManager as CharacterRegistry };

