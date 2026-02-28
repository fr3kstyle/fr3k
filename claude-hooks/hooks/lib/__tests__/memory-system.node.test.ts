/**
 * Memory System Tests - Node.js Compatible
 *
 * Simple test runner compatible with Node.js/tsx
 */

const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Generate unique temp dir for this test run
const uniqueId = crypto.randomBytes(8).toString('hex');
process.env.PAI_DIR = path.join(os.tmpdir(), `memory-test-${uniqueId}`);

// Simple test framework
let passed = 0;
let failed = 0;
const results: { name: string; status: string; error?: string }[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      passed++;
      results.push({ name, status: 'PASS' });
      console.log(`  PASS: ${name}`);
    } catch (error) {
      failed++;
      results.push({ name, status: 'FAIL', error: String(error) });
      console.log(`  FAIL: ${name}`);
      console.error(`    Error: ${error}`);
    }
  };
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`);
      }
    },
    toBeGreaterThan: (expected: any) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThan: (expected: any) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    },
    toBeLessThanOrEqual: (expected: any) => {
      if (actual > expected) {
        throw new Error(`Expected ${actual} <= ${expected}`);
      }
    },
    toHaveLength: (expected: number) => {
      if (!Array.isArray(actual) || actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual?.length}`);
      }
    },
    toContain: (expected: string) => {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
  };
}

