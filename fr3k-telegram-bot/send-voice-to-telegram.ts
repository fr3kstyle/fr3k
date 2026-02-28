#!/usr/bin/env bun
/**
 * FR3K Telegram Voice Sender (EdgeTTS)
 * 
 * Generates audio using EdgeTTS and sends to Telegram
 * Usage: bun send-voice-to-telegram.ts <text> <caption>
 */

import { Bot } from "grammy";
import { readFileSync } from "fs";
import { spawn } from "child_process";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const USER_ID = process.env.TELEGRAM_USER_ID || "";

async function generateAudioEdgeTTS(text: string, voice: string = "en-US-GuyNeural"): Promise<Buffer> {
  console.log(`🎙️ Generating audio with EdgeTTS (${voice})`);
  console.log(`   Text: "${text.substring(0, 50)}..."`);
  
  const tempFile = `/tmp/edgetts-${Date.now()}.mp3`;
  
  // Use edge-tts CLI
  const proc = spawn('edge-tts', ['--text', text, '--voice', voice, '--write-media', tempFile], {
    stdout: 'pipe',
    stderr: 'pipe'
  });
  
  // Wait for completion
  await new Promise<void>((resolve, reject) => {
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`EdgeTTS failed (exit ${code}): ${stderr}`));
      } else {
        resolve();
      }
    });
  });
  
  // Read file as Buffer
  const buffer = readFileSync(tempFile);
  
  // Cleanup temp file
  await Bun.write(tempFile, "");
  
  console.log(`✅ Audio generated: ${buffer.length} bytes`);
  return buffer;
}

async function sendVoiceToTelegram(audioBuffer: Buffer, caption: string): Promise<void> {
  const bot = new Bot(BOT_TOKEN);
  const userId = parseInt(USER_ID);
  
  if (!userId) {
    throw new Error("TELEGRAM_USER_ID not set");
  }
  
  // Send to Telegram using a custom helper that wraps Buffer properly
  console.log(`📤 Sending to Telegram user ${userId}...`);
  
  // Create a File-like object
  const fileWrapper = {
    name: `voice-${Date.now()}.mp3`,
    data: audioBuffer,
    // Add toString for debugging
    toString: () => `[Audio buffer: ${audioBuffer.length} bytes]`
  };
  
  await bot.api.sendVoice(userId, fileWrapper as any, { caption });
  
  console.log(`✅ Voice message sent to Telegram`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error(`
❌ Usage: bun send-voice-to-telegram.ts "<text>" "<caption>" [voice]

Example:
  bun send-voice-to-telegram.ts "Testing voice" "Phase 3: PLAN"
  bun send-voice-to-telegram.ts "Hello" "Test" "en-US-AvaNeural"

Voices:
  en-US-GuyNeural    (Male, US English)
  en-US-AvaNeural    (Female, US English)
  en-GB-SoniaNeural  (Female, British)
    `);
    process.exit(1);
  }
  
  const [text, caption, voice = "en-US-GuyNeural"] = args;
  
  console.log("🎤 FR3K Telegram Voice Sender (EdgeTTS)");
  console.log(`═══════════════════════════════════════`);
  console.log(`Voice: ${voice}`);
  console.log(`Text: ${text}`);
  console.log(`Caption: ${caption}`);
  console.log(``);
  
  const audio = await generateAudioEdgeTTS(text, voice);
  await sendVoiceToTelegram(audio, caption);
}

main().catch(console.error);
