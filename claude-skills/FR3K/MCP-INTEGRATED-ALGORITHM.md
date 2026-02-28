# MCP-Integrated FR3K Algorithm v1.0

**Date:** 2026-02-24
**Status:** Ready for integration
**Improvement:** Self-improvement loop via unified-pantheon-mcp

---

## Overview

This is the FR3K Algorithm enhanced with 4 MCP servers:
1. **hey-fr3k** - Semantic knowledge base (context retrieval, learning storage)
2. **fr3k-think** - Advanced reasoning (first principles, 32-agent red team)
3. **md-mcp** - Dynamic tool creation (runtime tool generation)
4. **unified-pantheon-mcp** - Self-improvement engine (TAS analysis, safety systems)

---

## MCP-Integrated Algorithm Format

### ENTRY (Phase 0)

```
🤖 Entering FR3K ALGORITHM MOFOS… ═══════════════════════════════════════

telegram-phase-notify 0 "ENTRY" "Algorithm Started" "Processing: {task_purpose}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Lets make it happen freek. {task_purpose}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Lets make it happen freek. {task_purpose}"

🗒️ TASK: [8 word description]

**START TIMER:** Record session start time for performance measurement
```

---

### OBSERVE (Phase 1/7) - **ENHANCED WITH hey-fr3k**

```
━━━ 👁️ OBSERVE ━━━ 1/7

telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "Analyzing: {task_summary}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"ok, time to scope the situation, work out the territory - lets go freek. Reverse engineering {task_summary}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "ok, time to scope the situation, work out the territory - lets go freek. Reverse engineering {task_summary}"

**🔌 MCP: hey-fr3k Context Retrieval**
```typescript
// Get recent semantic context BEFORE reverse-engineering
const context = await mcp_call("hey-fr3k", "get_context", {
  timeframe: "last_7_days",
  tags: ["work", "active", "{domain}"],
  limit: 10
});

// Use context for better understanding
console.log("Recent patterns:", context.patterns);
console.log("Related work:", context.recent_items);
```

🔎 **Reverse Engineering:**
- [What they asked]
- [What they implied]
- [What they DON'T want]
- [Context from hey-fr3k: {relevant_history}]

⚠️ **CREATE TASKS FOR fR3k System**
[INVOKE TaskCreate for each criterion]

🎯 **fR3k Ta$kz:**
[INVOKE TaskList - NO manual tables]

**RECORD PHASE START TIME:** $phase_1_start = now()
```

---

### THINK (Phase 2/7) - **ENHANCED WITH fr3k-think**

```
━━━ 🧠 SuSS ━━━ 2/7

telegram-phase-notify 2 "THINK" "Analysis" "Using {thinking_tools} to assess {analysis_focus}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Lets check this out and think it through fucking properly. Using {thinking_tools} to assess {analysis_focus}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Lets check this out and think it through fucking properly. Using {thinking_tools} to assess {analysis_focus}"

**🔌 MCP: fr3k-think Enhanced Reasoning**
```typescript
// First Principles Analysis (replaces manual assessment)
const fp_analysis = await mcp_call("fr3k-think", "first_principles", {
  problem: "{task_summary}",
  depth: 3
});
// Output: Deconstructed problem to fundamental truths

// Red Team Critique (32-agent adversarial analysis)
const critique = await mcp_call("fr3k-think", "red_team_analysis", {
  proposal: "{approach}",
  agent_count: 32,
  focus: "all"  // security, logic, feasibility
});
// Output: Multi-perspective critique + vulnerabilities

// Use both analyses for capability selection
```

🔍 **THINKING TOOLS ASSESSMENT** (justify exclusion):
│ Council:          [INCLUDE/EXCLUDE] — [reason tied to ISC]
│ RedTeam:          [INCLUDE/EXCLUDE] — [reason]
│ FirstPrinciples:  [INCLUDE/EXCLUDE] — [reason]
│ Science:          [INCLUDE/EXCLUDE] — [reason]
│ BeCreative:       [INCLUDE/EXCLUDE] — [reason]

🔍 **SKILL CHECK** (validate hook hints against ISC):
│ Hook suggested:   [skills from hook, or "none"]
│ ISC requires:     [skills needed based on reverse-engineered request + ISC]
│ Final skills:     [validated list — may add, remove, or confirm hook hints]

🎯 **The fR3k t3aM:**
│ Skills:     [specific skill:workflow pairs]
│ Thinking:   [included thinking tools from assessment above]
│ Primary:    [capability agent]  — [why, tied to which ISC]
│ Support:    [capability agent]  — [why]
│ Verify:     [capability agent]  — [why, QATester for non-trivial work]
│ Pattern:    [composition pattern name]
│ Sequence:   [A → B → C] or [A ↔ B] or [A, B, C] → D
│ Rationale:  [1 sentence connecting selections to ISC]

[Expand ISC using selected capabilities]

**RECORD PHASE START TIME:** $phase_2_start = now()
```

