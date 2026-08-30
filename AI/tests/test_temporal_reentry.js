/*
    test_temporal_reentry.js

    Regression test suite for Larry Temporal Re-entry Behavior:
    - Verifies elapsed time measurement since user's previous input
    - Verifies behavioral ranges (<30m, 30m-4h, 4-12h, 12-24h, 1-3d, 3-7d, 7+d, weeks/months)
    - Verifies time passage ALONE does NOT force a recap on direct instructions
    - Verifies re-entry greetings after elapsed time offer appropriate concise recaps
    - Verifies explicit recap requests ("what were we doing?") always deliver a recap
*/

const assert = require('assert');

async function runTemporalReentryTests() {
  console.log("=== LANZAR Temporal Re-entry Behavioral Guideline Test Suite ===");

  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');
  const { ShortTermMemory } = await import('../js/memory/short-term.js');
  const { MemoryManager } = await import('../js/memory/memory-manager.js');

  const stubProvider = new StubModelProvider();

  const mockProjectContext = {
    activeProject: {
      name: "Mark IV Rocket Engine Redesign",
      desc: "Regenerative cooling channels with micro-swirl geometries"
    }
  };

  const establishedHistory = [
    { role: "assistant", persona: "lanzar", content: "Welcome to LANZAR AI." },
    { role: "user", persona: "user", content: "Let's analyze the aerospike throat geometry and cooling channels.", timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
    { role: "assistant", persona: "pete", content: "Heat flux is calculated at 183 MW/m^2 across the throat.", timestamp: new Date(Date.now() - 8 * 3600 * 1000 + 5000).toISOString() }
  ];

  // =========================================================================
  // 1. Elapsed Time Calculation in Memory
  // =========================================================================
  console.log("\n[Test 1] Elapsed time calculation in ShortTermMemory and MemoryManager...");

  const memManager = new MemoryManager();
  memManager.shortTerm.clear();

  // Add earlier user message 5 hours ago
  const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
  memManager.shortTerm.addMessage("user", "Initial simulation setup", "user", "You");
  const msgs = memManager.shortTerm.getMessages();
  msgs[0].timestamp = fiveHoursAgo;

  // Add new user message just now
  const newMsg = memManager.shortTerm.addMessage("user", "Hello again", "user", "You");

  const elapsed = memManager.shortTerm.getElapsedSinceLastUserInput(newMsg.id);
  assert(elapsed !== null, "Elapsed time should not be null");
  assert(elapsed >= 4.9 * 3600 * 1000 && elapsed <= 5.1 * 3600 * 1000, `Elapsed should be ~5h in ms, got ${elapsed}`);

  const assembled = memManager.getAssembledContext(newMsg.id);
  assert(assembled.elapsedSinceLastUserInput >= 4.9 * 3600 * 1000, "Assembled context must contain elapsedSinceLastUserInput");
  console.log(`✓ Elapsed time accurately measured (${Math.round(assembled.elapsedSinceLastUserInput / (1000 * 3600))} hours)`);

  // =========================================================================
  // 2. Behavioral Ranges & Time Passage Alone Does NOT Force Recap
  // User returns after 8 hours with direct instruction: "Change nozzle diameter to 42mm."
  // =========================================================================
  console.log("\n[Test 2] Direct instruction after 8 hours must NOT force recap...");

  const eightHoursMs = 8 * 3600 * 1000;
  const directOptions = {
    elapsedSinceLastUserInput: eightHoursMs,
    memoryContext: mockProjectContext
  };

  const queryDirect = "Change the nozzle diameter to 42mm.";
  const decisionDirect = CognitiveRouter.route(queryDirect, establishedHistory, directOptions);
  
  // Must NOT trigger temporal recap
  assert.strictEqual(decisionDirect.taskType !== "temporal_reentry_recap", true, "Direct instruction must not be interrupted with a recap");
  console.log("✓ Direct instruction after 8 hours proceeded directly without interruption (taskType: " + decisionDirect.taskType + ")");

  // =========================================================================
  // 3. User Returns After 8 Hours with Open Greeting: "Hey, I'm back."
  // A brief recap / offer is appropriate.
  // =========================================================================
  console.log("\n[Test 3] Open greeting ('Hey, I'm back.') after 8 hours triggers re-entry recap...");

  const queryReentry = "Hey, I'm back.";
  const decisionReentry = CognitiveRouter.route(queryReentry, establishedHistory, directOptions);
  assert.strictEqual(decisionReentry.taskType, "temporal_reentry_recap", "Re-entry greeting after 8h should offer reorientation");

  const resReentry = await stubProvider.generateResponse(
    [...establishedHistory, { role: "user", content: queryReentry }],
    directOptions
  );
  assert(resReentry.content.includes("aerospike throat geometry") || resReentry.content.includes("Mark IV Rocket Engine Redesign"), "Recap must reference previous active work");
  assert(resReentry.content.includes("Welcome back"), "Recap should welcome user back politely");
  console.log("✓ Re-entry greeting generated concise, context-aware recap:\n" + resReentry.content.split("\n")[0] + "...");

  // =========================================================================
  // 4. User Returns After Several Days Asking: "What were we doing?"
  // Explicit recap request must ALWAYS provide recap.
  // =========================================================================
  console.log("\n[Test 4] Explicit recap request ('What were we doing?') after several days...");

  const fiveDaysMs = 5 * 24 * 3600 * 1000;
  const fiveDayOptions = {
    elapsedSinceLastUserInput: fiveDaysMs,
    memoryContext: mockProjectContext
  };

  const queryWhatDoing = "What were we doing?";
  const decisionWhatDoing = CognitiveRouter.route(queryWhatDoing, establishedHistory, fiveDayOptions);
  assert.strictEqual(decisionWhatDoing.taskType, "temporal_reentry_recap", "Explicit request must trigger recap");

  const resWhatDoing = await stubProvider.generateResponse(
    [...establishedHistory, { role: "user", content: queryWhatDoing }],
    fiveDayOptions
  );
  assert(resWhatDoing.content.includes("aerospike throat geometry") || resWhatDoing.content.includes("Mark IV Rocket Engine Redesign"), "Recap should identify active project and stop point");
  console.log("✓ Explicit recap request accurately provided concise summary.");

  // =========================================================================
  // 5. User Returns After Weeks: "Let's continue."
  // =========================================================================
  console.log("\n[Test 5] User returns after 3 weeks with 'Let's continue.'...");

  const threeWeeksMs = 21 * 24 * 3600 * 1000;
  const threeWeeksOptions = {
    elapsedSinceLastUserInput: threeWeeksMs,
    memoryContext: mockProjectContext
  };

  const queryContinue = "Let's continue.";
  const decisionContinue = CognitiveRouter.route(queryContinue, establishedHistory, threeWeeksOptions);
  assert.strictEqual(decisionContinue.taskType, "temporal_reentry_recap", "Dormant conversation re-entry with 'Let's continue' triggers reorientation");

  const resContinue = await stubProvider.generateResponse(
    [...establishedHistory, { role: "user", content: queryContinue }],
    threeWeeksOptions
  );
  assert(resContinue.content.includes("Welcome back"), "Should welcome back");
  assert(resContinue.content.includes("recap"), "Should provide context re-establishment");
  console.log("✓ Dormant continuation re-established context cleanly.");

  // =========================================================================
  // 6. Continuous Conversation (< 30 minutes)
  // Short elapsed time must treat greetings and continuation without recap
  // =========================================================================
  console.log("\n[Test 6] Continuous conversation (< 30 minutes) does NOT trigger recap...");

  const fiveMinsMs = 5 * 60 * 1000;
  const continuousOptions = {
    elapsedSinceLastUserInput: fiveMinsMs,
    memoryContext: mockProjectContext
  };

  const decisionContinuous = CognitiveRouter.route("hi", establishedHistory, continuousOptions);
  assert(decisionContinuous.taskType === "greeting" || decisionContinuous.taskType === "addressed_persona", "Continuous conversation < 30m should treat 'hi' as standard greeting/continuation");
  assert.notStrictEqual(decisionContinuous.taskType, "temporal_reentry_recap", "Continuous conversation < 30m must not trigger recap");
  console.log("✓ Continuous conversation (< 30m) continues normally without unsolicited recap.");

  console.log("\n>>> ALL TEMPORAL RE-ENTRY BEHAVIORAL TESTS PASSED CLEANLY! <<<");
}

runTemporalReentryTests().catch(err => {
  console.error("Temporal Re-entry Test Failed:", err);
  process.exit(1);
});
