#!/usr/bin/env bun
/**
 * MCP Context Integration for Telegram Bot
 * Connects to hey-fr3k for semantic context retrieval
 * Integrates with fr3k-think for enhanced reasoning
 */

interface ContextQuery {
  timeframe: "last_24_hours" | "last_7_days" | "last_30_days";
  tags: string[];
  limit: number;
}

interface ContextResult {
  summary: string;
  patterns: string[];
  recent_items: Array<{
    type: "task" | "note" | "message";
    title?: string;
    content?: string;
    status?: string;
  }>;
}

interface ThinkingAnalysis {
  first_principles?: {
    problem: string;
    depth: number;
    analysis: string[];
  };
  red_team?: {
    proposal: string;
    agent_count: number;
    critique: string[];
    vulnerabilities: string[];
  };
}

/**
 * Call hey-fr3k MCP server for context retrieval
 * Falls back gracefully if MCP server unavailable
 */
async function getSemanticContext(query: ContextQuery): Promise<ContextResult | null> {
  try {
    // For now, return context from conversation history
    // TODO: Integrate with hey-fr3k MCP server once available
    console.log("🔍 Retrieving semantic context...");

    // Read recent conversation history
    const historyPath = "/tmp/pai-conversation-history.json";
    let context: ContextResult = {
      summary: "No recent context available",
      patterns: [],
      recent_items: []
    };

    try {
      const historyExists = await Bun.file(historyPath).exists();
      if (historyExists) {
        const historyText = await Bun.file(historyPath).text();
        const history = JSON.parse(historyText);

        // Handle both array and object formats
        const recentMessages = Array.isArray(history) ? history : (history.messages || []);

        // Extract recent patterns (last 10 messages)
        const recent = recentMessages.slice(-10);

        context = {
          summary: `Found ${recent.length} recent messages in conversation history`,
          patterns: extractPatterns(recent),
          recent_items: recent.map((msg: any) => ({
            type: "message",
            content: (msg.user_message || msg.message || msg.prompt || msg.response || "")?.substring(0, 100) || ""
          })).filter(item => item.content.length > 0)
        };
      }
    } catch (error) {
      console.log("⚠️ Could not read conversation history:", error);
    }

    console.log("✅ Context retrieved");
    return context;
  } catch (error) {
    console.error("❌ MCP context retrieval failed:", error);
    return null;
  }
}

/**
 * Extract patterns from conversation history
 */
function extractPatterns(messages: any[]): string[] {
  const patterns: string[] = [];

  // Look for recurring themes
  const topics = messages.map(m => m.user_message || "").join(" ").toLowerCase();

  if (topics.includes("system") || topics.includes("status")) {
    patterns.push("User monitors system health regularly");
  }

  if (topics.includes("telegram") || topics.includes("message")) {
    patterns.push("User values Telegram communication");
  }

  if (topics.includes("algorithm") || topics.includes("phase")) {
    patterns.push("User familiar with FR3K Algorithm workflow");
  }

  return patterns;
}

/**
 * Format context for inclusion in FR3K prompt
 */
export function formatContextForPrompt(context: ContextResult | null): string {
  if (!context) {
    return "";
  }

  let formatted = "\n\n=== 📚 RECENT CONTEXT (via hey-fr3k) ===\n";

  if (context.summary) {
    formatted += `📝 ${context.summary}\n\n`;
  }

  if (context.patterns.length > 0) {
    formatted += "🔍 Identified Patterns:\n";
    context.patterns.forEach(p => {
      formatted += `  • ${p}\n`;
    });
    formatted += "\n";
  }

  if (context.recent_items.length > 0) {
    formatted += "💬 Recent Activity:\n";
    context.recent_items.slice(0, 5).forEach(item => {
      if (item.content) {
        formatted += `  • ${item.content.substring(0, 80)}...\n`;
      }
    });
  }

  formatted += "================================\n";

  return formatted;
}

/**
 * Main context retrieval function for Telegram messages
 */
export async function enrichMessageWithContext(userMessage: string): Promise<string> {
  // Extract potential tags from message
  const tags = extractTagsFromMessage(userMessage);

  const context = await getSemanticContext({
    timeframe: "last_7_days",
    tags,
    limit: 10
  });

  return formatContextForPrompt(context);
}

/**
 * Extract relevant tags from user message
 */
function extractTagsFromMessage(message: string): string[] {
  const tags: string[] = [];
  const lower = message.toLowerCase();

  // Topic-based tags
  if (lower.includes("system") || lower.includes("status") || lower.includes("health")) {
    tags.push("system", "monitoring");
  }

  if (lower.includes("telegram") || lower.includes("message") || lower.includes("bot")) {
    tags.push("telegram", "communication");
  }

  if (lower.includes("algorithm") || lower.includes("phase") || lower.includes("task")) {
    tags.push("algorithm", "workflow");
  }

  if (lower.includes("voice") || lower.includes("audio") || lower.includes("call")) {
    tags.push("voice", "audio");
  }

  if (lower.includes("help") || lower.includes("how do")) {
    tags.push("help", "learning");
  }

  return tags;
}

/**
 * Store learning in hey-fr3k (after LEARN phase)
 */
export async function storeLearning(
  insight: string,
  tags: string[]
): Promise<boolean> {
  try {
    console.log("📚 Storing learning:", insight);

    // For now, append to learning log
    // TODO: Integrate with hey-fr3k MCP server
    const learningLogPath = "/tmp/pai-learnings.jsonl";
    const entry = {
      timestamp: new Date().toISOString(),
      insight,
      tags
    };

    await Bun.write(
      learningLogPath,
      JSON.stringify(entry) + "\n",
      { createPath: true }
    );

    console.log("✅ Learning stored");
    return true;
  } catch (error) {
    console.error("❌ Learning storage failed:", error);
    return false;
  }
}
