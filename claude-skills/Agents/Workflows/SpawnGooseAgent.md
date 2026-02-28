# Spawn Specialist Agent with goose

**When to use:** Specialist agent tasks, MCP client operations, custom agent recipes, file operations

## Overview

goose is an open-source extensible AI agent framework (Rust-based, CLI-focused). Use this workflow when you need a specialist agent for specific tasks without spawning full FR3K subagents.

## Installation

Already installed: `~/.local/bin/goose` (v1.23.2)

Rust toolchain: 1.93.0 (installed via rustup)

## Capabilities

- **Recipe system**: Pre-built agent configurations
- **MCP integration**: Connect to any MCP server
- **20+ LLM providers**: Claude, OpenAI, Gemini, Ollama, etc.
- **Custom extensions**: Add new capabilities
- **CLI invocation**: Run on-demand, not persistent

## Basic Usage

### Check Version

```bash
~/.local/bin/goose --version
```

### Run with Recipe

```bash
goose run --recipe <recipe_name>
```

### Run with Custom Instructions

```bash
goose run --text "your instructions here"
```

### Configure Provider

```bash
goose configure
```

## Available Recipes

```bash
goose run --recipe help
```

Shows all available recipes for specific tasks (file operations, MCP discovery, etc.)

## Integration with FR3K

### When to Use goose vs. Subagents

| Use **goose** when: | Use **FR3K subagents** when: |
|---------------------|------------------------------|
| Quick specialist task | Complex multi-step workflow |
| MCP client testing | Full FR3K Algorithm needed |
| File operations | Deep reasoning required |
| Recipe-based automation | Multi-agent debate needed |

### Example Workflow

1. **Specialist File Task**: Use goose with file-operation recipe
2. **MCP Testing**: Use goose to test new MCP server
3. **Quick Automation**: Use goose with custom instructions

## Resource Usage

- RAM: ~120MB (CLI invocation only)
- Persistent: No (exits after task)
- Location: ~/.local/bin/goose

## Configuration

Provider and model configured via:
- Interactive: `goose configure`
- Environment: `GOOSE_PROVIDER`, `GOOSE_MODEL`
- Command-line: `--provider`, `--model` flags

## See Also

- FR3K CORE SKILL.md: Tool Integration section
- goose docs: https://block.github.io/goose
