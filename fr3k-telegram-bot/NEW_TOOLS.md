# New Tools Available to Background Agents

**Updated:** February 10, 2026

## Tool Integration

Background agents (communication-agent, voice-agent, task-orchestrator) can now leverage:

### vibium - Browser Automation

**Use for:** Automated testing, web scraping, screenshot capture

**MCP Server:** Available via stdio, 21 tools

**Example usage:**
- Verify web UI changes
- Capture screenshots for debugging
- Automate form interactions
- Test deployment in browser

### goose - Agent Framework

**Use for:** Specialist agent tasks, file operations

**Location:** `~/.local/bin/goose`

**Example usage:**
- Quick specialist tasks without full subagent spawn
- MCP server testing
- Custom agent recipes

### witr - Process Monitoring

**Use for:** Debugging processes, port conflicts

**Location:** `~/.local/bin/witr`

**Example usage:**
- Debug "port in use" errors
- Trace process ancestry
- Identify resource hogs
- Find file lock holders

## Integration Points

### Communication Agent

When user asks to:
- "Test the website" → Use vibium for browser automation
- "Check what's using port X" → Use witr
- "Run a specialist task" → Consider goose

### Voice Agent

Notifications can include:
- "vibium test complete" + screenshot path
- "Process monitoring results" from witr
- "Agent task completion" from goose

### Task Orchestrator

Task delegation:
- Browser automation → vibium MCP tools
- Quick specialist tasks → goose CLI
- System debugging → witr process lookup

## Commands

```bash
# vibium (via MCP)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx -y vibium mcp

# goose
~/.local/bin/goose --version
~/.local/bin/goose run --help

# witr
~/.local/bin/witr --port 8888
~/.local/bin/witr --pid $$
```

## Resource Notes

- vibium: ~80MB when active
- goose: ~120MB when invoked
- witr: ~10MB when running

All tools are on-demand and exit when complete.
