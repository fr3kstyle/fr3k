#!/usr/bin/env bun
/**
 * SemanticMemoryCapture.hook.ts - Capture user facts and preferences (SessionEnd)
 *
 * PURPOSE:
 * Extracts semantic memories (facts, preferences, context) from the completed
 * session and stores them for future reference. This builds long-term knowledge
 * about the user and their projects.
 *
 * TRIGGER: SessionEnd
 *
 * INPUT:
 * - session_id: Current session identifier
 * - transcript_path: Path to session transcript
 *
 * OUTPUT:
 * - stdout: Summary of captured memories
 * - exit(0): Normal completion
 *
 * SIDE EFFECTS:
 * - Writes to MEMORY/SEMANTIC/
 * - Updates semantic index
 *
 * INTER-HOOK RELATIONSHIPS:
 * - COORDINATES WITH: WorkCompletionLearning (shares transcript analysis)
 * - MUST RUN AFTER: WorkCompletionLearning (to get extracted insights)
 *
 * ERROR HANDLING:
 * - Errors are logged but don't block session end
 *
 * PERFORMANCE:
 * - Non-blocking: Async file I/O
 * - Typical execution time: < 100ms
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './hooks/lib/paths';
import { getMemoryManager } from './hooks/lib/memory-manager';
import type { SemanticMemory } from './hooks/lib/memory-types';

interface Payload {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
}

/**
 * Extract semantic facts from text
 */
function extractSemanticFacts(text: string): Array<{
  category: 'user_preference' | 'project_context' | 'technical_fact' | 'workflow';
  content: string;
  confidence: number;
  tags: string[];
}> {
  const facts: Array<{
    category: 'user_preference' | 'project_context' | 'technical_fact' | 'workflow';
    content: string;
    confidence: number;
    tags: string[];
  }> = [];

  const lines = text.split('\n');
  const lower = text.toLowerCase();

  // User preferences
  const prefPatterns = [
    { pattern: /(?:i prefer|i like|i'd rather|don't like|hate):?\s*(.+)/i, category: 'user_preference' as const },
    { pattern: /(?:always|never|usually|typically).{0,50}(?:use|prefer|want)/i, category: 'user_preference' as const, tags: ['habit'] },
  ];

  // Project context
  const contextPatterns = [
    { pattern: /(?:this project|the codebase|this repo(?:sitory)?) uses?\s*(.+)/i, category: 'project_context' as const, tags: ['stack'] },
    { pattern: /(?:we're working on|the project is|current goal):?\s*(.+)/i, category: 'project_context' as const, tags: ['goal'] },
  ];

  // Technical facts
  const techPatterns = [
    { pattern: /(?:written in|built with|uses?|stack):?\s*(typescript|javascript|python|rust|go|java)/i, category: 'technical_fact' as const, tags: ['language'] },
    { pattern: /(?:framework|library):?\s*(react|vue|svelte|angular|express|fastify|nest)/i, category: 'technical_fact' as const, tags: ['framework'] },
  ];

  // Workflow patterns
  const workflowPatterns = [
    { pattern: /(?:my workflow|i usually|i typically):?\s*(.+)/i, category: 'workflow' as const, tags: ['workflow'] },
  ];

  const allPatterns = [...prefPatterns, ...contextPatterns, ...techPatterns, ...workflowPatterns];

  for (const { pattern, category, tags: defaultTags } of allPatterns) {
    const match = text.match(pattern);
    if (match) {
      facts.push({
        category,
        content: match[1] || match[0],
        confidence: 0.7,
        tags: defaultTags || [],
      });
    }
  }

  return facts;
}

async function main() {
  try {
    const payload: Payload = JSON.parse(await Bun.stdin.text());

    const ENABLED = process.env.SEMANTIC_MEMORY_ENABLED !== 'false';

    if (!ENABLED) {
      process.exit(0);
    }

    // Read transcript
    if (!existsSync(payload.transcript_path)) {
      process.exit(0);
    }

    const transcript = readFileSync(payload.transcript_path, 'utf-8');
    const memory = getMemoryManager();

    // Extract semantic facts
    const facts = extractSemanticFacts(transcript);

    // Store facts
    const stored: SemanticMemory[] = [];
    for (const fact of facts) {
      const semantic = memory.semantic.store({
        type: 'semantic',
        category: fact.category,
        content: fact.content,
        confidence: fact.confidence,
        source: 'inferred',
        tags: fact.tags,
      });
      stored.push(semantic);
    }

    if (stored.length > 0) {
      console.log(`\n## Semantic Memory Captured`);
      console.log(`Stored ${stored.length} facts about your preferences and context.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('SemanticMemoryCapture error:', error);
    process.exit(0); // Don't block on error
  }
}

main();
