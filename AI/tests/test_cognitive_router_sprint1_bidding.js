/*
    test_cognitive_router_sprint1_bidding.js

    Test Suite for Cognitive Router Sprint 1:
    Dynamic Capability Scoring, Autonomous Bidding & Extensibility.
*/

const assert = require('assert');

(async () => {
  console.log("===============================================================================");
  console.log("  LANZAR AI — COGNITIVE ROUTER SPRINT 1: DYNAMIC BIDDING & CAPABILITIES");
  console.log("===============================================================================\n");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { PennyPersona } = await import('../js/personas/penny.js');
  const { PetePersona } = await import('../js/personas/pete.js');
  const { MinaPersona } = await import('../js/personas/mina.js');
  const { Character } = await import('../js/personas/character.js');

  const allPersonas = [new PennyPersona(), new PetePersona(), new MinaPersona()];
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    process.stdout.write(`Testing [${name}]... `);
    try {
      fn();
      console.log("PASSED");
      passed++;
    } catch (err) {
      console.log("FAILED");
      console.error("  ", err.message);
      process.exit(1);
    }
  }

  // 1. Specialist Domain Bidding
  test("PENNY_HARDWARE_BID", () => {
    const res = CognitiveRouter.route("How do I replace a laptop SSD?", [], { enabledPersonas: allPersonas });
    assert.strictEqual(res.owner, "penny", "Penny should win hardware/SSD replacement task");
    assert.ok(res.candidates.find(c => c.id === "penny").score > 0, "Penny must have positive bid score");
    assert.ok(res.requiredCapabilities.includes("hardware_specs") || res.requiredCapabilities.includes("engineering"));
  });

  test("PETE_PHYSICS_BID", () => {
    const res = CognitiveRouter.route("Explain why orbital velocity changes with altitude.", [], { enabledPersonas: allPersonas });
    assert.strictEqual(res.owner, "pete", "Pete should win orbital velocity physics explanation");
    assert.strictEqual(res.toolsRequired.deterministicPhysics, true, "Deterministic physics should be flagged");
    assert.ok(res.candidates.find(c => c.id === "pete").score > 0, "Pete must have positive bid score");
  });

  test("MINA_DESIGN_BID", () => {
    const res = CognitiveRouter.route("Help me choose a color palette for this website.", [], { enabledPersonas: allPersonas });
    assert.strictEqual(res.owner, "mina", "Mina should win color palette design task");
    assert.ok(res.candidates.find(c => c.id === "mina").score > 0, "Mina must have positive bid score");
  });

  // 2. Dynamic Web Research Integration
  test("MINA_POKEMON_WEB_RESEARCH", () => {
    const res = CognitiveRouter.route("What's the latest Pokémon GO event?", [], { enabledPersonas: allPersonas });
    assert.strictEqual(res.owner, "mina", "Mina should win Pokémon GO inquiry");
    assert.strictEqual(res.toolsRequired.webResearch, true, "Web research must be required for current event");
  });

  test("CURRENT_SPORTS_SCORE_RESEARCH", () => {
    const res = CognitiveRouter.route("What happened in the Red Sox game?", [], { enabledPersonas: allPersonas });
    assert.strictEqual(res.toolsRequired.webResearch, true, "Web research must be required for current sports game");
  });

  // 3. General Conversational Handling (No Specialist Required)
  test("GENERAL_GREETING_NO_SPECIALIST_FAVORITISM", () => {
    const res = CognitiveRouter.route("Hello!", [], { enabledPersonas: allPersonas });
    // Should route to Triad or general greeting rather than giving Pete arbitrary high score
    assert.ok(res.owner === "triad" || res.taskType === "team_addressed" || res.taskType === "general_inquiry");
  });

  // 4. Multi-Domain Detection
  test("MULTI_DOMAIN_DRONE_BATTERY", () => {
    const res = CognitiveRouter.route("Design a drone and calculate its battery requirements.", [], { enabledPersonas: allPersonas });
    assert.strictEqual(res.owner, "penny", "Penny should be primary lead for drone build");
    assert.ok(res.secondaryCandidates.includes("pete"), "Pete should be a secondary candidate for calculations");
    assert.strictEqual(res.collaborationPotential, true, "Collaboration potential should be true");
  });

  test("MULTI_DOMAIN_PAPER_PRESENTATION", () => {
    const res = CognitiveRouter.route("Explain this scientific paper and make a presentation concept for it.", [], { enabledPersonas: allPersonas });
    assert.ok(res.candidates.find(c => c.id === "pete").score > 0, "Pete should score on scientific paper");
    assert.ok(res.candidates.find(c => c.id === "mina").score > 0, "Mina should score on presentation concept");
    assert.strictEqual(res.collaborationPotential, true, "Collaboration potential should be true");
  });

  // 5. Deterministic Arithmetic Precision
  test("DETERMINISTIC_ARITHMETIC_VARIATIONS", () => {
    const r1 = CognitiveRouter.route("What's 6 x 2?", [], { enabledPersonas: allPersonas });
    assert.strictEqual(r1.toolsRequired.deterministicMath, true);
    assert.strictEqual(r1.owner, "pete");

    const r2 = CognitiveRouter.route("whats 6 x 2", [], { enabledPersonas: allPersonas });
    assert.strictEqual(r2.toolsRequired.deterministicMath, true);
    assert.strictEqual(r2.owner, "pete");
  });

  // 6. Messy / Informal Input Invariance
  test("MESSY_INPUT_INVARIANCE", () => {
    const r1 = CognitiveRouter.route("whats the red sox score", [], { enabledPersonas: allPersonas });
    assert.strictEqual(r1.toolsRequired.webResearch, true);

    const r2 = CognitiveRouter.route("pokemon go event rn?", [], { enabledPersonas: allPersonas });
    assert.strictEqual(r2.owner, "mina");
    assert.strictEqual(r2.toolsRequired.webResearch, true);

    const r3 = CognitiveRouter.route("need help designing a drone", [], { enabledPersonas: allPersonas });
    assert.strictEqual(r3.owner, "penny");
  });

  // 7. Extensibility Invariant (4th Dummy Persona Wins Bids Without Router Modification)
  test("DYNAMIC_EXTENSIBILITY_CUSTOM_PERSONA", () => {
    class QuantumChemist extends Character {
      constructor() {
        super({
          id: "dr_chem",
          name: "Dr. Chem",
          role: "Quantum Chemist",
          capabilities: ["molecular_dynamics", "chemical_synthesis", "spectroscopy"],
          domainAffinities: ["chemistry", "quantum_chemistry", "spectroscopy", "polymers"]
        });
      }
    }

    const extendedTeam = [...allPersonas, new QuantumChemist()];
    // Evaluate custom request requiring chemistry domain
    const bids = CognitiveRouter.evaluatePersonaBids("Analyze the polymer spectroscopy and molecular dynamics.", extendedTeam);
    assert.strictEqual(bids[0].id, "dr_chem", "Dr. Chem must win top bid dynamically via capability profile");
    assert.ok(bids[0].score > 0, "Dr. Chem must have dynamic score");
  });

  console.log("\n===============================================================================");
  console.log(`  SPRINT 1 BIDDING & CAPABILITY BATTERY COMPLETE: ${passed} / ${total} PASSED`);
  console.log("===============================================================================");
})();
