/*
    storage-adapter.js

    Persistence adapter for LANZAR AI memory layers.

    Responsibilities
    - Read/write structured data to LocalStorage with fallback error handling
    - Export and import memory snapshots
*/

// =====================================
// Storage Adapter Class
// =====================================

export class StorageAdapter {
  static get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to read key "${key}"`, e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to save key "${key}"`, e);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to remove key "${key}"`, e);
    }
  }

  static clearAll(prefix = "lanzar_ai_") {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn("[StorageAdapter] Clear failed", e);
    }
  }
}
