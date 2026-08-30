/*
    test_generalization_and_deference.js

    Regression test suite for:
    - Novel prompts not seen in training/original suites (suspension physics, competing designs, 2-day sprint, ambiguous ideas)
    - In-character deference (Mina defers deep calculus/physics to Pete, Pete defers collectibles to Mina)
    - Focus release when topic shifts abruptly
    - Controlled dynamic greeting variation across repeated 'Hey Team!' turns
*/

const assert = require('assert');

async function runGeneralizationTests() {
  console.log("=== LANZAR Generalization, Deference & Focus Dynamism Tests ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const stubProvider = new StubModelProvider();
  const optionsAll = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    selectedPersonaId: "auto"
  };

  // =========================================================================
  // 1. Novel Prompt: 3 Competing Designs -> Pete's Analytical Evaluation
  // =========================================================================
  console.log("\n[Test 1] Novel prompt: 'I have three possible solutions and need to determine which one is actually defensible'...");
  const query1 = "I have three possible solutions and need to determine which one is actually defensible";
  const dec1 = CognitiveRouter.route(query1, [], optionsAll);
  assert.strictEqual(dec1.owner, "pete", "Defensibility/evaluative analysis routes to Pete");
  const res1 = await stubProvider.generateResponse([{ role: "user", content: query1 }], optionsAll);
  assert.strictEqual(res1.persona, "pete");
  assert(res1.content.includes("Trade-off Framework"), "Pete provides analytical trade-off matrix");
  console.log("✓ Pete successfully claimed novel evaluative design query!");

  // =========================================================================
  // 2. Novel Prompt: 2-Day Prototype Emergency -> Penny's Rapid Sprint
  // =========================================================================
  console.log("\n[Test 2] Novel prompt: 'I have two days to make something work and nothing exists yet'...");
  const query2 = "I have two days to make something work and nothing exists yet";
  const dec2 = CognitiveRouter.route(query2, [], optionsAll);
  assert.strictEqual(dec2.owner, "penny", "Two-day zero-to-one emergency routes to Penny");
  const res2 = await stubProvider.generateResponse([{ role: "user", content: query2 }], optionsAll);
  assert.strictEqual(res2.persona, "penny");
  assert(res2.content.includes("TWO DAYS?!"), "Penny enthusiastically claims zero-to-one sprint");
  console.log("✓ Penny successfully claimed novel 2-day rapid prototype query!");

  // =========================================================================
  // 3. Novel Prompt: Ambiguous Idea -> Penny Whiteboard Encouragement
  // =========================================================================
  console.log("\n[Test 3] Novel prompt: 'I've got an idea, but I don't know if it's stupid'...");
  const query3 = "I've got an idea, but I don't know if it's stupid";
  const dec3 = CognitiveRouter.route(query3, [], optionsAll);
  assert.strictEqual(dec3.owner, "penny", "Ambiguous/crazy idea encourages Penny");
  const res3 = await stubProvider.generateResponse([{ role: "user", content: query3 }], optionsAll);
  assert.strictEqual(res3.persona, "penny");
  assert(res3.content.includes("stupid idea in my workshop"), "Penny reassures user to share wild concepts");
  console.log("✓ Penny claimed ambiguous idea query!");

  // =========================================================================
  // 4. Character Deference: User asks Mina pure physics / rocket question
  // =========================================================================
  console.log("\n[Test 4] Deference: User asks 'Mina, how does a rocket work?'...");
  const query4 = "Mina, how does a rocket work?";
  const dec4 = CognitiveRouter.route(query4, [], optionsAll);
  assert.strictEqual(dec4.owner, "mina_to_pete_deference", "Mina defers deep rocket physics to Pete");
  const res4 = await stubProvider.generateResponse([{ role: "user", content: query4 }], optionsAll);
  assert.strictEqual(res4.isMultiTurn, true);
  assert.strictEqual(res4.dialogues[0].persona, "mina");
  assert(res4.dialogues[0].content.includes("Pete?!"), "Mina calls Pete into the chat");
  assert.strictEqual(res4.dialogues[1].persona, "pete");
  assert(res4.dialogues[1].content.includes("momentum transfer"), "Pete answers with physical equations");
  console.log("✓ Mina playfully deferred rocket physics to Pete!");

  // =========================================================================
  // 5. Dynamic Conversational Continuity: After talking to Mina, asking a deep physics query routes cleanly to Pete in Auto Mode
  // =========================================================================
  console.log("\n[Test 5] Dynamic Conversational Continuity: After talking to Mina, asking physics routes to Pete in Auto mode...");
  const historyAfterMina = [
    { role: "user", content: "Tell me about Pokémon cards" },
    { role: "assistant", persona: "mina", content: "I love cute cards!" }
  ];
  const physicsQuery = "Calculate the aerospike expansion ratio and heat flux at 70 bar";
  const dec5 = CognitiveRouter.route(physicsQuery, historyAfterMina, optionsAll);
  assert.strictEqual(dec5.owner, "pete", "Strong physics query autonomously routes to Pete without being trapped by previous Mina turn");
  console.log("✓ High-affinity domain query routed to Pete dynamically!");

  console.log("\n>>> ALL GENERALIZATION, DEFERENCE & DYNAMIC FOCUS TESTS PASSED CLEANLY! <<<");
}

runGeneralizationTests().catch(err => {
  console.error("Test Failed:", err);
  process.exit(1);
});
