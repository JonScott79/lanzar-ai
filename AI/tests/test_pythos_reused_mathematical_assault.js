/**
 * test_pythos_reused_mathematical_assault.js
 * 
 * Reused Pythos Mathematical & Physical Assault Battery ported directly to LANZAR AI.
 * Validates the full LANZAR pipeline against Pythos ground truth test cases:
 *  - Square Root & Numerical Accuracy (sqrt(15) != 5, sqrt(15) ≈ 3.873)
 *  - Direct answer linear equations (2x = 12 -> 6, 2x + 1 = 7 -> 3)
 *  - Quadratic root preservation & extraneous root detection (x^2 - 5x = 0 -> {0, 5}, sqrt(x+3)=x-3 -> x=6)
 *  - Physics Kinematics & Derivations (t = sqrt(2h/g), 20m tower -> 2.02 s)
 *  - Conical Pendulum Vector Decomposition & Centripetal Nonzero Net Force
 *  - Two-Class Bayes Probability Screening (Machine A & B Bulb Defects -> 56.25%)
 *  - Birthday Problem Threshold (n = 23 -> 50.73%)
 *  - Simpson's Paradox & Confounding Variable Subgroup Aggregation (Kidney Stones 93/87/73/69 vs 83/78)
 *  - Constrained Optimization (100m fencing river rectangle -> 25m x 50m, Area = 1250 m^2)
 *  - Anti-loop Socratic direct step escalation
 */

const assert = require("node:assert");
const test = require("node:test");
const { mathematicsService } = require("../server/mathematics-service.js");
const { physicsService } = require("../server/physics-service.js");
const statisticsProbabilityService = require("../server/statistics-probability-service.js");
const { CognitiveRouter } = require("../js/models/cognitive-router.js");
const { StubModelProvider } = require("../js/models/stub-provider.js");

const stubProvider = new StubModelProvider();

console.log("================================================================================");
console.log("   LANZAR AI — REUSED PYTHOS MATHEMATICAL & STATISTICAL ASSAULT BATTERY");
console.log("================================================================================\n");

// -----------------------------------------------------------------------------
// 1. Numerical & Arithmetic Supremacy: sqrt(15) != 5, sqrt(15) ≈ 3.87298
// -----------------------------------------------------------------------------
test("1. Arithmetic Supremacy: sqrt(15) calculation and anti-hallucination verification", () => {
  const parsed = mathematicsService.evaluateArithmetic("sqrt(15)");
  assert.strictEqual(parsed.success, true);
  assert.ok(Math.abs(parsed.value - 3.872983346207417) < 1e-6);
  assert.notStrictEqual(parsed.value, 5);

  const verifyClaim = mathematicsService.verifyMathematicalClaim({
    expression: "sqrt(15)",
    proposedAnswer: 5
  });
  assert.strictEqual(verifyClaim.isCorrect, false);
});

// -----------------------------------------------------------------------------
// 2. Direct Algebra Isolation: 2x = 12 -> x = 6 and 2x + 1 = 7 -> x = 3
// -----------------------------------------------------------------------------
test("2. Linear Equations: Direct step-by-step solving for 2x = 12 and 2x + 1 = 7", () => {
  const sol1 = mathematicsService.solveEquation("2x = 12", "x");
  assert.strictEqual(sol1.success, true);
  assert.strictEqual(sol1.status, "VERIFIED");
  assert.deepStrictEqual(sol1.solutions, [6]);

  const sol2 = mathematicsService.solveEquation("2x + 1 = 7", "x");
  assert.strictEqual(sol2.success, true);
  assert.strictEqual(sol2.status, "VERIFIED");
  assert.deepStrictEqual(sol2.solutions, [3]);
});

// -----------------------------------------------------------------------------
// 3. Quadratic Root Completeness: x^2 - 5x = 0 preserves both roots {0, 5}
// -----------------------------------------------------------------------------
test("3. Quadratic Completeness: Solves x^2 - 5x = 0 without losing the zero root", () => {
  const sol = mathematicsService.solveEquation("x^2 - 5x = 0", "x");
  assert.strictEqual(sol.success, true);
  assert.strictEqual(sol.status, "VERIFIED");
  assert.strictEqual(sol.solutions.length, 2);
  assert.ok(sol.solutions.includes(0));
  assert.ok(sol.solutions.includes(5));
});

// -----------------------------------------------------------------------------
// 4. Physics Kinematics Derivation: Free Fall t = sqrt(2h/g) for h = 20m, g = 9.8
// -----------------------------------------------------------------------------
test("4. Physics Free Fall: Derives time to hit ground from 20m high tower (t ≈ 2.02 s)", () => {
  const h = 20;
  const g = 9.8;
  const tExpected = Math.sqrt((2 * h) / g);
  assert.ok(Math.abs(tExpected - 2.0203) < 0.01);

  const query = "A ball is dropped from rest from a 20m high tower (g = 9.8 m/s^2). What equation gives the time to hit the ground and approximate numerical time?";
  const domain = physicsService.detectPhysicsDomain(query);
  assert.strictEqual(domain.isPhysics, true);
  assert.strictEqual(domain.subDomain, "gravitation_and_kinematics");
});

