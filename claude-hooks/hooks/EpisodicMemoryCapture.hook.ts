#!/usr/bin/env bun
/**
 * EpisodicMemoryCapture.hook.ts - Capture task examples from high-rated work (SessionEnd)
 *
 * PURPOSE:
 * Converts high-rated completed work into few-shot examples stored in episodic
 * memory. These examples are used by the FewShotSelector to provide relevant
 * patterns for future similar tasks.
 *
 * TRIGGER: SessionEnd
 *
 * INPUT:
 * - session_id: Current session identifier
 * - session_rating: Optional rating from the session
 *
 * OUTPUT:
 * - stdout: Summary of examples captured
 * - exit(0): Normal completion
 *
 * SIDE EFFECTS:
 * - Writes to MEMORY/EPISODIC/examples.json
 * - Updates episodic index
 *
 * INTER-HOOK RELATIONSHIPS:
 * - COORDINATES WITH: ExplicitRatingCapture, WorkCompletionLearning
 * - DEPENDS ON: ratings from ExplicitRatingCapture
 * - MUST RUN AFTER: WorkCompletionLearning (to get work summary)
 *
 * ERROR HANDLING:
 * - Errors are logged but don't block session end
 *
 * PERFORMANCE:
 * - Non-blocking: File I/O only
 * - Typical execution time: < 100ms
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './hooks/lib/paths';
import { getMemoryManager } from './hooks/lib/memory-manager';
import type { TaskType } from './hooks/lib/fewshot';

interface Payload {
  session_id: string;
  transcript_path?: string;
  hook_event_name: string;
}

interface WorkMetadata {
  taskType?: string;
  summary?: string;
  rating?: number;
}

/**
 * Classify task type from content
 */
function classifyTaskType(content: string): TaskType {
  const lower = content.toLowerCase();

  if (/bug|fix|error|issue|broken|crash|fail/.test(lower)) return 'bug_fix';
  if (/implement|add feature|create new|build.*feature/.test(lower)) return 'feature_implementation';
  if (/refactor|restructure|reorganize|clean up/.test(lower)) return 'code_refactor';
  if (/review|check|validate|verify code/.test(lower)) return 'code_review';
  if (/test|spec|coverage|mock|tdd/.test(lower)) return 'testing';
  if (/document|readme|comment|docstring/.test(lower)) return 'documentation';
  if (/cli|command line|script|tool/.test(lower)) return 'cli_tool';
  if (/api|endpoint|http|fetch|request/.test(lower)) return 'api_integration';
  if (/parse|transform|process.*data|csv|json/.test(lower)) return 'data_processing';

  return 'general';
}

async function main() {
  try {
    const payload: Payload = JSON.parse(await Bun.stdin.text());

    const ENABLED = process.env.EPISODIC_MEMORY_ENABLED !== 'false';
    const MIN_RATING = parseInt(process.env.EPISODIC_MIN_RATING || '7', 10);

    if (!ENABLED) {
      process.exit(0);
    }

    // Try to read work metadata
    const workPath = join(getPaiDir(), 'MEMORY', 'STATE', 'current-work.json');
    if (!existsSync(workPath)) {
      process.exit(0);
    }

    const work: WorkMetadata = JSON.parse(readFileSync(workPath, 'utf-8'));

    // Only capture if high rating
    if (!work.rating || work.rating < MIN_RATING) {
      process.exit(0);
    }

    // Get transcript for approach
    let transcript = '';
    if (payload.transcript_path && existsSync(payload.transcript_path)) {
      transcript = readFileSync(payload.transcript_path, 'utf-8');
    }

    // Extract approach from transcript (simplified)
    const approach = work.summary || transcript.slice(0, 1000);

    const memory = getMemoryManager();
    const taskType = classifyTaskType(approach);

    // Store as episodic memory
    const episodic = memory.episodic.store({
      type: 'episodic',
      category: 'few_shot_example',
      taskType,
      content: approach,
      outcome: 'success',
      rating: work.rating,
      sessionId: payload.session_id,
      tags: [taskType, `rating-${work.rating}`],
    });

    console.log(`\n## Episodic Memory Captured`);
    console.log(`Added example for "${taskType}" (rating: ${work.rating}/10)`);

    process.exit(0);
  } catch (error) {
    console.error('EpisodicMemoryCapture error:', error);
    process.exit(0); // Don't block on error
  }
}

main();
