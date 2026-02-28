#!/usr/bin/env bun
/**
 * FR3K Algorithm Phase Notification Sender (SIMPLIFIED)
 *
 * Sends progress updates to Telegram during Algorithm execution
 * - NO voice notifications (removed due to timeouts)
 * - NO audio overview (removed due to 404 errors)
 * - Only sends Telegram text messages
 *
 * Usage:
 *   bun phase-notify.ts <phase> <phaseName> <title> <content>
 *
 * Example:
 *   bun phase-notify.ts 2 "THINK" "Capability Selection" "Using FirstPrinciples..."
 */

interface PhaseUpdate {
  phase: number;
  phaseName: string;
  title: string;
  content: string;
  timestamp?: string;
}

// Phase-specific configurations
const PHASE_CONFIG = {
  1: { emoji: "👁️", name: "OBSERVE" },
  2: { emoji: "🧠", name: "THINK" },
  3: { emoji: "📋", name: "PLAN" },
  4: { emoji: "🔨", name: "BUILD" },
  5: { emoji: "⚡", name: "EXECUTE" },
  6: { emoji: "✅", name: "VERIFY" },
  7: { emoji: "📚", name: "LEARN" },
};

async function sendPhaseUpdateToTelegram(update: PhaseUpdate): Promise<boolean> {
  try {
    const phaseConfig = PHASE_CONFIG[update.phase as keyof typeof PHASE_CONFIG];
    const emoji = phaseConfig?.emoji || "🔄";

    let message = `${emoji} **PHASE ${update.phase}/7: ${update.phaseName}**\n\n`;
    message += `📌 ${update.title}\n\n`;
    message += `${update.content}`;

    const response = await fetch("http://localhost:8898/api/phase-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...update,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Phase ${update.phase} sent to Telegram`);
      return true;
    } else {
      console.error(`❌ Phase ${update.phase} failed: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Phase update error:", error);
    return false;
  }
}

async function sendPhaseUpdate(update: PhaseUpdate): Promise<void> {
  console.log(`\n📤 Sending Phase ${update.phase}: ${update.phaseName}`);
  console.log(`   Title: ${update.title}`);

  // Send to Telegram
  await sendPhaseUpdateToTelegram(update);

  console.log(`✅ Phase ${update.phase} complete\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error(`
❌ Usage: bun phase-notify.ts <phase> <phaseName> <title> <content>

Example:
  bun phase-notify.ts 3 "PLAN" "Implementation Strategy" "Creating HTTP-based..."

Phase numbers:
  1 = OBSERVE        5 = EXECUTE
  2 = THINK          6 = VERIFY
  3 = PLAN           7 = LEARN
  4 = BUILD
  `);
  process.exit(1);
}

const [phaseStr, phaseName, title, ...contentParts] = args;
const phase = parseInt(phaseStr);

// Filter out flags from content
const content = contentParts
  .filter(arg => !arg.startsWith('--'))
  .join(" ");

// Send the notification
await sendPhaseUpdate({
  phase,
  phaseName,
  title,
  content,
  timestamp: new Date().toISOString()
});
