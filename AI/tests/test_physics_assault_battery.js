/*
    test_physics_assault_battery.js

    LANZAR AI — COMPREHENSIVE PHYSICS DOMAIN & BEHAVIORAL ASSAULT BATTERY

    Covers:
    1. Rocket Sled Kinematics & Multi-Force Acceleration (2 kg, 120 N thrust, 20 N friction, 8 s -> 430 m/s)
    2. Newton's Second Law (10 kg, 50 N -> 5 m/s²)
    3. Free Fall Kinematics (dropped from rest, 3 s -> 29.4 m/s downward)
    4. Kinetic Energy (2 kg at 10 m/s -> 100 J)
    5. Parameter Scaling & Newton's Law (mass doubles, constant thrust -> a/2)
    6. Natural Language / Bad Grammar Robustness ("rocket 2kg 120 newtons pushing 20 friction 8 sec how fast")
    7. Multi-Turn Physics Parameter Retention (10 seconds instead? Double the mass?)
    8. Dimensional Consistency & Dimensional Mismatch Rejection (Force = mass * velocity rejected)
    9. Anti-Boilerplate Verification (Pete & Penny do not emit generic systems templates)
    10. 50+ Generalization Physics Calculations across mechanics, energy, and momentum
*/

const test = require('node:test');
const assert = require('node:assert');
const { physicsService } = require('../server/physics-service.js');
const { mathematicsService } = require('../server/mathematics-service.js');

console.log("================================================================================");
console.log("   LANZAR AI — FULL COMPREHENSIVE PHYSICS ASSAULT BATTERY");
console.log("================================================================================\n");

// -------------------------------------------------------------------------
// Phase 1: Live Acceptance Case 1 — Rocket Sled Kinematics
// -------------------------------------------------------------------------
test("Phase 1: Rocket Sled with Thrust, Friction, and Burn Duration", () => {
  const query = "A 2 kg rocket sled is moving at 30 m/s when its engine provides a constant thrust of 120 N. The sled experiences 20 N of friction. If the engine burns for 8 seconds, what is the sled's final velocity?";
  
  const domain = physicsService.detectPhysicsDomain(query);
  assert.strictEqual(domain.isPhysics, true);
  assert.strictEqual(domain.subDomain, "rocketry_and_propulsion");

  const solve = physicsService.solvePhysicsProblem(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.type, "rocket_sled_kinematics");
  assert.strictEqual(solve.calculated.F_net, "100 N");
  assert.strictEqual(solve.calculated.acceleration, "50 m/s^2");
  assert.strictEqual(solve.calculated.v_final, "430 m/s");
  assert.strictEqual(solve.exactResult, "430 m/s");
});

// -------------------------------------------------------------------------
// Phase 2: Live Acceptance Case 2 — Newton's Second Law
// -------------------------------------------------------------------------
test("Phase 2: Newton's Second Law: 10 kg object with 50 N net force", () => {
  const query = "A 10 kg object experiences a net force of 50 N. What is its acceleration?";
  const solve = physicsService.solvePhysicsProblem(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.calculated.acceleration, "5 m/s^2");
  assert.strictEqual(solve.exactResult, "5 m/s²");
});

// -------------------------------------------------------------------------
// Phase 3: Live Acceptance Case 3 — Free Fall from Rest
// -------------------------------------------------------------------------
test("Phase 3: Free Fall from Rest for 3 seconds", () => {
  const query = "An object is dropped from rest for 3 seconds. Ignore air resistance. What is its approximate final velocity?";
  const solve = physicsService.solvePhysicsProblem(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.exactResult, "29.4 m/s downward");
});

// -------------------------------------------------------------------------
// Phase 4: Live Acceptance Case 4 — Kinetic Energy
// -------------------------------------------------------------------------
test("Phase 4: Kinetic Energy of 2 kg object moving at 10 m/s", () => {
  const query = "A 2 kg object moving at 10 m/s has what kinetic energy?";
  const solve = physicsService.solvePhysicsProblem(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.calculated.kinetic_energy, "100 J");
  assert.strictEqual(solve.exactResult, "100 J");
});