---

### PLAN (Phase 3/7) - **ENHANCED WITH md-mcp**

```
━━━ 📋 PLAN ━━━ 3/7

telegram-phase-notify 3 "PLAN" "Strategy" "Designing {approach_type} approach: {primary_goal}"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 3 "PLAN" "{approach_type} Strategy" "Designing {approach_type} approach to achieve {primary_goal}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Time to come up with the sikkest fucking plan. Designing {approach_type} approach to achieve {primary_goal}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Time to come up with the sikkest fucking plan. Designing {approach_type} approach to achieve {primary_goal}"

**🔌 MCP: md-mcp Dynamic Tool Creation (if needed)**
```typescript
// Check if custom tool needed for this task
if (requires_custom_analysis) {
  const tool = await mcp_call("md-mcp", "forge_reality", {
    tool_name: "{custom_tool_name}",
    tool_description: "{what it does}",
    parameters: {
      type: "object",
      properties: {
        // JSON schema for parameters
      }
    }
  });
  // Tool immediately available for use in EXECUTE phase
}
```

[Finalize approach]

**RECORD PHASE START TIME:** $phase_3_start = now()
```

---

### BUILD (Phase 4/7)

```
━━━ 🔨 BUILD ━━━ 4/7

telegram-phase-notify 4 "BUILD" "Implementation" "Creating {artifact_type}: {specific_thing}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Hell yeah! time to build this fucking shit. Creating {artifact_type}: {specific_thing}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Hell yeah! time to build this fucking shit. Creating {artifact_type}: {specific_thing}"

[Create artifacts]

**RECORD PHASE START TIME:** $phase_4_start = now()
```

---

### EXECUTE (Phase 5/7)

```
━━━ ⚡ EXECUTE ━━━ 5/7

telegram-phase-notify 5 "EXECUTE" "Running" "Executing {action} on {target}: {progress}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Time to check this shit over, make sure we are allllllll goooooooooodddddd. Running {action} on {target}, currently at {progress}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Time to check this shit over, make sure we are allllllll goooooooooodddddd. Running {action} on {target}, currently at {progress}"

**🔌 MCP: Use dynamically created tools (if any)**
```typescript
// If md-mcp created custom tools in PLAN phase, use them here
if (custom_tool_available) {
  const result = await mcp_call("md-mcp", "{custom_tool_name}", {
    // parameters
  });
}
```

[Run the work using selected capabilities]

**RECORD PHASE START TIME:** $phase_5_start = now()
```

---

### VERIFY (Phase 6/7)

```
━━━ ✅ VERIFICATION STATION ━━━ 6/7 (THE CULMINATION)

telegram-phase-notify 6 "VERIFY" "Results" "Verifying {verification_target}: {key_findings}"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 6 "VERIFY" "Verification Results" "Verifying {verification_target}, results show {key_findings}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Verification station. This is the culmination. Verifying {verification_target}, results show {key_findings}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Verification station. This is the culmination. Verifying {verification_target}, results show {key_findings}"

**CRITICAL:** For ALL non-trivial work (implementation, code changes, system modifications):
- Use **QATester capability** (subagent_type=QATester) for browser-based verification
- **NEVER claim completion without verification** using appropriate tooling
- **ALWAYS provide evidence** for each ISC criterion via TaskUpdate

[INVOKE TaskList, TaskUpdate with evidence for each]

**RECORD PHASE START TIME:** $phase_6_start = now()
```

---

### LEARN (Phase 7/7) - **ENHANCED WITH hey-fr3k + unified-pantheon-mcp**

```
━━━ 📚 LEARN ━━━ 7/7

telegram-phase-notify 7 "LEARN" "Insights" "Learned: {key_insight}. Next: {actionable_takeaway}"
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d "{\"message\":\"Now what shit did we fucking learn. Learned that {key_insight}, {actionable_takeaway}\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}"
🔊 Voice notification sent: "Now what shit did we fucking learn. Learned that {key_insight}, {actionable_takeaway}"

**🔌 MCP: Store Learnings (hey-fr3k)**
```typescript
await mcp_call("hey-fr3k", "add_note", {
  content: "{key_insight}",
  tags: ["learning", "{session_id}", "{domain}"]
});

