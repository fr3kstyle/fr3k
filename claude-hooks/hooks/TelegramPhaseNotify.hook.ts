#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * TelegramPhaseNotify.hook.ts
 *
 * Automatically detects Algorithm phase transitions in Claude's output
 * and sends Telegram notifications. This ensures phase updates are sent
 * even if Claude forgets to explicitly call telegram-phase-notify.
 *
 * TRIGGER: StreamResponseChunk (runs as Claude streams response)
 * ENVIRON: TELEGRAM_BOT_REQUEST=1 (set by telegram bot)
 */

import { spawn } from 'child_process';

// Phase regex to detect Algorithm phase transitions
const PHASE_REGEX = /━━━\s+([👁️🧠🧠📋🔨⚡✅📚])\s+(\w+)\s+━━━\s*(\d+)\/\s*7/;

// Map emojis to phase names
const EMOJI_TO_PHASE: Record<string, string> = {
  '👁️': 'OBSERVE',
  '🧠': 'THINK',
  '📋': 'PLAN',
  '🔨': 'BUILD',
  '⚡': 'EXECUTE',
  '✅': 'VERIFY',
  '📚': 'LEARN',
};

// Track last phase to avoid duplicate notifications
let lastPhase = 0;
let lastNotifiedTime = 0;

async function main() {
  // Only run for Telegram requests
  if (process.env.TELEGRAM_BOT_REQUEST !== '1') {
    process.exit(0);
  }

  // Skip for subagents
  const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
  if (claudeProjectDir.includes('/.claude/Agents/') || process.env.CLAUDE_AGENT_TYPE) {
    process.exit(0);
  }

  // Read stdin
  const input = await readStdin();
  if (!input) {
    process.exit(0);
  }

  const data = JSON.parse(input);
  const chunk = data.content || '';

  // Check for phase transition
  const match = chunk.match(PHASE_REGEX);
  if (!match) {
    process.exit(0);
  }

  const [, emoji, phaseName, phaseNum] = match;
  const phase = parseInt(phaseNum);

  // Debounce: don't notify same phase within 2 seconds
  const now = Date.now();
  if (phase === lastPhase && (now - lastNotifiedTime) < 2000) {
    process.exit(0);
  }

  // Generate title and content from context
  const title = generatePhaseTitle(phase, phaseName);
  const content = generatePhaseContent(phase, phaseName, chunk);

  // Call telegram-phase-notify
  console.error(`📤 Auto-sending phase ${phase} notification to Telegram...`);

  await execCommand('telegram-phase-notify', [
    phase.toString(),
    phaseName,
    title,
    content
  ]);

  console.error(`✅ Phase ${phase} notification sent`);

  lastPhase = phase;
  lastNotifiedTime = now;
  process.exit(0);
}

function generatePhaseTitle(phase: number, phaseName: string): string {
  const titles: Record<number, string> = {
    1: 'Request Analysis',
    2: 'Strategy Assessment',
    3: 'Implementation Plan',
    4: 'Building Solution',
    5: 'Executing Work',
    6: 'Verification Results',
    7: 'Key Learnings',
  };
  return titles[phase] || `${phaseName} Phase`;
}

function generatePhaseContent(phase: number, phaseName: string, chunk: string): string {
  // Extract up to 500 chars of context after the phase header
  const phaseIndex = chunk.indexOf(phaseName);
  if (phaseIndex === -1) {
    return `Processing ${phaseName} phase...`;
  }

  const contentStart = phaseIndex + phaseName.length;
  const content = chunk.substring(contentStart, contentStart + 500).trim();

  // Clean up formatting
  return content
    .replace(/\*\*/g, '')
    .replace(/━━━/g, '')
    .replace(/[│└├┌─]/g, '')
    .substring(0, 300);
}

function execCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: ['ignore', 'inherit', 'inherit']
    });

    proc.on('error', (err) => {
      console.error(`❌ Command failed: ${err.message}`);
      resolve(); // Don't fail, just log
    });

    proc.on('exit', (code) => {
      if (code !== 0) {
        console.error(`⚠️ Command exited with code ${code}`);
      }
      resolve();
    });
  });
}

function readStdin(timeout = 5000): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => resolve(data), timeout);
    process.stdin.on('data', chunk => { data += chunk.toString(); });
    process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
    process.stdin.on('error', () => { clearTimeout(timer); resolve(''); });
  });
}

main().catch(console.error);
