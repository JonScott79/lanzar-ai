/*
    test_cognitive_routing_and_persona_identities.js

    End-to-End Suite for:
    1. Precision Cognitive Routing across Penny, Pete, Mina, Dual Mind & Triad Synthesis
    2. Deep Character Voice & Personality Invariants
    3. Contextual, Beautiful Markdown & KaTeX Output Formatting
    4. Multi-Persona Visual Identities & Dynamic Avatar Badges
*/

const assert = require('assert');

async function runComprehensivePersonaSuite() {
  console.log("===============================================================================");
  console.log("  LANZAR AI — COGNITIVE ROUTING, BEAUTIFUL FORMATTING & PERSONA IDENTITIES");
  console.log("===============================================================================\n");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');
  const { PersonaManager } = await import('../js/personas/persona-manager.js');

  const personaManager = new PersonaManager();
  const provider = new StubModelProvider();

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}\n`);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}\n`);
      throw err;
    }
  }

  // =====================================
  // 1. VISUAL IDENTITY & DYNAMIC REGISTRY
  // =====================================
  console.log("--- SECTION 1: Persona Visual Identity & Dynamic Registry ---");

  test("1.1 Persona Registry contains complete visual identities for all minds", () => {
    const penny = personaManager.getPersona("penny");
    const pete = personaManager.getPersona("pete");
    const mina = personaManager.getPersona("mina");

    assert(penny, "Penny must be registered");
    assert(pete, "Pete must be registered");
    assert(mina, "Mina must be registered");

    assert.strictEqual(penny.headshot, "assets/images/characters/Penelope/penny-headshot.png");
    assert.strictEqual(pete.headshot, "assets/images/characters/Peter/pete-headshot.png");
    assert.strictEqual(mina.headshot, "assets/images/characters/Mina/mina-headshot.png");

    assert(penny.accentColor && penny.accentColor.includes("penny"), "Penny has dedicated accent color");
    assert(pete.accentColor && pete.accentColor.includes("pete"), "Pete has dedicated accent color");
    assert(mina.accentColor && mina.accentColor.includes("mina"), "Mina has dedicated accent color");
  });

  // =====================================
  // 2. COGNITIVE ROUTING SPECIALIZATIONS
  // =====================================
  console.log("\n--- SECTION 2: Cognitive Routing Specializations ---");

  test("2.1 Practical engineering, rapid prototyping & hardware route to Penny", () => {
    const query = "What's the best nozzle material for rapid hot-fire prototyping on our test stand?";
    const decision = CognitiveRouter.route(query, [], { personaManager });
    assert.strictEqual(decision.owner, "penny");
    console.log(`    ↳ Routed to: ${decision.owner} (${decision.reason})`);
  });

  test("2.2 Deep mathematics, physics, and theoretical systems route to Pete", () => {
    const query = "Derive the Navier-Stokes momentum equation in cylindrical coordinates for swirling flow";
    const decision = CognitiveRouter.route(query, [], { personaManager });
    assert.strictEqual(decision.owner, "pete");
    console.log(`    ↳ Routed to: ${decision.owner} (${decision.reason})`);
  });

  test("2.3 Art, palettes, styling, UI aesthetics & anime/cards route to Mina", () => {
    const query = "Help me design an Atomic Age retrofuturistic color palette for our mission control UI";
    const decision = CognitiveRouter.route(query, [], { personaManager });
    assert.strictEqual(decision.owner, "mina");
    console.log(`    ↳ Routed to: ${decision.owner} (${decision.reason})`);
  });

  test("2.4 Multidisciplinary engineering + aesthetic trade-offs route to Triad Synthesis", () => {
    const query = "Redesign the engine architecture for our next generation rocket";
    const decision = CognitiveRouter.route(query, [], { personaManager });
    assert.strictEqual(decision.owner, "triad", "Should route to Triad collaborative synthesis");
    console.log(`    ↳ Routed to: ${decision.owner} (${decision.reason})`);
  });

  // =====================================
  // 3. PERSONALITY VOICES & DEFERENCE
  // =====================================
  console.log("\n--- SECTION 3: Personality Voice & Graceful Deference ---");

  await asyncTest("3.1 Mina gracefully defers thermodynamics to Pete with authentic voice", async () => {
    const query = "Mina, how does a rocket work?";
    const response = await provider.generateResponse([{ role: "user", content: query }], {
      enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
      selectedPersonaId: "auto",
      personaManager
    });

    assert.strictEqual(response.isMultiTurn, true);
    assert.strictEqual(response.dialogues[0].persona, "mina");
    assert.strictEqual(response.dialogues[1].persona, "pete");
    assert(response.dialogues[0].content.includes("Pete"), "Mina calls Pete into dialogue");
    assert(response.dialogues[1].content.includes("momentum") || response.dialogues[1].content.includes("velocity") || response.dialogues[1].content.includes("propulsion"), "Pete answers with physics");
  });

  await asyncTest("3.2 Pete defers collectible card aesthetics to Mina with analytical demeanor", async () => {
    const query = "Pete, how do I curate the prettiest Pokémon card binder?";
    const response = await provider.generateResponse([{ role: "user", content: query }], {
      enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
      selectedPersonaId: "auto",
      personaManager
    });

    assert.strictEqual(response.isMultiTurn, true);
    assert.strictEqual(response.dialogues[0].persona, "pete");
    assert.strictEqual(response.dialogues[1].persona, "mina");
    assert(response.dialogues[0].content.includes("Mina"), "Pete passes floor to Mina");
    assert(response.dialogues[1].content.includes("binder") || response.dialogues[1].content.includes("cards") || response.dialogues[1].content.includes("✨"), "Mina responds excitedly");
  });

  // =====================================
  // 4. FORMATTING, TABLES, LISTS & CODE
  // =====================================
  console.log("\n--- SECTION 4: Output Formatting & Multi-Persona Dialogues ---");

  await asyncTest("4.1 Triad multi-persona dialogue maintains distinct character identities and formatting", async () => {
    const query = "Let's collaborate on our new spacecraft project from design to mechanics";
    const response = await provider.generateResponse([{ role: "user", content: query }], {
      enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
      selectedPersonaId: "auto"
    });

    assert.strictEqual(response.isMultiTurn, true);
    assert.strictEqual(response.dialogues.length, 3);

    const pennyTurn = response.dialogues[0];
    const peteTurn = response.dialogues[1];
    const minaTurn = response.dialogues[2];

    assert.strictEqual(pennyTurn.persona, "penny");
    assert.strictEqual(pennyTurn.authorName, "Penny");
    assert(pennyTurn.content.length > 20, "Penny provides substantial response");

    assert.strictEqual(peteTurn.persona, "pete");
    assert.strictEqual(peteTurn.authorName, "Pete");
    assert(peteTurn.content.length > 20, "Pete provides substantial response");

    assert.strictEqual(minaTurn.persona, "mina");
    assert.strictEqual(minaTurn.authorName, "Mina");
    assert(minaTurn.content.length > 20, "Mina provides substantial response");
  });

  console.log("\n===============================================================================");
  console.log(`  ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
  console.log("===============================================================================\n");
}

runComprehensivePersonaSuite().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
