# MCP Integration Guide - Exact Tool Invocations

## Overview

This guide provides **exact MCP tool names and parameters** for integrating all 4 MCP servers into the 7-Phase FR3K Algorithm.

## MCP Servers and Their Tools

### 1. hey-fr3k (Semantic Memory & Task Management)
- `mcp__hey-fr3k__store_fr3k` - Store semantic memory
- `mcp__hey-fr3k__recall_fr3k` - Retrieve relevant context
- `mcp__hey-fr3k__recent_fr3k` - Get recent memories
- `mcp__hey-fr3k__add_task` - Create new task
- `mcp__hey-fr3k__get_task` - Get task details
- `mcp__hey-fr3k__list_tasks` - List all tasks
- `mcp__hey-fr3k__update_task_status` - Update task status
- `mcp__hey-fr3k__get_incomplete_tasks` - Get incomplete tasks
- `mcp__hey-fr3k__cleanup_fr3k` - Auto-cleanup stale memories

### 2. fr3k-think (Structured Analysis)
- `mcp__fr3k-think__think` - Step-by-step analysis
- `mcp__fr3k-think__reset_thinking` - Clear thinking session

### 3. unified-pantheon-mcp (Self-Improvement)
- `mcp__unified-pantheon-mcp__self_evolve` - Autonomous improvement
- `mcp__unified-pantheon-mcp__analyze_with_demon_angel` - TAS analysis
- `mcp__unified-pantheon-mcp__detect_emergence` - Pattern detection
- `mcp__unified-pantheon-mcp__self_heal` - Error correction
- `mcp__unified-pantheon-mcp__generate_capability` - Create new capabilities
- `mcp__unified-pantheon-mcp__safety_check` - Safety analysis

### 4. md-mcp (Dynamic Tool Creation)
- `mcp__md-mcp__forge_reality` - Create tools from markdown
- `mcp__md-mcp__divine_truth` - Analyze text for patterns
- `mcp__md-mcp__summon_knowledge` - Decipher complex code
- `mcp__md-mcp__weave_spells` - Transform text
- `mcp__md-mcp__read_fate` - Analyze configuration
- `mcp__md-mcp__see_destiny` - Plan interpretation

---

## Phase-by-Phase Integration

### PHASE 1: OBSERVE (👁️)

**Goal:** Retrieve relevant context before analysis

#### Step 1: Recall Recent Context
```typescript
// Get recent memories from last 7 days
await mcp__hey-fr3k__recent_fr3k({
  limit: 10
});
```

#### Step 2: Search for Specific Context
```typescript
// Search for context related to the task
await mcp__hey-fr3k__recall_fr3k({
  query: "architecture patterns for [task domain]",
  limit: 5
});
```

#### Step 3: Check for Related Tasks
```typescript
// Get incomplete tasks that might be related
await mcp__hey-fr3k__get_incomplete_tasks({});
```

**Expected Output:**
- Recent work context
- Related decisions/patterns
- Pending tasks that might affect current work

---

### PHASE 2: THINK (🧠)

**Goal:** Deep analysis using structured thinking

#### Step 1: Reset Previous Thinking
```typescript
// Clear any previous thinking session
await mcp__fr3k-think__reset_thinking({});
```

#### Step 2: Structured Analysis
```typescript
// Think through the problem step by step
await mcp__fr3k-think__think({
  thought: "Analyzing the core problem: [problem statement]",
  thoughtNumber: 1,
  totalThoughts: 5,
  investigationArea: "root cause analysis",
  isInvestigating: true,
  confidence: 0.7
});
```

#### Step 3: Safety Check
```typescript
// Perform safety analysis if making system changes
await mcp__unified-pantheon-mcp__safety_check({
  target: "proposed system change",
  analysisLevel: "comprehensive"
});
```

**Expected Output:**
- Structured thought process
- Investigation findings
- Safety analysis results

---

### PHASE 3: PLAN (📋)

**Goal:** Create implementation plan and store decisions

#### Step 1: Store Planning Decisions
```typescript
// Store why we chose this approach
await mcp__hey-fr3k__store_fr3k({
  content: "Decision: Chose [approach] because [reasoning]. Alternatives considered: [X, Y, Z]",
  memory_type: "decision",
  project_scope: "current-project",
  expires_days: 90
});
```

#### Step 2: Analyze Approach with Demon-Angel
```typescript
// Evaluate trade-offs using TAS framework
await mcp__unified-pantheon-mcp__analyze_with_demon_angel({
  action: "Implementing feature X with approach Y",
  demonScore: 30,  // Complexity/risk (0-100)
  angelScore: 85   // Benefit/value (0-100)
});
```

