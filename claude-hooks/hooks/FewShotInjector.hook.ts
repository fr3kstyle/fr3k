#!/usr/bin/env bun
/**
 * FewShotInjector.hook.ts - Inject relevant few-shot examples into context (UserPromptSubmit)
 *
 * PURPOSE:
 * Dynamically selects and injects relevant examples from episodic memory to improve
 * task performance through pattern recognition. Uses semantic search to find the
 * most applicable past successful interactions.
 *
 * TRIGGER: UserPromptSubmit
 *
 * INPUT:
 * - prompt: The user's message
 * - session_id: Current session identifier
 *
 * OUTPUT:
 * - stdout: Injected examples block (if examples found)
 * - exit(0): Normal completion (always succeeds, examples are optional)
 *
 * SIDE EFFECTS:
 * - Reads from MEMORY/EPISODIC/examples.json
 * - Updates example access counts
 *
 * INTER-HOOK RELATIONSHIPS:
 * - COORDINATES WITH: WorkCompletionLearning (populates examples from high-rated work)
 * - MUST RUN AFTER: AutoWorkCreation (to have work context)
 * - MUST RUN BEFORE: FormatReminder (examples go before format spec)
 *
 * ERROR HANDLING:
 * - Errors are logged but don't block the session
 * - Missing examples file is treated as empty
 *
 * PERFORMANCE:
 * - Non-blocking: File I/O only
 * - Typical execution time: < 50ms
 * - Cached in-memory for speed
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './hooks/lib/paths';
import { selectFewShots, formatExamplesForContext } from './hooks/lib/fewshot';

interface Payload {
  session_id: string;
  prompt: string;
  transcript_path: string;
  hook_event_name: string;
}

async function main() {
  try {
    // Read payload from stdin
    const payload: Payload = JSON.parse(await Bun.stdin.text());

    // Configuration
    const ENABLED = process.env.FEWSHOT_ENABLED !== 'false';
    const MAX_EXAMPLES = parseInt(process.env.FEWSHOT_MAX_EXAMPLES || '3', 10);
    const MIN_RATING = parseInt(process.env.FEWSHOT_MIN_RATING || '7', 10);

    if (!ENABLED) {
      process.exit(0);
    }

    // Select relevant examples
    const selection = selectFewShots(payload.prompt, MAX_EXAMPLES, MIN_RATING);

    // If no examples found, exit silently
    if (selection.examples.length === 0) {
      process.exit(0);
    }

    // Format examples for context injection
    const formatted = formatExamplesForContext(payload.prompt, MAX_EXAMPLES, MIN_RATING);

    // Output examples to inject into context
    console.log(formatted);

    // Optional: Log to debug file
    if (process.env.FEWSHOT_DEBUG === 'true') {
      const debugPath = join(getPaiDir(), 'MEMORY', 'STATE', 'fewshot-debug.log');
      const logEntry = {
        timestamp: new Date().toISOString(),
        sessionId: payload.session_id,
        taskType: selection.taskType,
        confidence: selection.confidence,
        examplesCount: selection.examples.length,
        promptPreview: payload.prompt.slice(0, 100),
      };
      const { appendFileSync } = await import('fs');
      appendFileSync(debugPath, JSON.stringify(logEntry) + '\n');
    }

    process.exit(0);
  } catch (error) {
    // Silent failure - examples are optional
    process.exit(0);
  }
}

main();
