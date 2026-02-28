#!/usr/bin/env bun
/**
 * FR3K Telegram Communication Agent
 *
 * Purpose: Instant acknowledgment agent that provides immediate feedback
 * to users while main bot processes their requests. Runs independently
 * and queues messages for processing by main bot.
 *
 * Architecture:
 * - Receives messages via Grammy (Telegram bot framework)
 * - Sends instant acknowledgment with typing indicator
 * - Queues message for main bot processing
 * - Never blocks - returns immediately
 */

import { Bot, GrammyError } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const USER_ID = process.env.TELEGRAM_USER_ID || "";
const QUEUE_FILE = "/tmp/pai-message-queue.json";
const MESSAGE_FLAG = "/tmp/pai-new-message.flag";

interface QueuedMessage {
  id: string;
  user_id: number;
  username: string;
  message: string;
  timestamp: number;
  processed: boolean;
  telegramRequest?: boolean;  // Flag to trigger phase notifications during Algorithm execution
}

/**
 * Queue a message for main bot processing
 */
function queueMessage(userId: number, username: string, text: string): void {
  const messages: QueuedMessage[] = require(QUEUE_FILE).messages || [];

  const newMessage: QueuedMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    username: username || "unknown",
    message: text,
    timestamp: Date.now(),
    processed: false,
    telegramRequest: true,  // Enable phase notifications during Algorithm execution
  };

  messages.push(newMessage);

  // Save to queue file
  require("fs").writeFileSync(
    QUEUE_FILE,
    JSON.stringify({ messages }, null, 2)
  );

  // Set flag for main bot
  require("fs").writeFileSync(MESSAGE_FLAG, Date.now().toString());

  console.log(`✅ Message queued: ${newMessage.id}`);
}

/**
 * Initialize communication agent
 */
async function init() {
  console.log("🤖 FR3K Communication Agent Starting...");

  // Validate configuration
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable not set");
  }

  if (!USER_ID) {
    throw new Error("TELEGRAM_USER_ID environment variable not set");
  }

  // Initialize queue file if it doesn't exist
  if (!require("fs").existsSync(QUEUE_FILE)) {
    require("fs").writeFileSync(
      QUEUE_FILE,
      JSON.stringify({ messages: [] }, null, 2)
    );
  }

  // Create bot instance
  const bot = new Bot(BOT_TOKEN);

  // Auto-retry on rate limits
  bot.api.config.use(autoRetry({
    maxRetryAttempts: 3,
    maxDelaySeconds: 60,
  }));

  // Message handler
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const text = ctx.message.text;

    // Verify user is authorized
    if (userId?.toString() !== USER_ID) {
      console.log(`⚠️ Unauthorized access attempt from: ${userId}`);
      return;
    }

    console.log(`📨 Message received: ${text.substring(0, 50)}...`);

    try {
      // Send instant acknowledgment with typing indicator
      await ctx.sendChatAction("typing");

      // Queue message for main bot
      queueMessage(userId!, username || "", text);

      console.log(`✅ Acknowledgment sent, message queued`);
    } catch (error) {
      if (error instanceof GrammyError) {
        console.error(`❌ Grammy error: ${error.description}`);
      } else {
        console.error(`❌ Error processing message:`, error);
      }
    }
  });

  // Error handler
  bot.catch((err) => {
    console.error(`❌ Bot error:`, err);
  });

  // Start bot
  console.log(`✅ Communication agent running (user: ${USER_ID})`);
  await bot.start();

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\n🛑 Communication agent stopping...");
    bot.stop();
    process.exit(0);
  });
}

// Start agent
init().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
