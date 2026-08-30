/*
    test_pipeline_context_and_routing.js

    Regression test suite for the complete Message -> Context -> Router -> Provider -> Response pipeline.

    Verifies:
    1. Each submitted message is routed with the CURRENT submitted context rather than stale state.
    2. Multi-turn dialogue references the latest user query, not historical turns.
    3. Direct persona selection overrides and disabled persona filtering operate accurately on current turns.
    4. Server-Sent Events (SSE) streaming and UTF-8 multi-byte decoding preserve exact token sequences.
    5. Character responses correctly reference current user input across dynamic turns.
*/

const assert = require('assert');

async function runPipelineTests() {
  console.log("=== LANZAR Pipeline Context & Routing Regression Test Suite ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const stubProvider = new StubModelProvider();
  const optionsAllEnabled = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    selectedPersonaId: "auto"
  };

  // =========================================================================
  // 1. Stale-Context Reproduction & Verification:
  // Sequential turns with different user intents must each evaluate current query
  // =========================================================================
  console.log("\n[Test 1] Sequential multi-turn routing with evolving queries...");
  
  const history = [
    { role: "assistant", persona: "lanzar", content: "Welcome to LANZAR AI." }
  ];

  // Turn 1: User asks for a calculation
  const turn1User = "Calculate aerospike throat geometry";
  history.push({ role: "user", persona: "user", content: turn1User });
  
  const decision1 = CognitiveRouter.route(turn1User, history, optionsAllEnabled);
  assert.strictEqual(decision1.owner, "pete", "Turn 1 calculation should route to Pete");
  
  const res1 = await stubProvider.generateResponse(history, optionsAllEnabled);
  assert(res1.content.includes("Calculate aerospike throat geometry"), "Pete should address current Turn 1 calculation");
  history.push({ role: "assistant", persona: res1.persona || res1.perspective, content: res1.content });

  // Turn 2: User says "hi" in conversation with Pete
  const turn2User = "hi";
  history.push({ role: "user", persona: "user", content: turn2User });

  const decision2 = CognitiveRouter.route(turn2User, history, optionsAllEnabled);
  assert.strictEqual(decision2.owner, "pete", "Turn 2 greeting 'hi' continues with Pete, NOT stale math calculation");
  
  const res2 = await stubProvider.generateResponse(history, optionsAllEnabled);
  assert.strictEqual(res2.perspective, "pete", "Response 2 should be Pete's greeting");
  assert(res2.content.includes("Peter here"), "Response 2 should deliver Pete's greeting, NOT stale calculation");
  history.push({ role: "assistant", persona: "pete", content: res2.content });

  // Turn 3: User asks "is mina there?"
  const turn3User = "is mina there?";
  history.push({ role: "user", persona: "user", content: turn3User });

  const decision3 = CognitiveRouter.route(turn3User, history, optionsAllEnabled);
  assert.strictEqual(decision3.owner, "mina", "Turn 3 address to Mina must route to Mina");
  
  const res3 = await stubProvider.generateResponse(history, optionsAllEnabled);
  assert.strictEqual(res3.perspective, "mina", "Response 3 should be from Mina");
  assert(res3.content.includes("Mina here!"), "Response 3 should be Mina's greeting, NOT stale calculation or previous turns");
  history.push({ role: "assistant", persona: "mina", content: res3.content });

  // Turn 4: User asks a follow-up question continuing with Mina
  const turn4User = "can you think yet?";
  history.push({ role: "user", persona: "user", content: turn4User });

  const decision4 = CognitiveRouter.route(turn4User, history, optionsAllEnabled);
  assert.strictEqual(decision4.owner, "mina", "Turn 4 conversational continuation remains with active persona Mina");
  
  const res4 = await stubProvider.generateResponse(history, optionsAllEnabled);
  assert(res4.content.includes("can you think yet?"), "Turn 4 response must address current query 'can you think yet?', NOT historical turns");
  console.log("✓ All 4 turns in sequence routed to the exact persona and referenced the current query without stale bleed!");

  // =========================================================================
  // 2. Direct Persona Perspective Overrides
  // =========================================================================
  console.log("\n[Test 2] Direct persona perspective overrides across turns...");

  const optionsPennyFocused = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    perspectiveMode: "penny"
  };

  const decisionPennyFocus = CognitiveRouter.route("Calculate the derivative of x^2", history, optionsPennyFocused);
  assert.strictEqual(decisionPennyFocus.owner, "penny", "Manual perspectiveMode on Penny must override Pete's math domain");
  console.log("✓ Manual perspectiveMode correctly overrides domain heuristics.");

  // =========================================================================
  // 3. Disabled Persona Handling
  // =========================================================================
  console.log("\n[Test 3] Disabled persona routing and transparent fallback notice...");

  const optionsMinaDisabled = {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }],
    selectedPersonaId: "auto",
    personaManager: {
      isPersonaEnabled: (id) => id !== "mina",
      getAllPersonas: () => [{ id: "penny", shortName: "Penny" }, { id: "pete", shortName: "Pete" }, { id: "mina", shortName: "Mina" }],
      getSelectedPersonaId: () => "auto"
    }
  };

  const decisionMinaDisabled = CognitiveRouter.route("Design a retro Atomic Age poster logo", history, optionsMinaDisabled);
  assert.strictEqual(decisionMinaDisabled.owner, "lanzar");
  assert.strictEqual(decisionMinaDisabled.taskType, "art_direction_disabled");
  assert.strictEqual(decisionMinaDisabled.disabledPersona, "mina");
  
  const resDisabled = await stubProvider.generateResponse([
    { role: "user", content: "Design a retro Atomic Age poster logo" }
  ], optionsMinaDisabled);
  assert(resDisabled.content.includes("Mina") && resDisabled.content.includes("OFF"), "Fallback notice must state Mina is toggled OFF");
  console.log("✓ Disabled persona gracefully intercepted with transparent core notice.");

  // =========================================================================
  // 4. Server-Sent Events (SSE) UTF-8 & Token Stream Decoding
  // =========================================================================
  console.log("\n[Test 4] SSE UTF-8 multi-byte token decoding...");

  const testTokens = ["🚀 ", "LANZAR", "-001", " ", "Engine", " ", "Online", " ⚛️"];
  const decoder = new TextDecoder();
  let streamAccumulator = "";
  let sseBuffer = "";

  const onTokenMock = (accumulated) => {
    streamAccumulator = accumulated;
  };

  // Simulate chunked SSE response stream
  for (const tok of testTokens) {
    const sseChunk = `data: ${JSON.stringify({
      id: "test-chunk",
      object: "chat.completion.chunk",
      choices: [{ delta: { content: tok } }]
    })}\n\n`;

    // Process chunk through stream decoder
    const rawBytes = Buffer.from(sseChunk, "utf-8");
    sseBuffer += decoder.decode(rawBytes, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.substring(6).trim();
      if (dataStr === "[DONE]") break;
      const parsed = JSON.parse(dataStr);
      const deltaContent = parsed.choices?.[0]?.delta?.content;
      if (deltaContent) {
        onTokenMock(streamAccumulator + deltaContent);
      }
    }
  }

  assert.strictEqual(streamAccumulator, "🚀 LANZAR-001 Engine Online ⚛️");
  console.log("✓ SSE token stream parsed and decoded UTF-8 multi-byte emojis and text flawlessly:", streamAccumulator);

  console.log("\n>>> ALL PIPELINE CONTEXT & ROUTING REGRESSION TESTS PASSED CLEANLY! <<<");
}

runPipelineTests().catch(err => {
  console.error("Pipeline Test Failed:", err);
  process.exit(1);
});
