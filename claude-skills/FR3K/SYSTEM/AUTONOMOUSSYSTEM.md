# FR3K Autonomous System

## Purpose

Continuous autonomous operation inspired by pocket-agent's always-on architecture. FR3K runs scheduled routines, proactively monitors, and executes automations without user input.

---

## Architecture

### Core Components

```
FR3K Autonomous System
├── Routines Engine (cron + systemd)
│   ├── Scheduled Tasks
│   ├── Event Triggers
│   └── Task Queue
├── MCP Integrations
│   ├── fr3k-think (structured thinking)
│   ├── unified-pantheon-mcp (meta-cognitive)
│   └── md-mcp (dynamic tools)
├── Memory & Facts
│   ├── Fact Extraction
│   ├── Semantic Search
│   └── Context Tracking
└── Notification Channels
    ├── Voice Server (localhost:8888)
    ├── Telegram Bot (@fR3kzSikbot)
    └── Daily Digest (future)
```

---

## Routines System

### Scheduled Automations

**Morning Briefing (8:00 AM daily)**
```bash
# ~/.claude/routines/morning-briefing.sh
#!/bin/bash
# Check calendar, tasks, weather, news
# Generate daily briefing
# Send notification via voice and Telegram
```

**Weekly Review (Friday 5:00 PM)**
```bash
# ~/.claude/routines/weekly-review.sh
#!/bin/bash
# Review accomplishments
# Update progress documentation
# Plan next week's priorities
```

**Website Monitoring (hourly)**
```bash
# ~/.claude/routines/monitor-websites.sh
#!/bin/bash
# Check tracked websites for changes
# Alert if significant updates detected
```

**Security Scan (daily 3:00 AM)**
```bash
# ~/.claude/routines/security-scan.sh
#!/bin/bash
# Scan for security events
# Check log anomalies
# Report findings
```

### Event-Driven Triggers

**Email Received**
- Trigger: New email in inbox
- Action: Summarize, categorize, alert if urgent

**File System Changes**
- Trigger: New file in watched directories
- Action: Analyze, extract metadata, catalog

**Webhook Received**
- Trigger: HTTP POST to webhook endpoint
- Action: Execute predefined workflow

---

## Systemd Services

### FR3K Routines Service

**Location:** `~/.config/systemd/user/pai-routines.service`

```ini
[Unit]
Description=FR3K Autonomous Routines
After=network.target

[Service]
Type=simple
ExecStart=/home/fr3k/.claude/routines/routines-daemon.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

**Enable:**
```bash
systemctl --user daemon-reload
systemctl --user enable pai-routines.service
systemctl --user start pai-routines.service
```

**Check Status:**
```bash
systemctl --user status pai-routines.service
```

---

## MCP Server Integration

### fr3k-think - Structured Thinking

**Purpose:** Step-by-step analysis for complex decisions

**Usage:**
```typescript
// Invoke for complex planning
const thinking = await invoke('mcp__fr3k-think__think', {
  query: "How should I structure this autonomous system?",
  mode: "investigation"
});
```

**Integration Points:**
- Morning briefing planning
- Weekly review analysis
- Complex decision support

### unified-pantheon-mcp - Meta-Cognitive

**Purpose:** Self-evolution and TAS (Tool-Angel-Score) analysis

**Usage:**
```typescript
// Invoke for autonomous improvement
const evolution = await invoke('mcp__unified-pantheon-mcp__self_evolve', {
  context: "FR3K autonomous system performance",
  goal: "Optimize resource usage"
});
```

**Integration Points:**
- System self-improvement
- Autonomous decision quality assessment
- Emergent behavior detection

---

## Memory & Facts System

### MemU-Inspired Agentic Memory (NEW! ✅)

**Service:** `pai-memory-worker.service` - Active since 2026-02-08

**Core Components:**
```
FR3K Memory System (MemU-Inspired)
├── Memory Models (PAI_MEMORY_MODELS.ts)
│   ├── MemoryType enum (profile, event, knowledge, behavior, skill, tool)
│   ├── Hierarchical structure (Resource → Category → Item)
│   └── Reinforcement tracking (content_hash, reinforcement_count)
├── Vector Search (PAI_MEMORY_VECTOR.ts)
│   ├── Cosine similarity scoring
│   ├── Salience-aware ranking (reinforcement + recency decay)
│   └── Content hashing for deduplication
├── Memory Service (PAI_MEMORY_SERVICE.ts)
│   ├── Memorize interactions (extract, dedupe, reinforce, categorize)
│   ├── Retrieve with salience (vector search + ranking)
│   └── Reference system ([ref:ITEM_ID] citations)
├── Memory-Aware Proactive Worker
│   ├── 24/7 monitoring loop
│   ├── Interaction buffering (memorize after 5 interactions)
│   ├── Proactive suggestions based on memory patterns
│   └── Intention prediction
└── Workflow Pipeline (PAI_WORKFLOW_PIPELINE.ts)
    ├── Modular step composition
    ├── Dependency resolution (topological sort)
    └── Interceptor pattern (hooks for caching, metrics)
