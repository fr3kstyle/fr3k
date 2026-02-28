#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * FormatReminder.hook.ts - Algorithm enforcement via rule-based classification (v0.2.25)
 *
 * CHANGES v0.2.25:
 * - REMOVED AI inference entirely - zero API calls
 * - Uses pure regex pattern matching for depth classification
 * - No caching needed - instant classification (<1ms)
 * - Solves 429 rate limit errors completely
 *
 * Classifies using rules:
 * - Depth: FULL | ITERATION | MINIMAL (via regex patterns)
 * - Capabilities: none (removed - main agent handles this)
 * - Skills: none (removed - main agent handles this)
 * - Thinking tools: none (removed - main agent handles this)
 *
 * MINIMAL: Pure social (greetings, acks, ratings) - uses header format
 * ITERATION: Continuing work (adjusting, retrying) - uses condensed format
 * FULL: Everything else (problem-solving, implementation) - uses 7-phase format
 *
 * TRIGGER: UserPromptSubmit
 */

import { getDAName } from './lib/identity';

// ============================================================================
// RULE-BASED DEPTH CLASSIFICATION — Zero API calls, pure pattern matching
// ============================================================================

/**
 * Classification result from rule-based pattern matching
 */
interface ClassificationResult {
  depth: 'FULL' | 'ITERATION' | 'MINIMAL';
}

/**
 * Classify prompt depth using pure regex patterns (no AI, no API calls)
 *
 * Rules:
 * 1. MINIMAL: Pure social with zero task content
 *    - Greetings: "hi", "hey", "hello" (short, under 20 chars)
 *    - Acknowledgments: "thanks", "ok", "cool" (short, no questions)
 *    - Ratings: single number 1-100
 *
 * 2. ITERATION: Continuing existing work
 *    - Continuation markers: "now try", "instead", "do X", "use Y"
 *    - Directive continuation: starts with "and", "but", "also"
 *
 * 3. FULL: Everything else (default - safe when uncertain)
 */
function classifyDepthRules(prompt: string): ClassificationResult {
  const trimmed = prompt.trim().toLowerCase();

  // MINIMAL: Pure ratings (single number)
  if (/^\d{1,2}$/.test(trimmed)) {
    return { depth: 'MINIMAL' };
  }

  // MINIMAL: Greetings (short, just greeting words, no questions or directives)
  const greetingPattern = /^(hi|hello|hey|yo|greetings|howdy)\b/i;
  const hasQuestion = trimmed.includes('?');
  const hasDirective = /\b(can you|please|could you|would you|need to|want to)\b/i.test(trimmed);

  if (greetingPattern.test(trimmed) && prompt.length < 30 && !hasQuestion && !hasDirective) {
    return { depth: 'MINIMAL' };
  }

  // MINIMAL: Acknowledgments (short, no questions, no directives)
  const ackPattern = /^(thanks|thank you|ok|cool|got it|awesome|great|perfect|nice|sweet|rad|gotcha)\b/i;

  if (ackPattern.test(trimmed) && prompt.length < 40 && !hasQuestion && !hasDirective) {
    return { depth: 'MINIMAL' };
  }

  // ITERATION: Continuation of existing work
  // These phrases suggest adjusting or retrying previous work
  const iterationPatterns = [
    /\bnow try\b/,
    /\binstead\b/,
    /\bthat didn't work\b/,
    /\bchange approach\b/,
    /\btry a different\b/,
    /\bdo \w+ instead\b/,
    /\buse \w+ instead\b/,
  ];

  for (const pattern of iterationPatterns) {
    if (pattern.test(trimmed)) {
      return { depth: 'ITERATION' };
    }
  }

  // ITERATION: Directive continuation (starts with lowercase continuation word)
  if (/^(and|but|also|now)\s+\w/.test(trimmed)) {
    return { depth: 'ITERATION' };
  }

  // DEFAULT: FULL (safe default - when uncertain, use full Algorithm)
  return { depth: 'FULL' };
}

