# MCP Server Installation Guide

## Overview

FR3K requires **4 MCP servers** for full functionality. These servers provide:
- Dynamic tool creation (md-mcp)
- Structured thinking (fr3k-think)
- Meta-cognitive analysis (unified-pantheon-mcp)
- Persistent task management (hey-fr3k)

---

## Prerequisites

```bash
# Node.js v18+ required
node --version  # Should be v18+

# npm v9+ required
npm --version   # Should be v9+

# npx (comes with npm)
npx --version
```

---

## Installation Methods

### Method 1: Install Globally (Recommended)

```bash
# Install all 4 MCP servers globally
npm install -g md-mcp fr3k-think unified-pantheon-mcp hey-fr3k

# Verify installation
npx md-mcp --version      # Should show version
npx fr3k-think --version  # Should show 6.0.0
npx unified-pantheon-mcp --version  # Should show 8.0.0
npx hey-fr3k --version    # Should show 6.6.6
```

### Method 2: Use npx (No Installation Required)

The MCP servers can be run directly via npx without installation. This is the default configuration.

---

## Claude Code Configuration

Add MCP servers to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "md-mcp": {
      "command": "npx",
      "args": ["-y", "md-mcp"],
      "type": "command"
    },
    "fr3k-think": {
      "command": "npx",
      "args": ["-y", "fr3k-think"],
      "type": "command"
    },
    "unified-pantheon-mcp": {
      "command": "npx",
      "args": ["-y", "unified-pantheon-mcp"],
      "type": "command"
    },
    "hey-fr3k": {
      "command": "npx",
      "args": ["-y", "hey-fr3k"],
      "type": "command"
    }
  }
}
```

---

## Server Details

### 1. md-mcp - Dynamic Tool Creation

**Purpose:** Create tools from markdown specifications

**Key Tool:** `forge_reality`

**Example Usage:**
```typescript
// Create a tool dynamically
const tool = await invoke('mcp__md-mcp__forge_reality', {
  divine_title: "MyTool",
  primal_essence: "# Tool Specification\n...",
  creation_ritual: "basic"
});
```

**Verification:**
```bash
# Test md-mcp is working
echo '{"tool_name":"forge_reality","tool_input":{"divine_title":"test","primal_essence":"test","creation_ritual":"basic"},"session_id":"test"}' | \
  npx md-mcp
```

---

### 2. fr3k-think - Structured Thinking

**Purpose:** Advanced reasoning and structured analysis

**Key Tools:**
- `think` - Step-by-step analysis
- `reset_thinking` - Clear thinking session

**Example Usage:**
```typescript
// Structured analysis
const analysis = await invoke('mcp__fr3k-think__think', {
  query: "How should I architect this system?",
  mode: "investigation"
});
```

**Verification:**
```bash
# Test fr3k-think is working
echo '{"tool_name":"think","tool_input":{"query":"test query"},"session_id":"test"}' | \
  npx fr3k-think
```

---

### 3. unified-pantheon-mcp - Meta-Cognitive System

**Purpose:** Self-improvement and balanced analysis

**Key Tools:**
- `self_evolve` - Autonomous improvement
- `analyze_with_demon_angel` - TAS analysis
- `detect_emergence` - Pattern detection
- `self_heal` - Error correction
- `generate_capability` - Create new capabilities

**Example Usage:**
```typescript
// Meta-cognitive analysis
const analysis = await invoke('mcp__unified-pantheon-mcp__analyze_with_demon_angel', {
  subject: "Should I optimize for speed or quality?",
  perspective: "trade-off-analysis"
});

// Self-improvement
const evolution = await invoke('mcp__unified-pantheon-mcp__self_evolve', {
  context: "System performance data",
  goal: "Optimize resource usage"
});
```

**Verification:**
```bash
# Test unified-pantheon-mcp is working
echo '{"tool_name":"self_evolve","tool_input":{"context":"test"},"session_id":"test"}' | \
  npx unified-pantheon-mcp
