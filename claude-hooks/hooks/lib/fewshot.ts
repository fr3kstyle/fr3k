/**
 * Few-Shot Example Selector
 *
 * Dynamically selects and injects relevant examples from episodic memory
 * to improve task performance through pattern recognition.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './paths';
import { getMemoryManager } from './memory-manager';
import type { ExampleEntry, MemorySearchQuery } from './memory-types';

const EXAMPLES_FILE = join(getPaiDir(), 'MEMORY', 'EPISODIC', 'examples.json');
const EMBEDDINGS_FILE = join(getPaiDir(), 'MEMORY', 'EPISODIC', 'embeddings.json');

/**
 * Embedding cache entry
 */
interface EmbeddingCache {
  [id: string]: number[];
}

/**
 * Task type classification
 */
export type TaskType =
  | 'bug_fix'
  | 'feature_implementation'
  | 'code_refactor'
  | 'code_review'
  | 'debugging'
  | 'testing'
  | 'documentation'
  | 'cli_tool'
  | 'api_integration'
  | 'data_processing'
  | 'general';

/**
 * Few-shot selection result
 */
export interface FewShotSelection {
  examples: ExampleEntry[];
  taskType: TaskType;
  confidence: number;
  reasoning: string;
}

/**
 * Task classification patterns
 */
const TASK_PATTERNS: Record<TaskType, RegExp[]> = {
  bug_fix: [
    /bug|fix|error|issue|broken|crash|fail/i,
    /not working|doesn't work|incorrect|wrong/i,
    /debug|troubleshoot|diagnose/i,
  ],
  feature_implementation: [
    /implement|add feature|create new|build.*feature/i,
    /develop.*functionality|new capability/i,
    /support.*for|enable.*to/i,
  ],
  code_refactor: [
    /refactor|restructure|reorganize|clean up/i,
    /improve.*code|code quality|maintainability/i,
    /extract|consolidate|simplify/i,
  ],
  code_review: [
    /review|check|validate|verify code/i,
    /audit.*code|inspect.*code/i,
  ],
  debugging: [
    /why.*not working|what.*wrong|how.*fix/i,
    /investigate|diagnose|troubleshoot/i,
  ],
  testing: [
    /test|spec|coverage|mock|fixture/i,
    /unit test|integration test|e2e/i,
    /tdd|test driven/i,
  ],
  documentation: [
    /document|readme|comment|docstring/i,
    /explain|describe|overview/i,
  ],
  cli_tool: [
    /cli|command line|script|tool/i,
    /executable|bin|argv|args/i,
  ],
  api_integration: [
    /api|endpoint|http|fetch|request/i,
    /integration|webhook|callback/i,
  ],
  data_processing: [
    /parse|transform|process.*data|csv|json/i,
    /filter|map|reduce|aggregate/i,
  ],
  general: [], // fallback
};

/**
 * FewShotSelector - Main class for example selection
 */
export class FewShotSelector {
  private embeddings: EmbeddingCache;

  constructor() {
    this.embeddings = this.loadEmbeddings();
  }

