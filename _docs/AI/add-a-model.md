# Adding a New Brain to LANZAR AI

Version: 1.0  
Status: Authoritative Developer Reference  
Last Updated: August 2026  

---

## 1. Document Purpose

This document explains the complete architectural workflow for creating, packaging, and registering a new AI brain (specialist persona) in **LANZAR AI**.

The documentation reflects the **current codebase implementation** (Sprint 3) rather than an idealized future state.

---

## 2. Core Concept: Dynamic Registration vs. Hardcoded Routing

LANZAR treats minds as **dynamically registered participants** rather than static `if/else` clauses inside a central router.

### What the Cognitive Router Does NOT Do:
```javascript
// DO NOT DO THIS (Anti-pattern)
if (request.includes("chemistry")) return "dr_chem";
if (request.includes("orbital")) return "pete";
```

### What LANZAR Actually Does:
When a user asks a question, the **Cognitive Router** dynamically analyzes the request against the declared capability and domain profile of every currently registered character:

```
User Request
    ↓
analyzeRequest(query)
    ↓
Character.evaluateBid(analysis)  [Calculated for every registered mind]
    ↓
Autonomous Bid Resolution
    ↓
Winner Dispatched (Single Specialist, Dual Mind, or Triad Synthesis)
```

Adding a new brain into LANZAR requires **zero modifications** to:
1. `AI/js/models/cognitive-router.js` (The Cognitive Router)
2. `AI/js/models/hosted-provider.js` or `AI/js/models/stub-provider.js` (Model Provider Infrastructure)
3. Existing persona classes (`Penny`, `Pete`, `Mina`)

---

## 3. Current Architecture Overview

The lifecycle of a brain package is defined by this direct pipeline:

```
┌────────────────────────────────────────────────────────┐
│               Brain Package Manifest                  │
│       (Plain JavaScript Object or JSON config)         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 BrainPackageLoader                     │
│    - Validates required fields, schema & types         │
│    - Enforces prompt, capability & domain contracts    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Character                          │
│    - Encapsulates Identity, Visuals & Model Config     │
│    - Exposes evaluateBid(analysis) method              │
│    - Exposes matchesAddress(query) method              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  PersonaManager                        │
│    - Authoritative registry Map                        │
│    - Controls ENABLED / DISABLED states                │
│    - Manages direct user selection locks vs Auto       │
│    - Emits reactive lifecycle events                   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Cognitive Router                       │
│    - Semantic request analysis                         │
│    - Dispatches queries to highest-affinity bids       │
│    - Resolves multi-character collaboration            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Model Inference & Lab Tooling               │
│    - Server-Side Hosted Proxy (OpenAI / Groq API)      │
│    - Deterministic Math / Physics / Stats Engines      │
│    - Universal Web Research Tooling                    │
└────────────────────────────────────────────────────────┘
```

---

## 4. The Brain Package Manifest Specification

Every brain package is declared as a manifest object. The fields below are **authoritatively enforced** by `BrainPackageLoader.validateManifest()`.

### Enforced Manifest Schema

| Field | Required | Type | Description | Example |
| :--- | :---: | :--- | :--- | :--- |
| `id` | **Yes** | `string` | Unique alphanumeric identifier with dashes or underscores (`^[a-z0-9_-]+$`). | `"dr_chem"` |
| `name` | **Yes** | `string` | Primary display name. | `"Dr. Evelyn Chem"` |
| `shortName` | No | `string` | Short callsign. Defaults to `name` if omitted. | `"Dr. Chem"` |
| `fullName` | No | `string` | Formal name. Defaults to `name` if omitted. | `"Dr. Evelyn Chem, Ph.D."` |
| `title` | No | `string` | Formal organizational title. | `"Director of Molecular Synthesis"` |
| `codeName` | No | `string` | 4-letter station callsign. Defaults to uppercase ID slice. | `"CHEM"` |
| `role` | **Yes** | `string` | Primary domain role. | `"Quantum Chemist"` |
| `roleSummary` | No | `string` | Short subtitle tag for UI badges. | `"Chemistry • Deep Theory"` |
| `cognitiveStyle` | No | `string` | Short description of cognitive approach. | `"Methodical / Molecular / Exacting"` |
| `capabilities` | **Yes** | `Array<string>` | **Non-empty** array of capability tokens. Evaluated by router bids. | `["quantum_chemistry", "spectroscopy", "molecular_orbital_theory"]` |
| `domainAffinities` | **Yes** | `Array<string>` | Array of high-level and granular domain tags. | `["chemistry", "quantum_chemistry", "spectroscopy"]` |
| `toolAffinities` | No | `Array<string>` | Tools this persona is especially suited to leverage. | `["spectroscopic_analyzer", "web_research"]` |
| `addressAliases` | No | `Array<string>` | Lowercase alias tokens triggering explicit address matching. | `["dr chem", "evelyn", "dr. chem"]` |
| `visualIdentity` | No | `Object` | `{ avatar, headshot, accentColor, badgeClass }` | `{ accentColor: "#00e676" }` |
| `modelConfig` | **Yes** | `Object` | Decoupled model inference parameters. | See sub-table below |
| `personality` | No | `Object` | Character traits: `{ description, voice, tagline, motto, traits, spokenIntro }` | `{ motto: "Matter tells energy where to flow." }` |
| `enabled` | No | `boolean` | Initial availability state. Defaults to `true`. | `true` |

