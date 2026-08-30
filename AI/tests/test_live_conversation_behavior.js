/*
    test_live_conversation_behavior.js

    End-to-end regression scenario verifying natural live conversational behavior:
    1. Greeting behaves naturally across the active team or character.
    2. Utility requests (e.g. "does anyone know the time?") are interpreted as time/utility, not art-direction monologues.
    3. Explicit Penny addressing ("penny tell me a joke") routes cleanly to Penny without canned handoffs.
    4. Explicit Mina addressing ("how about you mina??? can you tell me a joke?") routes directly to Mina without previous speaker announcements or self-introductions.
    5. No character falls back to generic persona monologues ("Does it have love, beauty, and soul?").
*/

import test from "node:test";
import assert from "node:assert/strict";
import { CognitiveRouter } from "../js/models/cognitive-router.js";
import { PersonaManager } from "../js/personas/persona-manager.js";
import { StubModelProvider } from "../js/models/stub-provider.js";

test("Live Conversational Behavior & Speaker Invariants", async (t) => {
  const personaManager = new PersonaManager();
  const stubProvider = new StubModelProvider();
  const history = [];

  // ---------------------------------------------------------------------------
  // Turn 1: "hi everyone" -> Natural Greeting
  // ---------------------------------------------------------------------------
  await t.test("Turn 1: Natural team greeting without boilerplate", async () => {
    const userText = "hi everyone";
    const decision = CognitiveRouter.route(userText, history, { personaManager });
    
    assert(decision.owner === "triad" || decision.owner === "lanzar" || decision.owner === "penny", "Greeting should engage team or active character");
    assert.strictEqual(decision.taskType, "team_addressed");

    const response = await stubProvider.generateResponse(
      [...history, { role: "user", content: userText }],
      { personaManager }
    );

    assert(response.content || (response.dialogues && response.dialogues.length > 0), "Response must exist");
    // Verify no rigid robotic announcement
    const text = response.content || response.dialogues.map(d => d.content).join(" ");
    assert(!text.includes("I am now assuming conversational responsibility"), "Must not use robotic handoff text");
    assert(!text.includes("Tagging in"), "Must not use artificial tagging in announcement");

    history.push({ role: "user", content: userText });
    history.push({ role: "assistant", persona: "triad", authorName: "Penny • Pete • Mina", content: text });
  });

  // ---------------------------------------------------------------------------
  // Turn 2: "does anyone know the time?" -> Utility / Time Query
  // ---------------------------------------------------------------------------
  await t.test("Turn 2: Utility question answered directly without art-direction monologue", async () => {
    const userText = "does anyone know the time?";
    const decision = CognitiveRouter.route(userText, history, { personaManager });
    
    // Router should route to active character or leader
    assert(decision.owner, "Must select an owner");

    const response = await stubProvider.generateResponse(
      [...history, { role: "user", content: userText }],
      { personaManager }
    );

    const content = response.content || "";
    // Verify the response is about time / clock and NOT an art direction monologue
    assert(/\b(\d{1,2}:\d{2}|time|clock)\b/i.test(content), `Expected time/clock in response, got: ${content}`);
    assert(!content.includes("Does it have love, beauty, and soul?"), "Must NOT emit generic Mina art-direction fallback monologue");
    assert(!content.includes("Palette:"), "Must NOT emit unsolicited color palette for time inquiry");

    history.push({ role: "user", content: userText });
    history.push({ role: "assistant", persona: response.persona || decision.owner, authorName: response.authorName || "AI", content });
  });

  // ---------------------------------------------------------------------------
  // Turn 3: "penny tell me a joke" -> Explicit Penny Addressing
  // ---------------------------------------------------------------------------
  await t.test("Turn 3: Explicit Penny addressing routes to Penny directly", async () => {
    const userText = "penny tell me a joke";
    const decision = CognitiveRouter.route(userText, history, { personaManager });

    assert.strictEqual(decision.owner, "penny", "Must route directly to Penny");
    assert.strictEqual(decision.taskType, "addressed_persona");

    const response = await stubProvider.generateResponse(
      [...history, { role: "user", content: userText }],
      { personaManager }
    );

    assert.strictEqual(response.persona, "penny");
    assert.strictEqual(response.authorName, "Penny");
    assert(response.content.toLowerCase().includes("penny") || response.content.toLowerCase().includes("rocket") || response.content.toLowerCase().includes("prototype") || response.content.toLowerCase().includes("why"), "Penny must tell a humorous joke");
    assert(!response.content.includes("Tagging in"), "Penny must not have handoff announcements");

    history.push({ role: "user", content: userText });
    history.push({ role: "assistant", persona: "penny", authorName: "Penny", content: response.content });
  });

  // ---------------------------------------------------------------------------
  // Turn 4: "how about you mina??? can you tell me a joke?" -> Direct Mina Addressing
  // ---------------------------------------------------------------------------
  await t.test("Turn 4: Direct Mina addressing routes to Mina directly without previous speaker handoff announcement", async () => {
    const userText = "how about you mina??? can you tell me a joke?";
    const decision = CognitiveRouter.route(userText, history, { personaManager });

    assert.strictEqual(decision.owner, "mina", "Must route directly to Mina");
    assert.strictEqual(decision.taskType, "addressed_persona");

    const response = await stubProvider.generateResponse(
      [...history, { role: "user", content: userText }],
      { personaManager }
    );

    assert.strictEqual(response.persona, "mina");
    assert.strictEqual(response.authorName, "Mina");
    
    // Invariants:
    // 1. Penny must NOT announce "Tagging in Mina!"
    assert(!response.content.includes("Tagging in Mina!"), "Must not include 'Tagging in Mina!' announcement");
    // 2. Mina must NOT have redundant introduction or focus takeover declaration
    assert(!response.content.includes("I've got direct focus now!"), "Must not announce direct focus takeover");
    // 3. Mina must answer the joke directly
    assert(response.content.toLowerCase().includes("paintbrush") || response.content.toLowerCase().includes("color") || response.content.toLowerCase().includes("lightbulb") || response.content.toLowerCase().includes("joke"), `Mina should tell a joke, got: ${response.content}`);
    // 4. Must NOT fall back to the generic art-direction monologue
    assert(!response.content.includes("Whenever I create something, I always ask"), "Must not fall back to generic monologue");
  });
});