await mcp_call("hey-fr3k", "create_task", {
  title: "{actionable_takeaway}",
  priority: "medium",
  tags: ["follow-up", "{session_id}"]
});
```

**🔌 MCP: Self-Improvement Analysis (unified-pantheon-mcp)**
```typescript
const improvements = await mcp_call("unified-pantheon-mcp", "tas_analyze", {
  session_id: "{current_session}",
  phase_metrics: {
    phase_1: phase_1_duration,
    phase_2: phase_2_duration,
    phase_3: phase_3_duration,
    phase_4: phase_4_duration,
    phase_5: phase_5_duration,
    phase_6: phase_6_duration,
    phase_7: phase_7_duration,
    total_session: total_duration
  },
  isc_results: {
    total: total_criteria,
    passed: passed_criteria,
    failed: failed_criteria,
    pass_rate: (passed_criteria / total_criteria) * 100
  },
  capability_selection: {
    primary: primary_capability,
    support: support_capability,
    verify: verify_capability,
    thinking_tools: used_thinking_tools
  },
  safety_checks: {
    destructive_operations: destructive_ops_count,
    user_approvals: approval_count,
    blocked_actions: blocked_count
  }
});

// Returns: Automated improvement suggestions
// Example:
// {
//   "suggestions": [
//     "Phase 2 (THINK) averaged 45s. Consider parallelizing first_principles and red_team_analysis",
//     "ISC pass rate 85%. RedTeam excluded but failure rate 15% - include RedTeam more often",
//     "Engineer selected but QATester skipped - add verification for code changes",
//     "Safety check blocked 2 operations - prevented potential data loss"
//   ],
//   "priority_improvements": [
//     { "area": "reasoning_quality", "current": 7.5, "target": 9.0, "action": "include FirstPrinciples more" },
//     { "area": "verification", "current": 60%, "target": 95%, "action": "always use QATester for code" }
//   ],
//   "performance_metrics": {
//     "total_time": total_duration,
//     "avg_phase_time": average_phase_time,
//     "bottleneck_phase": slowest_phase
//   }
// }
```

**📊 PERFORMANCE MEASUREMENT:**
```typescript
// Calculate phase durations
const phase_times = {
  phase_1: phase_2_start - phase_1_start,
  phase_2: phase_3_start - phase_2_start,
  phase_3: phase_4_start - phase_3_start,
  phase_4: phase_5_start - phase_4_start,
  phase_5: phase_6_start - phase_5_start,
  phase_6: phase_7_start - phase_6_start,
  phase_7: session_end - phase_7_start,
  total: session_end - session_start
};

// Store performance data for trend analysis
await mcp_call("hey-fr3k", "add_note", {
  content: `Session ${current_session} performance: ${JSON.stringify(phase_times)}`,
  tags: ["performance", "metrics", session_id]
});
```

[What to improve next time]

**RECORD SESSION END TIME:** $session_end = now()

🗣️ FR3K: [Spoken summary]
```

---

## Self-Improvement Loop

### How It Works

1. **Every Algorithm run** measures:
   - Phase execution times
   - ISC pass/fail rates
   - Capability selection effectiveness
   - Safety check triggers

2. **unified-pantheon-mcp TAS analysis**:
   - Identifies bottlenecks (slowest phases)
   - Correlates thinking tools with success rates
   - Suggests capability improvements
   - Tracks safety interventions

3. **Automated suggestions** (examples):
   - "Phase 2 averaging 45s → parallelize fr3k-think calls"
   - "RedTeam excluded but failure rate 15% → include RedTeam"
   - "Engineer + QATester = 95% pass rate → always pair them"

4. **Trend tracking** (via hey-fr3k):
   - Performance over time (getting faster?)
   - Pass rates over time (improving?)
   - Most effective thinking tools (data-driven)

### Measuring Improvement

**Before MCP Integration (Baseline):**
- Avg session time: [measure from past sessions]
- ISC pass rate: [calculate from history]
- Reasoning quality: [user ratings avg]

**After MCP Integration:**
- Avg session time: [compare to baseline]
- ISC pass rate: [compare to baseline]
- Reasoning quality: [compare to baseline]

**Success Criteria:**
- ✅ Session time decreases by 20%+
- ✅ ISC pass rate increases to 90%+
- ✅ User ratings 8-10 (euphoric surprise)

---

## Integration Readiness

**All 4 MCP Servers Verified:**
- ✅ hey-fr3k - Semantic KB operational
- ✅ fr3k-think - Advanced reasoning operational
- ✅ md-mcp - Dynamic tool creation operational
- ✅ unified-pantheon-mcp - Self-improvement operational

**Ready to deploy:**
1. Add MCP calls to Algorithm phases (as documented above)
2. Test self-improvement loop with live session
3. Measure performance improvements
4. Iterate based on TAS suggestions

---

**Next Step:** Integrate into CORE format and begin testing.
