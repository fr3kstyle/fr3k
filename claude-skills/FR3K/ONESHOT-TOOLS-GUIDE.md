# Oneshot AI Tools Integration Guide

**Purpose:** FR3K can call these specialized AI CLI tools for specific tasks, leveraging their unique strengths.

**Status:** ACTIVE
**Last Updated:** 2026-02-27

---

## Overview

FR3K has access to three powerful oneshot AI tools that can be called for specific tasks:

| Tool | Strength | Best For | Call Method |
|------|----------|----------|-------------|
| **aider** | Git-integrated coding | Code editing in repos | `aider` |
| **gemini-cli** | Large context, free tier | Large codebase analysis | `gemini -p` |
| **opencode** | Multi-model, free options | General coding tasks | `opencode` |

---

## Tool #1: aider (AI Pair Programmer)

### When to Use

✅ **USE aider for:**
- Editing code in git repositories
- Making targeted code changes with automatic commits
- Refactoring existing code
- Bug fixes that require file modifications
- Test generation

❌ **DON'T USE for:**
- Large codebase analysis (use gemini-cli)
- One-off questions (use direct model calls)
- Non-git projects

### How FR3K Should Use aider

**Basic Pattern:**
```bash
# Navigate to git repo
cd /path/to/repo

# Set zai API credentials
export ANTHROPIC_API_KEY="60388b83e2fe4ae2921a406c8b9a6a66.lH2hnFbpN1qQvtQw"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"

# Call aider with specific task
~/.aider-uv/bin/aider --model anthropic/claude-sonnet-4-20250514 --yes file1.py file2.js --message "Add input validation to all user-facing functions"
```

**Oneshot Example:**
```bash
# Single file edit
~/.aider-uv/bin/aider --model anthropic/claude-sonnet-4-20250514 --yes src/auth.py --message "Add rate limiting to login endpoint"
```

**Key Features:**
- ✅ Automatically creates git commits with descriptive messages
- ✅ Works with entire git repo context
- ✅ Shows diffs before applying changes
- ✅ Handles multiple files in one session

**Integration Example:**
```
User: "Fix the authentication bug in the API"

FR3K: "I'll use aider to fix this bug in the API code."

[Bash executes aider in the api/ directory]

aider: Applied fix to src/auth.py
aider: Created commit: "fix: resolve JWT token validation issue in authentication flow"

FR3K: "✅ Bug fixed! aider applied a patch to src/auth.py that validates JWT tokens correctly. The change was committed with a descriptive message."
```

---

## Tool #2: gemini-cli (Google Gemini CLI)

### When to Use

✅ **USE gemini-cli for:**
- Analyzing very large codebases (1M token context!)
- Exploring unfamiliar codebases
- Getting architectural insights
- Codebase documentation generation
- Non-interactive one-shot queries

❌ **DON'T USE for:**
- Making file edits (use aider)
- Git operations (use aider or direct git)
- Small, quick questions (use direct API)

### How FR3K Should Use gemini-cli

**Installation:**
```bash
npm install -g @google/gemini-cli
# OR
npx @google/gemini-cli
```

**Basic Pattern:**
```bash
# Non-interactive mode (for oneshot tasks)
gemini -p "Analyze the architecture of this codebase and identify the main components"

# With JSON output
gemini -p "List all security vulnerabilities in this code" --output-format json

# In specific directory
cd /path/to/project && gemini -p "What testing framework is used and how can I improve coverage?"
```

**Key Features:**
- ✅ **1M token context window** - Largest available!
- ✅ Free tier: 60 requests/min, 1000 requests/day
- ✅ Built-in tools: Google Search, file operations, web scraping
- ✅ Non-interactive mode perfect for oneshot calls

**Integration Example:**
```
User: "How does this monorepo structure work?"

FR3K: "Let me use gemini-cli to analyze the monorepo structure."

[Bash executes:]
cd /path/to/monorepo
gemini -p "Analyze this monorepo structure: what are the main packages, how do they depend on each other, and what's the build process?"

gemini-cli: [Returns detailed architecture analysis]

FR3K: "📊 Monorepo Analysis:
- Main packages: frontend, backend, shared
- Build system: Nx with Turbopack
- Dependencies: frontend → shared, backend → shared
- Build order: shared → [frontend, backend]
"
```

**Advanced Usage:**
```bash
# With specific model
gemini -m gemini-2.5-flash -p "Quick analysis: what's the entry point?"

# With include directories
gemini --include-directories ../lib,../docs -p "How is the documentation structured?"

# With GEMINI.md context file
# Create project-specific context that gemini will use
```

---

## Tool #3: opencode (Open-Source AI Coding Assistant)

### When to Use

✅ **USE opencode for:**
- General coding tasks
- When you want model choice (75+ models supported!)
- Using free models (GLM-4.7, MiniMax M2.1)
- Code analysis without file modification
- Multi-language projects