#### Step 3: Create Planning Tasks
```typescript
// Break down plan into tasks
await mcp__hey-fr3k__add_task({
  task: "Implement core feature logic",
  requirements: "Must handle edge cases A, B, C",
  files: "src/feature.ts, src/feature.test.ts",
  expected_results: "All tests passing",
  scope: "feature"
});
```

**Expected Output:**
- Stored decisions with reasoning
- Trade-off analysis
- Task breakdown in hey-fr3k

---

### PHASE 4: BUILD (🔨)

**Goal:** Create solution, potentially using dynamic tools

#### Step 1: Check if Custom Tool Needed
```typescript
// If standard tools insufficient, create custom tool
await mcp__md-mcp__forge_reality({
  divine_title: "CustomAnalyzer",
  primal_essence: "# Tool Specification\nAnalyzes X for Y purpose\n\n## Input\n- data: string\n\n## Output\n- analysis: object",
  mystical_properties: {
    category: "analysis",
    version: "1.0.0"
  },
  creation_ritual: "basic"
});
```

#### Step 2: Decipher Complex Code Patterns
```typescript
// When encountering complex code to understand
await mcp__md-mcp__summon_knowledge({
  ethereal_code: "complex code snippet",
  preserve_essence: true
});
```

**Expected Output:**
- Custom tool created (if needed)
- Understanding of complex patterns

---

### PHASE 5: EXECUTE (⚡)

**Goal:** Implement the solution

#### Step 1: Store Implementation Decisions
```typescript
// Store why we implemented it this way
await mcp__hey-fr3k__store_fr3k({
  content: "Implementation pattern: Used [pattern] for [reason]. Trade-offs: [X, Y, Z]",
  memory_type: "pattern",
  project_scope: "current-project"
});
```

#### Step 2: Use Structured Thinking for Complex Logic
```typescript
// Think through complex implementation logic
await mcp__fr3k-think__think({
  thought: "Implementation logic: [step-by-step reasoning]",
  thoughtNumber: 3,
  totalThoughts: 5,
  confidence: 0.9
});
```

**Expected Output:**
- Implementation decisions stored
- Complex logic documented

---

### PHASE 6: VERIFY (✅)

**Goal:** Test and validate the implementation

#### Step 1: Detect Emergent Behavior
```typescript
// Check for unexpected capabilities or issues
await mcp__unified-pantheon-mcp__detect_emergence({
  scanDepth: "medium"
});
```

#### Step 2: Self-Heal Check
```typescript
// Run diagnostics and repair if needed
await mcp__unified-pantheon-mcp__self_heal({
  healLevel: "diagnostic"
});
```

#### Step 3: Update Task Status
```typescript
// Mark tasks as completed
await mcp__hey-fr3k__update_task_status({
  id: "task-id-from-plan-phase",
  status: "validated"
});
```

**Expected Output:**
- Emergent behavior analysis
- Diagnostic results
- Updated task status

---

### PHASE 7: LEARN (📚)

**Goal:** Extract learnings and trigger self-improvement

#### Step 1: Store Key Learnings
```typescript
// Store what we learned
await mcp__hey-fr3k__store_fr3k({
  content: "Key insight: [what we learned]. Pattern: [reusable pattern]",
  memory_type: "solution",
  project_scope: "current-project",
  expires_days: 180
});
```

#### Step 2: Self-Evolve Based on Experience
```typescript
// Suggest system improvements
await mcp__unified-pantheon-mcp__self_evolve({
  modification: "Based on this work, we should enhance [component] to [improvement]",
  demonScore: 20,  // Low risk improvement
  angelScore: 90   // High value improvement
});
```

#### Step 3: Generate New Capabilities
```typescript
// If we discovered a new useful pattern
await mcp__unified-pantheon-mcp__generate_capability({
  purpose: "Automate [task we did manually]",
  baseCapabilities: ["pattern-matching", "code-analysis", "testing"]
});
```

#### Step 4: Create Follow-up Tasks
```typescript
// Create tasks for improvements
await mcp__hey-fr3k__add_task({
  task: "Implement suggested improvement from self_evolve",
  requirements: "Capability generated by pantheon-mcp",
  files: "[files to modify]",
  expected_results: "Automation working",
  scope: "maintenance"
});
```

**Expected Output:**
- Persistent learnings in semantic memory
- Self-improvement suggestions
- New capability proposals
- Follow-up tasks created

---

## Complete Example: Full 7-Phase with MCP Integration

