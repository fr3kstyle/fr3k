#!/usr/bin/env tsx
/**
 * Memory System Demo
 *
 * Demonstrates the enhanced memory system capabilities:
 * - Semantic Memory (facts, preferences)
 * - Episodic Memory (examples, patterns)
 * - Procedural Memory (skills, prompts)
 * - Few-Shot Selection
 * - Compaction Engine
 */

import { getMemoryManager } from './lib/memory-manager';
import { selectFewShots, formatExamplesForContext, FewShotSelector } from './lib/fewshot';
import { shouldCompact, compactContext, recordFileAccess, getCompactionReport } from './lib/compaction';

console.log('='.repeat(60));
console.log('FR3K Enhanced Memory System Demo');
console.log('='.repeat(60));

const memory = getMemoryManager();

// ============================================================================
// SEMANTIC MEMORY DEMO
// ============================================================================
console.log('\n## Semantic Memory Demo');
console.log('-'.repeat(40));

// Store user preferences
const pref1 = memory.semantic.store({
  type: 'semantic',
  category: 'user_preference',
  content: 'User prefers TypeScript over Python for all new projects',
  confidence: 0.95,
  source: 'user_direct',
  tags: ['typescript', 'preference', 'language'],
});
console.log(`Stored: ${pref1.content}`);

const pref2 = memory.semantic.store({
  type: 'semantic',
  category: 'user_preference',
  content: 'Prefers dark mode themes in all applications',
  confidence: 0.9,
  source: 'user_direct',
  tags: ['ui', 'preference', 'theme'],
});
console.log(`Stored: ${pref2.content}`);

// Store project context
const ctx1 = memory.semantic.store({
  type: 'semantic',
  category: 'project_context',
  content: 'Project uses React with TypeScript and Vite for frontend',
  confidence: 1.0,
  source: 'project',
  tags: ['react', 'typescript', 'vite', 'frontend'],
});
console.log(`Stored: ${ctx1.content}`);

// Search semantic memories
console.log('\nSearching for "typescript":');
const results = memory.semantic.search({ query: 'typescript', limit: 5 });
for (const r of results) {
  console.log(`  - [${r.relevance.toFixed(2)}] ${r.item.content}`);
}

// ============================================================================
// EPISODIC MEMORY DEMO
// ============================================================================
console.log('\n## Episodic Memory Demo');
console.log('-'.repeat(40));

// Store successful task as example
const bug1 = memory.episodic.store({
  type: 'episodic',
  category: 'few_shot_example',
  taskType: 'bug_fix',
  content: `Fixed authentication bug by updating token refresh logic in AuthManager class.
The issue was that the JWT token was not being refreshed before expiry.
Solution: Added auto-refresh 5 minutes before token expires.`,
  outcome: 'success',
  rating: 9,
  sessionId: 'demo-session-1',
  tags: ['bug', 'auth', 'jwt', 'token'],
});
console.log(`Stored bug_fix example (rating: ${bug1.rating})`);

const feature1 = memory.episodic.store({
  type: 'episodic',
  category: 'few_shot_example',
  taskType: 'feature_implementation',
  content: `Implemented user registration flow with email verification.
Used React Hook Form for validation, nodemailer for sending emails.
Added rate limiting to prevent abuse.`,
  outcome: 'success',
  rating: 8,
  sessionId: 'demo-session-2',
  tags: ['feature', 'auth', 'email'],
});
console.log(`Stored feature_implementation example (rating: ${feature1.rating})`);

// Get examples
console.log('\nExamples for "bug_fix" task type:');
const bugExamples = memory.episodic.getExamples('bug_fix', 7, 5);
for (const ex of bugExamples) {
  console.log(`  - [${ex.rating}/10] ${ex.approach.slice(0, 60)}...`);
}

// ============================================================================
// PROCEDURAL MEMORY DEMO
// ============================================================================
console.log('\n## Procedural Memory Demo');
console.log('-'.repeat(40));

// Store system prompt
const prompt1 = memory.procedural.store({
  type: 'procedural',
  category: 'system_prompt',
  name: 'TDD Workflow Prompt',
  content: `Always follow Test-Driven Development:
1. Write failing test first (Red)
2. Write minimal implementation to pass (Green)
3. Refactor for clarity (Refactor)
Never skip the test phase.`,
  effectiveness: 0.8,
  tags: ['tdd', 'testing', 'workflow'],
});
console.log(`Stored: ${prompt1.name} (effectiveness: ${prompt1.effectiveness})`);

// Update effectiveness
memory.procedural.updateEffectiveness(prompt1.id, 'success');
const updated = memory.procedural.get(prompt1.id);
console.log(`After success update, effectiveness: ${updated.effectiveness.toFixed(3)}`);

// ============================================================================
// FEW-SHOT SELECTION DEMO
// ============================================================================
console.log('\n## Few-Shot Selection Demo');
console.log('-'.repeat(40));

const tasks = [
  'fix the authentication bug',
  'implement user registration',
  'refactor the data processing module',
];

for (const task of tasks) {
  const selection = selectFewShots(task, 2, 7);
  console.log(`\nTask: "${task}"`);
  console.log(`  Classified as: ${selection.taskType}`);
  console.log(`  Confidence: ${(selection.confidence * 100).toFixed(0)}%`);
  console.log(`  Examples found: ${selection.examples.length}`);
}

// ============================================================================
// COMPACTION ENGINE DEMO
// ============================================================================
console.log('\n## Compaction Engine Demo');
console.log('-'.repeat(40));

// Check if compaction needed
const currentTokens = 185000;
const maxTokens = 200000;
console.log(`Current tokens: ${currentTokens}/${maxTokens}`);
console.log(`Should compact: ${shouldCompact(currentTokens, maxTokens)}`);

if (shouldCompact(currentTokens, maxTokens)) {
  const result = compactContext(currentTokens, maxTokens);
  console.log(`\nCompaction result:`);
  console.log(`  Actions: ${result.actions.join(', ')}`);
  console.log(`  Tokens saved: ${result.tokensSaved}`);
}

// Record file access
recordFileAccess('/home/fr3k/.claude/hooks/lib/memory-manager.ts', 'Memory management system');
recordFileAccess('/home/fr3k/.claude/hooks/lib/fewshot.ts', 'Few-shot selection');
recordFileAccess('/home/fr3k/.claude/hooks/lib/compaction.ts', 'Context compaction');

// ============================================================================
// MEMORY STATISTICS
// ============================================================================
console.log('\n## Memory Statistics');
console.log('-'.repeat(40));

const stats = memory.getStats();
console.log(`Semantic memories: ${stats.semantic.total}`);
console.log(`  By category:`);
for (const [cat, count] of Object.entries(stats.semantic.byCategory)) {
  console.log(`    - ${cat}: ${count}`);
}

console.log(`\nEpisodic memories: ${stats.episodic.total}`);
console.log(`  By task type:`);
for (const [type, count] of Object.entries(stats.episodic.byTaskType)) {
  console.log(`    - ${type}: ${count}`);
}
console.log(`  Examples: ${stats.episodic.examples}`);

console.log(`\nProcedural memories: ${stats.procedural.total}`);
console.log(`  Average effectiveness: ${(stats.procedural.avgEffectiveness * 100).toFixed(0)}%`);

// ============================================================================
// COMPACTION REPORT
// ============================================================================
console.log('\n## Compaction Report');
console.log('-'.repeat(40));
console.log(getCompactionReport());

console.log('\n' + '='.repeat(60));
console.log('Demo complete!');
console.log('='.repeat(60));
