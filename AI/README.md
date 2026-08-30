# LANZAR AI — Application Body & Framework

> **"Intelligence from the Future. Built for Today."**  
> **Core Axiom: "The user should not have to learn how to talk to LANZAR. LANZAR should learn how humans actually talk."**

Welcome to the **LANZAR AI** application framework, engineered by **Larry** according to the [LANZAR Coding Standards](file:///c:/Projects/lanzar/_docs/coding-standards.md) and [Architecture Notes](file:///c:/Projects/lanzar/_docs/LANZAR_AI_ARCHITECTURE_NOTES.md).

LANZAR AI provides a character-driven, Atomic Age retro-futuristic AI experience that shares a single underlying intelligence presented through two distinct personas:
* **Penelope ("Penny")**: Whimsical, spunky, adventurous, experimental (*"Act → Observe → Adapt"*).
* **Peter ("Pete")**: Analytical, thoughtful, methodical, structured (*"Understand → Discuss → Plan → Act"*).

---

## 🏛️ Architecture Overview

The application framework separates the presentation and interaction **body** from the future underlying **brain** (AI model):

```text
LANZAR AI
├── Core
│   ├── app.js               (Main orchestrator)
│   ├── event-bus.js         (Decoupled Pub/Sub event system)
│   └── router.js            (Single-page view router)
├── Personas
│   ├── base-persona.js      (Shared values & honest reasoning ethics)
│   ├── penny.js             (Penny persona profile)
│   ├── pete.js              (Pete persona profile)
│   └── persona-manager.js   (Active persona state & switching)
├── Models (Pluggable Brain Layer)
│   ├── model-provider.js    (Abstract base provider contract)
│   ├── stub-provider.js     (In-character simulated engine)
│   └── provider-factory.js  (Future Ollama / Local / Foundation model factory)
├── Memory
│   ├── short-term.js        (Active conversation buffer)
│   ├── long-term.js         (Durable user facts & learnings)
│   ├── project-memory.js    (Project-scoped context)
│   └── memory-manager.js    (Unified context assembler)
├── Adaptation
│   ├── user-profile.js      (User preferences schema)
│   └── adaptation-manager.js(Communication tuning layer)
├── Tools & Lab
│   ├── tool-registry.js     (8 Canonical engineering instruments)
│   └── lab-controller.js    (Workbench dispatcher)
└── UI
    ├── hero-view.js         ("Meet Your LANZAR AI" split-screen hero)
    ├── console-view.js      (Launch Console conversation interface)
    ├── lab-view.js          (Tools & Lab workbench)
    └── settings-modal.js    (Settings & persona manager)
```

---

## 🚀 Key Features

1. **Meet Your LANZAR AI Hero**:
   - Interactive split-stage showcasing Penny & Pete with live hover dialogues and Atomic Age workshop environments.
   - Quick action triggers to select Penny, Pete, or dual-mind Collaboration mode.

2. **Launch Console (Conversation Engine)**:
   - Full conversation stream with character styling, avatar badges, and simulated token streaming.
   - Live persona switching directly from header or settings without losing conversational memory or active projects.

3. **Tools & Lab Workbench**:
   - Integrated dashboard for the 8 canonical tools: *Brainstorm Pad, Research Terminal, Equation Solver, Data Analyzer, System Modeler, Code Workbench, Diagram Studio, Report Writer*.
   - Live project dashboard demonstration for *Rocket Engine Redesign*.

4. **Settings & Adaptation**:
   - Live adjustments for technical depth (Standard, Advanced, Deep Theoretical) and conversational pace.
   - Memory inspector for durable long-term facts.

---

## 🛠️ Development & Standards

* Follows `_docs/coding-standards.md`.
* Standard CSS variables and zero external build tool dependencies.
* Vanilla JavaScript ES6+ modules.
* Accessible keyboard navigation with `:focus-visible` outlines and WCAG AA contrast.
