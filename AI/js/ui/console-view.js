/*
    console-view.js

    Launch Console and Multi-Mind Conversation Interface Controller for LANZAR AI.

    Responsibilities
    - Render interactive Personality Control Surface in left sidebar (enable/disable, direct selection, dynamic registry)
    - Render conversation stream supporting LANZAR Core, Penny, Pete, Mina, and collaborative exchanges
    - Display dynamic perspective indicator and active project telemetry
    - Provide terminal-style Command History (ArrowUp/ArrowDown) on the chat input composer
    - Coordinate message dispatch with Model Provider honoring enabled minds and direct selection
*/

import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";
import { ProviderFactory } from "../models/provider-factory.js";
import { CommandHistory } from "./command-history.js";
import { userMemoryService } from "../memory/user-memory-service.js";

// =====================================
// Console View Controller
// =====================================

export class ConsoleViewController {
  #container = null;
  #personaManager = null;
  #memoryManager = null;
  #adaptationManager = null;
  #conversationManager = null;
  #commandHistory = null;
  #isGenerating = false;

  constructor(containerElement, personaManager, memoryManager, adaptationManager, conversationManager = null) {
    this.#container = containerElement;
    this.#personaManager = personaManager;
    this.#memoryManager = memoryManager;
    this.#adaptationManager = adaptationManager;
    this.#conversationManager = conversationManager;
    this.#init();
  }

  // =====================================
  // Initialization & Rendering
  // =====================================

