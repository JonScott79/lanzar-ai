/*
    app.js

    Main application bootstrapper and orchestrator for LANZAR AI.

    Responsibilities
    - Initialize core singletons (Router, EventBus, PersonaManager, MemoryManager, ProviderFactory)
    - Default directly to Launch Console workspace
    - Coordinate navigation tab highlights and lifecycle events
*/

// =====================================
// Module Imports
// =====================================

import { Analytics } from "../analytics.js";
import { PersonaManager } from "../personas/persona-manager.js";
import { MemoryManager } from "../memory/memory-manager.js";
import { AdaptationManager } from "../adaptation/adaptation-manager.js";
import { LabController } from "../tools/lab-controller.js";
import { Router } from "./router.js";
import { ProviderFactory } from "../models/provider-factory.js";
import { ConversationManager } from "../conversations/conversation-manager.js";
import { authService } from "../auth/auth-service.js";
import { userSettingsManager } from "../auth/user-settings-manager.js";
import { userMemoryService } from "../memory/user-memory-service.js";

import { HeroViewController } from "../ui/hero-view.js";
import { ConsoleViewController } from "../ui/console-view.js";
import { LabViewController } from "../ui/lab-view.js";
import { SettingsModalController } from "../ui/settings-modal.js";
import { AuthModalController } from "../ui/auth-modal.js";
import { WorkbenchModalController } from "../ui/workbench-modal.js";
import { globalBus } from "./event-bus.js";

// =====================================
// Main Application Class
// =====================================

export class LanzarAIApp {
  #router = null;
  #personaManager = null;
  #memoryManager = null;
  #conversationManager = null;
  #adaptationManager = null;
  #labController = null;

  #staffController = null;
  #consoleController = null;
  #labControllerUI = null;
  #settingsController = null;
  #authModalController = null;
  #workbenchController = null;

  // =====================================
  // Boot Sequence
  // =====================================

