/*
    test_fact_extraction.js

    Deterministic Test Suite for LANZAR AI Conservative User Fact Extraction Engine.
*/

const assert = require('assert');

async function runExtractionTests() {
  console.log("=== LANZAR Fact Extraction Engine Test Suite ===");

  const { FactExtractor } = await import('../js/memory/fact-extractor.js');

  // Test 1: User Preference Extraction
  console.log("Test 1: User Preference extraction ('I prefer Linux over Windows')...");
  const prefResult = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'I prefer Linux over Windows for embedded aerospace systems.'
  });
  assert.strictEqual(prefResult.length, 1);
  assert.strictEqual(prefResult[0].category, 'preference');
  assert(prefResult[0].fact.includes('Linux over Windows'));
  assert.strictEqual(prefResult[0].confidence, 'high');
  console.log("✓ Preference extracted:", prefResult[0].fact);

  // Test 2: Project Extraction
  console.log("Test 2: Project extraction ('I'm building a cybersecurity lab')...");
  const projResult = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: "I'm building a cybersecurity lab with isolated virtual networks."
  });
  assert.strictEqual(projResult.length, 1);
  assert.strictEqual(projResult[0].category, 'project');
  assert(projResult[0].fact.includes('cybersecurity lab'));
  assert.strictEqual(projResult[0].confidence, 'high');
  console.log("✓ Project extracted:", projResult[0].fact);

  // Test 3: User Goal Extraction
  console.log("Test 3: Goal extraction ('I want to transfer to another university')...");
  const goalResult = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'I want to transfer to another university next semester.'
  });
  assert.strictEqual(goalResult.length, 1);
  assert.strictEqual(goalResult[0].category, 'goal');
  assert(goalResult[0].fact.includes('transfer to another university'));
  console.log("✓ Goal extracted:", goalResult[0].fact);

  // Test 4: Question Filter (Must NOT store fact)
  console.log("Test 4: Rejection of questions ('Would Linux be better for this?')...");
  const qResult1 = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'Would Linux be better for this setup?'
  });
  assert.strictEqual(qResult1.length, 0, "Questions must NEVER be stored as user facts");

  const qResult2 = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'What time does the telemetry station open?'
  });
  assert.strictEqual(qResult2.length, 0, "Factual inquiries must NOT become user memories");
  console.log("✓ Questions successfully rejected from fact extraction");

  // Test 5: Temporary Calculation / Command Filter
  console.log("Test 5: Rejection of calculation commands ('Calculate the equation...')...");
  const calcResult = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'Calculate the specific impulse for 120 kg/s mass flow.'
  });
  assert.strictEqual(calcResult.length, 0, "Calculations must NOT become persistent user memories");
  console.log("✓ Calculation commands rejected");

  // Test 6: Temporary Problem-Solving Assumptions
  console.log("Test 6: Rejection of temporary assumptions ('For this calculation, assume the engine weighs 400 kg')...");
  const assumeResult1 = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'For this calculation, assume the engine weighs 400 kg.'
  });
  assert.strictEqual(assumeResult1.length, 0, "Temporary assumptions must NOT become user facts");

  const assumeResult2 = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'Imagine if we built an antimatter rocket.'
  });
  assert.strictEqual(assumeResult2.length, 0, "Hypothetical prompts must NOT become facts");
  console.log("✓ Temporary assumptions and hypotheticals rejected");

  // Test 7: Assistant Character Statements (Must NOT be attributed to user)
  console.log("Test 7: Rejection of character statements (role !== 'user')...");
  const charResult = FactExtractor.extractCandidateFacts({
    role: 'assistant',
    persona: 'penny',
    content: "I prefer building wild subscale prototypes on the test stand!"
  });
  assert.strictEqual(charResult.length, 0, "Character statements must NEVER become user memory");
  console.log("✓ Character statements strictly excluded");

  // Test 8: Skill & Technical Environment Extraction
  console.log("Test 8: Skill & Technical Environment extraction...");
  const skillResult = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'I have experience in computational fluid dynamics and OpenFOAM.'
  });
  assert.strictEqual(skillResult.length, 1);
  assert.strictEqual(skillResult[0].category, 'skill');
  console.log("✓ Skill extracted:", skillResult[0].fact);

  const envResult = FactExtractor.extractCandidateFacts({
    role: 'user',
    content: 'My environment runs on Fedora Linux with dual RTX 4090 GPUs.'
  });
  assert.strictEqual(envResult.length, 1);
  assert.strictEqual(envResult[0].category, 'technical_context');
  console.log("✓ Technical environment extracted:", envResult[0].fact);

  console.log("\n>>> ALL 8 FACT EXTRACTION TESTS PASSED CLEANLY! <<<");
}

runExtractionTests().catch(err => {
  console.error("Fact Extraction Test Suite Failed:", err);
  process.exit(1);
});