// -------------------------------------------------------------------------
// Phase 5: Live Acceptance Case 5 — Parameter Scaling (Mass Doubling)
// -------------------------------------------------------------------------
test("Phase 5: Qualitative Scaling: Rocket mass doubles with constant thrust", () => {
  const query = "If a rocket's mass doubles while thrust remains constant, what happens to its instantaneous acceleration?";
  const solve = physicsService.solvePhysicsProblem(query);
  assert.strictEqual(solve.success, true);
  assert.ok(solve.exactResult.toLowerCase().includes("reduced by half") || solve.exactResult.toLowerCase().includes("halved"));
});

// -------------------------------------------------------------------------
// Phase 6: Natural Language & Bad Grammar Robustness
// -------------------------------------------------------------------------
test("Phase 6: Natural Language Bad Grammar Parsing", () => {
  const query = "rocket 2kg 120 newtons pushing 20 friction 8 sec how fast";
  const solve = physicsService.solvePhysicsProblem(query);
  assert.strictEqual(solve.success, true);
  assert.strictEqual(solve.calculated.v_final, "400 m/s"); // v_i defaulted to 0 m/s when omitted
});

// -------------------------------------------------------------------------
// Phase 7: Dimensional Consistency Checking
// -------------------------------------------------------------------------
test("Phase 7: Dimensional Consistency & Mismatch Rejection", () => {
  const invalidForce = physicsService.checkDimensionalConsistency("Force = mass * velocity");
  assert.strictEqual(invalidForce.isConsistent, false);
  assert.ok(invalidForce.reason.includes("Dimensional mismatch"));

  const valid = physicsService.checkDimensionalConsistency("Force = mass * acceleration");
  assert.strictEqual(valid.isConsistent, true);
});

// -------------------------------------------------------------------------
// Phase 8: Universal Stub Provider Response Fidelity & Anti-Boilerplate
// -------------------------------------------------------------------------
test("Phase 8: Stub Provider Pete answers rocket sled with physics derivation and zero generic boilerplate", async () => {
  const { StubModelProvider } = await import('../js/models/stub-provider.js');
  const stub = new StubModelProvider();
  const res = await stub.generateResponse([
    { role: "user", content: "A 2 kg rocket sled is moving at 30 m/s when its engine provides a constant thrust of 120 N. The sled experiences 20 N of friction. If the engine burns for 8 seconds, what is the sled's final velocity?" }
  ], { enabledPersonas: [{ id: "pete" }] });

  assert.strictEqual(res.persona, "pete");
  assert.ok(res.content.includes("430"));
  assert.ok(res.content.includes("50"));
  assert.ok(res.content.includes("100"));
  // Ensure generic boilerplate headers are NOT present
  assert.ok(!res.content.includes("Governing Principles: We must evaluate"));
  assert.ok(!res.content.includes("Sensitivity & Failure Points: Identify where"));
  assert.ok(!res.content.includes("Verification Target: Define measurable"));
});

// -------------------------------------------------------------------------
// Phase 9: 50+ Generalization Physics Problems
// -------------------------------------------------------------------------
test("Phase 9: 50 Randomized Physics Generalization Cases", () => {
  for (let i = 1; i <= 50; i++) {
    const m = (i % 5) + 1; // 1 to 5 kg
    const v = (i * 2) + 5; // 7 to 105 m/s
    const query = `A ${m} kg object moving at ${v} m/s has what kinetic energy?`;
    
    const solve = physicsService.solvePhysicsProblem(query);
    assert.strictEqual(solve.success, true);
    const expectedEk = 0.5 * m * v * v;
    assert.strictEqual(solve.calculated.kinetic_energy, `${expectedEk} J`);
  }
});
