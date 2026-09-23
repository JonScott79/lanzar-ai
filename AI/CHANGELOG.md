# LANZAR AI — Changelog

All notable changes to the LANZAR AI application framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0-alpha] - 2026-09-22

### Added
- **DuckDuckGo Lite Live Search Integration**: Added DDG Lite live web search capability to the cognitive routing pipeline, enabling real-time information retrieval for current-events and factual queries.
- **Pythos Submodule Phase B — Context Window & Conversation Management**: Upgraded Pythos integration to Phase B with context window management, conversation threading, and memory-aware mathematical dialogue.
- **Child-Safe Language & Zero-Profanity Mandate (Pythos)**: Added explicit child-safe language enforcement and zero-profanity policy to the Pythos subsystem.
- **Authoritative Developer Guide**: Published comprehensive developer guide for creating and registering new brain packages within the LANZAR AI modular architecture.

### Changed
- **Enhanced Cognitive Routing & Persona Deference**: Improved cognitive routing accuracy with better persona deference logic and expanded test coverage across routing scenarios.
- **Hosted Cloud Engine Default**: Defaulted active model provider to the hosted cloud engine, ensuring authoritative telemetry for live clock and real-time queries.

### Fixed
- **Arithmetic Hijacking of Equivalence Inquiries (Pythos)**: Prevented standalone arithmetic from hijacking equivalence inquiries and active expression follow-ups in the Pythos math pipeline.
- **Conversational Salutation Parsing**: Cleaned conversational salutations (greetings, addresses) before parsing arithmetic expressions, preventing false math triggers on casual messages.
- **Conversational Address Greeting Detection**: Refined greeting detection in the stub provider pipeline to prevent conversational addresses from being misrouted.
- **Speaker Handoff Announcements**: Eliminated artificial speaker handoff announcements in the router, fixed task priority over persona selection, and enabled general utility response handling across all minds.

---

## [0.3.0-alpha] - 2026-08-28

