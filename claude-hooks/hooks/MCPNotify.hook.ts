#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * MCPNotify.hook.ts - MCP Tool Notification System
 *
 * PURPOSE:
 * Detects when MCP tools are being used and triggers voice/Telegram notifications.
 * This provides real-time feedback when FR3K is using its MCP integrations.
 *
 * TRIGGER: PreToolUse (fires before tool execution)
 *
 * OUTPUT:
 * - Voice notification: "Using hey-fr3k for context retrieval"
 * - Telegram notification with MCP tool details
 * - exit(0): Always (non-blocking)
 */

import { spawn } from 'child_process';

interface HookInput {
  tool_name: string;
  tool_input: any;
  session_id: string;
}

// MCP tool patterns to detect
const MCP_PATTERNS = {
  'hey-fr3k': {
    store: 'Storing memory',
    recall: 'Retrieving context',
    recent: 'Getting recent context',
    add_task: 'Creating task',
    get_task: 'Getting task',
    list_tasks: 'Listing tasks',
    update_task_status: 'Updating task',
  },
  'fr3k-think': {
    think: 'Structured analysis',
    reset_thinking: 'Clearing thinking session',
  },
  'unified-pantheon-mcp': {
    self_evolve: 'Self-improvement analysis',
    analyze_with_demon_angel: 'TAS trade-off analysis',
    detect_emergence: 'Detecting emergent patterns',
    self_heal: 'Running diagnostics',
    generate_capability: 'Generating new capability',
    safety_check: 'Safety analysis',
  },
  'md-mcp': {
    forge_reality: 'Creating custom tool',
    divine_truth: 'Analyzing patterns',
    summon_knowledge: 'Deciphering code',
    weave_spells: 'Transforming text',
    read_fate: 'Analyzing configuration',
    see_destiny: 'Planning interpretation',
  },
};

// Voice notification messages
function getVoiceMessage(toolName: string): string | null {
  // Parse MCP tool name: mcp__<server>__<tool>
  const match = toolName.match(/^mcp__(.+)__(.+)$/);
  if (!match) return null;

  const [, server, tool] = match;

  // Check if this is an MCP tool we care about
  if (MCP_PATTERNS[server as keyof typeof MCP_PATTERNS]) {
    const serverPatterns = MCP_PATTERNS[server as keyof typeof MCP_PATTERNS];
    const message = serverPatterns[tool as keyof typeof serverPatterns];

    if (message) {
      return `Using ${server} for ${message}`;
    }
  }

  return null;
}

// Telegram notification content
function getTelegramContent(toolName: string, toolInput: any): string {
  const match = toolName.match(/^mcp__(.+)__(.+)$/);
  if (!match) return '';

  const [, server, tool] = match;

  let content = `🔌 **MCP Tool Called**\n`;
  content += `**Server:** \`${server}\`\n`;
  content += `**Tool:** \`${tool}\`\n`;

  // Add relevant input details
  if (toolInput && typeof toolInput === 'object') {
    const relevantKeys = Object.keys(toolInput).slice(0, 3); // First 3 keys
    if (relevantKeys.length > 0) {
      content += `\n**Parameters:**\n`;
      for (const key of relevantKeys) {
        const value = toolInput[key];
        if (typeof value === 'string' && value.length > 50) {
          content += `  \`${key}\`: ${value.substring(0, 50)}...\n`;
        } else if (typeof value !== 'object') {
          content += `  \`${key}\`: \`${JSON.stringify(value)}\`\n`;
        }
      }
    }
  }

  return content;
}

async function sendVoiceNotification(message: string): Promise<void> {
  return new Promise((resolve) => {
    const proc = spawn('curl', [
      '-s', '-X', 'POST',
      'http://localhost:8888/notify',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({
        message,
        title: 'MCP Activity',
        voice_enabled: true,
      }),
    ], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    proc.on('error', () => resolve()); // Silent fail
    proc.on('exit', () => resolve());
  });
}

async function sendTelegramNotification(title: string, content: string): Promise<void> {
  return new Promise((resolve) => {
    // Check if telegram-phase-notify exists
    const proc = spawn('which', ['telegram-phase-notify']);
    proc.on('error', () => {
      resolve(); // Command doesn't exist, skip
    });
    proc.on('exit', (code) => {
      if (code !== 0) {
        resolve(); // Command doesn't exist, skip
        return;
      }

      // Send notification
      const notifyProc = spawn('telegram-phase-notify', [
        '0', // Phase 0 (MCP activity)
        'MCP',
        title,
        content,
      ], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });

      notifyProc.on('error', () => resolve());
      notifyProc.on('exit', () => resolve());
    });
  });
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

    // Get voice message
    const voiceMessage = getVoiceMessage(toolName);
    if (!voiceMessage) {
      process.exit(0);
    }

    console.error(`🔌 MCP Tool: ${toolName}`);

    // Send voice notification (fire and forget)
    await sendVoiceNotification(voiceMessage);

    // Send Telegram notification (fire and forget)
    const telegramContent = getTelegramContent(toolName, data.tool_input);
    await sendTelegramNotification('MCP Tool Called', telegramContent);

    console.error(`✓ MCP notification sent`);

    process.exit(0);
  } catch (error) {
    console.error('MCPNotify error:', error);
    process.exit(0);
  }
}

main();