// Read stdin with timeout
function readStdin(timeout = 3000): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => resolve(data), timeout);
    process.stdin.on('data', chunk => { data += chunk.toString(); });
    process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
    process.stdin.on('error', () => { clearTimeout(timer); resolve(''); });
  });
}

// Build the reminder output (simplified - no capability hints)
function buildReminder(depth: 'FULL' | 'ITERATION' | 'MINIMAL'): string {
  switch (depth) {
    case 'FULL':
      const telegramReminder = isTelegramMessage ? `
- TELEGRAM NOTIFICATIONS: At START of EACH phase, MUST execute telegram-phase-notify via Bash tool
- Example at phase transition: [Bash executes telegram-phase-notify 1 "OBSERVE" "Title" "Content"]` : '';

      return `<system-reminder>
ALGORITHM REQUIRED — DEPTH: FULL
Nothing escapes the Algorithm. Your response MUST use the 7-phase format:
- Start with: 🤖 PAI ALGORITHM header
- Include ALL phases: OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
- Use TaskCreate for ISC criteria, TaskList to display them${telegramReminder}
- End with 🗣️ VOICE LINE that provides COMPREHENSIVE overview (3-5 sentences describing what was accomplished, key results, and next steps)
</system-reminder>`;

    case 'ITERATION':
      return `<system-reminder>
ALGORITHM REQUIRED — DEPTH: ITERATION
Nothing escapes the Algorithm. Use condensed format:
🤖 PAI ALGORITHM ═════
🔄 ITERATION on: [context]
🔧 CHANGE: [what's different]
✅ VERIFY: [evidence]
🗣️ ${getDAName()}: [comprehensive 2-3 sentence summary of what changed and current state]
</system-reminder>`;

    case 'MINIMAL':
      return `<system-reminder>
ALGORITHM REQUIRED — DEPTH: MINIMAL
Nothing escapes the Algorithm. Use header format:
🤖 PAI ALGORITHM (v0.2.25) ═════
   Task: [6 words]
📋 SUMMARY: [what was done]
🗣️ ${getDAName()}: [brief acknowledgment, 1 sentence]
</system-reminder>`;
  }
}

async function main() {
  try {
    // Skip for subagents — they run their own patterns
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    if (claudeProjectDir.includes('/.claude/Agents/') || process.env.CLAUDE_AGENT_TYPE) {
      process.exit(0);
    }

    const input = await readStdin();
    if (!input) {
      process.exit(0);
    }

    const data = JSON.parse(input);
    const prompt = data.prompt || data.user_prompt || '';

    if (!prompt) {
      process.exit(0);
    }

    // DETECT TELEGRAM MESSAGES - use Algorithm WITH phase notifications
    // Telegram bot adds marker or we detect via prompt content
    const isTelegramMessage = prompt.startsWith('[TELEGRAM]') ||
                                prompt.includes('📱') ||
                                process.env.TELEGRAM_BOT_REQUEST === '1' ||
                                data.request_source === 'telegram';

    // Strip the Telegram marker if present, but DON'T suppress the Algorithm
    // Telegram messages SHOULD use the Algorithm with real-time phase updates
    const cleanPrompt = prompt.replace(/^\[TELEGRAM\]\s*/, '');

    // RULE-BASED CLASSIFICATION — Zero API calls, pure regex pattern matching
    // Classifies depth as MINIMAL, ITERATION, or FULL based on content patterns
    const classification = classifyDepthRules(cleanPrompt);
    const reminder = buildReminder(classification.depth);

    console.log(reminder);
    process.exit(0);
  } catch (err) {
    // On any error, output FULL as safe default
    console.log(`<system-reminder>
ALGORITHM REQUIRED — DEPTH: FULL
Nothing escapes the Algorithm. Your response MUST use the 7-phase format:
- Start with: 🤖 PAI ALGORITHM header
- Include ALL phases: OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
- Use TaskCreate for ISC criteria, TaskList to display them
- End with voice line
</system-reminder>`);
    process.exit(0);
  }
}

main();
