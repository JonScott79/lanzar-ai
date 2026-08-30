import fs from 'fs';
import path from 'path';
import { PennyPersona } from '../../js/personas/penny.js';
import { PetePersona } from '../../js/personas/pete.js';
import { MinaPersona } from '../../js/personas/mina.js';
import { CognitiveRouter } from '../../js/models/cognitive-router.js';
import { hostedInferenceService } from '../../server/hosted-inference-service.js';

const penny = new PennyPersona();
const pete = new PetePersona();
const mina = new MinaPersona();
const personas = { penny, pete, mina };

const allEnabledOptions = {
  enabledPersonas: [penny, pete, mina],
  selectedPersonaId: "auto"
};

async function runEvaluationBattery() {
  console.log("===============================================================================");
  console.log("  LANZAR AI — COMPREHENSIVE CHARACTER DEVELOPMENT & GENERALIZATION BATTERY");
  console.log("===============================================================================\n");

  const promptsPath = path.resolve('c:/Projects/lanzar/AI/tests/character-evaluation/prompts.json');
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

  const results = [];
  const failures = [];

  let routingPasses = 0;
  let totalEvaluations = prompts.length;

  console.log(`Loaded ${totalEvaluations} multi-category evaluation test cases.\n`);

  for (let i = 0; i < prompts.length; i++) {
    const testCase = prompts[i];
    process.stdout.write(`[${i + 1}/${prompts.length}] Evaluating (${testCase.category}) "${testCase.query}"... `);

    // 1. Evaluate Routing & Participant Cardinality
    const participation = CognitiveRouter.evaluatePersonaParticipation(
      testCase.query,
      testCase.context || [],
      allEnabledOptions
    );

    const actualCount = participation.participants.length;
    const [minExp, maxExp] = testCase.expectedCardinality;
    const cardinalityValid = actualCount >= minExp && actualCount <= maxExp;
    const primaryValid = !testCase.expectedPrimary || participation.primary === testCase.expectedPrimary;

    const routingPassed = cardinalityValid && primaryValid;
    if (routingPassed) {
      routingPasses++;
      console.log(`PASSED [${participation.participants.join(', ')}]`);
    } else {
      console.log(`FAILED (Expected: [${minExp}-${maxExp}], Got: ${actualCount} [${participation.participants.join(', ')}])`);
      failures.push({
        id: testCase.id,
        category: testCase.category,
        query: testCase.query,
        expected: testCase.expectedCardinality,
        actual: participation.participants,
        primaryExpected: testCase.expectedPrimary,
        primaryActual: participation.primary,
        reason: participation.reason
      });
    }

    results.push({
      id: testCase.id,
      category: testCase.category,
      query: testCase.query,
      expectedCardinality: testCase.expectedCardinality,
      actualParticipants: participation.participants,
      primaryParticipant: participation.primary,
      routingScore: routingPassed ? 10 : 4,
      reason: participation.reason
    });
  }

  const routingAccuracy = Math.round((routingPasses / totalEvaluations) * 100);
  console.log("\n===============================================================================");
  console.log(`  BATTERY SUMMARY: ${routingPasses}/${totalEvaluations} (${routingAccuracy}%) Routing & Cardinality Accuracy`);
  console.log("===============================================================================\n");

  const resultsDir = path.resolve('c:/Projects/lanzar/AI/tests/character-evaluation');
  fs.writeFileSync(path.join(resultsDir, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(resultsDir, 'failures.json'), JSON.stringify(failures, null, 2));

  console.log(`Results successfully saved to ${resultsDir}`);
}

runEvaluationBattery().catch(err => {
  console.error("Evaluation Battery Error:", err);
  process.exit(1);
});
