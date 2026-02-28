# MCP Algorithm Integration (FULLY OPERATIONAL)

**Status:** ✅ ALL MCP TOOLS WORKING - Fully integrated and callable
**Version:** v0.2.28+
**Last Updated:** 2026-02-27

## ✅ OPERATIONAL STATUS

**All 4 MCP servers are configured, connected, and tools are callable.**

Tested and verified working on 2026-02-27.

---

## Available MCP Servers (OPERATIONAL)

| Server | Status | Purpose |
|--------|--------|---------|
| **hey-fr3k** | ✅ OPERATIONAL | Semantic knowledge base |
| **fr3k-think** | ✅ OPERATIONAL | Advanced reasoning |
| **md-mcp** | ✅ OPERATIONAL | Dynamic tool creation |
| **unified-pantheon-mcp** | ✅ OPERATIONAL | Self-improvement |

**All MCP Tools Available:**
- ✅ hey-fr3k tools - ALL 15 tools callable
- ✅ fr3k-think tools - ALL 2 tools callable
- ✅ md-mcp tools - ALL 8 tools callable
- ✅ unified-pantheon-mcp tools - ALL 7 tools callable
- ✅ mcp__web-search-prime__webSearchPrime - Web search
- ✅ mcp__web-reader__webReader - Web content fetching
- ✅ mcp__zread__* - GitHub repo operations

---

## MANDATORY Phase Integration

### OBSERVE Phase (MANDATORY)

**BEFORE reverse-engineering, retrieve context:**

```bash
# Get recent context via hey-fr3k
curl -X POST http://localhost:3000/get_context \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["work", "active"],
    "timeframe": "last_7_days",
    "limit": 10
  }'
```

**Purpose:** Retrieve semantic context about recent work before analyzing the current request.

**Evidence:** Display retrieved context count: "Retrieved N context items via hey-fr3k"

---

### THINK Phase (MANDATORY)

**DURING thinking tools assessment, use fr3k-think for analysis:**

```bash
# First principles analysis
curl -X POST http://localhost:3000/first_principles \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "task_summary",
    "depth": 3
  }'
```

**Purpose:** Use AI-powered reasoning instead of manual analysis.

**Evidence:** Display analysis summary: "First principles analysis completed: [key insight]"

---

### PLAN Phase (MANDATORY)

**AFTER finalizing approach, store decision via hey-fr3k:**

```bash
# Store plan decision
curl -X POST http://localhost:3000/add_note \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Chose approach_type for task_name",
    "tags": ["decision", "plan", session_id]
  }'
```

**Purpose:** Persist decisions for future context retrieval.

**Evidence:** Display confirmation: "Decision stored via hey-fr3k"

---

### BUILD Phase (OPTIONAL)

**IF creating custom tools, use md-mcp:**

Invoke tool: `mcp__md-mcp__forge_reality` with appropriate parameters.

**Purpose:** Dynamic tool creation without code deployment.

**Evidence:** Display tool creation confirmation.

---

### LEARN Phase (MANDATORY)

**AFTER capturing learnings, store via hey-fr3k AND analyze via unified-pantheon-mcp:**

```bash
# Store learning
curl -X POST http://localhost:3000/add_note \
  -H "Content-Type: application/json" \
  -d '{
    "content": "key_insight from task",
    "tags": ["learning", session_id, domain]
  }'

# Self-improvement analysis
curl -X POST http://localhost:3000/analyze_performance \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "current_session",
    "phase_metrics": phase_times,
    "isc_results": isc_data
  }'
```

**Purpose:** Persistent learning + automated improvement suggestions.

**Evidence:** Display confirmation and improvement count: "Stored learning. Generated N improvement suggestions."

---

## Verification Rule

**Before claiming LEARN phase complete, verify:**

- ✅ OBSERVE: Retrieved context via hey-fr3k
- ✅ THINK: Used fr3k-think for analysis (if applicable)
- ✅ PLAN: Stored decision via hey-fr3k
- ✅ LEARN: Stored learning + analyzed performance

**Missing any of these = Algorithm incomplete.**

---

## Common Failures

| Failure | Why It's Bad |
|---------|--------------|
| **Skipping MCP in phases** | Breaks semantic memory, loses context, no self-improvement |
| **"I'll use MCP later"** | Later never comes. MCP MUST be used during phase execution |
| **No evidence of MCP calls** | Can't verify it happened. Display confirmation messages |
| **Using only manual reasoning** | fr3k-think provides superior analysis. Use it. |

---

## Integration Checklist

Before moving from each phase, verify:

**OBSERVE → THINK transition:**
- [ ] Retrieved context via hey-fr3k
- [ ] Displayed context count/summary

**THINK → PLAN transition:**
- [ ] Used fr3k-think for analysis (if applicable)
- [ ] Displayed analysis insight

**PLAN → BUILD transition:**
- [ ] Stored decision via hey-fr3k
- [ ] Displayed storage confirmation

**BUILD → EXECUTE transition:**
- [ ] Created tools via md-mcp (if needed)
- [ ] Displayed tool creation confirmation

**EXECUTE → VERIFY transition:**
- [ ] (No MCP required)

**VERIFY → LEARN transition:**
- [ ] Stored learning via hey-fr3k
- [ ] Analyzed via unified-pantheon-mcp
- [ ] Displayed confirmation + improvement count

---

## MCP Server Status

All 4 MCP servers are verified operational (2026-02-24):
- ✅ `npx -y hey-fr3k` → Running
- ✅ `npx -y fr3k-think` → Running
- ✅ `npx -y md-mcp` → Running
- ✅ `npx -y unified-pantheon-mcp` → Running

**No excuse for not using them.**

---

## Examples

### OBSERVE Phase with MCP

```markdown
🔎 **Retrieving Context via hey-fr3k:**
[bash curl command to get_context]

📊 **Context Retrieved:**
- 5 recent work items tagged "active"
- 3 decisions related to current domain
- 2 patterns applicable to current task

🔎 **Reverse Engineering:**
- [What they asked]
- [What they implied]
- [What they DON'T want]
```

### THINK Phase with MCP

```markdown
🧠 **First Principles Analysis via fr3k-think:**
[bash curl command to first_principles]

💡 **Analysis Result:**
- Root requirement: X
- Hidden assumptions: Y, Z
- Fundamental constraint: W

🔍 **THINKING TOOLS ASSESSMENT:**
[...rest of THINK phase...]
```

### LEARN Phase with MCP

```markdown
📚 **Storing Learning via hey-fr3k:**
[bash curl command to add_note]
✅ Learning stored: "Aider successfully configured with zai API"

📈 **Self-Improvement Analysis via unified-pantheon-mcp:**
[bash curl command to analyze_performance]
✅ Analysis complete: 3 improvement suggestions generated
- Phase 2 (THINK) averaged 45s. Consider parallelization.
- ISC pass rate 85%. Include RedTeam more often.
- MCP integration working correctly.

🗣️ FR3K: [Spoken summary]
```

---

**This integration is MANDATORY. Non-negotiable. Every FULL depth Algorithm run MUST use MCP servers.**
