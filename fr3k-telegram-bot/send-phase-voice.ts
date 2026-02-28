#!/usr/bin/env bun
/**
 * FR3K Phase Voice Overview Sender
 *
 * Generates and sends voice audio overviews to Telegram for Algorithm phases 3 and 6
 * Sends BOTH text AND voice message
 * Usage: bun send-phase-voice.ts <phase> "<phaseName>" "<title>" "<content>"
 */

import { spawn } from "child_process";
import { readFileSync } from "fs";

// Load .env file explicitly
const envPath = "/home/fr3k/fr3k-telegram-bot/.env";
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=");
    if (key && value && !key.startsWith("#")) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.warn("Warning: Could not load .env file:", error);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const USER_ID = process.env.TELEGRAM_USER_ID || "";
const AUDIO_DIR = "/tmp/telegram-audio";

async function generateAudioEdgeTTS(text: string, filename: string): Promise<string | null> {
  try {
    const filepath = `${AUDIO_DIR}/${filename}`;
    
    // Ensure directory exists
    await Bun.spawn(["mkdir", "-p", AUDIO_DIR]).exited;
    
    console.log(`🎙️ Generating audio with EdgeTTS...`);
    
    // Use edge-tts CLI (full path to .local/bin)
    const proc = spawn('/home/fr3k/.local/bin/edge-tts', ['--text', text, '--voice', 'en-US-AvaNeural', '--write-media', filepath], {
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
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
    
    // Check if file was created
    const exists = await Bun.file(filepath).exists();
    if (!exists) {
      console.error("❌ Audio file not created");
      return null;
    }
    
    console.log(`✅ Audio generated: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error("❌ Audio generation error:", error);
    return null;
  }
}

async function sendTextToTelegram(text: string): Promise<boolean> {
  try {
    const userId = parseInt(USER_ID);
    
    if (!userId) {
      throw new Error("TELEGRAM_USER_ID not set");
    }
    
    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN not set");
    }
    
    console.log(`📤 Sending text to Telegram...`);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }
    
    console.log(`✅ Text sent to Telegram (message_id: ${result.result.message_id})`);
    return true;
  } catch (error) {
    console.error("❌ Send text error:", error);
    return false;
  }
}

async function sendVoiceToTelegramDirect(audioPath: string, caption: string): Promise<boolean> {
  try {
    const userId = parseInt(USER_ID);
    
    if (!userId) {
      throw new Error("TELEGRAM_USER_ID not set");
    }
    
    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN not set");
    }
    
    console.log(`📤 Sending voice to Telegram (direct HTTP)...`);
    
    // Read file as buffer
    const buffer = readFileSync(audioPath);
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    
    // Create FormData manually
    const formData = new FormData();
    formData.append('chat_id', userId.toString());
    formData.append('voice', blob, `voice-${Date.now()}.mp3`);
    formData.append('caption', caption);
    
    // Send via Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }
    
    console.log(`✅ Voice sent to Telegram (message_id: ${result.result.message_id})`);
    return true;
  } catch (error) {
    console.error("❌ Send voice error:", error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error(`
❌ Usage: bun send-phase-voice.ts <phase> "<phaseName>" "<title>" "<content>"

Example:
  bun send-phase-voice.ts 3 "PLAN" "Implementation Strategy" "Creating HTTP-based system..."
  bun send-phase-voice.ts 6 "VERIFY" "Validation Results" "Testing complete..."
    `);
    process.exit(1);
  }
  
  const [phaseStr, phaseName, title, ...contentParts] = args;
  const phase = parseInt(phaseStr);
  
  // Only send voice for phases 3 and 6
  if (phase !== 3 && phase !== 6) {
    console.log(`ℹ️  Voice overview only sent for phases 3 (PLAN) and 6 (VERIFY)`);
    process.exit(0);
  }
  
  const content = contentParts.join(" ");
  const phaseEmoji = ["", "👁️", "🧠", "📋", "🔨", "⚡", "✅", "📚"];
  const emoji = phaseEmoji[phase] || "🔄";
  
  // Create voice overview text
  const voiceText = `${title}. ${content}`;
  
  // Create full text message
  const textMessage = `${emoji} **PHASE ${phase}/7: ${phaseName}**\n\n📌 ${title}\n\n${content}`;
  
  console.log("🎤 FR3K Phase Voice Overview");
  console.log(`══════════════════════════════`);
  console.log(`Phase ${phase}: ${phaseName}`);
  console.log(`Title: ${title}`);
  console.log(`══════════════════════════════`);
  console.log(``);
  
  // Send text message first
  await sendTextToTelegram(textMessage);
  console.log(``);
  
  // Generate audio
  const filename = `phase-${phase}-${Date.now()}.mp3`;
  const audioPath = await generateAudioEdgeTTS(voiceText, filename);
  
  if (!audioPath) {
    console.error("❌ Failed to generate audio");
    process.exit(1);
  }
  
  // Send voice to Telegram
  const caption = `🔊 **Phase ${phase}/7: ${phaseName}**\n📌 ${title}`;
  const success = await sendVoiceToTelegramDirect(audioPath, caption);
  
  if (!success) {
    process.exit(1);
  }
}

main().catch(console.error);
