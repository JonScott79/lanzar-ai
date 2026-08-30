/*
    memory-manager.js

    Unified memory orchestrator for LANZAR AI.

    Responsibilities
    - Coordinate short-term context, long-term knowledge, and project memory
    - Assemble memory prompt fragments for model provider requests
    - Connect short-term working memory to active conversation thread
*/

import { ShortTermMemory } from "./short-term.js";
import { LongTermMemory } from "./long-term.js";
import { ProjectMemory } from "./project-memory.js";
import { userMemoryService } from "./user-memory-service.js";

// =====================================
// Memory Manager Class
// =====================================

export class MemoryManager {
  constructor(conversationManager = null) {
    this.conversation = conversationManager;
    this.shortTerm = new ShortTermMemory(conversationManager);
    this.longTerm = new LongTermMemory();
    this.project = new ProjectMemory();
    this.userMemory = userMemoryService;
  }

  setConversationManager(convManager) {
    this.conversation = convManager;
    this.shortTerm.setConversationManager(convManager);
  }

  // =====================================
  // Context Assembly for Model
  // =====================================

  getAssembledContext(excludeCurrentMsgId = null) {
    const activeProj = this.project.getActiveProject();
    const userMemories = this.userMemory.getMemories();
    const facts = userMemories.length > 0
      ? userMemories.map(m => `[${m.category.toUpperCase()}] ${m.fact}`)
      : this.longTerm.getFacts().map(f => f.text);

    const elapsedSinceLastUserInput = this.shortTerm.getElapsedSinceLastUserInput(excludeCurrentMsgId);

    return {
      activeProject: activeProj ? { name: activeProj.name, desc: activeProj.description } : null,
      longTermFacts: facts,
      recentTurns: this.shortTerm.getMessages().slice(-10),
      elapsedSinceLastUserInput
    };
  }

  async getRelevantContext(query, limit = 5) {
    return await this.userMemory.getRelevantMemories(query, limit);
  }
}