### Added
- **Long-Term Memory & User Fact Extraction Engine**: Built server-authoritative long-term user memory subsystem (`UserMemoryStore`, `userMemoryService`, and `FactExtractor`). Extracts persistent user facts across an explicit taxonomy (`preference`, `project`, `skill`, `goal`, `interest`, `workflow`, `personal_context`, `technical_context`) asynchronously during conversations. Strictly filters out temporary questions, calculation commands, hypotheticals, and character statements. Provided full user inspection and CRUD control (Edit, Delete, Add Fact) in the Settings Modal. Memory is owned by the human user and shared across all characters (Penny, Pete, Mina, LANZAR Core) via a model-independent retrieval interface (`getRelevantMemories`).
- **Conversation Thread Export & Artifact Generation**: Added comprehensive export capabilities to `ConversationManager` and `ConsoleViewController`. Users can download active threads in **Markdown (`.md`)** with character badges and mathematical derivations, **JSON (`.json`)** with full schema and command history, or **Plain Text (`.txt`)** engineering briefings with 1 click from the header navigation bar.
- **Collaborative Multi-Mind Banter & Triad Synthesis Engine**: Upgraded `CognitiveRouter` and `StubModelProvider` with `triad_synthesis` routing. Complex multi-disciplinary aerospace and system design challenges automatically trigger collaborative multi-mind debate across all three active personalities (Penny's propulsion audacity, Pete's thermodynamic equations and physical feasibility, Mina's visual aesthetics and cockpit ergonomics) before delivering a synthesized consensus blueprint from LANZAR AI Core. Respects user-scoped enablement states, seamlessly decaying to Dual Mind or single-mind fallbacks when characters are disabled.
- **Interactive Tools & Laboratory Workbenches**: Built runtime interactive engineering and scientific instruments in Tools & Lab: **Pete's Equation Solver** (rocket thrust, $I_{sp}$, Tsiolkovsky $\Delta v$, and regenerative heat flux with interactive parameter sliders), **Penny's Brainstorm Pad** (multidimensional divergence clustering and rapid prototyping concepts), and **Mina's Diagram Studio** (interactive vector SVG blueprints with cross-section schematics). Added 1-click export of laboratory findings directly into active conversation threads.
- **Per-User Profile & Persistent Settings**: Implemented server-authoritative per-user profile and settings store (`UserProfileStore` and `userSettingsManager`). Enabled persistent customization of user profile metadata (`preferredName`, `occupation`, `interests`, `goals`, `aboutMe`) and user-scoped settings (`enabledCharacters`, `activeModelProvider`, `perspectiveMode`, `banterFrequency`, `technicalDepth`) isolated by authenticated UID.
- **Character Enablement State Isolation**: Integrated `CharacterRegistry` with user settings, ensuring character disablement (e.g. disabling Mina or Pete) applies strictly to the authenticated user without mutating global character definitions or other users' configurations.
- **LANZAR Auth Hub & Authoritative User Identity Integration**: Connected LANZAR AI directly to the ecosystem authentication architecture (`lanzar-95ae3` Firebase Admin & Auth Hub on port 4001). Implemented server-side token verifier (`AuthVerifier`) rejecting unauthorized and cross-user requests with `401 Unauthorized` / `403 Forbidden`. Built client-side `AuthService`, dynamic header navigation identity indicators, Atomic Age `AuthModalController`, and user profile foundations with zero browser userId trust.
- **Multi-Conversation Thread CRUD & Session Isolation**: Implemented complete server-authoritative multi-conversation thread orchestration (`ConversationStore` and `ConversationManager`). Provides `+ New Thread` creation, listing, switching, renaming, and deletion with thread-scoped message isolation, thread-isolated command history (`↑`/`↓`), character context persistence, and strict server-side authorization (403 Forbidden across user boundaries).
- **LANZAR Character / Personality Registry**: Implemented true independent AI character entity architecture (`Character`) decoupling character identity, role, cognitive specialty, capabilities, and visual assets from underlying model providers (`ModelConfig` $\rightarrow$ `ModelProvider` $\rightarrow$ `Model`). Registered Penny (Engineer), Pete (Scientist / Think Tank), and Mina (Art Director) with dynamic left-panel rendering, independent selection vs. enabled states, and registry-driven cognitive routing.
- **Model Switcher & LANZAR-001 PyTorch Integration**: Integrated full model switching UI in the console top bar and settings modal, allowing users to toggle seamlessly between `⚡ LANZAR Triad (Simulated)` and `⚛ LANZAR-001 PyTorch (Port 5050)` with real-time SSE token streaming, status telemetry dot, and graceful offline fallback.
- **Terminal-Style Chat Composer Command History (`↑` / `↓`)**: Implemented shell-like input command history (`CommandHistory`) in the chat composer. Users can press `↑` to walk backward through previously submitted prompts, edit recalled inputs without mutating history, press `↓` to walk forward back to their uncommitted draft, and use touch/mouse stepper buttons.
- **Strict Routing Enforcement**: Cognitive Router strictly filters all intents through enabled personas only; disabled personas will never silently participate.

---

## [0.2.0-alpha] - 2026-08-26

### Changed
- **Dual Mind Architecture Shift**: Removed separate character selection; the user interacts directly with **LANZAR AI** as a unified intelligence.
- **Dynamic Perspective Dispatch**: LANZAR dynamically determines whether **Penny** leads (Possibility & Action), **Pete** leads (Analysis & Systems), both engage in collaborative banter & synthesis, or LANZAR responds directly.
- **Onboarding Experience**: Redesigned "Meet Your LANZAR AI" hero stage into a unified showcase with live character banter ("And she's the reason we have a fire extinguisher...") and single Launch Console CTA.
- **Headshot Avatars**: Added dedicated circular Atomic Age headshots for Penelope and Peter across conversation bubbles and banter streams.
- **Sequential Multi-Bubble Banter**: Converted collaborative dialogues into distinct, sequential message cards for each persona instead of merging them into a single bubble.
- **Settings Revision**: Replaced manual persona selection with Perspective Dynamics (Auto, Lean Penny, Lean Pete, Direct) and Banter Frequency tuning.

---

## [0.1.0-alpha] - 2026-08-26

### Added
- Initial **LANZAR AI** application framework shell built by **Larry**.
- Interactive "Meet Your LANZAR AI" split-screen hero experience highlighting **Penelope ("Penny")** and **Peter ("Pete")**.
- Canonical character presentation and voice previews with distinct Atomic Age environments.
- Launch Console conversation interface with real-time simulated token generation, persona badging, and dialogue cards.
- Support for dual-mind collaboration mode ("Let Them Collaborate").
- Pluggable **ModelProvider** layer with `StubModelProvider` and factory for future Ollama, Local Python, and LANZAR Foundation models.
- **MemoryManager** architecture with Short-Term conversation buffer, Long-Term durable facts, and Project-scoped context (*Rocket Engine Redesign*).
- **AdaptationManager** with customizable user technical depth, conversational pace, and explanation style.
- **Tools & Lab Workbench** featuring the 8 canonical research and engineering instruments (Brainstorm Pad, Research Terminal, Equation Solver, Data Analyzer, System Modeler, Code Workbench, Diagram Studio, Report Writer).
- Settings modal for live persona switching without data loss, memory inspection, and adaptation controls.
- Full compliance with `_docs/coding-standards.md` (centralized analytics, semantic HTML5, CSS tokens, WCAG AA accessibility, zero dependencies).
