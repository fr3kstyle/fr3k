# MCP Integration for FR3K Algorithm

## Overview

This document defines how MCP servers (hey-fr3k, fr3k-think, md-mcp) integrate into the FR3K Algorithm phases.

## MCP Server Status

✅ **All packages verified working:**
- `hey-fr3k` - Personal knowledge base and task management
- `fr3k-think` - Advanced reasoning with 32-agent analysis
- `md-mcp` - Dynamic tool creation from markdown

## Integration Points

### Phase 1: OBSERVE - Context Retrieval

**Purpose:** Retrieve relevant context before reverse-engineering

**Integration:**
```typescript
// At START of OBSERVE phase, BEFORE reverse-engineering
const context = await mcp_call("hey-fr3k", "get_context", {
  timeframe: "last_7_days",
  tags: ["work", "active", "priority"],
  limit: 10
});

// Use context to inform reverse-engineering
// Example: "Based on recent work on X, user likely wants Y"
```

**Fallback:** If hey-fr3k unavailable, continue without context (existing behavior)

**Benefits:**
- Better understanding of user's current priorities
- Awareness of recent work and patterns
- More accurate reverse-engineering

### Phase 2: THINK - Automated Reasoning

**Purpose:** Use fr3k-think for deep analysis instead of manual assessment

**Integration:**
```typescript
// First principles analysis
const fp_analysis = await mcp_call("fr3k-think", "first_principles", {
  problem: task_summary,
  depth: 3
});
// Returns: Deconstructed analysis of fundamental truths

// Red team critique (32 agents stress-test)
const critique = await mcp_call("fr3k-think", "red_team_analysis", {
  proposal: approach,
  agent_count: 32,
  focus: "all"
});
// Returns: Vulnerabilities, edge cases, counterarguments

// Use results to validate approach
// If critique finds major issues → reconsider approach
// If first principles reveals false assumptions → pivot
```

**Fallback:** If fr3k-think unavailable, use manual thinking tools assessment (existing behavior)

**Benefits:**
- 32-agent adversarial analysis catches blind spots
- First principles deconstruction challenges assumptions
- More rigorous than manual assessment

### Phase 5: EXECUTE - Dynamic Tool Creation

**Purpose:** Create custom tools on-the-fly via md-mcp

**Integration:**
```typescript
// When standard tools insufficient
const tool = await mcp_call("md-mcp", "forge_reality", {
  tool_name: "custom_analyzer",
  tool_description: "Analyzes X for Y purpose",
  parameters: {
    input: { type: "string", description: "Input data" },
    output: { type: "object", description: "Analysis results" }
  }
});
// Tool immediately available for use

// Use tool for specific task
const result = await mcp_call("custom_analyzer", {
  input: "data"
});
```

**Fallback:** If md-mcp unavailable, use standard tool set (existing behavior)

**Benefits:**
- Runtime tool creation without code changes
- Immediate availability of specialized tools
- Flexible adaptation to task requirements

### Phase 7: LEARN - Persistent Storage

**Purpose:** Store insights and create follow-up tasks in hey-fr3k KB

**Integration:**
```typescript
// Store learnings in persistent KB
await mcp_call("hey-fr3k", "add_note", {
  content: key_insight,
  tags: ["learning", session_id, domain, timestamp]
});

// Create follow-up tasks
await mcp_call("hey-fr3k", "create_task", {
  title: actionable_takeaway,
  description: "Context and requirements",
  priority: "medium",
  due_date: calculate_due_date(),
  tags: ["follow-up", session_id, domain]
});
```

**Fallback:** If hey-fr3k unavailable, use MEMORY/LEARNING (existing behavior)

**Benefits:**
- Persistent KB accessible across sessions
- Automatic task creation from learnings
- Better than manual MEMORY filing

## MCP Call Wrapper

```typescript
async function mcp_call(server: string, tool: string, params: object): Promise<any> {
  try {
    // Call MCP server via stdio
    const result = await spawn_mcp_call(server, tool, params);
    return result;
  } catch (error) {
    console.error(`MCP call failed: ${server}.${tool}`, error);
    // Fallback: return null, caller handles gracefully
    return null;
  }
}
```