```

**API Endpoint:**
```bash
# Get memory statistics
curl http://localhost:3000/api/memory

# Returns:
{
  "total_items": 4,
  "total_categories": 1,
  "total_resources": 4,
  "items_by_type": {
    "profile": 0,
    "event": 0,
    "knowledge": 4,
    "behavior": 0,
    "skill": 0,
    "tool": 0
  },
  "worker_active": true,
  "timestamp": 1770476323567
}
```

**Demonstration:**
```bash
# Run live demonstration
tsx /home/fr3k/.claude/Tools/demo_proactive_memory.ts

# Shows:
# ✅ Recording 8 interactions
# ✅ Memorizing 4 memory items
# ✅ Retrieving relevant context
# ✅ Generating proactive suggestions (85% confidence)
# ✅ Learning patterns and preferences
```

**Test Results:** 8/8 tests passed (100% pass rate)
- ✅ Vector Search - Cosine Similarity
- ✅ Salience Scoring
- ✅ Content Hashing (Deduplication)
- ✅ Memory Service - Stats
- ✅ Workflow Pipeline - 3-Step Flow
- ✅ Memorization - Create Item
- ✅ Retrieval - Query Memories
- ✅ Reinforcement - Deduplication

**Storage:**
```
In-memory database (per-user):
├── UserData
│   ├── items: MemoryItem[]
│   ├── categories: MemoryCategory[]
│   ├── category_items: CategoryItem[]
│   └── resources: Resource[]
└── Persistent logs: /tmp/memory-aware-suggestions.json
```

### Semantic Search

**Query:**
```bash
# Memory-aware retrieval with salience ranking
curl http://localhost:3000/api/memory

# Returns relevant memories ranked by:
# - Cosine similarity (semantic match)
# - Reinforcement count (how often confirmed)
# - Recency decay (recent memories favored)
```

---

## Notification Channels

### Voice Server

**Endpoint:** `http://localhost:8888/notify`

**Usage:**
```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Morning briefing ready", "voice_id": "21m00Tcm4TlvDq8ikWAM"}'
```

### Telegram Bot

**Bot:** @fR3kzSikbot

**Usage:**
```bash
# Send notification
pai telegram send "Morning briefing ready"

# Daily digest
pai telegram digest
```

---

## Resource Management

### CPU Usage

**Idle:** <1% CPU
**Processing Routine:** 5-15% CPU
**Peak (Complex Analysis):** 30-50% CPU

### Memory

**Baseline:** ~200MB RAM
**With Processing:** ~500MB RAM
**Maximum:** 1GB RAM limit

### Task Queue

**Non-Blocking Design:**
- Routines execute asynchronously
- Long tasks run in background
- Results cached and delivered when ready

---

## Configuration

### Routines Config

**Location:** `~/.claude/routines/config.yaml`

```yaml
routines:
  morning-briefing:
    enabled: true
    schedule: "0 8 * * *"  # 8:00 AM daily
    script: "morning-briefing.sh"
    notifications: [voice, telegram]

  weekly-review:
    enabled: true
    schedule: "0 17 * * 5"  # Friday 5:00 PM
    script: "weekly-review.sh"
    notifications: [telegram]

  website-monitoring:
    enabled: true
    schedule: "0 * * * *"  # Hourly
    script: "monitor-websites.sh"
    notifications: [telegram]

monitoring:
  log_level: info
  log_file: ~/.claude/logs/routines.log
  error_alerts: true
```

