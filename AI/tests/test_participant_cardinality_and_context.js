/*
    test_participant_cardinality_and_context.js

    Regression test suite enforcing:
    1. Dynamic Participant Cardinality (0, 1, 2, 3+ characters emerge from request complexity).
    2. Focus is conversational/UI state, NOT an exclusive permission lock.
    3. Explicit single/multi-person addressing works cleanly.
    4. Casual conversation ("How's everybody doing?", "How's your day?") is treated humanely, not as rigid technical tasks.
    5. Personal & food preferences ("What are all three of your favorite foods?") produce individual in-character replies.
    6. Contextual follow-up ("Build it") executes active discussion rather than repeating generic brainstorming.
    7. Unknown concepts ("Chairman") prompt clarification questions rather than arbitrary specialist task generation.
*/

const assert = require('assert');

async function runCardinalityAndContextTests() {
  console.log("=== LANZAR Dynamic Participant Cardinality & Contextual Intelligence Suite ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const stubProvider = new StubModelProvider();
  const allEnabledOptions = {
    enabledPersonas: [{ id: "penny", shortName: "Penny" }, { id: "pete", shortName: "Pete" }, { id: "mina", shortName: "Mina" }],
    selectedPersonaId: "auto"
  };

  // =========================================================================
  // 1. Single-Domain Requests (Cardinality: 1)
  // =========================================================================
  console.log("\n[Test 1] Single-domain requests route to exactly 1 specialist...");
  // Pure math -> Pete
  const decMath = CognitiveRouter.route("Solve for x: 5x + 2 = 12", [], allEnabledOptions);
  assert.strictEqual(decMath.owner, "pete", "Math request must route solely to Pete");
  const resMath = await stubProvider.generateResponse([{ role: "user", content: "Solve for x: 5x + 2 = 12" }], allEnabledOptions);
  assert.strictEqual(resMath.persona, "pete");
  assert.strictEqual(resMath.isMultiTurn, false);
  console.log("✓ Single-domain math routed solely to Pete (1 participant).");

  // Pure visual identity -> Mina
  const decArt = CognitiveRouter.route("Design a retro-futuristic aerospace logo", [], allEnabledOptions);
  assert.strictEqual(decArt.owner, "mina", "Visual identity request must route solely to Mina");
  const resArt = await stubProvider.generateResponse([{ role: "user", content: "Design a retro-futuristic aerospace logo" }], allEnabledOptions);
  assert.strictEqual(resArt.persona, "mina");
  assert.strictEqual(resArt.isMultiTurn, false);
  console.log("✓ Single-domain visual identity routed solely to Mina (1 participant).");

  // Pure rapid prototype -> Penny
  const decProto = CognitiveRouter.route("We have two days and nothing built yet for our prototype sprint", [], allEnabledOptions);
  assert.strictEqual(decProto.owner, "penny", "Prototype sprint must route solely to Penny");
  const resProto = await stubProvider.generateResponse([{ role: "user", content: "We have two days and nothing built yet for our prototype sprint" }], allEnabledOptions);
  assert.strictEqual(resProto.persona, "penny");
  assert.strictEqual(resProto.isMultiTurn, false);
  console.log("✓ Single-domain prototype sprint routed solely to Penny (1 participant).");

  // =========================================================================
  // 2. Dual-Domain Requests (Cardinality: 2)
  // =========================================================================
  console.log("\n[Test 2] Dual-domain requests route to 2 participating minds...");
  // Science + Art (Pete + Mina): "Make this technically sound and beautiful"
  const decDualSciArt = CognitiveRouter.route("Make this rocket telemetry dashboard technically sound and beautiful", [], allEnabledOptions);
  assert.strictEqual(decDualSciArt.owner, "mina_pete", "Science + Art must route to Pete & Mina");
  const resDualSciArt = await stubProvider.generateResponse([{ role: "user", content: "Make this rocket telemetry dashboard technically sound and beautiful" }], allEnabledOptions);
  assert.strictEqual(resDualSciArt.dialogues.length, 2, "Dual-domain response contains 2 character dialogues");
  console.log("✓ Science + Art routed to Pete & Mina (2 participants).");

  // Engineering + Science (Penny + Pete): "Should we rewrite the entire simulation engine?"
  const decDualEngSci = CognitiveRouter.route("Should we rewrite the entire simulation engine in Rust?", [], allEnabledOptions);
  assert.strictEqual(decDualEngSci.owner, "dual", "Engineering trade-off must route to Penny & Pete");
  const resDualEngSci = await stubProvider.generateResponse([{ role: "user", content: "Should we rewrite the entire simulation engine in Rust?" }], allEnabledOptions);
  assert.strictEqual(resDualEngSci.dialogues.length, 2);
  console.log("✓ Engineering + Science trade-off routed to Penny & Pete (2 participants).");

  // =========================================================================
  // 3. Three-Domain Requests & Team Questions (Cardinality: 3)
  // =========================================================================
  console.log("\n[Test 3] 3-Domain & Team-wide requests route to all 3 minds...");
  // 3-Domain: Looks great (Mina) + works well (Pete) + finished quickly (Penny)
  const decTriad3 = CognitiveRouter.route("I need something that looks great, works well, and can be finished quickly", [], allEnabledOptions);
  assert.strictEqual(decTriad3.owner, "triad", "3-domain request routes to Triad");
  const resTriad3 = await stubProvider.generateResponse([{ role: "user", content: "I need something that looks great, works well, and can be finished quickly" }], allEnabledOptions);
  assert.strictEqual(resTriad3.dialogues.length, 3);
  console.log("✓ 3-Domain request engaged all 3 minds (Mina, Pete, Penny).");

  // Team question: "What are all three of your favorite foods?"
  const decFood = CognitiveRouter.route("What are all three of your favorite foods?", [], allEnabledOptions);
  assert.strictEqual(decFood.owner, "triad", "Team question routes to Triad");
  const resFood = await stubProvider.generateResponse([{ role: "user", content: "What are all three of your favorite foods?" }], allEnabledOptions);
  assert.strictEqual(resFood.dialogues.length, 3);
  assert(resFood.dialogues.some(d => d.content.includes("tacos")), "Penny loves tacos");
  assert(resFood.dialogues.some(d => d.content.includes("rye sourdough")), "Pete loves dark rye sourdough");
  assert(resFood.dialogues.some(d => d.content.includes("mochi")), "Mina loves strawberry mochi");
  console.log("✓ Personal team question answered individually by all 3 characters!");

  // =========================================================================
  // 4. Focus is NOT an Exclusivity Lock
  // =========================================================================
  console.log("\n[Test 4] Focus on Mina does NOT prevent Pete from answering physics...");
  const focusOnMinaOptions = {
    ...allEnabledOptions,
    selectedPersonaId: "mina"
  };
  const decPhysicsUnderMinaFocus = CognitiveRouter.route("How does a rocket engine work?", [], focusOnMinaOptions);
  assert.strictEqual(decPhysicsUnderMinaFocus.owner, "pete", "Rocket physics must route to Pete even if focus was on Mina");
  console.log("✓ Focus on Mina did not hijack rocket engine question—routed autonomously to Pete!");

  // =========================================================================
  // 5. Casual Conversation is Human, NOT Template Task
  // =========================================================================
  console.log("\n[Test 5] Casual conversation ('hows ya'lls day?') produces genuine greeting...");
  const decDay = CognitiveRouter.route("hows ya'lls day?", [], allEnabledOptions);
  assert.strictEqual(decDay.owner, "triad", "Team check-in routes to Triad");
  const resDay = await stubProvider.generateResponse([{ role: "user", content: "hows ya'lls day?" }], allEnabledOptions);
  assert.strictEqual(resDay.dialogues.length, 3);
  assert(!resDay.dialogues.some(d => d.content.includes("Art Direction & Visual Blueprint")), "Must not generate art blueprint for casual day check-in");
  console.log("✓ Casual check-in returned authentic personal dialogue from all 3 characters!");

  // =========================================================================
  // 6. Unknown Concept Clarification ("Chairman" test)
  // =========================================================================
  console.log("\n[Test 6] Unknown concept ('what do you know of the chairman???') requests clarification...");
  const decChairman = CognitiveRouter.route("what do you know of the chairman???", [], allEnabledOptions);
  assert.strictEqual(decChairman.taskType, "unknown_concept_clarification");
  const resChairman = await stubProvider.generateResponse([{ role: "user", content: "what do you know of the chairman???" }], allEnabledOptions);
  assert(resChairman.content.includes("chairman"), "Response asks user for context on the chairman");
  assert(!resChairman.content.includes("Art Direction Concept"), "Must not invent specialist design task");
  console.log("✓ Unknown concept gracefully handled with clarification question!");

  // =========================================================================
  // 7. Context Preservation on Follow-Up ("Build it")
  // =========================================================================
  console.log("\n[Test 7] Follow-up 'Build it' executes active conversational context...");
  const conversationPlanHistory = [
    { role: "user", content: "I want a landing page for our new aerospace venture" },
    { role: "assistant", persona: "triad", content: "Mina has prepared the design system, Pete outlined the schema, and Penny prepared the scaffolding." }
  ];
  const decBuildIt = CognitiveRouter.route("Build it.", conversationPlanHistory, allEnabledOptions);
  assert.strictEqual(decBuildIt.taskType, "fullstack_website_build", "Build it transitions from plan to fullstack code build");
  const resBuildIt = await stubProvider.generateResponse([...conversationPlanHistory, { role: "user", content: "Build it." }], allEnabledOptions);
  assert(resBuildIt.dialogues.some(d => d.content.includes("export function CorporatePortal")), "Generates complete interactive component scaffolding");
  console.log("✓ 'Build it' preserved conversation context and moved seamlessly to implementation!");

  // =========================================================================
  // 8. Disabled Minds are Excluded
  // =========================================================================
  console.log("\n[Test 8] Zero/Disabled participation enforced...");
  const zeroEnabledOptions = { enabledPersonas: [], selectedPersonaId: "auto" };
  const decZero = CognitiveRouter.route("How does a rocket engine work?", [], zeroEnabledOptions);
  assert.strictEqual(decZero.owner, "lanzar", "0 enabled minds routes to Core fallback");

  const peteOnlyOptions = { enabledPersonas: [{ id: "pete", shortName: "Pete" }], selectedPersonaId: "auto" };
  const decPeteOnlyTeam = CognitiveRouter.route("Hi guys", [], peteOnlyOptions);
  assert.strictEqual(decPeteOnlyTeam.owner, "pete", "When only Pete enabled, only Pete responds");
  console.log("✓ Enablement boundary strictly respected.");

  console.log("\n>>> ALL PARTICIPANT CARDINALITY & CONTEXT TESTS PASSED 100% GREEN! <<<");
}

runCardinalityAndContextTests().catch(err => {
  console.error("Test Failed:", err);
  process.exit(1);
});
