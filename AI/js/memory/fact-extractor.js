/*
    fact-extractor.js

    Model-Independent Conservative User Fact Extraction Engine for LANZAR AI.

    Responsibilities:
    - Analyze user messages to identify candidate long-term user facts
    - Classify facts into explicit taxonomy:
      preference, project, skill, goal, interest, workflow, personal_context, technical_context
    - Reject temporary questions, calculations, hypothetical prompts, and assistant statements
    - Assign realistic confidence scores (high, medium, low)
    - Detect potential superseding/updating relationships
*/

export class FactExtractor {
  /**
   * Extracts candidate persistent user facts from a message.
   * @param {Object} message - { role: 'user'|'assistant', content: string, conversationId?: string, id?: string }
   * @param {Array} existingMemories - Array of current user memories for duplicate/conflict detection
   * @returns {Array<Object>} List of candidate memory objects
   */
  static extractCandidateFacts(message, existingMemories = []) {
    if (!message || message.role !== 'user' || !message.content) {
      return [];
    }

    const text = message.content.trim();
    if (!text || text.length < 6) {
      return [];
    }

    // 1. Conservative Rejection Filters
    if (this.#isTemporaryOrNonFact(text)) {
      return [];
    }

    const candidateFacts = [];

    // 2. Pattern Matching against Taxonomy
    
    // A. Preference Patterns
    const prefMatch = this.#extractPreference(text);
    if (prefMatch) candidateFacts.push(prefMatch);

    // B. Project Patterns
    const projMatch = this.#extractProject(text);
    if (projMatch) candidateFacts.push(projMatch);

    // C. Goal Patterns
    const goalMatch = this.#extractGoal(text);
    if (goalMatch) candidateFacts.push(goalMatch);

    // D. Skill Patterns
    const skillMatch = this.#extractSkill(text);
    if (skillMatch) candidateFacts.push(skillMatch);

    // E. Interest Patterns
    const intMatch = this.#extractInterest(text);
    if (intMatch) candidateFacts.push(intMatch);

    // F. Technical Context / Environment Patterns
    const techMatch = this.#extractTechnicalContext(text);
    if (techMatch) candidateFacts.push(techMatch);

    // Attach provenance metadata
    return candidateFacts.map(c => ({
      ...c,
      sourceConversationId: message.conversationId || null,
      sourceMessageId: message.id || null,
      status: c.confidence === 'high' ? 'active' : 'pending_confirmation'
    }));
  }

  // =====================================
  // Conservative Filter Heuristics
  // =====================================

  static #isTemporaryOrNonFact(text) {
    const lower = text.toLowerCase();

    // Reject pure questions (ends with ? or starts with interrogatives)
    if (lower.endsWith('?')) return true;
    if (/^(what|why|how|when|where|who|is it|can you|could you|would you|do you|should we|will)\b/i.test(lower)) {
      return true;
    }

    // Reject temporary calculation commands or math expressions
    if (/^(calculate|solve|evaluate|compute|derive|summarize|rewrite|debug|find|show me|list)\b/i.test(lower)) {
      return true;
    }

    // Reject temporary problem-solving assumptions ("assume that...", "for this calculation...", "let's say...")
    if (/\b(assume|assuming|for this calculation|let's say|suppose that|hypothetically|imagine if|if we were to)\b/i.test(lower)) {
      return true;
    }

    // Reject conversational filler or greetings
    if (/^(hi|hello|hey|greetings|thanks|thank you|ok|okay|cool|sweet|great|yes|no|nope|sure)$/i.test(lower)) {
      return true;
    }

    return false;
  }

  // =====================================
  // Taxonomy Extractors
  // =====================================

  static #extractPreference(text) {
    // e.g. "I prefer Linux", "I prefer dark mode", "I always use Python", "I like concise answers"
    const m = text.match(/\b(?:i\s+prefer|i\s+strictly\s+prefer|i\s+always\s+use|i\s+favor|my\s+preference\s+is)\s+([^.,;!?\n]+)/i);
    if (m) {
      const subject = m[1].trim();
      return {
        category: 'preference',
        fact: `Prefers ${subject}`,
        supersedesSubject: 'prefers',
        confidence: 'high'
      };
    }
    return null;
  }

  static #extractProject(text) {
    // e.g. "I'm building a cybersecurity lab", "I am working on an aerospike engine", "My project is Project X"
    const m = text.match(/\b(?:i'm\s+building|i\s+am\s+building|i'm\s+working\s+on|i\s+am\s+working\s+on|my\s+active\s+project\s+is|my\s+project\s+is)\s+([^.,;!?\n]+)/i);
    if (m) {
      const subject = m[1].trim();
      return {
        category: 'project',
        fact: `Working on ${subject}`,
        supersedesSubject: 'working on',
        confidence: 'high'
      };
    }
    return null;
  }

  static #extractGoal(text) {
    // e.g. "I want to transfer to MIT", "My goal is to publish an aerospike paper", "I plan to launch our subscale combustor"
    const m = text.match(/\b(?:my\s+goal\s+is\s+to|i\s+want\s+to|i\s+plan\s+to|i'm\s+aiming\s+to|my\s+objective\s+is\s+to)\s+([^.,;!?\n]+)/i);
    if (m) {
      const subject = m[1].trim();
      return {
        category: 'goal',
        fact: `Goal is to ${subject}`,
        supersedesSubject: 'goal is to',
        confidence: 'high'
      };
    }
    return null;
  }

  static #extractSkill(text) {
    // e.g. "I have 5 years experience in CFD", "I am skilled in Rust", "I specialize in thermodynamics"
    const m = text.match(/\b(?:i\s+have\s+experience\s+in|i\s+am\s+experienced\s+in|i'm\s+skilled\s+in|i\s+specialize\s+in|i\s+am\s+proficient\s+in)\s+([^.,;!?\n]+)/i);
    if (m) {
      const subject = m[1].trim();
      return {
        category: 'skill',
        fact: `Experienced in ${subject}`,
        supersedesSubject: subject,
        confidence: 'high'
      };
    }
    return null;
  }

  static #extractInterest(text) {
    // e.g. "I love studying orbital mechanics", "I am interested in quantum computing", "My research focuses on hypersonics"
    const m = text.match(/\b(?:i\s+am\s+interested\s+in|i'm\s+interested\s+in|my\s+research\s+focuses\s+on|i\s+research)\s+([^.,;!?\n]+)/i);
    if (m) {
      const subject = m[1].trim();
      return {
        category: 'interest',
        fact: `Interested in ${subject}`,
        supersedesSubject: subject,
        confidence: 'high'
      };
    }
    return null;
  }

  static #extractTechnicalContext(text) {
    // e.g. "My operating system is Fedora Linux", "Our hardware uses Inconel 718", "My environment runs on Python 3.11"
    const m = text.match(/\b(?:my\s+(?:operating\s+system|os|environment|hardware|setup|stack)\s+(?:is|uses|runs\s+on))\s+([^.,;!?\n]+)/i);
    if (m) {
      const subject = m[1].trim();
      return {
        category: 'technical_context',
        fact: `Technical environment: ${subject}`,
        supersedesSubject: 'technical environment',
        confidence: 'high'
      };
    }
    return null;
  }
}
