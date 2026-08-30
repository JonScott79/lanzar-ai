/*
    router.js

    View routing and navigation controller for LANZAR AI.

    Responsibilities
    - Switch between Launch Console (primary), Meet the Staff (secondary), and Tools Lab
    - Manage active view state, navigation tab highlights, and history
*/

import { globalBus } from "./event-bus.js";
import { Analytics } from "../analytics.js";

// =====================================
// Router Class
// =====================================

export class Router {
  #currentView = "console";
  #views = new Map();

  // =====================================
  // Initialization
  // =====================================

  constructor() {
    this.#views.set("console", document.getElementById("viewConsole"));
    this.#views.set("staff", document.getElementById("viewStaff"));
    this.#views.set("lab", document.getElementById("viewLab"));
  }

  // =====================================
  // Navigation
  // =====================================

  navigate(viewName) {
    // Fallback if legacy view name requested
    if (viewName === "hero") viewName = "staff";

    if (!this.#views.has(viewName)) {
      console.warn(`[Router] Unknown view: ${viewName}`);
      return;
    }

    this.#views.forEach((element, name) => {
      if (element) {
        if (name === viewName) {
          element.classList.add("active");
        } else {
          element.classList.remove("active");
        }
      }
    });

    this.#currentView = viewName;
    Analytics.track("Navigation", "ViewChanged", { view: viewName });
    globalBus.emit("view:changed", { view: viewName });

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  get currentView() {
    return this.#currentView;
  }
}
