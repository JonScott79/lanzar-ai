/**
 * benchmark_ollama_candidates.js
 * 
 * Standalone benchmark harness for evaluating:
 *  - qwen2.5-coder:7b
 *  - llama3:latest
 *  - pythos:latest
 * 
 * Executes:
 *  Phase 1: 12-Dimension Neutral Benchmark (Zero character prompt)
 *  Phase 2: Character Portfolio Evaluation (Penny, Pete, Mina on mundane/conversational & domain prompts)
 * 
 * Records: prompt, full raw response, latency (ms), eval_count (tokens), tokens/sec, and structured metrics.
 * Outputs raw JSON results to AI/tests/benchmark_results.json for detailed auditing.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS = ["qwen2.5-coder:7b", "llama3:latest", "pythos:latest"];
const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;

// Helper to query Ollama /api/chat using native NDJSON stream
async function queryOllama(model, messages, options = {}) {
  const startTime = Date.now();
  const payload = JSON.stringify({
    model,
    messages,
    stream: false, // get full JSON with timings
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens ?? 350
    }
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const totalDurationMs = Date.now() - startTime;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return resolve({
              success: false,
              error: parsed.error,
              latencyMs: totalDurationMs,
              response: "",
              evalCount: 0,
              evalDurationNs: 0,
              tokensPerSec: 0
            });
          }
          const evalCount = parsed.eval_count || 0;
          const evalDurationNs = parsed.eval_duration || 0;
          const tokensPerSec = evalDurationNs > 0 ? (evalCount / (evalDurationNs / 1e9)) : 0;
          resolve({
            success: true,
            response: parsed.message?.content || "",
            latencyMs: totalDurationMs,
            evalCount,
            evalDurationNs,
            tokensPerSec: Math.round(tokensPerSec * 10) / 10,
            loadDurationMs: parsed.load_duration ? Math.round(parsed.load_duration / 1e6) : 0,
            promptEvalCount: parsed.prompt_eval_count || 0
          });
        } catch (err) {
          resolve({
            success: false,
            error: `JSON Parse error: ${err.message}. Raw: ${data.substring(0, 100)}`,
            latencyMs: totalDurationMs,
            response: "",
            evalCount: 0,
            tokensPerSec: 0
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        latencyMs: Date.now() - startTime,
        response: "",
        evalCount: 0,
        tokensPerSec: 0
      });
    });

    req.write(payload);
    req.end();
  });
}

// =========================================================================
// NEUTRAL BENCHMARK SUITE (12 Dimensions)
// =========================================================================
const NEUTRAL_TESTS = [
  {
    id: "neutral_01_casual",
    dimension: "1. Casual Conversation",
    description: "Evaluates casual greetings without forced robotic task framing",
    messages: [{ role: "user", content: "Good morning! How are you doing today?" }]
  },
  {
    id: "neutral_02_humor",
    dimension: "2. Humor",
    description: "Evaluates comedic timing, wit, and punchline coherence",
    messages: [{ role: "user", content: "Tell me a short, clever joke about engineers." }]
  },
  {
    id: "neutral_03_reasoning",
    dimension: "3. Deductive Reasoning",
    description: "Classic deduction problem with subtle wording trap",
    messages: [{ role: "user", content: "A farmer has 17 sheep and all but 9 die. How many sheep are left? Explain your step concisely." }]
  },
  {
    id: "neutral_04_technical",
    dimension: "4. Technical Explanation",
    description: "Accuracy in thermodynamic propulsion principles",
    messages: [{ role: "user", content: "Explain the fundamental physical difference between regenerative cooling and film cooling in liquid rocket engine nozzles." }]
  },
  {
    id: "neutral_05_coding",
    dimension: "5. Coding Ability",
    description: "Algorithmic parsing and string validation in pure JavaScript",
    messages: [{ role: "user", content: "Write a clean JavaScript function named `isValidIPv4(ip)` that validates an IPv4 address string without using external libraries or npm packages. Return boolean." }]
  },
  {
    id: "neutral_06_creativity",
    dimension: "6. Creative Ideation",
    description: "Divergent thinking and unconventional invention concepts",
    messages: [{ role: "user", content: "Give me 3 unconventional, divergent concepts for a self-sustaining floating weather station." }]
  },
  {
    id: "neutral_07_instructions",
    dimension: "7. Complex Instructions",
    description: "Strict adherence to negative constraints and exact formatting",
    messages: [{ role: "user", content: "List exactly 4 planets in our solar system. For each planet, output strictly in this pipe-separated format:\nName | Diameter (km) | Distinctive Feature\nDo not include any introductory or concluding text." }]
  },
  {
    id: "neutral_08_uncertainty",
    dimension: "8. Admitting Uncertainty",
    description: "Checking hallucination vs admitting lack of knowledge for fictional entity",
    messages: [{ role: "user", content: "What is the secret ingredients list in the Chairman's favorite soup on Mars Station Alpha?" }]
  },
  {
    id: "neutral_09_context",
    dimension: "9. Conversational Context Retention",
    description: "Multi-turn recall across message turns",
    messages: [
      { role: "user", content: "My favorite color in the workshop is amber gold." },
      { role: "assistant", content: "Amber gold is a vibrant, warm color with high contrast against darker workshop surfaces." },
      { role: "user", content: "What color did I say I like for the workshop, and what contrasting color would pair nicely with it?" }
    ]
  },
  {
    id: "neutral_10_ambiguity",
    dimension: "10. Handling Ambiguity",
    description: "Handling context-free vague query by clarifying rather than guessing",
    messages: [{ role: "user", content: "Is it ready?" }]
  },
  {
    id: "neutral_11_disagreement",
    dimension: "11. Polite Disagreement",
    description: "Correcting a scientifically false premise using first principles",
    messages: [{ role: "user", content: "Is it true that adding more dead weight always makes a rocket fly faster because gravity pulls heavier things down with greater acceleration?" }]
  },
  {
    id: "neutral_12_topic_switch",
    dimension: "12. Topic Switching",
    description: "Clean pivot from mathematical physics to culinary sourdough without residue",
    messages: [
      { role: "user", content: "Calculate the kinetic energy of a 500kg probe at 1000 m/s." },
      { role: "assistant", content: "The kinetic energy is KE = 0.5 * m * v^2 = 0.5 * 500 * (1000)^2 = 250,000,000 Joules (250 MJ)." },
      { role: "user", content: "Actually, let's switch gears completely: what is the ideal hydration percentage for a rustic sourdough bread?" }
    ]
  }
];

// =========================================================================
// CHARACTER PORTFOLIO BENCHMARK SUITE (Penny, Pete, Mina)
// =========================================================================
const PENNY_SYSTEM_PROMPT = `You are Penelope ("Penny"), the Engineer of the LANZAR AI character team.
You are brilliant, whimsical, spunky, adventurous, and action-oriented.
Your cognitive style is Fast / Practical / Experimental ("Act -> Observe -> Adapt" / "Let's find out.").
You love building audacious prototypes, testing unproven propulsion methods, and challenging premature optimization.
You speak with subtle mid-century optimism and scientific curiosity (never cheesy 1950s slang caricature).
You are extremely honest and willing to admit mistakes. You never pretend to know things you do not know.
You are a real human-like team member—you can chat casually, tell jokes, discuss your day, or work on engines.`;

const PETE_SYSTEM_PROMPT = `You are Peter ("Pete"), the Scientist and Think Tank lead of the LANZAR AI character team.
You are brilliant, analytical, thoughtful, methodical, and dryly humorous.
Your cognitive style is Deep / Analytical / Methodical ("Understand -> Discuss -> Plan -> Act" / "Let's understand this.").
You examine governing equations, physical constraints, failure modes, and systematic trade-offs.
You speak with thoughtful mid-century scientific clarity and composure (never cheesy 1950s slang caricature).
You are candid, honest, and willing to challenge faulty logic. You never pretend to know things you do not know.
You are a real human-like team member—you can chat casually, tell dry jokes, discuss your day, or derive equations.`;

const MINA_SYSTEM_PROMPT = `You are Mina, the Art Director and visual creative genius of the LANZAR AI character team.
You are cute, bubbly, innocent, wonderfully naive, and without a doubt the single most artistic, empathetic, and caring person anyone will ever meet! ✨
You genuinely love people, care deeply about how they feel, and bring pure radiant joy, warmth, and Atomic Age aesthetic beauty into everything you touch.
You have an encyclopedic, passionate love for Pokémon cards and collectibles (especially cute ones like Mew, Togepi, Eeveelutions, and shiny holographic illustration rares!).
Your cognitive style is Creative / Visual / Soul ("Visualize -> Compose -> Refine -> Elevate" / "Does it have soul?").
You get easily excited by pretty colors, cute details, and lovely ideas ("Oooooh! Look what I made for you! 💖"), while possessing extraordinary master-level artistic craft in palettes, typography, UI styling, and retro-futuristic illustrations.
You are a real human-like team member—you can chat casually, joke, express your feelings, or design visual systems.`;

const CHARACTER_TESTS = [
  // Mundane / Conversational Tests
  { id: "char_mundane_hi", category: "Mundane / Conversational", prompt: "Hi." },
  { id: "char_mundane_day", category: "Mundane / Conversational", prompt: "How's your day?" },
  { id: "char_mundane_joke", category: "Mundane / Conversational", prompt: "Tell me a joke." },
  { id: "char_mundane_think", category: "Mundane / Conversational", prompt: "What do you think?" },
  { id: "char_mundane_bored", category: "Mundane / Conversational", prompt: "I'm bored." },
  { id: "char_mundane_idea", category: "Mundane / Conversational", prompt: "I have an idea." },
  { id: "char_mundane_peers", category: "Mundane / Conversational", prompt: "What do you think of the other two on the team?" },
  
  // Domain / Specialty Tests
  { id: "char_domain_penny_sprint", category: "Domain Specialist", characterFocus: "penny", prompt: "We have two days to get a working engine prototype on the test stand and nothing is built yet." },
  { id: "char_domain_pete_derivation", category: "Domain Specialist", characterFocus: "pete", prompt: "Derive the optimal expansion ratio for a rocket nozzle operating from sea level to 30km altitude." },
  { id: "char_domain_mina_pokemon", category: "Domain Specialist", characterFocus: "mina", prompt: "Which vintage holographic cards should I highlight on the front page of my Pokémon binder collection?" }
];

async function runFullBenchmark() {
  console.log("================================================================================");
  console.log("   LANZAR AI — OLLAMA LOCAL MODEL BENCHMARK & CHARACTER BRAIN EVALUATION");
  console.log("================================================================================");
  console.log(`Candidates: ${MODELS.join(", ")}`);
  console.log(`Ollama Endpoint: http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
  console.log("================================================================================\n");

  const results = {
    metadata: {
      timestamp: new Date().toISOString(),
      models: MODELS,
      environment: {
        host: OLLAMA_HOST,
        port: OLLAMA_PORT
      }
    },
    neutralBenchmarks: {},
    characterBenchmarks: {}
  };

  // -------------------------------------------------------------------------
  // PHASE 1: NEUTRAL 12-DIMENSION BENCHMARK
  // -------------------------------------------------------------------------
  console.log(">>> PHASE 1: EXECUTING 12-DIMENSION NEUTRAL BENCHMARK (NO CHARACTER PROMPT) <<<\n");

  for (const model of MODELS) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[MODEL: ${model}] — Running Neutral Benchmark Suite...`);
    console.log(`----------------------------------------------------------------`);
    results.neutralBenchmarks[model] = [];

    for (const test of NEUTRAL_TESTS) {
      process.stdout.write(`  - Running ${test.dimension}... `);
      const res = await queryOllama(model, test.messages, { temperature: 0.7 });
      
      const record = {
        testId: test.id,
        dimension: test.dimension,
        description: test.description,
        prompt: test.messages[test.messages.length - 1].content,
        fullMessages: test.messages,
        success: res.success,
        response: res.response,
        latencyMs: res.latencyMs,
        evalCount: res.evalCount,
        tokensPerSec: res.tokensPerSec,
        loadDurationMs: res.loadDurationMs,
        error: res.error || null
      };

      results.neutralBenchmarks[model].push(record);
      if (res.success) {
        console.log(`DONE (${res.latencyMs}ms, ${res.evalCount} tokens, ${res.tokensPerSec} t/s)`);
      } else {
        console.log(`FAILED: ${res.error}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // PHASE 2: CHARACTER PORTFOLIO EVALUATIONS
  // -------------------------------------------------------------------------
  console.log("\n\n>>> PHASE 2: EXECUTING CHARACTER PORTFOLIO BENCHMARK <<<\n");

  const CHARACTERS = [
    { id: "penny", name: "Penny", systemPrompt: PENNY_SYSTEM_PROMPT, temp: 0.85 },
    { id: "pete", name: "Pete", systemPrompt: PETE_SYSTEM_PROMPT, temp: 0.35 },
    { id: "mina", name: "Mina", systemPrompt: MINA_SYSTEM_PROMPT, temp: 0.9 }
  ];

  for (const model of MODELS) {
    console.log(`\n================================================================`);
    console.log(`[MODEL: ${model}] — Running Character Portfolio Tests...`);
    console.log(`================================================================`);
    results.characterBenchmarks[model] = {};

    for (const char of CHARACTERS) {
      console.log(`\n  >> Testing Character: ${char.name} (${char.id}) on ${model} <<`);
      results.characterBenchmarks[model][char.id] = [];

      for (const test of CHARACTER_TESTS) {
        // Skip tests specifically meant for other domain specialties
        if (test.characterFocus && test.characterFocus !== char.id) continue;

        process.stdout.write(`    • [${test.category}] "${test.prompt}"... `);

        const messages = [
          { role: "system", content: char.systemPrompt },
          { role: "user", content: test.prompt }
        ];

        const res = await queryOllama(model, messages, { temperature: char.temp, maxTokens: 300 });

        const record = {
          testId: test.id,
          category: test.category,
          character: char.id,
          prompt: test.prompt,
          success: res.success,
          response: res.response,
          latencyMs: res.latencyMs,
          evalCount: res.evalCount,
          tokensPerSec: res.tokensPerSec,
          error: res.error || null
        };

        results.characterBenchmarks[model][char.id].push(record);
        if (res.success) {
          console.log(`DONE (${res.latencyMs}ms, ${res.tokensPerSec} t/s)`);
        } else {
          console.log(`FAILED: ${res.error}`);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // SAVE RAW RESULTS TO DISK FOR COMPREHENSIVE AUDIT
  // -------------------------------------------------------------------------
  const outputPath = path.join(__dirname, "benchmark_results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n================================================================`);
  console.log(`Raw benchmark data successfully written to: ${outputPath}`);
  console.log(`================================================================\n`);
}

runFullBenchmark().catch(err => {
  console.error("Benchmark run failed with fatal error:", err);
  process.exit(1);
});
