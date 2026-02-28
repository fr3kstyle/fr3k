# Memory System Integration Guide

This document describes how to integrate the three new memory enhancements into your FR3K hook system.

## Enhancement 4: Enhanced Memory System

### Memory Types Created

The enhanced memory system consists of three memory types:

1. **Semantic Memory** (`MEMORY/SEMANTIC/`)
   - User profiles, preferences, facts
   - Project-specific context
   - Searchable by tags/keywords

2. **Episodic Memory** (`MEMORY/EPISODIC/`)
   - Past agent actions and outcomes
   - Few-shot examples indexed by task type
   - Success patterns to replicate
   - Failure cases to avoid

3. **Procedural Memory** (`MEMORY/PROCEDURAL/`)
   - System prompts that evolve
   - Skill definitions refined by usage
   - Response format optimizations
   - Dynamic prompt refinement

### Files Created

- `hooks/lib/memory-types.ts` - TypeScript type definitions
- `hooks/lib/memory-manager.ts` - Unified memory access (SemanticMemoryStore, EpisodicMemoryStore, ProceduralMemoryStore, MemoryManager)
- `hooks/lib/fewshot.ts` - Few-shot example selection
- `hooks/lib/compaction.ts` - Context compaction engine
- `hooks/lib/__tests__/memory-system.node.test.ts` - 21 passing tests

### Usage Examples

```typescript
import { getMemoryManager } from './lib/memory-manager';

const memory = getMemoryManager();

// Store semantic memory
memory.semantic.store({
  type: 'semantic',
  category: 'user_preference',
  content: 'User prefers TypeScript over Python',
  confidence: 0.9,
  source: 'user_direct',
  tags: ['typescript', 'preference'],
});

// Search semantic memories
const results = memory.semantic.search({
  query: 'typescript',
  tags: ['preference'],
  limit: 5,
});

// Store episodic memory
memory.episodic.store({
  type: 'episodic',
  category: 'few_shot_example',
  taskType: 'bug_fix',
  content: 'Fixed authentication bug by updating token refresh logic',
  outcome: 'success',
  rating: 8,
  sessionId: 'session-123',
  tags: ['bug', 'auth'],
});

// Get examples for few-shot learning
const examples = memory.episodic.getExamples('bug_fix', 7, 5);

// Store procedural memory
memory.procedural.store({
  type: 'procedural',
  category: 'system_prompt',
  name: 'TDD Prompt Template',
  content: 'Always write tests before implementation...',
  effectiveness: 0.8,
  tags: ['tdd', 'testing'],
});

// Update effectiveness based on outcome
const procedural = memory.procedural.getByName('TDD Prompt Template');
memory.procedural.updateEffectiveness(procedural.id, 'success');
```

## Enhancement 5: Dynamic Few-Shot Selection

### Components

1. **FewShotSelector** class - Task classification and example selection
2. **Example Store** - `MEMORY/EPISODIC/examples.json`
3. **Convenience functions** - `selectFewShots()`, `formatExamplesForContext()`

### Usage

```typescript
import { selectFewShots, formatExamplesForContext } from './lib/fewshot';

// Select relevant examples
const selection = selectFewShots('fix the authentication bug', 3, 7);
// Returns: { examples, taskType, confidence, reasoning }

// Format for context injection
const formatted = formatExamplesForContext('fix the authentication bug');
// Returns markdown formatted examples block

// Use in hooks
console.log(formatted); // Injects into context
```

### Task Types Supported

- `bug_fix` - Fixing bugs and errors
- `feature_implementation` - Adding new features
- `code_refactor` - Refactoring code
- `code_review` - Reviewing code
- `debugging` - Investigating issues
- `testing` - Writing tests
- `documentation` - Writing docs
- `cli_tool` - Building CLI tools
- `api_integration` - API integrations
- `data_processing` - Data transformation
- `general` - Fallback

## Enhancement 6: Tool Result Clearing and Compaction Engine

### Components

1. **CompactionEngine** class - Context optimization
2. **Multi-stage compaction** - Tool clearing, summarization, structured notes
3. **Quality validation** - Preserves critical context

### Usage

