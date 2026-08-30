/*
    test_conversation_crud_and_security.js

    End-to-End API and Unit Test Suite for Multi-Conversation Thread CRUD & Session Isolation.
*/

const assert = require('assert');
const { ConversationStore } = require('../server/conversation-store.js');

async function runTests() {
  console.log("=== LANZAR Conversation & Thread Security Test Suite ===");
  const store = new ConversationStore();

  const userA = "user_alpha_test";
  const userB = "user_beta_test";

  // 1. Create Thread for User A
  console.log("Test 1: Creating Thread A for User A...");
  const threadA = store.create(userA, {
    title: "Rocket Propulsion Optimization",
    selectedPersonaId: "penny",
    modelProvider: "stub",
    commandHistory: ["Optimize nozzle expansion ratio", "Check biomimetic swirl"]
  });
  assert(threadA && threadA.id, "Thread A should have an id");
  assert.strictEqual(threadA.userId, userA, "Thread A owner should be User A");
  assert.strictEqual(threadA.title, "Rocket Propulsion Optimization");
  console.log("✓ Thread A created:", threadA.id);

  // 2. Add Messages to Thread A
  console.log("Test 2: Adding messages to Thread A...");
  const msgA1 = store.addMessage(userA, threadA.id, {
    role: "user",
    content: "What is the optimal expansion ratio for sea-level engines?"
  });
  const msgA2 = store.addMessage(userA, threadA.id, {
    role: "assistant",
    content: "For sea-level engines, an expansion ratio around 12 to 16 prevents flow separation.",
    persona: "penny",
    authorName: "Penny"
  });
  assert.strictEqual(store.get(userA, threadA.id).messages.length, 2);
  console.log("✓ Messages added to Thread A successfully");

  // 3. Create Thread B for User A (Multi-thread for same user)
  console.log("Test 3: Creating Thread B for User A...");
  const threadB = store.create(userA, {
    title: "Thermodynamic Heat Flux Modeling",
    selectedPersonaId: "pete",
    modelProvider: "lanzar-001",
    commandHistory: ["Calculate regenerative heat flux"]
  });
  const msgB1 = store.addMessage(userA, threadB.id, {
    role: "user",
    content: "Calculate regenerative cooling channel temperature gradient."
  });
  console.log("✓ Thread B created:", threadB.id);

  // 4. Verify Thread Isolation (Messages & Command History do not leak)
  console.log("Test 4: Verifying Thread Isolation between Thread A and Thread B...");
  const loadedA = store.get(userA, threadA.id);
  const loadedB = store.get(userA, threadB.id);

  assert.strictEqual(loadedA.messages.length, 2, "Thread A should only have 2 messages");
  assert.strictEqual(loadedB.messages.length, 1, "Thread B should only have 1 message");
  assert.strictEqual(loadedA.messages[0].content, "What is the optimal expansion ratio for sea-level engines?");
  assert.strictEqual(loadedB.messages[0].content, "Calculate regenerative cooling channel temperature gradient.");

  assert.strictEqual(loadedA.selectedPersonaId, "penny");
  assert.strictEqual(loadedB.selectedPersonaId, "pete");

  assert.deepStrictEqual(loadedA.commandHistory, ["Optimize nozzle expansion ratio", "Check biomimetic swirl"]);
  assert.deepStrictEqual(loadedB.commandHistory, ["Calculate regenerative heat flux"]);
  console.log("✓ Complete isolation between Thread A and Thread B verified");

  // 5. Thread Renaming
  console.log("Test 5: Renaming Thread A...");
  const updatedA = store.update(userA, threadA.id, { title: "Aerospike Nozzle Trade Studies" });
  assert.strictEqual(updatedA.title, "Aerospike Nozzle Trade Studies");
  assert.strictEqual(updatedA.messages.length, 2, "Renaming must not affect conversation messages");
  console.log("✓ Thread renaming verified without message mutation");

  // 6. User Isolation & Security Enforcement (User B attempts to access User A's thread)
  console.log("Test 6: Security - User B attempts to access User A's thread...");
  let accessBlocked = false;
  try {
    store.get(userB, threadA.id);
  } catch (err) {
    if (err.status === 403 || err.message.includes("denied")) {
      accessBlocked = true;
    }
  }
  assert(accessBlocked, "Server MUST reject unauthorized access across users with 403");
  console.log("✓ Unauthorized read access blocked (403 Forbidden)");

  // 7. Security - User B attempts to delete User A's thread
  console.log("Test 7: Security - User B attempts to delete User A's thread...");
  let deleteBlocked = false;
  try {
    store.delete(userB, threadA.id);
  } catch (err) {
    if (err.status === 403 || err.message.includes("denied")) {
      deleteBlocked = true;
    }
  }
  assert(deleteBlocked, "Server MUST reject unauthorized deletion across users with 403");
  console.log("✓ Unauthorized deletion blocked (403 Forbidden)");

  // 8. List Filtering (User A only sees their threads, User B only sees theirs)
  console.log("Test 8: User-scoped list filtering...");
  const listA = store.list(userA);
  const listB = store.list(userB);
  assert(listA.some(t => t.id === threadA.id), "User A list must contain Thread A");
  assert(listA.some(t => t.id === threadB.id), "User A list must contain Thread B");
  assert(!listB.some(t => t.id === threadA.id), "User B list MUST NOT contain Thread A");
  assert(!listB.some(t => t.id === threadB.id), "User B list MUST NOT contain Thread B");
  console.log("✓ User-scoped thread list filtering verified");

  // 9. Thread Deletion by Owner
  console.log("Test 9: Deleting Thread B by Owner...");
  const deleted = store.delete(userA, threadB.id);
  assert(deleted === true);
  const listAfterDelete = store.list(userA);
  assert(!listAfterDelete.some(t => t.id === threadB.id), "Thread B should be gone from list");
  console.log("✓ Thread deletion verified");

  console.log("\n>>> ALL 9 CONVERSATION CRUD & SECURITY TESTS PASSED CLEANLY! <<<");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
