# AI CLI Integration Setup Guide

FR3K-BEHEMOTH automatically detects and configures AI CLI tools for seamless MCP integration.

## Supported AI CLIs

1. **Claude Code** (`@anthropic-ai/claude-code`)
2. **Gemini CLI** (`@google/gemini-cli`)  
3. **OpenCode AI** (via curl installer)
4. **Groq CLI** (`groq-code-cli`)
5. **Qwen Code** (`@qwen-code/qwen-code`)

## Quick Setup

```bash
# Install AI CLIs (if not already installed)
npx @fr3k/fr3k-c0d3

# Setup AI CLI integrations
npx fr3k-behemoth setup-ai
```

## What It Does

### 1. Detection
- Scans for installed AI CLI tools
- Shows which are installed/missing
- Provides installation commands for missing tools

### 2. MCP Configuration
- Updates Claude Desktop's `claude_desktop_config.json`
- Adds MCP server entries for each detected CLI
- Preserves existing configurations
- Creates backups before modifying

### 3. Individual CLI Setup
- Creates config files for OpenCode (`~/.opencode/config.json`)
- Creates config files for Gemini (`~/.gemini/config.json`)
- Enables MCP mode for compatible CLIs

## Configuration Locations

### Claude Desktop
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Generated MCP Config Example
```json
{
  "mcpServers": {
    "behemoth": {
      "command": "npx",
      "args": ["fr3k-behemoth"]
    },
    "claude-code": {
      "command": "claude-code",
      "args": []
    },
    "gemini": {
      "command": "gemini",
      "args": ["--mode", "mcp"]
    },
    "opencode": {
      "command": "opencode",
      "args": ["serve"]
    },
    "groq": {
      "command": "groq-code",
      "args": ["--mcp"]
    },
    "qwen": {
      "command": "qwen-code",
      "args": ["mcp"]
    }
  }
}
```

## API Key Setup

After installation, configure your API keys:

```bash
# Claude Code
export ANTHROPIC_API_KEY="your-api-key"

# Gemini CLI
export GOOGLE_API_KEY="your-api-key"

# Groq CLI
export GROQ_API_KEY="your-api-key"

# OpenCode (interactive login)
opencode login

# Qwen Code
export QWEN_API_KEY="your-api-key"
```

## Commands

### Setup All AI CLIs
```bash
npx fr3k-behemoth setup-ai
```

### Configure Everything
```bash
npx fr3k-behemoth config
# Select "Both" to configure BEHEMOTH and AI CLIs
```

### Check Status
```bash
npx fr3k-behemoth status
```

## Troubleshooting

### CLI Not Detected
- Ensure the CLI is in your PATH
- Try installing globally: `npm install -g <package-name>`
- Restart terminal after installation

### Configuration Not Loading
- Restart Claude Desktop after setup
- Check config file permissions
- Verify JSON syntax in config files

### MCP Connection Issues
- Check API keys are set correctly
- Verify CLI tools work standalone first
- Check Claude Desktop logs for errors

## Manual Configuration

If automatic setup fails, you can manually add to Claude's config:

1. Open `claude_desktop_config.json`
2. Add the mcpServers section from the example above
3. Save and restart Claude Desktop

---

*FR3K-BEHEMOTH v3.1+ includes automatic AI CLI integration*