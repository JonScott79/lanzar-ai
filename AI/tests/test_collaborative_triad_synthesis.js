/*
    test_collaborative_triad_synthesis.js

    Unit and Integration Test Suite for Collaborative Multi-Mind Synthesis (The LANZAR Way).
*/

const assert = require('assert');

async function runTriadTests() {
  console.log("=== LANZAR Collaborative Triad Synthesis Test Suite ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const provider = new StubModelProvider();

  // 1. All 3 Minds Enabled -> Triad Synthesis
  console.log("Test 1: Complex rocket redesign with all 3 minds enabled...");
  const optionsAllEnabled = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    selectedPersonaId: "auto"
  };

  const decisionTriad = CognitiveRouter.route("Redesign the engine architecture for our next generation rocket", [], optionsAllEnabled);
  assert.strictEqual(decisionTriad.owner, "triad");
  console.log("✓ Route decision:", decisionTriad.owner, `(${decisionTriad.reason})`);

  const responseTriad = await provider.generateResponse([
    { role: "user", content: "Redesign the engine architecture for our next generation rocket" }
  ], optionsAllEnabled);

  assert.strictEqual(responseTriad.isMultiTurn, true);
  assert.strictEqual(responseTriad.dialogues.length, 3);
  assert.strictEqual(responseTriad.dialogues[0].persona, "penny");
  assert.strictEqual(responseTriad.dialogues[1].persona, "pete");
  assert.strictEqual(responseTriad.dialogues[2].persona, "mina");
  console.log("✓ Triad response generated 3-step collaborative debate across Penny, Pete & Mina without Core interruption");

  // 2. Mina Disabled -> Dual Mind (Penny & Pete)
  console.log("Test 2: Trade-off query with Mina disabled...");
  const optionsMinaDisabled = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }],
    selectedPersonaId: "auto"
  };

  const decisionDual = CognitiveRouter.route("Should we rewrite our combustion code or build a monolithic prototype?", [], optionsMinaDisabled);
  assert.strictEqual(decisionDual.owner, "dual");
  console.log("✓ Route decision with Mina disabled:", decisionDual.owner);

  const responseDual = await provider.generateResponse([
    { role: "user", content: "Should we rewrite our combustion code or build a monolithic prototype?" }
  ], optionsMinaDisabled);

  assert.strictEqual(responseDual.isMultiTurn, true);
  assert.strictEqual(responseDual.dialogues.length, 2);
  assert(!responseDual.dialogues.some(d => d.persona === "mina"), "Mina MUST NOT participate when disabled");
  console.log("✓ Dual response strictly limited to Penny and Pete without Mina");

  // 3. Direct Perspective Override (Manual perspectiveMode lock)
  console.log("Test 3: Direct Perspective locked to Pete...");
  const optionsPeteLocked = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    perspectiveMode: "pete"
  };

  const decisionPete = CognitiveRouter.route("Redesign the engine architecture for our next generation rocket", [], optionsPeteLocked);
  assert.strictEqual(decisionPete.owner, "pete");
  console.log("✓ Direct perspectiveMode correctly overrides multi-mind routing to Pete");

  console.log("\n>>> ALL 3 COLLABORATIVE SYNTHESIS TESTS PASSED CLEANLY! <<<");
}

runTriadTests().catch(err => {
  console.error("Triad Test Suite Failed:", err);
  process.exit(1);
});
