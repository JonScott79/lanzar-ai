/*
    test_autonomous_bidding_and_banter.js

    Regression test suite for:
    - Autonomous bidding & claim lead-ins ("I GOT THIS!")
    - Mina's Pokémon lore and aesthetic collectibles expertise
    - Triad full-stack corporate website production deliverable across Mina (UX), Pete (Arch), and Penny (Code)
    - Team greeting check-ins without robotic Core intervention
*/

const assert = require('assert');

async function runBiddingAndBanterTests() {
  console.log("=== LANZAR Autonomous Bidding, Banter & Multi-Mind Studio Tests ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const stubProvider = new StubModelProvider();
  const optionsAll = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    selectedPersonaId: "auto"
  };

  // =========================================================================
  // 1. Mina's Passionate Pokémon Lore & Collectibles Claim
  // =========================================================================
  console.log("\n[Test 1] User asks about Pokémon card collection...");
  const pokemonQuery = "Which holographic Pokémon cards should I put in my binder?";
  const routeDecision1 = CognitiveRouter.route(pokemonQuery, [], optionsAll);
  
  assert.strictEqual(routeDecision1.owner, "mina", "Pokémon lore should be claimed by Mina");
  assert.strictEqual(routeDecision1.taskType, "pokemon_lore");

  const res1 = await stubProvider.generateResponse([{ role: "user", content: pokemonQuery }], optionsAll);
  assert.strictEqual(res1.persona, "mina");
  assert(res1.content.includes("I GOT THIS"), "Mina should enthusiastically claim the query with 'I GOT THIS'");
  assert(res1.content.includes("Holographic Mew"), "Mina should reference vintage holographic Mew & Southern Islands");
  assert(res1.content.includes("Togepi"), "Mina should reference cute companions like Togepi");
  console.log("✓ Mina passionately claimed Pokémon collectibles with expert aesthetic lore!");

  // =========================================================================
  // 2. Full-Stack Corporate Website Deliverable across all 3 Minds
  // =========================================================================
  console.log("\n[Test 2] User asks team to build an entire corporate website...");
  const websiteQuery = "Build a corporate website for our enterprise launch";
  const routeDecision2 = CognitiveRouter.route(websiteQuery, [], optionsAll);
  
  assert.strictEqual(routeDecision2.owner, "triad", "Corporate website should trigger multi-mind Triad synthesis");

  const res2 = await stubProvider.generateResponse([{ role: "user", content: websiteQuery }], optionsAll);
  assert.strictEqual(res2.isMultiTurn, true);
  assert.strictEqual(res2.dialogues.length, 3);
  
  // Dialogue 1: Mina (Design System & CSS variables)
  assert.strictEqual(res2.dialogues[0].persona, "mina");
  assert(res2.dialogues[0].content.includes("--canvas-dark"), "Mina should supply CSS custom properties and design system");
  
  // Dialogue 2: Pete (Systems Architecture & Validation Schema)
  assert.strictEqual(res2.dialogues[1].persona, "pete");
  assert(res2.dialogues[1].content.includes("interface CompanyProfile"), "Pete should supply TypeScript interface & architecture");
  
  // Dialogue 3: Penny (Interactive Component Code)
  assert.strictEqual(res2.dialogues[2].persona, "penny");
  assert(res2.dialogues[2].content.includes("export function CorporatePortal"), "Penny should provide working component scaffolding");
  console.log("✓ Full-stack corporate website synthesized across Mina (CSS/UX), Pete (Architecture), and Penny (Live Scaffolding)!");

  // =========================================================================
  // 3. Team Check-in Greeting Banter
  // =========================================================================
  console.log("\n[Test 3] User asks 'How are we all doing today?'...");
  const teamGreeting = "How are we all doing today?";
  const routeDecision3 = CognitiveRouter.route(teamGreeting, [], optionsAll);
  assert.strictEqual(routeDecision3.owner, "triad", "Team greeting routes to collaborative Triad");

  const res3 = await stubProvider.generateResponse([{ role: "user", content: teamGreeting }], optionsAll);
  assert.strictEqual(res3.dialogues.length, 3);
  assert.strictEqual(res3.dialogues[0].persona, "penny");
  assert.strictEqual(res3.dialogues[1].persona, "pete");
  assert.strictEqual(res3.dialogues[2].persona, "mina");
  assert(res3.dialogues[0].content.length > 10, "Penny chimes in with prototype enthusiasm");
  assert(res3.dialogues[1].content.length > 10, "Pete chimes in with systems status");
  assert(res3.dialogues[2].content.length > 10, "Mina chimes in with creative joy");
  console.log("✓ Team greeting generated lively 3-character banter without Core interruption!");

  console.log("\n>>> ALL AUTONOMOUS BIDDING, BANTER & STUDIO TESTS PASSED CLEANLY! <<<");
}

runBiddingAndBanterTests().catch(err => {
  console.error("Test Failed:", err);
  process.exit(1);
});
