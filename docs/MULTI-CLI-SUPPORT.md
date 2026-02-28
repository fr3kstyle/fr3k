# Multi-CLI Support Guide

## Overview

FR3K Unified System supports **three AI coding CLIs**:

| CLI | Description | Key Features | Free Tier |
|-----|-------------|--------------|-----------|
| **Claude Code** | Official Anthropic CLI | Best Claude integration, polished UX | No |
| **OpenCode** | Open-source alternative | 75+ models, no vendor lock-in | Yes (GLM-4.7) |
| **Gemini CLI** | Google's official CLI | 100M token context, native Windows | Yes (1000/day) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FR3K MULTI-CLI ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Claude Code  │    │  OpenCode    │    │ Gemini CLI   │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                      │
│         └───────────────────┼───────────────────┘                      │
│                             ▼                                          │
│                    ┌──────────────┐                                    │
│                    │ MCP SERVERS  │◄──── Universal Backend             │
│                    │  ─────────── │                                     │
│                    │ • md-mcp     │                                    │
│                    │ • fr3k-think │                                    │
│                    │ • pantheon   │                                    │
│                    │ • hey-fr3k   │                                    │
│                    └──────────────┘                                    │
│                             │                                          │
│                             ▼                                          │
│                    ┌──────────────┐                                    │
│                    │  FR3K SYSTEM │                                     │
│                    │              │                                     │
│                    │ • Hooks      │                                     │
│                    │ • Skills     │                                     │
│                    │ • 101 Loops  │                                     │
│                    │ • Voice      │                                     │
│                    │ • Telegram   │                                     │
│                    └──────────────┘                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## CLI Comparison

### Claude Code

**Best for:** Claude-specific features, official support

**Pros:**
- Best Claude model integration
- Polished user experience
- Official Anthropic support
- Seamless MCP integration

**Cons:**
- Anthropic-only (no other models)
- Paid only
- Network restrictions in some regions

**Install:**
```bash
npm install -g @anthropic-ai/claude-code
claude
```

**Config:** `~/.claude/settings.json`

---

### OpenCode + oh-my-opencode

**Best for:** Model flexibility, free tier, Claude Code compatibility

**Pros:**
- 75+ model providers (Claude, GPT, Gemini, local)
- Free tier available (GLM-4.7)
- Reads Claude Code configs (hooks, skills)
- No vendor lock-in
- Active open-source community

**Cons:**
- Slightly different UX
- Requires account setup for each provider

**Install:**
```bash
# Install OpenCode
npm install -g opencode-ai
# OR
curl -fsSL https://opencode.ai/install | bash

# Install oh-my-opencode (Claude Code compatibility)
bunx oh-my-opencode install

# Free tier option (no paid accounts)
bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no
```

**Config:**
- `~/.config/opencode/opencode.json` - Main config
- `~/.claude/settings.json` - **Reads Claude Code hooks!**
- `.opencode/skill/` - Skills (also reads `.claude/skills/`)

---

### Gemini CLI

**Best for:** Large context, free tier, Windows users

**Pros:**
- 100M token context window (largest)
- Generous free tier (1000 requests/day)
- Native Windows support (no WSL)
- Open source (Apache 2.0)

**Cons:**
- Different hook system (not Claude-compatible)
- Google account required
- Fewer features than Claude Code

**Install:**
```bash
npm install -g @google/gemini-cli
gemini  # Login with Google account
```

**Config:** `~/.gemini/settings.json`

**Note:** Gemini CLI has its own hook system. FR3K hooks work via MCP servers only.

---

## Installation

### Option 1: Install All Three CLIs

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# OpenCode
npm install -g opencode-ai
bunx oh-my-opencode install

# Gemini CLI
npm install -g @google/gemini-cli

# Verify installation
claude --version
opencode --version
gemini --version
```

### Option 2: Install OpenCode (Recommended - Free & Compatible)

```bash
# Install OpenCode with oh-my-opencode
curl -fsSL https://opencode.ai/install | bash
bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no

# Configure provider
opencode auth login
# Choose your provider (e.g., Claude, GPT, free GLM-4.7)
```

### Option 3: Install Gemini CLI (Best Free Tier)

```bash
npm install -g @google/gemini-cli
gemini  # Follow Google login prompts
```

---

## Universal MCP Configuration

All three CLIs support MCP servers. Configure once, use everywhere:

### Step 1: Create Unified MCP Config

Create `~/.config/fr3k/mcp-servers.json`:

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

### Step 2: Copy to Each CLI

```bash
# For Claude Code
mkdir -p ~/.claude
cp ~/.config/fr3k/mcp-servers.json ~/.claude/settings.json

