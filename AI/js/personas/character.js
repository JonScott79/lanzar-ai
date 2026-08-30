/*
    character.js

    Unified Character & Cognitive Personality Entity for LANZAR AI.

    Architecture:
    CHARACTER
        ↓
    MODEL CONFIGURATION
        ↓
    MODEL PROVIDER
        ↓
    MODEL

    Responsibilities:
    - Encapsulate unique identity, role, cognitive specialty, and personality
    - Decouple character definition from the underlying model provider
    - Manage character-specific model configuration (model, temperature, tokens, system prompt)
    - Expose capability matching, address alias detection, and execution abstractions
*/

// =====================================
// Character Base Class
// =====================================

export class Character {
  /**
   * @param {Object} config
   * @param {string} config.id - Unique identifier (e.g. 'penny', 'pete', 'mina')
   * @param {string} config.name - Primary display name (e.g. 'Penny')
   * @param {string} [config.shortName] - Short callsign
   * @param {string} [config.fullName] - Full formal name
   * @param {string} [config.title] - Formal title
   * @param {string} [config.codeName] - 4-letter station code
   * @param {string} config.role - Primary organizational role (e.g. "Engineer", "Scientist / Think Tank", "Art Director")
   * @param {string} [config.roleSummary] - Short tag (e.g. "Engineer • Fast")
   * @param {string} config.cognitiveStyle - Cognitive specialty (e.g. "Fast / Practical / Experimental")
   * @param {Array<string>} [config.capabilities] - Array of capability tokens
   * @param {Array<string>} [config.addressAliases] - Names/nicknames for direct addressing
   * @param {Object} [config.visualIdentity] - { avatar, headshot, accentColor, badgeClass }
   * @param {Object} [config.modelConfig] - { providerKey, model, temperature, maxTokens, systemPrompt }
   * @param {Object} [config.personality] - { description, voice, tagline, motto, temperament, traits, spokenIntro }
   * @param {boolean} [config.enabled=true] - Initial enabled state
   */
  constructor(config = {}) {
    this.id = config.id || "unnamed";
    this.name = config.name || "Unnamed";
    this.shortName = config.shortName || config.name || "Unnamed";
    this.fullName = config.fullName || config.name;
    this.title = config.title || "";
    this.codeName = config.codeName || config.id?.toUpperCase();
    this.role = config.role || "Specialist";
    this.roleSummary = config.roleSummary || config.role || "";
    this.cognitiveStyle = config.cognitiveStyle || "";
    this.capabilities = Array.isArray(config.capabilities) ? [...config.capabilities] : [];
    this.addressAliases = Array.isArray(config.addressAliases) 
      ? [...config.addressAliases] 
      : [this.id, this.name.toLowerCase()];

    // Visual Identity Assets
    this.visualIdentity = {
      avatar: config.visualIdentity?.avatar || "assets/icons/favicon.svg",
      headshot: config.visualIdentity?.headshot || "assets/icons/favicon.svg",
      accentColor: config.visualIdentity?.accentColor || "var(--atomic-gold)",
      badgeClass: config.visualIdentity?.badgeClass || ""
    };

    // Model Configuration (Decoupled from Model Provider)
    this.modelConfig = {
      providerKey: config.modelConfig?.providerKey || "stub",
      model: config.modelConfig?.model || "LANZAR-001",
      temperature: config.modelConfig?.temperature ?? 0.7,
      maxTokens: config.modelConfig?.maxTokens ?? 120,
      systemPrompt: config.modelConfig?.systemPrompt || ""
    };

    // Personality Traits & Voice
    this.personality = {
      description: config.personality?.description || "",
      voice: config.personality?.voice || "",
      tagline: config.personality?.tagline || "",
      motto: config.personality?.motto || "",
      temperament: config.personality?.temperament || "",
      traits: Array.isArray(config.personality?.traits) ? [...config.personality.traits] : [],
      spokenIntro: config.personality?.spokenIntro || ""
    };

    // Domain & Tool Affinities
    this.domainAffinities = Array.isArray(config.domainAffinities)
      ? [...config.domainAffinities]
      : (Array.isArray(config.capabilities) ? [...config.capabilities] : []);

    this.toolAffinities = Array.isArray(config.toolAffinities)
      ? [...config.toolAffinities]
      : ["web_research", "general_reasoning"];
  }

  // =====================================
  // Backward-Compatible Accessors
  // =====================================

  get avatar() { return this.visualIdentity.avatar; }
  set avatar(val) { this.visualIdentity.avatar = val; }

  get headshot() { return this.visualIdentity.headshot; }
  set headshot(val) { this.visualIdentity.headshot = val; }

  get accentColor() { return this.visualIdentity.accentColor; }
  set accentColor(val) { this.visualIdentity.accentColor = val; }

  get description() { return this.personality.description; }
  set description(val) { this.personality.description = val; }

  get voice() { return this.personality.voice; }
  set voice(val) { this.personality.voice = val; }

  get tagline() { return this.personality.tagline; }
  set tagline(val) { this.personality.tagline = val; }

  get motto() { return this.personality.motto; }
  set motto(val) { this.personality.motto = val; }

  get temperament() { return this.personality.temperament; }
  set temperament(val) { this.personality.temperament = val; }

  get traits() { return this.personality.traits; }
  set traits(val) { this.personality.traits = val; }

  get spokenIntro() { return this.personality.spokenIntro; }
  set spokenIntro(val) { this.personality.spokenIntro = val; }

  get model() { return this.modelConfig.model; }
  set model(val) { this.modelConfig.model = val; }

  // =====================================
  // Matching & Capabilities
  // =====================================

