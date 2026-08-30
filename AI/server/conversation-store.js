/*
    conversation-store.js

    Authoritative server-side persistence and access control for LANZAR conversations.

    Responsibilities:
    - Persist conversations to data/conversations.json
    - Enforce strict server-side user authorization (User A cannot access User B's threads)
    - Provide complete CRUD: Create, Read, Update, Delete, List, Append Message, Save History
    - Auto-initialize storage directory and seed initial conversation if required
*/

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'conversations.json');

class ConversationStore {
  constructor() {
    this.#ensureStorage();
  }

  #ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ conversations: {} }, null, 2), 'utf-8');
    }
  }

  #readData() {
    try {
      this.#ensureStorage();
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw) || { conversations: {} };
    } catch (e) {
      console.error('[ConversationStore] Error reading storage:', e);
      return { conversations: {} };
    }
  }

  #writeData(data) {
    try {
      this.#ensureStorage();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[ConversationStore] Error writing storage:', e);
      throw e;
    }
  }

  // =====================================
  // Authorization & Validation Helpers
  // =====================================

  #assertOwnership(conversation, userId) {
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }
    if (conversation.userId !== userId) {
      const err = new Error('Access denied: You do not own this conversation');
      err.status = 403;
      throw err;
    }
  }

  // =====================================
  // CRUD Operations
  // =====================================

  /**
   * Lists all conversations owned by the authenticated user.
   * @param {string} userId
   * @returns {Array<Object>} Summaries of conversations
   */
  list(userId) {
    if (!userId) throw new Error('userId is required');
    const data = this.#readData();
    const list = Object.values(data.conversations || {})
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map(c => ({
        id: c.id,
        userId: c.userId,
        title: c.title || 'Untitled Thread',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || c.createdAt,
        messageCount: (c.messages || []).length,
        selectedPersonaId: c.selectedPersonaId || 'auto',
        modelProvider: c.modelProvider || 'stub',
        lastMessageSnippet: c.messages && c.messages.length > 0 
          ? c.messages[c.messages.length - 1].content.slice(0, 60)
          : ''
      }));

    return list;
  }

  /**
   * Creates a new conversation for the authenticated user.
   * @param {string} userId
   * @param {Object} options
   * @returns {Object} Full conversation object
   */
  create(userId, options = {}) {
    if (!userId) throw new Error('userId is required');
    const data = this.#readData();

    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newConversation = {
      id,
      userId,
      title: options.title || 'New Thread',
      createdAt: now,
      updatedAt: now,
      selectedPersonaId: options.selectedPersonaId || 'auto',
      modelProvider: options.modelProvider || 'stub',
      commandHistory: Array.isArray(options.commandHistory) ? options.commandHistory : [],
      messages: Array.isArray(options.messages) ? options.messages : []
    };

    data.conversations[id] = newConversation;
    this.#writeData(data);
    return newConversation;
  }

  /**
   * Retrieves a single conversation, verifying user ownership.
   * @param {string} userId
   * @param {string} conversationId
   * @returns {Object}
   */
  get(userId, conversationId) {
    if (!userId || !conversationId) throw new Error('userId and conversationId are required');
    const data = this.#readData();
    const conv = data.conversations[conversationId];
    this.#assertOwnership(conv, userId);
    return conv;
  }

  /**
   * Updates metadata (title, selectedPersonaId, modelProvider) of a conversation.
   * @param {string} userId
   * @param {string} conversationId
   * @param {Object} updates
   * @returns {Object} Updated conversation
   */
  update(userId, conversationId, updates = {}) {
    if (!userId || !conversationId) throw new Error('userId and conversationId are required');
    const data = this.#readData();
    const conv = data.conversations[conversationId];
    this.#assertOwnership(conv, userId);

    if (typeof updates.title === 'string' && updates.title.trim()) {
      conv.title = updates.title.trim();
    }
    if (typeof updates.selectedPersonaId === 'string') {
      conv.selectedPersonaId = updates.selectedPersonaId;
    }
    if (typeof updates.modelProvider === 'string') {
      conv.modelProvider = updates.modelProvider;
    }

    conv.updatedAt = new Date().toISOString();
    data.conversations[conversationId] = conv;
    this.#writeData(data);
    return conv;
  }

  /**
   * Destructively deletes a conversation after verifying ownership.
   * @param {string} userId
   * @param {string} conversationId
   * @returns {boolean}
   */
  delete(userId, conversationId) {
    if (!userId || !conversationId) throw new Error('userId and conversationId are required');
    const data = this.#readData();
    const conv = data.conversations[conversationId];
    this.#assertOwnership(conv, userId);

    delete data.conversations[conversationId];
    this.#writeData(data);
    return true;
  }

  /**
   * Appends a message to a conversation.
   * @param {string} userId
   * @param {string} conversationId
   * @param {Object} message
   * @returns {Object} Appended message
   */
  addMessage(userId, conversationId, message) {
    if (!userId || !conversationId || !message) throw new Error('Invalid arguments');
    const data = this.#readData();
    const conv = data.conversations[conversationId];
    this.#assertOwnership(conv, userId);

    const msgPersona = message.persona || (message.role === 'user' ? 'user' : 'lanzar');
    const msgEntry = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: message.role || 'user',
      content: message.content || '',
      persona: msgPersona,
      authorName: message.authorName || (message.role === 'user' ? 'You' : (msgPersona === 'pete' ? 'Pete' : (msgPersona === 'mina' ? 'Mina' : (msgPersona === 'penny' ? 'Penny' : 'LANZAR AI')))),
      characterId: message.characterId || msgPersona || null,
      model: message.model || conv.modelProvider || 'stub',
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: message.metadata || {}
    };

    if (!Array.isArray(conv.messages)) {
      conv.messages = [];
    }
    conv.messages.push(msgEntry);

    // If first user message and title is still default, generate a smart title
    if (conv.title === 'New Thread' && msgEntry.role === 'user') {
      const cleanPrompt = msgEntry.content.replace(/\s+/g, ' ').trim();
      if (cleanPrompt.length > 0) {
        conv.title = cleanPrompt.length > 36 ? cleanPrompt.slice(0, 36) + '…' : cleanPrompt;
      }
    }

    conv.updatedAt = new Date().toISOString();
    data.conversations[conversationId] = conv;
    this.#writeData(data);
    return msgEntry;
  }

  /**
   * Updates isolated command history for a conversation.
   * @param {string} userId
   * @param {string} conversationId
   * @param {Array<string>} history
   * @returns {Array<string>}
   */
  updateCommandHistory(userId, conversationId, history) {
    if (!userId || !conversationId) throw new Error('Invalid arguments');
    const data = this.#readData();
    const conv = data.conversations[conversationId];
    this.#assertOwnership(conv, userId);

    conv.commandHistory = Array.isArray(history) ? history.slice(-50) : [];
    conv.updatedAt = new Date().toISOString();
    data.conversations[conversationId] = conv;
    this.#writeData(data);
    return conv.commandHistory;
  }
}

module.exports = {
  ConversationStore,
  conversationStore: new ConversationStore()
};
