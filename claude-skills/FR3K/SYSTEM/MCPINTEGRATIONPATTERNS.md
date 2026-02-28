# MCP Integration Patterns - When to Use Each Tool

## Purpose

Make MCP tool usage STICKY and AUTOMATIC in FR3K workflows. These tools are powerful and should be used actively, not just documented.

---

## MCP Servers & When to Use Them

### 1. hey-fr3k - Task Management

**Tool:** Task persistence and tracking
**When to USE:**
- Every time FR3K creates or updates ISC tasks → Mirror to hey-fr3k
- Every time user assigns work → Add to hey-fr3k
- Every work session → Query hey-fr3k for active tasks
- Every completion → Update hey-fr3k status

**Integration Point:** TASKCREATE and TASKUPDATE operations

**Example Workflow:**
```
User: "Integrate pocket-agent features"
FR3K:
  1. Create ISC tasks with TaskCreate
  2. ADD SAME TASKS to hey-fr3k for persistence
  3. Work on tasks
  4. Update both TaskList and hey-fr3k as progress made
  5. Mark complete in both systems
```

**Why:** hey-fr3k provides persistent task database that survives sessions

---

### 2. fr3k-think - Structured Thinking

**Tool:** Step-by-step analysis for complex problems
**When to USE:**
- Complex architectural decisions (system design, patterns)
- Multi-step planning (break down complex tasks)
- Investigation mode (deep analysis required)
- Implementation strategy (how to approach coding)
- Debugging complex issues (systematic troubleshooting)

**Integration Point:** THINK and PLAN phases of FR3K Algorithm

**Example Workflow:**
```
User: "Design autonomous social media system"
FR3K:
  1. OBSERVE phase complete
  2. THINK phase: USE fr3k-think for structured analysis
     - Invoke: think tool with mode="investigation"
     - Get step-by-step architectural breakdown
  3. PLAN phase: Use fr3k-think output for design
  4. BUILD phase: Implementation based on thinking
```

**Why:** fr3k-think provides systematic reasoning better than ad-hoc thinking

---

### 3. unified-pantheon-mcp - Meta-Cognitive TAS Analysis

**Tool:** Demon-Angel-Score (TAS) balanced perspective
**When to USE:**
- Major architectural decisions (need balanced view)
- Autonomous system evolution (self-improvement decisions)
- Trade-off analysis (capability vs resource usage)
- Risk assessment (pros/cons of approaches)
- System optimization decisions (performance vs features)

**Integration Point:** THINK phase for major decisions, LEARN phase for improvements

**Example Workflow:**
```
User: "Should I add more autonomous workers?"
FR3K:
  1. THINK phase: Invoke analyze_with_demon_angel
     - Subject: "Adding more autonomous workers"
     - Perspective: "resource-usage-vs-capability"
  2. Get TAS analysis:
     - Angel perspective: More capability, better coverage
     - Demon perspective: Resource drain, diminishing returns
     - Synthesis: Balanced recommendation
  3. Make decision based on TAS input
```

**Why:** TAS analysis prevents bias and provides balanced perspective

---

### 4. md-mcp - Dynamic Tool Creation

**Tool:** Create tools from markdown specifications
**When to USE:**
- Recurring task needs automation (create tool)
- Complex workflow repeated 3+ times (make it a tool)
- User requests new capability (build with md-mcp)
- System expansion needed (forge new tools)

**Integration Point:** BUILD and EXECUTE phases

**Example Workflow:**
```
User: "I need to check GitHub releases daily"
FR3K:
  1. Notice this is recurring
  2. Create tool spec in markdown
  3. Invoke forge_reality tool
  4. Tool immediately available
  5. Use new tool in autonomous workers
```

**Why:** Declarative tool creation faster than coding

---

## Integration Patterns

### Pattern 1: Task Creation Mirror

**Whenever TaskCreate invoked → Also add to hey-fr3k**

```
TaskCreate(task) → {
  // Create ISC task
  create_isc_task(task);

  // Mirror to hey-fr3k
  invoke('mcp__hey-fr3k__add_task', {
    task: task.subject,
    requirements: task.description,
    files: [],
    expected_results: "Task completion"
  });
}
```

