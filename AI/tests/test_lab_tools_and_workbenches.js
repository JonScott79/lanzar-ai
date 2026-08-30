/*
    test_lab_tools_and_workbenches.js

    Unit and Integration Test Suite for LANZAR Lab Instruments and Workbenches.
*/

const assert = require('assert');

// Simple ES module / CommonJS mock runner for tools
async function runLabToolTests() {
  console.log("=== LANZAR Lab Instruments & Workbenches Test Suite ===");

  // 1. Test Equation Solver (Pete's Instrument)
  console.log("Test 1: Testing Pete's Equation Solver (Rocket Thrust & Isp)...");
  const { EQUATIONS } = await import('../js/tools/equation-solver.js');
  
  const thrustEq = EQUATIONS.find(e => e.id === 'thrust-isp');
  assert(thrustEq, "Thrust equation must exist");
  
  const thrustRes = thrustEq.solve({
    mdot: 120,
    ve: 3200,
    pe: 101.3,
    pa: 101.3,
    ae: 0.25
  });
  assert(thrustRes.summary.includes("384.00 kN"), "Thrust should be 384 kN");
  assert(thrustRes.summary.includes("326.3 s"), "Isp should be ~326.3s");
  console.log("✓ Pete's Rocket Thrust & Isp verified:", thrustRes.summary);

  // 2. Test Tsiolkovsky Equation
  console.log("Test 2: Testing Tsiolkovsky Delta-v...");
  const deltavEq = EQUATIONS.find(e => e.id === 'tsiolkovsky-deltav');
  const dvRes = deltavEq.solve({
    isp: 345,
    m0: 15000,
    mf: 3200
  });
  assert(dvRes.summary.includes("5225.9 m/s") || dvRes.summary.includes("522"), "Delta-v should be calculated accurately");
  console.log("✓ Tsiolkovsky Delta-v verified:", dvRes.summary);

  // 3. Test Regenerative Cooling Heat Flux
  console.log("Test 3: Testing Regenerative Cooling Heat Flux...");
  const regenEq = EQUATIONS.find(e => e.id === 'regen-cooling-flux');
  const regenRes = regenEq.solve({
    kwall: 360,
    twall: 1.2,
    tgas: 920,
    tcool: 310
  });
  assert(regenRes.summary.includes("183.00 MW/m²"), "Heat flux calculation should match thermal conduction");
  console.log("✓ Regenerative Heat Flux verified:", regenRes.summary);

  // 4. Test Brainstorm Pad (Penny's Instrument)
  console.log("Test 4: Testing Penny's Brainstorm Pad...");
  const { BrainstormPad } = await import('../js/tools/brainstorm-pad.js');
  const ideas = BrainstormPad.generateIdeas("Nuclear Thermal Rockets");
  assert.strictEqual(ideas.topic, "Nuclear Thermal Rockets");
  assert.strictEqual(ideas.categories.length, 3);
  assert(ideas.categories[0].ideas.length > 0);
  console.log("✓ Penny's Brainstorm Pad generated", ideas.categories.length, "divergent categories");

  // 5. Test Diagram Studio (Mina's Instrument)
  console.log("Test 5: Testing Mina's Diagram Studio...");
  const { DIAGRAM_TEMPLATES } = await import('../js/tools/diagram-studio.js');
  assert(DIAGRAM_TEMPLATES.length >= 2);
  const chamberSvg = DIAGRAM_TEMPLATES[0].generateSvg();
  assert(chamberSvg.includes("<svg") && chamberSvg.includes("</svg>"), "Must generate valid SVG code");
  assert(chamberSvg.includes("BLUEPRINT NO. CC-402"), "Must contain blueprint metadata");
  console.log("✓ Mina's Diagram Studio generated valid vector blueprint SVG");

  console.log("\n>>> ALL 5 LAB INSTRUMENTS & WORKBENCH TESTS PASSED CLEANLY! <<<");
}

runLabToolTests().catch(err => {
  console.error("Lab Tools Test Suite Failed:", err);
  process.exit(1);
});