  #init() {
    if (!this.#container) return;

    // Initialize terminal-style command history buffer for active thread
    const initialPrompts = this.#conversationManager
      ? this.#conversationManager.getCommandHistory()
      : this.#memoryManager.shortTerm.getMessages().filter(m => m.role === "user").map(m => m.content);

    this.#commandHistory = new CommandHistory(initialPrompts);

    this.#render();
    this.#renderThreadsList();
    this.#renderPersonalityControlSurface();
    this.#bindEvents();
    this.#renderHistory();
    this.#updateModelStatus();

    // Reactive subscription to persona lifecycle changes
    globalBus.on("personas:changed", (data) => {
      this.#renderPersonalityControlSurface();
      this.#updatePerspectiveBadge();
      if (this.#conversationManager && data && data.selectedPersonaId !== undefined) {
        this.#conversationManager.updateSelectedPersona(data.selectedPersonaId);
      }
    });

    globalBus.on("personas:status-changed", () => {
      this.#renderPersonalityControlSurface();
    });

    globalBus.on("perspective:changed", () => {
      this.#renderPersonalityControlSurface();
      this.#updatePerspectiveBadge();
    });

    globalBus.on("provider:changed", () => {
      this.#updateModelStatus();
    });

    // Reactive subscription to conversation/thread events
    globalBus.on("conversation:switched", (data) => {
      this.#renderThreadsList();
      this.#renderHistory();
      if (data && data.selectedPersonaId) {
        this.#personaManager.setSelectedPersonaId(data.selectedPersonaId);
      }
      const threadPrompts = data && data.commandHistory && data.commandHistory.length > 0
        ? data.commandHistory
        : this.#memoryManager.shortTerm.getMessages().filter(m => m.role === "user").map(m => m.content);
      this.#commandHistory = new CommandHistory(threadPrompts);
      this.#renderPersonalityControlSurface();
      this.#updatePerspectiveBadge();
    });

    globalBus.on("conversations:changed", () => {
      this.#renderThreadsList();
    });

    // Check inference engine health periodically
    setInterval(() => this.#updateModelStatus(), 12000);
  }

  #render() {
    const activeProject = this.#memoryManager.project.getActiveProject();

    this.#container.innerHTML = `
      <div class="console-view">
        <div class="console-container">
          
          <!-- Console Top Bar -->
          <header class="console-header">
            <div class="header-brand" style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="assets/icons/logo-lanzar-ai-light.svg" alt="LANZAR AI" class="brand-logo-console" style="height: 32px; width: auto;" />
              <span class="persona-mode-pill mode-collaborate" id="consolePerspectiveBadge">
                <span>⚛ Cognitive Mode: Online</span>
              </span>
            </div>

            <div class="header-nav" style="display: flex; align-items: center; gap: 0.5rem;">
              <!-- Model Switcher Dropdown & Status Indicator -->
              <div class="model-switcher-wrap" aria-label="Model Engine Selector">
                <label for="consoleModelSelector" class="visually-hidden" style="display:none;">Active Engine</label>
                <select id="consoleModelSelector" class="console-model-select" title="Switch AI Inference Engine">
                  <option value="stub" selected>⚡ LANZAR Triad (Simulated Cognitive Multi-Mind)</option>
                  <option value="hosted">☁️ LANZAR Hosted AI (Cloud Engine)</option>
                  <option value="lanzar-001">⚛ LANZAR-001 PyTorch (Port 5050)</option>
                </select>
                <div class="engine-status-dot simulated" id="engineStatusDot" title="Engine Status: Simulated Triad"></div>
              </div>

              <!-- Thread Export Dropdown -->
              <div class="thread-export-dropdown" style="position: relative; display: inline-block;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnExportThread" title="Export Active Conversation Thread" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
                  📤 <span>Export</span>
                </button>
                <div class="thread-export-menu" id="threadExportMenu" style="display: none; position: absolute; right: 0; top: calc(100% + 4px); background: #1e303c; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); box-shadow: var(--shadow-medium); z-index: 100; min-width: 145px; padding: 0.25rem 0;">
                  <button type="button" class="btn-export-option" data-format="markdown" style="display: block; width: 100%; text-align: left; padding: 0.45rem 0.75rem; font-size: 0.75rem; color: #ffffff; background: none; border: none; cursor: pointer;">
                    📄 Markdown (.md)
                  </button>
                  <button type="button" class="btn-export-option" data-format="json" style="display: block; width: 100%; text-align: left; padding: 0.45rem 0.75rem; font-size: 0.75rem; color: #ffffff; background: none; border: none; cursor: pointer;">
                    📦 JSON (.json)
                  </button>
                  <button type="button" class="btn-export-option" data-format="text" style="display: block; width: 100%; text-align: left; padding: 0.45rem 0.75rem; font-size: 0.75rem; color: #ffffff; background: none; border: none; cursor: pointer;">
                    📝 Plain Text (.txt)
                  </button>
                </div>
              </div>

              <button class="btn btn-icon" id="btnConsoleOpenSettings" title="Console Settings" type="button">
                ⚙️
              </button>
            </div>
          </header>

          <!-- Console Main Workspace -->
          <div class="console-body">
            
            <!-- Sidebar with Project & Personality Control Surface -->
            <aside class="console-sidebar" aria-label="Console Navigation and Personality Control">
              <nav style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem;">
                <div class="sidebar-nav-item active" id="navItemChat">💬 Active Conversation</div>
                <div class="sidebar-nav-item" id="navItemLab">🧪 Tools & Lab</div>
              </nav>

              <!-- Conversation Threads Control Section -->
              <div class="threads-section" aria-label="Conversation Threads">
                <div class="threads-header-row">
                  <span class="threads-section-title">Threads</span>
                  <button type="button" class="btn btn-sm btn-new-thread" id="btnNewThread" title="Create New Conversation Thread">
                    + New Thread
                  </button>
                </div>
                <div class="threads-list-scroll" id="threadsListMount" role="list">
                  <!-- Rendered by #renderThreadsList -->
                </div>
              </div>

              <!-- Personality Control Surface Mount Point -->
              <div id="personalityControlMount"></div>
            </aside>

            <!-- Main Conversation Stream -->
            <main class="console-main">
              <div class="messages-stream" id="messagesStream" role="log" aria-live="polite">
                <!-- Messages rendered here -->
              </div>

              <!-- Input Dock with Disclaimer -->
              <footer class="console-input-dock">
                <form id="consoleChatForm" class="input-box-wrapper" autocomplete="off">
                  <label for="consoleChatInput" class="visually-hidden" style="display:none;">Type your message to LANZAR AI</label>
                  <input
                    type="text"
                    id="consoleChatInput"
                    class="console-input"
                    placeholder="Ask LANZAR AI anything... (e.g. 'Design a retro logo' or 'Explain rocket cooling')"
                    required
                  />
                  <button type="submit" class="btn btn-primary" id="btnSendMessage" aria-label="Send message">
                    <span>Send 🚀</span>
                  </button>
                </form>
                <div class="console-disclaimer-bar">
                  <span>AI can make mistakes. Verify important calculations. • <em>Lanzar takes no responsibility for extended hysterical AI conversations. Use at your own risk.</em></span>
                </div>
              </footer>
            </main>

          </div>
        </div>
      </div>
    `;

    this.#updatePerspectiveBadge();
  }

  // =====================================
  // Threads List Rendering & Actions
  // =====================================

  #renderThreadsList() {
    const mount = this.#container.querySelector("#threadsListMount");
    if (!mount || !this.#conversationManager) return;

    const threads = this.#conversationManager.getThreads();
    const activeId = this.#conversationManager.getActiveConversationId();

    if (threads.length === 0) {
      mount.innerHTML = `<div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); padding: 0.4rem;">No active threads</div>`;
      return;
    }

    mount.innerHTML = threads.map(t => {
      const isActive = t.id === activeId;
      return `
        <div class="thread-item ${isActive ? 'active' : ''}" data-thread-id="${t.id}" role="button" tabindex="0" title="${t.title}">
          <div class="thread-item-main">
            <span class="thread-status-dot ${isActive ? 'active' : ''}"></span>
            <span class="thread-title">${t.title}</span>
          </div>
          <div class="thread-actions">
            <button type="button" class="btn-thread-action btn-rename-thread" data-thread-id="${t.id}" title="Rename Thread" aria-label="Rename Thread">✏️</button>
            <button type="button" class="btn-thread-action btn-delete-thread" data-thread-id="${t.id}" title="Delete Thread" aria-label="Delete Thread">🗑️</button>
          </div>
        </div>
      `;
    }).join("");

    // Bind Thread Click (Switch Thread)
    mount.querySelectorAll(".thread-item").forEach(el => {
      el.addEventListener("click", (e) => {
        // Prevent switching if clicking action buttons
        if (e.target.closest(".btn-thread-action")) return;
        const threadId = el.getAttribute("data-thread-id");
        if (threadId) {
          this.#conversationManager.switchThread(threadId);
        }
      });
    });

    // Bind Rename Thread Buttons
    mount.querySelectorAll(".btn-rename-thread").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const threadId = btn.getAttribute("data-thread-id");
        const currentThread = threads.find(t => t.id === threadId);
        const newTitle = await this.#showPromptModal({
          title: "Rename Conversation",
          subtitle: "Update thread mission title",
          currentValue: currentThread ? currentThread.title : "",
          placeholder: "Enter new thread title...",
          confirmText: "Save Name",
          icon: "✏️"
        });
        if (newTitle && newTitle.trim()) {
          this.#conversationManager.renameThread(threadId, newTitle.trim());
        }
      });
    });

    // Bind Delete Thread Buttons
    mount.querySelectorAll(".btn-delete-thread").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const threadId = btn.getAttribute("data-thread-id");
        const currentThread = threads.find(t => t.id === threadId);
        const title = currentThread ? currentThread.title : "this thread";
        const confirmed = await this.#showConfirmModal({
          title: "Delete Conversation?",
          subtitle: `Are you sure you want to delete "${title}"?`,
          details: "This will permanently purge this conversation thread from your local and cloud memory. This action cannot be undone.",
          confirmText: "Delete Thread",
          cancelText: "Keep Thread",
          isDestructive: true,
          icon: "🗑️"
        });
        if (confirmed) {
          this.#conversationManager.deleteThread(threadId);
        }
      });
    });
  }

  // =====================================
  // Custom Modal & Dialog Systems
  // =====================================

  #showConfirmModal({ title, subtitle, details, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false, icon = "⚠️" }) {
    return new Promise((resolve) => {
      const existing = document.querySelector(".lanzar-modal-backdrop");
      if (existing) existing.remove();

      const backdrop = document.createElement("div");
      backdrop.className = "lanzar-modal-backdrop";
      backdrop.innerHTML = `
        <div class="lanzar-modal-card ${isDestructive ? 'destructive' : ''}" role="dialog" aria-modal="true">
          <div class="lanzar-modal-header">
            <div class="lanzar-modal-icon-badge">${icon}</div>
            <div class="lanzar-modal-titles">
              <h3 class="lanzar-modal-title">${title}</h3>
              ${subtitle ? `<p class="lanzar-modal-subtitle">${subtitle}</p>` : ''}
            </div>
            <button class="lanzar-modal-close" aria-label="Close modal">✕</button>
          </div>
          ${details ? `<div class="lanzar-modal-body"><p class="lanzar-modal-details">${details}</p></div>` : ''}
          <div class="lanzar-modal-actions">
            <button class="btn-modal-cancel">${cancelText}</button>
            <button class="btn-modal-confirm ${isDestructive ? 'danger' : 'primary'}">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add("active"));

      const cleanup = (result) => {
        backdrop.classList.remove("active");
        setTimeout(() => backdrop.remove(), 250);
        window.removeEventListener("keydown", onKeyDown);
        resolve(result);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") cleanup(false);
        if (e.key === "Enter") cleanup(true);
      };

      backdrop.querySelector(".btn-modal-cancel").addEventListener("click", () => cleanup(false));
      backdrop.querySelector(".lanzar-modal-close").addEventListener("click", () => cleanup(false));
      backdrop.querySelector(".btn-modal-confirm").addEventListener("click", () => cleanup(true));
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) cleanup(false);
      });
      window.addEventListener("keydown", onKeyDown);
    });
  }

  #showPromptModal({ title, subtitle, currentValue = "", placeholder = "", confirmText = "Save", cancelText = "Cancel", icon = "✏️" }) {
    return new Promise((resolve) => {
      const existing = document.querySelector(".lanzar-modal-backdrop");
      if (existing) existing.remove();

      const backdrop = document.createElement("div");
      backdrop.className = "lanzar-modal-backdrop";
      backdrop.innerHTML = `
        <div class="lanzar-modal-card" role="dialog" aria-modal="true">
          <div class="lanzar-modal-header">
            <div class="lanzar-modal-icon-badge">${icon}</div>
            <div class="lanzar-modal-titles">
              <h3 class="lanzar-modal-title">${title}</h3>
              ${subtitle ? `<p class="lanzar-modal-subtitle">${subtitle}</p>` : ''}
            </div>
            <button class="lanzar-modal-close" aria-label="Close modal">✕</button>
          </div>
          <div class="lanzar-modal-body">
            <input type="text" class="lanzar-modal-input" placeholder="${placeholder}" value="${currentValue}" />
          </div>
          <div class="lanzar-modal-actions">
            <button class="btn-modal-cancel">${cancelText}</button>
            <button class="btn-modal-confirm primary">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add("active"));

      const input = backdrop.querySelector(".lanzar-modal-input");
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);

      const cleanup = (val) => {
        backdrop.classList.remove("active");
        setTimeout(() => backdrop.remove(), 250);
        window.removeEventListener("keydown", onKeyDown);
        resolve(val);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") cleanup(null);
        if (e.key === "Enter") cleanup(input.value);
      };

      backdrop.querySelector(".btn-modal-cancel").addEventListener("click", () => cleanup(null));
      backdrop.querySelector(".lanzar-modal-close").addEventListener("click", () => cleanup(null));
      backdrop.querySelector(".btn-modal-confirm").addEventListener("click", () => cleanup(input.value));
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) cleanup(null);
      });
      window.addEventListener("keydown", onKeyDown);
    });
  }

  // =====================================
  // Personality Control Surface (Dynamic Left Panel)
  // =====================================

  #renderPersonalityControlSurface() {
    const mount = this.#container.querySelector("#personalityControlMount");
    if (!mount) return;

    const personas = this.#personaManager.getAllPersonas();
    const enabledCount = this.#personaManager.getEnabledPersonas().length;
    const totalCount = personas.length;
    const selectedId = this.#personaManager.getSelectedPersonaId();
    const isAuto = selectedId === "auto";

    // 1. Build Dynamic Cards HTML
    const cardsHtml = personas.map(p => {
      const isEnabled = this.#personaManager.isPersonaEnabled(p.id);
      const isSelected = selectedId === p.id;
      const status = this.#personaManager.getPersonaStatus(p.id);
      const statusClass = !isEnabled ? "disabled" : (isSelected ? "active" : (status === "thinking" ? "thinking" : "available"));

      return `
        <div class="personality-item-card ${isSelected ? 'is-selected' : ''} ${isEnabled ? 'is-enabled' : 'is-disabled'} ${status === 'thinking' ? 'is-thinking' : ''}"
             data-persona-id="${p.id}"
             role="button"
             tabindex="0"
             title="${isSelected ? 'Direct Focus Active (Click to return to Auto)' : (isEnabled ? 'Click to select ' + p.shortName : p.shortName + ' is disabled (Toggle switch to enable)')}">
          <div class="persona-item-main">
            <div class="personality-status-dot ${statusClass}" title="Status: ${status}"></div>
            <div class="persona-avatar-wrap" style="border-color: ${p.accentColor};">
              <img src="${p.headshot || p.avatar}" alt="${p.shortName}" class="persona-avatar-img" />
            </div>
            <div class="persona-info-wrap">
              <div class="persona-name-row">
                <span class="persona-name">${p.shortName}</span>
                ${isSelected ? '<span class="persona-badge-focus">FOCUS</span>' : ''}
              </div>
              <span class="persona-role-summary">${p.roleSummary || p.role}</span>
            </div>
            <button class="persona-toggle-btn ${isEnabled ? 'enabled' : 'disabled'}"
                    data-action="toggle-enabled"
                    data-persona-id="${p.id}"
                    title="${isEnabled ? 'Disable ' + p.shortName : 'Enable ' + p.shortName}"
                    type="button"
                    aria-pressed="${isEnabled}">
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
            </button>
          </div>
        </div>
      `;
    }).join("");

    mount.innerHTML = `
      <div class="persona-control-surface" aria-label="Active Minds Control Surface">
        <div class="persona-control-header">
          <span class="project-tag" style="color: var(--atomic-gold); letter-spacing: 0.08em;">ACTIVE MINDS</span>
          <span class="persona-count-badge" id="personaEnabledCountBadge" title="${enabledCount} of ${totalCount} minds enabled">${enabledCount}/${totalCount} ACTIVE</span>
        </div>

        <!-- Dynamic Registered Personalities List -->
        <div class="personality-list">
          ${cardsHtml}
        </div>
      </div>
    `;

    this.#bindPersonalityControlEvents(mount);
  }

  #bindPersonalityControlEvents(mountElement) {
    // 1. Handle Selection & Primary Focus Clicks
    const cards = mountElement.querySelectorAll(".personality-item-card");
    cards.forEach(card => {
      card.addEventListener("click", (e) => {
        // If clicking the toggle switch button, ignore card selection
        if (e.target.closest('[data-action="toggle-enabled"]')) return;

        const personaId = card.dataset.personaId;
        if (!personaId) return;

        // If clicking an enabled persona
        if (this.#personaManager.isPersonaEnabled(personaId)) {
          // If already selected, clicking again toggles back to Auto (free-form collaboration)
          if (this.#personaManager.getSelectedPersonaId() === personaId) {
            this.#personaManager.setSelectedPersonaId("auto");
          } else {
            this.#personaManager.setSelectedPersonaId(personaId);
          }
        } else {
          // Disabled persona clicked: notify user to enable
          card.classList.add("shake");
          setTimeout(() => card.classList.remove("shake"), 400);
        }
      });
    });

    // 2. Handle Enable / Disable Toggle Buttons
    const toggleBtns = mountElement.querySelectorAll('[data-action="toggle-enabled"]');
    toggleBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Do not trigger card selection
        const personaId = btn.dataset.personaId;
        if (!personaId) return;

        const currentlyEnabled = this.#personaManager.isPersonaEnabled(personaId);
        this.#personaManager.setPersonaEnabled(personaId, !currentlyEnabled);
      });
    });
  }

  // =====================================
  // Message Rendering
  // =====================================

  #renderHistory() {
    const stream = this.#container.querySelector("#messagesStream");
    if (!stream) return;

    const messages = this.#memoryManager.shortTerm.getMessages();
    stream.innerHTML = "";

    if (messages.length === 0) {
      return;
    }

    messages.forEach(msg => this.#appendMessageToDOM(msg));
    this.#scrollToBottom();
  }

  #appendMessageToDOM(msg) {
    const stream = this.#container.querySelector("#messagesStream");
    if (!stream) return;

    const isUser = msg.role === "user";
    const personaId = msg.persona || "lanzar";
    const wrap = document.createElement("div");
    wrap.className = `chat-bubble-wrap ${isUser ? "user-msg" : "ai-msg"} persona-${personaId}`;

    let authorClass = `author-${personaId}`;
    let avatarSrc = "assets/icons/favicon.svg";
    let accentColor = "var(--atomic-gold)";

    if (!isUser) {
      const personaObj = this.#personaManager ? this.#personaManager.getPersona(personaId) : null;
      if (personaObj) {
        avatarSrc = personaObj.headshot || personaObj.avatar || "assets/icons/favicon.svg";
        accentColor = personaObj.accentColor || "var(--atomic-gold)";
      } else if (personaId === "penny") {
        avatarSrc = "assets/images/characters/Penelope/penny-headshot.png";
        authorClass = "author-penny";
      } else if (personaId === "pete") {
        avatarSrc = "assets/images/characters/Peter/pete-headshot.png";
        authorClass = "author-pete";
      } else if (personaId === "mina") {
        avatarSrc = "assets/images/characters/Mina/mina-headshot.png";
        authorClass = "author-mina";
      } else {
        authorClass = "author-collab";
      }
    }

    wrap.innerHTML = `
      <div class="avatar-badge ${isUser ? "avatar-user" : ""}" style="${!isUser && accentColor ? `border-color: ${accentColor};` : ''}">
        ${isUser ? "YOU" : `<img src="${avatarSrc}" alt="${msg.authorName || 'AI'}" />`}
      </div>
      <div class="message-card" style="${!isUser && accentColor ? `border-left-color: ${accentColor};` : ''}">
        ${!isUser ? `<div class="message-author ${authorClass}" style="${accentColor ? `color: ${accentColor};` : ''}">${msg.authorName}</div>` : ""}
        <div class="message-text">${this.#formatMessageText(msg.content)}</div>
        <div class="message-meta">
          ${!isUser ? `
            <div class="message-actions">
              <button type="button" class="btn-copy-msg" aria-label="Copy message" title="Copy message" data-raw-content="${encodeURIComponent(msg.content)}">
                <span class="copy-icon">📋</span>
              </button>
            </div>
          ` : '<div></div>'}
          <span class="meta-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `;

    const textEl = wrap.querySelector(".message-text");
    this.#renderMathInElement(textEl);

    // Bind copy button listener
    const copyBtn = wrap.querySelector(".btn-copy-msg");
    if (copyBtn) {
      this.#bindCopyButton(copyBtn, msg.content);
    }

    stream.appendChild(wrap);
    this.#scrollToBottom();
  }

  #bindCopyButton(button, rawContent) {
    if (!button) return;
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const contentToCopy = rawContent || decodeURIComponent(button.dataset.rawContent || "");
      if (!contentToCopy) return;

      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(contentToCopy);
        } else {
          // Fallback for non-secure / older browser contexts
          const textarea = document.createElement("textarea");
          textarea.value = contentToCopy;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        button.classList.add("copied");
        button.innerHTML = `<span class="copy-icon">✓</span>`;
        button.setAttribute("title", "Copied!");
        button.setAttribute("aria-label", "Copied to clipboard");

        setTimeout(() => {
          button.classList.remove("copied");
          button.innerHTML = `<span class="copy-icon">📋</span>`;
          button.setAttribute("title", "Copy message");
          button.setAttribute("aria-label", "Copy message");
        }, 2000);
      } catch (err) {
        console.warn("[ConsoleView] Clipboard copy failed:", err);
      }
    });
  }

  #renderMathInElement(element) {
    if (!element) return;
    if (typeof window !== "undefined" && window.renderMathInElement) {
      try {
        window.renderMathInElement(element, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn("[ConsoleView] KaTeX render warning:", err);
      }
    }
  }

  /**
   * Securely converts Markdown text into sanitized HTML.
   * Supports headings, tables, lists, code blocks, inline code, blockquotes, bold/italic, and safe links.
   *
   * @param {string} text - Raw Markdown or plain text
   * @returns {string} Sanitized HTML
   */
  #formatMessageText(text) {
    if (!text || typeof text !== "string") return "";

    // 1. HTML-escape raw text to prevent XSS injection before applying markdown tokens
    const escapeHtml = (str) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Store extracted code blocks to preserve whitespace and protect them from markdown parsing
    const codeBlocks = [];
    let processed = text.replace(/```([a-zA-Z0-9_-]*)\r?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const id = `LZRBLOCKCODE${codeBlocks.length}LZR`;
      const escapedCode = escapeHtml(code.replace(/\n+$/, ""));
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      codeBlocks.push(`<pre><code${langClass}>${escapedCode}</code></pre>`);
      return id;
    });

    // Store inline code
    const inlineCodes = [];
    processed = processed.replace(/`([^`\r\n]+)`/g, (match, code) => {
      const id = `LZRINLINECODE${inlineCodes.length}LZR`;
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return id;
    });

    // 2. Escape the rest of the text now that code blocks are protected
    processed = escapeHtml(processed);

    // 3. Process block-level Markdown elements line by line
    const lines = processed.split(/\r?\n/);
    const outputLines = [];
    let inList = null; // 'ul' | 'ol'
    let inBlockquote = false;
    let tableRows = []; // Accumulate table lines

    const flushTable = () => {
      if (tableRows.length === 0) return;
      let html = '<div class="message-table-wrapper"><table>';
      let hasHeader = false;

      // Check if row 1 is a delimiter (e.g. |---|---|)
      if (tableRows.length >= 2 && /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableRows[1].trim())) {
        hasHeader = true;
      }

      if (hasHeader) {
        const headerCells = tableRows[0].split('|').map(c => c.trim()).filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
        html += '<thead><tr>' + headerCells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        for (let i = 2; i < tableRows.length; i++) {
          const cells = tableRows[i].split('|').map(c => c.trim()).filter((c, j, arr) => !(j === 0 && c === '') && !(j === arr.length - 1 && c === ''));
          if (cells.length > 0) {
            html += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
          }
        }
        html += '</tbody>';
      } else {
        html += '<tbody>';
        for (let i = 0; i < tableRows.length; i++) {
          const cells = tableRows[i].split('|').map(c => c.trim()).filter((c, j, arr) => !(j === 0 && c === '') && !(j === arr.length - 1 && c === ''));
          if (cells.length > 0) {
            html += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
          }
        }
        html += '</tbody>';
      }

      html += '</table></div>';
      outputLines.push(html);
      tableRows = [];
    };

    const flushList = () => {
      if (inList) {
        outputLines.push(inList === 'ol' ? '</ol>' : '</ul>');
        inList = null;
      }
    };

    const flushBlockquote = () => {
      if (inBlockquote) {
        outputLines.push('</blockquote>');
        inBlockquote = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for Table Row
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
        flushList();
        flushBlockquote();
        tableRows.push(trimmed);
        continue;
      } else {
        flushTable();
      }

      // Check for Headings (# Heading, ## Heading, ### Heading, #### Heading)
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        flushBlockquote();
        const level = headingMatch[1].length;
        outputLines.push(`<h${level}>${headingMatch[2]}</h${level}>`);
        continue;
      }

      // Check for Horizontal Rules (---, ***, ___)
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
        flushList();
        flushBlockquote();
        outputLines.push('<hr>');
        continue;
      }

      // Check for Blockquotes (> Quote)
      const bqMatch = line.match(/^>\s?(.*)$/);
      if (bqMatch) {
        flushList();
        if (!inBlockquote) {
          outputLines.push('<blockquote>');
          inBlockquote = true;
        }
        outputLines.push(bqMatch[1] || '<br>');
        continue;
      } else {
        flushBlockquote();
      }

      // Check for Unordered Lists (- item, * item, • item)
      const ulMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
      if (ulMatch) {
        flushBlockquote();
        if (inList !== 'ul') {
          flushList();
          outputLines.push('<ul>');
          inList = 'ul';
        }
        outputLines.push(`<li>${ulMatch[1]}</li>`);
        continue;
      }

      // Check for Ordered Lists (1. item, 2. item)
      const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (olMatch) {
        flushBlockquote();
        if (inList !== 'ol') {
          flushList();
          outputLines.push('<ol>');
          inList = 'ol';
        }
        outputLines.push(`<li>${olMatch[1]}</li>`);
        continue;
      }

      // If not a list item, close any open list
      flushList();

      // Empty / blank lines
      if (trimmed === '') {
        outputLines.push('');
        continue;
      }

      // Regular paragraph or line
      outputLines.push(line);
    }

    flushTable();
    flushList();
    flushBlockquote();

    let combined = outputLines.join('\n');

    // 4. Inline formatting: Bold, Italic, Strikethrough
    combined = combined
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/_([^_\n]+)_/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>');

    // 5. Links: [Label](URL) & Raw safe URLs
    combined = combined
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(?<!["'=])(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // 6. Paragraph separation and line breaks
    combined = combined
      .replace(/\n\n+/g, '<br><br>')
      .replace(/(?<!<h[1-6]>|<hr>|<ul>|<ol>|<li>|<\/li>|<\/ul>|<\/ol>|<blockquote>|<\/blockquote>|<\/table>|<\/div>|<pre>|<\/pre>)\n(?!(?:<h[1-6]|<hr|<ul|<ol|<li|<\/li|<\/ul|<\/ol|<blockquote|<\/blockquote|<div|<\/div|<pre|<\/pre))/g, '<br>');

    // 7. Restore code blocks and inline code
    inlineCodes.forEach((code, idx) => {
      combined = combined.replace(`LZRINLINECODE${idx}LZR`, () => code);
    });
    codeBlocks.forEach((block, idx) => {
      combined = combined.replace(`LZRBLOCKCODE${idx}LZR`, () => block);
    });

    return combined;
  }

  #scrollToBottom() {
    const stream = this.#container.querySelector("#messagesStream");
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  }

  #updatePerspectiveBadge() {
    const badge = this.#container.querySelector("#consolePerspectiveBadge");
    if (!badge) return;

    const selectedId = this.#personaManager.getSelectedPersonaId();
    const enabled = this.#personaManager.getEnabledPersonas();

    if (selectedId && selectedId !== "auto") {
      const persona = this.#personaManager.getPersona(selectedId);
      const name = persona ? persona.shortName : selectedId;
      const role = persona ? (persona.roleSummary || persona.role) : "";
      
      if (selectedId === "penny") {
        badge.className = "persona-mode-pill mode-penny";
        badge.innerHTML = `<span>✦ Direct Focus: ${name} (${role})</span>`;
      } else if (selectedId === "pete") {
        badge.className = "persona-mode-pill mode-pete";
        badge.innerHTML = `<span>⚛ Direct Focus: ${name} (${role})</span>`;
      } else if (selectedId === "mina") {
        badge.className = "persona-mode-pill mode-mina";
        badge.innerHTML = `<span>🎨 Direct Focus: ${name} (${role})</span>`;
      } else {
        badge.className = "persona-mode-pill";
        badge.innerHTML = `<span>🚀 Direct Focus: ${name}</span>`;
      }
    } else {
      // Free Collaboration among active minds
      if (enabled.length === 0) {
        badge.className = "persona-mode-pill";
        badge.innerHTML = `<span>⚠️ Direct Core (All Specialized Minds Disabled)</span>`;
      } else if (enabled.length === 1) {
        badge.className = "persona-mode-pill mode-collaborate";
        badge.innerHTML = `<span>⚛ Single Active Mind: ${enabled[0].shortName}</span>`;
      } else {
        const names = enabled.map(p => p.shortName).join(" • ");
        badge.className = "persona-mode-pill mode-collaborate";
        badge.innerHTML = `<span>⚛ Collaborative Brainstorming (${names})</span>`;
      }
    }
  }

  // =====================================
  // Model Engine Status & Streaming Lifecycles
  // =====================================

  async #updateModelStatus() {
    const select = this.#container?.querySelector("#consoleModelSelector");
    const dot = this.#container?.querySelector("#engineStatusDot");
    if (!select || !dot) return;

    const currentKey = ProviderFactory.getActiveProviderKey();
    if (select.value !== currentKey) {
      select.value = currentKey;
    }

    if (currentKey === "hosted") {
      const provider = ProviderFactory.getProvider("hosted");
      const isOnline = await provider.checkHealth();
      if (isOnline) {
        dot.className = "engine-status-dot online";
        const host = provider.serverConfig?.targetHost || "Cloud API";
        const model = provider.serverConfig?.defaultModel || "Standard Model";
        dot.title = `LANZAR Hosted AI Online (${model} • ${host})`;
      } else {
        dot.className = "engine-status-dot offline";
        dot.title = "LANZAR Hosted AI Offline (Server API key not configured in .env)";
      }
    } else if (currentKey === "lanzar-001") {
      const provider = ProviderFactory.getProvider("lanzar-001");
      const isOnline = await provider.checkHealth();
      if (isOnline) {
        dot.className = "engine-status-dot online";
        const params = provider.modelInfo?.parameters_total || 843008;
        dot.title = `LANZAR-001 PyTorch Online (${params.toLocaleString()} params • Port 5050)`;
      } else {
        dot.className = "engine-status-dot offline";
        dot.title = "LANZAR-001 PyTorch Offline (Start engine with: python AI/engine/server.py)";
      }
    } else {
      dot.className = "engine-status-dot simulated";
      dot.title = "LANZAR Simulated Triad (Penny • Pete • Mina)";
    }
  }

  #createStreamingBubble(persona = "lanzar", authorName = "LANZAR AI") {
    const stream = this.#container.querySelector("#messagesStream");
    if (!stream) return null;

    const wrap = document.createElement("div");
    wrap.className = `chat-bubble-wrap ai-msg persona-${persona}`;

    let authorClass = `author-${persona}`;
    let avatarSrc = "assets/icons/favicon.svg";

    const personaObj = this.#personaManager ? this.#personaManager.getPersona(persona) : null;
    if (personaObj) {
      avatarSrc = personaObj.headshot || personaObj.avatar || "assets/icons/favicon.svg";
    } else if (persona === "penny") {
      avatarSrc = "assets/images/characters/Penelope/penny-headshot.png";
      authorClass = "author-penny";
    } else if (persona === "pete") {
      avatarSrc = "assets/images/characters/Peter/pete-headshot.png";
      authorClass = "author-pete";
    } else if (persona === "mina") {
      avatarSrc = "assets/images/characters/Mina/mina-headshot.png";
      authorClass = "author-mina";
    } else {
      authorClass = "author-collab";
    }

    wrap.innerHTML = `
      <div class="avatar-badge">
        <img src="${avatarSrc}" alt="${authorName}" />
      </div>
      <div class="message-card">
        <div class="message-author ${authorClass}">${authorName}</div>
        <div class="message-text streaming-text"><span class="cursor-pulse">▌</span></div>
        <div class="message-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;

    const textEl = wrap.querySelector(".message-text");
    const authorEl = wrap.querySelector(".message-author");
    const avatarImg = wrap.querySelector(".avatar-badge img");

    return { wrap, textEl, authorEl, avatarImg };
  }

  #finalizeStreamingBubble(bubbleCard, response) {
    if (!bubbleCard) return;
    const persona = response.persona || "lanzar";
    const authorName = response.authorName || "LANZAR AI";

    bubbleCard.wrap.className = `chat-bubble-wrap ai-msg persona-${persona}`;
    bubbleCard.authorEl.textContent = authorName;

    const personaObj = this.#personaManager ? this.#personaManager.getPersona(persona) : null;
    if (personaObj) {
      bubbleCard.authorEl.className = `message-author author-${persona}`;
      bubbleCard.avatarImg.src = personaObj.headshot || personaObj.avatar || "assets/icons/favicon.svg";
    } else if (persona === "penny") {
      bubbleCard.authorEl.className = "message-author author-penny";
      bubbleCard.avatarImg.src = "assets/images/characters/Penelope/penny-headshot.png";
    } else if (persona === "pete") {
      bubbleCard.authorEl.className = "message-author author-pete";
      bubbleCard.avatarImg.src = "assets/images/characters/Peter/pete-headshot.png";
    } else if (persona === "mina") {
      bubbleCard.authorEl.className = "message-author author-mina";
      bubbleCard.avatarImg.src = "assets/images/characters/Mina/mina-headshot.png";
    } else {
      bubbleCard.authorEl.className = "message-author author-collab";
      bubbleCard.avatarImg.src = "assets/icons/favicon.svg";
    }

    bubbleCard.textEl.innerHTML = this.#formatMessageText(response.content);
    this.#renderMathInElement(bubbleCard.textEl);

    // Add copy button to message-meta on completion
    const metaEl = bubbleCard.wrap.querySelector(".message-meta");
    if (metaEl && !metaEl.querySelector(".btn-copy-msg")) {
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "message-actions";
      actionsWrap.innerHTML = `
        <button type="button" class="btn-copy-msg" aria-label="Copy message" title="Copy message">
          <span class="copy-icon">📋</span>
        </button>
      `;
      metaEl.insertBefore(actionsWrap, metaEl.firstChild);
      const copyBtn = actionsWrap.querySelector(".btn-copy-msg");
      this.#bindCopyButton(copyBtn, response.content);
    }
  }

  // =====================================
  // Event Bindings & Message Dispatch
  // =====================================

  #bindEvents() {
    const form = this.#container.querySelector("#consoleChatForm");
    const input = this.#container.querySelector("#consoleChatInput");
    const btnSettings = this.#container.querySelector("#btnConsoleOpenSettings");
    const navLab = this.#container.querySelector("#navItemLab");
    const modelSelect = this.#container.querySelector("#consoleModelSelector");

    // 1. Model Selector Change
    modelSelect?.addEventListener("change", (e) => {
      ProviderFactory.setActiveProvider(e.target.value);
      this.#updateModelStatus();
    });

    // 2. Form Submission (Send Message)
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = input.value.trim();
      if (!content || this.#isGenerating) return;

      input.value = "";
      await this.#handleUserMessage(content);
    });

    // 3. Terminal-Style Command History Keyboard Handler (ArrowUp / ArrowDown / Escape)
    input?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
        const isFullSelect = input.selectionStart === 0 && input.selectionEnd === input.value.length;

        // Navigate history if at beginning, empty, full selection, or already actively browsing history
        if (isAtStart || isFullSelect || input.value === "" || !this.#commandHistory.isAtDraft) {
          e.preventDefault();
          const prev = this.#commandHistory.navigateUp(input.value);
          if (prev !== null) {
            input.value = prev;
            input.setSelectionRange(prev.length, prev.length);
          }
        }
      } else if (e.key === "ArrowDown") {
        const isAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
        const isFullSelect = input.selectionStart === 0 && input.selectionEnd === input.value.length;

        // Navigate history if at end, empty, full selection, or already actively browsing history
        if (isAtEnd || isFullSelect || input.value === "" || !this.#commandHistory.isAtDraft) {
          e.preventDefault();
          const next = this.#commandHistory.navigateDown();
          if (next !== null) {
            input.value = next;
            input.setSelectionRange(next.length, next.length);
          }
        }
      } else if (e.key === "Escape") {
        // Escape key cancels history navigation and restores working draft
        if (!this.#commandHistory.isAtDraft) {
          e.preventDefault();
          const draft = this.#commandHistory.navigateDown();
          input.value = draft || "";
          this.#commandHistory.resetCursor();
        }
      }
    });

    // 4. Modal & Nav Action Triggers
    btnSettings?.addEventListener("click", () => {
      globalBus.emit("action:open-settings");
    });

    navLab?.addEventListener("click", () => {
      globalBus.emit("action:open-lab");
    });

    // 6. New Thread Action
    const btnNewThread = this.#container.querySelector("#btnNewThread");
    btnNewThread?.addEventListener("click", async () => {
      if (this.#conversationManager) {
        await this.#conversationManager.createThread("New Thread");
      }
    });

    // 7. Thread Export Actions
    const btnExport = this.#container.querySelector("#btnExportThread");
    const exportMenu = this.#container.querySelector("#threadExportMenu");

    btnExport?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (exportMenu) {
        exportMenu.style.display = exportMenu.style.display === "none" ? "block" : "none";
      }
    });

    document.addEventListener("click", () => {
      if (exportMenu) exportMenu.style.display = "none";
    });

    this.#container.querySelectorAll(".btn-export-option").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const format = btn.getAttribute("data-format");
        if (this.#conversationManager) {
          this.#conversationManager.downloadThread(format);
        }
        if (exportMenu) exportMenu.style.display = "none";
      });
    });
  }

  async #handleUserMessage(userText) {
    this.#isGenerating = true;

    // 1. Store in Terminal Command History (USER INPUT ONLY)
    this.#commandHistory.push(userText);
    if (this.#conversationManager) {
      this.#conversationManager.saveCommandHistory(this.#commandHistory.getAllEntries());
    }

    // 2. Record in conversation memory and render to DOM
    const userMsg = this.#memoryManager.shortTerm.addMessage("user", userText);
    this.#appendMessageToDOM(userMsg);

    // Asynchronously extract candidate user facts without blocking response stream
    userMemoryService.processUserMessageAsync({
      role: "user",
      content: userText,
      conversationId: this.#conversationManager?.getActiveConversationId(),
      id: userMsg?.id
    });

    Analytics.track("Conversation", "MessageSent", {
      selectedPersona: this.#personaManager.getSelectedPersonaId(),
      enabledCount: this.#personaManager.getEnabledPersonas().length,
      provider: ProviderFactory.getActiveProviderKey()
    });

    // 3. Show Typing Indicator
    const stream = this.#container.querySelector("#messagesStream");
    const typingElem = document.createElement("div");
    typingElem.className = "chat-bubble-wrap ai-msg typing-wrap";
    typingElem.innerHTML = `
      <div class="avatar-badge">
        <img src="assets/icons/favicon.svg" alt="LANZAR Core" />
      </div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    stream.appendChild(typingElem);
    this.#scrollToBottom();

    // 4. Dispatch to Model Provider with full persona context & live streaming
    try {
      const provider = ProviderFactory.getActiveProvider();
      const activeKey = ProviderFactory.getActiveProviderKey();
      const adaptation = this.#adaptationManager.getAdaptationParameters();
      const memoryContext = this.#memoryManager.getAssembledContext(userMsg?.id);
      const elapsedSinceLastUserInput = memoryContext?.elapsedSinceLastUserInput ?? null;

      if (typeof provider.streamResponse === "function" && (activeKey === "lanzar-001" || activeKey === "hosted")) {
        // Real-Time Token Streaming Mode
        let bubbleCard = null;

        const onTokenCallback = (accumulatedText) => {
          if (typingElem && typingElem.parentNode) {
            typingElem.remove();
          }
          if (!bubbleCard) {
            bubbleCard = this.#createStreamingBubble("lanzar", "LANZAR AI");
            stream.appendChild(bubbleCard.wrap);
          }
          bubbleCard.textEl.innerHTML = this.#formatMessageText(accumulatedText) + `<span class="cursor-pulse">▌</span>`;
          this.#scrollToBottom();
        };

        const response = await provider.streamResponse(
          this.#memoryManager.shortTerm.getMessages(),
          {
            personaManager: this.#personaManager,
            selectedPersonaId: this.#personaManager.getSelectedPersonaId(),
            enabledPersonas: this.#personaManager.getEnabledPersonas(),
            perspectiveMode: this.#personaManager.perspectiveMode,
            adaptation,
            memoryContext,
            elapsedSinceLastUserInput
          },
          onTokenCallback
        );

        if (typingElem && typingElem.parentNode) {
          typingElem.remove();
        }

        if (bubbleCard) {
          this.#finalizeStreamingBubble(bubbleCard, response);
          this.#memoryManager.shortTerm.addMessage(
            "assistant",
            response.content,
            response.persona || "lanzar",
            response.authorName || "LANZAR-001"
          );
        } else {
          const aiMsg = this.#memoryManager.shortTerm.addMessage(
            "assistant",
            response.content,
            response.persona || "lanzar",
            response.authorName || "LANZAR-001"
          );
          this.#appendMessageToDOM(aiMsg);
        }

      } else {
        // Simulated Triad / Standard Response Generation
        const response = await provider.generateResponse(
          this.#memoryManager.shortTerm.getMessages(),
          {
            personaManager: this.#personaManager,
            selectedPersonaId: this.#personaManager.getSelectedPersonaId(),
            enabledPersonas: this.#personaManager.getEnabledPersonas(),
            perspectiveMode: this.#personaManager.perspectiveMode,
            adaptation,
            memoryContext,
            elapsedSinceLastUserInput
          }
        );

        // Remove typing indicator
        if (typingElem && typingElem.parentNode) {
          typingElem.remove();
        }

        if (response.isMultiTurn && Array.isArray(response.dialogues)) {
          // Render each dialogue sequentially with distinct bubbles
          for (let i = 0; i < response.dialogues.length; i++) {
            const item = response.dialogues[i];
            const aiMsg = this.#memoryManager.shortTerm.addMessage(
              "assistant",
              item.content,
              item.persona,
              item.authorName
            );
            this.#appendMessageToDOM(aiMsg);
            if (i < response.dialogues.length - 1) {
              await new Promise(r => setTimeout(r, 450));
            }
          }
        } else {
          // Record & Render single response
          const aiMsg = this.#memoryManager.shortTerm.addMessage(
            "assistant",
            response.content,
            response.persona || "lanzar",
            response.authorName || "LANZAR AI"
          );
          this.#appendMessageToDOM(aiMsg);
        }

        // Automatic Persona Focus Handoff in UI & Runtime (Only when explicit handoff occurs)
        if (response.setFocus) {
          this.#personaManager.setSelectedPersona(response.setFocus);
          if (this.#conversationManager) {
            this.#conversationManager.updateSelectedPersona(response.setFocus);
          }
          this.#renderPersonalityControlSurface();
          this.#updatePerspectiveBadge();
        }
      }

    } catch (err) {
      console.error("[Console] Generation error:", err);
      if (typingElem && typingElem.parentNode) {
        typingElem.remove();
      }
    } finally {
      this.#isGenerating = false;
    }
  }
}