❌ **DON'T USE for:**
- Git-integrated edits (aider is better)
- Very large contexts (gemini-cli has 1M tokens)

### How FR3K Should Use opencode

**Installation:**
```bash
curl -fsSL https://opencode.ai/install | bash
# OR
npm install -g opencode-ai
```

**Basic Pattern:**
```bash
# Navigate to project
cd /path/to/project

# Initialize (creates AGENTS.md with project context)
opencode
> /init

# Use in non-interactive mode
echo "Explain the authentication flow" | opencode

# Or with subagents
echo "@general Search for all TODO comments in the codebase" | opencode
```

**Key Features:**
- ✅ **Dual agent modes**: Build (full access) ↔ Plan (read-only)
- ✅ **Subagents**: @general for complex tasks, @explore for code search
- ✅ **LSP support**: Understands code structure deeply
- ✅ **Free models**: GLM-4.7, MiniMax M2.1, Grok Code Fast
- ✅ **Model freedom**: Switch between 75+ models

**Agent Modes:**
```bash
# Plan mode (read-only, safe for exploration)
opencode
[TAB to switch to plan]
> "Analyze this codebase and suggest refactoring opportunities"

# Build mode (full access, can edit files)
opencode
[TAB to switch to build]
> "Implement the refactoring you suggested earlier"
```

**Integration Example:**
```
User: "How should I structure this new feature?"

FR3K: "I'll use opencode in Plan mode to analyze the best approach."

[Bash executes:]
cd /path/to/project
echo "@plan Analyze the codebase and suggest where to add user authentication features" | opencode

opencode: [Returns architectural recommendations]

FR3K: "🏗️ Architecture Recommendations:
- Place auth logic in /src/auth/ (new module)
- Integrate with existing /src/api/ middleware
- Use existing /src/utils/validation/ for input validation
- Follow the pattern established in /src/features/payment/

Want me to implement this using Build mode?"
```

**Using Free Models:**
```bash
# List available free models
opencode
> /models

# Switch to free model
> /connect opencode/glm-4.7
```

---

## Decision Tree: Which Tool Should FR3K Use?

```
Task comes in
    │
    ├─ Is it a git repo with code changes needed?
    │   └─ YES → Use **aider**
    │              - Best for edits with automatic commits
    │              - Git-aware context
    │
    ├─ Is it a large codebase analysis (>200k tokens)?
    │   └─ YES → Use **gemini-cli**
    │              - 1M token context window
    │              - Non-interactive mode
    │              - Free tier available
    │
    ├─ Need model choice or want free options?
    │   └─ YES → Use **opencode**
    │              - 75+ models supported
    │              - Free models available
    │              - LSP for code understanding
    │
    └─ Simple question or quick task?
        └─ Use **direct API call** (Claude, zai, etc.)
                   - Fastest for small queries
                   - No tool overhead
```

---

## Integration Patterns for FR3K

### Pattern 1: Sequential Tool Usage

```javascript
// FR3K workflow for complex refactoring task

// Step 1: Use gemini-cli for large-scale analysis
~ exec(`cd ${repo} && gemini -p "Analyze overall architecture and identify refactoring candidates"`)

// Step 2: Use opencode Plan mode for detailed strategy
~ exec(`cd ${repo} && echo "@plan Design refactoring approach for identified candidates" | opencode`)

// Step 3: Use aider for actual implementation
~ exec(`cd ${repo} && aider --yes src/ --message "Implement the refactoring: [specific changes]"`)
```

### Pattern 2: Tool Selection by Task Type

```javascript
const taskType = analyzeTask(userRequest);

switch(taskType) {
  case 'git-edit':
    return useAider(repo, files, message);
  case 'large-analysis':
    return useGeminiCLI(repo, query);
  case 'general-coding':
    return useOpenCode(repo, query);
  default:
    return useDirectAPI(message);
}
```

### Pattern 3: Hybrid Approach

```javascript
// Use gemini-cli for context, then aider for edits
const analysis = await exec(`gemini -p "Identify all files that need changes for X feature"`);
const files = parseFilesFromAnalysis(analysis);
await exec(`aider --yes ${files.join(' ')} --message "Implement X feature"`);
```

---

## Configuration Notes

### aider Configuration

**Config file:** `~/.config/aider/config.yml`
```yaml
model: anthropic/claude-sonnet-4-20250514
api-key: 60388b83e2fe4ae2921a406c8b9a6a66.lH2hnFbpN1qQvtQw
api-base: https://api.z.ai/api/anthropic
```

**Binary location:** `~/.aider-uv/bin/aider`

### gemini-cli Configuration

**Environment variables:**
```bash
export GEMINI_API_KEY="your-api-key"
export GOOGLE_GEMINI_BASE_URL="https://api.z.ai/api/gemini"  # If using proxy
```

**Install location:** `~/.npm.global/bin/gemini` (if npm install -g)

### opencode Configuration

**Config file:** `~/.config/opencode/opencode.json`
```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/glm-4.7",
  "default_agent": "build",
  "theme": "opencode"
}
```

