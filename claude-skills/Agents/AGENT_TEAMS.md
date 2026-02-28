# Agent Teams - Claude Opus 4.6 Integration

**Last Updated:** 2026-02-10
**Status:** ✅ Implemented

## Overview

Agent Teams enables multiple Claude Code sessions to coordinate as a team with shared task list, direct messaging between teammates, and team lead orchestration.

## Architecture

Based on Claude Opus 4.6 Agent Teams with 7 primitives:

| Primitive | Tool | Purpose |
|-----------|------|---------|
| TeamCreate | `TeamCreate.ts` | Create coordinated agent teams |
| TaskCreate (enhanced) | Built-in | Create tasks with team_name |
| TaskUpdate (enhanced) | Built-in | Update shared tasks |
| TaskList (enhanced) | Built-in | List team tasks |
| Task (enhanced) | Built-in | Execute with team coordination |
| SendMessage | `SendMessage.ts` | Direct inter-agent messaging |
| TeamDelete | `TeamDelete.ts` | Dissolve team |

## Usage

### 1. Create a Team

```bash
# Research team with 3 specialized agents
bun run ~/.claude/skills/Agents/Tools/TeamCreate.ts \
  --team "research-team" \
  --agents "specialist,analyst,synthesizer" \
  --goal "Investigate enhancement opportunities"

# Sequential coordination pipeline
bun run ~/.claude/skills/Agents/Tools/TeamCreate.ts \
  --team "audit-pipeline" \
  --coordination sequential \
  --goal "Multi-stage security audit"
```

### 2. Create Shared Tasks

```typescript
// In FR3K Algorithm, use TaskCreate with team parameter
TaskCreate({
  subject: "Analyze FR3K architecture",
  description: "Review current system and identify improvements",
  team_name: "research-team-abc123",  // Links task to team
  assignee: "analyst"  // Optional: assign to specific team member
});
```

### 3. Send Messages

```bash
# Direct message
bun run ~/.claude/skills/Agents/Tools/SendMessage.ts \
  --team research-team-abc123 \
  --from specialist \
  --to analyst \
  --message "Found critical data in logs"

# Broadcast to team
bun run ~/.claude/skills/Agents/Tools/SendMessage.ts \
  --team research-team-abc123 \
  --from synthesizer \
  --broadcast "Ready for final review"
```

### 4. List Team Messages

```bash
bun run ~/.claude/skills/Agents/Tools/SendMessage.ts \
  --team research-team-abc123 \
  --list
```

### 5. Dissolve Team

```bash
# Dissolve without archiving
bun run ~/.claude/skills/Agents/Tools/TeamDelete.ts \
  --team research-team-abc123

# Dissolve and archive
bun run ~/.claude/skills/Agents/Tools/TeamDelete.ts \
  --team research-team-abc123 \
  --archive
```

## Coordination Patterns

### Parallel (Default)
All agents work simultaneously on shared task list.

```
Agent 1 ──┐
Agent 2 ──┼──> Shared Task List ──> Results
Agent 3 ──┘
```

### Sequential
Agents work in stages, each builds on previous.

```
Agent 1 ──> Agent 2 ──> Agent 3 ──> Final Output
```

### Hierarchical
Team lead orchestrates, delegates to specialists.

```
      Lead ──┬──> Specialist 1
              ├──> Specialist 2
              └──> Specialist 3
```

## Integration with FR3K Algorithm

### OBSERVE Phase
Check for active team context:
```typescript
// If team_name in context, load team state
const team = loadTeam(team_name);
// Review team messages, shared tasks
```

### THINK Phase
Consider team coordination:
```typescript
// If working in team context
capabilities: {
  Primary: general-purpose  --team_name ${team_name}
  Support: [other capabilities]
}
```

### EXECUTE Phase
Create tasks with team context:
```typescript
TaskCreate({
  subject: "...",
  team_name: team_id,
  assignee: "specific-agent"
});
```

### LEARN Phase
Broadcast findings to team:
```bash
SendMessage --team ${team_id} --broadcast "Completed X, found Y"
```

## Best Practices

1. **Team Size:** 3-5 agents optimal (too many = coordination overhead)
2. **Coordination Mode:** Use parallel for exploration, sequential for pipelines
3. **Message Frequency:** Broadcast summaries, not every detail
4. **Task Assignment:** Let team self-organize unless strong reason to assign
5. **Team Lifecycle:** Create → Work → Broadcast → Dissolve (don't keep teams idle)

## Examples

### Example 1: Research Team

```bash
# Create team
bun run ~/.claude/skills/Agents/Tools/TeamCreate.ts \
  --team "enhancement-research" \
  --agents "finder,analyzer,prioritizer" \
  --goal "Find and prioritize FR3K improvements"

# Output: enhancement-research-xyz789

# In Algorithm, create tasks:
TaskCreate({
  subject: "Find related GitHub repos",
  team_name: "enhancement-research-xyz789",
  assignee: "finder"
});

TaskCreate({
  subject: "Analyze each repo for value",
  team_name: "enhancement-research-xyz789",
  assignee: "analyzer"
});

# When done, broadcast:
bun run ~/.claude/skills/Agents/Tools/SendMessage.ts \
  --team enhancement-research-xyz789 \
  --from prioritizer \
  --broadcast "Analysis complete, 3 high-priority items found"

# Dissolve
bun run ~/.claude/skills/Agents/Tools/TeamDelete.ts \
  --team enhancement-research-xyz789 \
  --archive
```

### Example 2: Debug Team

```bash
# Create team
bun run ~/.claude/skills/Agents/Tools/TeamCreate.ts \
  --team "debug-squad" \
  --agents 3 \
  --coordination parallel \
  --goal "Identify root cause of issue"

# Each agent investigates different angle
# Specialist 1: Code paths
# Specialist 2: System state
# Specialist 3: External dependencies

# They coordinate via messages:
bun run ~/.claude/skills/Agents/Tools/SendMessage.ts \
  --team debug-squad-abc \
  --from specialist-1 \
  --broadcast "Found suspicious code in line 42"

# Eventually synthesize and dissolve
```

## Storage

- **Active Teams:** `/tmp/pai-teams.json`
- **Archived Teams:** `/tmp/pai-teams-archive/`

## Status

✅ **Fully Implemented** - All 7 primitives operational
✅ **Tested** - Team creation, messaging, deletion working
✅ **Integrated** - Ready for use in FR3K Algorithm

---

**Next Steps:**
- Enhance TaskCreate/TaskUpdate/TaskList to accept team_name parameter
- Add team context loading to FR3K Algorithm OBSERVE phase
- Add team broadcasting to LEARN phase
- Create team-based workflow templates