  private loadEmbeddings(): EmbeddingCache {
    if (!existsSync(EMBEDDINGS_FILE)) {
      return {};
    }
    try {
      return JSON.parse(readFileSync(EMBEDDINGS_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }

  private saveEmbeddings(): void {
    // Embeddings are usually stored externally, but we cache locally
    // This is a placeholder for integration with embedding service
  }

  /**
   * Classify task type from prompt
   */
  classifyTaskType(prompt: string): TaskType {
    const normalized = prompt.toLowerCase();

    // Check each task type for pattern matches
    const scores: Record<TaskType, number> = {
      bug_fix: 0,
      feature_implementation: 0,
      code_refactor: 0,
      code_review: 0,
      debugging: 0,
      testing: 0,
      documentation: 0,
      cli_tool: 0,
      api_integration: 0,
      data_processing: 0,
      general: 0,
    };

    for (const [taskType, patterns] of Object.entries(TASK_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          scores[taskType as TaskType] += 1;
        }
      }
    }

    // Find highest scoring task type
    let maxScore = 0;
    let bestType: TaskType = 'general';

    for (const [taskType, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestType = taskType as TaskType;
      }
    }

    return bestType;
  }

  /**
   * Select few-shot examples for a task
   *
   * @param prompt - The task prompt
   * @param k - Number of examples to select (default: 3)
   * @param minRating - Minimum rating threshold (default: 7)
   * @returns Selected examples with metadata
   */
  selectFewShots(
    prompt: string,
    k: number = 3,
    minRating: number = 7
  ): FewShotSelection {
    const taskType = this.classifyTaskType(prompt);
    const memory = getMemoryManager();
    const examples = memory.episodic.getExamples(taskType, minRating, k);

    // Calculate confidence based on example availability
    const confidence = examples.length >= k
      ? 1.0
      : examples.length / k;

    const reasoning = examples.length >= k
      ? `Found ${examples.length} relevant examples for task type "${taskType}"`
      : `Found ${examples.length}/${k} examples for task type "${taskType}" (consider adding more examples)`;

    return {
      examples,
      taskType,
      confidence,
      reasoning,
    };
  }

  /**
   * Select few-shots with semantic search
   *
   * Uses similarity scoring to find the most relevant examples
   */
  selectFewShotsSemantic(
    prompt: string,
    k: number = 3,
    minRating: number = 7
  ): FewShotSelection {
    const taskType = this.classifyTaskType(prompt);
    const memory = getMemoryManager();

    // First get examples by task type
    const taskExamples = memory.episodic.getExamples(taskType, minRating, 50);

    // Then rank by semantic similarity (simplified - in production, use real embeddings)
    const scored = taskExamples.map(ex => ({
      example: ex,
      score: this.calculateSimilarity(prompt, ex),
    }));

    scored.sort((a, b) => b.score - a.score);

    const examples = scored.slice(0, k).map(s => s.example);
    const confidence = scored.length > 0 ? scored[0].score : 0;

    return {
      examples,
      taskType,
      confidence,
      reasoning: `Semantic search selected ${examples.length} examples for "${taskType}"`,
    };
  }

  /**
   * Calculate similarity between prompt and example
   *
   * This is a simplified implementation using keyword overlap.
   * In production, use actual embedding vectors.
   */
  private calculateSimilarity(prompt: string, example: ExampleEntry): number {
    const promptWords = new Set(
      prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );
    const exampleWords = new Set(
      example.approach.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    // Tag matching
    const tagMatches = example.tags.filter(t =>
      prompt.toLowerCase().includes(t.toLowerCase())
    ).length;

    // Word overlap
    let wordMatches = 0;
    for (const word of promptWords) {
      if (exampleWords.has(word)) wordMatches++;
    }

    const wordScore = promptWords.size > 0 ? wordMatches / promptWords.size : 0;
    const tagScore = Math.min(tagMatches / 3, 0.3);

    return Math.min(wordScore + tagScore, 1);
  }

  /**
   * Format examples for injection into context
   */
  formatExamplesForContext(selection: FewShotSelection): string {
    if (selection.examples.length === 0) {
      return '';
    }

    const lines: string[] = [
      '## Relevant Examples',
      '',
      `Task Type: ${selection.taskType}`,
      `Confidence: ${(selection.confidence * 100).toFixed(0)}%`,
      '',
    ];

    for (let i = 0; i < selection.examples.length; i++) {
      const ex = selection.examples[i];
      lines.push(
        `### Example ${i + 1}`,
        '',
        `**Task:** ${ex.task}`,
        `**Rating:** ${ex.rating}/10`,
        `**Tags:** ${ex.tags.join(', ') || 'none'}`,
        '',
        `**Approach:**`,
        ex.approach,
        ''
      );
    }

    return lines.join('\n');
  }

  /**
   * Add a new example from a successful interaction
   */
  addExample(
    taskType: TaskType,
    task: string,
    approach: string,
    rating: number,
    sessionId: string,
    tags: string[] = []
  ): ExampleEntry {
    const memory = getMemoryManager();

    // Create episodic memory
    const episodic = memory.episodic.store({
      type: 'episodic',
      category: 'few_shot_example',
      taskType,
      content: approach,
      outcome: 'success',
      rating,
      sessionId,
      tags,
    });

    return {
      id: episodic.id,
      taskType,
      task,
      approach,
      result: 'success',
      rating,
      timestamp: episodic.timestamp,
      sessionId,
      tags,
      metadata: {},
    };
  }

  /**
   * Get statistics about the example store
   */
  getStats(): {
    totalExamples: number;
    byTaskType: Record<string, number>;
    avgRating: number;
  } {
    const memory = getMemoryManager();
    const examples = memory.episodic.getAllExamples();

    const byTaskType: Record<string, number> = {};
    let totalRating = 0;

    for (const ex of examples) {
      byTaskType[ex.taskType] = (byTaskType[ex.taskType] || 0) + 1;
      totalRating += ex.rating;
    }

    return {
      totalExamples: examples.length,
      byTaskType,
      avgRating: examples.length > 0 ? totalRating / examples.length : 0,
    };
  }
}

// Singleton instance
let selectorInstance: FewShotSelector | null = null;

export function getFewShotSelector(): FewShotSelector {
  if (!selectorInstance) {
    selectorInstance = new FewShotSelector();
  }
  return selectorInstance;
}

/**
 * Convenience function: select few-shots for a prompt
 */
export function selectFewShots(
  prompt: string,
  k: number = 3,
  minRating: number = 7
): FewShotSelection {
  return getFewShotSelector().selectFewShots(prompt, k, minRating);
}

/**
 * Convenience function: format examples for context
 */
export function formatExamplesForContext(
  prompt: string,
  k: number = 3,
  minRating: number = 7
): string {
  const selector = getFewShotSelector();
  const selection = selector.selectFewShots(prompt, k, minRating);
  return selector.formatExamplesForContext(selection);
}