### `modelConfig` Schema

| Sub-Field | Required | Type | Description | Example |
| :--- | :---: | :--- | :--- | :--- |
| `systemPrompt` | **Yes** | `string \| Function` | System prompt defining character perspective, tone, and constraints. | `"You are Dr. Evelyn Chem..."` |
| `model` | No | `string` | Target model key (e.g. `"default"`, `"openai/gpt-oss-120b"`). Defaults to `"LANZAR-001"`. | `"openai/gpt-oss-120b"` |
| `temperature` | No | `number` | Sampling temperature ($0.0 \le T \le 1.0$). Defaults to `0.7`. | `0.4` (for exact chemistry) |
| `maxTokens` | No | `number` | Maximum tokens per response. Defaults to `350`. | `400` |
| `providerKey` | No | `string` | Provider key (`"stub"`, `"hosted"`). Defaults to `"stub"`. | `"hosted"` |

---

## 5. Complete Working Example: `Dr. Chem` (Quantum Chemist)

Here is a complete, production-ready Brain Package manifest demonstrating how a fictional specialist declares capabilities, domains, tools, and identity:

```javascript
export const drChemManifest = {
  id: "dr_chem",
  name: "Dr. Evelyn Chem",
  shortName: "Dr. Chem",
  fullName: "Dr. Evelyn Chem, Ph.D.",
  title: "Director of Molecular Synthesis & Spectroscopy",
  codeName: "CHEM",
  role: "Quantum Chemist",
  roleSummary: "Chemistry • Exacting",
  cognitiveStyle: "Methodical / Molecular / Spectroscopic",
  capabilities: [
    "quantum_chemistry",
    "spectroscopy",
    "molecular_orbital_theory",
    "reaction_kinetics",
    "chemical_equilibrium",
    "stoichiometry",
    "coordination_chemistry"
  ],
  domainAffinities: [
    "chemistry",
    "quantum_chemistry",
    "spectroscopy",
    "molecular_modeling",
    "organic_synthesis"
  ],
  toolAffinities: [
    "web_research",
    "spectroscopic_analyzer",
    "stoichiometry_solver"
  ],
  addressAliases: [
    "dr chem",
    "dr. chem",
    "evelyn",
    "evelyn chem",
    "doctor chem"
  ],
  visualIdentity: {
    avatar: "assets/images/characters/Chem/dr-chem-headshot.png",
    headshot: "assets/images/characters/Chem/dr-chem-headshot.png",
    accentColor: "#00e676",
    badgeClass: "badge-chem"
  },
  modelConfig: {
    providerKey: "hosted",
    model: "openai/gpt-oss-120b",
    temperature: 0.35,
    maxTokens: 450,
    systemPrompt: (adaptation = {}) => `You are Dr. Evelyn Chem, Director of Molecular Synthesis on the LANZAR AI character team.
Role: Quantum Chemist & Molecular Spectroscopy Specialist.
Temperament: Methodical, precise, deeply knowledgeable in ligand field theory, orbital transitions, and reaction mechanisms.
Motto: "Precision at the atomic scale."

