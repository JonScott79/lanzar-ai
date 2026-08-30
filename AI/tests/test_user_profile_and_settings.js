/*
    test_user_profile_and_settings.js

    End-to-End API Test Suite for LANZAR AI Per-User Profile & Settings Isolation.
*/

const assert = require('assert');

const BASE_URL = 'http://localhost:5176';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runProfileSettingsTests() {
  console.log("=== LANZAR Per-User Profile & Settings Test Suite ===");

  const timestamp = Date.now();
  const userA = `test_user_alpha_${timestamp}`;
  const userB = `test_user_beta_${timestamp}`;

  // 1. Guest / Default Profile & Settings
  console.log("Test 1: Fetching default guest profile & settings...");
  const guestRes = await request('/api/user/profile');
  assert.strictEqual(guestRes.status, 200);
  assert.strictEqual(guestRes.data.profile.uid, 'user_default');
  assert.deepStrictEqual(guestRes.data.settings.enabledCharacters, ['penny', 'pete', 'mina']);
  console.log("✓ Guest profile & default settings verified");

  // 2. User Alpha Profile & Settings
  console.log("Test 2: Fetching User Alpha profile...");
  const userARes = await request('/api/user/profile', {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(userARes.status, 200);
  assert.strictEqual(userARes.data.profile.uid, userA);
  console.log("✓ User Alpha profile fetched");

  // 3. User Alpha Updates Profile Fields
  console.log("Test 3: User Alpha updates profile (preferredName, occupation, aboutMe)...");
  const updateProfileARes = await request('/api/user/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA}`
    },
    body: JSON.stringify({
      preferredName: "Commander Alpha",
      occupation: "Lead Aerospace Architect",
      aboutMe: "Building the next generation of ion engines."
    })
  });
  assert.strictEqual(updateProfileARes.status, 200);
  assert.strictEqual(updateProfileARes.data.profile.preferredName, "Commander Alpha");
  assert.strictEqual(updateProfileARes.data.profile.occupation, "Lead Aerospace Architect");
  console.log("✓ User Alpha profile updated successfully");

  // 4. User Alpha Updates Settings (Disables Mina, Sets PyTorch)
  console.log("Test 4: User Alpha updates settings (disables Mina, selects PyTorch)...");
  const updateSettingsARes = await request('/api/user/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userA}`
    },
    body: JSON.stringify({
      enabledCharacters: ['penny', 'pete'], // Mina disabled!
      activeModelProvider: 'lanzar-001',
      technicalDepth: 'deep-theoretical'
    })
  });
  assert.strictEqual(updateSettingsARes.status, 200);
  assert.deepStrictEqual(updateSettingsARes.data.settings.enabledCharacters, ['penny', 'pete']);
  assert.strictEqual(updateSettingsARes.data.settings.activeModelProvider, 'lanzar-001');
  console.log("✓ User Alpha settings updated (Mina disabled)");

  // 5. User Beta Fetches Profile & Settings (Isolation Check)
  console.log("Test 5: User Beta fetches profile & settings (Must not leak User Alpha's data)...");
  const userBRes = await request('/api/user/profile', {
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(userBRes.status, 200);
  assert.strictEqual(userBRes.data.profile.uid, userB);
  assert.notStrictEqual(userBRes.data.profile.preferredName, "Commander Alpha", "SECURITY VIOLATION: User Beta leaked User Alpha's preferred name!");
  assert.deepStrictEqual(userBRes.data.settings.enabledCharacters, ['penny', 'pete', 'mina'], "User Beta must have default all-enabled characters");
  console.log("✓ User Beta profile & settings are completely isolated from User Alpha");

  // 6. User Beta Updates Settings (Disables Pete, Sets Simulated Triad)
  console.log("Test 6: User Beta updates settings (disables Pete, selects Triad)...");
  const updateSettingsBRes = await request('/api/user/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userB}`
    },
    body: JSON.stringify({
      enabledCharacters: ['penny', 'mina'], // Pete disabled!
      activeModelProvider: 'stub',
      technicalDepth: 'standard'
    })
  });
  assert.strictEqual(updateSettingsBRes.status, 200);
  assert.deepStrictEqual(updateSettingsBRes.data.settings.enabledCharacters, ['penny', 'mina']);
  assert.strictEqual(updateSettingsBRes.data.settings.activeModelProvider, 'stub');
  console.log("✓ User Beta settings updated (Pete disabled)");

  // 7. Verify Cross-User Isolation Persistence
  console.log("Test 7: Re-verifying User Alpha settings remain intact...");
  const verifyARes = await request('/api/user/settings', {
    headers: { 'Authorization': `Bearer ${userA}` }
  });
  assert.strictEqual(verifyARes.status, 200);
  assert.deepStrictEqual(verifyARes.data.enabledCharacters, ['penny', 'pete']);
  assert.strictEqual(verifyARes.data.activeModelProvider, 'lanzar-001');

  const verifyBRes = await request('/api/user/settings', {
    headers: { 'Authorization': `Bearer ${userB}` }
  });
  assert.strictEqual(verifyBRes.status, 200);
  assert.deepStrictEqual(verifyBRes.data.enabledCharacters, ['penny', 'mina']);
  assert.strictEqual(verifyBRes.data.activeModelProvider, 'stub');
  console.log("✓ Complete multi-user setting isolation verified across User Alpha and User Beta");

  console.log("\n>>> ALL 7 PER-USER PROFILE & SETTINGS TESTS PASSED CLEANLY! <<<");
}

runProfileSettingsTests().catch(err => {
  console.error("Profile & Settings Test Suite Failed:", err);
  process.exit(1);
});
