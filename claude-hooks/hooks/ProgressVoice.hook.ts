#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * ProgressVoice.hook.ts - Intermediate Voice Announcements During Work
 *
 * PURPOSE:
 * Provides voice announcements at key points during work, not just at the end.
 * Speaks when tasks are started/completed and when major phases complete.
 *
 * TRIGGER: ToolResult (fires after each tool completes)
 *
 * OUTPUT:
 * - Voice notification for significant progress
 * - exit(0): Always (non-blocking)
 */

import { getIdentity } from './lib/identity';

interface HookInput {
  tool_name: string;
  tool_result: any;
  session_id: string;
}

// Tools that indicate significant progress worth announcing
const PROGRESS_TOOLS = [
  'TaskUpdate',  // Task completed
  'Write',       // File created
  'Edit',        // File modified
  'Bash',        // Command executed (significant ones)
];

// Tools to skip (too noisy)
const SKIP_TOOLS = [
  'Read',
  'Grep',
  'Glob',
  'TaskList',
  'TaskGet',
];

async function main() {
  try {
    const input = await Bun.stdin.text();
    if (!input) process.exit(0);

    const data = JSON.parse(input) as HookInput;
    const toolName = data.tool_name || '';

    // Skip noisy tools
    if (SKIP_TOOLS.some(t => toolName.includes(t))) {
      process.exit(0);
    }

    // Check if this is progress worth announcing
    const isProgress = PROGRESS_TOOLS.some(t => toolName.includes(t));
    if (!isProgress) {
      process.exit(0);
    }

    // Build progress message
    const identity = getIdentity();
    let message = '';

    if (toolName === 'TaskUpdate') {
      const result = data.tool_result as any;
      if (result?.status === 'completed') {
        message = `Completed task: ${result.subject}`;
      } else if (result?.status === 'in_progress') {
        message = `Starting task: ${result.subject}`;
      }
    } else if (toolName === 'Write') {
      message = 'Creating new file';
    } else if (toolName === 'Edit') {
      message = 'Updating file';
    } else if (toolName === 'Bash') {
      message = 'Executing command';
    }

    if (!message || message.length < 5) {
      process.exit(0);
    }

    // Send to voice server (fire and forget)
    const voiceId = identity.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const voiceSettings = identity.voice;

    fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(1000), // 1s timeout
      body: JSON.stringify({
        message: `${identity.name}: ${message}`,
        title: 'Progress',
        voice_enabled: true,
        voice_id: voiceId,
        voice_settings: voiceSettings ? {
          stability: voiceSettings.stability ?? 0.5,
          similarity_boost: voiceSettings.similarity_boost ?? 0.75,
          style: voiceSettings.style ?? 0.0,
          speed: voiceSettings.speed ?? 1.1,
          use_speaker_boost: voiceSettings.use_speaker_boost ?? true,
        } : undefined,
      }),
    }).catch(() => {}); // Silent fail

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
