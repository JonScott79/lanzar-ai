/*
    provider-factory.js

    Factory for creating and switching LANZAR AI model providers.

    Responsibilities
    - Instantiate model providers based on user or environment configuration
    - Maintain single source of truth for active inference backend
    - Support runtime switching between Simulated Triad and LANZAR-001 PyTorch engine
*/

import { StubModelProvider } from "./stub-provider.js";
import { Lanzar001Provider } from "./local-provider.js";
import { HostedModelProvider } from "./hosted-provider.js";
import { STORAGE_KEYS } from "../config.js";
import { globalBus } from "../core/event-bus.js";

// =====================================
// Provider Factory Class
// =====================================

export class ProviderFactory {
  static #providers = new Map();
  static #activeProviderKey = "stub";
  static #activeProvider = null;
  static #initialized = false;

  // =====================================
  // Registration & Retrieval
  // =====================================

  static init() {
    if (this.#initialized) return;

    const stub = new StubModelProvider();
    const lanzar001 = new Lanzar001Provider("http://localhost:5050");
    const hosted = new HostedModelProvider("/api/inference");

    this.register("stub", stub);
    this.register("lanzar-001", lanzar001);
    this.register("hosted", hosted);

    // Restore saved provider preference (default to stub / local simulated triad)
    let savedKey = "stub";
    try {
      savedKey = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL_PROVIDER) || "stub";
    } catch (e) {
      console.warn("[ProviderFactory] Failed to read model provider from storage:", e);
    }

    if (this.#providers.has(savedKey)) {
      this.#activeProviderKey = savedKey;
      this.#activeProvider = this.#providers.get(savedKey);
    } else {
      this.#activeProviderKey = "stub";
      this.#activeProvider = stub;
    }

    this.#initialized = true;
  }

  static register(key, providerInstance) {
    this.#providers.set(key, providerInstance);
  }

  static getProvider(key = "stub") {
    if (!this.#initialized) this.init();
    if (!this.#providers.has(key)) {
      console.warn(`[ProviderFactory] Provider "${key}" not registered. Falling back to stub.`);
      return this.#providers.get("stub");
    }
    return this.#providers.get(key);
  }

  static getActiveProvider() {
    if (!this.#initialized) this.init();
    return this.#activeProvider;
  }

  static getActiveProviderKey() {
    if (!this.#initialized) this.init();
    return this.#activeProviderKey;
  }

  static getAllProviders() {
    if (!this.#initialized) this.init();
    return Array.from(this.#providers.entries()).map(([key, provider]) => ({
      key,
      name: provider.name,
      type: provider.providerType,
      instance: provider
    }));
  }

  static setActiveProvider(key) {
    if (!this.#initialized) this.init();
    if (this.#providers.has(key)) {
      this.#activeProviderKey = key;
      this.#activeProvider = this.#providers.get(key);

      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL_PROVIDER, key);
      } catch (e) {
        console.warn("[ProviderFactory] Failed to persist active provider key:", e);
      }

      globalBus.emit("provider:changed", {
        key,
        provider: this.#activeProvider
      });
      return true;
    }
    return false;
  }
}