```typescript
import {
  shouldCompact,
  compactContext,
  recordFileAccess,
  getCompactionReport,
  CompactionEngine
} from './lib/compaction';

// Check if compaction needed
if (shouldCompact(currentTokens, maxTokens)) {
  const result = compactContext(currentTokens, maxTokens);
  console.log('Actions:', result.actions);
  console.log('Preserve:', result.preserve);
  console.log('Tokens saved:', result.tokensSaved);
}

// Record file access
recordFileAccess('/path/to/file.ts', 'Authentication module');

// Get compaction report
const report = getCompactionReport();
console.log(report);
```

### Critical Content Preserved

The compaction engine preserves:
- Architectural decisions (marked with "important:", "critical:")
- Known bugs (marked with "bug:", "fixme:")
- Last 5 accessed files
- Key decisions extracted from content

## Integration Steps

### Step 1: Add Environment Variables (Optional)

```json
{
  "env": {
    "FEWSHOT_ENABLED": "true",
    "FEWSHOT_MAX_EXAMPLES": "3",
    "FEWSHOT_MIN_RATING": "7",
    "FEWSHOT_DEBUG": "false",
    "SEMANTIC_MEMORY_ENABLED": "true",
    "EPISODIC_MEMORY_ENABLED": "true",
    "EPISODIC_MIN_RATING": "7"
  }
}
```

### Step 2: Add Hooks to settings.json

**Note:** Since `Write(~/.claude/settings.json)` is in your permissions deny list, you'll need to manually edit the file or use a different method.

Add to `UserPromptSubmit` hooks:
```json
{
  "type": "command",
  "command": "/home/fr3k/.claude/hooks/FewShotInjector.hook.ts"
}
```

Add to `SessionEnd` hooks (after WorkCompletionLearning):
```json
{
  "type": "command",
  "command": "/home/fr3k/.claude/hooks/SemanticMemoryCapture.hook.ts"
},
{
  "type": "command",
  "command": "/home/fr3k/.claude/hooks/EpisodicMemoryCapture.hook.ts"
}
```

### Step 3: Verify Installation

Run the tests:
```bash
cd /home/fr3k/.claude/hooks
npx tsx lib/__tests__/memory-system.node.test.ts
```

Expected output:
```
Tests: 21
Passed: 21
Failed: 0
```

## Hook Descriptions

### FewShotInjector.hook.ts (UserPromptSubmit)

Injects relevant few-shot examples into context based on task type. Uses semantic search to find applicable past successful interactions.

### SemanticMemoryCapture.hook.ts (SessionEnd)

Extracts semantic facts (user preferences, project context) from completed sessions and stores them for future reference.

### EpisodicMemoryCapture.hook.ts (SessionEnd)

Converts high-rated completed work into few-shot examples stored in episodic memory for future pattern recognition.

## Testing

All 21 tests pass:

- SemanticMemoryStore (4 tests)
- EpisodicMemoryStore (3 tests)
- ProceduralMemoryStore (3 tests)
- FewShotSelector (5 tests)
- CompactionEngine (6 tests)

## Memory Statistics

Get statistics about your memory system:

```typescript
import { getMemoryManager } from './lib/memory-manager';

const memory = getMemoryManager();
const stats = memory.getStats();

console.log('Semantic memories:', stats.semantic.total);
console.log('Episodic memories:', stats.episodic.total);
console.log('Examples:', stats.episodic.examples);
console.log('Procedural memories:', stats.procedural.total);
console.log('Avg effectiveness:', stats.procedural.avgEffectiveness);
```

## Configuration

All systems are enabled by default. Disable individual features using environment variables:

- `FEWSHOT_ENABLED=false` - Disable few-shot injection
- `SEMANTIC_MEMORY_ENABLED=false` - Disable semantic memory capture
- `EPISODIC_MEMORY_ENABLED=false` - Disable episodic memory capture

## Files Summary

| File | Purpose |
|------|---------|
| `lib/memory-types.ts` | Type definitions for all memory types |
| `lib/memory-manager.ts` | Unified memory access (SemanticMemoryStore, EpisodicMemoryStore, ProceduralMemoryStore) |
| `lib/fewshot.ts` | Few-shot example selection with task classification |
| `lib/compaction.ts` | Context compaction engine with multi-stage optimization |
| `FewShotInjector.hook.ts` | Injects examples into UserPromptSubmit |
| `SemanticMemoryCapture.hook.ts` | Captures semantic facts at SessionEnd |
| `EpisodicMemoryCapture.hook.ts` | Captures episodic examples at SessionEnd |
| `lib/__tests__/memory-system.node.test.ts` | Comprehensive test suite |
