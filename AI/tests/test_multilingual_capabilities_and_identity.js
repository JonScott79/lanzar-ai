/*
    test_multilingual_capabilities_and_identity.js

    Tests for LANZAR Multilingual Conversation, Voice Preservation, and Language Agnosticism.
*/

import test from 'node:test';
import assert from 'node:assert/strict';

import { PennyPersona } from '../js/personas/penny.js';
import { PetePersona } from '../js/personas/pete.js';
import { MinaPersona } from '../js/personas/mina.js';
import { CognitiveRouter } from '../js/models/cognitive-router.js';

console.log("================================================================================");
console.log("   LANZAR AI — MULTILINGUAL CAPABILITIES & CHARACTER PRESERVATION TEST SUITE");
console.log("================================================================================\n");

// -------------------------------------------------------------------------
// 1. Character Identity & Multilingual Behavioral Guidance
// -------------------------------------------------------------------------
test("All canonical character personas include native multilingual instructions", () => {
  const penny = new PennyPersona();
  const pete = new PetePersona();
  const mina = new MinaPersona();

  const pennyPrompt = penny.getSystemPrompt();
  const petePrompt = pete.getSystemPrompt();
  const minaPrompt = mina.getSystemPrompt();

  assert.ok(pennyPrompt.includes("Multilingual by Nature"), "Penny must include multilingual responsiveness rule");
  assert.ok(petePrompt.includes("Multilingual by Nature"), "Pete must include multilingual responsiveness rule");
  assert.ok(minaPrompt.includes("Multilingual by Nature"), "Mina must include multilingual responsiveness rule");

  // Verify voice preservation instructions
  assert.ok(pennyPrompt.includes("Penny personality"), "Penny prompt must require voice preservation");
  assert.ok(petePrompt.includes("Pete personality"), "Pete prompt must require voice preservation");
  assert.ok(minaPrompt.includes("Mina personality"), "Mina prompt must require voice preservation");
});

// -------------------------------------------------------------------------
// 2. Language-Agnostic Cognitive Routing
// -------------------------------------------------------------------------
test("Cognitive Router routes by intent and domain regardless of input language", () => {
  // Explicit mentions across languages
  const esMention = CognitiveRouter.route("Penny, ¿puedes ayudarme con este motor?", []);
  assert.strictEqual(esMention.owner, "penny", "Spanish explicit mention must route to Penny");

  const deMention = CognitiveRouter.route("Pete, wie funktioniert die Thermodynamik?", []);
  assert.strictEqual(deMention.owner, "pete", "German explicit mention must route to Pete");

  const jaMention = CognitiveRouter.route("ミナ, デザインのカラーパレットを教えて", []);
  // Japanese explicit name detection or domain
  assert.ok(["mina", "dual", "triad"].includes(jaMention.owner));
});

// -------------------------------------------------------------------------
// 3. Translation Directness
// -------------------------------------------------------------------------
test("Translation prompts preserve character responsibility without falling back to Core", () => {
  const pennyPrompt = new PennyPersona().getSystemPrompt();
  assert.ok(pennyPrompt.includes("translate"), "Penny system prompt must explicitly support translation on request");

  const petePrompt = new PetePersona().getSystemPrompt();
  assert.ok(petePrompt.includes("translate"), "Pete system prompt must explicitly support translation on request");

  const minaPrompt = new MinaPersona().getSystemPrompt();
  assert.ok(minaPrompt.includes("translate"), "Mina system prompt must explicitly support translation on request");
});
