# MCP & MD-MCP Integration Guide

## Purpose

This document explains how FR3K uses MCP (Model Context Protocol) servers and MD-MCP for dynamic tool creation.

---

## MCP Server Configuration

### Currently Configured Servers

Located in: `~/.claude/settings.json`

#### 1. md-mcp - Dynamic Tool Creation
```json
"md-mcp": {
  "command": "/home/fr3k/.nvm/versions/node/v24.13.0/bin/npx",
  "args": ["md-mcp"],
  "type": "command"
}
```

**Purpose:** Create any tool instantly from markdown specifications
**Key Tool:** `mcp__md-mcp__forge_reality`
**Status:** ✅ Configured and ready

#### 2. fr3k-think - Structured Thinking
```json
"fr3k-think": {
  "command": "/home/fr3k/.nvm/versions/node/v24.13.0/bin/npx",
  "args": ["fr3k-think"],
  "type": "command"
}
```

**Purpose:** Enhanced reasoning and structured thinking frameworks
**Status:** ✅ Configured (capabilities to be documented)

#### 3. unified-pantheon-mcp - Meta-Cognitive System
```json
"unified-pantheon-mcp": {
  "command": "/home/fr3k/.nvm/versions/node/v24.13.0/bin/npx",
  "args": ["unified-pantheon-mcp"],
  "type": "command"
}
```

**Purpose:** Self-evolving meta-cognitive capabilities
**Status:** ✅ Configured (capabilities to be documented)

#### 4. hey-fr3k - Task Management
```json
"hey-fr3k": {
  "command": "/home/fr3k/.nvm/versions/node/v24.13.0/bin/npx",
  "args": ["hey-fr3k"],
  "type": "command"
}
```

**Purpose:** Persistent task management with SQLite database
**Database:** `~/.pai-telegram-bot/.hey-fr3k/tasks.db`
**Status:** ✅ Functional

---

## MD-MCP Tool Creation Workflow

### What is MD-MCP?

MD-MCP is a **pattern** for creating MCP tools declaratively using markdown files with YAML frontmatter. Instead of writing code, you define tools in markdown, and the system dynamically exposes them as callable tools.

### The Pattern

```
Markdown File + YAML Frontmatter → MD-MCP Server → Dynamic Tool
```

### How to Create Tools

#### Step 1: Design Specification

Create a markdown file with this structure:

```markdown
---
title: "Tool Name"
description: "What this tool does"
category: "core" | "research" | "development" | "analysis"
tags: ["tag1", "tag2"]
difficulty: "beginner" | "intermediate" | "advanced"
version: "1.0.0"
author: "FR3K System"
---

## Tool Specification: Tool Name

### Purpose
Brief description

### Tools
List of tools this specification creates

#### 1. `tool_name`
Description with parameters

**Parameters:**
- `param` (type): Description

**Example Usage:**
```
Example of how to use
```

### Benefits
1. Benefit 1
2. Benefit 2
```

#### Step 2: Create Tool with forge_reality

Use the MD-MCP tool creation interface:

```
Tool: mcp__md-mcp__forge_reality

Parameters:
{
  "divine_title": "Tool Name",
  "primal_essence": "(contents of markdown spec)",
  "creation_ritual": "basic"
}
```

#### Step 3: Use the Tool

The tool becomes immediately available as `mcp__md-mcp__tool_name`

### Example Tool Specifications

Located in `/tmp/`:
- `pai-skills-manager-spec.md` - Skills management system
- `context-injector-spec.md` - Auto-context injection
- `research-plan-form.md` - Structured research planning
- `md-mcp-usage-guide.md` - Complete usage guide

---

## MCP Permission System

### How It Works

MCP tools require permission approval on first use. Claude Code prompts the user to approve each tool.

### Important Notes

1. **Direct Claude Code CLI** - Permission prompts work correctly
2. **Telegram Bot Interface** - Permission prompts don't route properly
3. **Solution** - Use MCP tools in direct CLI sessions, not via Telegram

### Pre-Approved Tools

The FR3K system has `"mcp__*"` in allowed permissions, but first-use approval still required for new tools.

---

## Best Practices

### 1. Create Tools for Recurring Tasks
If you do something 3+ times, create a tool for it.

**Example:**
- Research synthesis → Create `research_synthesizer` tool
- JSON validation → Create `json_validator` tool
- Project analysis → Create `project_analyzer` tool

### 2. Use Frontmatter Effectively

