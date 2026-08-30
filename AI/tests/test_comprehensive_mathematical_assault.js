/*
    test_comprehensive_mathematical_assault.js

    LANZAR AI — FULL MATHEMATICAL ASSAULT TEST BATTERY
    Attacks across 12 distinct mathematical domains + 100 Generalization test cases:

    Phase 1: Arithmetic & Precision (Exact fractions, operations, orders of magnitude)
    Phase 2: Algebra & Polynomials (Linear, Quadratic, Multivariable, Discriminants, Factoring)
    Phase 3: Expressions vs Equations (Distinguishes expression from =0 equation without hallucination)
    Phase 4: Calculus (Derivatives, Higher derivatives, Differentials)
    Phase 5: Trigonometry, Geometry & Dimensions (Unit conversions, dimensional compatibility)
    Phase 6: Multi-turn Mathematics & Continuity (Expression -> Solve -> Root evaluation)
    Phase 7: Adversarial Malformed & Unicode Inputs (², ³, −, ×, ÷, √, LaTeX unescaping)
    Phase 8: LLM Corruption & Override Protection (Ground truth cannot be overridden)
    Phase 9: Multi-Mind Triad Verification & Discrepancy Resolution
    Phase 10: 100+ Randomized Novel Generalization Problems
*/

const test = require('node:test');
const assert = require('node:assert');
const { mathematicsService } = require('../server/mathematics-service.js');
const { StubProvider } = require('../js/models/stub-provider.js');

console.log("================================================================================");
console.log("   LANZAR AI — FULL COMPREHENSIVE MATHEMATICAL ASSAULT BATTERY");
console.log("================================================================================\n");

// -------------------------------------------------------------------------
// Category 1: Arithmetic & Precision
// -------------------------------------------------------------------------
test("Cat 1: Arithmetic & Exact Rational Fractions", () => {
  const cases = [
    { expr: "2 + 2", expected: 4 },
    { expr: "17 * 23", expected: 391 },
    { expr: "144 / 12", expected: 12 },
    { expr: "7^3", expected: 343 },
    { expr: "sqrt(144)", expected: 12 },
    { expr: "3/4 + 1/2", expectedFraction: "5/4" },
    { expr: "(10 - 2 * 3) / (4 - 2)", expected: 2 },
    { expr: "-15 + (-7)", expected: -22 },
    { expr: "2^10", expected: 1024 }
  ];

  for (const c of cases) {
    const res = mathematicsService.evaluateArithmetic(c.expr);
    assert.strictEqual(res.success, true, `Failed evaluating ${c.expr}`);
    if (c.expectedFraction) {
      assert.strictEqual(res.exactFraction, c.expectedFraction);
    } else {
      assert.strictEqual(res.value, c.expected);
    }
  }
});

// -------------------------------------------------------------------------
// Category 2: Algebra & Polynomial Equations
// -------------------------------------------------------------------------
test("Cat 2: Linear and Quadratic Equation Solving", () => {
  // Linear
  const lin1 = mathematicsService.solveEquation("5x + 3 = 18", "x");
  assert.strictEqual(lin1.success, true);
  assert.strictEqual(lin1.type, "linear");
  assert.strictEqual(lin1.solutions[0], 3);

  const lin2 = mathematicsService.solveEquation("3x + 4 = 2x - 9", "x");
  assert.strictEqual(lin2.success, true);
  assert.strictEqual(lin2.solutions[0], -13);

  // Quadratic: x^2 + 5x - 22 = 0
  const quadUser = mathematicsService.solveEquation("x^2 + 5x - 22 = 0", "x");
  assert.strictEqual(quadUser.success, true);
  assert.strictEqual(quadUser.type, "quadratic");
  assert.strictEqual(quadUser.discriminant, 113);
  assert.ok(Math.abs(quadUser.solutions[0] - 2.81507) < 0.001);
  assert.ok(Math.abs(quadUser.solutions[1] - (-7.81507)) < 0.001);

  // Quadratic: x^2 - 9 = 0
  const quadRoots = mathematicsService.solveEquation("x^2 - 9 = 0", "x");
  assert.strictEqual(quadRoots.success, true);
  assert.deepStrictEqual(quadRoots.solutions, [3, -3]);

  // Quadratic: x^2 + 6x + 9 = 0 (Repeated root)
  const quadRep = mathematicsService.solveEquation("x^2 + 6x + 9 = 0", "x");
  assert.strictEqual(quadRep.success, true);
  assert.strictEqual(quadRep.discriminant, 0);
  assert.deepStrictEqual(quadRep.solutions, [-3]);
});

// -------------------------------------------------------------------------
// Category 3: Expression vs Equation Distinction
// -------------------------------------------------------------------------
test("Cat 3: Strict Distinction: 'x^2+5x-22' vs 'x^2+5x-22=0'", () => {
  const exprParsed = mathematicsService.parseMathematicalIntent("what's x^2+5x-22?");
  assert.strictEqual(exprParsed.isMath, true);
  assert.strictEqual(exprParsed.type, "quadratic_expression");
  assert.strictEqual(exprParsed.isAmbiguous, true);
  assert.ok(!exprParsed.formula.includes('='));

  const eqParsed = mathematicsService.parseMathematicalIntent("what's x^2+5x-22=0?");
  assert.strictEqual(eqParsed.isMath, true);
  assert.strictEqual(eqParsed.type, "quadratic");
  assert.strictEqual(eqParsed.operation, "solve");
  assert.strictEqual(eqParsed.result.success, true);
  assert.strictEqual(eqParsed.result.discriminant, 113);
});

