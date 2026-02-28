#!/usr/bin/env bun
/**
 * FR3K Telegram Voice Agent
 *
 * Purpose: Handles text-to-speech notifications asynchronously.
 * Processes voice requests from queue and sends audio via Telegram.
 *
 * Architecture:
 * - Monitors voice request queue
 * - Generates TTS using voice-server API
 * - Sends audio files via Telegram
 * - Runs independently, non-blocking
 */

import { Bot, GrammyError } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const USER_ID = process.env.TELEGRAM_USER_ID || "";
const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL || "http://localhost:8888";
const VOICE_QUEUE_FILE = "/tmp/pai-voice-queue.json";

interface VoiceRequest {
  id: string;
  text: string;
  voice_id: string;
  user_id: number;
  timestamp: number;
  sent: boolean;
}

/**
 * Generate TTS audio using voice server
 */
async function generateTTS(text: string, voiceId: string): Promise<Buffer> {
  const response = await fetch(`${VOICE_SERVER_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text,
      voice_id: voiceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voice server error: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Send voice message via Telegram
 */
async function sendVoiceMessage(
  bot: Bot,
  userId: number,
  audioBuffer: Buffer
): Promise<void> {
  // Create temporary file
  const tempFile = `/tmp/voice_${Date.now()}.ogg`;
  require("fs").writeFileSync(tempFile, audioBuffer);

  try {
    await bot.api.sendVoice(userId, new File([audioBuffer], "voice.ogg"));
  } finally {
    // Cleanup temp file
    if (require("fs").existsSync(tempFile)) {
      require("fs").unlinkSync(tempFile);
    }
  }
}

/**
 * Process voice queue
 */
async function processVoiceQueue(bot: Bot): Promise<void> {
  if (!require("fs").existsSync(VOICE_QUEUE_FILE)) {
    require("fs").writeFileSync(
      VOICE_QUEUE_FILE,
      JSON.stringify({ requests: [] }, null, 2)
    );
    return;
  }

  const queue = JSON.parse(
    require("fs").readFileSync(VOICE_QUEUE_FILE, "utf-8")
  );

  const pendingRequests = queue.requests.filter(
    (r: VoiceRequest) => !r.sent && r.user_id.toString() === USER_ID
  );

  for (const request of pendingRequests) {
    try {
      console.log(`🎙️ Processing voice request: ${request.id}`);

      // Generate TTS
      const audioBuffer = await generateTTS(request.text, request.voice_id);

      // Send via Telegram
      await sendVoiceMessage(bot, request.user_id, audioBuffer);

      // Mark as sent
      request.sent = true;
      console.log(`✅ Voice message sent: ${request.id}`);
    } catch (error) {
      console.error(`❌ Error sending voice:`, error);
    }
  }

  // Save updated queue
  require("fs").writeFileSync(
    VOICE_QUEUE_FILE,
    JSON.stringify({ requests: queue.requests }, null, 2)
  );
}

/**
 * Initialize voice agent
 */
async function init() {
  console.log("🎙️ FR3K Voice Agent Starting...");

  // Validate configuration
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable not set");
  }

  if (!USER_ID) {
    throw new Error("TELEGRAM_USER_ID environment variable not set");
  }

  // Initialize queue file
  if (!require("fs").existsSync(VOICE_QUEUE_FILE)) {
    require("fs").writeFileSync(
      VOICE_QUEUE_FILE,
      JSON.stringify({ requests: [] }, null, 2)
    );
  }

  // Create bot instance (for sending messages only)
  const bot = new Bot(BOT_TOKEN);
  bot.api.config.use(autoRetry({
    maxRetryAttempts: 3,
    maxDelaySeconds: 60,
  }));

  // Process queue every 5 seconds
  setInterval(async () => {
    await processVoiceQueue(bot);
  }, 5000);

  console.log(`✅ Voice agent running (user: ${USER_ID})`);
  console.log(`🔊 Voice server: ${VOICE_SERVER_URL}`);

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\n🛑 Voice agent stopping...");
    process.exit(0);
  });
}

// Start agent
init().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
