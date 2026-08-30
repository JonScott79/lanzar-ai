/*
    lab-controller.js

    Workbench tool dispatch and execution controller for LANZAR AI.

    Responsibilities
    - Handle tool launch events
    - Route tool executions through event bus and analytics
*/

import { LAB_TOOLS } from "./tool-registry.js";
import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";

// =====================================
// Lab Controller Class
// =====================================

export class LabController {
  #tools = LAB_TOOLS;

  getTools() {
    return [...this.#tools];
  }

  launchTool(toolId) {
    const tool = this.#tools.find(t => t.id === toolId);
    if (!tool) {
      console.warn(`[LabController] Tool not found: ${toolId}`);
      return;
    }

    Analytics.track("Tools", "Launch", { toolId, toolName: tool.name });
    globalBus.emit("tool:launched", { tool });
  }
}