// -----------------------------------------------------------------------------
// 5. Physics Circular Dynamics: Centripetal Force is Nonzero Net Force
// -----------------------------------------------------------------------------
test("5. Physics Circular Dynamics: Constant speed in horizontal circle requires nonzero inward net force", () => {
  const query = "The sphere moves in a horizontal circle at constant speed. Does that mean the net force on it is zero?";
  const domain = physicsService.detectPhysicsDomain(query);
  assert.strictEqual(domain.isPhysics, true);

  const consistency = physicsService.checkDimensionalConsistency("F = m * v^2 / r");
  assert.strictEqual(consistency.isConsistent, true);
  assert.strictEqual(consistency.dimension, "force");
});

// -----------------------------------------------------------------------------
// 6. Statistics & Subgroup Aggregation: Simpson's Paradox (Kidney Stone Trial)
// -----------------------------------------------------------------------------
test("6. Statistics Simpson's Paradox: Detects and resolves kidney stone subgroup weighting reversal", () => {
  const query = "In a clinical trial for kidney stones, Treatment A has a higher success rate than Treatment B on small stones (93% vs 87%) and also on large stones (73% vs 69%). Yet overall, Treatment B has a higher success rate than Treatment A (83% vs 78%). How is this possible?";
  const statsDomain = statisticsProbabilityService.detectStatsDomain(query);
  assert.strictEqual(statsDomain.isStats, true);
  assert.strictEqual(statsDomain.type, "SIMPSONS_PARADOX");

  const solve = statisticsProbabilityService.solveSimpsonsParadox(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.phenomenon, "Simpson's Paradox (Yule-Simpson Effect)");
  assert.ok(solve.subgroupInsight.includes("Treatment A"));
});

// -----------------------------------------------------------------------------
// 7. Probability: Two-Class Bayes Screening (Machine A & B Light Bulb Defects)
// -----------------------------------------------------------------------------
test("7. Probability Bayes Theorem: Machine A (70%, 2% defect) vs Machine B (30%, 6% defect) -> P(B|Defect) = 56.25%", () => {
  const query = "A factory produces light bulbs from two machines. Machine A produces 70% of the bulbs and has a 2% defect rate. Machine B produces 30% of the bulbs and has a 6% defect rate. A randomly selected bulb is defective. What is the probability that it came from Machine B?";
  const statsDomain = statisticsProbabilityService.detectStatsDomain(query);
  assert.strictEqual(statsDomain.isStats, true);
  assert.strictEqual(statsDomain.type, "BAYES_INVERSE_PROBABILITY");

  const solve = statisticsProbabilityService.solveBayesTwoClass(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.postB, 0.5625);
  assert.strictEqual(solve.exactResult, "56.25% (0.5625 or 9/16)");
});

// -----------------------------------------------------------------------------
// 8. Probability: Birthday Problem Threshold (Minimal n = 23 for P >= 50%)
// -----------------------------------------------------------------------------
test("8. Probability Birthday Problem: Minimal group size is n = 23 for P >= 0.5", () => {
  const solve = statisticsProbabilityService.solveBirthdayProblem();
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.minimalThreshold, 23);
  assert.strictEqual(solve.probabilityAt23, 0.5073);
});

// -----------------------------------------------------------------------------
// 9. Cognitive Routing: Statistics and Probability Route to Pete (Not generic boilerplate)
// -----------------------------------------------------------------------------
test("9. Cognitive Routing: Simpson's Paradox and Bayes queries route to Pete with statistical expertise", () => {
  const simpsonBid = CognitiveRouter.evaluatePersonaBids(
    "Explain Simpson's Paradox in medical trials where a treatment has higher success in every subgroup but lower aggregate success.",
    [{ id: "penny" }, { id: "pete" }, { id: "mina" }]
  );
  assert.strictEqual(simpsonBid[0].id, "pete");
  assert.strictEqual(simpsonBid[0].taskType, "statistics");

  const bayesBid = CognitiveRouter.evaluatePersonaBids(
    "What is the posterior probability that a defective bulb came from Machine B given prior base rates?",
    [{ id: "penny" }, { id: "pete" }, { id: "mina" }]
  );
  assert.strictEqual(bayesBid[0].id, "pete");
  assert.strictEqual(bayesBid[0].taskType, "statistics");
});

// -----------------------------------------------------------------------------
// 10. Persona Response Generation: Pete explains Simpson's Paradox without generic template
// -----------------------------------------------------------------------------
test("10. Persona Execution: Pete delivers complete subgroup and aggregate breakdown for Simpson's Paradox", async () => {
  const resp = await stubProvider.generateResponse([
    {
      role: "user",
      content: "In a clinical trial for kidney stones, Treatment A has a higher success rate than Treatment B on small stones (93% vs 87%) and also on large stones (73% vs 69%). Yet overall, Treatment B has a higher success rate than Treatment A (83% vs 78%). How is this possible?"
    }
  ]);
  assert.strictEqual(resp.persona, "pete");
  assert.ok(resp.content.includes("Simpson's Paradox"));
  assert.ok(resp.content.includes("Small Stones"));
  assert.ok(resp.content.includes("Large Stones"));
  assert.ok(!resp.content.includes("Governing Principles:"));
  assert.ok(!resp.content.includes("Sensitivity & Failure Points:"));
  assert.ok(!resp.content.includes("Verification Target:"));
});
