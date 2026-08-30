/*
    settings-modal.js

    Settings and Dual Mind configuration modal dialog for LANZAR AI.

    Responsibilities
    - Configure perspective dynamics (Auto, Lean Penny, Lean Pete, Direct)
    - Adjust banter frequency and user adaptation parameters
    - Inspect long-term memory facts and manage conversation buffer
*/

import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";
import { ProviderFactory } from "../models/provider-factory.js";
import { authService } from "../auth/auth-service.js";
import { userSettingsManager } from "../auth/user-settings-manager.js";
import { userMemoryService } from "../memory/user-memory-service.js";

// =====================================
// Settings Modal Controller
// =====================================

export class SettingsModalController {
  #container = null;
  #personaManager = null;
  #adaptationManager = null;
  #memoryManager = null;

  constructor(containerElement, personaManager, adaptationManager, memoryManager) {
    this.#container = containerElement;
    this.#personaManager = personaManager;
    this.#adaptationManager = adaptationManager;
    this.#memoryManager = memoryManager;
    this.#init();
  }

  // =====================================
  // Initialization & Rendering
  // =====================================

  #init() {
    if (!this.#container) return;
    this.#render();
    this.#bindEvents();

    globalBus.on("action:open-settings", () => {
      this.open();
    });

    globalBus.on("auth:changed", () => {
      this.#render();
      this.#bindEvents();
    });

    globalBus.on("user-settings:loaded", () => {
      this.#render();
      this.#bindEvents();
    });
  }

  #render() {
    const userProfile = userSettingsManager.getProfile() || {};
    const userSettings = userSettingsManager.getSettings() || {};
    const currentMode = this.#personaManager.getSelectedPersonaId();
    const currentBanter = this.#personaManager.banterFrequency;
    const currentProvider = ProviderFactory.getActiveProviderKey();
    const userMemories = userMemoryService.getMemories();
    const personas = this.#personaManager.getAllPersonas();
    const user = authService.getUser();
    const isAuthenticated = authService.isAuthenticated();

    const personaOptions = personas.map(p => {
      const isEnabled = this.#personaManager.isPersonaEnabled(p.id);
      return `<option value="${p.id}" ${currentMode === p.id ? "selected" : ""} ${!isEnabled ? "disabled" : ""}>
        Direct Focus: ${p.shortName} (${p.roleSummary || p.role})${!isEnabled ? " [Disabled]" : ""}
      </option>`;
    }).join("");

    this.#container.innerHTML = `
      <div class="modal-backdrop" id="settingsBackdrop" role="dialog" aria-modal="true" aria-labelledby="settingsModalTitle">
        <div class="modal-window">
          
          <header class="modal-header">
            <h2 class="modal-title" id="settingsModalTitle">⚙️ LANZAR AI Settings & Profile</h2>
            <button class="btn btn-icon" id="btnCloseSettings" aria-label="Close Settings" style="background: rgba(0,0,0,0.06); color: var(--deep-navy);">
              ✕
            </button>
          </header>

          <div class="modal-body">
            
            <!-- User Identity Card -->
            <div class="setting-group" style="background: rgba(43, 109, 133, 0.05); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: var(--deep-navy);">
                    👤 ${isAuthenticated ? user.displayName : 'Guest User'}
                  </span>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.15rem 0 0 0;">
                    ${isAuthenticated ? `UID: <code>${user.uid}</code> • ${user.email}` : 'Unauthenticated session'}
                  </p>
                </div>
                <button type="button" class="btn btn-secondary" id="btnSettingsOpenAuth" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
                  ${isAuthenticated ? 'Switch / Logout' : 'Sign In'}
                </button>
              </div>
            </div>

