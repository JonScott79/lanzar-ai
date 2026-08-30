/*
    workbench-modal.js

    Interactive Atomic Age Laboratory Workbench Controller for LANZAR AI.

    Responsibilities:
    - Host interactive instruments: Equation Solver (Pete), Brainstorm Pad (Penny), Diagram Studio (Mina)
    - Provide real-time mathematical calculations, ideation clustering, and vector blueprint previews
    - Export findings directly into the active conversation thread with character signatures
*/

import { EquationSolver, EQUATIONS } from "../tools/equation-solver.js";
import { BrainstormPad } from "../tools/brainstorm-pad.js";
import { DiagramStudio, DIAGRAM_TEMPLATES } from "../tools/diagram-studio.js";
import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";

export class WorkbenchModalController {
  #container = null;
  #conversationManager = null;
  #activeToolId = "equation-solver";
  #selectedEquationId = "thrust-isp";
  #selectedDiagramId = "regen-chamber";
  #equationInputs = {};

  constructor(containerElement, conversationManager) {
    this.#container = containerElement;
    this.#conversationManager = conversationManager;
    this.#initInputs();
    this.#init();
  }

  #initInputs() {
    const eq = EquationSolver.getEquation(this.#selectedEquationId);
    this.#equationInputs = {};
    eq.params.forEach(p => {
      this.#equationInputs[p.id] = p.default;
    });
  }

  #init() {
    if (!this.#container) return;
    this.#render();
    this.#bindEvents();

    globalBus.on("tool:launched", (data) => {
      if (data && data.tool) {
        this.open(data.tool.id);
      }
    });

    globalBus.on("tool:selected", (data) => {
      if (data && data.toolId) {
        this.open(data.toolId);
      }
    });
  }

  open(toolId = "equation-solver") {
    this.#activeToolId = toolId;
    this.#render();
    this.#bindEvents();
    const backdrop = this.#container.querySelector("#workbenchBackdrop");
    backdrop?.classList.add("open");
  }

  close() {
    const backdrop = this.#container.querySelector("#workbenchBackdrop");
    backdrop?.classList.remove("open");
  }

  #render() {
    let toolContent = "";

    if (this.#activeToolId === "equation-solver") {
      toolContent = this.#renderEquationSolver();
    } else if (this.#activeToolId === "brainstorm-pad") {
      toolContent = this.#renderBrainstormPad();
    } else if (this.#activeToolId === "diagram-studio") {
      toolContent = this.#renderDiagramStudio();
    } else {
      toolContent = this.#renderGenericTool();
    }

    this.#container.innerHTML = `
      <div class="modal-backdrop" id="workbenchBackdrop" role="dialog" aria-modal="true" aria-labelledby="workbenchModalTitle">
        <div class="modal-window workbench-modal-window" style="max-width: 780px; width: 95%;">
          
          <header class="modal-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h2 class="modal-title" id="workbenchModalTitle">🧪 LANZAR Lab Workbench</h2>
              <span class="trait-pill" style="background: rgba(42, 114, 143, 0.15); color: var(--retro-teal);">Interactive Instrument</span>
            </div>
            <button class="btn btn-icon" id="btnCloseWorkbench" aria-label="Close Workbench" style="background: rgba(0,0,0,0.06); color: var(--deep-navy);">
              ✕
            </button>
          </header>

          <!-- Instrument Switcher Bar -->
          <div style="display: flex; gap: 0.5rem; padding: 0.75rem 1.25rem; background: rgba(30,48,60,0.04); border-bottom: 1px solid var(--border-subtle); overflow-x: auto;">
            <button type="button" class="btn btn-secondary btn-tab-tool ${this.#activeToolId === 'equation-solver' ? 'active' : ''}" data-tool="equation-solver" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
              📐 Equation Solver (Pete)
            </button>
            <button type="button" class="btn btn-secondary btn-tab-tool ${this.#activeToolId === 'brainstorm-pad' ? 'active' : ''}" data-tool="brainstorm-pad" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
              💡 Brainstorm Pad (Penny)
            </button>
            <button type="button" class="btn btn-secondary btn-tab-tool ${this.#activeToolId === 'diagram-studio' ? 'active' : ''}" data-tool="diagram-studio" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
              🎨 Diagram Studio (Mina)
            </button>
          </div>

          <div class="modal-body" style="padding: 1.25rem;">
            ${toolContent}
          </div>

        </div>
      </div>
    `;
  }

  // =====================================
  // 1. Equation Solver Renderer
  // =====================================

  #renderEquationSolver() {
    const eq = EquationSolver.getEquation(this.#selectedEquationId);
    const result = eq.solve(this.#equationInputs);

    return `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <label class="setting-label" for="selectEquation" style="font-size: 0.85rem;">Formula Catalog</label>
            <select id="selectEquation" class="setting-select" style="min-width: 280px; padding: 0.45rem;">
              ${EQUATIONS.map(e => `
                <option value="${e.id}" ${e.id === this.#selectedEquationId ? "selected" : ""}>
                  ${e.name} (${e.category})
                </option>
              `).join("")}
            </select>
          </div>
          <span class="trait-pill" style="background: rgba(36, 88, 115, 0.15); color: #245873;">🔬 Lead: Pete</span>
        </div>

