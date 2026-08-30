/*
    test_cognitive_router_sprint2_collaboration.js

    Unit and Integration Test Suite for Cognitive Router Sprint 2:
    - Multi-Mind Collaboration & Dynamic Participant Cardinality
    - Multi-Character Hosted Model Synthesis (Triad & Dual Mind)
    - SSE Speaker Demarcation in Streaming Output
    - Context-Aware Cross-Persona Dialogue Continuity
*/

const assert = require('assert');
const { CognitiveRouter } = require('../js/models/cognitive-router.js');
const { PennyPersona } = require('../js/personas/penny.js');
const { PetePersona } = require('../js/personas/pete.js');
const { MinaPersona } = require('../js/personas/mina.js');
const { Character } = require('../js/personas/character.js');
const { HostedInferenceService } = require('../server/hosted-inference-service.js');

const allPersonas = [new PennyPersona(), new PetePersona(), new MinaPersona()];

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  try {
    process.stdout.write(`Testing [${name}]... `);
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(() => {
        passed++;
        console.log('PASSED');
      }).catch(err => {
        console.log('FAILED');
        console.error(err);
        process.exitCode = 1;
      });
    } else {
      passed++;
      console.log('PASSED');
    }
  } catch (err) {
    console.log('FAILED');
    console.error(err);
    process.exitCode = 1;
  }
}

(async () => {
  console.log("===============================================================================");
  console.log("  LANZAR AI — COGNITIVE ROUTER SPRINT 2: COLLABORATION & REAL INFERENCE");
  console.log("===============================================================================\n");

  // 1. Dynamic Cardinality Resolution (1, 2, 3+ minds)
  test("CARDINALITY_SINGLE_MIND_MATH", () => {
    const part = CognitiveRouter.evaluatePersonaParticipation("Solve 4x + 1 = 9", [], { enabledPersonas: allPersonas });
    assert.strictEqual(part.participants.length, 1);
    assert.strictEqual(part.participants[0], "pete");
  });

  test("CARDINALITY_DUAL_MIND_SCIENCE_ART", () => {
    const part = CognitiveRouter.evaluatePersonaParticipation("Make this thermal diagram technically accurate and beautiful", [], { enabledPersonas: allPersonas });
    assert.ok(part.participants.includes("pete") && part.participants.includes("mina"), "Dual-domain should include Pete and Mina");
  });

  test("CARDINALITY_TRIAD_MULTI_DOMAIN", () => {
    const q = "Build a custom mini-ITX liquid cooled chassis with neon acrylic distro plates, calculate pump head loss through 3 radiators, and laser-cut the retro front panel";
    const part = CognitiveRouter.evaluatePersonaParticipation(q, [], { enabledPersonas: allPersonas });
    assert.strictEqual(part.participants.length, 3, "Complex 3-domain query should engage all 3 active minds");
    assert.ok(part.participants.includes("penny") && part.participants.includes("pete") && part.participants.includes("mina"));
  });

  // 2. Server-Side Multi-Character Completion Structure
  test("SERVER_MULTI_CHARACTER_SYNTHESIS_STUB", async () => {
    const hostedService = new HostedInferenceService();
    const characters = [
      { id: "penny", shortName: "Penny", role: "Engineer", systemPrompt: "You are Penny." },
      { id: "pete", shortName: "Pete", role: "Architect", systemPrompt: "You are Pete." },
      { id: "mina", shortName: "Mina", role: "Art Director", systemPrompt: "You are Mina." }
    ];

    if (hostedService.isConfigured) {
      const res = await hostedService.generateMultiCharacterCompletion({
        messages: [{ role: "user", content: "Team, give me a 1-sentence thought on our new rocket design." }],
        routingDecision: { owner: "triad" },
        characters
      });

      assert.strictEqual(res.isMultiTurn, true);
      assert.strictEqual(res.dialogues.length, 3);
      assert.strictEqual(res.dialogues[0].persona, "penny");
      assert.strictEqual(res.dialogues[1].persona, "pete");
      assert.strictEqual(res.dialogues[2].persona, "mina");
      assert.ok(res.dialogues[0].content.length > 5);
    } else {
      console.log("(Skipped API call: Offline mock)");
    }
  });

  // 3. Multi-Character SSE Stream Protocol Verification
  test("SERVER_MULTI_CHARACTER_STREAM_SSE_DEMARCATION", async () => {
    const hostedService = new HostedInferenceService();
    const characters = [
      { id: "penny", shortName: "Penny", systemPrompt: "Say 'Penny here!'" },
      { id: "pete", shortName: "Pete", systemPrompt: "Say 'Pete here!'" }
    ];

    const events = [];
    const fakeClientRes = {
      writeHead: () => {},
      write: (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const l of lines) {
          if (l.startsWith('data:')) {
            const raw = l.slice(5).trim();
            if (raw && raw !== '[DONE]') {
              try {
                events.push(JSON.parse(raw));
              } catch {}
            }
          }
        }
      },
      end: () => {}
    };

    if (hostedService.isConfigured) {
      await hostedService.streamMultiCharacterCompletion({
        messages: [{ role: "user", content: "Quick check-in Penny & Pete." }],
        routingDecision: { owner: "dual" },
        characters
      }, fakeClientRes);

      const speakerChanges = events.filter(e => e.speakerChange);
      assert.strictEqual(speakerChanges.length, 2, "Stream must emit 2 speakerChange events for Dual mode");
      assert.strictEqual(speakerChanges[0].characterId, "penny");
      assert.strictEqual(speakerChanges[1].characterId, "pete");
    } else {
      console.log("(Skipped API stream: Offline mock)");
    }
  });

  // 4. Conversational Focus & Collaboration Potential Preservation
  test("COLLABORATION_POTENTIAL_FLAG_IN_ROUTING", () => {
    const route = CognitiveRouter.route("Design an autonomous drone and calculate battery runtime", [], { enabledPersonas: allPersonas });
    assert.strictEqual(route.primaryCandidate, "penny");
    assert.ok(route.collaborationPotential, "Multi-domain request must signal collaboration potential");
    assert.ok(route.secondaryCandidates.includes("pete"), "Pete should be recognized as secondary candidate");
  });

  console.log("\n===============================================================================");
  console.log(`  SPRINT 2 COLLABORATION BATTERY COMPLETE: ${passed} / ${total} PASSED`);
  console.log("===============================================================================");
})();
