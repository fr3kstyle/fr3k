#!/usr/bin/env bun
/**
 * PAI Communication Agent - Permanent message handler
 *
 * Runs independently to handle Telegram messages without blocking main PAI work.
 * Provides instant acknowledgment and queues messages for processing.
 */

import { Bot } from "grammy";
import { spawn } from "bun";
import { tracer } from "../observability/tracer.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const MESSAGE_QUEUE_PATH = "/tmp/pai-message-queue.json";
const CONVERSATION_HISTORY_PATH = "/tmp/pai-conversation-history.json";
const VOICE_SERVER = process.env.PAI_VOICE_SERVER || "http://localhost:8888";
const MAX_HISTORY_ENTRIES = 100; // Keep last 100 messages
const DEDUP_WINDOW_MS = 300000; // 5 minutes - check for duplicates within this window

// ============================================================================
// OBSERVABILITY: Enhanced message queue with trace context
// ============================================================================

interface TraceContext {
  traceParent: string;
  traceState?: string;
  traceId: string;
  spanId: string;
}

interface QueuedMessage {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  traceContext?: TraceContext;  // OpenTelemetry trace context for propagation
  username?: string;
  chatId?: string;
  messageId?: number;
  telegramRequest?: boolean;  // Flag to trigger phase notifications during Algorithm execution
}

interface ConversationHistory {
  recentMessages: Array<{
    text: string;
    timestamp: number;
    response?: string;
  }>;
  recentResponses: string[]; // Track recent PAI responses to prevent repetition
}

// In-memory queue with trace context support
let messageQueue: QueuedMessage[] = [];
let conversationHistory: ConversationHistory = {
  recentMessages: [],
  recentResponses: []
};

// Load queue from disk
async function loadQueue() {
  try {
    const data = await Bun.readableStreamToText(Bun.file(MESSAGE_QUEUE_PATH).stream());
    messageQueue = JSON.parse(data) || [];
  } catch {
    messageQueue = [];
  }
}

// Load conversation history from disk
async function loadConversationHistory() {
  try {
    const data = await Bun.readableStreamToText(Bun.file(CONVERSATION_HISTORY_PATH).stream());
    conversationHistory = JSON.parse(data) || {
      recentMessages: [],
      recentResponses: []
    };
  } catch {
    conversationHistory = {
      recentMessages: [],
      recentResponses: []
    };
  }
}

// Save queue to disk
async function saveQueue() {
  await Bun.write(MESSAGE_QUEUE_PATH, JSON.stringify(messageQueue, null, 2));
}

// Save conversation history to disk
async function saveConversationHistory() {
  await Bun.write(CONVERSATION_HISTORY_PATH, JSON.stringify(conversationHistory, null, 2));
}

// Check if message is a duplicate (same or very similar to recent message)
function isDuplicateMessage(text: string): boolean {
  const now = Date.now();
  // Clean text for comparison (lowercase, trim)
  const cleanText = text.toLowerCase().trim();

  // Check if same message was sent within dedup window
  const duplicate = conversationHistory.recentMessages.find(msg => {
    const age = now - msg.timestamp;
    if (age > DEDUP_WINDOW_MS) return false;

    const cleanPrev = msg.text.toLowerCase().trim();
    // Exact match
    if (cleanPrev === cleanText) return true;

    // Similarity check (90%+ similar using simple character overlap)
    const similarity = calculateSimilarity(cleanText, cleanPrev);
    return similarity > 0.9;
  });

  return !!duplicate;
}

// Calculate text similarity (Jaccard-like coefficient)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Check if response is repetitive (similar to recent responses)
function isRepetitiveResponse(response: string): boolean {
  const cleanResponse = response.toLowerCase().trim();

  // Check against recent responses
  for (const recent of conversationHistory.recentResponses.slice(-5)) {
    const cleanRecent = recent.toLowerCase().trim();
    const similarity = calculateSimilarity(cleanResponse, cleanRecent);

    // If 85%+ similar to recent response, it's repetitive
    if (similarity > 0.85) {
      return true;
    }
  }

  return false;
}

