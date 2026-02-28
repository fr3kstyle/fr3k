# FR3K Unified Integration Guide

## System Overview

FR3K is a **unified autonomous AI system** that integrates:

- **4 MCP Servers** for enhanced capabilities
- **101 Self-Improvement Loops** for autonomous evolution
- **7-Phase Algorithm** for structured problem solving
- **Voice Server** for TTS notifications
- **Telegram Relay** for remote communication
- **Claude Hooks** for lifecycle automation

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FR3K UNIFIED SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │   TELEGRAM   │◄────►│   RELAY      │◄────►│  CLAUDE CODE │              │
│  │   INTERFACE  │      │   SYSTEM     │      │     + HOOKS  │              │
│  └──────────────┘      └──────┬───────┘      └──────┬───────┘              │
│                                │                      │                      │
│                                │                      ▼                      │
│                                │              ┌──────────────┐              │
│                                │              │  MCP SERVERS │              │
│                                │              │  ─────────── │              │
│                                │              │ • md-mcp     │              │
│                                │              │ • fr3k-think │              │
│                                │              │ • pantheon   │              │
│                                │              │ • hey-fr3k   │              │
│                                │              └──────┬───────┘              │
│                                │                     │                      │
│                                │              ┌──────┴───────┐              │
│                                │              │              │              │
│                                ▼              ▼              ▼              │
│                         ┌──────────┐   ┌──────────┐   ┌──────────┐         │
│                         │  7-PHASE │   │  101     │   │  VOICE   │         │
│                         │ ALGORITHM│   │  LOOPS   │   │  SERVER  │         │
│                         └──────────┘   └──────────┘   └──────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Integration

### 1. MCP Servers Integration

The 4 MCP servers are called throughout the **7-Phase Algorithm**:

#### OBSERVE Phase
```typescript
// Retrieve context via hey-fr3k
const context = await invoke('mcp__hey-fr3k__recall_fr3k', {
  query: current_task,
  limit: 10
});

// Use retrieved context to inform understanding
console.log(`Retrieved ${context.length} context items`);
```

#### THINK Phase
```typescript
// Use fr3k-think for structured analysis
const analysis = await invoke('mcp__fr3k-think__think', {
  query: problem_statement,
  mode: "investigation"
});

// Incorporate analysis into thinking process
```

#### PLAN Phase
```typescript
// Store decision via hey-fr3k
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: decision_reasoning,
  memory_type: "decision"
});
```

#### BUILD Phase
```typescript
// Create custom tools via md-mcp if needed
const tool = await invoke('mcp__md-mcp__forge_reality', {
  divine_title: tool_name,
  primal_essence: tool_specification,
  creation_ritual: "basic"
});
```

#### LEARN Phase
```typescript
// Store learning via hey-fr3k
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: key_insight,
  memory_type: "solution"
});

// Trigger self-improvement via pantheon
const improvements = await invoke('mcp__unified-pantheon-mcp__self_evolve', {
  context: session_summary,
  goal: "optimize_performance"
});
```

---

### 2. 101 Loops Integration

The self-improvement loops run autonomously and integrate with:

**Entry Point:** `autoimprove-101-loops/autonomous/self-improvement-loop.ts`

**Integration Points:**
```typescript
// Loop uses MCP servers for context
const context = await invoke('mcp__hey-fr3k__recall_fr3k', {
  query: "self-improvement-progress",
  limit: 20
});

// Loop uses fr3k-think for planning improvements
const plan = await invoke('mcp__fr3k-think__think', {
  query: "How to improve system performance?",
  mode: "investigation"
});

// Loop stores progress via hey-fr3k
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: `Loop ${loopNumber} completed: ${results}`,
  memory_type: "pattern"
});

// Loop triggers voice notification
await notifyVoice(`Self-improvement loop ${loopNumber} complete`);
```

**Running the Loops:**
```bash
# Interactive mode
cd autoimprove-101-loops
bun autonomous/self-improvement-loop.ts

# As daemon
sudo systemctl start fr3k-daemon
```

---

### 3. Voice Server Integration

Voice notifications are triggered at key points:

**Phase Notifications:**
```typescript
// When phase completes
async function notifyPhaseComplete(phase: string, duration: number) {
  await fetch('http://localhost:8888/notify', {
    method: 'POST',
    body: JSON.stringify({
      message: `${phase} phase completed in ${duration}ms`,
      voice: true
    })
  });
}
```

**Telegram Voice:**
```typescript
// Send voice message to Telegram
async function sendTelegramVoice(text: string) {
  const audio = await generateVoice(text);
  await sendTelegramAudio(audio);
}
```

**Voice Server Location:** `voice-server/server.ts`
**Default Port:** 8888

---

### 4. Telegram Relay Integration

Telegram interface provides remote access to all system components:

**Commands:**
```typescript
// /status - System overview via MCP
async function handleStatus() {
  const tasks = await invoke('mcp__hey-fr3k__list_tasks');
  const context = await invoke('mcp__hey-fr3k__recent_fr3k', { limit: 5 });
  return formatStatus(tasks, context);
}

// /ask <query> - Run through 7-phase algorithm
async function handleAsk(query: string) {
  // OBSERVE with hey-fr3k
  const context = await invoke('mcp__hey-fr3k__recall_fr3k', { query });

  // THINK with fr3k-think
  const analysis = await invoke('mcp__fr3k-think__think', { query });

  // EXECUTE and respond
  return executeQuery(query, context, analysis);
}

// /memory <key> <value> - Store via hey-fr3k
async function handleMemory(key: string, value: string) {
  await invoke('mcp__hey-fr3k__store_fr3k', {
    content: value,
    memory_type: "context"
  });
}
```

