/*
    event-bus.js

    Decoupled publish/subscribe event system for LANZAR AI.

    Responsibilities
    - Enable cross-component communication without hard dependencies
    - Broadcast state mutations (persona switch, new message, view change)
*/

// =====================================
// EventBus Class
// =====================================

export class EventBus {
  #listeners = new Map();

  // =====================================
  // Subscription
  // =====================================

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);

    // Return unbind function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.#listeners.has(event)) {
      return;
    }
    this.#listeners.get(event).delete(callback);
  }

  // =====================================
  // Dispatch
  // =====================================

  emit(event, data) {
    if (!this.#listeners.has(event)) {
      return;
    }
    for (const callback of this.#listeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in handler for event "${event}":`, error);
      }
    }
  }
}

export const globalBus = new EventBus();
