#!/usr/bin/env bun
/**
 * Test MCP Context Integration
 */

import { enrichMessageWithContext, formatContextForPrompt, storeLearning } from "./mcp-context";

async function testContextEnrichment() {
  console.log("🧪 Testing MCP Context Integration\n");

  // Test 1: Extract context from a system-related message
  console.log("Test 1: System status message");
  const context1 = await enrichMessageWithContext("What's the system status?");
  console.log(context1);
  console.log("\n---\n");

  // Test 2: Telegram-related message
  console.log("Test 2: Telegram help message");
  const context2 = await enrichMessageWithContext("How do I improve Telegram usage?");
  console.log(context2);
  console.log("\n---\n");

  // Test 3: Learning storage
  console.log("Test 3: Store learning");
  const stored = await storeLearning(
    "MCP context integration improves Telegram responses with semantic memory",
    ["telegram", "mcp", "integration"]
  );
  console.log(`Learning stored: ${stored}`);
  console.log("\n---\n");

  console.log("✅ All tests complete!");
}

testContextEnrichment();