// Import modules dynamically
async function runTests() {
  console.log('Running Memory System Tests...\n');
  console.log(`Test directory: ${process.env.PAI_DIR}\n`);

  const {
    SemanticMemoryStore,
    EpisodicMemoryStore,
    ProceduralMemoryStore,
  } = await import('../memory-manager');

  const {
    FewShotSelector,
  } = await import('../fewshot');

  const {
    CompactionEngine,
  } = await import('../compaction');

  // =========================================================================
  // Semantic Memory Tests
  // =========================================================================
  console.log('SemanticMemoryStore:');
  await test('should store semantic memory', () => {
    const store = new SemanticMemoryStore();
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
  })();

  await test('should retrieve stored memory by ID', () => {
    const store = new SemanticMemoryStore();
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
    expect(retrieved.id).toBe(stored.id);
  })();

  await test('should search by tags', () => {
    const store = new SemanticMemoryStore();
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
    expect(results.length).toBe(1);
    expect(results[0].item.content).toBe('User likes React');
  })();

  await test('should search by category', () => {
    // Use getAll to verify filtering since index is shared across tests
    const store = new SemanticMemoryStore();
    const mem1 = store.store({
      type: 'semantic',
      category: 'user_preference',
      content: 'Prefers dark mode - category test',
      confidence: 0.8,
      source: 'user_direct',
      tags: [],
    });
    store.store({
      type: 'semantic',
      category: 'project_context',
      content: 'Project uses Next.js - category test',
      confidence: 0.9,
      source: 'project',
      tags: [],
    });
    const results = store.search({ category: 'user_preference' });
    // Filter to only our test content to avoid cross-test contamination
    const ourResults = results.filter(r => r.item.content.includes('- category test'));
    expect(ourResults.length).toBe(1);
    expect(ourResults[0].item.category).toBe('user_preference');
  })();

  // =========================================================================
  // Episodic Memory Tests
  // =========================================================================
  console.log('\nEpisodicMemoryStore:');
  await test('should store episodic memory', () => {
    const store = new EpisodicMemoryStore();
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
  })();

  await test('should add high-rated memories to examples', () => {
    const store = new EpisodicMemoryStore();
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
  })();

  await test('should filter examples by minimum rating', () => {
    const store = new EpisodicMemoryStore();
    store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'bug_fix',
      content: 'Fixed bug - rating filter test',
      outcome: 'success',
      rating: 5,
      sessionId: 'rating-filter-test-1',
      tags: [],
    });
    store.store({
      type: 'episodic',
      category: 'task_execution',
      taskType: 'bug_fix',
      content: 'Fixed another bug - rating filter test',
      outcome: 'success',
      rating: 8,
      sessionId: 'rating-filter-test-2',
      tags: [],
    });
    const examples = store.getExamples('bug_fix', 7, 10);
    // Filter to only our test examples (note: examples use 'approach' not 'content')
    const ourExamples = examples.filter(e => e.approach.includes('- rating filter test'));
    expect(ourExamples.length).toBe(1);
    expect(ourExamples[0].rating).toBe(8);
  })();

  // =========================================================================
  // Procedural Memory Tests
  // =========================================================================
  console.log('\nProceduralMemoryStore:');
  await test('should store procedural memory', () => {
    const store = new ProceduralMemoryStore();
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
  })();

  await test('should retrieve by name', () => {
    const store = new ProceduralMemoryStore();
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
    expect(retrieved.name).toBe('Test Prompt');
  })();

  await test('should update effectiveness on success', () => {
    const store = new ProceduralMemoryStore();
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
    expect(updated.effectiveness).toBeGreaterThan(0.5);
  })();

  // =========================================================================
  // Few-Shot Selector Tests
  // =========================================================================
  console.log('\nFewShotSelector:');
  await test('should classify bug fix tasks', () => {
    const selector = new FewShotSelector();
    const taskType = selector.classifyTaskType('fix the authentication bug');
    expect(taskType).toBe('bug_fix');
  })();

  await test('should classify feature implementation tasks', () => {
    const selector = new FewShotSelector();
    const taskType = selector.classifyTaskType('implement user registration');
    expect(taskType).toBe('feature_implementation');
  })();

  await test('should classify refactoring tasks', () => {
    const selector = new FewShotSelector();
    const taskType = selector.classifyTaskType('refactor the authentication module');
    expect(taskType).toBe('code_refactor');
  })();

  await test('should classify testing tasks', () => {
    const selector = new FewShotSelector();
    const taskType = selector.classifyTaskType('add unit tests for the auth module');
    expect(taskType).toBe('testing');
  })();

  await test('should return general for unknown tasks', () => {
    const selector = new FewShotSelector();
    const taskType = selector.classifyTaskType('hello world');
    expect(taskType).toBe('general');
  })();

  // =========================================================================
  // Compaction Engine Tests
  // =========================================================================
  console.log('\nCompactionEngine:');
  await test('should detect when compaction is needed', () => {
    const engine = new CompactionEngine();
    expect(engine.shouldCompact(160000, 200000)).toBe(true);
    expect(engine.shouldCompact(150000, 200000)).toBe(false);
  })();

  await test('should track file access', () => {
    const engine = new CompactionEngine();
    engine.recordFileAccess('/path/to/file.ts', 'TypeScript module');
    engine.recordFileAccess('/path/to/other.ts');
    const state = engine.getState();
    expect(state.preservedContext.recentFiles.length).toBeGreaterThan(0);
  })();

  await test('should limit tracked files to max', () => {
    const engine = new CompactionEngine();
    for (let i = 0; i < 10; i++) {
      engine.recordFileAccess(`/path/to/file${i}.ts`);
    }
    const state = engine.getState();
    expect(state.preservedContext.recentFiles.length <= 5).toBe(true);
  })();

  await test('should generate compaction report', () => {
    const engine = new CompactionEngine();
    const report = engine.getReport();
    expect(report).toContain('Context Compaction Report');
    expect(report).toContain('Statistics');
  })();

  await test('should identify critical content markers', () => {
    expect(CompactionEngine.isCriticalContent('This is an important: decision')).toBe(true);
    expect(CompactionEngine.isCriticalContent('Bug: needs fixing')).toBe(true);
    expect(CompactionEngine.isCriticalContent('Random content')).toBe(false);
  })();

  await test('should identify tool output patterns', () => {
    expect(CompactionEngine.isToolOutput('Output from Bash:')).toBe(true);
    expect(CompactionEngine.isToolOutput('Result: success')).toBe(true);
    expect(CompactionEngine.isToolOutput('Normal conversation')).toBe(false);
  })();

  // =========================================================================
  // Results
  // =========================================================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
