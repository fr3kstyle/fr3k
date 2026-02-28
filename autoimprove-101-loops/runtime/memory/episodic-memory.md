# Episodic Memory Layer

## Purpose
Vector-based experience retrieval that reduces repeated mistakes by 50%.

## Memory Structure

```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "task": {
    "description": "original user request",
    "type": "coding|debugging|research|planning",
    "tags": ["keywords"]
  },
  "approach": {
    "strategy": "self_discover|hierarchical|tree_of_thought|direct",
    "modules_used": ["break-steps", "critical-thinking"],
    "steps": ["step 1", "step 2"]
  },
  "outcome": {
    "success": true,
    "duration_ms": 1234,
    "iterations": 2
  },
  "lessons": {
    "what_worked": "clear explanation",
    "what_failed": "missed edge case",
    "improvements": ["add validation", "handle errors"]
  },
  "embedding": [0.123, 0.456, ...] // 384-dim vector
}
```

## Retrieval Strategy

1. **Before Task**: Query top-3 similar past experiences
2. **Inject Context**: "Last time you tried X, Y happened"
3. **After Task**: Store new experience with lessons

## Implementation

### Storage
```bash
/mnt/sdcard/claude-integrations/runtime/memory/
├── episodes/           # Individual episodes
├── index/              # Vector index
└── patterns/           # Extracted patterns
```

### Vector Generation
Use sentence-transformers or OpenAI embeddings:
```typescript
import { pipeline } from 'transformers';

const generator = pipeline('feature-extraction', 'all-MiniLM-L6-v2');
const embedding = await generator(task_description);
```

### Similarity Search
```typescript
function findRelevantEpisodes(task: string, topK: number = 3): Episode[] {
  const queryEmbedding = generateEmbedding(task);
  const similarities = episodes.map(ep => ({
    episode: ep,
    similarity: cosineSimilarity(queryEmbedding, ep.embedding)
  }));
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(s => s.episode);
}
```

## Performance Targets

- Retrieval time: < 100ms
- Storage: SD card (unlimited)
- Max episodes: 10,000 before pruning
- TTL: 90 days for unused episodes
- **Improvement: 50% reduction in repeated mistakes**

## Integration with Memory Systems

1. **auto-memory** (`~/.claude/projects/-home-fr3k/memory/MEMORY.md`)
   - Session-specific learnings
   - User preferences
   - Project patterns

2. **fr3k-brain** (MCP memories)
   - Semantic patterns
   - Long-term insights
   - Cross-session knowledge

3. **episodic-memory** (NEW)
   - Task execution history
   - What worked/failed
   - Vector similarity search

## Example Usage

```
USER: "Fix the authentication bug"

ROUTER:
1. TaskAnalyzer: complexity=0.8, novelty=0.4
2. EpisodicStore: Retrieved 3 similar episodes
   - Episode #42: Similar auth bug, fixed by adding token validation
   - Episode #87: Auth middleware timing issue
   - Episode #91: Session expiration edge case
3. Context injection: "Last time you fixed auth bugs, you found token validation and session expiration were key issues"
4. CapabilitySelector: Self-Discover (break-steps + edge-cases)
5. Execute with enhanced context
6. ReflectionEngine: Critique result
7. EpisodicStore: Save new episode
```
