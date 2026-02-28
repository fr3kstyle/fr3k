# MCP Voice Integration in FR3K Algorithm

## Overview

All 4 MCP servers now have voice notification wrappers that announce their operations with semantic descriptions.

## Voice Wrappers

Location: `~/.claude/tools/`

### Universal Wrapper
```bash
~/.claude/tools/mcp-with-voice.sh <server> <operation> [json_payload]
```

### Convenience Wrappers

**Memory Operations (hey-fr3k):**
```bash
~/.claude/tools/mcp-memory.sh store "<content>" <type> [scope]
~/.claude/tools/mcp-memory.sh recall "<query>" [limit]
~/.claude/tools/mcp-memory.sh recent [limit]
```

**Thinking Operations (fr3k-think):**
```bash
~/.claude/tools/mcp-think.sh first-principles "<problem>"
~/.claude/tools/mcp-think.sh redteam "<proposal>"
```

**Tool Creation (md-mcp):**
```bash
~/.claude/tools/mcp-forge.sh create "<markdown-spec>"
```

**Self-Improvement (unified-pantheon-mcp):**
```bash
~/.claude/tools/mcp-improve.sh analyze
```

## Voice Notification Patterns

| Operation | Voice Format | Example |
|-----------|--------------|---------|
| Store memory | "Memory saved of [topic]" | "Memory saved of MCP integration workflow" |
| Recall memory | "Memories recalled of [topic]" | "Memories recalled of algorithm patterns" |
| First principles | "First principles analysis on [problem]" | "First principles analysis on system architecture" |
| Red team | "Red team analysis on [proposal]" | "Red team analysis on deployment strategy" |
| Forge tool | "md mcp tool [name] created" | "md mcp tool data-analyzer created" |
| Self-improve | "unified pantheon self improve analysis complete" | "unified pantheon self improve analysis complete" |

## Integration into Algorithm Phases

### OBSERVE Phase
```bash
# Use fr3k-think for first principles analysis of request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"first_principles","arguments":{"problem":"Reverse engineering user request"}}}' | \
  ~/.claude/tools/mcp-think.sh first-principles "What does the user actually need?"
```

### THINK Phase
```bash
# Use fr3k-think for red team analysis of approach
~/.claude/tools/mcp-think.sh redteam "Proposed solution may have edge cases"

# Store reasoning patterns
~/.claude/tools/mcp-memory.sh store "Used first principles to deconstruct requirements" "pattern"
```

### PLAN Phase
```bash
# Store plan decisions in memory
~/.claude/tools/mcp-memory.sh store "Chose parallel processing approach for 40% latency reduction" "decision" "FR3K optimization"
```

### BUILD Phase
```bash
# Dynamically create tools with md-mcp
cat <<'EOF' | ~/.claude/tools/mcp-forge.sh create
---
title: "data-processor"
description: "Process large datasets efficiently"
---

## Tool Specification: Data Processor

### Purpose
High-performance data processing...
EOF
```

### LEARN Phase
```bash
# Run self-improvement analysis
~/.claude/tools/mcp-improve.sh analyze

# Store learnings
~/.claude/tools/mcp-memory.sh store "MCP voice integration improved system transparency 300%" "solution" "FR3K improvements"
```

## Usage Examples

### Example 1: OBSERVE + THINK
```bash
# Analyze problem with first principles
PROBLEM="User wants faster response times"
echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"first_principles\",\"arguments\":{\"problem\":\"$PROBLEM\"}}}" | \
  ~/.claude/tools/mcp-with-voice.sh fr3k-think first_principles

# Voice: "First principles analysis on User wants faster response times"
```

### Example 2: PLAN + Memory
```bash
# Store decision with voice notification
~/.claude/tools/mcp-memory.sh store "Implementing caching layer for performance" "decision" "FR3K web service"

# Voice: "Memory saved of Implementing caching layer"
```

### Example 3: BUILD + Forge
```bash
# Create custom tool dynamically
MARKDOWN_SPEC="---
title: 'cache-validator'
description: 'Validate cache entries'
---
..."
~/.claude/tools/mcp-forge.sh create "$MARKDOWN_SPEC"

# Voice: "md mcp tool cache-validator created"
```

### Example 4: LEARN + Improve
```bash
# Analyze system for improvements
~/.claude/tools/mcp-improve.sh analyze

# Store learning
~/.claude/tools/mcp-memory.sh store "Self-improvement revealed 3 optimization opportunities" "solution" "FR3K meta"
```

## Benefits

1. **Audible Feedback**: Every MCP operation announces itself
2. **Semantic Descriptions**: Voice notifications describe WHAT was done, not just technical success
3. **Algorithm Integration**: Each phase can use appropriate MCP server with voice feedback
4. **Transparency**: You can hear what the system is doing in real-time
5. **Memory Persistence**: All decisions and learnings stored automatically

## File Structure

```
~/.claude/tools/
├── mcp-with-voice.sh       # Universal wrapper (all servers)
├── mcp-memory.sh           # hey-fr3k convenience wrapper
├── mcp-think.sh            # fr3k-think convenience wrapper
├── mcp-forge.sh            # md-mcp convenience wrapper
└── mcp-improve.sh          # unified-pantheon-mcp convenience wrapper
```

## Technical Details

- Uses `jq` for JSON parsing
- Extracts semantic descriptions from content (60 char max for voice)
- Sends notifications to voice server at `http://localhost:8888/notify`
- Voice ID: `21m00Tcm4TlvDq8ikWAM` (Adam, speed 1.1)
- Color-coded output: blue (info), green (success), red (error)

## Migration Path

To integrate MCP voice into your Algorithm:

1. **OBSERVE**: Add first principles analysis for complex requests
2. **THINK**: Use red team for proposals requiring stress-testing
3. **PLAN**: Store plan decisions with `mcp-memory.sh`
4. **BUILD**: Forge custom tools with `mcp-forge.sh`
5. **LEARN**: Run self-improvement analysis with `mcp-improve.sh`

Each operation will announce itself with a semantic voice notification.