# For OpenCode
mkdir -p ~/.config/opencode
cp ~/.config/fr3k/mcp-servers.json ~/.config/opencode/opencode.json

# For Gemini CLI
mkdir -p ~/.gemini
cp ~/.config/fr3k/mcp-servers.json ~/.gemini/settings.json
```

---

## Hook Compatibility

### Claude Code & OpenCode

Both support the **same hook system** via `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/StartupGreeting.hook.ts"
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/FormatEnforcer.hook.ts"
      }]
    }],
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/SecurityValidator.hook.ts"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/StopOrchestrator.hook.ts"
      }]
    }]
  }
}
```

**OpenCode reads this automatically** when oh-my-opencode is installed.

### Gemini CLI

Gemini CLI uses **different hook events**. FR3K hooks work via MCP only:

```json
{
  "hooks": {
    "before_request": "mcp__hey-fr3k__recall_context",
    "after_response": "mcp__hey-fr3k__store_learning"
  }
}
```

---

## Skills Compatibility

### Claude Code

```bash
~/.claude/skills/
├── CORE/
├── FR3K/
└── PAIUpgrade/
```

### OpenCode

```bash
# OpenCode reads BOTH locations:
.claude/skills/     # Claude Code skills
.opencode/skill/    # OpenCode-specific skills
```

**oh-my-opencode ensures OpenCode can use Claude Code skills!**

### Gemini CLI

```bash
# Gemini uses its own skill format
.gemini/skills/
```

**Recommendation:** Use MCP servers for skills when using Gemini CLI.

---

## Switching Between CLIs

### Use Claude Code
```bash
claude
# All FR3K hooks, skills, MCP servers work
```

### Use OpenCode
```bash
opencode
# All FR3K hooks, skills, MCP servers work (via oh-my-opencode)
```

### Use Gemini CLI
```bash
gemini
# MCP servers work, hooks via MCP only
```

---

## CLI-Specific Features

### Claude Code Exclusive

- `/edit` - Advanced editing with preview
- `/run` - Test command execution
- `/commit` - Git commit creation
- Native MCP tool browser

### OpenCode Exclusive

- `ultrawork` / `ulw` - Maximum performance mode
- Multi-model selection
- Parallel background agents
- LSP/AST tools
- Client/server architecture

### Gemini CLI Exclusive

- 100M token context
- Native Windows support
- Free tier: 1000 requests/day
- Google account integration

---

## Recommended Configuration

### For Maximum Flexibility

1. **Primary:** OpenCode + oh-my-opencode
   - Free tier available
   - Model flexibility
   - Claude Code compatibility

2. **Secondary:** Gemini CLI
   - Backup free tier
   - Large context tasks

3. **Tertiary:** Claude Code
   - When you need official Claude features

### For Free Users

1. **OpenCode** with GLM-4.7 (free model)
2. **Gemini CLI** (1000 requests/day free)

### For Power Users

1. **Claude Code** for daily work
2. **OpenCode** for testing other models
3. **Gemini CLI** for large context tasks

---

## Troubleshooting

### Hooks Not Working in OpenCode

```bash
# Verify oh-my-opencode is installed
bunx oh-my-opencode --version

# Reinstall if needed
bunx oh-my-opencode install

# Check OpenCode can read Claude config
cat ~/.claude/settings.json
```

### MCP Servers Not Appearing

```bash
# Test each CLI independently
claude mcp list
opencode /mcp
gemini /mcp

# Verify MCP servers are accessible
npx -y md-mcp --version
npx -y fr3k-think --version
npx -y unified-pantheon-mcp --version
npx -y hey-fr3k --version
```

### Skills Not Loading

```bash
# For Claude Code/OpenCode
ls -la ~/.claude/skills/

# For OpenCode only
ls -la .opencode/skill/

# For Gemini CLI
ls -la .gemini/skills/
```

---

## Quick Reference

| Task | Claude Code | OpenCode | Gemini CLI |
|------|-------------|----------|------------|
| Start CLI | `claude` | `opencode` | `gemini` |
| List MCP | `claude mcp list` | `opencode /mcp` | `gemini /mcp` |
| Use Skills | Auto-load | Auto-load | Via MCP |
| Use Hooks | `settings.json` | `settings.json` | Via MCP |
| Free Tier | No | Yes (GLM-4.7) | Yes (1000/day) |
| Context | Standard | Standard | 100M tokens |

---

## Next Steps

1. Install your preferred CLI(s)
2. Configure MCP servers (see MCP-INSTALLATION.md)
3. Run `./setup/install.sh` to install FR3K components
4. Start with `fr3k-start`
5. Use your chosen CLI with full FR3K functionality

---

**Last Updated:** 2026-02-28
**Supported CLIs:** Claude Code, OpenCode, Gemini CLI
