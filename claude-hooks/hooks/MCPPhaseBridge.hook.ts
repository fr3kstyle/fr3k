#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * MCPPhaseBridge.hook.ts - MCP to Phase Notification Bridge
 *
 * PURPOSE:
 * Bridges MCP tool usage to phase-specific notifications.
 * Detects which phase of the 7-phase algorithm is active based on MCP tool patterns,
 * and triggers appropriate phase notifications.
 *
 * TRIGGER: PreToolUse (fires before tool execution)
 *
 * OUTPUT:
 * - Phase-specific voice/Telegram notifications
 * - Tracks MCP usage per phase
 * - exit(0): Always (non-blocking)
 */

import { spawn } from 'child_process';

interface HookInput {
  tool_name: string;
  tool_input: any;
  session_id: string;
}

// MCP tools mapped to 7-phase algorithm
const PHASE_MAPPING = {
  // PHASE 1: OBSERVE (👁️)
  1: {
    tools: ['mcp__hey-fr3k__recent_fr3k', 'mcp__hey-fr3k__recall_fr3k', 'mcp__hey-fr3k__get_incomplete_tasks'],
    name: 'OBSERVE',
    emoji: '👁️',
    voice: 'Observing context',
  },

  // PHASE 2: THINK (🧠)
  2: {
    tools: ['mcp__fr3k-think__think', 'mcp__fr3k-think__reset_thinking', 'mcp__unified-pantheon-mcp__safety_check'],
    name: 'THINK',
    emoji: '🧠',
    voice: 'Analyzing problem',
  },

  // PHASE 3: PLAN (📋)
  3: {
    tools: ['mcp__hey-fr3k__store_fr3k', 'mcp__unified-pantheon-mcp__analyze_with_demon_angel', 'mcp__hey-fr3k__add_task'],
    name: 'PLAN',
    emoji: '📋',
    voice: 'Planning approach',
  },

  // PHASE 4: BUILD (🔨)
  4: {
    tools: ['mcp__md-mcp__forge_reality', 'mcp__md-mcp__summon_knowledge'],
    name: 'BUILD',
    emoji: '🔨',
    voice: 'Building solution',
  },

  // PHASE 5: EXECUTE (⚡)
  5: {
    tools: ['mcp__hey-fr3k__store_fr3k'], // Storing implementation decisions
    name: 'EXECUTE',
    emoji: '⚡',
    voice: 'Executing implementation',
  },

  // PHASE 6: VERIFY (✅)
  6: {
    tools: ['mcp__unified-pantheon-mcp__detect_emergence', 'mcp__unified-pantheon-mcp__self_heal', 'mcp__hey-fr3k__update_task_status'],
    name: 'VERIFY',
    emoji: '✅',
    voice: 'Verifying results',
  },

  // PHASE 7: LEARN (📚)
  7: {
    tools: ['mcp__hey-fr3k__store_fr3k', 'mcp__unified-pantheon-mcp__self_evolve', 'mcp__unified-pantheon-mcp__generate_capability'],
    name: 'LEARN',
    emoji: '📚',
    voice: 'Learning and improving',
  },
};

// Current active phase (tracked across tool calls)
let currentPhase = 0;
let lastNotifiedPhase = 0;
let lastNotifiedTime = 0;

function detectPhase(toolName: string): number | null {
  for (const [phaseNum, phaseData] of Object.entries(PHASE_MAPPING)) {
    if (phaseData.tools.includes(toolName)) {
      return parseInt(phaseNum);
    }
  }
  return null;
}

async function sendPhaseNotification(phase: number, phaseName: string, emoji: string, voice: string): Promise<void> {
  // Debounce: don't notify same phase within 5 seconds
  const now = Date.now();
  if (phase === lastNotifiedPhase && (now - lastNotifiedTime) < 5000) {
    return;
  }

  console.error(`${emoji} Phase ${phase} detected via MCP: ${phaseName}`);

  // Send voice notification
  const voiceProc = spawn('curl', [
    '-s', '-X', 'POST',
    'http://localhost:8888/notify',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({
      message: `${voice} (Phase ${phase})`,
      title: `${emoji} ${phaseName}`,
      voice_enabled: true,
    }),
  ], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  voiceProc.on('error', () => {}); // Silent fail

  // Send Telegram notification
  const telegramProc = spawn('which', ['telegram-phase-notify']);
  telegramProc.on('error', () => {}); // Silent fail
  telegramProc.on('exit', (code) => {
    if (code === 0) {
      const notifyProc = spawn('telegram-phase-notify', [
        phase.toString(),
        phaseName,
        `${emoji} ${phaseName} Phase`,
        `MCP activity detected: ${voice}`,
      ], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      notifyProc.on('error', () => {});
    }
  });

  lastNotifiedPhase = phase;
  lastNotifiedTime = now;
}

async function main() {
  try {
    const input = await Bun.stdin.text();
    if (!input) process.exit(0);

    const data = JSON.parse(input) as HookInput;
    const toolName = data.tool_name || '';

    // Check if this is an MCP tool
    if (!toolName.startsWith('mcp__')) {
      process.exit(0);
    }

    // Detect which phase this tool belongs to
    const detectedPhase = detectPhase(toolName);
    if (detectedPhase === null) {
      process.exit(0);
    }

    // Update current phase
    currentPhase = detectedPhase;
    const phaseData = PHASE_MAPPING[currentPhase as keyof typeof PHASE_MAPPING];

    // Send phase notification
    await sendPhaseNotification(
      currentPhase,
      phaseData.name,
      phaseData.emoji,
      phaseData.voice
    );

    process.exit(0);
  } catch (error) {
    console.error('MCPPhaseBridge error:', error);
    process.exit(0);
  }
}

main();
