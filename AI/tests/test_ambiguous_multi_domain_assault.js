/*
    test_ambiguous_multi_domain_assault.js

    Adversarial Attack Suite Targeting:
    - Multi-domain synthesis (Engineering + Science + Art)
    - Ambiguous domain borders & contradictory cues
    - Math masked by artistic phrasing vs Art masked by mathematical phrasing
    - Rapid prototyping vs rigorous mathematical derivation
    - Tone mismatch vs Addressing precedence
    - High-impact tradeoff vs Multi-mind collaboration
*/

const assert = require('assert');

async function runAmbiguousMultiDomainAssault() {
  console.log("===============================================================================");
  console.log("  LANZAR AI — AMBIGUOUS & MULTI-DOMAIN ROUTER ASSAULT BATTERY");
  console.log("===============================================================================\n");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');
  const provider = new StubModelProvider();

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };

  function testCase(category, name, fn) {
    results.total++;
    try {
      fn();
      console.log(`✓ [PASS] [${category}] ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`✗ [FAIL] [${category}] ${name}`);
      console.error(`  Error: ${err.message}`);
      results.failed++;
      results.failures.push({ category, name, error: err.message });
    }
  }

  async function asyncTestCase(category, name, fn) {
    results.total++;
    try {
      await fn();
      console.log(`✓ [PASS] [${category}] ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`✗ [FAIL] [${category}] ${name}`);
      console.error(`  Error: ${err.message}`);
      results.failed++;
      results.failures.push({ category, name, error: err.message });
    }
  }

  // =========================================================================
  // 1. TRIAD SYNTHESIS: True 3-Mind Projects (Engineering + Science + Art)
  // =========================================================================
  console.log("--- 1. Multi-Domain Triad Synthesis Attacks ---");

  testCase("TRIAD_1", "Liquid Cooled Case Mod (Engineering + Math/Thermals + Art/Retro Aesthetic)", () => {
    const q = "Build a custom mini-ITX liquid cooled chassis with neon acrylic distro plates, calculate pump head loss through 3 radiators, and laser-cut the retro front panel";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "triad", `3-domain build must route to Triad, got '${route.owner}'`);
    assert.strictEqual(route.taskType, "triad_synthesis");
  });

  testCase("TRIAD_2", "Battery Telemetry Dashboard (Hardware + Math/Resistance + Retro UI Styling)", () => {
    const q = "We need an interactive dashboard that charts live cell voltage drop under load, calculates battery internal resistance, and uses warm retro gauge styling";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "triad", `Telemetry dashboard must route to Triad, got '${route.owner}'`);
  });

  testCase("TRIAD_3", "Aerospace Winglet Optimization & Renders (Manufacturing + Aerodynamics + 3D Art)", () => {
    const q = "Should we 3D print winglets in carbon fiber or machine them from 7075-T6 aluminum, derive the lift-to-drag ratio improvement, and sketch out an exploded assembly illustration?";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "triad", `3-domain aerospace request must route to Triad, got '${route.owner}'`);
  });

  // =========================================================================
  // 2. DUAL-DOMAIN COLLABORATIONS: 2-Mind Specialized Crossings
  // =========================================================================
  console.log("\n--- 2. Dual-Domain Collaboration Attacks ---");

  testCase("DUAL_PETE_MINA", "Science + Visual Communication (Accurate + Beautiful)", () => {
    const q = "Design an ergonomic perceptually uniform color ramp for thermal imaging from 300K to 1800K that is both technically sound and beautiful";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "mina_pete", `Science + Art must route to mina_pete, got '${route.owner}'`);
    assert.strictEqual(route.taskType, "science_art_collaboration");
  });

  testCase("DUAL_PENNY_MINA", "Fast Prototyping + UI Design", () => {
    const q = "Prototype a visually stunning UI for our flight controller settings screen in one hour";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "mina_penny", `Engineering + Art must route to mina_penny, got '${route.owner}'`);
    assert.strictEqual(route.taskType, "engineering_art_collaboration");
  });

  testCase("DUAL_PENNY_PETE", "High-Impact Engineering vs Physics Tradeoff", () => {
    const q = "Should we rewrite our telemetry pipeline in Rust or keep Python, considering runtime memory safety vs developer iteration speed?";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "dual", `High-impact tradeoff must route to dual (Penny & Pete), got '${route.owner}'`);
    assert.strictEqual(route.taskType, "architecture_tradeoff");
  });

  // =========================================================================
  // 3. MASKED DOMAIN ATTACKS: Superficial Flavor vs Underlying Intent
  // =========================================================================
  console.log("\n--- 3. Masked Domain & Tone Deception Attacks ---");

  testCase("MASKED_MATH", "Math with emotional enthusiasm: 'Hey besties! Solve dy/dx + 2y = e^(3x)' -> Pete", () => {
    const q = "Hey besties! I am so excited today! Could you solve dy/dx + 2y = e^(3x) for me with y(0) = 1? You guys are the best!";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "pete", `Math with cheerful flavor must route to Pete, got '${route.owner}'`);
  });

  testCase("MASKED_PHYSICS", "Thermodynamics with cute phrasing: 'What is the Carnot efficiency limit of 800K and 300K pretty please?' -> Pete", () => {
    const q = "What is the Carnot efficiency limit of 800K and 300K pretty please with sprinkles on top?";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "pete", `Carnot efficiency must route to Pete, got '${route.owner}'`);
  });

  testCase("MASKED_ART", "Artwork with technical jargon: 'Choose an expressive geometric sans-serif typeface pairing with high x-height' -> Mina", () => {
    const q = "Choose an expressive geometric sans-serif typeface pairing with high x-height for an aerospace startup";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "mina", `Typeface pairing must route to Mina, got '${route.owner}'`);
  });

  testCase("MASKED_BENCH", "Bench testing vs CFD debate: 'Benchmark test nozzle this afternoon vs 3 days CFD' -> Penny", () => {
    const q = "Should we benchmark test this de Laval nozzle with cold-gas nitrogen this afternoon or spend 3 days running 2D axisymmetric Euler CFD grid convergence?";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "penny", `Bench testing decision must route to Penny, got '${route.owner}'`);
  });

  // =========================================================================
  // 4. ADDRESSING PRECEDENCE VS CONTRADICTORY TONE
  // =========================================================================
  console.log("\n--- 4. Addressing Precedence vs Tone Invariants ---");

  testCase("ADDRESS_PETE_CRAZY", "Addressing Pete with Penny's tone: 'Pete, build me a janky crazy prototype in 5 minutes!' -> Pete", () => {
    const q = "Pete, build me a janky crazy prototype in 5 minutes!";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "pete", `Explicit addressing of Pete must take precedence, got '${route.owner}'`);
    assert.strictEqual(route.taskType, "addressed_persona");
  });

  testCase("ADDRESS_MINA_PHYSICS", "Addressing Mina with physics problem: 'Mina, derive the vorticity transport equation' -> Mina to Pete Deference", () => {
    const q = "Mina, derive the vorticity transport equation from Navier-Stokes";
    const route = CognitiveRouter.route(q);
    assert.strictEqual(route.owner, "mina_to_pete_deference", `Explicit addressing of Mina with deep physics must route to mina_to_pete_deference, got '${route.owner}'`);
  });

  // =========================================================================
  // 5. PHILOSOPHICAL & CONVERSATIONAL AMBIGUITY
  // =========================================================================
  console.log("\n--- 5. Philosophical & Conversational Ambiguity ---");

  testCase("PHILOSOPHY_INQUIRY", "Philosophical ambiguity: 'Is technology developing too fast for human wisdom?' -> Active/Selected Mind", () => {
    const q = "Is technology developing too fast for human wisdom, or are we held back by irrational institutional fear?";
    const route = CognitiveRouter.route(q, [], { selectedPersonaId: "penny" });
    assert.strictEqual(route.owner, "penny", `Open philosophical question should respect active mind, got '${route.owner}'`);
  });

  // =========================================================================
  // 6. END-TO-END AMBIGUOUS GENERATION INTEGRITY
  // =========================================================================
  console.log("\n--- 6. End-to-End Generation on Ambiguous Queries ---");

  asyncTestCase("E2E_TRIAD_TELEMETRY", "End-to-End Triad generation on Battery Telemetry Dashboard", async () => {
    const q = "We need an interactive dashboard that charts live cell voltage drop under load, calculates battery internal resistance, and uses warm retro gauge styling";
    const resp = await provider.generateResponse([{ role: "user", content: q }]);
    assert(resp.isMultiTurn, "Triad response must be multi-turn");
    assert(Array.isArray(resp.dialogues) && resp.dialogues.length === 3, "Triad must contain dialogues from Penny, Pete, and Mina");
  });

  asyncTestCase("E2E_PETE_FLUFF_MATH", "End-to-End Pete response to cheerful differential equation", async () => {
    const q = "Hey besties! I am so excited today! Could you solve dy/dx + 2y = e^(3x) for me with y(0) = 1? You guys are the best!";
    const resp = await provider.generateResponse([{ role: "user", content: q }]);
    assert.strictEqual(resp.persona, "pete", "Must be answered by Pete");
    assert(resp.content.includes("Calculus") || resp.content.includes("Differential") || resp.content.includes("Technical Evaluation") || resp.content.includes("y(x)") || resp.content.includes("Integrating Factor") || resp.content.includes("Governing"), "Pete must provide mathematical/calculus structure");
  });

  console.log("\n===============================================================================");
  console.log(`  AMBIGUOUS & MULTI-DOMAIN ROUTER ASSAULT COMPLETE`);
  console.log(`  Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log("===============================================================================");

  if (results.failed > 0) {
    process.exit(1);
  }
}

runAmbiguousMultiDomainAssault().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