### Pattern 2: Structured Thinking Injection

**THINK phase → Use fr3k-think for complex analysis**

```
If (task.complexity == "high") {
  invoke('mcp__fr3k-think__think', {
    query: task.description,
    mode: "investigation"
  });

  // Use thinking output in planning
}
```

### Pattern 3: TAS Decision Support

**Major decisions → Use unified-pantheon for balance**

```
If (decision.impact == "high") {
  invoke('mcp__unified-pantheon-mcp__analyze_with_demon_angel', {
    subject: decision.description,
    perspective: "pro-vs-con"
  });

  // Use TAS analysis for decision
}
```

### Pattern 4: Tool Creation on Demand

**Recurring patterns → Create tool with md-mcp**

```
If (pattern.frequency >= 3) {
  create_markdown_spec(pattern);
  invoke('mcp__md-mcp__forge_reality', {
    divine_title: pattern.name,
    primal_essence: spec,
    creation_ritual: "basic"
  });
}
```

---

## Making It Sticky: Auto-Usage Rules

### Rule 1: Always Mirror Tasks to hey-fr3k
**Trigger:** TaskCreate/TaskUpdate
**Action:** Automatically invoke hey-fr3k to maintain persistent database

### Rule 2: Complex Thinking Uses fr3k-think
**Trigger:** Task marked "complex" or requires investigation
**Action:** Invoke fr3k-think before planning

### Rule 3: Major Decisions Use TAS Analysis
**Trigger:** Architectural decision, resource trade-off
**Action:** Invoke unified-pantheon for balanced perspective

### Rule 4: Recurring Work Becomes Tool
**Trigger:** Same operation 3+ times
**Action:** Create tool with md-mcp

---

## Usage Examples by FR3K Phase

### OBSERVE Phase
- **hey-fr3k**: Check for existing related tasks
- **fr3k-think**: (skip - too early)

### THINK Phase
- **fr3k-think**: Analyze complex requirements, investigate patterns
- **unified-pantheon**: TAS analysis for major decisions
- **hey-fr3k**: Query context from previous tasks

### PLAN Phase
- **fr3k-think**: Structured planning for complex implementation
- **unified-pantheon**: Evaluate trade-offs in approach

### BUILD Phase
- **md-mcp**: Create tools for recurring patterns
- **hey-fr3k**: Track build tasks

### EXECUTE Phase
- **hey-fr3k**: Update task progress
- **fr3k-think**: Debug complex issues

### VERIFY Phase
- **fr3k-think**: Analyze verification results
- **hey-fr3k**: Mark tasks complete

### LEARN Phase
- **unified-pantheon**: Self-evolve based on learnings
- **hey-fr3k**: Create improvement tasks
- **md-mcp**: Create tools for improvement patterns

---

## Quick Reference Card

| MCP Tool | When to Use | FR3K Phase | Trigger |
|----------|-------------|-----------|---------|
| **hey-fr3k** | Task persistence | All phases | TaskCreate/TaskUpdate |
| **fr3k-think** | Complex analysis | THINK, PLAN | Complexity=high, mode=investigation |
| **unified-pantheon** | Balanced decisions | THINK, LEARN | Major decisions, trade-offs |
| **md-mcp** | Tool creation | BUILD, EXECUTE | Pattern repeated 3+ times |

---

## Implementation Status

✅ **Documented:** When to use each tool
✅ **Patterns defined:** 4 integration patterns
✅ **Auto-usage rules:** Sticky behavior guidelines
⏳ **Active usage:** Needs implementation in FR3K Algorithm
⏳ **Tool invocation:** Actual MCP tool calls needed

---

**Next Steps:**
1. Modify FR3K Algorithm to automatically invoke hey-fr3k for tasks
2. Add fr3k-think usage in THINK phase for complex analysis
3. Use unified-pantheon for major architectural decisions
4. Create tools with md-mcp for recurring patterns
5. Verify all tools providing value

---

**Created:** 2026-02-07
**Purpose:** Make MCP tool usage automatic and sticky
**Status:** Patterns defined, ready for implementation
