/**
 * test_penny_routing_assault.js
 * Comprehensive 35-case routing and domain specialization battery for Penny
 * (Engineering Decisions, Experimental Design, Optimization, Discrete Math, Applied Probability & Risk, Borderline & Multi-Turn Cases).
 */

const test = require('node:test');
const assert = require('node:assert');
const { CognitiveRouter } = require('../js/models/cognitive-router.js');
const { StubModelProvider } = require('../js/models/stub-provider.js');

const personas = [
  { id: 'penny', name: 'Penny', shortName: 'Penny' },
  { id: 'pete', name: 'Pete', shortName: 'Pete' },
  { id: 'mina', name: 'Mina', shortName: 'Mina' }
];

const stubProvider = new StubModelProvider();
const options = {
  personaManager: {
    getAllPersonas: () => personas,
    getEnabledPersonas: () => personas,
    isPersonaEnabled: () => true,
    getSelectedPersonaId: () => 'auto'
  }
};

console.log("=".repeat(80));
console.log("   LANZAR AI — PENNY ROUTING & ENGINEERING DOMAIN ASSAULT BATTERY");
console.log("=".repeat(80) + "\n");

// -----------------------------------------------------------------------------
// Category 1: Engineering Decisions & Component Tradeoffs (5 cases)
// -----------------------------------------------------------------------------
test("1. Engineering Decision: Rover route expected travel time vs risk", () => {
  const q = "A small autonomous rover needs to choose between two routes. Route A is 100 meters long and takes exactly 20 seconds. Route B is 70 meters long, but has a 30% chance of encountering an obstacle that adds 15 seconds to the trip. Which route has the lower expected travel time, and what additional factor would you consider before choosing?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("2. Engineering Decision: Component & material selection tradeoff", () => {
  const q = "Which material selection gives us the best tradeoff between tensile strength and weight for a high-speed drone arm: carbon fiber composite or 7075-T6 aluminum?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("3. Engineering Decision: Reliability vs speed optimization", () => {
  const q = "Should we optimize for speed or reliability when designing this high-pressure pneumatic actuator valve?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("4. Engineering Decision: Structural tradeoff between two architectures", () => {
  const q = "Which configuration gives us the best tradeoff for heat dissipation: finned heat sinks or liquid cold plates?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("5. Engineering Decision: Prototype design selection", () => {
  const q = "Which design should we prototype first for the automated sample retrieval gripper?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

// -----------------------------------------------------------------------------
// Category 2: Experimental Design & Testing (5 cases)
// -----------------------------------------------------------------------------
test("6. Experimental Design: Cooling system prototype comparison", () => {
  const q = "We have two prototype cooling systems. How would you design an experiment to determine which one performs better?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("7. Experimental Design: Bench testing a high-flow valve", () => {
  const q = "How would you experimentally test this fuel injector valve under cryogenic conditions?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("8. Experimental Design: Controlled experiment for component failure", () => {
  const q = "Design an experiment to determine which component fails first under continuous vibration.";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("9. Experimental Design: Instrumentation & sensor measurement setup", () => {
  const q = "What measurement setup and instrumentation would you use to experimentally verify pressure drops across this filter?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("10. Experimental Design: Prototype iteration protocol", () => {
  const q = "How would you run a rapid prototype iteration test to improve the thrust efficiency of this aerospike model?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

// -----------------------------------------------------------------------------
// Category 3: Optimization & Discrete Problems (5 cases)
// -----------------------------------------------------------------------------
test("11. Optimization: Constrained parameter optimization", () => {
  const q = "What is the most efficient approach for parameter optimization across 5 motor speed profiles?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("12. Optimization: Shortest path routing with dynamic obstacles", () => {
  const q = "What is the most efficient shortest path algorithm for a warehouse robot navigating dynamic obstacles?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("13. Discrete Math: State machine transitions for robotic arm", () => {
  const q = "How should we design the state machine transitions for an automated tool changer to avoid deadlock?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("14. Simulation: Monte Carlo parameter sweep", () => {
  const q = "How could we simulate this with a Monte Carlo parameter sweep to find the failure limits?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("15. Simulation: Nonlinear behavior testing", () => {
  const q = "How can we test nonlinear behavior and chaotic feedback loops in this fluidic oscillation switch?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

// -----------------------------------------------------------------------------
// Category 4: Applied Probability, Risk & Decisions Under Uncertainty (5 cases)
// -----------------------------------------------------------------------------
test("16. Applied Probability: Probability of component failure during sprint", () => {
  const q = "What is the probability this design fails under maximum load, and how do we mitigate the risk?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("17. Applied Probability: Expected payoff under uncertain conditions", () => {
  const q = "Which option gives us the best expected result under high sensor noise?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("18. Applied Probability: Decision under uncertainty with prototype variants", () => {
  const q = "How would you use expected value to decide which prototype to build when testing budgets are constrained?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("19. Applied Probability: Risk/reward tradeoff analysis", () => {
  const q = "What is the risk/reward tradeoff between single-stage ignition and a dual-stage igniter setup?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("20. Applied Probability: Variance and travel time delay evaluation", () => {
  const q = "If Route A has zero variance and Route B has high variance in travel time, how should we evaluate the risk?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

// -----------------------------------------------------------------------------
// Category 5: Borderline & Disambiguation Cases (Pete vs. Penny vs. Dual) (10 cases)
// -----------------------------------------------------------------------------
test("21. Borderline: Pure theoretical derivation routes to Pete", () => {
  const q = "Derive the ideal rocket equation from conservation of momentum.";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "pete");
});

test("22. Borderline: Practical prototype comparison routes to Penny", () => {
  const q = "We have two rocket nozzle designs. Which one should we prototype first, and how would you experimentally compare them?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("23. Borderline: Thermodynamics derivation equation routes to Pete", () => {
  const q = "Derive the governing equation for convective heat transfer across a laminar boundary layer.";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "pete");
});

test("24. Borderline: Practical insulation prototyping routes to Penny", () => {
  const q = "Which insulation design should we prototype for the avionics bay?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("25. Borderline: Pure statistical paradox routes to Pete", () => {
  const q = "Explain Simpson's paradox and how aggregate data reverses.";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "pete");
});

test("26. Borderline: Two-class Bayes theorem derivation routes to Pete", () => {
  const q = "Calculate the posterior probability that a defective bulb came from Machine B using Bayes' theorem.";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "pete");
});

test("27. Borderline: Experimental validation of reliability routes to Penny", () => {
  const q = "How would you design an experiment to determine whether this manufacturing process is reliable?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "penny");
});

test("28. Borderline: Dual engineering & scientific architecture tradeoff", () => {
  const q = "Penny and Pete, should we rewrite our propulsion simulation in Rust or C++?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "dual");
});

test("29. Borderline: Pure aesthetic art direction routes to Mina", () => {
  const q = "Design a retro-futurist color palette with warm parchment and crimson highlights.";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "mina");
});

test("30. Borderline: C++ crash diagnostics routes to Pete", () => {
  const q = "Why is my C++ simulation throwing a segmentation fault when accessing this pointer?";
  const dec = CognitiveRouter.route(q, [], options);
  assert.strictEqual(dec.owner, "pete");
});

// -----------------------------------------------------------------------------
// Category 6: Live Execution & Multi-Turn Context Continuity (5 cases)
// -----------------------------------------------------------------------------
test("31. Live Execution: Penny answers rover expected value with mathematical correctness and zero canned boilerplate", async () => {
  const q = "A small autonomous rover needs to choose between two routes. Route A is 100 meters long and takes exactly 20 seconds. Route B is 70 meters long, but has a 30% chance of encountering an obstacle that adds 15 seconds to the trip. Which route has the lower expected travel time, and what additional factor would you consider before choosing?";
  const resp = await stubProvider.generateResponse([{ role: "user", content: q }]);
  assert.strictEqual(resp.persona, "penny");
  assert.ok(resp.content.includes("18.5"));
  assert.ok(resp.content.includes("Route B"));
  assert.ok(resp.content.includes("Route A"));
  assert.ok(!resp.content.includes("Governing Principles:"));
  assert.ok(!resp.content.includes("Sensitivity & Failure Points:"));
  assert.ok(!resp.content.includes("Verification Target:"));
});

test("32. Live Execution: Penny delivers controlled experimental design for cooling systems", async () => {
  const q = "We have two prototype cooling systems. How would you design an experiment to determine which one performs better?";
  const resp = await stubProvider.generateResponse([{ role: "user", content: q }]);
  assert.strictEqual(resp.persona, "penny");
  assert.ok(resp.content.includes("Experimental Test Protocol") || resp.content.includes("test"));
  assert.ok(resp.content.includes("Instrumentation") || resp.content.includes("Sensor") || resp.content.includes("thermocouple"));
});

test("33. Multi-turn: User starts engineering discussion -> Penny claims, then user asks for formal physics equation -> routes to Pete", () => {
  const turn1Query = "I'm designing a small propulsion system and need help prototyping the injector.";
  const dec1 = CognitiveRouter.route(turn1Query, [], options);
  assert.strictEqual(dec1.owner, "penny");

  const turn2Query = "What equation describes the thrust and exhaust velocity from first principles?";
  const dec2 = CognitiveRouter.route(turn2Query, [{ role: "user", content: turn1Query }, { role: "assistant", content: "Penny response", persona: "penny" }], options);
  assert.strictEqual(dec2.owner, "pete");
});

test("34. Multi-turn: After Pete gives equation, user asks how to experimentally test it -> routes back to Penny", () => {
  const turn3Query = "Okay, how would we test that experimentally on the test bench?";
  const history = [
    { role: "user", content: "I'm designing a small propulsion system and need help prototyping the injector." },
    { role: "assistant", content: "Penny response", persona: "penny" },
    { role: "user", content: "What equation describes the thrust and exhaust velocity from first principles?" },
    { role: "assistant", content: "Pete derivation response", persona: "pete" }
  ];
  const dec3 = CognitiveRouter.route(turn3Query, history, options);
  assert.strictEqual(dec3.owner, "penny");
});

test("35. Persona Integrity: Mina math easter egg remains untouched", () => {
  const q = "What is the square root of 15?";
  const bids = CognitiveRouter.evaluatePersonaBids(q, personas);
  const minaBid = bids.find(b => b.id === "mina");
  // Mina must not claim math before revelation
  assert.strictEqual(minaBid, undefined);
});
