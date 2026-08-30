/*
    lab-view.js

    Tools & Lab workbench interface controller for LANZAR AI.

    Responsibilities
    - Render laboratory instrument catalog (Brainstorm Pad, Research Terminal, Equation Solver, etc.)
    - Handle tool launch events and project details modal/action
*/

import { LAB_TOOLS } from "../tools/tool-registry.js";
import { globalBus } from "../core/event-bus.js";

// =====================================
// Lab View Controller
// =====================================

export class LabViewController {
  #container = null;
  #memoryManager = null;

  constructor(containerElement, memoryManager) {
    this.#container = containerElement;
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
  }

  #render() {
    const activeProj = this.#memoryManager.project.getActiveProject();

    this.#container.innerHTML = `
      <div class="lab-view">
        <header style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="hero-supertitle">✦ Engineering & Scientific Laboratory ✦</span>
            <h1 class="hero-title" style="font-size: 2.2rem; margin-bottom: 0.25rem;">Tools & Lab Workbench</h1>
            <p class="hero-subtitle" style="margin: 0;">
              Atomic Age computational instruments, research terminals, and ideation workbenches.
            </p>
          </div>
          <button class="btn btn-secondary" id="btnBackToChat" type="button">
            <span>💬 Back to Conversation</span>
          </button>
        </header>

        <!-- Active Project Spotlight -->
        <section class="persona-stage-card" style="min-height: auto; padding: 1.5rem; border-top: 6px solid var(--atomic-gold);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span class="persona-code-title">Active Blueprint</span>
            <span class="trait-pill" style="background: rgba(226,184,77,0.15); color: var(--atomic-gold-dark);">
              ${activeProj ? activeProj.status : 'In Progress'} • ${activeProj ? activeProj.progress : 28}% Complete
            </span>
          </div>
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--deep-navy); margin-bottom: 0.5rem;">
            🚀 ${activeProj ? activeProj.name : 'Rocket Engine Redesign'}
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem;">
            ${activeProj ? activeProj.description : ''}
          </p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${activeProj ? activeProj.documents.map(d => `<span class="trait-pill">📄 ${d.title} (${d.date})</span>`).join("") : ''}
          </div>
        </section>

        <!-- Tools Catalog Grid -->
        <section>
          <h2 style="font-family: var(--font-heading); font-size: 1.3rem; color: var(--deep-navy); margin-bottom: 1rem;">
            Available Laboratory Instruments
          </h2>
          <div class="lab-grid">
            ${LAB_TOOLS.map(tool => `
              <article class="lab-card" data-tool-id="${tool.id}" tabindex="0" role="button" aria-label="Launch ${tool.name}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="lab-card-icon">${tool.icon}</div>
                  <span class="trait-pill">${tool.category}</span>
                </div>
                <h3 class="lab-card-title">${tool.name}</h3>
                <p class="lab-card-desc">${tool.description}</p>
                <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                  <span>Lead: <strong>${tool.lead}</strong></span>
                  <span style="color: var(--rocket-orange); font-weight: 700;">Open →</span>
                </div>
              </article>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  // =====================================
  // Event Bindings
  // =====================================

  #bindEvents() {
    const btnBack = this.#container.querySelector("#btnBackToChat");
    btnBack?.addEventListener("click", () => {
      globalBus.emit("action:start-chat", { persona: "preserve" });
    });

    const cards = this.#container.querySelectorAll(".lab-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const toolId = card.getAttribute("data-tool-id");
        const title = card.querySelector(".lab-card-title")?.textContent || toolId;
        globalBus.emit("tool:launched", { tool: { id: toolId, name: title } });
      });
    });
  }
}