```typescript
// ═══════════════════════════════════════════════════════════════
// 🤖 FR3K ALGORITHM - MCP INTEGRATED VERSION
// ═══════════════════════════════════════════════════════════════

// ━━━ 👁️ PHASE 1: OBSERVE (1/7) ━━━
const recentContext = await mcp__hey_fr3k__recent_fr3k({ limit: 10 });
const relatedMemories = await mcp__hey_fr3k__recall_fr3k({
  query: "related context",
  limit: 5
});
const pendingTasks = await mcp__hey_fr3k__get_incomplete_tasks({});

// ━━━ 🧠 PHASE 2: THINK (2/7) ━━━
await mcp__fr3k_think__reset_thinking({});
await mcp__fr3k_think__think({
  thought: "Analyzing problem requirements...",
  thoughtNumber: 1,
  totalThoughts: 5,
  isInvestigating: true,
  confidence: 0.7
});
const safetyCheck = await mcp__unified_pantheon_mcp__safety_check({
  target: "proposed implementation",
  analysisLevel: "comprehensive"
});

// ━━━ 📋 PHASE 3: PLAN (3/7) ━━━
await mcp__hey_fr3k__store_fr3k({
  content: "Decision: Using approach X because Y",
  memory_type: "decision",
  project_scope: "current-project"
});
const tasAnalysis = await mcp__unified_pantheon_mcp__analyze_with_demon_angel({
  action: "Implementation approach",
  demonScore: 30,
  angelScore: 85
});
const taskId = await mcp__hey_fr3k__add_task({
  task: "Implement core feature",
  requirements: "Handle cases A, B, C",
  files: "src/feature.ts",
  expected_results: "Feature working",
  scope: "feature"
});

// ━━━ 🔨 PHASE 4: BUILD (4/7) ━━━
const customTool = await mcp__md_mcp__forge_reality({
  divine_title: "CustomHelper",
  primal_essence: "# Tool spec...",
  creation_ritual: "basic"
});

// ━━━ ⚡ PHASE 5: EXECUTE (5/7) ━━━
await mcp__hey_fr3k__store_fr3k({
  content: "Implementation: Used pattern X for reason Y",
  memory_type: "pattern",
  project_scope: "current-project"
});

// ━━━ ✅ PHASE 6: VERIFY (6/7) ━━━
const emergence = await mcp__unified_pantheon_mcp__detect_emergence({
  scanDepth: "medium"
});
await mcp__unified_pantheon_mcp__self_heal({
  healLevel: "diagnostic"
});
await mcp__hey_fr3k__update_task_status({
  id: taskId,
  status: "validated"
});

// ━━━ 📚 PHASE 7: LEARN (7/7) ━━━
await mcp__hey_fr3k__store_fr3k({
  content: "Key insight: What we learned",
  memory_type: "solution",
  project_scope: "current-project",
  expires_days: 180
});
await mcp__unified_pantheon_mcp__self_evolve({
  modification: "Suggested improvement",
  demonScore: 20,
  angelScore: 90
});
const newCapability = await mcp__unified_pantheon_mcp__generate_capability({
  purpose: "Automate manual task",
  baseCapabilities: ["analysis", "automation"]
});
await mcp__hey_fr3k__add_task({
  task: "Implement automation",
  requirements: "From self_evolve",
  scope: "maintenance"
});

// ═══════════════════════════════════════════════════════════════
```

---

## Quick Reference Card

| Phase | hey-fr3k | fr3k-think | pantheon-mcp | md-mcp |
|-------|----------|------------|--------------|--------|
| **OBSERVE** | `recent_fr3k`, `recall_fr3k`, `get_incomplete_tasks` | - | - | - |
| **THINK** | - | `think`, `reset_thinking` | `safety_check` | - |
| **PLAN** | `store_fr3k`, `add_task` | - | `analyze_with_demon_angel` | - |
| **BUILD** | `store_fr3k` | - | - | `forge_reality`, `summon_knowledge` |
| **EXECUTE** | `store_fr3k` | `think` | - | - |
| **VERIFY** | `update_task_status` | - | `detect_emergence`, `self_heal` | - |
| **LEARN** | `store_fr3k`, `add_task` | - | `self_evolve`, `generate_capability` | - |

---

## Testing MCP Integration

Run the verification script:
```bash
cd /mnt/sdcard/fr3k-export/setup
./verify-mcp.sh
```

Expected output:
```
✓ All 4 MCP servers verified
✓ Integration documentation exists
✓ Database accessible
```

---

## Troubleshooting

### MCP Tools Not Appearing
1. Check `~/.claude/settings.json` has MCP server configuration
2. Restart Claude Code
3. Run `./verify-mcp.sh` to verify servers respond

### Tool Calls Failing
1. Check MCP server is running: `npx -y <server> --version`
2. Check tool name format: `mcp__<server>__<tool>`
3. Check parameters match tool schema

### Database Issues (hey-fr3k)
1. Check database exists: `ls -la ~/.hey-fr3k/tasks.db`
2. Check permissions: `chmod 755 ~/.hey-fr3k`
3. Test database: `echo '{"tool_name":"list_tasks","tool_input":{},"session_id":"test"}' | npx hey-fr3k`

---

**Status:** Ready for use
**Last Updated:** 2026-02-28
**Version:** 1.0.0