---

## Startup Sequence

### 1. Start Voice Server
```bash
cd voice-server
bun server.ts  # Runs on port 8888
```

### 2. Start Telegram Relay
```bash
cd telegram-relay
bun run start  # Connects to Telegram
```

### 3. Start Autoimprove Loops (Optional)
```bash
cd autoimprove-101-loops
bun autonomous/self-improvement-loop.ts
```

### 4. Use Claude Code
```bash
claude  # MCP servers auto-connect
```

---

## Unified Workflow Example

### Complete Task Execution

```typescript
// 1. OBSERVE - Get context
const context = await invoke('mcp__hey-fr3k__recall_fr3k', {
  query: "feature-implementation",
  limit: 10
});
console.log(`Context: ${context.length} items`);

// 2. THINK - Analyze with fr3k-think
const analysis = await invoke('mcp__fr3k-think__think', {
  query: "Implement user authentication",
  mode: "investigation"
});

// 3. PLAN - Store decision
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: "Chose JWT-based auth for simplicity",
  memory_type: "decision"
});

// 4. BUILD - Create tool if needed
if (needsCustomTool) {
  await invoke('mcp__md-mcp__forge_reality', {
    divine_title: "AuthHelper",
    primal_essence: authToolSpec,
    creation_ritual: "basic"
  });
}

// 5. EXECUTE - Implement the feature
const result = await implementAuth();

// 6. VERIFY - Test implementation
const testsPassed = await runTests();

// 7. LEARN - Store and improve
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: "JWT auth successful, 100% test pass",
  memory_type: "solution"
});

const improvements = await invoke('mcp__unified-pantheon-mcp__self_evolve', {
  context: "Auth implementation results",
  goal: "optimize future auth implementations"
});

// 8. NOTIFY - Voice + Telegram
await notifyVoice(`Auth feature complete, ${testsPassed} tests passed`);
await sendTelegram("Feature complete!");
```

---

## Claude Hooks Integration

Hooks automatically integrate MCP calls:

### SessionStart Hook
```typescript
// Load context via hey-fr3k
const context = await invoke('mcp__hey-fr3k__recent_fr3k', { limit: 5 });
// Display system status with context
```

### UserPromptSubmit Hook
```typescript
// Store prompt via hey-fr3k for learning
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: user_prompt,
  memory_type: "pattern"
});
```

### SessionEnd Hook
```typescript
// Analyze session via pantheon
const improvements = await invoke('mcp__unified-pantheon-mcp__self_evolve', {
  context: session_summary,
  goal: "improve_session_quality"
});

// Store learnings via hey-fr3k
await invoke('mcp__hey-fr3k__store_fr3k', {
  content: session_learnings,
  memory_type: "solution"
});
```

---

## Environment Configuration

`.env` file must include:

```bash
# MCP Servers (auto-loaded via npx)
# No additional config needed

# Anthropic API (required)
ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx

# Telegram (required)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_USER_ID=123456789

# Voice Server
PAI_VOICE_SERVER=http://localhost:8888

# Data directories
FR3K_DATA_DIR=~/.fr3k
PAI_DIR=~/.claude
```

---

## Verification Checklist

Before considering the system fully integrated:

- [ ] All 4 MCP servers installed and testable
- [ ] MCP tools appear in Claude Code
- [ ] Voice server starts on port 8888
- [ ] Telegram relay connects successfully
- [ ] hey-fr3k database created (`~/.hey-fr3k/tasks.db`)
- [ ] Autoimprove loops can run without errors
- [ ] Claude hooks load without errors
- [ ] Context retrieval via hey-fr3k works
- [ ] Voice notifications play correctly
- [ ] Telegram commands respond correctly

---

## Troubleshooting

### MCP Servers Not Connecting
```bash
# Test each server individually
npx -y md-mcp --version
npx -y fr3k-think --version
npx -y unified-pantheon-mcp --version
npx -y hey-fr3k --version

# Check settings.json
cat ~/.claude/settings.json | grep -A 5 mcpServers
```

### Voice Server Not Working
```bash
# Check if port 8888 is available
lsof -i :8888

# Test voice server
curl http://localhost:8888/health
```

### Telegram Relay Issues
```bash
# Check .env has correct tokens
grep TELEGRAM_BOT_TOKEN .env

# Test relay directly
cd telegram-relay
bun run start
```

### Autoimprove Loops Failing
```bash
# Check loop logs
cd autoimprove-101-loops
cat logs/self-improvement-log.txt

# Test loop execution
bun autonomous/self-improvement-loop.ts
```

---

## Quick Reference

| Component | Command | Purpose |
|-----------|---------|---------|
| Voice Server | `cd voice-server && bun server.ts` | TTS notifications |
| Telegram Relay | `cd telegram-relay && bun run start` | Telegram interface |
| Autoimprove | `cd autoimprove-101-loops && bun autonomous/self-improvement-loop.ts` | Self-improvement |
| Claude Code | `claude` | Main CLI |
| Status Check | `fr3k-status` | Check all components |
| Start All | `fr3k-start` | Start everything |
| Stop All | `fr3k-stop` | Stop everything |

---

## Next Steps

1. Install MCP servers: `./setup/MCP-INSTALLATION.md`
2. Configure environment: `.env`
3. Run installation: `./setup/install.sh`
4. Start system: `fr3k-start`
5. Test integration: Ask Claude Code to list MCP tools

---

**Last Updated:** 2026-02-28
**Version:** Unified System v1.0
