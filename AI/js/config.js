/*
    config.js

    Application configuration and storage keys for LANZAR AI.

    Responsibilities
    - Define storage keys for state persistence
    - Configure default settings and timeouts
*/

// =====================================
// Storage Keys
// =====================================

export const STORAGE_KEYS = {
  ACTIVE_PERSONA: "lanzar_ai_active_persona",
  ACTIVE_VIEW: "lanzar_ai_active_view",
  CONVERSATION_HISTORY: "lanzar_ai_conversation_history",
  USER_PROFILE: "lanzar_ai_user_profile",
  PROJECT_MEMORY: "lanzar_ai_project_memory",
  LONG_TERM_MEMORY: "lanzar_ai_long_term_memory",
  SETTINGS: "lanzar_ai_settings",
  PERSONA_ENABLED_STATES: "lanzar_ai_persona_enabled_states",
  SELECTED_PERSONA: "lanzar_ai_selected_persona",
  CHAT_COMMAND_HISTORY: "lanzar_ai_chat_command_history",
  ACTIVE_MODEL_PROVIDER: "lanzar_ai_active_model_provider",
  ACTIVE_CONVERSATION_ID: "lanzar_ai_active_conversation_id"
};

// =====================================
// Default Configurations
// =====================================

export const DEFAULT_CONFIG = {
  defaultPersona: "penny",
  typingDelayMs: 25,
  simulatedResponseDelayMinMs: 400,
  simulatedResponseDelayMaxMs: 900,
  maxContextHistory: 50
};
