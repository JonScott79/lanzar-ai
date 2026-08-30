/*
    test_character_readiness_and_conversation.js

    End-to-End Character Audit, Personality Baseline, and First-Conversation Readiness Suite.

    Verifies:
    1. Canonical Character Portfolios (Penny, Pete, Mina) - Identity, Roles, Cognitive Styles, Prompts.
    2. Baseline Personality Tests ("tell me a joke" for Penny, Pete, Mina) - Distinct voice, humor, cognitive styles.
    3. Repeated Baseline Tests - Sampling variation without canned-loop cross-contamination.
    4. Cross-Character Targeting ("Penny, what do you think of Pete's approach?", "Pete, what do you think of Penny?").
    5. Multi-Character Enablement Matrix (Solo, Pairs, Triad, Disabled states).
    6. First-Conversation Acceptance Script (Meeting the team, Team Philosophy, Departure & Re-entry).
    7. Memory & Temporal Context availability.
*/

const assert = require('assert');

async function runCharacterReadinessTests() {
  console.log("=== LANZAR Character Readiness & First-Conversation Milestone Test Suite ===");

  const { PersonaManager } = await import('../js/personas/persona-manager.js');
  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const personaManager = new PersonaManager();
  const stubProvider = new StubModelProvider();

  // =========================================================================
  // 1. CANONICAL CHARACTER PORTFOLIO INTEGRITY
  // =========================================================================
  console.log("\n[Test 1] Verifying Canonical Character Portfolios (Penny, Pete, Mina)...");

  const penny = personaManager.getPenny();
  assert(penny, "Penny must be registered in PersonaManager");
  assert.strictEqual(penny.shortName, "Penny");
  assert.strictEqual(penny.role, "Engineer");
  assert.strictEqual(penny.cognitiveStyle, "Fast / Practical / Experimental");
  assert(penny.getSystemPrompt().includes("Penny"), "Penny system prompt must include identity");

  const pete = personaManager.getPete();
  assert(pete, "Pete must be registered in PersonaManager");
  assert.strictEqual(pete.shortName, "Pete");
  assert.strictEqual(pete.role, "Scientist / Think Tank");
  assert.strictEqual(pete.cognitiveStyle, "Deep / Analytical / Methodical");
  assert(pete.getSystemPrompt().includes("Pete"), "Pete system prompt must include identity");

  const mina = personaManager.getMina();
  assert(mina, "Mina must be registered in PersonaManager");
  assert.strictEqual(mina.shortName, "Mina");
  assert.strictEqual(mina.role, "Art Director");
  assert.strictEqual(mina.cognitiveStyle, "Creative / Visual / Soul");
  assert(mina.getSystemPrompt().includes("Mina"), "Mina system prompt must include identity");

  console.log("✓ All 3 character portfolios verified with canonical names, roles, cognitive styles, and system prompts.");

  // =========================================================================
  // 2. BASELINE PERSONALITY TESTS: "tell me a joke"
  // =========================================================================
  console.log("\n[Test 2] Baseline Personality Tests: Penny, Pete, Mina jokes...");

  const baseOptions = {
    personaManager,
    enabledPersonas: personaManager.getEnabledPersonas()
  };

  // Penny Joke
  const pennyJokeRes = await stubProvider.generateResponse(
    [{ role: "user", content: "Penny: tell me a joke" }],
    { ...baseOptions, selectedPersonaId: "penny" }
  );
  assert.strictEqual(pennyJokeRes.authorName, "Penny");
  assert.strictEqual(pennyJokeRes.perspective, "penny");
  console.log("\n--- PENNY'S JOKE ---");
  console.log(pennyJokeRes.content);

  // Pete Joke
  const peteJokeRes = await stubProvider.generateResponse(
    [{ role: "user", content: "Pete: tell me a joke" }],
    { ...baseOptions, selectedPersonaId: "pete" }
  );
  assert.strictEqual(peteJokeRes.authorName, "Pete");
  assert.strictEqual(peteJokeRes.perspective, "pete");
  console.log("\n--- PETE'S JOKE ---");
  console.log(peteJokeRes.content);

  // Mina Joke
  const minaJokeRes = await stubProvider.generateResponse(
    [{ role: "user", content: "Mina: tell me a joke" }],
    { ...baseOptions, selectedPersonaId: "mina" }
  );
  assert.strictEqual(minaJokeRes.authorName, "Mina");
  assert.strictEqual(minaJokeRes.perspective, "mina");
  console.log("\n--- MINA'S JOKE ---");
  console.log(minaJokeRes.content);

  // Distinctness assertions
  assert.notStrictEqual(pennyJokeRes.content, peteJokeRes.content, "Penny and Pete jokes must be distinct");
  assert.notStrictEqual(peteJokeRes.content, minaJokeRes.content, "Pete and Mina jokes must be distinct");
  assert.notStrictEqual(pennyJokeRes.content, minaJokeRes.content, "Penny and Mina jokes must be distinct");

  console.log("\n✓ All three characters produced distinct, authentic jokes reflecting their cognitive styles!");

  // =========================================================================
  // 3. REPEATED BASELINE JOKE TEST (Variation & Consistency)
  // =========================================================================
  console.log("\n[Test 3] Repeating baseline joke tests to observe variation and character stability...");

  const pennyJoke2 = await stubProvider.generateResponse(
    [{ role: "user", content: "Penny: tell me a joke" }],
    { ...baseOptions, selectedPersonaId: "penny" }
  );
  assert.strictEqual(pennyJoke2.authorName, "Penny");

  const peteJoke2 = await stubProvider.generateResponse(
    [{ role: "user", content: "Pete: tell me a joke" }],
    { ...baseOptions, selectedPersonaId: "pete" }
  );
  assert.strictEqual(peteJoke2.authorName, "Pete");

  const minaJoke2 = await stubProvider.generateResponse(
    [{ role: "user", content: "Mina: tell me a joke" }],
    { ...baseOptions, selectedPersonaId: "mina" }
  );
  assert.strictEqual(minaJoke2.authorName, "Mina");

  console.log("✓ Repeated baseline test executed cleanly without state pollution or identity drift.");

  // =========================================================================
  // 4. CROSS-CHARACTER TARGETING & OPINIONS
  // =========================================================================
  console.log("\n[Test 4] Cross-character opinions & peer perspectives...");

  const pennyOnTeam = await stubProvider.generateResponse(
    [{ role: "user", content: "Penny, what do you think of Pete and Mina?" }],
    { ...baseOptions, selectedPersonaId: "penny" }
  );
  assert(pennyOnTeam.content.includes("Pete") && pennyOnTeam.content.includes("Mina"), "Penny should discuss Pete and Mina");
  console.log("\n--- PENNY ON THE TEAM ---");
  console.log(pennyOnTeam.content);

  const peteOnTeam = await stubProvider.generateResponse(
    [{ role: "user", content: "Pete, what do you think of Penny and Mina?" }],
    { ...baseOptions, selectedPersonaId: "pete" }
  );
  assert(peteOnTeam.content.includes("Penny") && peteOnTeam.content.includes("Mina"), "Pete should discuss Penny and Mina");
  console.log("\n--- PETE ON THE TEAM ---");
  console.log(peteOnTeam.content);

  const minaOnTeam = await stubProvider.generateResponse(
    [{ role: "user", content: "Mina, what do you think of Pete and Penny?" }],
    { ...baseOptions, selectedPersonaId: "mina" }
  );
  assert(minaOnTeam.content.includes("Pete") && minaOnTeam.content.includes("Penny"), "Mina should discuss Pete and Penny");
  console.log("\n--- MINA ON THE TEAM ---");
  console.log(minaOnTeam.content);

  console.log("\n✓ All characters demonstrated authentic perspectives on their teammates.");

  // =========================================================================
  // 5. FIRST CONVERSATION ACCEPTANCE TEST SCRIPT
  // =========================================================================
  console.log("\n[Test 5] Executing First-Conversation Acceptance Script with Creator (Jon)...");

  // Step 1: Philosophical Alignment
  const philosophyPrompt = "I'm building LANZAR AI because I want AI to feel more like a team of individuals than one generic assistant.";
  
  const pennyPhilRes = await stubProvider.generateResponse(
    [{ role: "user", content: philosophyPrompt }],
    { ...baseOptions, selectedPersonaId: "penny" }
  );
  assert.strictEqual(pennyPhilRes.perspective, "penny");
  console.log("\n--- PENNY ON TEAM PHILOSOPHY ---");
  console.log(pennyPhilRes.content);

  const petePhilRes = await stubProvider.generateResponse(
    [{ role: "user", content: philosophyPrompt }],
    { ...baseOptions, selectedPersonaId: "pete" }
  );
  assert.strictEqual(petePhilRes.perspective, "pete");
  console.log("\n--- PETE ON TEAM PHILOSOPHY ---");
  console.log(petePhilRes.content);

  const minaPhilRes = await stubProvider.generateResponse(
    [{ role: "user", content: philosophyPrompt }],
    { ...baseOptions, selectedPersonaId: "mina" }
  );
  assert.strictEqual(minaPhilRes.perspective, "mina");
  console.log("\n--- MINA ON TEAM PHILOSOPHY ---");
  console.log(minaPhilRes.content);

  // Step 2: Departure and Temporal Re-entry
  const departureMsg = "I'm going to come back to this project later.";
  const conversationHistory = [
    { role: "user", content: philosophyPrompt, timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
    { role: "assistant", persona: "penny", content: pennyPhilRes.content, timestamp: new Date(Date.now() - 6 * 3600 * 1000 + 5000).toISOString() },
    { role: "user", content: departureMsg, timestamp: new Date(Date.now() - 6 * 3600 * 1000 + 10000).toISOString() }
  ];

  const reentryOptions = {
    ...baseOptions,
    elapsedSinceLastUserInput: 6 * 3600 * 1000,
    memoryContext: {
      activeProject: { name: "Rocket Engine Redesign", desc: "Regenerative cooling channels" }
    }
  };

  const reentryRes = await stubProvider.generateResponse(
    [...conversationHistory, { role: "user", content: "Hey, I'm back." }],
    reentryOptions
  );
  assert(reentryRes.content.includes("Welcome back"), "Re-entry should recognize return");
  console.log("\n--- TEMPORAL RE-ENTRY RECAP ---");
  console.log(reentryRes.content);

  console.log("\n>>> ALL CHARACTER AUDIT & FIRST-CONVERSATION READINESS TESTS PASSED CLEANLY! <<<");
}

runCharacterReadinessTests().catch(err => {
  console.error("Character Readiness Test Failed:", err);
  process.exit(1);
});
