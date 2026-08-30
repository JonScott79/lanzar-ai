/*
    test_mathematical_intent_and_correction.js

    Comprehensive Mathematical Intent & Response Correction Test Suite for LANZAR AI.
    Verifies 16 required dimensions:
    1. Simple arithmetic (direct evaluation)
    2. Polynomial expression (clarification vs solving)
    3. Linear equation (exact root derivation)
    4. Quadratic equation (exact quadratic formula / discriminant / roots)
    5. Multivariable equation (detects underdetermined system, requires constraint)
    6. Factoring request (distinguishes from equation solving)
    7. Substitution / evaluation (substituting variable value)
    8. Derivative (calculus differentiation)
    9. Integral (calculus integration)
    10. Graph request (visualization / trajectory)
    11. Ambiguous mathematical expression ("what's x^2+5x-23?" does NOT silently append =0)
    12. Expression containing multiple variables (proper free variable detection)
    13. Malformed equation (safe failure handling)
    14. Deliberately misleading equation (no term truncation or variable hallucination)
    15. Mathematical verification of an LLM-generated answer (deterministic ground truth)
    16. Correct identification of underdetermined problems (more free variables than equations)
*/

const test = require('node:test');
const assert = require('node:assert');
const { mathematicsService } = require('../server/mathematics-service.js');
const { hostedInferenceService } = require('../server/hosted-inference-service.js');

console.log("================================================================================");
console.log("   LANZAR AI — MATHEMATICAL INTENT & RESPONSE CORRECTION TEST SUITE");
console.log("================================================================================\n");

// -------------------------------------------------------------------------
// 1. Simple Arithmetic
// -------------------------------------------------------------------------
test("1. Simple Arithmetic: Evaluates directly without systems-engineering boilerplate", () => {
  const parsed = mathematicsService.parseMathematicalIntent("What's 5 + 7?");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.type, "arithmetic");
  assert.strictEqual(parsed.result.success, true);
  assert.strictEqual(parsed.result.value, 12);
});

// -------------------------------------------------------------------------
// 2 & 11. Ambiguous Quadratic Expression vs Equation
// -------------------------------------------------------------------------
test("2 & 11. Ambiguous Expression: 'what is x^2+5x-23?' recognizes expression without silently appending '= 0'", () => {
  const parsed = mathematicsService.parseMathematicalIntent("what's x^2+5x-23?");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.type, "quadratic_expression");
  assert.strictEqual(parsed.isAmbiguous, true);
  assert.ok(parsed.clarificationPrompt.includes("That's a quadratic expression"));
  assert.ok(parsed.clarificationPrompt.includes("What would you like to do with it"));
});

// -------------------------------------------------------------------------
// 3. Linear Equation Solving
// -------------------------------------------------------------------------
test("3. Linear Equation: Solves 5x + 2 = 12 with exact verified root x = 2", () => {
  const parsed = mathematicsService.parseMathematicalIntent("solve 5x + 2 = 12");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.type, "linear");
  assert.strictEqual(parsed.result.success, true);
  assert.deepStrictEqual(parsed.result.solutions, [2]);
});

// -------------------------------------------------------------------------
// 4. Quadratic Equation Solving
// -------------------------------------------------------------------------
test("4. Quadratic Equation: Solves x^2 + 5x - 23 = 0 using exact quadratic formula", () => {
  const parsed = mathematicsService.parseMathematicalIntent("solve x^2 + 5x - 23 = 0");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.type, "quadratic");
  assert.strictEqual(parsed.result.success, true);
  assert.strictEqual(parsed.result.discriminant, 117);
  assert.strictEqual(parsed.result.solutions.length, 2);
  // Root 1: (-5 + sqrt(117)) / 2 approx 2.9083
  assert.ok(Math.abs(parsed.result.solutions[0] - 2.9083) < 0.001);
});

// -------------------------------------------------------------------------
// 5 & 16. Multivariable & Underdetermined Equations
// -------------------------------------------------------------------------
test("5 & 16. Multivariable Equation: ax + b = cy + d correctly identified as underdetermined", () => {
  const parsed = mathematicsService.parseMathematicalIntent("solve 2x + 4 = 3y + 8");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.isUnderdetermined, true);
  assert.ok(parsed.variables.includes('x'));
  assert.ok(parsed.variables.includes('y'));
  assert.ok(parsed.details.includes("multiple variables"));
});

// -------------------------------------------------------------------------
// 6. Factoring Intent
// -------------------------------------------------------------------------
test("6. Factoring: Intent correctly tagged as 'factor'", () => {
  const parsed = mathematicsService.parseMathematicalIntent("factor x^2 - 9");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.operation, "factor");
});

// -------------------------------------------------------------------------
// 7. Substitution / Evaluation Intent
// -------------------------------------------------------------------------
test("7. Substitution: Intent correctly tagged as 'substitute'", () => {
  const parsed = mathematicsService.parseMathematicalIntent("what is x^2 + 5x - 23 when x = 4?");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.operation, "substitute");
});

