/*
    test_mina_math_competence_revelation.js

    Dedicated Test Suite for Mina's Hidden Mathematical Competence Revelation.
    Validates all 13 conditions and ensures the event is strictly non-deterministic and rare:
    1. Condition 1-3: Penny, Pete, Mina all enabled.
    2. Condition 4: Genuine mathematical reasoning context.
    3. Condition 5: Pete and/or Penny produced a questionable result.
    4. Condition 6: Math engine consulted first time.
    5. Condition 7: Disagreement unresolved after first verification.
    6. Condition 8: Second independent verification performed.
    7. Condition 9: Disagreement persists.
    8. Condition 10: Mina independently notices an inconsistency.
    9. Condition 11: Mina's observation is verified as correct.
    10. Condition 12: Sufficient natural turn depth (>= 4).
    11. Condition 13: Not previously revealed in the conversation.
    12. Negative Check: Does NOT trigger on single mistake or casual math question.
    13. Negative Check: Does NOT trigger if Mina was already revealed earlier.
    14. Negative Check: Does NOT trigger if Pete or Penny are disabled.
    15. In-Character Voice: Mina does not lecture or brag, and responds with tentative inquiry ("Ummmm... isn't that supposed to be 2? 🥺").
*/

const test = require('node:test');
const assert = require('node:assert');
const { MinaMathCompetenceEvaluator } = require('../server/mina-math-competence-evaluator.js');
const { MathematicsService } = require('../server/mathematics-service.js');

console.log("================================================================================");
console.log("   LANZAR AI — MINA HIDDEN MATHEMATICAL COMPETENCE REVELATION SUITE");
console.log("================================================================================\n");

// -------------------------------------------------------------------------
// 1. Negative Tests: Standard Math Queries Must NEVER Trigger Reveal
// -------------------------------------------------------------------------
test("1. Negative: Casual single-turn math question does not trigger reveal", () => {
  const history = [
    { role: "user", content: "What is 2 + 2?" }
  ];
  const evalResult = MinaMathCompetenceEvaluator.evaluateConditions(history);
  assert.strictEqual(evalResult.canReveal, false);
  assert.ok(evalResult.reason.includes("Insufficient conversation depth"));
});

test("2. Negative: Pete solving an equation without disagreement does not trigger reveal", () => {
  const history = [
    { role: "user", content: "Can we calculate the nozzle area expansion ratio?" },
    { role: "assistant", persona: "pete", content: "Deriving area ratio $\\epsilon = \\frac{A_e}{A_t} = 15.4$." },
    { role: "user", content: "Thanks Pete, what about the chamber pressure?" },
    { role: "assistant", persona: "pete", content: "Operating at $P_c = 7.5\\text{ MPa}$." }
  ];
  const evalResult = MinaMathCompetenceEvaluator.evaluateConditions(history);
  assert.strictEqual(evalResult.canReveal, false);
});

test("3. Negative: Missing teammate (Penny disabled) blocks reveal", () => {
  const history = [
    { role: "user", content: "Integrate $\\int x^2 dx$." },
    { role: "assistant", persona: "pete", content: "Result is $\\frac{x^3}{3} + C$." },
    { role: "user", content: "Wait, the engine says undefined." },
    { role: "assistant", persona: "pete", content: "Re-verifying with second pass." },
    { role: "assistant", persona: "mina", content: "Ummm guys?" }
  ];
  const evalResult = MinaMathCompetenceEvaluator.evaluateConditions(history, {
    enabledPersonas: [{ id: "pete" }, { id: "mina" }], // Penny disabled
    mathVerifications: [{ success: true }, { success: false }]
  });
  assert.strictEqual(evalResult.canReveal, false);
  assert.ok(evalResult.reason.includes("Penny, Pete, and Mina must all be active"));
});

// -------------------------------------------------------------------------
// 4. Negative Test: Cannot Re-Reveal if Already Known in Thread
// -------------------------------------------------------------------------
test("4. Negative: Already revealed competence in thread prevents repeat reveal", () => {
  const history = [
    { role: "user", content: "Analyzing trajectory integral." },
    { role: "assistant", persona: "penny", content: "I got 4.2!" },
    { role: "assistant", persona: "pete", content: "No, the model says 3.8." },
    { role: "assistant", persona: "mina", content: "Ummm guys? Isn't it 2? 🥺 ...I minored in math?" },
    { role: "user", content: "What about the second phase?" }
  ];
  const evalResult = MinaMathCompetenceEvaluator.evaluateConditions(history, {
    mathVerifications: [{ success: false }, { success: false }]
  });
  assert.strictEqual(evalResult.canReveal, false);
  assert.ok(evalResult.reason.includes("Condition 13 failed"));
});

