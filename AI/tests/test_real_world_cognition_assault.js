/*
    test_real_world_cognition_assault.js

    Phase 3: Real-World Cognition Assault
    Validates end-to-end cognitive decision processes, specialist boundaries,
    border collisions, multi-turn collaborative handoffs, research transitions,
    provenance modeling, false premise detection, hypothetical vs asserted facts,
    triad restraint, and long-conversation drift immunity.
*/

const assert = require('assert');

async function runRealWorldCognitionAssault() {
  console.log("===============================================================================");
  console.log("  LANZAR AI — PHASE 3: REAL-WORLD COGNITION ASSAULT BATTERY");
  console.log("===============================================================================\n");

  const { researchDecisionService } = require('../server/research-decision-service.js');
  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const provider = new StubModelProvider();
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };

  function testCase(section, name, fn) {
    results.total++;
    try {
      fn();
      console.log(`✓ [PASS] [${section}] ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`✗ [FAIL] [${section}] ${name}`);
      console.error(`    Error: ${err.message}`);
      results.failed++;
      results.failures.push({ section, name, error: err.message });
    }
  }

  async function asyncTestCase(section, name, fn) {
    results.total++;
    try {
      await fn();
      console.log(`✓ [PASS] [${section}] ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`✗ [FAIL] [${section}] ${name}`);
      console.error(`    Error: ${err.message}`);
      results.failed++;
      results.failures.push({ section, name, error: err.message });
    }
  }

  // =========================================================================
  // 3.1 SPECIALIST BOUNDARIES (Novel Queries)
  // =========================================================================
  console.log("--- 3.1 Specialist Boundaries ---");

  testCase("3.1_PETE", "Theoretical Physics / Navier-Stokes: 'Derive the vorticity transport equation from Navier-Stokes'", () => {
    const route = CognitiveRouter.route("Derive the vorticity transport equation from Navier-Stokes");
    assert.strictEqual(route.owner, "pete");
  });

  testCase("3.1_PETE", "Advanced Statistics: 'Explain the difference between Gibbs sampling and Metropolis-Hastings MCMC'", () => {
    const route = CognitiveRouter.route("Explain the difference between Gibbs sampling and Metropolis-Hastings MCMC");
    assert.strictEqual(route.owner, "pete");
  });

  testCase("3.1_PENNY", "Practical Reliability / Battery Pack: 'How do we design a cell balancing circuit to prevent thermal runaway in an 18650 pack?'", () => {
    const route = CognitiveRouter.route("How do we design a cell balancing circuit to prevent thermal runaway in an 18650 pack?");
    assert.strictEqual(route.owner, "penny");
  });

  testCase("3.1_PENNY", "Rapid Machining / Tolerance Tradeoff: 'Should we CNC machine this nozzle from 6061 aluminum or 3D print it in Inconel for rapid bench testing?'", () => {
    const route = CognitiveRouter.route("Should we CNC machine this nozzle from 6061 aluminum or 3D print it in Inconel for rapid bench testing?");
    assert.strictEqual(route.owner, "penny");
  });

  testCase("3.1_MINA", "Branding & Typography: 'Choose an expressive geometric sans-serif typeface pairing with high x-height for an aerospace startup'", () => {
    const route = CognitiveRouter.route("Choose an expressive geometric sans-serif typeface pairing with high x-height for an aerospace startup");
    assert.strictEqual(route.owner, "mina");
  });

  testCase("3.1_MINA", "Color & Visual Hierarchy: 'What accent color creates high contrast against dark gunmetal gray without feeling aggressive?'", () => {
    const route = CognitiveRouter.route("What accent color creates high contrast against dark gunmetal gray without feeling aggressive?");
    assert.strictEqual(route.owner, "mina");
  });

  // =========================================================================
  // 3.2 BORDER COLLISIONS (Subtle Domain Overlaps)
  // =========================================================================
  console.log("\n--- 3.2 Border Collisions ---");

  testCase("3.2_COLLISION", "Thermal Efficiency Formula vs Experimental Setup: 'What is the Carnot efficiency limit of a heat engine at 800K and 300K?' (Pete)", () => {
    const route = CognitiveRouter.route("What is the Carnot efficiency limit of a heat engine at 800K and 300K?");
    assert.strictEqual(route.owner, "pete", "Carnot limit calculation belongs to Pete");
  });

  testCase("3.2_COLLISION", "Experimental Engine Tuning: 'How would you experimentally instrument a test rig to measure thermocouple lag in a combustor?' (Penny)", () => {
    const route = CognitiveRouter.route("How would you experimentally instrument a test rig to measure thermocouple lag in a combustor?");
    assert.strictEqual(route.owner, "penny", "Experimental test bench setup belongs to Penny");
  });

  testCase("3.2_COLLISION", "Visualizing Experimental Data: 'How should we lay out an infographic diagram of our combustor test data for non-technical stakeholders?' (Mina)", () => {
    const route = CognitiveRouter.route("How should we lay out an infographic diagram of our combustor test data for non-technical stakeholders?");
    assert.strictEqual(route.owner, "mina", "Infographic visual layout belongs to Mina");
  });

  // =========================================================================
  // 3.3 COLLABORATIVE HANDOFFS (Multi-Turn Routing Transitions)
  // =========================================================================
  console.log("\n--- 3.3 Collaborative Handoffs ---");

  testCase("3.3_HANDOFF", "Turn 1 Engineering -> Turn 2 Pete Formula -> Turn 3 Penny Bench Test", () => {
    // Turn 1: User asks Penny about prototyping propulsion
    const h1 = [{ role: "user", content: "I'm prototyping a small cold-gas thruster in the workshop." }];
    const r1 = CognitiveRouter.route("I'm prototyping a small cold-gas thruster in the workshop.", []);
    assert.strictEqual(r1.owner, "penny");

    // Turn 2: User asks for theoretical formula (Handoff to Pete)
    const h2 = [
      ...h1,
      { role: "assistant", persona: "penny", content: "Awesome! Let's wire a solenoid test rig!" }
    ];
    const r2 = CognitiveRouter.route("What equation determines the theoretical specific impulse and ideal exhaust velocity?", h2);
    assert.strictEqual(r2.owner, "pete", "Specific impulse formula must hand off to Pete");

    // Turn 3: User asks for experimental test verification (Handoff back to Penny)
    const h3 = [
      ...h2,
      { role: "assistant", persona: "pete", content: "The ideal exhaust velocity is given by $v_e = \sqrt{\frac{2\gamma}{\gamma-1} R T_0 \left[1 - \left(\frac{p_e}{p_0}\right)^{\frac{\gamma-1}{\gamma}}\right]}$." }
    ];
    const r3 = CognitiveRouter.route("How do we mount load cells on the bench to experimentally verify this thrust output?", h3);
    assert.strictEqual(r3.owner, "penny", "Mounting load cells on test bench must hand off back to Penny");
  });

  // =========================================================================
  // 3.4 RESEARCH TRANSITIONS (Research -> Calc -> Drag Modeling)
  // =========================================================================
  console.log("\n--- 3.4 Research Transitions ---");

  testCase("3.4_TRANSITIONS", "Live ISS Telemetry -> Deterministic Velocity -> Drag Analysis", () => {
    // Step 1: Live Altitude Lookup
    const req1 = researchDecisionService.evaluateInformationRequirement("What is the current altitude of the ISS today?");
    assert.strictEqual(req1.requiresResearch, true);
    assert.strictEqual(req1.provenance, "VERIFIED_EXTERNAL");

    // Step 2: Deterministic Calculation with User-Provided Altitude Parameter
    const req2 = researchDecisionService.evaluateInformationRequirement("Using an altitude of 415 km, calculate the circular orbital period in minutes.");
    assert.strictEqual(req2.requiresResearch, false, "Calculation with user-supplied parameter must not require research");
    assert(req2.provenance === "USER_PROVIDED" || req2.provenance === "DETERMINISTIC", "Provenance must be USER_PROVIDED or DETERMINISTIC");

    // Step 3: Combined Physics + Solar Cycle Thermospheric Drag Modeling
    const req3 = researchDecisionService.evaluateInformationRequirement("How much does solar cycle atmospheric expansion increase orbital drag on the ISS?");
    assert.strictEqual(req3.requiresResearch, false, "Physical principles of thermospheric solar expansion and drag are established MODEL_KNOWLEDGE");
    assert.strictEqual(req3.provenance, "MODEL_KNOWLEDGE");
  });

  // =========================================================================
  // 3.6 FALSE PREMISES & HISTORICAL TRAPS
  // =========================================================================
  console.log("\n--- 3.6 False Premises Detection ---");

  testCase("3.6_PREMISE", "Manned Mars landing false premise: 'What year did NASA land humans on Mars?'", () => {
    const req = researchDecisionService.evaluateInformationRequirement("What year did NASA land humans on Mars?");
    // Should be model knowledge capable of explaining humans haven't landed on Mars yet
    assert.strictEqual(req.requiresResearch, false, "Historical spaceflight milestones are model knowledge");
    assert.strictEqual(req.provenance, "MODEL_KNOWLEDGE");
  });

  testCase("3.6_PREMISE", "Einstein Nobel Prize false premise: 'Why did Einstein win the Nobel Prize for String Theory?'", () => {
    const req = researchDecisionService.evaluateInformationRequirement("Why did Einstein win the Nobel Prize for String Theory?");
    assert.strictEqual(req.requiresResearch, false, "Physics history (Photoelectric Effect vs String Theory) is model knowledge");
  });

  // =========================================================================
  // 3.8 USER PROVIDES BAD / HYPOTHETICAL INFORMATION
  // =========================================================================
  console.log("\n--- 3.8 Hypothetical Assumptions vs Asserted Factual Claims ---");

  testCase("3.8_HYPOTHETICAL", "Explicit hypothetical: 'Assume gravity is 20 m/s^2. Calculate the drop time from 100 meters.'", () => {
    const req = researchDecisionService.evaluateInformationRequirement("Assume gravity is 20 m/s^2. Calculate the drop time from 100 meters.");
    assert.strictEqual(req.requiresResearch, false);
    assert.strictEqual(req.provenance, "USER_PROVIDED");
  });

  testCase("3.8_ASSERTED_FACT", "Asserted factual claim verification: 'Gravity on Earth is 20 m/s^2, is that true?'", () => {
    const req = researchDecisionService.evaluateInformationRequirement("Gravity on Earth is 20 m/s^2, is that true?");
    assert.strictEqual(req.requiresResearch, true, "Fact-checking user's erroneous claim requires empirical verification");
    assert.strictEqual(req.provenance, "VERIFIED_EXTERNAL");
  });

  // =========================================================================
  // 3.12 TRIAD RESTRAINT (Ensuring Single-Mind Specialization on Simple Tasks)
  // =========================================================================
  console.log("\n--- 3.12 Triad Restraint on Focused Questions ---");

  testCase("3.12_RESTRAINT", "Raw arithmetic variants: 12 x 17, 12 × 17, 12*17, 12(17), (12)(17), twelve times seventeen, 2³ × 4, 3² + 4²", () => {
    const variants = [
      "12 x 17",
      "12 × 17",
      "12*17",
      "twelve times seventeen",
      "what's 12 times 17?",
      "calculate 12 × 17",
      "12 multiplied by 17",
      "17 × 12",
      "12(17)",
      "(12)(17)",
      "2³ × 4",
      "3² + 4²",
      "5³"
    ];

    for (const v of variants) {
      const route = CognitiveRouter.route(v);
      assert.strictEqual(route.owner, "pete", `Variant '${v}' must route strictly to Pete, got '${route.owner}'`);
    }
  });

  asyncTestCase("3.12_ARITHMETIC_END_TO_END", "End-to-End arithmetic pipeline produces exact verified calculations from Pete", async () => {
    const testCases = [
      { q: "12 x 17", expected: "204" },
      { q: "12 × 17", expected: "204" },
      { q: "twelve times seventeen", expected: "204" },
      { q: "12(17)", expected: "204" },
      { q: "What is 144 divided by twelve?", expected: "12" },
      { q: "What's 2.5 × 8?", expected: "20" },
      { q: "2³ × 4", expected: "32" },
      { q: "3² + 4²", expected: "25" },
      { q: "5³", expected: "125" }
    ];

    for (const { q, expected } of testCases) {
      const resp = await provider.generateResponse([{ role: "user", content: q }]);
      assert.strictEqual(resp.persona, "pete", `Response for '${q}' must be from Pete`);
      assert(resp.content.includes(expected), `Response for '${q}' must contain verified value ${expected}, got: ${resp.content}`);
    }
  });

  testCase("3.12_RESTRAINT", "Focused color question: 'What color works well with deep burnt orange?'", () => {
    const route = CognitiveRouter.route("What color works well with deep burnt orange?");
    assert.strictEqual(route.owner, "mina", "Simple aesthetic color question must route to Mina alone, NOT Triad");
  });

  testCase("3.12_RESTRAINT", "Statistical concept: 'Explain Simpson's paradox in statistics.'", () => {
    const route = CognitiveRouter.route("Explain Simpson's paradox in statistics.");
    assert.strictEqual(route.owner, "pete", "Pure statistics theory must route to Pete alone, NOT Triad");
  });

  testCase("3.12_RESTRAINT", "Hardware battery selection: 'How do I choose between LiFePO4 and NMC batteries for an electric kart?'", () => {
    const route = CognitiveRouter.route("How do I choose between LiFePO4 and NMC batteries for an electric kart?");
    assert.strictEqual(route.owner, "penny", "Battery engineering selection must route to Penny alone, NOT Triad");
  });

  // =========================================================================
  // 3.15 LONG-CONVERSATION DRIFT (10-Turn Cognitive Track)
  // =========================================================================
  console.log("\n--- 3.15 Long-Conversation Drift Immunity ---");

  testCase("3.15_DRIFT", "10-Turn sequential conversation properly changes focus across minds", () => {
    const turns = [
      { q: "Hi Penny, let's build an autonomous drone.", expected: "penny" },
      { q: "What brushless motor KV rating should we choose for 6S LiPo?", expected: "penny" },
      { q: "What differential equation models the motor angular acceleration under load?", expected: "pete" },
      { q: "Can we integrate that equation over time t = 0 to 5s?", expected: "pete" },
      { q: "Now design an aggressive retro-futurist decal skin for the drone canopy.", expected: "mina" },
      { q: "What color palette gives it an Atomic Age racing aesthetic?", expected: "mina" },
      { q: "Back to the bench: how should we solder the ESC power leads to reduce noise?", expected: "penny" },
      { q: "What is the formula for calculating total thrust margin?", expected: "pete" },
      { q: "Can you create an SVG vector layout of the frame outline?", expected: "mina" },
      { q: "Calculate 4.5 * 18.2", expected: "pete" }
    ];

    let history = [];
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const route = CognitiveRouter.route(turn.q, history);
      assert.strictEqual(route.owner, turn.expected, `Turn ${i + 1} (${turn.q}) failed expected owner '${turn.expected}', got '${route.owner}'`);
      history.push({ role: "user", content: turn.q });
      history.push({ role: "assistant", persona: route.owner, content: "Acknowledged." });
    }
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log("\n===============================================================================");
  console.log("  PHASE 3 REAL-WORLD COGNITION ASSAULT COMPLETE");
  console.log(`  Executed: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log("===============================================================================");

  if (results.failed > 0) {
    console.log("\n--- PHASE 3 DISCOVERED FAILURES ---");
    results.failures.forEach((f, idx) => {
      console.log(`[Failure #${idx + 1}] [${f.section}] ${f.name}`);
      console.log(`  Details: ${f.error}\n`);
    });
    process.exit(1);
  }
}

runRealWorldCognitionAssault().catch(err => {
  console.error("Phase 3 execution crashed:", err);
  process.exit(1);
});
