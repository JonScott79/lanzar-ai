/*
    brain-package-loader.js

    Standardized LANZAR Brain Package Loader & Validator.

    Responsibilities:
    - Validate Brain Package Manifests (JSON or Module Objects)
    - Enforce required metadata (id, name, capabilities, domainAffinities, modelConfig, systemPrompt)
    - Instantiate verified Character entities ready for registration in PersonaManager
    - Provide hot-pluggable discovery abstractions
*/

import { Character } from "./character.js";

export class BrainPackageLoader {
  /**
   * Validates a raw Brain Package manifest against the LANZAR Persona Specification.
   * @param {Object} manifest
   * @returns {{ valid: boolean, errors: string[], manifest?: Object }}
   */
  static validateManifest(manifest) {
    const errors = [];
    if (!manifest || typeof manifest !== "object") {
      return { valid: false, errors: ["Brain package manifest must be a non-null object."] };
    }

    // Required Identity Fields
    if (!manifest.id || typeof manifest.id !== "string" || !/^[a-z0-9_-]+$/i.test(manifest.id)) {
      errors.push("Invalid or missing 'id' (must be alphanumeric string with dashes/underscores).");
    }
    if (!manifest.name || typeof manifest.name !== "string") {
      errors.push("Missing required field 'name'.");
    }
    if (!manifest.role || typeof manifest.role !== "string") {
      errors.push("Missing required field 'role'.");
    }

    // Capabilities and Domains
    if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
      errors.push("'capabilities' must be a non-empty array of strings.");
    }
    if (!Array.isArray(manifest.domainAffinities)) {
      errors.push("'domainAffinities' must be an array of strings.");
    }

    // Model Configuration
    if (!manifest.modelConfig || typeof manifest.modelConfig !== "object") {
      errors.push("Missing 'modelConfig' object.");
    } else {
      if (!manifest.modelConfig.systemPrompt || (typeof manifest.modelConfig.systemPrompt !== "string" && typeof manifest.modelConfig.systemPrompt !== "function")) {
        errors.push("'modelConfig.systemPrompt' is required (must be string or function).");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      manifest: errors.length === 0 ? manifest : undefined
    };
  }

  /**
   * Instantiates a Character from a validated Brain Package manifest.
   * @param {Object} manifest
   * @returns {Character}
   */
  static createCharacterFromManifest(manifest) {
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Cannot load Brain Package: ${validation.errors.join("; ")}`);
    }

    return new Character({
      id: manifest.id,
      name: manifest.name,
      shortName: manifest.shortName || manifest.name,
      fullName: manifest.fullName || manifest.name,
      title: manifest.title || "",
      codeName: manifest.codeName || manifest.id.toUpperCase().slice(0, 4),
      role: manifest.role,
      roleSummary: manifest.roleSummary || manifest.role,
      cognitiveStyle: manifest.cognitiveStyle || "Autonomous Specialist",
      capabilities: manifest.capabilities || [],
      domainAffinities: manifest.domainAffinities || [],
      toolAffinities: manifest.toolAffinities || [],
      addressAliases: manifest.addressAliases || [manifest.id, manifest.name.toLowerCase()],
      visualIdentity: {
        avatar: manifest.visualIdentity?.avatar || "assets/icons/favicon.svg",
        headshot: manifest.visualIdentity?.headshot || "assets/icons/favicon.svg",
        accentColor: manifest.visualIdentity?.accentColor || "var(--atomic-gold)",
        badgeClass: manifest.visualIdentity?.badgeClass || ""
      },
      modelConfig: {
        providerKey: manifest.modelConfig?.providerKey || "stub",
        model: manifest.modelConfig?.model || "LANZAR-001",
        temperature: manifest.modelConfig?.temperature ?? 0.7,
        maxTokens: manifest.modelConfig?.maxTokens ?? 350,
        systemPrompt: manifest.modelConfig?.systemPrompt || ""
      },
      personality: {
        description: manifest.personality?.description || "",
        voice: manifest.personality?.voice || "",
        tagline: manifest.personality?.tagline || "",
        motto: manifest.personality?.motto || "",
        temperament: manifest.personality?.temperament || "",
        traits: manifest.personality?.traits || [],
        spokenIntro: manifest.personality?.spokenIntro || ""
      },
      enabled: manifest.enabled ?? true
    });
  }
}