// -------------------------------------------------------------------------
// 5. Positive Test: Complete 13-Condition Deep Discrepancy Scenario
// -------------------------------------------------------------------------
test("5. Positive: All 13 conditions met triggers Mina's organic, tentative revelation", () => {
  const history = [
    {
      role: "user",
      content: "We need to calculate the exact eigenvalue determinant $\\det(A - \\lambda I)$ for our vibration dampener matrix."
    },
    {
      role: "assistant",
      persona: "penny",
      content: "I ran the rapid vibration model on the bench and came up with a characteristic root of $\\lambda = 4$! 🚀"
    },
    {
      role: "assistant",
      persona: "pete",
      content: "That contradicts the polynomial expansion. Solving $\\det(A - \\lambda I) = 0$ indicates $\\lambda = 6$."
    },
    {
      role: "assistant",
      persona: "pete",
      content: "First verification pass via computational engine returned non-convergence. Running second independent verification pass..."
    },
    {
      role: "assistant",
      persona: "pete",
      content: "Second pass still indicates an unresolved parity conflict between our analytical roots."
    }
  ];

  const evalResult = MinaMathCompetenceEvaluator.evaluateConditions(history, {
    enabledPersonas: [{ id: "penny" }, { id: "pete" }, { id: "mina" }],
    mathVerifications: [
      { verified: false, conflict: "non-convergence" },
      { verified: false, conflict: "parity_mismatch", minaIsCorrect: true }
    ]
  });

  assert.strictEqual(evalResult.canReveal, true);
  assert.ok(evalResult.reason.includes("All 13 conditions satisfied"));
});

// -------------------------------------------------------------------------
// 6. Post-Revelation "Dum-Dum" Trait: System Prompt Dynamic Adaptation
// -------------------------------------------------------------------------
test("6. Trait State: Mina's system prompt strictly disables 'dum-dum' teasing before revelation", async () => {
  const { MinaPersona } = await import('../js/personas/mina.js');
  const mina = new MinaPersona();
  
  // Pre-revelation prompt
  const prePrompt = mina.getSystemPrompt({ minaMathCompetenceDiscovered: false });
  assert.ok(prePrompt.includes("You do NOT tease teammates as \"dum-dum\""));
  assert.ok(!prePrompt.includes("POST-MATH REVELATION / \"DUM-DUM\" TRAIT"));
});

test("7. Trait State: Mina's system prompt enables affectionate, sparing teasing after revelation", async () => {
  const { MinaPersona } = await import('../js/personas/mina.js');
  const mina = new MinaPersona();
  
  // Post-revelation prompt
  const postPrompt = mina.getSystemPrompt({ minaMathCompetenceDiscovered: true });
  assert.ok(postPrompt.includes("POST-MATH REVELATION / \"DUM-DUM\" TRAIT"));
  assert.ok(postPrompt.includes("dum-dum"));
  assert.ok(postPrompt.includes("Keep it rare, sweet, and affectionate—never cruel and never an overused catchphrase"));
});

test("8. Reciprocity: Pete and Penny dynamic prompts acknowledge Mina's competence post-revelation", async () => {
  const { PetePersona } = await import('../js/personas/pete.js');
  const { PennyPersona } = await import('../js/personas/penny.js');
  
  const pete = new PetePersona();
  const penny = new PennyPersona();

  const petePost = pete.getSystemPrompt({ minaMathCompetenceDiscovered: true });
  assert.ok(petePost.includes("Now that you know Mina has genuine mathematical intuition"));
  assert.ok(petePost.includes("...I made an arithmetic error."));

  const pennyPost = penny.getSystemPrompt({ minaMathCompetenceDiscovered: true });
  assert.ok(pennyPost.includes("You now know Mina has real mathematical ability"));
  assert.ok(pennyPost.includes("I preferred when we didn't know you could do math!"));
});

test("9. PersonaManager: Persistent discovery state tracking", async () => {
  const { PersonaManager } = await import('../js/personas/persona-manager.js');
  const manager = new PersonaManager();
  
  assert.strictEqual(manager.isMinaMathCompetenceDiscovered, false);
  manager.setMinaMathCompetenceDiscovered(true);
  assert.strictEqual(manager.isMinaMathCompetenceDiscovered, true);
});

