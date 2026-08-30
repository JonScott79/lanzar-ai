/*
    project-memory.js

    Project-scoped context and metadata for LANZAR AI.

    Responsibilities
    - Store active project specifications, milestones, and working notes
    - Support multi-project workspace switching
*/

import { StorageAdapter } from "./storage-adapter.js";
import { STORAGE_KEYS } from "../config.js";

// =====================================
// Project Memory Class
// =====================================

export class ProjectMemory {
  #projects = [];
  #activeProjectId = "proj_rocket";

  constructor() {
    const defaultProject = {
      id: "proj_rocket",
      name: "Rocket Engine Redesign",
      status: "In Progress",
      progress: 28,
      leadPersona: "both",
      description: "Developing regenerative cooling channels with bio-inspired heat sink micro-swirl geometries.",
      documents: [
        { id: "doc_1", title: "Combustion Stability Analysis", date: "Yesterday" },
        { id: "doc_2", title: "Heat Exchanger Concepts", date: "10:24 AM" },
        { id: "doc_3", title: "Thrust Optimization Matrix", date: "May 10" }
      ],
      createdAt: new Date().toISOString()
    };

    const saved = StorageAdapter.get(STORAGE_KEYS.PROJECT_MEMORY, [defaultProject]);
    this.#projects = Array.isArray(saved) ? saved : [defaultProject];
  }

  getActiveProject() {
    return this.#projects.find(p => p.id === this.#activeProjectId) || this.#projects[0];
  }

  getAllProjects() {
    return [...this.#projects];
  }

  setActiveProject(projectId) {
    if (this.#projects.some(p => p.id === projectId)) {
      this.#activeProjectId = projectId;
      this.#save();
    }
  }

  #save() {
    StorageAdapter.set(STORAGE_KEYS.PROJECT_MEMORY, this.#projects);
  }
}
