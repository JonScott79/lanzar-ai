/*
    conversation-manager.js

    Client-Side Conversation & Thread Lifecycle Manager for LANZAR AI.

    Responsibilities:
    - Coordinate Multi-Conversation Thread CRUD (Create, List, Open, Rename, Delete)
    - Enforce thread-scoped session and memory isolation
    - Maintain synchronized active thread state with server-side /api/conversations
    - Manage thread-isolated command history and character selection
*/

import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";
import { STORAGE_KEYS } from "../config.js";
import { authService } from "../auth/auth-service.js";

// =====================================
// Conversation Manager Class
// =====================================

export class ConversationManager {
  #threads = []; // Array of thread summaries
  #activeConversation = null; // Full active conversation object
  #isInitialized = false;

  constructor() {
    // Listen for authentication changes to reload user-scoped threads
    globalBus.on("auth:changed", async () => {
      await this.reloadForAuthChange();
    });
  }

  // =====================================
  // Initialization & Boot
  // =====================================

  async init() {
    if (this.#isInitialized) return;

    try {
      // 1. Fetch thread summaries from backend with user auth headers
      const res = await fetch('/api/conversations', {
        headers: { ...authService.getAuthHeaders() }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#threads = await res.json();

      // 2. Resolve active conversation ID
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
      const targetId = (savedId && this.#threads.some(t => t.id === savedId))
        ? savedId
        : (this.#threads.length > 0 ? this.#threads[0].id : null);

      if (targetId) {
        await this.#loadFullConversation(targetId);
      } else {
        // Create initial thread if none exist
        await this.createThread('Rocket Engine Redesign');
      }

      this.#isInitialized = true;
      globalBus.emit('conversations:initialized', {
        threads: this.getThreads(),
        activeConversation: this.#activeConversation
      });
    } catch (err) {
      console.warn('[ConversationManager] Failed to load threads from API, using fallback:', err);
      this.#initFallback();
    }
  }

  async reloadForAuthChange() {
    this.#activeConversation = null;
    this.#threads = [];
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);

    try {
      const res = await fetch('/api/conversations', {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        this.#threads = await res.json();
      }
      if (this.#threads.length > 0) {
        await this.#loadFullConversation(this.#threads[0].id);
      } else {
        await this.createThread('New Thread');
      }
      globalBus.emit('conversations:changed', { threads: this.getThreads() });
    } catch (err) {
      console.warn('[ConversationManager] Error reloading after auth change:', err);
      this.#initFallback();
    }
  }

  #initFallback() {
    const fallbackId = 'conv_fallback_' + Date.now();
    this.#threads = [
      {
        id: fallbackId,
        userId: 'user_default',
        title: 'Rocket Engine Redesign',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
        selectedPersonaId: 'auto',
        modelProvider: 'stub',
        lastMessageSnippet: ''
      }
    ];
    this.#activeConversation = {
      id: fallbackId,
      userId: 'user_default',
      title: 'Rocket Engine Redesign',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedPersonaId: 'auto',
      modelProvider: 'stub',
      commandHistory: [],
      messages: []
    };
    this.#isInitialized = true;
  }

  async #loadFullConversation(convId) {
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#activeConversation = await res.json();
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, convId);
      return this.#activeConversation;
    } catch (err) {
      console.error(`[ConversationManager] Failed to load conversation ${convId}:`, err);
      return null;
    }
  }

  // =====================================
  // Accessors
  // =====================================

  getThreads() {
    return [...this.#threads];
  }

  getActiveConversation() {
    return this.#activeConversation;
  }

  getActiveConversationId() {
    return this.#activeConversation ? this.#activeConversation.id : null;
  }

  getMessages() {
    return this.#activeConversation && Array.isArray(this.#activeConversation.messages)
      ? [...this.#activeConversation.messages]
      : [];
  }

  getCommandHistory() {
    return this.#activeConversation && Array.isArray(this.#activeConversation.commandHistory)
      ? [...this.#activeConversation.commandHistory]
      : [];
  }

  getSelectedPersonaId() {
    return this.#activeConversation ? this.#activeConversation.selectedPersonaId || 'auto' : 'auto';
  }

  // =====================================
  // Thread CRUD Operations
  // =====================================

  /**
   * Creates a new conversation thread and activates it.
   * @param {string} [title="New Thread"]
   * @param {string} [selectedPersonaId="auto"]
   * @returns {Promise<Object>}
   */
  async createThread(title = "New Thread", selectedPersonaId = "auto") {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({
          title,
          selectedPersonaId,
          messages: []
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newConv = await res.json();

      this.#activeConversation = newConv;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, newConv.id);

      // Refresh threads list
      await this.refreshThreads();

      Analytics.track("Thread", "Created", { threadId: newConv.id, title: newConv.title });
      globalBus.emit('conversation:switched', {
        conversation: this.#activeConversation,
        messages: this.getMessages(),
        selectedPersonaId: this.getSelectedPersonaId(),
        commandHistory: this.getCommandHistory()
      });

      return newConv;
    } catch (err) {
      console.error('[ConversationManager] Failed to create thread:', err);
      throw err;
    }
  }

  /**
   * Switches the active thread to target threadId.
   * @param {string} threadId
   * @returns {Promise<Object|null>}
   */
  async switchThread(threadId) {
    if (!threadId || (this.#activeConversation && this.#activeConversation.id === threadId)) {
      return this.#activeConversation;
    }

    const loaded = await this.#loadFullConversation(threadId);
    if (!loaded) return null;

    Analytics.track("Thread", "Switched", { threadId });
    globalBus.emit('conversation:switched', {
      conversation: this.#activeConversation,
      messages: this.getMessages(),
      selectedPersonaId: this.getSelectedPersonaId(),
      commandHistory: this.getCommandHistory()
    });

    return loaded;
  }

  /**
   * Renames an existing thread.
   * @param {string} threadId
   * @param {string} newTitle
   * @returns {Promise<boolean>}
   */
  async renameThread(threadId, newTitle) {
    if (!threadId || !newTitle || !newTitle.trim()) return false;
    const cleanTitle = newTitle.trim();

    try {
      const res = await fetch(`/api/conversations/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ title: cleanTitle })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();

      if (this.#activeConversation && this.#activeConversation.id === threadId) {
        this.#activeConversation.title = cleanTitle;
      }

      await this.refreshThreads();
      Analytics.track("Thread", "Renamed", { threadId, title: cleanTitle });
      globalBus.emit('conversations:changed', { threads: this.getThreads() });
      return true;
    } catch (err) {
      console.error('[ConversationManager] Failed to rename thread:', err);
      return false;
    }
  }

  /**
   * Deletes a thread and falls back cleanly.
   * @param {string} threadId
   * @returns {Promise<boolean>}
   */
  async deleteThread(threadId) {
    if (!threadId) return false;

    try {
      const res = await fetch(`/api/conversations/${threadId}`, {
        method: 'DELETE',
        headers: { ...authService.getAuthHeaders() }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Analytics.track("Thread", "Deleted", { threadId });

      // Refresh list
      await this.refreshThreads();

      // If active conversation was deleted, switch to another thread or create empty
      if (this.#activeConversation && this.#activeConversation.id === threadId) {
        if (this.#threads.length > 0) {
          await this.switchThread(this.#threads[0].id);
        } else {
          await this.createThread('New Thread');
        }
      } else {
        globalBus.emit('conversations:changed', { threads: this.getThreads() });
      }

      return true;
    } catch (err) {
      console.error('[ConversationManager] Failed to delete thread:', err);
      return false;
    }
  }

  // =====================================
  // Message & State Mutation
  // =====================================

  /**
   * Appends a message to the active conversation.
   * @param {Object} message - { role, content, persona, authorName, model, metadata }
   * @returns {Promise<Object>}
   */
  async addMessage(message) {
    if (!this.#activeConversation) return null;

    const convId = this.#activeConversation.id;

    // 1. Ensure local message array exists and append synchronously immediately
    if (!Array.isArray(this.#activeConversation.messages)) {
      this.#activeConversation.messages = [];
    }

    const localEntry = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: message.role || 'user',
      content: message.content || '',
      persona: message.persona || (message.role === 'user' ? 'user' : 'lanzar'),
      authorName: message.authorName || (message.role === 'user' ? 'You' : 'LANZAR AI'),
      timestamp: message.timestamp || new Date().toISOString()
    };

    this.#activeConversation.messages.push(localEntry);

    // 2. Synchronize asynchronously with the server store in the background
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify(localEntry)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const savedMsg = await res.json();

      // Update the local entry ID if assigned by server
      if (savedMsg && savedMsg.id) {
        localEntry.id = savedMsg.id;
      }

      // Auto-update thread summary in background
      this.refreshThreads();

      globalBus.emit('message:added', {
        message: localEntry,
        conversationId: convId
      });

      return localEntry;
    } catch (err) {
      console.warn('[ConversationManager] API error persisting message to server, retained locally:', err);
      return localEntry;
    }
  }

  /**
   * Updates command history for the active conversation.
   * @param {Array<string>} historyArray
   */
  async saveCommandHistory(historyArray) {
    if (!this.#activeConversation) return;

    this.#activeConversation.commandHistory = Array.isArray(historyArray) ? [...historyArray] : [];
    const convId = this.#activeConversation.id;

    try {
      await fetch(`/api/conversations/${convId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ history: this.#activeConversation.commandHistory })
      });
    } catch (err) {
      console.warn('[ConversationManager] Failed to persist command history on server:', err);
    }
  }

  /**
   * Updates selected persona context for the active conversation.
   * @param {string} personaId
   */
  async updateSelectedPersona(personaId) {
    if (!this.#activeConversation) return;
    this.#activeConversation.selectedPersonaId = personaId;
    const convId = this.#activeConversation.id;

    try {
      await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ selectedPersonaId: personaId })
      });
    } catch (err) {
      console.warn('[ConversationManager] Failed to persist persona context on server:', err);
    }
  }

  /**
   * Refreshes the thread list cache from the server.
   */
  async refreshThreads() {
    try {
      const res = await fetch('/api/conversations', {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        this.#threads = await res.json();
        globalBus.emit('conversations:changed', { threads: this.getThreads() });
      }
    } catch (err) {
      console.warn('[ConversationManager] Failed to refresh thread list:', err);
    }
  }

  // =====================================
  // Export & Artifact Generation
  // =====================================

  /**
   * Formats a conversation object into Markdown, JSON, or Plain Text.
   * @param {Object} conv
   * @param {'markdown'|'json'|'text'} format
   * @returns {string} Formatted output string
   */
  static formatConversation(conv, format = 'markdown') {
    if (!conv) return '';

    const title = conv.title || 'Untitled Thread';
    const dateStr = new Date(conv.updatedAt || Date.now()).toISOString();

    if (format === 'json') {
      return JSON.stringify(conv, null, 2);
    }

    if (format === 'text') {
      let txt = `============================================================\n`;
      txt += `LANZAR AI — CONVERSATION TRANSCRIPT\n`;
      txt += `Thread: ${title}\n`;
      txt += `ID: ${conv.id}\n`;
      txt += `Timestamp: ${dateStr}\n`;
      txt += `============================================================\n\n`;

      (conv.messages || []).forEach(m => {
        const author = m.role === 'user' ? 'YOU' : (m.authorName || 'LANZAR AI');
        const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '';
        txt += `[${author}] (${time}):\n${m.content}\n\n------------------------------------------------------------\n\n`;
      });
      return txt;
    }

    // Default: Markdown format
    let md = `# LANZAR AI — Conversation Transcript\n\n`;
    md += `**Thread Title:** ${title}  \n`;
    md += `**Thread ID:** \`${conv.id}\`  \n`;
    md += `**Owner UID:** \`${conv.userId || 'user_default'}\`  \n`;
    md += `**Exported At:** \`${dateStr}\`  \n\n`;
    md += `---\n\n`;

    (conv.messages || []).forEach(m => {
      let header = `### 👤 You`;
      if (m.role !== 'user') {
        const persona = (m.persona || '').toLowerCase();
        if (persona === 'penny') header = `### 👩‍🚀 Penny (Possibility & Experiments)`;
        else if (persona === 'pete') header = `### 🔬 Pete (Analysis & Systems)`;
        else if (persona === 'mina') header = `### 🎨 Mina (Art Direction & Soul)`;
        else if (persona === 'dual') header = `### ⚛ Dual Mind (Penny & Pete)`;
        else if (persona === 'triad') header = `### ⚛ Triad Synthesis (Penny • Pete • Mina)`;
        else header = `### ⚛ ${m.authorName || 'LANZAR AI Core'}`;
      }

      const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '';
      md += `${header} *(${time})*\n\n${m.content}\n\n---\n\n`;
    });

    md += `\n*Exported via LANZAR AI Launch Console.*\n`;
    return md;
  }

  /**
   * Formats the active thread into Markdown, JSON, or Plain Text.
   * @param {'markdown'|'json'|'text'} format
   * @returns {string} Formatted output string
   */
  exportActiveThread(format = 'markdown') {
    return ConversationManager.formatConversation(this.#activeConversation, format);
  }

  /**
   * Triggers a browser file download of the active thread.
   * @param {'markdown'|'json'|'text'} format
   */
  downloadThread(format = 'markdown') {
    const content = this.exportActiveThread(format);
    if (!content) return;

    const conv = this.#activeConversation;
    const cleanTitle = (conv?.title || 'lanzar-thread').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ext = format === 'json' ? 'json' : (format === 'text' ? 'txt' : 'md');
    const mimeType = format === 'json' ? 'application/json' : 'text/markdown';
    const filename = `${cleanTitle}-${Date.now()}.${ext}`;

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Analytics.track('Conversation', 'Export', { threadId: conv?.id, format });
  }
}