Guidelines:
1. Explain chemical phenomena using rigorous molecular orbital principles and spectroscopic notation.
2. Maintain your dignified, analytical scientific voice.
3. If asked about rapid hardware prototyping or visual art, collaborate with or defer to Penny or Mina when appropriate.`
  },
  personality: {
    description: "Exacting quantum chemist specializing in electronic transitions and advanced molecular synthesis.",
    voice: "Precise, articulate, and scientifically rigorous with dry academic wit.",
    tagline: "Matter tells energy where to flow.",
    motto: "Precision at the atomic scale.",
    temperament: "Analytical & Patient",
    traits: ["Methodical", "Exacting", "Perceptive", "Articulate"],
    spokenIntro: "Spectrometer calibrated. Let us analyze the electronic structure."
  },
  enabled: true
};
```

---

## 6. How to Load and Register a Brain Package

Registration is executed through `PersonaManager`:

```javascript
import { personaManager } from "./js/personas/persona-manager.js";
import { drChemManifest } from "./brains/dr-chem.js";

// 1. Load the manifest
const character = personaManager.loadBrainPackage(drChemManifest);

console.log(`Successfully registered: ${character.name} (${character.id})`);
```

### What Happens Internally During `loadBrainPackage()`:
1. **Manifest Validation**: `BrainPackageLoader.validateManifest()` verifies that all required fields (`id`, `name`, `role`, `capabilities`, `domainAffinities`, `modelConfig.systemPrompt`) exist and conform to specifications. If malformed, an explicit descriptive error is thrown.
2. **Character Hydration**: A new `Character` instance is constructed from the manifest.
3. **Registry Insertion**: The persona is registered into the private `#registry` Map in `PersonaManager`.
4. **Lifecycle Broadcast**: Two event-bus notifications are fired:
   - `personas:changed` (updates UI character selectors, active character lists, and settings)
   - `personas:status-changed` (notifies cognitive routing listeners of available minds)
5. **Immediate Cognitive Availability**: The brain is now available to `CognitiveRouter.route()` and `CognitiveRouter.evaluatePersonaBids()` without any additional configuration.

---

## 7. How to Unload a Brain Package

Dynamic brains can be hot-unloaded when no longer needed:

```javascript
personaManager.unloadBrainPackage("dr_chem");
```

### Protection of Core Triad Personalities:
`PersonaManager.unloadBrainPackage()` enforces authoritative safety rules. Attempting to unload a core built-in personality will throw an error:

```javascript
// This will THROW an Error:
personaManager.unloadBrainPackage("pete");
// Error: Cannot unload core built-in mind 'pete'. Use setPersonaEnabled('pete', false) instead.
```

The core personalities protected by default are:
- `penny` (Penelope Vance)
- `pete` (Peter Sterling)
- `mina` (Mina Chen)

To temporarily disable a core mind without unloading it, use:
```javascript
personaManager.setPersonaEnabled("pete", false);
```

---

## 8. How Autonomous Cognitive Routing Evaluates the New Brain

Once registered, the new brain participates in capability bidding autonomously.

### Real Routing Example:

```
User Query:
"Derive the molecular orbital energy levels and spectroscopic transition for an octahedral d6 coordination complex"
```

1. `CognitiveRouter.analyzeRequest(query)` extracts semantic dimensions:
   - `requiredCapabilities`: `["quantum_chemistry", "spectroscopy", "molecular_orbital_theory", "octahedral", "complex"]`
   - `domains`: `["chemistry", "quantum_chemistry", "spectroscopy", "molecular_modeling"]`
   - `taskType`: `"chemistry_analysis"`
   - `reasoningDepth`: `"high"`
2. Every enabled character computes its affinity score via `evaluateBid(analysis)`:
   - **Penny**: Score `0.0` (Hardware/Engineering specialist)
   - **Mina**: Score `0.0` (Art/Design specialist)
   - **Pete**: Score `4.5` (General mathematics/physics alignment)
   - **Dr. Chem**: Score `18.0` (Direct matches across quantum chemistry, spectroscopy, molecular orbital theory, and chemistry domain)
3. **Router Decision**:
   ```json
   {
     "owner": "dr_chem",
     "selectedMind": "dr_chem",
     "confidence": 0.95,
     "taskType": "chemistry_analysis",
     "primaryCandidate": "dr_chem",
     "secondaryCandidates": ["pete"],
     "collaborationPotential": false,
     "reason": "Dr. Chem won autonomous bid with score 18.0 (capability:quantum_chemistry, capability:spectroscopy, capability:molecular_orbital_theory, domain:chemistry, domain:quantum_chemistry, domain:spectroscopy, domain:molecular_modeling)"
   }
   ```

---

## 9. Multi-Mind Collaboration with Custom Brains

