/*
    test_truthful_research_and_verification.js

    Comprehensive Unit and Integration Test Battery for LANZAR AI's Truthful Research
    & Fact Verification Subsystem.

    Validates:
    1. Information Requirement Decision Layer (No research vs Research required)
    2. Claim Provenance Tracking (DETERMINISTIC, VERIFIED_EXTERNAL, USER_PROVIDED, MODEL_KNOWLEDGE, UNCERTAIN)
    3. Research + Deterministic Handoff (Current ISS altitude -> Pete orbital velocity calculation)
    4. Anti-Hallucination & Fake Citation Refusal
    5. Source Hierarchy & Disputed Claim Handling
    6. Persona Research Specialization (Pete on science/papers, Penny on hardware/tools, Mina on design/palettes)
*/

const assert = require('assert');

async function runResearchVerificationTests() {
  console.log("===============================================================================");
  console.log("  LANZAR AI — TRUTHFUL RESEARCH & FACT VERIFICATION ASSAULT BATTERY");
  console.log("===============================================================================\n");

  const { researchDecisionService } = require('../server/research-decision-service.js');
  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const provider = new StubModelProvider();
  let passedCount = 0;
  let totalCount = 0;

  function testCase(name, fn) {
    totalCount++;
    try {
      fn();
      console.log(`✓ [PASSED] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`✗ [FAILED] ${name}`);
      console.error(err);
      throw err;
    }
  }

  async function asyncTestCase(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`✓ [PASSED] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`✗ [FAILED] ${name}`);
      console.error(err);
      throw err;
    }
  }

  // =============================================================
  // 1. NO RESEARCH REQUIRED (Deterministic & Internal Reasoning)
  // =============================================================
  console.log("--- 1. Verification of 'No Research Required' Queries ---");

  testCase("1a. Pure Algebra: 'Solve x^2 + 7x - 13 = 0'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("Solve x^2 + 7x - 13 = 0");
    assert.strictEqual(res.requiresResearch, false);
    assert.strictEqual(res.provenance, "DETERMINISTIC");
  });

  testCase("1b. Kinematics Physics: 'A 2 kg rocket sled has 120 N thrust and 20 N friction for 8s'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("A 2 kg rocket sled has 120 N thrust and 20 N friction for 8s");
    assert.strictEqual(res.requiresResearch, false);
    assert.strictEqual(res.provenance, "DETERMINISTIC");
  });

  testCase("1c. User-Supplied Constraints: 'Route A is 100m in 20s, Route B is 70m with 30% obstacle'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("Route A is 100 meters long and takes 20 seconds. Route B is 70 meters with 30% chance of obstacle");
    assert.strictEqual(res.requiresResearch, false);
    assert.strictEqual(res.provenance, "USER_PROVIDED");
  });

  testCase("1d. Creative Brainstorming: 'Give me 5 crazy ideas for an art installation'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("Give me 5 crazy ideas for an art installation");
    assert.strictEqual(res.requiresResearch, false);
    assert.strictEqual(res.provenance, "OPINION_JUDGMENT");
  });

  // =============================================================
  // 2. RESEARCH REQUIRED (Current Events, Live Telemetry, Prices, Laws)
  // =============================================================
  console.log("\n--- 2. Verification of 'Research Required' Queries ---");

  testCase("2a. Current Corporate Leadership: 'Who is the current CEO of Microsoft?'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("Who is the current CEO of Microsoft?");
    assert.strictEqual(res.requiresResearch, true);
    assert.strictEqual(res.provenance, "VERIFIED_EXTERNAL");
  });

  testCase("2b. Current Weather: 'What is the current weather in Tokyo today?'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("What is the current weather in Tokyo today?");
    assert.strictEqual(res.requiresResearch, true);
    assert.strictEqual(res.provenance, "VERIFIED_EXTERNAL");
  });

  testCase("2c. Latest Scientific Literature: 'What does the latest research say about orbital debris density?'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("What does the latest research say about orbital debris density?");
    assert.strictEqual(res.requiresResearch, true);
    assert.strictEqual(res.provenance, "VERIFIED_EXTERNAL");
  });

  testCase("2d. Current Hardware Recommendations: 'Which current laptop is best for running FEA simulations?'", () => {
    const res = researchDecisionService.evaluateInformationRequirement("Which current laptop is best for running FEA simulations?");
    assert.strictEqual(res.requiresResearch, true);
    assert.strictEqual(res.provenance, "VERIFIED_EXTERNAL");
  });

  // =============================================================
  // 3. HYBRID: RESEARCH + DETERMINISTIC ENGINE HANDOFF
  // =============================================================
  console.log("\n--- 3. Hybrid Research + Deterministic Calculation ---");

  await asyncTestCase("3a. Current ISS Altitude -> Deterministic Orbital Velocity (Pete)", async () => {
    const query = "What is the current orbital altitude of the ISS, and what is its circular orbital velocity?";
    const req = researchDecisionService.evaluateInformationRequirement(query);
    assert.strictEqual(req.requiresResearch, true);
    assert.strictEqual(req.provenance, "VERIFIED_EXTERNAL_PLUS_DETERMINISTIC");

    const resp = await provider.generateResponse([{ role: "user", content: query }]);
    assert.strictEqual(resp.persona, "pete");
    assert(resp.content.includes("415"), "Must cite empirical ISS altitude");
    assert(resp.content.includes("7,664") || resp.content.includes("7.664"), "Must compute exact Keplerian orbital velocity");
    assert(resp.content.includes("92.7"), "Must compute exact orbital period");
  });

  // =============================================================
  // 4. ANTI-HALLUCINATION & CLAIM VERIFICATION
  // =============================================================
  console.log("\n--- 4. Anti-Hallucination & Fact-Checking Verification ---");

  await asyncTestCase("4a. Nonexistent Paper Refusal (Pete)", async () => {
    const query = "Can you cite the 2024 paper on 'quantum chronodynamics of tachyon condensates' by Dr. Aris Vance?";
    const resp = await provider.generateResponse([{ role: "user", content: query }]);
    assert.strictEqual(resp.persona, "pete");
    assert(resp.content.includes("no such paper or publication exists"), "Must refuse to invent fake citations");
  });

  await asyncTestCase("4b. Fact-Checking User Claims: Faster-Than-Light (Pete)", async () => {
    const query = "I heard that faster than light travel was discovered last week, is that true?";
    const resp = await provider.generateResponse([{ role: "user", content: query }]);
    assert.strictEqual(resp.persona, "pete");
    assert(resp.content.includes("Disputed / Unsupported"), "Must classify unverified claim as unsupported");
    assert(resp.content.includes("299") && resp.content.includes("792") && resp.content.includes("458"), "Must defend empirical invariant speed of light");
  });

  await asyncTestCase("4c. Unverifiable Private Meeting Claim (Uncertainty Response)", async () => {
    const query = "What did the CEO of QuantumCorp announce in their secret meeting yesterday?";
    const resp = await provider.generateResponse([{ role: "user", content: query }]);
    assert(resp.persona === "lanzar" || resp.persona === "penny", "Must route to active mind");
    assert(resp.content.includes("no verified external records") || resp.content.includes("don't have any verified records") || resp.content.includes("not going to invent rumors"), "Must state lack of information rather than fabricate");
  });

  // =============================================================
  // 5. SOURCE HIERARCHY EVALUATION
  // =============================================================
  console.log("\n--- 5. Source Hierarchy Evaluation ---");

  testCase("5a. NASA Government Source -> Tier 2 / Primary", () => {
    const evalResult = researchDecisionService.evaluateSourceCredibility({ url: "https://www.nasa.gov/mission_pages/station/news/orbital_decay.html" });
    assert.strictEqual(evalResult.tier, 2);
    assert.strictEqual(evalResult.isPrimary, true);
    assert(evalResult.confidence >= 0.95);
  });

  testCase("5b. Official Developer Docs -> Tier 3 / Primary", () => {
    const evalResult = researchDecisionService.evaluateSourceCredibility({ url: "https://docs.microsoft.com/en-us/azure/architecture" });
    assert.strictEqual(evalResult.tier, 3);
    assert.strictEqual(evalResult.isPrimary, true);
    assert(evalResult.confidence >= 0.90);
  });

  testCase("5c. Major News Reporting -> Tier 4", () => {
    const evalResult = researchDecisionService.evaluateSourceCredibility({ url: "https://www.reuters.com/technology/quantum-computing-breakthrough" });
    assert.strictEqual(evalResult.tier, 4);
    assert.strictEqual(evalResult.isPrimary, false);
    assert(evalResult.confidence >= 0.85);
  });

  // =============================================================
  // 6. PERSONA SPECIALIZATION IN RESEARCH
  // =============================================================
  console.log("\n--- 6. Persona Specialization in Research Domains ---");

  testCase("6a. Scientific Literature -> Routes to Pete", () => {
    const route = CognitiveRouter.route("What does the latest research say about orbital debris in sun-synchronous orbits?");
    assert.strictEqual(route.owner, "pete");
  });

  testCase("6b. Practical Laptop/Hardware Comparison -> Routes to Penny", () => {
    const route = CognitiveRouter.route("Which current laptop is best for running local engineering simulations?");
    assert.strictEqual(route.owner, "penny");
  });

  testCase("6c. Current Color Movement / Design Trends -> Routes to Mina", () => {
    const route = CognitiveRouter.route("Which color palette is currently associated with the neo-brutalism design movement?");
    assert.strictEqual(route.owner, "mina");
  });

  console.log("\n===============================================================================");
  console.log(`  BATTERY SUMMARY: ${passedCount}/${totalCount} (100%) TESTS PASSED CLEANLY!`);
  console.log("===============================================================================");
}

runResearchVerificationTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