            <!-- Profile Customization Fields -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
              <div>
                <label class="setting-label" for="settingPreferredName" style="font-size: 0.8rem;">Preferred Call-Sign / Name</label>
                <input type="text" id="settingPreferredName" class="setting-select" style="padding: 0.45rem;" value="${userProfile.preferredName || userProfile.displayName || ''}" placeholder="Commander" />
              </div>
              <div>
                <label class="setting-label" for="settingOccupation" style="font-size: 0.8rem;">Role / Specialization</label>
                <input type="text" id="settingOccupation" class="setting-select" style="padding: 0.45rem;" value="${userProfile.occupation || ''}" placeholder="Propulsion Engineer" />
              </div>
            </div>

            <!-- Active Personalities Configuration -->
            <div class="setting-group">
              <label class="setting-label">Enabled AI Personalities (User Settings)</label>
              <p class="setting-hint">Enable or disable characters available for automatic multi-mind synthesis for your user account.</p>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.35rem;">
                ${personas.map(p => `
                  <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer; color: var(--deep-navy);">
                    <input type="checkbox" class="setting-persona-checkbox" data-persona-id="${p.id}" ${this.#personaManager.isPersonaEnabled(p.id) ? "checked" : ""} />
                    <strong>${p.shortName}</strong> (${p.roleSummary || p.role})
                  </label>
                `).join("")}
              </div>
            </div>

            <!-- Inference Engine Selector -->
            <div class="setting-group">
              <label class="setting-label" for="settingModelProvider">Inference Engine Backend</label>
              <p class="setting-hint">Select the neural model provider powering LANZAR AI conversations.</p>
              <select id="settingModelProvider" class="setting-select">
                <option value="hosted" ${currentProvider === "hosted" ? "selected" : ""}>☁️ LANZAR Hosted AI (Cloud Engine)</option>
                <option value="stub" ${currentProvider === "stub" ? "selected" : ""}>⚡ LANZAR Triad (Simulated Cognitive Multi-Mind)</option>
                <option value="lanzar-001" ${currentProvider === "lanzar-001" ? "selected" : ""}>⚛ LANZAR-001 Local PyTorch Engine (Port 5050)</option>
              </select>
            </div>

            <!-- Perspective Dynamics -->
            <div class="setting-group">
              <label class="setting-label" for="settingPerspectiveMode">Perspective Focus</label>
              <p class="setting-hint">Choose between automatic multi-mind routing (The LANZAR Way) or locking direct focus to a single personality.</p>
              <select id="settingPerspectiveMode" class="setting-select">
                <option value="auto" ${currentMode === "auto" ? "selected" : ""}>The LANZAR Way (Auto-Synthesize among enabled minds)</option>
                ${personaOptions}
                <option value="direct" ${currentMode === "direct" ? "selected" : ""}>Direct LANZAR Core (Factual without character framing)</option>
              </select>
            </div>

            <!-- Banter Frequency -->
            <div class="setting-group">
              <label class="setting-label" for="settingBanterFreq">Multi-Mind Banter Frequency</label>
              <p class="setting-hint">Control how frequently enabled minds debate trade-offs before reaching a conclusion.</p>
              <select id="settingBanterFreq" class="setting-select">
                <option value="natural" ${currentBanter === "natural" ? "selected" : ""}>Natural (Occurs during complex architecture & trade-offs)</option>
                <option value="high" ${currentBanter === "high" ? "selected" : ""}>Lively (Frequent collaborative dialogues)</option>
                <option value="minimal" ${currentBanter === "minimal" ? "selected" : ""}>Minimal (Direct handoffs only)</option>
                <option value="off" ${currentBanter === "off" ? "selected" : ""}>Off (Single perspective only)</option>
              </select>
            </div>

            <!-- Adaptation: Technical Depth -->
            <div class="setting-group">
              <label class="setting-label" for="settingTechDepth">Technical Explanation Depth</label>
              <select id="settingTechDepth" class="setting-select">
                <option value="standard" ${(userSettings.technicalDepth || 'advanced') === "standard" ? "selected" : ""}>Standard (Balanced context & clarity)</option>
                <option value="advanced" ${(userSettings.technicalDepth || 'advanced') === "advanced" ? "selected" : ""}>Advanced (Detailed engineering & mathematics)</option>
                <option value="deep-theoretical" ${(userSettings.technicalDepth || 'advanced') === "deep-theoretical" ? "selected" : ""}>Deep Theoretical (First-principles derivations)</option>
              </select>
            </div>

