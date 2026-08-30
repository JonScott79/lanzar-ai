/*
    test_user_memory_security_and_crud.js

    Security & CRUD Test Suite for LANZAR AI Server-Authoritative Long-Term Memory.
*/

const assert = require('assert');

const BASE_URL = 'http://localhost:5176';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runMemorySecurityTests() {
  console.log("=== LANZAR User Memory Security & CRUD Test Suite ===");

  const timestamp = Date.now();
  const userA = `test_mem_user_a_${timestamp}`;
  const userB = `test_mem_user_b_${timestamp}`;

  // 1. User A Creates Memory
  console.log("Test 1: User A creates a new preference memory...");
  const createRes = await request('/api/user/memory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA}`
    },
    body: JSON.stringify({
      category: 'preference',
      fact: 'Prefers Rust over C++ for flight computer software',
      confidence: 'high'
    })
  });

  assert.strictEqual(createRes.status, 201);
  const memoryA = createRes.data.memory;
  assert(memoryA && memoryA.id, "Memory must have generated ID");
  assert.strictEqual(memoryA.userId, userA);
  assert.strictEqual(memoryA.category, 'preference');
  assert.strictEqual(memoryA.fact, 'Prefers Rust over C++ for flight computer software');
  console.log("✓ Memory created for User A:", memoryA.id);

  // 2. User A Reads Memories
  console.log("Test 2: User A lists memories...");
  const listARes = await request('/api/user/memory', {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(listARes.status, 200);
  assert(Array.isArray(listARes.data.memories));
  assert.strictEqual(listARes.data.memories.length, 1);
  assert.strictEqual(listARes.data.memories[0].id, memoryA.id);
  console.log("✓ User A memories list verified");

  // 3. User A Updates Memory
  console.log("Test 3: User A updates memory fact...");
  const updateRes = await request(`/api/user/memory/${memoryA.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA}`
    },
    body: JSON.stringify({
      fact: 'Prefers Rust and Zig over C++ for embedded telemetry'
    })
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.memory.fact, 'Prefers Rust and Zig over C++ for embedded telemetry');
  console.log("✓ User A memory updated successfully");

  // 4. Security Isolation - User B Lists Memories (Must Not See User A's Memory)
  console.log("Test 4: Security - User B lists memories (Must be empty / isolated)...");
  const listBRes = await request('/api/user/memory', {
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(listBRes.status, 200);
  assert(Array.isArray(listBRes.data.memories));
  assert.strictEqual(listBRes.data.memories.length, 0, "User B must NOT see User A memories");
  console.log("✓ User B memory list is completely isolated");

  // 5. Security - User B Direct GET of User A's Memory ID (Must 404/403)
  console.log("Test 5: Security - User B attempts direct GET of User A's memory ID...");
  const getBRes = await request(`/api/user/memory/${memoryA.id}`, {
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(getBRes.status, 404, "Must not allow cross-user read");
  console.log("✓ Cross-user read blocked (404 Not Found for User B)");

  // 6. Security - User B Attempts Mutation of User A's Memory ID (Must 404/403)
  console.log("Test 6: Security - User B attempts PATCH mutation of User A's memory ID...");
  const patchBRes = await request(`/api/user/memory/${memoryA.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB}`
    },
    body: JSON.stringify({
      fact: 'Tampered fact by User B'
    })
  });
  assert.strictEqual(patchBRes.status, 404, "Must not allow cross-user modification");
  console.log("✓ Cross-user modification blocked");

  // 7. Security - User B Attempts Deletion of User A's Memory ID (Must 404/403)
  console.log("Test 7: Security - User B attempts DELETE of User A's memory ID...");
  const deleteBRes = await request(`/api/user/memory/${memoryA.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(deleteBRes.status, 404, "Must not allow cross-user deletion");
  console.log("✓ Cross-user deletion blocked");

  // 8. Re-verify User A Memory Intact
  console.log("Test 8: Re-verifying User A memory integrity after unauthorized attack...");
  const verifyARes = await request(`/api/user/memory/${memoryA.id}`, {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(verifyARes.status, 200);
  assert.strictEqual(verifyARes.data.fact, 'Prefers Rust and Zig over C++ for embedded telemetry');
  console.log("✓ User A memory verified intact");

  // 9. User A Deletes Memory
  console.log("Test 9: User A deletes own memory...");
  const deleteARes = await request(`/api/user/memory/${memoryA.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(deleteARes.status, 200);
  assert.strictEqual(deleteARes.data.success, true);
  console.log("✓ User A memory deleted successfully");

  // 10. Verify Deletion
  console.log("Test 10: Verifying memory is permanently forgotten...");
  const postDeleteRes = await request(`/api/user/memory/${memoryA.id}`, {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(postDeleteRes.status, 404);
  console.log("✓ Memory successfully forgotten and confirmed gone");

  console.log("\n>>> ALL 10 USER MEMORY SECURITY & CRUD TESTS PASSED CLEANLY! <<<");
}

runMemorySecurityTests().catch(err => {
  console.error("Memory Security Test Suite Failed:", err);
  process.exit(1);
});
