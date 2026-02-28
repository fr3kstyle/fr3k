#!/usr/bin/env bun
/**
 * FR3K Telegram Main Bot
 *
 * Purpose: Processes queued messages through FR3K and sends full responses.
 * This is the primary interface for interacting with FR3K via Telegram.
 *
 * Architecture:
 * - Monitors message queue from communication agent
 * - Calls FR3K with each message
 * - Sends complete responses back to user
 * - Handles long-running tasks (60+ seconds is acceptable)
 */

import { Bot, GrammyError } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const USER_ID = process.env.TELEGRAM_USER_ID || "";
const QUEUE_FILE = "/tmp/pai-message-queue.json";
const MESSAGE_FLAG = "/tmp/pai-new-message.flag";
const FR3K_API_URL = process.env.FR3K_API_URL || "http://localhost:3000/api";

interface QueuedMessage {
  id: string;
  user_id: number;
  username: string;
  message: string;
  timestamp: number;
  processed: boolean;
}

/**
 * Call FR3K API with user message
 */
async function callFR3K(message: string): Promise<string> {
  // This would integrate with your actual FR3K system
  // For now, return a placeholder response

  // TODO: Implement actual FR3K API call
  // const response = await fetch(FR3K_API_URL, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ message, user_id: USER_ID }),
  // });
  // const data = await response.json();
  // return data.response;

  return `🤖 FR3K Response to: "${message}"\n\n[This is where FR3K's actual response would appear. Integrate with your FR3K API endpoint.]`;
}

/**
 * Process message queue
 */
async function processMessageQueue(bot: Bot): Promise<void> {
  // Check if flag exists (new message notification)
  if (!require("fs").existsSync(MESSAGE_FLAG)) {
    return;
  }

  // Read queue
  if (!require("fs").existsSync(QUEUE_FILE)) {
    return;
  }

  const queueData = JSON.parse(
    require("fs").readFileSync(QUEUE_FILE, "utf-8")
  );

  const pendingMessages = queueData.messages.filter(
    (m: QueuedMessage) =>
      !m.processed && m.user_id.toString() === USER_ID
  );

  if (pendingMessages.length === 0) {
    // Clear flag if no messages to process
    require("fs").unlinkSync(MESSAGE_FLAG);
    return;
  }

  for (const msg of pendingMessages) {
    try {
      console.log(`🔄 Processing message: ${msg.id}`);
      console.log(`📝 Content: ${msg.message.substring(0, 100)}...`);

      // Send "typing" indicator
      await bot.api.sendChatAction(USER_ID, "typing");

      // Call FR3K
      const response = await callFR3K(msg.message);

      // Send response (split if too long for Telegram)
      const maxLength = 4000;
      if (response.length > maxLength) {
        const chunks = response.match(/.{1,4000}/g) || [];
        for (const chunk of chunks) {
          await bot.api.sendMessage(USER_ID, chunk);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } else {
        await bot.api.sendMessage(USER_ID, response);
      }

      // Mark as processed
      msg.processed = true;
      console.log(`✅ Response sent for: ${msg.id}`);
    } catch (error) {
      console.error(`❌ Error processing message ${msg.id}:`, error);

      // Send error notification
      try {
        await bot.api.sendMessage(
          USER_ID,
          `❌ Error processing your message: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } catch (sendError) {
        console.error("Failed to send error notification:", sendError);
      }
    }
  }

  // Save updated queue
  require("fs").writeFileSync(
    QUEUE_FILE,
    JSON.stringify({ messages: queueData.messages }, null, 2)
  );

  // Clear flag
  if (require("fs").existsSync(MESSAGE_FLAG)) {
    require("fs").unlinkSync(MESSAGE_FLAG);
  }
}

/**
 * Initialize main bot
 */
async function init() {
  console.log("🤖 FR3K Main Bot Starting...");

  // Validate configuration
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable not set");
  }

  if (!USER_ID) {
    throw new Error("TELEGRAM_USER_ID environment variable not set");
  }

  // Initialize queue file
  if (!require("fs").existsSync(QUEUE_FILE)) {
    require("fs").writeFileSync(
      QUEUE_FILE,
      JSON.stringify({ messages: [] }, null, 2)
    );
  }

  // Create bot instance (for sending messages only)
  const bot = new Bot(BOT_TOKEN);
  bot.api.config.use(autoRetry({
    maxRetryAttempts: 3,
    maxDelaySeconds: 60,
  }));

  // Process queue every 2 seconds
  setInterval(async () => {
    await processMessageQueue(bot);
  }, 2000);

  console.log(`✅ Main bot running (user: ${USER_ID})`);
  console.log(`🔄 Monitoring queue: ${QUEUE_FILE}`);

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\n🛑 Main bot stopping...");
    process.exit(0);
  });
}

// Start bot
init().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