            <!-- Long-Term User Memory Management -->
            <div class="setting-group" style="border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 0.75rem; background: rgba(30, 48, 60, 0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label class="setting-label" style="margin-bottom: 0;">🧠 Long-Term User Memory (${userMemories.length})</label>
                <span style="font-size: 0.72rem; color: var(--text-muted);">Learned across conversations</span>
              </div>
              <p class="setting-hint" style="margin-bottom: 0.5rem;">Facts LANZAR has learned about your preferences, projects, and goals. You have full control to edit or forget any memory.</p>
              
              <!-- Memory List -->
              <div class="memory-list-mount" style="max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem;">
                ${userMemories.length === 0 ? `
                  <div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">
                    No long-term memories saved yet. LANZAR will learn preferences and projects as you chat, or you can add one below.
                  </div>
                ` : userMemories.map(m => `
                  <div class="memory-item-card" data-memory-id="${m.id}" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 0.4rem 0.6rem; font-size: 0.8rem;">
                    <div style="flex: 1; min-width: 0; margin-right: 0.5rem;">
                      <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.15rem;">
                        <span class="trait-pill" style="font-size: 0.68rem; padding: 0.1rem 0.35rem; text-transform: uppercase;">${m.category}</span>
                        <span style="font-size: 0.68rem; color: var(--text-muted);">${m.confidence} confidence</span>
                      </div>
                      <div class="memory-fact-text" style="color: var(--deep-navy); word-break: break-word; font-weight: 500;">
                        ${m.fact}
                      </div>
                    </div>
                    <div style="display: flex; gap: 0.25rem; flex-shrink: 0;">
                      <button type="button" class="btn btn-sm btn-delete-memory" data-memory-id="${m.id}" title="Forget this memory" style="background: none; border: none; cursor: pointer; font-size: 0.85rem; padding: 0.2rem 0.35rem; opacity: 0.7;">
                        🗑️
                      </button>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Quick Add Memory Input -->
              <div style="display: flex; gap: 0.4rem; align-items: center; background: #ffffff; padding: 0.35rem; border: 1px dashed var(--border-medium); border-radius: var(--radius-xs);">
                <select id="newMemoryCategory" style="font-size: 0.75rem; padding: 0.25rem 0.4rem; border: 1px solid var(--border-subtle); border-radius: 3px; background: #f8fafc;">
                  <option value="preference">Preference</option>
                  <option value="project">Project</option>
                  <option value="goal">Goal</option>
                  <option value="skill">Skill</option>
                  <option value="interest">Interest</option>
                  <option value="technical_context">Tech Context</option>
                </select>
                <input type="text" id="newMemoryFact" placeholder="e.g. 'Prefers Rust over C++'" style="flex: 1; font-size: 0.78rem; padding: 0.25rem 0.4rem; border: 1px solid var(--border-subtle); border-radius: 3px;" />
                <button type="button" class="btn btn-secondary" id="btnAddMemory" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; white-space: nowrap;">
                  + Add Fact
                </button>
              </div>
            </div>

            <!-- Reset Buffer Option -->
            <div class="setting-group" style="padding-top: 0.5rem; border-top: 1px solid var(--border-subtle);">
              <button class="btn btn-secondary" id="btnClearHistory" type="button" style="align-self: flex-start; background: #6d7b83; font-size: 0.8rem; padding: 0.4rem 0.9rem;">
                🧹 Clear Active Conversation Buffer
              </button>
            </div>

          </div>

          <footer class="modal-footer">
            <button class="btn btn-primary" id="btnSaveSettings" type="button">
              Save & Apply
            </button>
          </footer>

        </div>
      </div>
    `;
  }

  // =====================================
  // Modal State Controls
  // =====================================

  open() {
    this.#render();
    this.#bindEvents();
    const backdrop = this.#container.querySelector("#settingsBackdrop");
    backdrop?.classList.add("open");
  }

  close() {
    const backdrop = this.#container.querySelector("#settingsBackdrop");
    backdrop?.classList.remove("open");
  }

  // =====================================
  // Event Bindings
  // =====================================

  #bindEvents() {
    const btnClose = this.#container.querySelector("#btnCloseSettings");
    const btnSave = this.#container.querySelector("#btnSaveSettings");
    const btnClear = this.#container.querySelector("#btnClearHistory");
    const btnOpenAuth = this.#container.querySelector("#btnSettingsOpenAuth");
    const backdrop = this.#container.querySelector("#settingsBackdrop");
    const btnAddMemory = this.#container.querySelector("#btnAddMemory");

    btnClose?.addEventListener("click", () => this.close());
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) this.close();
    });

    btnOpenAuth?.addEventListener("click", () => {
      this.close();
      globalBus.emit("action:open-auth-modal");
    });

    // Delete Memory button click
    this.#container.querySelectorAll(".btn-delete-memory").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const memId = btn.getAttribute("data-memory-id");
        if (memId) {
          await userMemoryService.deleteMemory(memId);
          this.#render();
          this.#bindEvents();
        }
      });
    });

    // Add Memory button click
    btnAddMemory?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const cat = this.#container.querySelector("#newMemoryCategory")?.value;
      const fact = this.#container.querySelector("#newMemoryFact")?.value?.trim();
      if (fact) {
        await userMemoryService.addMemory({
          category: cat || "preference",
          fact,
          confidence: "high"
        });
        this.#render();
        this.#bindEvents();
      }
    });

    btnSave?.addEventListener("click", async () => {
      const modeVal = this.#container.querySelector("#settingPerspectiveMode")?.value;
      const banterVal = this.#container.querySelector("#settingBanterFreq")?.value;
      const techDepthVal = this.#container.querySelector("#settingTechDepth")?.value;
      const providerVal = this.#container.querySelector("#settingModelProvider")?.value;
      const preferredName = this.#container.querySelector("#settingPreferredName")?.value?.trim();
      const occupation = this.#container.querySelector("#settingOccupation")?.value?.trim();

      // Collect checked personas
      const enabledIds = [];
      this.#container.querySelectorAll(".setting-persona-checkbox").forEach(cb => {
        if (cb.checked) {
          enabledIds.push(cb.getAttribute("data-persona-id"));
        }
      });

      // Update PersonaManager
      this.#personaManager.loadUserCharacterSettings(enabledIds);

      if (providerVal) {
        ProviderFactory.setActiveProvider(providerVal);
      }
      if (modeVal) {
        this.#personaManager.setPerspectiveMode(modeVal);
      }
      if (banterVal) {
        this.#personaManager.setBanterFrequency(banterVal);
      }

      this.#adaptationManager.userProfile.update({
        technicalDepth: techDepthVal
      });

      // Persist to Server via userSettingsManager
      await userSettingsManager.updateProfile({
        preferredName,
        occupation
      });

      await userSettingsManager.updateSettings({
        enabledCharacters: enabledIds,
        activeModelProvider: providerVal,
        perspectiveMode: modeVal,
        banterFrequency: banterVal,
        technicalDepth: techDepthVal
      });

      Analytics.track("Settings", "Updated", { provider: providerVal, mode: modeVal, banter: banterVal, techDepth: techDepthVal });
      this.close();
    });

    btnClear?.addEventListener("click", () => {
      this.#memoryManager.shortTerm.clear();
      globalBus.emit("conversation:cleared");
      this.close();
    });
  }
}
