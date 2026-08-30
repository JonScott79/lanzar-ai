/*
    test_auth_and_session_isolation.js

    End-to-End API Test Suite for LANZAR AI Auth Hub & User Session Isolation.
*/

const assert = require('assert');

const BASE_URL = 'http://localhost:5176';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runAuthTests() {
  console.log("=== LANZAR Auth Hub & User Session Isolation Test Suite ===");

  const userA = "test_user_alpha";
  const userB = "test_user_beta";

  // 1. Guest / Unauthenticated Status
  console.log("Test 1: Verifying unauthenticated /api/auth/me...");
  const guestAuth = await request('/api/auth/me');
  assert.strictEqual(guestAuth.status, 200);
  assert.strictEqual(guestAuth.data.user.authenticated, false);
  assert.strictEqual(guestAuth.data.user.isGuest, true);
  console.log("✓ Guest session correctly identified:", guestAuth.data.user.displayName);

  // 2. Authenticated User A Identity Check
  console.log("Test 2: Verifying User A authenticated identity via Bearer token...");
  const userAAuth = await request('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(userAAuth.status, 200);
  assert.strictEqual(userAAuth.data.user.authenticated, true);
  assert.strictEqual(userAAuth.data.user.uid, userA);
  console.log("✓ User A authenticated:", userAAuth.data.user.displayName, userAAuth.data.user.uid);

  // 3. User A Creates a Private Thread
  console.log("Test 3: User A creates a private conversation thread...");
  const createThreadRes = await request('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA}`
    },
    body: JSON.stringify({
      title: "Secret Warp Drive Physics",
      selectedPersonaId: "pete"
    })
  });
  assert.strictEqual(createThreadRes.status, 201);
  const threadA = createThreadRes.data;
  assert.strictEqual(threadA.userId, userA);
  console.log("✓ Thread created for User A:", threadA.id, `"${threadA.title}"`);

  // 4. User A Adds Private Messages to Thread
  console.log("Test 4: User A adds message to thread...");
  const addMsgRes = await request(`/api/conversations/${threadA.id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA}`
    },
    body: JSON.stringify({
      role: "user",
      content: "What is the warp metric tensor configuration?"
    })
  });
  assert.strictEqual(addMsgRes.status, 201);
  console.log("✓ Message added to User A's thread");

  // 5. User B Authenticates and Lists Threads (Isolation Check)
  console.log("Test 5: User B lists conversations (Must not see User A's thread)...");
  const listBRes = await request('/api/conversations', {
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(listBRes.status, 200);
  assert(!listBRes.data.some(t => t.id === threadA.id), "SECURITY VIOLATION: User B saw User A's thread in list!");
  console.log("✓ User B list is isolated from User A's conversations");

  // 6. User B Attempts Direct Read of User A's Thread by ID (Security Enforcement)
  console.log("Test 6: User B attempts direct GET of User A's thread ID (Must 403)...");
  const attackRead = await request(`/api/conversations/${threadA.id}`, {
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(attackRead.status, 403, "SECURITY VIOLATION: Server did not return 403 Forbidden!");
  console.log("✓ Server rejected cross-user read with 403 Forbidden");

  // 7. User B Attempts Message Injection into User A's Thread
  console.log("Test 7: User B attempts message injection into User A's thread (Must 403)...");
  const attackInject = await request(`/api/conversations/${threadA.id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB}`
    },
    body: JSON.stringify({
      role: "user",
      content: "Malicious cross-user injected message"
    })
  });
  assert.strictEqual(attackInject.status, 403, "SECURITY VIOLATION: Server did not block cross-user message injection!");
  console.log("✓ Server rejected cross-user message injection with 403 Forbidden");

  // 8. User B Attempts Deletion of User A's Thread
  console.log("Test 8: User B attempts deletion of User A's thread (Must 403)...");
  const attackDelete = await request(`/api/conversations/${threadA.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(attackDelete.status, 403, "SECURITY VIOLATION: Server did not block cross-user thread deletion!");
  console.log("✓ Server rejected cross-user deletion with 403 Forbidden");

  // 9. User B Creates Their Own Thread
  console.log("Test 9: User B creates their own thread...");
  const createThreadBRes = await request('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB}`
    },
    body: JSON.stringify({
      title: "Artistic Poster Layout",
      selectedPersonaId: "mina"
    })
  });
  assert.strictEqual(createThreadBRes.status, 201);
  const threadB = createThreadBRes.data;
  assert.strictEqual(threadB.userId, userB);
  console.log("✓ Thread created for User B:", threadB.id, `"${threadB.title}"`);

  // 10. User A Validates Thread Integrity
  console.log("Test 10: User A re-fetches thread and verifies integrity...");
  const fetchARes = await request(`/api/conversations/${threadA.id}`, {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(fetchARes.status, 200);
  assert.strictEqual(fetchARes.data.title, "Secret Warp Drive Physics");
  assert.strictEqual(fetchARes.data.messages.length, 1);
  assert.strictEqual(fetchARes.data.messages[0].content, "What is the warp metric tensor configuration?");
  console.log("✓ User A thread verified intact with zero tampering");

  console.log("\n>>> ALL 10 AUTH HUB & SESSION ISOLATION TESTS PASSED CLEANLY! <<<");
}

runAuthTests().catch(err => {
  console.error("Auth Test Suite Failed:", err);
  process.exit(1);
});