### Watched Paths

**Location:** `~/.claude/routines/watched-paths.yaml`

```yaml
watched:
  - path: ~/Projects
    events: [create, modify, delete]
    action: analyze-project
  - path: ~/Documents
    events: [create]
    action: catalog-document
  - path: ~/.claude/WORK
    events: [modify]
    action: track-progress
```

---

## Implementation Status

### Phase 1: Core Routines ✅
- [x] Systemd service template created
- [x] Configuration structure defined
- [x] Notification channels documented

### Phase 2: MCP Integration ✅
- [x] fr3k-think tested and documented
- [x] unified-pantheon-mcp tested and documented
- [x] Integration patterns defined

### Phase 3: Memory System ✅ COMPLETE
- [x] MemU-inspired memory implementation
- [x] Hierarchical memory structure (Resource → Category → Item)
- [x] Vector search with salience scoring
- [x] Memory reinforcement and deduplication
- [x] Memory-Aware Proactive Worker (24/7 monitoring)
- [x] Proactive suggestions based on patterns
- [x] Intention prediction from memory
- [x] Workflow pipeline with interceptors
- [x] Integration with dashboard API
- [x] 100% test pass rate (8/8 tests)

### Phase 4: Event Triggers ⏳
- [ ] File system watcher
- [ ] Email trigger integration
- [ ] Webhook endpoint

---

## Usage Examples

### Create Custom Routine

```bash
# 1. Create script
cat > ~/.claude/routines/my-routine.sh <<'EOF'
#!/bin/bash
# Your routine logic here
EOF
chmod +x ~/.claude/routines/my-routine.sh

# 2. Add to crontab
crontab -e
# Add: 0 10 * * * /home/fr3k/.claude/routines/my-routine.sh

# 3. Restart routines service
systemctl --user restart pai-routines.service
```

### Monitor Routine Execution

```bash
# View logs
journalctl --user -u pai-routines.service -f

# Check routine status
pai routines status

# View next scheduled runs
pai routines schedule
```

### Test Notifications

```bash
# Test voice notification
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Test notification", "voice_id": "21m00Tcm4TlvDq8ikWAM"}'

# Test Telegram notification
pai telegram send "Test message"
```

---

## Troubleshooting

### Routine Not Running

**Check service status:**
```bash
systemctl --user status pai-routines.service
```

**Check logs:**
```bash
journalctl --user -u pai-routines.service -n 50
```

**Verify crontab:**
```bash
crontab -l | grep pai
```

### High CPU Usage

**Check what's running:**
```bash
ps aux | grep pai
```

**Reduce frequency:**
Edit `~/.claude/routines/config.yaml` and restart service

### Notifications Not Working

**Test voice server:**
```bash
curl http://localhost:8888/health
```

**Test Telegram bot:**
```bash
systemctl --user status pai-telegram-bot.service
```

---

## Integration with Pocket-Agent CLI

For additional capabilities, pocket-agent-cli can be integrated:

**Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/KenKaiii/pocket-agent-cli/main/scripts/install.sh | bash
```

**Use in routines:**
```bash
# Get weather
pocket utility weather now "San Francisco"

# Check Hacker News
pocket news hn top -l 5

# Send notification
pocket comms notify ntfy alerts "Task complete"
```

---

## Summary

FR3K Autonomous System provides:
- ✅ Scheduled routines (cron-based)
- ✅ Always-on operation (systemd - 7 services)
- ✅ MCP integrations (fr3k-think, pantheon, md-mcp)
- ✅ Notifications (voice, Telegram)
- ✅ **Memory & facts (MemU-inspired - LIVE!)**
- ⏳ Event triggers (planned)

**Active Services:**
1. pai-autonomous.service - Autonomous Daemon
2. pai-improvement-agents.service - Continuous Improvement
3. **pai-memory-worker.service - MemU-Inspired Memory (NEW!)**
4. pai-metrics-server.service - Observability Dashboard
5. pai-self-improve.service - Self-Improvement Daemon
6. pai-telegram-bot.service - Telegram Bot System
7. pai-watchdog.service - Service Monitoring

**Status:** Core infrastructure operational with agentic memory system integrated and continuously learning.

---

**Document Status:** Active reference
**Last Updated:** 2026-02-07
**Owner:** FR3K System
