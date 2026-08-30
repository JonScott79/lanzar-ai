/*
    test_core_silence_and_greeting_routing.js

    Regression test suite enforcing:
    1. New conversation initialization starts with ZERO Core conversational messages (silence).
    2. Conversational greetings ("Hi", "Hello", "Hi guys", "Hey Team!", "What's up", "How are you?")
       route exclusively to active character(s) or team, NEVER Core.
    3. Core is infrastructure, NOT a conversational persona.
    4. Core only outputs for genuine system events (disabled persona notice, all disabled fallback, safety protocol, error states).
*/

const assert = require('assert');

async function runCoreSilenceTests() {
  console.log("=== LANZAR Core Silence & Conversational Greeting Routing Tests ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const stubProvider = new StubModelProvider();
  const allEnabledOptions = {
    enabledPersonas: [{ id: "penny", shortName: "Penny" }, { id: "pete", shortName: "Pete" }, { id: "mina", shortName: "Mina" }],
    selectedPersonaId: "auto"
  };

  // =========================================================================
  // 1. New Conversation Produces Zero Core Messages
  // =========================================================================
  console.log("\n[Test 1] Verifying new conversation starts empty (zero Core conversational messages)...");
  // Server-side create thread with no initial messages
  const { conversationStore } = require('../server/conversation-store.js');
  const newThread = conversationStore.create("test_user_core_silence", { title: "Fresh Blank Thread" });
  assert.strictEqual(newThread.messages.length, 0, "New thread must start with zero initial messages");
  console.log("✓ New thread verified completely silent on initialization (0 messages).");

  // =========================================================================
  // 2. "Hi guys" routes to Active Team / Character, NOT Core
  // =========================================================================
  console.log("\n[Test 2] User says 'Hi guys'...");
  const decHiGuys = CognitiveRouter.route("Hi guys", [], allEnabledOptions);
  assert.notStrictEqual(decHiGuys.owner, "lanzar", "'Hi guys' must NOT route to LANZAR Core");
  assert.strictEqual(decHiGuys.owner, "triad", "'Hi guys' routes to the Triad team");

  const resHiGuys = await stubProvider.generateResponse([{ role: "user", content: "Hi guys" }], allEnabledOptions);
  assert.notStrictEqual(resHiGuys.persona, "lanzar", "'Hi guys' response persona must not be lanzar");
  assert.strictEqual(resHiGuys.dialogues.length, 3, "Triad team responds to 'Hi guys'");
  console.log("✓ 'Hi guys' routed to Triad team (Penny, Pete, Mina) with zero Core involvement!");

  // =========================================================================
  // 3. "Hi" and "Hello" route to Active Team / Character, NOT Core
  // =========================================================================
  console.log("\n[Test 3] User says 'Hi' and 'Hello'...");
  const decHi = CognitiveRouter.route("Hi", [], allEnabledOptions);
  assert.notStrictEqual(decHi.owner, "lanzar", "'Hi' must NOT route to Core");
  
  const resHi = await stubProvider.generateResponse([{ role: "user", content: "Hi" }], allEnabledOptions);
  assert.notStrictEqual(resHi.persona, "lanzar", "'Hi' response must be from character/team");
  console.log("✓ 'Hi' answered by character/team!");

  const decHello = CognitiveRouter.route("Hello", [], allEnabledOptions);
  assert.notStrictEqual(decHello.owner, "lanzar", "'Hello' must NOT route to Core");
  console.log("✓ 'Hello' answered by character/team!");

  // =========================================================================
  // 4. "What's up?" and "How are you?" route to Active Team / Character
  // =========================================================================
  console.log("\n[Test 4] User says 'What's up?' and 'How are you?'...");
  const decWhatsUp = CognitiveRouter.route("What's up?", [], allEnabledOptions);
  assert.notStrictEqual(decWhatsUp.owner, "lanzar", "'What\\'s up?' must NOT route to Core");

  const decHowAreYou = CognitiveRouter.route("How are you?", [], allEnabledOptions);
  assert.notStrictEqual(decHowAreYou.owner, "lanzar", "'How are you?' must NOT route to Core");
  console.log("✓ Casual greetings route cleanly to characters!");

  // =========================================================================
  // 5. Single Active Mind Greeting (When only Pete is enabled)
  // =========================================================================
  console.log("\n[Test 5] User says 'Hi' when ONLY Pete is enabled...");
  const peteOnlyOptions = {
    enabledPersonas: [{ id: "pete", shortName: "Pete" }],
    selectedPersonaId: "auto"
  };
  const decPeteOnly = CognitiveRouter.route("Hi", [], peteOnlyOptions);
  assert.strictEqual(decPeteOnly.owner, "pete", "Single active mind Pete answers greeting directly");
  console.log("✓ Single active mind Pete greeted user directly without Core!");

  // =========================================================================
  // 6. Legitimate Core Notifications (Disabled Persona Notice / All Disabled Fallback)
  // =========================================================================
  console.log("\n[Test 6] Verifying Core STILL operates for genuine system notifications...");
  const allDisabledOptions = {
    enabledPersonas: [],
    selectedPersonaId: "auto"
  };
  const decAllDisabled = CognitiveRouter.route("Calculate nozzle ratio", [], allDisabledOptions);
  assert.strictEqual(decAllDisabled.owner, "lanzar", "When all minds disabled, Core provides fallback");
  
  const resAllDisabled = await stubProvider.generateResponse([{ role: "user", content: "Calculate nozzle ratio" }], allDisabledOptions);
  assert.strictEqual(resAllDisabled.persona, "lanzar");
  assert(resAllDisabled.content.includes("All specialized personalities"), "Core announces disabled state");
  console.log("✓ Core correctly reserved for infrastructure & system states!");

  console.log("\n>>> ALL CORE SILENCE & GREETING ROUTING TESTS PASSED CLEANLY! <<<");
}

runCoreSilenceTests().catch(err => {
  console.error("Test Failed:", err);
  process.exit(1);
});