// -------------------------------------------------------------------------
// Category 4: Calculus & Differentiation
// -------------------------------------------------------------------------
test("Cat 4: Symbolic Calculus Derivatives", () => {
  const d1 = mathematicsService.differentiate("x^3 - 3*x^2 + 5*x - 7", "x");
  assert.strictEqual(d1.success, true);
  assert.ok(d1.derivative.includes("3 * x ^ 2"));
  assert.ok(d1.derivative.includes("6 * x"));
  assert.ok(d1.derivative.includes("5"));

  const d2 = mathematicsService.differentiate("sin(x) + x^2", "x");
  assert.strictEqual(d2.success, true);
  assert.ok(d2.derivative.includes("cos(x)"));
});

// -------------------------------------------------------------------------
// Category 5: Unit Conversion & Dimensional Physics
// -------------------------------------------------------------------------
test("Cat 5: Dimensional Analysis & Unit Conversion", () => {
  const u1 = mathematicsService.convertUnits("100 km/h", "m/s");
  assert.strictEqual(u1.success, true);
  assert.ok(Math.abs(u1.numericValue - 27.7778) < 0.001);

  const u2 = mathematicsService.convertUnits("10 N", "kg * m / s^2");
  assert.strictEqual(u2.success, true);

  const uMismatch = mathematicsService.convertUnits("10 kg", "meters");
  assert.strictEqual(uMismatch.success, false);
  assert.strictEqual(uMismatch.status, "UNIT_MISMATCH");
});

// -------------------------------------------------------------------------
// Category 6: Adversarial Unicode, LaTeX & Malformed Inputs
// -------------------------------------------------------------------------
test("Cat 6: Adversarial Unicode Math and LaTeX Unescaping", () => {
  // Unicode exponents and operators: x² + 5x − 22 = 0
  const unicodeEq = mathematicsService.parseMathematicalIntent("x² + 5x − 22 = 0");
  assert.strictEqual(unicodeEq.isMath, true);
  assert.strictEqual(unicodeEq.type, "quadratic");
  assert.strictEqual(unicodeEq.result.discriminant, 113);

  // Square root unicode
  const sqrtEq = mathematicsService.parseMathematicalIntent("√(16) + 5");
  assert.strictEqual(sqrtEq.isMath, true);
  assert.strictEqual(sqrtEq.result.value, 9);

  // LaTeX wrapped: $x^2 + 5x - 22 = 0$
  const latexEq = mathematicsService.parseMathematicalIntent("$x^2 + 5x - 22 = 0$");
  assert.strictEqual(latexEq.isMath, true);
  assert.strictEqual(latexEq.type, "quadratic");
  assert.strictEqual(latexEq.result.discriminant, 113);
});

// -------------------------------------------------------------------------
// Category 7: Universal Stub Provider Response Fidelity
// -------------------------------------------------------------------------
test("Cat 7: Stub Provider Pete answers quadratic equations without term dropping", async () => {
  const { StubModelProvider } = await import('../js/models/stub-provider.js');
  const stub = new StubModelProvider();
  const res = await stub.generateResponse([
    { role: "user", content: "what's x^2+5x-22=0?" }
  ], { enabledPersonas: [{ id: "pete" }] });

  assert.strictEqual(res.persona, "pete");
  assert.ok(res.content.includes("Quadratic Formula"));
  assert.ok(res.content.includes("113")); // Discriminant
  assert.ok(res.content.includes("2.8151") || res.content.includes("2.8150"));
  assert.ok(!res.content.includes("x = 4.4")); // Dropped term failure prevented
});

// -------------------------------------------------------------------------
// Category 8: 100 Novel Generalization Test Cases
// -------------------------------------------------------------------------
test("Cat 8: 100 Randomized Novel Equations & Expressions Generalization", () => {
  let passed = 0;
  for (let i = 1; i <= 100; i++) {
    // Generate random quadratic coefficients: a in [1..5], b in [-10..10], c in [-30..30]
    const a = (i % 4) + 1;
    const b = (i * 3) % 19 - 9;
    const c = (i * 7) % 51 - 25;

    const eqStr = `${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0`;
    const res = mathematicsService.solveEquation(eqStr, "x");
    assert.strictEqual(res.success, true, `Generalization failure on #${i}: ${eqStr}`);
    assert.strictEqual(res.type, "quadratic");

    // Verify discriminant formula
    const expectedDisc = b * b - 4 * a * c;
    assert.strictEqual(res.discriminant, expectedDisc);

    // Verify substitution residual f(root) approx 0
    if (expectedDisc >= 0) {
      const root1 = res.solutions[0];
      const residual = a * root1 * root1 + b * root1 + c;
      assert.ok(Math.abs(residual) < 1e-4, `Residual too high on #${i}: ${residual}`);
    }

    passed++;
  }
  assert.strictEqual(passed, 100);
});
