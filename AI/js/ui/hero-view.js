/*
    hero-view.js

    "Meet the Staff" (Penny, Pete & Mina Cognitive Showcase) controller for LANZAR AI.

    Responsibilities
    - Render character dossiers and credentials for Penelope (Penny), Peter (Pete), and Mina
    - Present Atomic Age laboratory visual environments and interactive CRT banter terminal
    - Provide seamless transition back into the primary Launch Console workspace
*/

import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";

// =====================================
// Staff View Controller
// =====================================

export class HeroViewController {
  #container = null;
  #personaManager = null;

  constructor(containerElement, personaManager) {
    this.#container = containerElement;
    this.#personaManager = personaManager;
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
    const penny = this.#personaManager.getPenny();
    const pete = this.#personaManager.getPete();
    const mina = this.#personaManager.getMina();

    this.#container.innerHTML = `
      <div class="staff-view-container">
        
        <!-- Header Masthead -->
        <header class="staff-masthead">
          <span class="hero-supertitle">✦ LANZAR AEROSPACE & INTELLIGENCE DIVISION ✦</span>
          <h1 class="staff-headline">Meet the Staff</h1>
          <p class="staff-tagline">
            Three distinct minds inhabiting one unified intelligence. From audacious hypothesis and thermodynamic proof to extraordinary visual soul.
          </p>
        </header>

        <!-- Main Character Dossiers Grid -->
        <section class="staff-dossiers-grid" aria-label="Staff Profiles">
          
          <!-- Penelope Dossier -->
          <article class="staff-card penny-staff-card" id="pennyStaffCard">
            <div class="card-ambient-glow penny-glow"></div>
            
            <div class="staff-card-header">
              <div class="staff-title-group">
                <span class="dossier-id">PERSPECTIVE ALPHA // DIV-EXP-01</span>
                <h2 class="staff-name">
                  Penelope "Penny"
                  <span class="atomic-starburst" style="color: var(--penny-coral);">✦</span>
                </h2>
                <span class="staff-rank">Chief of Possibility & Experimental Propulsion</span>
              </div>
              <div class="staff-badge badge-penny">"What if?"</div>
            </div>

            <!-- Full Character Art -->
            <div class="staff-art-wrapper">
              <img src="${penny.avatar}" alt="Penelope in vintage aerospace attire" class="staff-full-image" />
            </div>

            <div class="staff-dossier-body">
              <div class="dossier-meta-item">
                <span class="meta-label">Core Instinct:</span>
                <span class="meta-value"><strong>Act → Observe → Adapt</strong> ("Let's find out.")</span>
              </div>
              <div class="dossier-meta-item">
                <span class="meta-label">Specialties:</span>
                <span class="meta-value">Rapid prototyping, biomimetic fluid dynamics, unconventional hypotheses, creative leaps.</span>
              </div>
              <div class="dossier-meta-item">
                <span class="meta-label">Field Notes:</span>
                <span class="meta-value" style="font-style: italic; color: var(--text-secondary);">
                  "Comfortable with uncertainty. Prefers building a working test rig over debating theoretical limits."
                </span>
              </div>
            </div>
          </article>

          <!-- Peter Dossier -->
          <article class="staff-card pete-staff-card" id="peteStaffCard">
            <div class="card-ambient-glow pete-glow"></div>
            
            <div class="staff-card-header">
              <div class="staff-title-group">
                <span class="dossier-id">PERSPECTIVE BETA // DIV-SYS-02</span>
                <h2 class="staff-name">
                  Peter "Pete"
                  <span class="atomic-starburst" style="color: var(--pete-blueprint);">⚛</span>
                </h2>
                <span class="staff-rank">Director of Systems Architecture & Thermal Dynamics</span>
              </div>
              <div class="staff-badge badge-pete">"Why?"</div>
            </div>

            <!-- Full Character Art -->
            <div class="staff-art-wrapper">
              <img src="${pete.avatar}" alt="Peter in engineering flight jacket" class="staff-full-image" />
            </div>

            <div class="staff-dossier-body">
              <div class="dossier-meta-item">
                <span class="meta-label">Core Instinct:</span>
                <span class="meta-value"><strong>Understand → Discuss → Plan → Act</strong> ("Let's understand this.")</span>
              </div>
              <div class="dossier-meta-item">
                <span class="meta-label">Specialties:</span>
                <span class="meta-value">8 degrees & 2 PhDs, thermodynamic heat flux, failure-mode modeling, structural constraints, scientific rigor.</span>
              </div>
              <div class="dossier-meta-item">
                <span class="meta-label">Field Notes:</span>
                <span class="meta-value" style="font-style: italic; color: var(--text-secondary);">
                  "Examines foundational assumptions. Ensures every design has calculated safety margins and repeatable physics."
                </span>
              </div>
            </div>
          </article>

          <!-- Mina Dossier -->
          <article class="staff-card mina-staff-card" id="minaStaffCard">
            <div class="card-ambient-glow mina-glow"></div>
            
            <div class="staff-card-header">
              <div class="staff-title-group">
                <span class="dossier-id">PERSPECTIVE GAMMA // DIV-ART-03</span>
                <h2 class="staff-name">
                  Mina
                  <span class="atomic-starburst" style="color: var(--mina-crimson);">✨</span>
                </h2>
                <span class="staff-rank">Art Director & Creative Intelligence</span>
              </div>
              <div class="staff-badge badge-mina">"Does it have soul?"</div>
            </div>

            <!-- Full Character Art -->
            <div class="staff-art-wrapper">
              <img src="${mina.avatar}" alt="Mina in Atomic Age creative attire with red polka-dot bow" class="staff-full-image" />
            </div>

            <div class="staff-dossier-body">
              <div class="dossier-meta-item">
                <span class="meta-label">Core Instinct:</span>
                <span class="meta-value"><strong>Visualize → Compose → Refine → Elevate</strong> ("Does it have soul?")</span>
              </div>
              <div class="dossier-meta-item">
                <span class="meta-label">Specialties:</span>
                <span class="meta-value">Visual aesthetics, UI/UX architecture, color harmony, typography, character illustration, storytelling.</span>
              </div>
              <div class="dossier-meta-item">
                <span class="meta-label">Field Notes:</span>
                <span class="meta-value" style="font-style: italic; color: var(--text-secondary);">
                  "Extraordinary artistic intelligence paired with intense creative enthusiasm. Turns complex engineering into unforgettable visual craft."
                </span>
              </div>
            </div>
          </article>

        </section>

        <!-- Teletype CRT Banter Terminal -->
        <section class="crt-terminal-section" aria-label="Live Dialogue Teletype">
          <div class="crt-terminal-frame">
            <div class="crt-screen-header">
              <div class="crt-dots">
                <span class="crt-dot red"></span>
                <span class="crt-dot yellow"></span>
                <span class="crt-dot green"></span>
              </div>
              <span class="crt-title">TELETYPE FEED // COGNITIVE TRIAD COLLOQUY #088</span>
              <span class="crt-status">● LIVE SYNTHESIS</span>
            </div>

            <div class="crt-screen-content">
              <div class="crt-msg penny-crt">
                <span class="crt-speaker">[PENNY]:</span>
                <span class="crt-text">"I'm Penelope. Penny is fine."</span>
              </div>
              <div class="crt-msg pete-crt">
                <span class="crt-speaker">[PETE]:</span>
                <span class="crt-text">"Peter. Pete."</span>
              </div>
              <div class="crt-msg mina-crt">
                <span class="crt-speaker">[MINA]:</span>
                <span class="crt-text">"And I'm Mina! Art Director and resident creative genius!"</span>
              </div>
              <div class="crt-msg penny-crt">
                <span class="crt-speaker">[PENNY]:</span>
                <span class="crt-text">"Pete's the analytical one."</span>
              </div>
              <div class="crt-msg pete-crt">
                <span class="crt-speaker">[PETE]:</span>
                <span class="crt-text">"And Penny is the reason we have a fire extinguisher."</span>
              </div>
              <div class="crt-msg mina-crt">
                <span class="crt-speaker">[MINA]:</span>
                <span class="crt-text">"And I'm the reason the fire extinguisher has retro rocket pinstripes and looks gorgeous!"</span>
              </div>
              <div class="crt-msg penny-crt">
                <span class="crt-speaker">[PENNY]:</span>
                <span class="crt-text">"Which we all agreed was a major upgrade."</span>
              </div>
              <div class="crt-msg pete-crt">
                <span class="crt-speaker">[PETE]:</span>
                <span class="crt-text">"...It does meet aerospace contrast standards."</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Call to Action -->
        <footer class="staff-footer-cta">
          <button class="btn btn-primary btn-large" id="btnLaunchFromStaff" type="button">
            <span>🚀 Open Launch Console & Start Session</span>
          </button>
        </footer>

      </div>
    `;
  }

  // =====================================
  // Event Bindings
  // =====================================

  #bindEvents() {
    const btnLaunch = this.#container.querySelector("#btnLaunchFromStaff");
    btnLaunch?.addEventListener("click", () => {
      Analytics.track("Navigation", "LaunchFromStaffPage");
      globalBus.emit("action:start-chat");
    });
  }
}
