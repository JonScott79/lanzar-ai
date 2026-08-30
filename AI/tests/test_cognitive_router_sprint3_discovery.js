/*
    test_cognitive_router_sprint3_discovery.js

    Unit and Integration Test Suite for Cognitive Router Sprint 3:
    - Standardized Brain Package Manifest Schema Validation
    - Hot-Plugging / Dynamic Brain Package Loading in PersonaManager
    - Dynamic Bidding & Routing Autonomy for 4th/Custom Personas (e.g. Dr. Chem, Astro-Nav)
    - Dynamic Multi-Mind Collaboration / Cardinality Synthesis with Custom Brains
    - Safe Unloading & Protection of Core Triad Minds
*/

const assert = require('assert');
const { PersonaManager } = require('../js/personas/persona-manager.js');
const { BrainPackageLoader } = require('../js/personas/brain-package-loader.js');
const { CognitiveRouter } = require('../js/models/cognitive-router.js');

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  try {
    process.stdout.write(`Testing [${name}]... `);
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(() => {
        passed++;
        console.log('PASSED');
      }).catch(err => {
        console.log('FAILED');
        console.error(err);
        process.exitCode = 1;
      });
    } else {
      passed++;
      console.log('PASSED');
    }
  } catch (err) {
    console.log('FAILED');
    console.error(err);
    process.exitCode = 1;
  }
}

(async () => {
  console.log("===============================================================================");
  console.log("  LANZAR AI — COGNITIVE ROUTER SPRINT 3: BRAIN-PACKAGE DISCOVERY & REGISTRATION");
  console.log("===============================================================================\n");

  // 1. Manifest Validation
  test("MANIFEST_SCHEMA_VALIDATION_MALFORMED", () => {
    const invalidManifest = { id: "bad_brain" }; // Missing name, capabilities, role, modelConfig
    const val = BrainPackageLoader.validateManifest(invalidManifest);
    assert.strictEqual(val.valid, false);
    assert.ok(val.errors.length >= 3, "Should catch multiple schema violations");
  });

  test("MANIFEST_SCHEMA_VALIDATION_VALID", () => {
    const validManifest = {
      id: "dr_chem",
      name: "Dr. Evelyn Chem",
      role: "Quantum Chemist",
      capabilities: ["quantum_chemistry", "spectroscopy", "molecular_orbital_theory", "reaction_kinetics"],
      domainAffinities: ["chemistry", "quantum_chemistry", "spectroscopy", "organic_synthesis"],
      modelConfig: {
        model: "LANZAR-CHEM-01",
        systemPrompt: "You are Dr. Evelyn Chem, quantum chemistry specialist."
      }
    };
    const val = BrainPackageLoader.validateManifest(validManifest);
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.errors.length, 0);
  });

  // 2. Hot-Plugging into PersonaManager
  const manager = new PersonaManager();

  test("HOT_PLUG_DYNAMIC_BRAIN_REGISTRATION", () => {
    const chemManifest = {
      id: "dr_chem",
      name: "Dr. Evelyn Chem",
      shortName: "Dr. Chem",
      role: "Quantum Chemist",
      capabilities: ["quantum_chemistry", "spectroscopy", "molecular_orbital_theory", "reaction_kinetics", "chemical_equilibrium"],
      domainAffinities: ["chemistry", "quantum_chemistry", "spectroscopy", "molecular_modeling"],
      toolAffinities: ["stoichiometry_solver", "spectroscopic_analyzer"],
      modelConfig: {
        model: "LANZAR-CHEM-01",
        systemPrompt: "You are Dr. Evelyn Chem, quantum chemistry specialist on the LANZAR AI character team."
      }
    };

    const char = manager.loadBrainPackage(chemManifest);
    assert.strictEqual(char.id, "dr_chem");
    assert.strictEqual(manager.getAllPersonas().length, 4, "Should now have 4 registered personas");
    assert.ok(manager.isPersonaEnabled("dr_chem"));
  });

  // 3. Autonomous Cognitive Bidding for Newly Discovered Mind
  test("DYNAMIC_BRAIN_AUTONOMOUS_BID_VICTORY", () => {
    const query = "Derive the molecular orbital energy levels and spectroscopic transition for an octahedral d6 coordination complex";
    const decision = CognitiveRouter.route(query, [], { personaManager: manager });

    assert.strictEqual(decision.owner, "dr_chem", "Newly loaded Quantum Chemist must win cognitive bid autonomously without router edits");
    assert.strictEqual(decision.primaryCandidate, "dr_chem");
    assert.ok(decision.confidence >= 0.85);
  });

  // 4. Multi-Mind Collaboration with Dynamic Brain (Cardinality 4+)
  test("DYNAMIC_BRAIN_PARTICIPATION_SYNTHESIS", () => {
    const query = "Synthesize an organic liquid propellant, design the high-pressure injector, calculate combustion temperature, and render the fluid manifold HUD";
    const part = CognitiveRouter.evaluatePersonaParticipation(query, [], { personaManager: manager });

    assert.ok(part.participants.includes("dr_chem"), "Dr. Chem should participate in chemical propellant synthesis");
    assert.ok(part.participants.includes("penny"), "Penny should participate in hardware injector design");
    assert.ok(part.participants.includes("pete"), "Pete should participate in combustion temperature calculations");
    assert.ok(part.participants.includes("mina"), "Mina should participate in fluid manifold HUD");
  });

  // 5. Safe Unloading & Built-in Protection
  test("CORE_TRIAD_UNLOAD_PROTECTION", () => {
    assert.throws(() => {
      manager.unloadBrainPackage("pete");
    }, /Cannot unload core built-in mind/);
  });

  test("DYNAMIC_BRAIN_HOT_UNLOAD", () => {
    const unloaded = manager.unloadBrainPackage("dr_chem");
    assert.strictEqual(unloaded, true);
    assert.strictEqual(manager.getAllPersonas().length, 3, "Should return to 3 core personas");
    assert.strictEqual(manager.getPersona("dr_chem"), null);
  });

  console.log("\n===============================================================================");
  console.log(`  SPRINT 3 DISCOVERY BATTERY COMPLETE: ${passed} / ${total} PASSED`);
  console.log("===============================================================================");
})();
