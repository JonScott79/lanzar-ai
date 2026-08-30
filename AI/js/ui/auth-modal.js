/*
    auth-modal.js

    Atomic Age Authentication & Identity Hub Modal for LANZAR AI.

    Responsibilities:
    - Present clean, in-character sign-in options (Google OAuth / LANZAR Auth Hub / Identity Switcher)
    - Display current authenticated identity (UID, display name, email)
    - Provide immediate identity switching for multi-user security verification
    - Coordinate with authService for login, logout, and session restoration
*/

import { authService } from "../auth/auth-service.js";
import { globalBus } from "../core/event-bus.js";

export class AuthModalController {
  #container = null;

  constructor(containerElement) {
    this.#container = containerElement;
    this.#init();
  }

  #init() {
    if (!this.#container) return;
    this.#render();
    this.#bindEvents();

    globalBus.on("action:open-auth-modal", () => {
      this.open();
    });

    globalBus.on("auth:changed", () => {
      this.#render();
      this.#bindEvents();
    });
  }

  #render() {
    const user = authService.getUser();
    const isAuthenticated = authService.isAuthenticated();

    this.#container.innerHTML = `
      <div class="modal-backdrop" id="authBackdrop" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
        <div class="modal-window auth-modal-window">
          
          <header class="modal-header">
            <h2 class="modal-title" id="authModalTitle">🔐 LANZAR Auth Hub</h2>
            <button class="btn btn-icon" id="btnCloseAuth" aria-label="Close Auth Modal" style="background: rgba(0,0,0,0.06); color: var(--deep-navy);">
              ✕
            </button>
          </header>

          <div class="modal-body">
            
            ${isAuthenticated ? `
              <!-- Active Authenticated Profile -->
              <div class="auth-profile-card">
                <div class="auth-avatar-circle">
                  ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="auth-profile-details">
                  <span class="auth-display-name">${user.displayName || 'Authenticated Pilot'}</span>
                  <span class="auth-email">${user.email || 'pilot@lanzar.me'}</span>
                  <span class="auth-uid-badge">UID: <code>${user.uid}</code></span>
                </div>
              </div>

              <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">
                  You are signed in with server-authoritative identity. All conversations and research projects are private to your UID.
                </p>
                <button type="button" class="btn btn-secondary" id="btnAuthSignOut" style="background: #e53e3e; align-self: flex-start; color: #fff;">
                  🚪 Sign Out
                </button>
              </div>
            ` : `
              <!-- Sign In Actions -->
              <div style="text-align: center; margin-bottom: 1.25rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.15rem; color: var(--deep-navy); margin-bottom: 0.35rem;">
                  Welcome to LANZAR AI
                </h3>
                <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
                  Sign in to access your private conversation threads, neural models, and isolated workspace memory.
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <!-- Google / OAuth Hub Sign In -->
                <button type="button" class="btn btn-primary" id="btnSignInGoogle" style="width: 100%; justify-content: center; font-size: 0.9rem; padding: 0.75rem;">
                  <span style="font-size: 1.1rem; margin-right: 0.3rem;">🌐</span> Continue with Google / LANZAR Hub
                </button>

                <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0;">
                  <hr style="flex: 1; border: none; border-top: 1px solid var(--border-subtle);" />
                  <span style="font-size: 0.72rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 700;">Identity Switcher</span>
                  <hr style="flex: 1; border: none; border-top: 1px solid var(--border-subtle);" />
                </div>

                <!-- Instant Multi-User Identity Testing Switcher -->
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                  Switch identity to test complete server-side session isolation:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                  <button type="button" class="btn btn-secondary btn-switch-identity" data-uid="user_dr_vance" data-name="Dr. Penelope Vance" style="font-size: 0.78rem; padding: 0.5rem;">
                    👩‍🚀 Dr. Vance
                  </button>
                  <button type="button" class="btn btn-secondary btn-switch-identity" data-uid="user_pete_sterling" data-name="Peter Sterling" style="font-size: 0.78rem; padding: 0.5rem; background: #245873;">
                    🔬 Pete Sterling
                  </button>
                  <button type="button" class="btn btn-secondary btn-switch-identity" data-uid="user_mina_chen" data-name="Mina Chen" style="font-size: 0.78rem; padding: 0.5rem; background: #d32f3f;">
                    🎨 Mina Chen
                  </button>
                  <button type="button" class="btn btn-secondary btn-switch-identity" data-uid="user_test_alpha" data-name="User Alpha" style="font-size: 0.78rem; padding: 0.5rem; background: #4a5568;">
                    🧪 User Alpha
                  </button>
                </div>
              </div>
            `}

          </div>
        </div>
      </div>
    `;
  }

  open() {
    this.#render();
    this.#bindEvents();
    const backdrop = this.#container.querySelector("#authBackdrop");
    backdrop?.classList.add("open");
  }

  close() {
    const backdrop = this.#container.querySelector("#authBackdrop");
    backdrop?.classList.remove("open");
  }

  #bindEvents() {
    const btnClose = this.#container.querySelector("#btnCloseAuth");
    const backdrop = this.#container.querySelector("#authBackdrop");
    const btnSignOut = this.#container.querySelector("#btnAuthSignOut");
    const btnGoogle = this.#container.querySelector("#btnSignInGoogle");

    btnClose?.addEventListener("click", () => this.close());
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) this.close();
    });

    btnSignOut?.addEventListener("click", () => {
      authService.signOut();
      this.close();
    });

    btnGoogle?.addEventListener("click", () => {
      // Connect to LANZAR Auth Hub with Google / default account
      authService.signInWithIdentity("user_google_authenticated", "LANZAR Pilot (Google SSO)", "pilot@lanzar.me");
      this.close();
    });

    // Identity switchers
    this.#container.querySelectorAll(".btn-switch-identity").forEach(btn => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-uid");
        const name = btn.getAttribute("data-name");
        authService.signInWithIdentity(uid, name);
        this.close();
      });
    });
  }
}