**Install location:** `~/.opencode/bin/opencode` (if using install script)

---

## Best Practices for FR3K

### 1. Always State Tool Choice

❌ **Bad:**
```
"I'll help you with that."
[Uses aider without explaining]
```

✅ **Good:**
```
"For this git repo edit task, I'll use aider since it has git integration and will create automatic commits."
[Uses aider]
```

### 2. Provide Context About Tool Capabilities

When introducing the tool, briefly explain why it's the right choice:
- "aider is perfect for this because..."
- "gemini-cli's 1M token context makes it ideal for..."
- "opencode's free models and LSP support will help with..."

### 3. Show Evidence of Tool Execution

After the tool completes, show:
- What command was run
- What output was produced
- What files were affected (if any)

### 4. Handle Tool Errors Gracefully

If a tool fails:
```javascript
try {
  await exec(`aider --yes file.py --message "Fix bug"`);
} catch (error) {
  // Fall back to direct API call
  await useDirectAPI("Fix the bug in file.py: [description]");
}
```

---

## Example Workflows

### Workflow 1: Bug Fix in Git Repo

```
User: "Fix the login bug in the API"

FR3K: "I'll use aider for this since it's a git repo and we want automatic commits."

[Bash: aider --yes src/auth.py --message "Fix login bug"]

aider: Applied patch to src/auth.py
aider: Commit created: "fix: resolve session token validation"

FR3K: "✅ Bug fixed! aider modified src/auth.py to properly validate session tokens and created a git commit."
```

### Workflow 2: Large Codebase Analysis

```
User: "How does this microservices architecture work?"

FR3K: "This is a large codebase, so I'll use gemini-cli with its 1M token context to analyze the architecture."

[Bash: gemini -p "Analyze this microservices architecture"]

gemini-cli: [Detailed architectural analysis]

FR3K: "📊 Architecture Analysis:
- Services: API Gateway, Auth Service, User Service, Payment Service
- Communication: gRPC for inter-service, REST for external
- Discovery: Consul service registry
- Config: Spring Cloud Config
..."
```

### Workflow 3: Feature Implementation with Model Choice

```
User: "Add user profile feature"

FR3K: "I'll use opencode with the free GLM-4.7 model for this general coding task."

[Bash: echo "@build Add user profile feature with CRUD operations" | opencode]

opencode: [Implements feature using GLM-4.7]

FR3K: "✅ Feature implemented using opencode with GLM-4.7 model:
- Created /src/profile/profile.model.ts
- Added /src/profile/profile.service.ts
- Created CRUD endpoints in /src/profile/profile.controller.ts
- Updated routing in /src/app.module.ts
"
```

---

## Tool Combinations

### Combo 1: Analysis + Implementation

```bash
# Step 1: Analyze with gemini-cli (large context)
gemini -p "Identify all files that need changes for feature X"

# Step 2: Implement with aider (git integration)
aider --yes [files from step 1] --message "Implement feature X"
```

### Combo 2: Planning + Execution

```bash
# Step 1: Plan with opencode Plan mode
echo "@plan Design approach for feature X" | opencode

# Step 2: Execute with opencode Build mode
echo "@build Implement the plan for feature X" | opencode
```

### Combo 3: Exploration + Refactoring

```bash
# Step 1: Explore codebase structure
gemini -p "Map out the codebase structure and dependencies"

# Step 2: Refactor using git-aware tool
aider --yes --msg "Refactor based on structure analysis"
```

---

## Quick Reference Commands

### aider
```bash
# Basic edit
~/.aider-uv/bin/aider --yes file.py --message "Add error handling"

# Multiple files
~/.aider-uv/bin/aider --yes *.py --message "Update all Python files"

# With specific model
~/.aider-uv/bin/aider --model anthropic/claude-sonnet-4-20250514 --yes file.py
```

### gemini-cli
```bash
# Basic query
gemini -p "Explain this codebase"

# JSON output
gemini -p "List all API endpoints" --output-format json

# Specific model
gemini -m gemini-2.5-flash -p "Quick analysis"

# In directory
cd /path/to/repo && gemini -p "What's the build process?"
```

### opencode
```bash
# Interactive
opencode

# Non-interactive with subagent
echo "@general Search for TODO comments" | opencode

# Switch models
echo "/models" | opencode
```

---

## Summary

**When to call each tool:**

| Situation | Tool | Why? |
|-----------|------|------|
| Edit code in git repo | **aider** | Automatic commits, git-aware |
| Analyze huge codebase | **gemini-cli** | 1M token context, free tier |
| General coding, model choice | **opencode** | 75+ models, free options |
| Quick question | **Direct API** | Fastest, no overhead |

**Integration strategy:**
1. Identify task type
2. Select appropriate tool
3. Explain choice to user
4. Execute with context
5. Report results with evidence

These tools extend FR3K's capabilities by providing specialized AI functionality for different scenarios.