## Backward Compatibility

**Key Principle:** MCP integration is ENHANCEMENT, not replacement

- ✅ memU remains active and accessible
- ✅ Existing Algorithm format unchanged
- ✅ All MCP calls have fallbacks
- ✅ No breaking changes to CORE system
- ✅ Incremental adoption possible

## Migration Strategy

**Phase 1:** Enable MCP calls in Algorithm (this document)
**Phase 2:** Test each integration point
**Phase 3:** Monitor MCP performance and reliability
**Phase 4:** Gradually increase MCP usage as confidence grows
**Phase 5:** Keep memU as fallback indefinitely

## Testing Checklist

- [ ] OBSERVE: hey-fr3k.get_context() returns relevant context
- [ ] THINK: fr3k-think.first_principles() returns deconstructed analysis
- [ ] THINK: fr3k-think.red_team_analysis() returns 32-agent critique
- [ ] EXECUTE: md-mcp.forge_reality() creates usable tools
- [ ] LEARN: hey-fr3k.add_note() stores insights persistently
- [ ] LEARN: hey-fr3k.create_task() creates follow-up tasks
- [ ] Fallbacks: All calls fail gracefully without breaking Algorithm
- [ ] Compatibility: No conflicts with memU or existing system

## Configuration

**MCP servers configured in:** `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hey-fr3k": {
      "command": "npx",
      "args": ["-y", "hey-fr3k"],
      "env": {
        "HEY_FR3K_DB_PATH": "~/.claude/mcp-servers/hey-fr3k.db"
      }
    },
    "fr3k-think": {
      "command": "npx",
      "args": ["-y", "fr3k-think"],
      "env": {
        "FR3K_THINK_DEPTH": "5",
        "FR3K_THINK_AGENTS": "32"
      }
    },
    "md-mcp": {
      "command": "npx",
      "args": ["-y", "md-mcp"],
      "env": {
        "MD_MCP_CONFIG": "~/.claude/mcp-servers/md-mcp-config.json",
        "MD_MCP_PERSIST_TOOLS": "true"
      }
    }
  }
}
```

## Usage Examples

### Example 1: OBSERVE with Context

```typescript
// OBSERVE phase
const context = await mcp_call("hey-fr3k", "get_context", {
  timeframe: "last_7_days",
  tags: ["work", "active"]
});

// Reverse-engineering with context awareness
// "Based on recent work on trading bot, user wants latency optimization"
```

### Example 2: THINK with Reasoning

```typescript
// THINK phase
const analysis = await mcp_call("fr3k-think", "first_principles", {
  problem: "Trading bot latency optimization",
  depth: 3
});
// Returns: "Fundamental issue: synchronous operations blocking event loop"

const critique = await mcp_call("fr3k-think", "red_team_analysis", {
  proposal: "Implement parallel processing",
  agent_count: 32
});
// Returns: "Risk: race conditions in shared state. Mitigation: mutex locks"
```

### Example 3: EXECUTE with Dynamic Tools

```typescript
// EXECUTE phase
const tool = await mcp_call("md-mcp", "forge_reality", {
  tool_name: "trade_analyzer",
  tool_description: "Analyzes trade patterns",
  parameters: {
    trades: { type: "array", description: "Trade data" }
  }
});

const results = await mcp_call("trade_analyzer", {
  trades: [...]
});
```

### Example 4: LEARN with Storage

```typescript
// LEARN phase
await mcp_call("hey-fr3k", "add_note", {
  content: "Parallel processing improved latency 3.8x with mutex locks",
  tags: ["learning", "trading-bot", "optimization"]
});

await mcp_call("hey-fr3k", "create_task", {
  title: "Profile parallel executor under load",
  priority: "high",
  tags: ["follow-up", "performance"]
});
```

---

**Status:** Integration plan complete, ready for implementation
**Created:** 2026-02-24
**Session:** MCP Integration