        <div style="background: #ffffff; border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 0.85rem;">
          <div style="font-family: monospace; font-size: 0.95rem; color: var(--deep-navy); font-weight: bold; margin-bottom: 0.25rem;">
            Formula: ${eq.formulaLatex}
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${eq.description}</p>
        </div>

        <!-- Input Parameters Grid -->
        <div>
          <h4 style="font-family: var(--font-heading); font-size: 0.9rem; color: var(--deep-navy); margin-bottom: 0.5rem;">
            Input Variables
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            ${eq.params.map(p => `
              <div style="background: rgba(43, 109, 133, 0.04); padding: 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; color: var(--deep-navy); margin-bottom: 0.25rem;">
                  <span>${p.label}</span>
                  <span id="val_${p.id}">${this.#equationInputs[p.id] ?? p.default} ${p.unit}</span>
                </div>
                <input type="range" class="eq-param-slider" data-param="${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${this.#equationInputs[p.id] ?? p.default}" style="width: 100%; cursor: pointer;" />
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Output Report Card -->
        <div style="background: #0f1c24; color: #ffffff; border-radius: var(--radius-md); padding: 1rem; font-family: monospace;">
          <div style="font-size: 0.75rem; color: var(--atomic-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem;">
            ✦ PETE'S ANALYTICAL DERIVATION ✦
          </div>
          <div style="font-size: 1.05rem; font-weight: bold; margin-bottom: 0.75rem; color: #4fd1c5;">
            ${result.summary}
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; color: #cbd5e0;">
            ${result.details.map(d => `<div>• ${d}</div>`).join("")}
          </div>
        </div>

        <!-- Export Action -->
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
          <button type="button" class="btn btn-primary" id="btnExportEquation" style="font-size: 0.85rem; padding: 0.55rem 1.25rem;">
            📤 Export Derivation to Active Conversation
          </button>
        </div>

      </div>
    `;
  }

  // =====================================
  // 2. Brainstorm Pad Renderer
  // =====================================

  #renderBrainstormPad() {
    const ideasData = BrainstormPad.generateIdeas("Regenerative Cooling Micro-Swirls");

    return `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--deep-navy); margin-bottom: 0.15rem;">
              💡 Brainstorm Pad & Divergence Mapper
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
              High-velocity hypothesis generation and rapid prototyping concepts.
            </p>
          </div>
          <span class="trait-pill" style="background: rgba(230, 81, 0, 0.15); color: #e65100;">👩‍🚀 Lead: Penny</span>
        </div>

        <!-- Ideation Categories Grid -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${ideasData.categories.map(cat => `
            <div style="background: #ffffff; border: 1px solid var(--border-medium); border-left: 4px solid ${cat.color}; border-radius: var(--radius-sm); padding: 0.85rem;">
              <h4 style="font-family: var(--font-heading); font-size: 0.9rem; color: ${cat.color}; margin-bottom: 0.5rem;">
                ${cat.name}
              </h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${cat.ideas.map(item => `
                  <div style="background: rgba(0,0,0,0.02); padding: 0.5rem; border-radius: var(--radius-xs);">
                    <div style="font-weight: 700; font-size: 0.82rem; color: var(--deep-navy);">${item.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">${item.description}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Export Action -->
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
          <button type="button" class="btn btn-primary" id="btnExportBrainstorm" style="background: #e65100; font-size: 0.85rem; padding: 0.55rem 1.25rem;">
            📤 Export Ideation to Active Conversation
          </button>
        </div>

      </div>
    `;
  }

  // =====================================
  // 3. Diagram Studio Renderer
  // =====================================

  #renderDiagramStudio() {
    const template = DiagramStudio.getTemplate(this.#selectedDiagramId);
    const svgCode = template.generateSvg();

    return `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <label class="setting-label" for="selectDiagram" style="font-size: 0.85rem;">Blueprint Template</label>
            <select id="selectDiagram" class="setting-select" style="min-width: 300px; padding: 0.45rem;">
              ${DIAGRAM_TEMPLATES.map(t => `
                <option value="${t.id}" ${t.id === this.#selectedDiagramId ? "selected" : ""}>
                  ${t.name}
                </option>
              `).join("")}
            </select>
          </div>
          <span class="trait-pill" style="background: rgba(211, 47, 63, 0.15); color: #d32f3f;">🎨 Lead: Mina</span>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${template.description}</p>

        <!-- Live Vector Blueprint Preview -->
        <div style="border: 1px solid var(--border-medium); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-small);">
          ${svgCode}
        </div>

        <!-- Export Action -->
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
          <button type="button" class="btn btn-primary" id="btnExportDiagram" style="background: #d32f3f; font-size: 0.85rem; padding: 0.55rem 1.25rem;">
            📤 Export Blueprint to Active Conversation
          </button>
        </div>

      </div>
    `;
  }

  #renderGenericTool() {
    return `
      <div style="text-align: center; padding: 2rem 1rem;">
        <h3 style="font-family: var(--font-heading); font-size: 1.2rem; color: var(--deep-navy); margin-bottom: 0.5rem;">
          Tool Initialized
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          This instrument is linked to active project blueprints.
        </p>
      </div>
    `;
  }

  // =====================================
  // Event Bindings
  // =====================================

  #bindEvents() {
    const btnClose = this.#container.querySelector("#btnCloseWorkbench");
    const backdrop = this.#container.querySelector("#workbenchBackdrop");
    const tabButtons = this.#container.querySelectorAll(".btn-tab-tool");

    btnClose?.addEventListener("click", () => this.close());
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) this.close();
    });

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool");
        this.open(tool);
      });
    });

    // Equation Solver bindings
    const selectEquation = this.#container.querySelector("#selectEquation");
    selectEquation?.addEventListener("change", (e) => {
      this.#selectedEquationId = e.target.value;
      this.#initInputs();
      this.#render();
      this.#bindEvents();
    });

    this.#container.querySelectorAll(".eq-param-slider").forEach(slider => {
      slider.addEventListener("input", (e) => {
        const paramId = slider.getAttribute("data-param");
        const val = parseFloat(slider.value);
        this.#equationInputs[paramId] = val;

        const valSpan = this.#container.querySelector(`#val_${paramId}`);
        const eq = EquationSolver.getEquation(this.#selectedEquationId);
        const pDef = eq.params.find(p => p.id === paramId);
        if (valSpan && pDef) {
          valSpan.textContent = `${val} ${pDef.unit}`;
        }
      });
      slider.addEventListener("change", () => {
        this.#render();
        this.#bindEvents();
      });
    });

    // Diagram Studio Template change
    const selectDiagram = this.#container.querySelector("#selectDiagram");
    selectDiagram?.addEventListener("change", (e) => {
      this.#selectedDiagramId = e.target.value;
      this.#render();
      this.#bindEvents();
    });

    // Export Buttons
    const btnExportEq = this.#container.querySelector("#btnExportEquation");
    btnExportEq?.addEventListener("click", async () => {
      const eq = EquationSolver.getEquation(this.#selectedEquationId);
      const res = eq.solve(this.#equationInputs);
      const content = `### 📐 Pete's Analytical Derivation: ${eq.name}\n\n**Formula:** \`${eq.formulaLatex}\`\n\n${res.summary}\n\n${res.details.map(d => `• ${d}`).join("\n")}\n\n*Computed via Pete's Equation Solver instrument in LANZAR Lab.*`;
      
      if (this.#conversationManager) {
        await this.#conversationManager.addMessage({
          role: "assistant",
          content,
          persona: "pete",
          authorName: "Pete"
        });
      }
      this.close();
      globalBus.emit("action:start-chat", { persona: "pete" });
    });

    const btnExportBrainstorm = this.#container.querySelector("#btnExportBrainstorm");
    btnExportBrainstorm?.addEventListener("click", async () => {
      const content = `### 💡 Penny's Brainstorm Pad: Regenerative Cooling\n\n• **Lattice Metamaterials:** Additive 3D gyroid TPMS ribs for 300% surface area increase.\n• **Avian Counter-Current:** Vascular micro-channels equalizing throat delta-P.\n• **Optic Bragg Array:** Real-time embedded thermal sensors for millisecond wall mapping.\n\n*Generated via Penny's Brainstorm Pad instrument in LANZAR Lab.*`;
      
      if (this.#conversationManager) {
        await this.#conversationManager.addMessage({
          role: "assistant",
          content,
          persona: "penny",
          authorName: "Penny"
        });
      }
      this.close();
      globalBus.emit("action:start-chat", { persona: "penny" });
    });

    const btnExportDiagram = this.#container.querySelector("#btnExportDiagram");
    btnExportDiagram?.addEventListener("click", async () => {
      const t = DiagramStudio.getTemplate(this.#selectedDiagramId);
      const content = `### 🎨 Mina's Technical Blueprint: ${t.name}\n\n${t.description}\n\n\`\`\`\n+-------------------------------------------------------+\n| LANZAR LAB • BLUEPRINT NO. CC-402 • REGEN CHANNEL    |\n| Outer Jacket: Inconel-718 (High-Pressure Structural)  |\n| Coolant Channel: RP-1 / LCH4 Cryogenic Passages       |\n| Hot Gas Liner: GRCop-84 (1.2mm Copper-Zirconium)      |\n| Core Boundary: 3400 K Combustion Hot Zone             |\n+-------------------------------------------------------+\n\`\`\`\n\n*Rendered via Mina's Diagram Studio in LANZAR Lab.*`;
      
      if (this.#conversationManager) {
        await this.#conversationManager.addMessage({
          role: "assistant",
          content,
          persona: "mina",
          authorName: "Mina"
        });
      }
      this.close();
      globalBus.emit("action:start-chat", { persona: "mina" });
    });
  }
}
