/*
    test_conversation_export.js

    Unit and Integration Test Suite for Conversation Thread Export (Markdown, JSON, Plain Text).
*/

const assert = require('assert');

async function runExportTests() {
  console.log("=== LANZAR Conversation Thread Export Test Suite ===");

  const { ConversationManager } = await import('../js/conversations/conversation-manager.js');

  const manager = new ConversationManager();
  
  // Set up an active conversation for testing
  const mockConversation = {
    id: "conv_test_export_99",
    title: "Aerospike Combustion Chamber Analysis",
    userId: "user_dr_vance",
    updatedAt: "2026-08-28T19:00:00.000Z",
    messages: [
      {
        id: "msg_1",
        role: "user",
        content: "How should we design the regenerative cooling channels for the aerospike nozzle?",
        timestamp: "2026-08-28T19:00:01.000Z"
      },
      {
        id: "msg_2",
        role: "assistant",
        persona: "penny",
        authorName: "Penny",
        content: "Let's use 3D-printed gyroid TPMS ribs to maximize internal coolant surface area! 🚀",
        timestamp: "2026-08-28T19:00:02.000Z"
      },
      {
        id: "msg_3",
        role: "assistant",
        persona: "pete",
        authorName: "Pete",
        content: "Calculated heat flux at the spike base is 52.4 MW/m². GRCop-84 liner with 1.2mm wall thickness satisfies the structural safety margin. 📐",
        timestamp: "2026-08-28T19:00:03.000Z"
      },
      {
        id: "msg_4",
        role: "assistant",
        persona: "mina",
        authorName: "Mina",
        content: "I have prepared the CC-402 vector blueprint with high-contrast cel-shaded styling! ✦",
        timestamp: "2026-08-28T19:00:04.000Z"
      }
    ],
    commandHistory: [
      "How should we design the regenerative cooling channels for the aerospike nozzle?"
    ]
  };

  // Test 1: Markdown Export
  console.log("Test 1: Exporting active thread as Markdown...");
  const md = ConversationManager.formatConversation(mockConversation, 'markdown');
  
  assert(md.includes("# LANZAR AI — Conversation Transcript"), "Must contain Markdown title");
  assert(md.includes("Aerospike Combustion Chamber Analysis"), "Must contain thread title");
  assert(md.includes("### 👤 You"), "Must format User author badge");
  assert(md.includes("### 👩‍🚀 Penny (Possibility & Experiments)"), "Must format Penny author badge");
  assert(md.includes("### 🔬 Pete (Analysis & Systems)"), "Must format Pete author badge");
  assert(md.includes("### 🎨 Mina (Art Direction & Soul)"), "Must format Mina author badge");
  console.log("✓ Markdown export verified with rich character metadata and formatting");

  // Test 2: JSON Export
  console.log("Test 2: Exporting active thread as JSON...");
  const jsonStr = ConversationManager.formatConversation(mockConversation, 'json');
  const parsed = JSON.parse(jsonStr);
  assert.strictEqual(parsed.id, "conv_test_export_99");
  assert.strictEqual(parsed.messages.length, 4);
  assert.strictEqual(parsed.messages[1].persona, "penny");
  console.log("✓ JSON export verified with full structural schema integrity");

  // Test 3: Plain Text Export
  console.log("Test 3: Exporting active thread as Plain Text...");
  const txt = ConversationManager.formatConversation(mockConversation, 'text');
  assert(txt.includes("LANZAR AI — CONVERSATION TRANSCRIPT"), "Must contain plain text header");
  assert(txt.includes("[YOU]"), "Must contain [YOU] author tag");
  assert(txt.includes("[Penny]"), "Must contain [Penny] author tag");
  assert(txt.includes("[Pete]"), "Must contain [Pete] author tag");
  console.log("✓ Plain text export verified");

  console.log("\n>>> ALL 3 CONVERSATION EXPORT TESTS PASSED CLEANLY! <<<");
}

runExportTests().catch(err => {
  console.error("Export Test Suite Failed:", err);
  process.exit(1);
});