  async init() {
    console.log("[LANZAR AI] Initializing Dual Mind Framework, Auth Hub, User Settings & Conversation Manager...");

    // 1. Initialize Analytics
    Analytics.init(true);
    Analytics.track("Application", "Startup");

    // 2. Initialize Auth Service & Core Subsystems
    await authService.init();
    await userSettingsManager.init();
    await userMemoryService.init();
    ProviderFactory.init();

    this.#personaManager = new PersonaManager();
    const settings = userSettingsManager.getSettings();
    if (settings) {
      if (Array.isArray(settings.enabledCharacters)) {
        this.#personaManager.loadUserCharacterSettings(settings.enabledCharacters);
      }
      if (settings.activeModelProvider) {
        ProviderFactory.setActiveProvider(settings.activeModelProvider);
      }
    }

    this.#conversationManager = new ConversationManager();
    await this.#conversationManager.init();

    this.#memoryManager = new MemoryManager(this.#conversationManager);
    this.#adaptationManager = new AdaptationManager();
    this.#labController = new LabController();
    this.#router = new Router();

    // 3. Initialize UI View Controllers
    const staffElem = document.getElementById("viewStaff");
    const consoleElem = document.getElementById("viewConsole");
    const labElem = document.getElementById("viewLab");
    const settingsElem = document.getElementById("settingsModalContainer");
    const authElem = document.getElementById("authModalContainer");
    const workbenchElem = document.getElementById("workbenchModalContainer");

    this.#staffController = new HeroViewController(staffElem, this.#personaManager);
    this.#consoleController = new ConsoleViewController(
      consoleElem,
      this.#personaManager,
      this.#memoryManager,
      this.#adaptationManager,
      this.#conversationManager
    );
    this.#labControllerUI = new LabViewController(labElem, this.#memoryManager);
    this.#settingsController = new SettingsModalController(
      settingsElem,
      this.#personaManager,
      this.#adaptationManager,
      this.#memoryManager
    );
    this.#authModalController = new AuthModalController(authElem);
    this.#workbenchController = new WorkbenchModalController(workbenchElem, this.#conversationManager);

    // 4. Bind Global Navigation Events & Auth UI
    this.#bindNavigationEvents();
    this.#updateAuthNavUI();

    globalBus.on("auth:changed", () => {
      this.#updateAuthNavUI();
    });

    // 5. Default immediately to Launch Console
    this.#router.navigate("console");
    this.#updateNavTabState("console");

    console.log("[LANZAR AI] Dual Mind Framework & Auth online. Console active.");
  }

  #updateAuthNavUI() {
    const navAuthLabel = document.getElementById("navAuthLabel");
    const btnNavAuth = document.getElementById("btnNavAuth");
    if (!navAuthLabel) return;

    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      const shortName = user.displayName ? user.displayName.split(" ")[0] : "Pilot";
      navAuthLabel.textContent = `👤 ${shortName}`;
      if (btnNavAuth) {
        btnNavAuth.style.background = "linear-gradient(135deg, #2b6d85, var(--deep-navy))";
      }
    } else {
      navAuthLabel.textContent = "🔐 Sign In";
      if (btnNavAuth) {
        btnNavAuth.style.background = "linear-gradient(135deg, var(--retro-teal), #2b6d85)";
      }
    }
  }

  // =====================================
  // Event Routing
  // =====================================

  #bindNavigationEvents() {
    const btnHome = document.getElementById("btnNavHome");
    const btnConsole = document.getElementById("btnNavConsole");
    const btnStaff = document.getElementById("btnNavStaff");
    const btnLab = document.getElementById("btnNavLab");
    const btnTheme = document.getElementById("btnNavTheme");
    const btnSettings = document.getElementById("btnNavSettings");
    const btnNavAuth = document.getElementById("btnNavAuth");

    // Initialize Theme from localStorage or system preference
    const savedTheme = localStorage.getItem("lanzar_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
    }

    const headerLogoImg = document.querySelector(".brand-logo-img");
    const updateLogo = (theme) => {
      if (headerLogoImg) {
        headerLogoImg.src = theme === "dark" 
          ? "assets/icons/logo-lanzar-ai-light.svg" 
          : "assets/icons/logo-lanzar-ai.svg";
      }
    };
    updateLogo(savedTheme);

    btnTheme?.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const nextTheme = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      document.body.classList.toggle("dark-mode", nextTheme === "dark");
      localStorage.setItem("lanzar_theme", nextTheme);
      updateLogo(nextTheme);
    });

    btnHome?.addEventListener("click", () => {
      this.#router.navigate("console");
      this.#updateNavTabState("console");
    });

    btnConsole?.addEventListener("click", () => {
      this.#router.navigate("console");
      this.#updateNavTabState("console");
    });

    btnStaff?.addEventListener("click", () => {
      this.#router.navigate("staff");
      this.#updateNavTabState("staff");
    });

    btnLab?.addEventListener("click", () => {
      this.#router.navigate("lab");
      this.#updateNavTabState("lab");
    });

    btnSettings?.addEventListener("click", () => {
      globalBus.emit("action:open-settings");
    });

    btnNavAuth?.addEventListener("click", () => {
      globalBus.emit("action:open-auth-modal");
    });

    // Start Chat Action from Staff page
    globalBus.on("action:start-chat", () => {
      this.#router.navigate("console");
      this.#updateNavTabState("console");
    });

    // Open Lab Action
    globalBus.on("action:open-lab", () => {
      this.#router.navigate("lab");
      this.#updateNavTabState("lab");
    });

    globalBus.on("view:changed", (data) => {
      this.#updateNavTabState(data.view);
    });
  }

  #updateNavTabState(activeView) {
    const btnConsole = document.getElementById("btnNavConsole");
    const btnStaff = document.getElementById("btnNavStaff");

    if (activeView === "console") {
      btnConsole?.style.setProperty("background", "linear-gradient(135deg, var(--retro-teal), #3b8fae)");
      btnConsole?.style.setProperty("color", "#ffffff");
      btnStaff?.style.setProperty("background", "rgba(30,48,60,0.08)");
      btnStaff?.style.setProperty("color", "var(--deep-navy)");
    } else if (activeView === "staff") {
      btnStaff?.style.setProperty("background", "linear-gradient(135deg, var(--retro-teal), #3b8fae)");
      btnStaff?.style.setProperty("color", "#ffffff");
      btnConsole?.style.setProperty("background", "rgba(30,48,60,0.08)");
      btnConsole?.style.setProperty("color", "var(--deep-navy)");
    } else {
      btnConsole?.style.setProperty("background", "rgba(30,48,60,0.08)");
      btnConsole?.style.setProperty("color", "var(--deep-navy)");
      btnStaff?.style.setProperty("background", "rgba(30,48,60,0.08)");
      btnStaff?.style.setProperty("color", "var(--deep-navy)");
    }
  }
}

// =====================================
// DOM Ready Bootstrap
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  const app = new LanzarAIApp();
  app.init();
});