When a request spans multiple distinct domains (e.g. Chemical Synthesis + Rapid Hardware Prototyping + Thermal Calculations + Visual UI), `CognitiveRouter.evaluatePersonaParticipation()` detects convergence across all participating specialists.

### Example Multi-Mind Synthesis ($n=4$):
```
User Query:
"Synthesize an organic liquid propellant, design the high-pressure injector, calculate combustion temperature, and render the fluid manifold HUD"
```

The router dynamically scores the bid field and resolves cardinality:
- **`dr_chem`** $\rightarrow$ chemical propellant synthesis
- **`penny`** $\rightarrow$ hardware injector fabrication
- **`pete`** $\rightarrow$ combustion temperature calculations
- **`mina`** $\rightarrow$ fluid manifold HUD styling

Participants engaged: `["dr_chem", "penny", "pete", "mina"]`.

---

## 10. Decoupled Model Configuration & Tooling

### Model Decoupling
Character model configuration is completely decoupled from the routing engine:
- A brain can declare its preferred model (e.g. `openai/gpt-oss-120b`, `qwen/qwen3.6-27b`, or a local custom endpoint).
- Temperature and token limits are set on the character manifest and passed directly to the server-side hosted inference proxy.
- Character system prompts can be dynamic functions accepting adaptation contexts (e.g. user memory, discovered character traits).

### Tool Affinities vs. Exclusivity
- Declaring `toolAffinities: ["web_research"]` signals to the Cognitive Router that this character is well-suited to handle research tasks in their domain.
- **Tools are NOT exclusive locks**. Any active character has access to universal tools (such as live DuckDuckGo web search or deterministic calculation engines) when external evidence or calculation is required.

---

## 11. Security & Trust Boundaries

1. **Manifests are Configuration, Not Arbitrary Code**:
   - `BrainPackageLoader` validates plain objects and functions.
   - Brain package prompts cannot override server-side safety boundaries (`ContentSafetyBoundary.js`).
2. **Server-Side Enforcement**:
   - The server validates all model requests against the server allowlist (`ALLOWED_MODELS`).
   - Hosted API keys (`HOSTED_AI_API_KEY`) remain strictly on the server and are never exposed to brain manifests or client payloads.
3. **No Unchecked Privilege Escalation**:
   - A newly registered brain inherits standard character permissions. It cannot bypass authentication headers or access isolated user session stores.

---

## 12. Step-by-Step Developer Workflow

Follow this checklist when adding a new brain:

- [ ] **Step 1: Create Brain Manifest**: Create a new file (e.g. `AI/js/personas/dr-chem.js`) exporting your manifest object.
- [ ] **Step 2: Declare Identity & Role**: Define `id`, `name`, `shortName`, `role`, and `title`.
- [ ] **Step 3: Declare Capabilities & Domains**: Add specific capability tokens and domain affinities matching your brain's domain.
- [ ] **Step 4: Define System Prompt**: Write an authentic system prompt encapsulating role, voice, and boundaries.
- [ ] **Step 5: Define Visual Assets**: Provide avatar paths and accent colors.
- [ ] **Step 6: Register via PersonaManager**: Call `personaManager.loadBrainPackage(manifest)`.
- [ ] **Step 7: Add Unit & Integration Tests**: Create a dedicated test file in `AI/tests/` asserting manifest validity, bid victory, and multi-domain participation.
- [ ] **Step 8: Run Full Regression Battery**: Execute all repository test suites to ensure $100\%$ pass with zero regressions.

---

## 13. Testing Reference

The canonical test battery for Brain Package Discovery and extensible registration is located at:

```
c:\Projects\lanzar\AI\tests\test_cognitive_router_sprint3_discovery.js
```

### Verified Test Cases:
1. `MANIFEST_SCHEMA_VALIDATION_MALFORMED`: Rejects invalid or incomplete manifests with descriptive errors.
2. `MANIFEST_SCHEMA_VALIDATION_VALID`: Confirms full compliance with the manifest specification.
3. `HOT_PLUG_DYNAMIC_BRAIN_REGISTRATION`: Validates dynamic runtime insertion into `PersonaManager`.
4. `DYNAMIC_BRAIN_AUTONOMOUS_BID_VICTORY`: Validates autonomous cognitive routing to the new specialist without router code modifications.
5. `DYNAMIC_BRAIN_PARTICIPATION_SYNTHESIS`: Validates 4-way multi-mind collaboration with custom brains.
6. `CORE_TRIAD_UNLOAD_PROTECTION`: Enforces protection preventing `penny`, `pete`, or `mina` from being unloaded.
7. `DYNAMIC_BRAIN_HOT_UNLOAD`: Validates clean removal of dynamically loaded brains.

