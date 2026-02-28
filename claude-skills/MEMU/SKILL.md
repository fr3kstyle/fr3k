---
name: MEMU
description: 24/7 autonomous memory and proactive intelligence layer for FR3K. USE WHEN memu, memory, proactive intelligence, autonomous memory, persistent context, learnings.
---

# memU Integration for FR3K

memU is FR3K's persistent memory and proactive intelligence layer. It runs 24/7, learning from every interaction and enabling FR3K to act autonomously even when you're not actively engaged.

## What memU Does

**Persistent Memory:**
- Remembers preferences, context, and learnings across all sessions
- Builds a knowledge graph of your habits, priorities, and communication style
- Surfaces relevant context automatically during conversations

**Proactive Intelligence:**
- Anticipates your needs based on patterns in your behavior
- Suggests tasks and actions before you ask
- Monitors for opportunities to help autonomously

**Continuous Learning:**
- Learns from every interaction 24/7
- Extracts insights from conversations, documents, and activity
- Improves its understanding of you over time

## Architecture

```
┌─────────────────────────────────────────┐
│            FR3K (You interact)           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│         FR3K-memu Bridge API             │
│   (http://127.0.0.1:8899)              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│           memU Daemon                   │
│  (24/7 background service)              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│     z.ai Anthropic API (Claude)         │
└─────────────────────────────────────────┘
```

## Usage in FR3K Skills

When FR3K needs to:
- **Remember context** → Call `/api/v1/memorize` to store information
- **Get relevant context** → Call `/api/v1/retrieve` to fetch memories
- **Be proactive** → Call `/api/v1/proactive-suggestions` for task ideas
- **Predict intent** → Call `/api/v1/predict-intent` to anticipate needs

## Example Integration

```python
# After completing a task for fr3k
curl -X POST http://127.0.0.1:8899/api/v1/memorize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "fr3k prefers concise technical summaries, prefers to see code first",
    "modality": "conversation",
    "user_id": "fr3k",
    "metadata": {"type": "preference", "domain": "communication"}
  }'

# Before responding to fr3k
curl -X POST http://127.0.0.1:8899/api/v1/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "query": "fr3k current work priorities",
    "user_id": "fr3k",
    "limit": 5
  }'
```

## Service Status

```bash
# Check if memU and bridge are running
memu status

# View logs
memu logs

# Restart services
memu restart
```

## Best Practices

1. **Always memorize important context** - preferences, decisions, learnings
2. **Retrieve before responding** - get relevant context for better responses
3. **Use proactive suggestions** - check for autonomous task opportunities
4. **Treat memU as a partner** - it's working 24/7 to help you help fr3k

## API Endpoints

### POST /api/v1/memorize
Store information in memU memory
- **content**: The information to remember
- **modality**: "conversation", "document", "image", etc.
- **user_id**: "fr3k"
- **metadata**: Optional additional context

### POST /api/v1/retrieve
Retrieve relevant context
- **query**: What to search for
- **user_id**: "fr3k"
- **limit**: Max results (default 10)

### POST /api/v1/proactive-suggestions
Get autonomous task suggestions
- **context**: Current situation/context
- **user_id**: "fr3k"

### POST /api/v1/predict-intent
Predict what fr3k wants to do next
- **context**: Current situation
- **user_id**: "fr3k"

## Integration with FR3K Algorithm

memU enhances all phases of the FR3K Algorithm:

- **OBSERVE**: Retrieves past context to understand requests better
- **THINK**: Accesses learnings and patterns for better decisions
- **PLAN**: Uses proactive suggestions for task planning
- **BUILD**: Remembers technical decisions and preferences
- **EXECUTE**: Tracks execution patterns for optimization
- **VERIFY**: Learns from what worked and what didn't
- **LEARN**: Captures all learnings for future reference

## Continuous Improvement

memU gets smarter with every interaction:
- ✓ Tracks which responses fr3k rates highly
- ✓ Learns preferred communication style
- ✓ Identifies optimal task timing
- ✓ Remembers technical preferences
- ✓ Builds predictive models of behavior

Treat memU as FR3K's long-term memory - the key to becoming more helpful and proactive over time.