// -------------------------------------------------------------------------
// 8. Derivative Intent
// -------------------------------------------------------------------------
test("8. Derivative: Computes exact symbolic derivative of x^2 + 5x - 23", () => {
  const parsed = mathematicsService.parseMathematicalIntent("what is the derivative of x^2 + 5x - 23?");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.operation, "differentiate");
  const deriv = mathematicsService.differentiate("x^2 + 5x - 23", "x");
  assert.strictEqual(deriv.success, true);
  assert.strictEqual(deriv.derivative, "2 * x + 5");
});

// -------------------------------------------------------------------------
// 9. Integral Intent
// -------------------------------------------------------------------------
test("9. Integral: Intent correctly tagged as 'integrate'", () => {
  const parsed = mathematicsService.parseMathematicalIntent("integrate x^2 + 5x - 23");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.operation, "integrate");
});

// -------------------------------------------------------------------------
// 10. Graph Intent
// -------------------------------------------------------------------------
test("10. Graph: Intent correctly tagged as 'graph'", () => {
  const parsed = mathematicsService.parseMathematicalIntent("graph x^2 + 5x - 23");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.operation, "graph");
});

// -------------------------------------------------------------------------
// 12. Multivariable Expression Free Variables
// -------------------------------------------------------------------------
test("12. Multivariable Expression: Identifies free variables [x, y, z]", () => {
  const parsed = mathematicsService.parseMathematicalIntent("x^2 + 2*y*z - 4");
  assert.strictEqual(parsed.isMath, true);
  assert.strictEqual(parsed.type, "multivariable_expression");
  assert.ok(parsed.variables.includes('x'));
  assert.ok(parsed.variables.includes('y'));
  assert.ok(parsed.variables.includes('z'));
});

// -------------------------------------------------------------------------
// 13. Malformed Equation
// -------------------------------------------------------------------------
test("13. Malformed Equation: Fails safely with clear status", () => {
  const solveRes = mathematicsService.solveEquation("5x +++ = 2==");
  assert.strictEqual(solveRes.success, false);
  assert.strictEqual(solveRes.status, "MALFORMED_EQUATION");
});

// -------------------------------------------------------------------------
// 14. Deliberately Misleading Equation (No Variable Truncation)
// -------------------------------------------------------------------------
test("14. Misleading Equation: Does not truncate terms or invent variables", () => {
  const parsed = mathematicsService.parseMathematicalIntent("3x + 10 = 5y + 2");
  assert.strictEqual(parsed.isUnderdetermined, true);
  assert.strictEqual(parsed.variables.length, 2);
});

// -------------------------------------------------------------------------
// 15. Ground-Truth Deterministic Verification
// -------------------------------------------------------------------------
test("15. Verification Engine: Validates LLM claims against ground truth", () => {
  const correctClaim = mathematicsService.verifyMathematicalClaim({
    expression: "2^8 - 16",
    proposedAnswer: 240
  });
  assert.strictEqual(correctClaim.verified, true);
  assert.strictEqual(correctClaim.isCorrect, true);

  const falseClaim = mathematicsService.verifyMathematicalClaim({
    expression: "2^8 - 16",
    proposedAnswer: 300
  });
  assert.strictEqual(falseClaim.verified, false);
  assert.strictEqual(falseClaim.isCorrect, false);
});

// -------------------------------------------------------------------------
// 17. Natural-Language Arithmetic Variations & Deep Theoretical Preservation
// -------------------------------------------------------------------------
test("17. Natural-Language Arithmetic: All 12 conversational variations resolve to deterministic value 12", () => {
  const variations = [
    "what 6 x 2",
    "what's 6 x 2",
    "whats 6 x 2",
    "what is 6 x 2",
    "what is 6x2",
    "6 x 2",
    "6x2",
    "how much is 6 x 2",
    "calculate 6 x 2",
    "can you tell me what 6 x 2 is",
    "what's six times two",
    "six times two?"
  ];

  for (const query of variations) {
    const parsed = mathematicsService.parseMathematicalIntent(query);
    assert.strictEqual(parsed.isMath, true, `Query "${query}" should be recognized as mathematical`);
    assert.strictEqual(parsed.type, "arithmetic", `Query "${query}" should be classified as arithmetic`);
    assert.strictEqual(parsed.result?.success, true, `Query "${query}" calculation should succeed`);
    assert.strictEqual(parsed.result?.value, 12, `Query "${query}" should evaluate to 12`);
  }
});

test("18. Deep Mathematical & Physical Inquiries: Preserves deep reasoning pathways", () => {
  const deepQueries = [
    "Why does the quadratic formula work?",
    "Derive the equation for orbital velocity.",
    "Explain the physical assumptions behind rocket cooling"
  ];

  for (const query of deepQueries) {
    const parsed = mathematicsService.parseMathematicalIntent(query);
    // Deep questions must not be collapsed into simple arithmetic
    assert.notStrictEqual(parsed.type, "arithmetic", `Deep query "${query}" should not be collapsed into arithmetic`);
  }
});