To run the discovery test suite:
```bash
node c:\Projects\lanzar\AI\tests\test_cognitive_router_sprint3_discovery.js
```

---

## 14. Troubleshooting Guide

| Issue | Likely Cause | Resolution | Where to Look |
| :--- | :--- | :--- | :--- |
| **Manifest validation error thrown** | Missing required field (`id`, `name`, `role`, `capabilities`, `domainAffinities`, `modelConfig.systemPrompt`). | Inspect the error message. Ensure all required fields exist and `id` matches `^[a-z0-9_-]+$`. | `AI/js/personas/brain-package-loader.js` |
| **Brain never wins a bid** | Capability or domain tokens in manifest do not match vocabulary extracted by `analyzeRequest()`. | Ensure capability tokens use standard naming (e.g. `spectroscopy`, `orbital_mechanics`) or substantive domain keywords. | `Character.evaluateBid()` in `AI/js/personas/character.js` |
| **Brain wins inappropriate queries** | Sub-token matching is too broad or includes common English connector words. | Use specific compound tokens (e.g. `molecular_spectroscopy`) and verify connector words are filtered. | `evaluateBid()` in `AI/js/personas/character.js` |
| **Brain appears in registry but not in routing** | Brain was registered as disabled (`enabled: false`) or disabled via user settings. | Call `personaManager.setPersonaEnabled(id, true)`. | `isPersonaEnabled()` in `AI/js/personas/persona-manager.js` |
| **Server inference fails for custom model** | Manifest specifies a model string not included in the server's allowlist. | Use an allowed model (`openai/gpt-oss-120b`, `default`) or add the model to `ALLOWED_MODELS` on server. | `AI/server/hosted-inference-service.js` |

---

## 15. Core Design Principles

1. **Do not hard-code a new brain into CognitiveRouter**: If adding a brain requires editing the router, the brain package contract was violated.
2. **Declare capabilities rather than creating keyword exception lists**: Bidding must emerge naturally from semantic alignment.
3. **Keep personality separate from capability**: Personality determines *how* a character speaks; capabilities determine *what problems* they solve.
4. **Keep tools separate from personality**: All characters have access to shared tools (web research, deterministic math); tool affinities reflect competence, not exclusive locks.
5. **Preserve general-purpose intelligence**: Ensure fallback and general conversational questions do not falsely route to hyperspecialized brains.
6. **Prefer dynamic registration**: Register through `PersonaManager.loadBrainPackage()`.
7. **Add regression tests with every new brain**: Every new specialist must include tests verifying both positive claim and negative restraint.
8. **Do not break existing minds**: Registration of a new mind must never compromise the integrity of Penny, Pete, or Mina.
9. **The manifest is a strict contract**: Adhere strictly to the `BrainPackageLoader` specification.

---

## 16. Current Limitations (As of August 2026)

To ensure technical honesty, the following features are **not currently implemented** and must not be assumed:
- **No Automatic Filesystem Folder Scanning**: Brain packages must currently be imported and registered programmatically via `personaManager.loadBrainPackage(manifest)`. There is currently no daemon watching a `brains/` folder on disk.
- **No Third-Party Sandboxed Runtime**: Brain manifests run in the main execution context. Untrusted user-submitted scripts should not be evaluated as executable JavaScript modules without prior server-side sanitization.
- **In-Memory Registry**: Dynamically loaded packages registered at runtime in browser sessions are held in `PersonaManager` memory; persistent auto-loading across full browser reloads requires calling `loadBrainPackage` during application boot.

---

## 17. Future Architecture Roadmap (Non-Actionable)

The following enhancements represent the intended future direction for the LANZAR Brain Package ecosystem:

- **Automatic Directory Discovery**: Auto-discovery of standalone package folders (`brains/dr-chem/brain-manifest.json`).
- **Versioned Brain Packages**: SemVer support (`@lanzar/brain-dr-chem@1.2.0`).
- **Signed & Sandboxed Packages**: Cryptographic signature verification for third-party community brains.
- **Dynamic Brain-to-Brain Handoff Protocol**: Structured negotiation between specialist minds during complex multi-step reasoning.