```

---

### 4. hey-fr3k - Task Management

**Purpose:** Persistent semantic memory and task tracking

**Key Tools:**
- `add_task` - Create new task
- `get_task` - Retrieve task
- `list_tasks` - List all tasks
- `update_task_status` - Update task
- `delete_task` - Remove task
- `store_fr3k` - Store memory
- `recall_fr3k` - Retrieve memory

**Database:** SQLite at `~/.hey-fr3k/tasks.db`

**Example Usage:**
```typescript
// Store semantic memory
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: "Key insight about system architecture",
  memory_type: "solution",
  project_scope: "fr3k-core"
});

// Retrieve relevant context
const context = await invoke('mcp__hey-fr3k__recall_fr3k', {
  query: "architecture patterns",
  limit: 5
});

// Task management
await invoke('mcp__hey-fr3k__add_task', {
  task: "Implement feature X",
  requirements: ["Requirements here"],
  files: ["file1.ts", "file2.ts"],
  expected_results: "Feature working",
  scope: "feature"
});
```

**Verification:**
```bash
# Test hey-fr3k is working
echo '{"tool_name":"store_fr3k","tool_input":{"content":"test memory","memory_type":"decision"},"session_id":"test"}' | \
  npx hey-fr3k

# Check database was created
ls -la ~/.hey-fr3k/tasks.db
```

---

## Testing MCP Integration

Start a Claude Code session and verify MCP tools are available:

```bash
claude

# In Claude Code, ask:
"List all available MCP tools"

# You should see tools like:
# - mcp__md-mcp__forge_reality
# - mcp__fr3k-think__think
# - mcp__unified-pantheon-mcp__self_evolve
# - mcp__hey-fr3k__store_fr3k
# - mcp__hey-fr3k__recall_fr3k
# - etc.
```

---

## Troubleshooting

### MCP Servers Not Found

**Problem:** `npx` can't find the MCP server

**Solution:**
```bash
# Clear npx cache
rm -rf ~/.npm/_npx

# Try again
npx -y md-mcp --version
```

### MCP Tools Not Appearing in Claude Code

**Problem:** Tools don't show up in Claude Code

**Solution:**
1. Check `~/.claude/settings.json` has correct MCP server config
2. Restart Claude Code
3. Check Claude Code can reach the servers:
```bash
npx -y md-mcp --version
npx -y fr3k-think --version
npx -y unified-pantheon-mcp --version
npx -y hey-fr3k --version
```

### Permission Errors

**Problem:** "Tool requires permission" but no prompt appears

**Solution:**
- Use Claude Code CLI directly (not via Telegram bot)
- First-time use requires permission approval
- Check `settings.json` has `"allowedTools": ["mcp__*"]`

### hey-fr3k Database Issues

**Problem:** hey-fr3k can't access database

**Solution:**
```bash
# Create database directory
mkdir -p ~/.hey-fr3k

# Set permissions
chmod 755 ~/.hey-fr3k

# Test database creation
echo '{"tool_name":"list_tasks","tool_input":{},"session_id":"test"}' | npx hey-fr3k
```

---

## Resource Usage

| Server | Memory | CPU | Notes |
|--------|--------|-----|-------|
| md-mcp | ~50MB | <1% | On-demand |
| fr3k-think | ~100MB | 2-5% | During thinking |
| pantheon | ~150MB | 5-10% | During evolution |
| hey-fr3k | ~30MB | <1% | Always-on |

**Total Idle:** ~330MB RAM
**Total Active:** ~500MB RAM during heavy use

---

## MCP Integration with FR3K Algorithm

The MCP servers are integrated into the **7-Phase Algorithm**:

- **OBSERVE Phase:** Use `hey-fr3k` to retrieve context
- **THINK Phase:** Use `fr3k-think` for structured analysis
- **PLAN Phase:** Use `hey-fr3k` to store decisions
- **BUILD Phase:** Use `md-mcp` to create custom tools
- **LEARN Phase:** Use `hey-fr3k` to store learnings and `unified-pantheon-mcp` for self-improvement

See `INTEGRATION-GUIDE.md` for full integration details.

---

## Next Steps

1. Install all 4 MCP servers
2. Configure `~/.claude/settings.json`
3. Test each server individually
4. Verify tools appear in Claude Code
5. Run the unified integration system

---

**Last Updated:** 2026-02-28
**Status:** All 4 MCP servers required for FR3K operation
