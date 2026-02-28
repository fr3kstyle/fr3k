#!/usr/bin/env bun
/**
 * PAI - Reachy Mini Integration Agent
 *
 * Integrates ElevenLabs Conversational Agent with PAI Telegram Bot
 * Enables bidirectional voice control between Reachy Mini and Claude Code
 *
 * Architecture:
 * - User speaks to Reachy Mini (ElevenLabs Agent)
 * - Agent ID provided by user (intercepted)
 * - Conversations routed through PAI Telegram
 * - PAI controls Claude Code via commands
 * - Feedback loop: Reachy ↔ PAI ↔ Claude Code
 */

import { Bot } from "grammy";
import { tracer } from "../observability/tracer.js";

// Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

// ElevenLabs Conversational API
const ELEVENLABS_CONVERSATIONAL_URL = "https://api.elevenlabs.io/v1/conv-AI";

interface ReachyMessage {
  text: string;
  userId: string;
  timestamp: number;
  source: "reachy" | "telegram" | "claude-code";
}

interface ConversationState {
  agentId: string;
  active: boolean;
  context: string[];
  lastInteraction: number;
}

// State
let conversationState: ConversationState = {
  agentId: ELEVENLABS_AGENT_ID,
  active: false,
  context: [],
  lastInteraction: 0
};

// Initialize bot
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// ============================================================================
// ELEVENLABS CONVERSATIONAL API
// ============================================================================

async function sendToElevenLabsAgent(message: string): Promise<string> {
  try {
    const response = await fetch(`${ELEVENLABS_CONVERSATIONAL_URL}/agents/${conversationState.agentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        message,
        context: conversationState.context.slice(-5), // Last 5 messages for context
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || data.text || "No response from agent";
  } catch (error) {
    console.error('❌ ElevenLabs API error:', error);
    throw error;
  }
}

// ============================================================================
// CLAUDE CODE CONTROL INTERFACE
// ============================================================================

async function executeClaudeCodeCommand(command: string): Promise<string> {
  try {
    // Parse command for safety
    const safeCommand = sanitizeCommand(command);

    // Execute via Claude Code interface
    const result = await executeCommand(safeCommand);
    return result;
  } catch (error) {
    return `Command execution failed: ${error.message}`;
  }
}

function sanitizeCommand(command: string): string {
  // Basic sanitization - allow only safe commands
  const dangerousPatterns = [
    /rm\s+-rf/,
    /rm\s+-/,
    /dd\s+/,
    /mkfs/,
    /format/,
    /del\s+/,
    /format\s+/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      throw new Error(`Dangerous command blocked: ${pattern}`);
    }
  }

  return command;
}

async function executeCommand(command: string): Promise<string> {
  // This will interface with Claude Code's execution engine
  // For now, return placeholder
  return `Executed: ${command}`;
}

// ============================================================================
// TELEGRAM MESSAGE HANDLING
// ============================================================================

bot.command("reachy", async (ctx) => {
  const chatId = ctx.from.id.toString();

  if (chatId !== ALLOWED_USER_ID) {
    return;
  }

  const args = ctx.match;
  const action = args ? args.split(' ')[1] : 'status';

  switch (action) {
    case 'start':
      conversationState.active = true;
      await ctx.reply("🤖 Reachy Mini integration activated!\n\nCommands:\n/reachy status - Check status\n/reachy agent <id> - Set agent ID\n/reachy stop - Deactivate");
      break;

    case 'stop':
      conversationState.active = false;
      await ctx.reply("🛑 Reachy Mini integration deactivated");
      break;

    case 'agent':
      const agentId = args ? args.split(' ')[2] : null;
      if (agentId) {
        conversationState.agentId = agentId;
        await ctx.reply(`✅ Agent ID set to: ${agentId}`);
      } else {
        await ctx.reply(`Current agent ID: ${conversationState.agentId || 'Not set'}`);
      }
      break;

    case 'status':
      await ctx.reply(`
🤖 **Reachy Mini Integration Status**

Status: ${conversationState.active ? '🟢 Active' : '🔴 Inactive'}
Agent ID: ${conversationState.agentId || 'Not set'}
Context messages: ${conversationState.context.length}
Last interaction: ${conversationState.lastInteraction ? new Date(conversationState.lastInteraction).toISOString() : 'Never'}
      `.trim());
      break;

    default:
      await ctx.reply(`
🤖 **Reachy Mini Commands**

/reachy start - Activate integration
/reachy stop - Deactivate
/reachy agent <id> - Set ElevenLabs Agent ID
/reachy status - Show status
      `.trim());
  }
});

// Handle regular messages when integration is active
bot.on('message:text', async (ctx) => {
  const chatId = ctx.from.id.toString();

  if (chatId !== ALLOWED_USER_ID || !conversationState.active) {
    return;
  }

  const message = ctx.message.text;

  // Check if it's a Claude Code command
  if (message.startsWith('/code ')) {
    const command = message.substring(6);
    await ctx.reply('⚡ Executing Claude Code command...');

    try {
      const result = await executeClaudeCodeCommand(command);
      await ctx.reply(`✅ Result:\n${result}`);

      // Send to Reachy for voice feedback
      if (conversationState.agentId) {
        await sendToElevenLabsAgent(`Command executed: ${result}`);
      }
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  } else {
    // Regular conversation - route through ElevenLabs agent
    try {
      await ctx.sendChatAction('typing');

      const response = await sendToElevenLabsAgent(message);

      // Update context
      conversationState.context.push(`User: ${message}`);
      conversationState.context.push(`Agent: ${response}`);
      conversationState.lastInteraction = Date.now();

      await ctx.reply(response);
    } catch (error) {
      await ctx.reply(`❌ ElevenLabs agent error: ${error.message}`);
    }
  }
});

// ============================================================================
// STARTUP
// ============================================================================

console.log("🤖 PAI Reachy Mini Integration Agent Starting...");
console.log(`📱 Telegram Bot: @fR3kzSikbot`);
console.log(`🎤 ElevenLabs Agent: ${conversationState.agentId || 'Not configured'}`);
console.log(`✅ Ready for voice-to-code integration!`);

bot.start();