YAML frontmatter enables:
- **Discovery** - Search by title, tags, category
- **Filtering** - Find tools by difficulty or type
- **Versioning** - Track tool evolution
- **Auto-injection** - Load tools based on patterns

### 3. Compose Tools
Build complex workflows from simple tools:

```
1. Get relevant context (Context Injector)
2. Create research plan (Research Plan Form)
3. Execute research (Parallel Researchers)
4. Synthesize findings (Synthesis Tool)
```

### 4. Document Tools
Every tool should have:
- Clear purpose statement
- Parameter definitions with types
- Example usage
- Benefits list

---

## MCP Tool Examples

### Example 1: Skills Manager

**Tool:** `pai_add_skill`

**Purpose:** Add a new skill to FR3K skills directory

**Parameters:**
- `name` (string): Skill name in kebab-case
- `title` (string): Human-readable title
- `description` (string): What the skill does
- `category` (string): core | research | development | analysis
- `tags` (array): Related tags
- `content` (string): Full skill content

**Usage:**
```
Add skill named "multi-source-research"
Title: "Multi-Source Research"
Description: "Research across multiple AI models"
Category: research
Tags: [research, parallel, synthesis]
Content: (full specification)
```

### Example 2: Context Injector

**Tool:** `pai_get_relevant_context`

**Purpose:** Get relevant context for current task

**Parameters:**
- `query` (string): User's query
- `files` (array): Attached files
- `project_type` (string, optional): Project type hint

**Logic:**
1. Check files against skill `globs` patterns
2. Match skill tags to query keywords
3. Include `alwaysApply` skills
4. Return ranked context list

---

## Integration with FR3K Algorithm

### Before OBSERVE Phase

```
1. User query received
2. Call pai_get_relevant_context(query, files)
3. Load relevant skills and docs
4. Proceed with FR3K Algorithm OBSERVE
```

### During EXECUTE Phase

```
1. Identify need for new tool
2. Create tool specification in markdown
3. Invoke forge_reality
4. Use new tool immediately
```

### After VERIFY Phase

```
1. Capture successful patterns
2. Update tool specifications
3. Document learnings
4. Improve system prompts
```

---

## Troubleshooting

### Tool Not Appearing

**Symptom:** Created tool but can't invoke it

**Solutions:**
1. Check MD-MCP server is running: `ps aux | grep md-mcp`
2. Verify tool specification syntax is valid
3. Check Claude Code can see MCP tools: List available tools
4. Re-create tool with corrected specification

### Permission Errors

**Symptom:** "Tool requires permission" prompt doesn't appear

**Solutions:**
1. Use direct Claude Code CLI (not Telegram bot)
2. Check MCP server configuration in settings.json
3. Verify tool is actually registered with MD-MCP
4. Restart Claude Code if needed

### Tool Not Working as Expected

**Symptom:** Tool executes but produces wrong output

**Solutions:**
1. Verify parameter types match specification
2. Check example usage for correct invocation
3. Test with simple inputs first
4. Review tool specification for errors

---

## Advanced Patterns

### 1. Cascading Tools
Tools that call other tools:
```
Research Plan → Execute Research → Synthesize Findings
```

### 2. Conditional Tool Selection
Choose tools based on context:
```
If query contains "research" → Use research tools
If query contains "code" → Use development tools
If query contains "analysis" → Use analysis tools
```

### 3. Tool Composition
Combine multiple tools in workflows:
```
Context Injector → Research Plan Form → Parallel Researchers → Synthesis
```

---

## Resources

### Documentation
- [MCP Official Documentation](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [15 Best Practices for MCP Servers](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)
- [AGENTS.md Specification](https://agents.md/)

### Community
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) - MCP server catalog
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - Official examples

### FR3K Internal
- `/tmp/md-mcp-usage-guide.md` - Complete usage guide
- `/tmp/pai-skills-manager-spec.md` - Skills manager spec
- `/tmp/context-injector-spec.md` - Context injector spec
- `/tmp/research-plan-form.md` - Research planning form

---

## Summary

MD-MCP enables **declarative tool creation** without coding. Key benefits:

1. **No Code Required** - Define tools in markdown
2. **Immediate Availability** - Tools ready after creation
3. **Version Controlled** - Specs in git
4. **Discoverable** - Frontmatter enables search
5. **Composable** - Tools can call other tools

**Next Steps:**
1. Create tools from specifications in `/tmp/`
2. Test tool functionality
3. Document usage patterns
4. Build tool registry

---

**Document Status:** Active reference
**Last Updated:** 2026-02-07
**Owner:** FR3K System
