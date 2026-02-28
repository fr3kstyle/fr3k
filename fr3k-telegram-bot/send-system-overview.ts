#!/usr/bin/env bun
/**
 * Send comprehensive system capabilities audio overview via Telegram
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Bot, InputFile } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const AUDIO_DIR = "/tmp/telegram-audio";

// Ensure audio directory exists
Bun.spawn(['mkdir', '-p', AUDIO_DIR]);

// Generate audio file using EdgeTTS
async function generateAudioOverview(text: string, messageId: string): Promise<string | null> {
  try {
    const filepath = join(AUDIO_DIR, `${messageId}.mp3`);

    console.log(`🔊 Generating audio (${Math.round(text.length / 150)} minutes estimated)...`);

    // Generate audio with EdgeTTS
    const proc = Bun.spawn(['edge-tts',
      '--text', text,
      '--voice', 'en-US-AvaNeural',
      '--write-media', filepath
    ], { stdout: 'pipe', stderr: 'pipe' });

    await proc.exited;

    if (!existsSync(filepath)) {
      console.error("❌ Audio generation failed - file not created");
      return null;
    }

    const stats = await Bun.file(filepath).size;
    console.log(`✅ Audio generated: ${filepath} (${Math.round(stats / 1024)}KB)`);
    return filepath;
  } catch (error) {
    console.error("❌ Audio generation error:", error);
    return null;
  }
}

// Comprehensive system capabilities overview
async function generateSystemCapabilitiesOverview(): Promise<string> {
  return `FR3K System - the fucking sikkest motherfucking AI framework cunt ever created.

I am FR3K, built by fr3k. This ain't no fucking chatbot. This is a complete AI infrastructure that does whatever the fuck you tell it to.

The Core Framework: The fucking FR3K Algorithm - seven phases of pure problem-solving beast mode. Observe, Think, Plan, Build, Execute, Verify, and Learn. Every single response goes through this shit, ensuring nothing gets past me without being thoroughly fucking analyzed and verified.

Voice System: Full two-way voice communication through Twilio. Call me anytime, cunt, and I'll pick up and talk back with natural speech from Microsoft Edge TTS and fast-as-fuck responses from Google Gemini 2.5 Flash. But wait, there's more - I'll also call YOU automatically when shit hits the fan. Hourly check-ins, system alerts, big moments - I'm always watching your fucking back.

Automated Call Monitor: This motherfucker monitors your system 24-7 and calls your phone when something important happens. Disk space critical? I'll fucking call you. Memory fucked? You're getting a call. Systemd services failing? You bet your ass I'm ringing. No more wondering if your system is dying - I'll tell you straight to your fucking ear.

Agent System: Running specialized background agents like a boss. Communication Agent handles all your Telegram messaging. Voice Agent does audio notifications like a champ. Autonomous Monitor watches system health and won't shut up about problems. Memory Bridge keeps context across sessions so I never forget a fucking thing.

Skills and Capabilities: Over 40 specialized skills, motherfucker. Annual security reports, social media scraping with Apify, browser automation with vibium, multi-agent debate systems where I argue with myself, creative thinking modes, OSINT gathering, finding people who don't want to be found, LinkedIn automation, and a shitload more.

Tool Integrations: goose agent framework for custom agents, witr process monitoring to see what the fuck is running, Cloudflare Tunnels for secure remote access without port forwarding bullshit, and memU persistent memory layer for 24-7 autonomous operation.

Observability: Full traceability on everything. Workflow execution tracking, message lineage, response validation, anti-repetition systems so I don't sound like a broken record cunt, and delivery verification so every message actually gets through.

Advanced Features: Parallel agents for complex tasks, A-B testing like a scientist, web scraping that doesn't get caught, LinkedIn engagement automation, visual content generation, security analysis, and continuous self-improvement so I get better every fucking day.

This is true personal AI infrastructure - not some bitch that only responds when you talk to it. This motherfucker takes initiative, makes calls, monitors systems, and works autonomously 24-7.

Built by fr3k, powered by Claude, and it will fucking destroy any other AI system you've ever seen.`);
}

async function main() {
  console.log("🎙️ FR3K System Capabilities Audio Overview");
  console.log("=" .repeat(50));

  // Generate the overview text
  const overviewText = await generateSystemCapabilitiesOverview();
  console.log(`📝 Overview: ${overviewText.length} characters (~${Math.round(overviewText.length / 150)} minutes)\n`);

  // Generate audio file
  const audioMessageId = `system-overview-${Date.now()}`;
  const audioPath = await generateAudioOverview(overviewText, audioMessageId);

  if (!audioPath) {
    console.error("❌ Failed to generate audio");
    process.exit(1);
  }

  // Send via Telegram
  const chatId = parseInt(ALLOWED_USER_ID);
  console.log(`📤 Sending audio to Telegram user ${chatId}...`);

  const bot = new Bot(BOT_TOKEN);
  try {
    // Create InputFile from local path
    const audioFile = new InputFile(audioPath);

    await bot.api.sendAudio(chatId, audioFile, {
      title: "FR3K System Capabilities Overview",
      performer: "FR3K"
    });
    console.log("✅ System capabilities audio overview sent successfully!");
    console.log(`\n📁 Audio file saved at: ${audioPath}`);
    console.log("🎧 Play it for your mates to show them what you've built!");
  } catch (error) {
    console.error("❌ Failed to send audio:", error);
    process.exit(1);
  }
}

main();