// Add message to history
function addToHistory(text: string, response?: string) {
  const now = Date.now();

  // Add to recent messages
  conversationHistory.recentMessages.push({
    text,
    timestamp: now,
    response
  });

  // Add response if provided
  if (response) {
    conversationHistory.recentResponses.push(response);
  }

  // Trim to max size (FIFO)
  if (conversationHistory.recentMessages.length > MAX_HISTORY_ENTRIES) {
    conversationHistory.recentMessages = conversationHistory.recentMessages.slice(-MAX_HISTORY_ENTRIES);
  }
  if (conversationHistory.recentResponses.length > MAX_HISTORY_ENTRIES) {
    conversationHistory.recentResponses = conversationHistory.recentResponses.slice(-MAX_HISTORY_ENTRIES);
  }

  // Save to disk
  saveConversationHistory();
}

// Get conversation statistics
function getConversationStats() {
  return {
    totalMessages: conversationHistory.recentMessages.length,
    totalResponses: conversationHistory.recentResponses.length,
    lastMessageTime: conversationHistory.recentMessages[conversationHistory.recentMessages.length - 1]?.timestamp || 0
  };
}

// Async voice notification (non-blocking)
async function sendVoiceNotification(message: string) {
  // Don't await - fire and forget
  fetch(`${VOICE_SERVER}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      voice_id: "21m00Tcm4TlvDq8ikWAM"
    })
  }).catch(err => console.error("❌ Voice failed:", err));
}

// Initialize bot
const bot = new Bot(BOT_TOKEN);

// Security middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id.toString();
  if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID) {
    await ctx.reply("⛔ Private bot. Access denied.");
    return;
  }
  await next();
});

// Handle all messages
bot.on("message", async (ctx) => {
  const text = ctx.message?.text || "";
  const userId = ctx.from?.id.toString() || "";
  const username = ctx.from?.username || "";
  const chatId = ctx.chat?.id.toString() || "";
  const messageIdNum = ctx.message?.message_id;
  const messageId = `${Date.now()}-${userId}`;

  console.log(`📩 [${new Date().toISOString()}]`, text.substring(0, 60));

  // ============================================================================
  // DEDUPLICATION: Check for duplicate messages
  // ============================================================================
  if (isDuplicateMessage(text)) {
    console.log(`⚠️ Duplicate message detected, skipping: "${text.substring(0, 40)}..."`);
    await ctx.reply("⚠️ This message was already received recently. Skipping duplicate.");
    return;
  }

  // ============================================================================
  // OBSERVABILITY: Create distributed trace span for message receipt
  // ============================================================================
  const span = tracer.span.telegram({
    "telegram.message.id": messageId,
    "telegram.message.text": text,
    "telegram.user.id": userId,
    "telegram.user.username": username,
    "telegram.chat.id": chatId,
  });

  // Generate trace context for propagation through PAI system
  const traceContext = tracer.context.generate();

  span.setAttributes({
    "telegram.message.received_at": new Date().toISOString(),
  });

  // IMMEDIATE acknowledgment (instant reply)
  await ctx.reply("✓ Got it - processing...");
  await ctx.api.sendChatAction(ctx.chat.id, "typing");

  // LIMIT queue size - if too many messages, clear and start fresh
  if (messageQueue.length > 5) {
    console.warn(`⚠️ Queue too large (${messageQueue.length}), clearing stale messages`);
    messageQueue = [];
  }

  // Queue message with trace context for downstream observability
  const queuedMessage: QueuedMessage = {
    id: messageId,
    text,
    userId,
    timestamp: Date.now(),
    traceContext,  // Propagate trace ID through entire PAI pipeline
    username,
    chatId,
    messageId: messageIdNum,
    telegramRequest: true,  // Enable phase notifications during Algorithm execution
  };

  messageQueue.push(queuedMessage);
  await saveQueue();

  // Add to conversation history
  addToHistory(text);

  span.setAttribute("telegram.message.queued", true);
  tracer.span.success(span);
  span.end();

  // Voice notification removed - only notify once during processing phase

  // Signal PAI to process IMMEDIATELY (via file lock)
  await Bun.write("/tmp/pai-new-message.flag", Date.now().toString());
});

// Status command
bot.command("status", async (ctx) => {
  const uptime = process.uptime();
  const queued = messageQueue.length;
  const stats = getConversationStats();

  await ctx.reply(`
📊 PAI Communication Agent Status
━━━━━━━━━━━━━━━━━━━━━
🟢 Status: Online & Monitoring
⏱️ Uptime: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s
📬 Queued: ${queued} messages
💬 History: ${stats.totalMessages} messages, ${stats.totalResponses} responses
🔄 Priority: HIGH (Communication)
🔔 Voice: Active (async)

📋 Available Commands:
/stop - Stop current message, process next
/clear - Clear all messages & restart
/status - Show this status
/clearqueue - Clear message queue only

✨ Always listening, fr3k!
  `.trim());
});

// Clear queue command
bot.command("clearqueue", async (ctx) => {
  const cleared = messageQueue.length;
  messageQueue = [];
  await saveQueue();
  await ctx.reply(`🗑️ Queue cleared! Removed ${cleared} messages.`);
});

// ============================================================================
// PRIORITY COMMANDS - Execute immediately, bypass normal queue processing
// ============================================================================

// /stop - Stop current message and process next in queue
bot.command("stop", async (ctx) => {
  console.log("🛑 /stop command received - stopping current message");

  try {
    // Get current queue size
    const queueSize = messageQueue.length;

    if (queueSize === 0) {
      await ctx.reply("ℹ️ No messages in queue to stop.");
      return;
    }

    // Remove first message (current one being processed)
    const removed = messageQueue.shift();
    await saveQueue();

    console.log(`🛑 Stopped message: "${removed?.text.substring(0, 50)}..."`);

    // Restart main bot to kill current FR3K execution
    const restartResult = spawn({
      cmd: ["systemctl", "--user", "restart", "pai-telegram-bot.service"],
      stdout: "pipe",
      stderr: "pipe",
    });

    // Send immediate confirmation
    await ctx.reply(
      `🛑 **Stopped!**\n\n` +
      `Removed: "${removed?.text.substring(0, 40)}..."\n` +
      `Remaining in queue: ${messageQueue.length}\n` +
      `✅ Restarting to process next message...`
    );

    console.log("✅ /stop command executed - service restarted");
  } catch (error) {
    console.error("❌ /stop command failed:", error);
    await ctx.reply(`❌ Failed to stop: ${error}`);
  }
});

// /clear - Stop everything, clear all messages, restart system
bot.command("clear", async (ctx) => {
  console.log("🧹 /clear command received - clearing everything");

  try {
    const queueSize = messageQueue.length;
    const historySize = conversationHistory.recentMessages.length;

    // Clear queue
    messageQueue = [];
    await saveQueue();

    // Clear conversation history
    conversationHistory = {
      recentMessages: [],
      recentResponses: []
    };
    await saveConversationHistory();

    console.log(`🧹 Cleared ${queueSize} queued messages and ${historySize} history entries`);

    // Restart entire service for clean state
    const restartResult = spawn({
      cmd: ["systemctl", "--user", "restart", "pai-telegram-bot.service"],
      stdout: "pipe",
      stderr: "pipe",
    });

    // Send immediate confirmation
    await ctx.reply(
      `🧹 **System Cleared!**\n\n` +
      `✅ Removed ${queueSize} queued messages\n` +
      `✅ Cleared ${historySize} conversation history entries\n` +
      `✅ Restarting for fresh start...\n\n` +
      `🔄 Ready for new messages!`
    );

    console.log("✅ /clear command executed - service restarted");
  } catch (error) {
    console.error("❌ /clear command failed:", error);
    await ctx.reply(`❌ Failed to clear: ${error}`);
  }
});

// Get next message from queue with trace context
export async function getNextMessage(): Promise<QueuedMessage | null> {
  if (messageQueue.length === 0) return null;
  const msg = messageQueue.shift();
  await saveQueue();
  return msg || null;
}

// Get queue size
export function getQueueSize(): number {
  return messageQueue.length;
}

// Export conversation history functions for other agents
export { conversationHistory, addToHistory, isRepetitiveResponse, getConversationStats };

// Only start bot when this file is executed directly, not when imported
if (import.meta.main) {
  // Start bot
  console.log("🤖 PAI Communication Agent Starting...");
  await loadQueue();
  await loadConversationHistory();
  bot.start();
  console.log("✅ Communication Agent ready! Priority monitoring active.");
  console.log(`📚 Loaded ${conversationHistory.recentMessages.length} messages from history`);
  // Skip startup notification - proactive agent will report status

  // Keep process alive
  const shutdown = () => {
    console.log("\n🛑 Communication Agent shutting down...");
    bot.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