  /**
   * Evaluates if user text addresses or mentions this character.
   * @param {string} query - Lowercase query text
   * @returns {boolean}
   */
  matchesAddress(query) {
    if (!query) return false;
    return this.addressAliases.some(alias => {
      if (!alias) return false;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(alias)
        ? new RegExp(escaped, "i")
        : new RegExp(`\\b${escaped}\\b`, "i");
      return regex.test(query);
    });
  }

  /**
   * Checks if this character has a given capability.
   * @param {string} capability
   * @returns {boolean}
   */
  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  /**
   * Calculates capability relevance score against a set of task requirements.
   * @param {Array<string>} requiredCapabilities
   * @returns {number}
   */
  scoreCapabilities(requiredCapabilities = []) {
    if (!Array.isArray(requiredCapabilities) || requiredCapabilities.length === 0) return 0;
    let matches = 0;
    for (const req of requiredCapabilities) {
      if (this.capabilities.includes(req) || this.domainAffinities.includes(req)) matches++;
    }
    return matches / requiredCapabilities.length;
  }

  /**
   * Evaluates suitability of this character for an analyzed request.
   * Dynamic bidding method used by the Cognitive Router.
   *
   * @param {Object} analysis - { taskType, requiredCapabilities, domains, isCurrent, isCalculation, reasoningDepth }
   * @returns {Object} { id, name, score, taskType, reasons: string[] }
   */
  evaluateBid(analysis = {}) {
    const reasons = [];
    let score = 0;
    const reqCaps = Array.isArray(analysis.requiredCapabilities) ? analysis.requiredCapabilities : [];
    const domains = Array.isArray(analysis.domains) ? analysis.domains : [];

    // 1. Direct Capability Matches (Weight: +2.0 per matching capability)
    const ignoredConnectors = new Set(['and', 'or', 'of', 'the', 'in', 'to', 'for', 'with']);
    const matchedCaps = new Set();
    for (const cap of reqCaps) {
      if (ignoredConnectors.has(cap)) continue;
      if (this.capabilities.includes(cap)) {
        if (!matchedCaps.has(cap)) {
          matchedCaps.add(cap);
          score += 2.0;
          reasons.push(`capability:${cap}`);
        }
      } else {
        // Multi-word token match (e.g. "quantum_chemistry" matching query token "chemistry")
        const matchingCap = this.capabilities.find(c => c === cap || c.split('_').filter(part => !ignoredConnectors.has(part)).includes(cap));
        if (matchingCap && !matchedCaps.has(matchingCap)) {
          matchedCaps.add(matchingCap);
          score += 2.0;
          reasons.push(`capability:${matchingCap}`);
        }
      }
    }

    // 2. Domain & Subdomain Affinities (Weight: +2.5 per matching affinity)
    const matchedDoms = new Set();
    for (const dom of domains) {
      if (ignoredConnectors.has(dom)) continue;
      if (this.domainAffinities.includes(dom)) {
        if (!matchedDoms.has(dom)) {
          matchedDoms.add(dom);
          score += 2.5;
          reasons.push(`domain:${dom}`);
        }
      } else {
        const matchingDom = this.domainAffinities.find(d => d === dom || d.split('_').filter(part => !ignoredConnectors.has(part)).includes(dom));
        if (matchingDom && !matchedDoms.has(matchingDom)) {
          matchedDoms.add(matchingDom);
          score += 2.5;
          reasons.push(`domain:${matchingDom}`);
        }
      }
    }

    // 3. Cognitive Style Suitability
    if (analysis.reasoningDepth === "high" && (this.id === "pete" || this.role.toLowerCase().includes("scientist") || this.role.toLowerCase().includes("architect"))) {
      score += 1.5;
      reasons.push("high_reasoning_depth_suitability");
    } else if (analysis.taskType === "rapid_prototyping" && (this.id === "penny" || this.role.toLowerCase().includes("engineer"))) {
      score += 1.5;
      reasons.push("rapid_prototyping_suitability");
    } else if (analysis.taskType === "creative_direction" && (this.id === "mina" || this.role.toLowerCase().includes("art"))) {
      score += 1.5;
      reasons.push("creative_visual_suitability");
    }

    return {
      id: this.id,
      name: this.shortName || this.name || this.id,
      score: Math.round(score * 10) / 10,
      taskType: analysis.taskType || "general_inquiry",
      reasons
    };
  }

  // =====================================
  // System Prompt Synthesis
  // =====================================

  /**
   * Returns complete system prompt combining character identity and adaptation settings.
   * @param {Object} adaptation
   * @returns {string}
   */
  getSystemPrompt(adaptation = {}) {
    if (typeof this.modelConfig.systemPrompt === "function") {
      return this.modelConfig.systemPrompt(adaptation);
    }
    return this.modelConfig.systemPrompt || "";
  }

  // =====================================
  // Serialization
  // =====================================

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      shortName: this.shortName,
      fullName: this.fullName,
      title: this.title,
      codeName: this.codeName,
      role: this.role,
      roleSummary: this.roleSummary,
      cognitiveStyle: this.cognitiveStyle,
      capabilities: [...this.capabilities],
      addressAliases: [...this.addressAliases],
      visualIdentity: { ...this.visualIdentity },
      modelConfig: { ...this.modelConfig },
      personality: { ...this.personality },
      enabled: this.enabled,
      status: this.status,
      // Direct access fields for existing UI components
      avatar: this.avatar,
      headshot: this.headshot,
      accentColor: this.accentColor,
      description: this.description,
      voice: this.voice,
      tagline: this.tagline,
      motto: this.motto,
      temperament: this.temperament,
      traits: this.traits,
      spokenIntro: this.spokenIntro,
      model: this.model
    };
  }
}
