/**
 * Memory System Tests
 *
 * Tests for the enhanced memory system including:
 * - SemanticMemoryStore
 * - EpisodicMemoryStore
 * - ProceduralMemoryStore
 * - FewShotSelector
 * - CompactionEngine
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync, mkdirSync } from 'fs';

// Mock the paths
process.env.PAI_DIR = tmpdir();

import {
  SemanticMemoryStore,
  EpisodicMemoryStore,
  ProceduralMemoryStore,
  MemoryManager,
  getMemoryManager,
} from '../memory-manager';

import {
  FewShotSelector,
  selectFewShots,
  formatExamplesForContext,
} from '../fewshot';

import {
  CompactionEngine,
  shouldCompact,
  compactContext,
  recordFileAccess,
  getCompactionReport,
} from '../compaction';

import type {
  SemanticMemory,
  EpisodicMemory,
  ProceduralMemory,
} from '../memory-types';

// ============================================================================
// Semantic Memory Tests
// ============================================================================

describe('SemanticMemoryStore', () => {
  let store: SemanticMemoryStore;

  beforeEach(() => {
    // Reset singleton
    (globalThis as any).memoryManagerInstance = null;
    store = new SemanticMemoryStore();
  });

  test('should store semantic memory', () => {
    const memory = store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'User prefers TypeScript over Python',
      confidence: 0.9,
      source: 'user_direct',
      tags: ['typescript', 'preference'],
    });

    expect(memory.id).toBeDefined();
    expect(memory.content).toBe('User prefers TypeScript over Python');
    expect(memory.confidence).toBe(0.9);
  });

  test('should retrieve stored memory by ID', () => {
    const stored = store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'Test content',
      confidence: 0.8,
      source: 'inferred',
      tags: [],
    });

    const retrieved = store.get(stored.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(stored.id);
    expect(retrieved?.accessCount).toBe(1);
  });

  test('should search by tags', () => {
    store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'User likes React',
      confidence: 0.9,
      source: 'user_direct',
      tags: ['react', 'frontend'],
    });

    store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'User uses TypeScript',
      confidence: 0.9,
      source: 'inferred',
      tags: ['typescript'],
    });

    const results = store.search({ tags: ['react'] });
    expect(results).toHaveLength(1);
    expect(results[0].item.content).toBe('User likes React');
  });

  test('should search by category', () => {
    store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'Prefers dark mode',
      confidence: 0.8,
      source: 'user_direct',
      tags: [],
    });

    store.store({
      type: 'semantic',
      category: 'project_context',
      content: 'Project uses Next.js',
      confidence: 0.9,
      source: 'project',
      tags: [],
    });

    const results = store.search({ category: 'user_preference' });
    expect(results).toHaveLength(1);
    expect(results[0].item.category).toBe('user_preference');
  });

  test('should filter by minimum confidence', () => {
    store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'Low confidence fact',
      confidence: 0.4,
      source: 'inferred',
      tags: [],
    });

    store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'High confidence fact',
      confidence: 0.9,
      source: 'user_direct',
      tags: [],
    });

    const results = store.search({ minConfidence: 0.7 });
    expect(results).toHaveLength(1);
    expect(results[0].item.content).toBe('High confidence fact');
  });
});

// ============================================================================
// Episodic Memory Tests
// ============================================================================

describe('EpisodicMemoryStore', () => {
  let store: EpisodicMemoryStore;

  beforeEach(() => {
    store = new EpisodicMemoryStore();
  });

  test('should store episodic memory', () => {
    const memory = store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'bug_fix',
      content: 'Fixed authentication bug by updating token refresh logic',
      outcome: 'success',
      rating: 8,
      sessionId: 'test-session',
      tags: ['bug', 'auth'],
    });

    expect(memory.id).toBeDefined();
    expect(memory.taskType).toBe('bug_fix');
    expect(memory.rating).toBe(8);
  });

  test('should add high-rated memories to examples', () => {
    store.store({
      type: 'episodic',
      category: 'few_shot_example',
      taskType: 'feature_implementation',
      content: 'Implemented user registration flow',
      outcome: 'success',
      rating: 9,
      sessionId: 'test-session',
      tags: ['feature', 'auth'],
    });

    const examples = store.getExamples('feature_implementation', 7, 5);
    expect(examples.length).toBeGreaterThan(0);
    expect(examples[0].taskType).toBe('feature_implementation');
  });

  test('should filter examples by minimum rating', () => {
    store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'bug_fix',
      content: 'Fixed bug',
      outcome: 'success',
      rating: 5,
      sessionId: 'test',
      tags: [],
    });

    store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'bug_fix',
      content: 'Fixed another bug',
      outcome: 'success',
      rating: 8,
      sessionId: 'test',
      tags: [],
    });

    const examples = store.getExamples('bug_fix', 7, 10);
    expect(examples).toHaveLength(1);
    expect(examples[0].rating).toBe(8);
  });

  test('should search by task type', () => {
    store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'bug_fix',
      content: 'Fixed bug',
      outcome: 'success',
      sessionId: 'test',
      tags: [],
    });

    store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'feature_implementation',
      content: 'Added feature',
      outcome: 'success',
      sessionId: 'test',
      tags: [],
    });

    const results = store.search({ taskType: 'bug_fix' });
    expect(results).toHaveLength(1);
    expect(results[0].item.taskType).toBe('bug_fix');
  });
});

// ============================================================================
// Procedural Memory Tests
// ============================================================================

describe('ProceduralMemoryStore', () => {
  let store: ProceduralMemoryStore;

  beforeEach(() => {
    store = new ProceduralMemoryStore();
  });

  test('should store procedural memory', () => {
    const memory = store.store({
      type: 'procedural',
      category: 'system_prompt',
      name: 'TDD Prompt Template',
      content: 'Always write tests before implementation...',
      effectiveness: 0.8,
      tags: ['tdd', 'testing'],
    });

    expect(memory.id).toBeDefined();
    expect(memory.name).toBe('TDD Prompt Template');
    expect(memory.version).toBe(1);
    expect(memory.effectiveness).toBe(0.8);
  });

  test('should retrieve by name', () => {
    store.store({
      type: 'procedural',
      category: 'system_prompt',
      name: 'Test Prompt',
      content: 'Content',
      effectiveness: 0.5,
      tags: [],
    });

    const retrieved = store.getByName('Test Prompt');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Prompt');
  });

  test('should update effectiveness on success', () => {
    const memory = store.store({
      type: 'procedural',
      category: 'system_prompt',
      name: 'Test Prompt',
      content: 'Content',
      effectiveness: 0.5,
      tags: [],
    });

    store.updateEffectiveness(memory.id, 'success');

    const updated = store.get(memory.id);
    expect(updated?.effectiveness).toBeGreaterThan(0.5);
  });

  test('should update effectiveness on failure', () => {
    const memory = store.store({
      type: 'procedural',
      category: 'system_prompt',
      name: 'Test Prompt',
      content: 'Content',
      effectiveness: 0.8,
      tags: [],
    });

    store.updateEffectiveness(memory.id, 'failure');

    const updated = store.get(memory.id);
    expect(updated?.effectiveness).toBeLessThan(0.8);
  });

  test('should search and sort by effectiveness', () => {
    store.store({
      type: 'procedural',
      category: 'system_prompt',
      name: 'Low Effectiveness',
      content: 'Content',
      effectiveness: 0.3,
      tags: [],
    });

    store.store({
      type: 'procedural',
      category: 'system_prompt',
      name: 'High Effectiveness',
      content: 'Content',
      effectiveness: 0.9,
      tags: [],
    });

    const results = store.search({ category: 'system_prompt' });
    expect(results[0].item.effectiveness).toBeGreaterThan(results[1].item.effectiveness);
  });
});

// ============================================================================
// Few-Shot Selector Tests
// ============================================================================

describe('FewShotSelector', () => {
  let selector: FewShotSelector;
  let memory: MemoryManager;

  beforeEach(() => {
    selector = new FewShotSelector();
    memory = getMemoryManager();
  });

  test('should classify bug fix tasks', () => {
    const taskType = selector.classifyTaskType('fix the authentication bug');
    expect(taskType).toBe('bug_fix');
  });

  test('should classify feature implementation tasks', () => {
    const taskType = selector.classifyTaskType('implement user registration');
    expect(taskType).toBe('feature_implementation');
  });

  test('should classify refactoring tasks', () => {
    const taskType = selector.classifyTaskType('refactor the authentication module');
    expect(taskType).toBe('code_refactor');
  });

  test('should classify testing tasks', () => {
    const taskType = selector.classifyTaskType('add unit tests for the auth module');
    expect(taskType).toBe('testing');
  });

  test('should return general for unknown tasks', () => {
    const taskType = selector.classifyTaskType('hello world');
    expect(taskType).toBe('general');
  });

  test('should select few-shots for a task', () => {
    // Add some examples
    memory.episodic.store({
      type: 'episodic',
      category: 'few_shot_example',
      taskType: 'bug_fix',
      content: 'Fixed auth bug by updating token handling',
      outcome: 'success',
      rating: 8,
      sessionId: 'test',
      tags: ['bug', 'auth'],
    });

    const selection = selector.selectFewShots('fix the login bug', 3, 7);
    expect(selection.taskType).toBe('bug_fix');
  });

  test('should format examples for context', () => {
    memory.episodic.store({
      type: 'episodic',
      category: 'few_shot_example',
      taskType: 'bug_fix',
      content: 'Example approach',
      outcome: 'success',
      rating: 8,
      sessionId: 'test',
      tags: [],
    });

    const formatted = selector.formatExamplesForContext({
      examples: memory.episodic.getExamples('bug_fix', 7, 1),
      taskType: 'bug_fix',
      confidence: 1,
      reasoning: 'Test',
    });

    expect(formatted).toContain('Relevant Examples');
    expect(formatted).toContain('Task Type: bug_fix');
  });
});

// ============================================================================
// Compaction Engine Tests
// ============================================================================

describe('CompactionEngine', () => {
  let engine: CompactionEngine;

  beforeEach(() => {
    engine = new CompactionEngine();
  });

  test('should detect when compaction is needed', () => {
    expect(engine.shouldCompact(160000, 200000)).toBe(true); // 80%
    expect(engine.shouldCompact(150000, 200000)).toBe(false); // 75%
  });

  test('should track file access', () => {
    engine.recordFileAccess('/path/to/file.ts', 'TypeScript module');
    engine.recordFileAccess('/path/to/other.ts');

    const state = engine.getState();
    expect(state.preservedContext.recentFiles.length).toBeGreaterThan(0);
  });

  test('should limit tracked files to max', () => {
    for (let i = 0; i < 10; i++) {
      engine.recordFileAccess(`/path/to/file${i}.ts`);
    }

    const state = engine.getState();
    // Should only track most recent/accessed files
    expect(state.preservedContext.recentFiles.length).toBeLessThanOrEqual(5);
  });

  test('should perform compaction', () => {
    engine.recordFileAccess('/test/file.ts', 'Test file');
    engine.recordToolOutput('Bash', 'some output');

    const result = engine.compact(190000, 200000);

    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.tokensSaved).toBeGreaterThanOrEqual(0);
  });

  test('should generate compaction report', () => {
    const report = engine.getReport();
    expect(report).toContain('Context Compaction Report');
    expect(report).toContain('Statistics');
  });

  test('should identify critical content markers', () => {
    expect(CompactionEngine.isCriticalContent('This is an important: decision')).toBe(true);
    expect(CompactionEngine.isCriticalContent('Bug: needs fixing')).toBe(true);
    expect(CompactionEngine.isCriticalContent('Random content')).toBe(false);
  });

  test('should identify tool output patterns', () => {
    expect(CompactionEngine.isToolOutput('Output from Bash:')).toBe(true);
    expect(CompactionEngine.isToolOutput('Result: success')).toBe(true);
    expect(CompactionEngine.isToolOutput('Normal conversation')).toBe(false);
  });
});

// ============================================================================
// Convenience Function Tests
// ============================================================================

describe('Convenience Functions', () => {
  test('shouldCompact should work', () => {
    expect(shouldCompact(160000, 200000)).toBe(true);
    expect(shouldCompact(100000, 200000)).toBe(false);
  });

  test('selectFewShots convenience function', () => {
    const selection = selectFewShots('fix the bug', 3, 7);
    expect(selection).toBeDefined();
    expect(selection.taskType).toBeDefined();
  });

  test('formatExamplesForContext convenience function', () => {
    const formatted = formatExamplesForContext('test prompt', 3, 7);
    expect(typeof formatted).toBe('string');
  });

  test('recordFileAccess convenience function', () => {
    recordFileAccess('/test/path.ts', 'summary');
    // Should not throw
  });

  test('getCompactionReport convenience function', () => {
    const report = getCompactionReport();
    expect(typeof report).toBe('string');
    expect(report).toContain('Context Compaction Report');
  });
});
