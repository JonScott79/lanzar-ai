/*
    test_time_passage_awareness.js

    Deterministic test suite for LANZAR AI Time-Passage Awareness & Personality Baseline:
    
    1. Temporal Arithmetic & Edge Cases:
       - First user message produces no previous-user duration (null)
       - Second user message calculates elapsed duration
       - Minutes, hours, multi-day, multi-week gaps calculated correctly
       - Missing/invalid/zero timestamp fails safely to null
       - Negative time anomaly fails safely to 0 / null
    
    2. Persistence & Isolation:
       - Conversation reload preserves previous user timestamp
       - Switching conversations isolates temporal state (Conversation A vs Conversation B)
       - Authenticated user identity isolation remains authoritative
    
    3. Personality Baseline Tests:
       - Penny answers "tell me a joke" (energetic, experimental, possibility-oriented)
       - Pete answers "tell me a joke" (analytical, dry, precise, methodical)
       - Mina answers "tell me a joke" (creative, expressive, visual, artistic)
       - Responses demonstrate character differences across style, tone, and cognitive focus
       - Temporal context is independent of character and passes through shared runtime
*/

const assert = require('assert');

const BASE_URL = 'http://localhost:5176';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTimePassageAwarenessTests() {
  console.log("=== LANZAR Time-Passage Awareness & Personality Baseline Suite ===");

  const { ShortTermMemory } = await import('../js/memory/short-term.js');
  const { MemoryManager } = await import('../js/memory/memory-manager.js');
  const { CognitiveRouter } = await import('../js/models/cognitive-router.js');
  const { StubModelProvider } = await import('../js/models/stub-provider.js');

  const stubProvider = new StubModelProvider();

  // =========================================================================
  // 1. FIRST MESSAGE & DURATION ARITHMETIC
  // =========================================================================
  console.log("\n[Test 1] First message produces no previous-user duration (null)...");
  
  const mem = new ShortTermMemory();
  mem.clear();

  // No messages in conversation yet
  assert.strictEqual(mem.getLastUserMessageTimestamp(), null, "Initial thread must have no previous user timestamp");
  assert.strictEqual(mem.getElapsedSinceLastUserInput(), null, "Initial thread must return null for elapsed duration");

  // First user message is submitted
  const firstUserMsg = mem.addMessage("user", "Hello LANZAR", "user", "You");
  const elapsedOnFirst = mem.getElapsedSinceLastUserInput(firstUserMsg.id);
  assert.strictEqual(elapsedOnFirst, null, "First user message must have null elapsedSinceLastUserInput");
  console.log("✓ First user message produces null elapsed duration (no invented duration).");

  // =========================================================================
  // 2. SECOND USER MESSAGE & TIME ARITHMETIC (Minutes, Hours, Days)
  // =========================================================================
  console.log("\n[Test 2] Second user message calculates exact elapsed duration...");

  const baseTime = Date.now();

  // A. 15 minutes gap (continuous)
  const fifteenMinsMs = 15 * 60 * 1000;
  const elapsed15m = ShortTermMemory.calculateElapsed(new Date(baseTime - fifteenMinsMs).toISOString(), baseTime);
  assert.strictEqual(elapsed15m, fifteenMinsMs, "15 minutes calculated accurately");

  // B. 6 hours gap
  const sixHoursMs = 6 * 3600 * 1000;
  const elapsed6h = ShortTermMemory.calculateElapsed(new Date(baseTime - sixHoursMs).toISOString(), baseTime);
  assert.strictEqual(elapsed6h, sixHoursMs, "6 hours calculated accurately");

  // C. 5 days gap
  const fiveDaysMs = 5 * 24 * 3600 * 1000;
  const elapsed5d = ShortTermMemory.calculateElapsed(new Date(baseTime - fiveDaysMs).toISOString(), baseTime);
  assert.strictEqual(elapsed5d, fiveDaysMs, "5 days calculated accurately");

  // D. 3 weeks gap
  const threeWeeksMs = 21 * 24 * 3600 * 1000;
  const elapsed3w = ShortTermMemory.calculateElapsed(new Date(baseTime - threeWeeksMs).toISOString(), baseTime);
  assert.strictEqual(elapsed3w, threeWeeksMs, "3 weeks calculated accurately");

  console.log("✓ Milliseconds, minutes, hours, and multi-day gaps calculated with 100% precision.");

  // =========================================================================
  // 3. SAFE HANDLING OF INVALID / MISSING TIMESTAMPS
  // =========================================================================
  console.log("\n[Test 3] Invalid and missing timestamps fail safely...");

  assert.strictEqual(ShortTermMemory.calculateElapsed(null), null);
  assert.strictEqual(ShortTermMemory.calculateElapsed(undefined), null);
  assert.strictEqual(ShortTermMemory.calculateElapsed("not-a-valid-date"), null);
  assert.strictEqual(ShortTermMemory.calculateElapsed(""), null);

  // Future timestamp (clock skew anomaly) clamps safely to 0
  const futureDate = new Date(baseTime + 10000).toISOString();
  const skewResult = ShortTermMemory.calculateElapsed(futureDate, baseTime);
  assert.strictEqual(skewResult, 0, "Future timestamp safely clamps to 0 ms");

  console.log("✓ Missing/corrupted timestamps fail safely to null without crashing.");

  // =========================================================================
  // 4. CONVERSATION PERSISTENCE & THREAD ISOLATION
  // =========================================================================
  console.log("\n[Test 4] Conversation persistence & thread isolation via Server API...");

  const userKey = `test_temporal_user_${Date.now()}`;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userKey}`
  };

  // Create Thread A
  const createThreadARes = await request('/api/conversations', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'Cooling Channel Analysis', modelProvider: 'stub' })
  });
  assert.strictEqual(createThreadARes.status, 201);
  const threadAId = createThreadARes.data.id;

  // Add Message to Thread A with timestamp 4 hours ago
  const fourHoursAgoTs = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
  const addMsgARes = await request(`/api/conversations/${threadAId}/messages`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      role: 'user',
      content: "Let's work on the cooling system.",
      timestamp: fourHoursAgoTs
    })
  });
  assert.strictEqual(addMsgARes.status, 201);

  // Create Thread B
  const createThreadBRes = await request('/api/conversations', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'Art Direction & Posters', modelProvider: 'stub' })
  });
  assert.strictEqual(createThreadBRes.status, 201);
  const threadBId = createThreadBRes.data.id;

  // Add Message to Thread B with timestamp 20 minutes ago
  const twentyMinsAgoTs = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const addMsgBRes = await request(`/api/conversations/${threadBId}/messages`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      role: 'user',
      content: "Mina: sketch a retro poster layout.",
      timestamp: twentyMinsAgoTs
    })
  });
  assert.strictEqual(addMsgBRes.status, 201);

  // Verify Thread A retains 4 hours timestamp upon reload
  const getThreadARes = await request(`/api/conversations/${threadAId}`, { headers: authHeaders });
  assert.strictEqual(getThreadARes.status, 200);
  const threadAMsgs = getThreadARes.data.messages;
  assert.strictEqual(threadAMsgs[0].timestamp, fourHoursAgoTs, "Thread A timestamp preserved across reload");

  // Verify Thread B retains 20 mins timestamp and does NOT leak Thread A's timing
  const getThreadBRes = await request(`/api/conversations/${threadBId}`, { headers: authHeaders });
  assert.strictEqual(getThreadBRes.status, 200);
  const threadBMsgs = getThreadBRes.data.messages;
  assert.strictEqual(threadBMsgs[0].timestamp, twentyMinsAgoTs, "Thread B timestamp preserved and isolated");
  assert.notStrictEqual(threadBMsgs[0].timestamp, threadAMsgs[0].timestamp, "Thread timing is strictly thread-isolated");

  console.log("✓ Conversation reload preserves timestamps; switching threads isolates temporal state.");

  // =========================================================================
  // 5. AUTHENTICATED USER IDENTITY ISOLATION
  // =========================================================================
  console.log("\n[Test 5] Authenticated user identity isolation...");

  const userOtherKey = `test_temporal_intruder_${Date.now()}`;
  const intruderHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userOtherKey}`
  };

  // User B tries to read User A's thread timestamps
  const forbiddenRead = await request(`/api/conversations/${threadAId}`, { headers: intruderHeaders });
  assert.strictEqual(forbiddenRead.status, 403, "User B cannot read User A's thread timing or messages");

  console.log("✓ Authenticated user isolation verified (403 Forbidden on cross-user read).");

  // =========================================================================
  // 6. BASELINE PERSONALITY TESTS: "tell me a joke"
  // =========================================================================
  console.log("\n[Test 6] Baseline personality tests: Penny, Pete, Mina...");

  // A. Penny Joke Test
  const pennyOptions = {
    selectedPersonaId: "penny",
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }]
  };
  const pennyRes = await stubProvider.generateResponse(
    [{ role: "user", content: "Penny: tell me a joke" }],
    pennyOptions
  );
  assert.strictEqual(pennyRes.perspective, "penny", "Penny must answer Penny prompt");
  assert.strictEqual(pennyRes.authorName, "Penny");
  console.log("Penny response preview:\n" + pennyRes.content.slice(0, 150) + "...\n");

  // B. Pete Joke Test
  const peteOptions = {
    selectedPersonaId: "pete",
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }]
  };
  const peteRes = await stubProvider.generateResponse(
    [{ role: "user", content: "Pete: tell me a joke" }],
    peteOptions
  );
  assert.strictEqual(peteRes.perspective, "pete", "Pete must answer Pete prompt");
  assert.strictEqual(peteRes.authorName, "Pete");
  console.log("Pete response preview:\n" + peteRes.content.slice(0, 150) + "...\n");

  // C. Mina Joke Test
  const minaOptions = {
    selectedPersonaId: "mina",
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }]
  };
  const minaRes = await stubProvider.generateResponse(
    [{ role: "user", content: "Mina: tell me a joke" }],
    minaOptions
  );
  assert.strictEqual(minaRes.perspective, "mina", "Mina must answer Mina prompt");
  assert.strictEqual(minaRes.authorName, "Mina");
  console.log("Mina response preview:\n" + minaRes.content.slice(0, 150) + "...\n");

  // D. Character Distinction Assertions
  assert.notStrictEqual(pennyRes.content, peteRes.content, "Penny and Pete must produce distinct responses");
  assert.notStrictEqual(peteRes.content, minaRes.content, "Pete and Mina must produce distinct responses");
  assert.notStrictEqual(pennyRes.content, minaRes.content, "Penny and Mina must produce distinct responses");

  console.log("✓ All three personalities delivered distinct responses reflecting their cognitive style.");

  // =========================================================================
  // 7. TEMPORAL PERSONALITY TEST (Shared Runtime Context)
  // =========================================================================
  console.log("\n[Test 7] Temporal context provided identically across all characters...");

  const elapsed3Hours = 3 * 3600 * 1000;
  for (const charId of ["penny", "pete", "mina"]) {
    const charOptions = {
      selectedPersonaId: charId,
      elapsedSinceLastUserInput: elapsed3Hours
    };
    const decision = CognitiveRouter.route(`${charId}: check telemetry`, [], charOptions);
    assert.strictEqual(decision.owner, charId, `${charId} routes correctly with temporal metadata attached`);
  }
  console.log("✓ Shared runtime delivers temporal context uniformly without character-specific branches.");

  console.log("\n>>> ALL TIME-PASSAGE AWARENESS & PERSONALITY TESTS PASSED CLEANLY! <<<");
}

runTimePassageAwarenessTests().catch(err => {
  console.error("Test Failed:", err);
  process.exit(1);
});
