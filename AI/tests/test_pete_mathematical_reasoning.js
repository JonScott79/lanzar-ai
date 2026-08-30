/*
    test_pete_mathematical_reasoning.js

    Deterministic Mathematical Engine Verification Suite for Pete & LANZAR AI.
    Reuses Pythos verification core across 11 required mathematical categories:
    1. Algebra & Linear Equations
    2. Equations with Multiple Variables
    3. Underdetermined Equations (Ambiguity / Missing Constraints)
    4. Systems of Equations & Matrix Operations
    5. Fractions & Exact Rational Arithmetic
    6. Symbolic Expressions & Simplification
    7. Calculus & Derivatives
    8. Physics Equations & Thermodynamic Flux
    9. Unit Conversions & Dimensional Compatibility
    10. Malformed Expressions & Division by Zero
    11. Insufficient Information & Uncertainty Honesty
*/

const test = require('node:test');
const assert = require('node:assert');
const { mathematicsService } = require('../server/mathematics-service.js');

console.log("================================================================================");
console.log("   LANZAR AI — PETE & MATHEMATICAL ENGINE VERIFICATION TEST SUITE");
console.log("================================================================================\n");

// -------------------------------------------------------------------------
// 1. Algebra & Linear Equations
// -------------------------------------------------------------------------
test("Algebra: Pete solves linear equations deterministically", () => {
  const result = mathematicsService.solveEquation("3*x + 9 = 0", "x");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "VERIFIED");
  assert.strictEqual(result.solutions[0], -3);
  assert.ok(result.latex.includes("x = -3"));
});

// -------------------------------------------------------------------------
// 2. Equations with Multiple Variables & Polynomials
// -------------------------------------------------------------------------
test("Algebra: Solves equations when target variable is specified", () => {
  const result = mathematicsService.solveEquation("2*x + 4*y = 10", "x");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "SOLVED_SYMBOLICALLY");
  assert.ok(result.simplifiedDiff);
});

// -------------------------------------------------------------------------
// 3. Underdetermined Equations (Ambiguity / Missing Constraints)
// -------------------------------------------------------------------------
test("Underdetermined: Correctly flags underdetermined equation with multiple variables and no target", () => {
  const result = mathematicsService.solveEquation("2*x + 4*y - 3*z = 10", null);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, "UNDERDETERMINED");
  assert.ok(result.details.includes("independent variables"));
});

// -------------------------------------------------------------------------
// 4. Systems of Equations & Matrix Operations
// -------------------------------------------------------------------------
test("Linear Algebra: Determinant and matrix multiplication", () => {
  const mathjs = require('c:/Projects/lanzar/pythos/server/node_modules/mathjs');
  const matA = [[1, 2], [3, 4]];
  const det = mathjs.det(matA);
  assert.strictEqual(det, -2);

  const invA = mathjs.inv(matA);
  const prod = mathjs.multiply(matA, invA);
  // Identity matrix check
  assert.ok(Math.abs(prod[0][0] - 1) < 1e-10);
  assert.ok(Math.abs(prod[0][1] - 0) < 1e-10);
  assert.ok(Math.abs(prod[1][0] - 0) < 1e-10);
  assert.ok(Math.abs(prod[1][1] - 1) < 1e-10);
});

// -------------------------------------------------------------------------
// 5. Fractions & Exact Rational Arithmetic
// -------------------------------------------------------------------------
test("Exact Fractions: Preserves exact rational values without floating point distortion", () => {
  const result = mathematicsService.evaluateArithmetic("1/3 + 1/6");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "VERIFIED");
  assert.strictEqual(result.type, "fraction");
  assert.strictEqual(result.exactFraction, "1/2");
  assert.strictEqual(result.decimalValue, 0.5);
  assert.ok(result.latex.includes("\\frac{1}{2}"));
});

// -------------------------------------------------------------------------
// 6. Symbolic Expressions & Simplification
// -------------------------------------------------------------------------
test("Symbolic Simplification: Simplifies algebraic expressions into canonical form", () => {
  const result = mathematicsService.simplifyExpression("2*x + 3*x + 4*y - y + 10");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "VERIFIED");
  assert.ok(result.simplified.includes("5 * x") || result.simplified.includes("5x") || result.simplified.includes("5 * (x"));
  assert.ok(result.simplified.includes("3 * y") || result.simplified.includes("3y") || result.simplified.includes("3 * (y"));
});

// -------------------------------------------------------------------------
// 7. Calculus & Derivatives
// -------------------------------------------------------------------------
test("Calculus: Computes exact symbolic derivatives and outputs KaTeX LaTeX", () => {
  const result = mathematicsService.differentiate("x^3 + 4*x^2 - 7*x + 12", "x");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "VERIFIED");
  assert.ok(result.derivative.includes("3 * x ^ 2") || result.derivative.includes("3 * x^2"));
  assert.ok(result.derivative.includes("8 * x"));
  assert.ok(result.latex.includes("\\frac{d}{dx}"));
});

// -------------------------------------------------------------------------
// 8. Physics Equations & Thermodynamic Flux
// -------------------------------------------------------------------------
test("Physics & Thermodynamics: Evaluates heat flux through chamber wall", () => {
  // q = (k / t) * (T_hot - T_cool)
  // k = 360 W/(m*K), t = 0.0012 m, T_hot = 920 K, T_cool = 310 K
  const expr = "(360 / 0.0012) * (920 - 310)";
  const result = mathematicsService.evaluateArithmetic(expr);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "VERIFIED");
  assert.strictEqual(result.value, 183000000); // 183 MW/m^2
});

// -------------------------------------------------------------------------
// 9. Unit Conversions & Dimensional Compatibility
// -------------------------------------------------------------------------
test("Unit Conversion: Converts units accurately with dimensional compatibility", () => {
  const result = mathematicsService.convertUnits("5 km", "m");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, "VERIFIED");
  assert.strictEqual(result.numericValue, 5000);
  assert.strictEqual(result.formatted, "5000 m");

  const mismatch = mathematicsService.convertUnits("5 kg", "meters");
  assert.strictEqual(mismatch.success, false);
  assert.strictEqual(mismatch.status, "UNIT_MISMATCH");
  assert.ok(mismatch.details.includes("dimensional mismatch"));
});

// -------------------------------------------------------------------------
// 10. Malformed Expressions & Division by Zero
// -------------------------------------------------------------------------
test("Error Handling: Flags division by zero and malformed syntax safely", () => {
  const divZero = mathematicsService.evaluateArithmetic("10 / 0");
  assert.strictEqual(divZero.success, false);
  assert.strictEqual(divZero.status, "UNDEFINED");

  const malformed = mathematicsService.evaluateArithmetic("4 *+ / (");
  assert.strictEqual(malformed.success, false);
  assert.strictEqual(malformed.status, "MALFORMED_EXPRESSION");
});

// -------------------------------------------------------------------------
// 11. Insufficient Information & Uncertainty Honesty
// -------------------------------------------------------------------------
test("Verification Tool Pipeline: Handles empty or insufficient information claims", () => {
  const result = mathematicsService.verifyMathematicalClaim({});
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, "INSUFFICIENT_INFORMATION");
});
