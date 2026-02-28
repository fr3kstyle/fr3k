# Multi-Agent Design Patterns - FR3K System

**Based on:** Google's Agent Development Kit (ADK) Eight Patterns
**Source:** https://www.infoq.com/news/2026/01/multi-agent-design-patterns/
**Date:** 2026-02-10

---

## Overview

Multi-agent systems excel at complex, collaborative tasks. FR3K implements these patterns through the Task tool and agent delegation system.

**Key Principle:** Use patterns to compose agent capabilities. Single agents handle single domains; multi-agent patterns handle complexity.

---

## Pattern 1: Sequential Pipeline

**Structure:** `A → B → C`

**Description:** Agents process data in sequence, each adding specialized transformation. Output of one agent becomes input of the next.

**When to Use:**
- Multi-stage workflows (explore → architect → implement)
- Domain handoff required (research → engineering → QA)
- Sequential dependencies (must complete A before B)

**FR3K Implementation:**
```typescript
// Example: Explore → Architect → Engineer
TaskTool invoke: Explore agent → returns context
TaskTool invoke: Architect agent → uses Explore context → returns design
TaskTool invoke: Engineer agent → uses design → implements
```

**Real Example:**
```typescript
// THink phase capability selection
{
  "Primary": "Explore — Find all files matching pattern",
  "Support": "Architect — Design structure based on findings",
  "Verify": "Engineer — Implement the architectural changes",
  "Pattern": "Pipeline",
  "Sequence": "Explore → Architect → Engineer"
}
```

**Pros:** Clear handoff, specialized domains, easy to debug
**Cons:** Slowest (sequential), single point of failure

---

## Pattern 2: Coordinator/Dispatcher

**Structure:** `Router → [Agent A, Agent B, Agent C]`

**Description:** Central coordinator analyzes request and dispatches to specialist agent. Each agent handles one domain.

**When to Use:**
- Categorized tasks (code, documentation, testing)
- Language-specific work (Python, TypeScript, Rust)
- Clear domain boundaries

**FR3K Implementation:**
```typescript
// Example: Skill router in CreateSkill
function routeToAgent(skillType: string) {
  switch (skillType) {
    case 'documentation': return 'Intern';
    case 'implementation': return 'Engineer';
    case 'research': return 'Explore';
    case 'testing': return 'QATester';
  }
}
```

**Real Example:**
```typescript
// Hook system routing
const hookRoutes = {
  'PreToolUse:Bash': 'SecurityValidator',
  'Stop': 'StopOrchestrator → [Voice, Capture, TabState, Integrity]',
  'SessionStart': '[LoadContext, StartupGreeting]'
};
```

**Pros:** Specialized agents, parallel dispatch, clear ownership
**Cons:** Coordinator bottleneck, routing logic complexity

---

## Pattern 3: Parallel Fan-out/Gather

**Structure:** `→ [A, B, C] → D`

**Description:** Spawn multiple agents in parallel, each working on independent piece. Gatherer agent synthesizes results.

**When to Use:**
- Independent research from multiple perspectives
- Code review from different angles (security, performance, style)
- Multi-source validation

**FR3K Implementation:**
```typescript
// Example: Multi-perspective research
const agents = [
  { name: 'ClaudeResearcher', query: 'Claude Opus 4.6 features' },
  { name: 'GeminiResearcher', query: 'Google multi-agent patterns' },
  { name: 'GrokResearcher', query: 'xAI latest capabilities' }
];

// All run in parallel (single message, multiple Task calls)
// Results synthesized by main agent
```

**Real Example:**
```typescript
// From actual session:
TaskTool: "GeminiResearcher — Research AI advancements"
TaskTool: "Engineer — Fix all PAI references"
// Both run in parallel, results synthesized by main agent
```

**Pros:** Fast (parallel), diverse perspectives, fault isolation
**Cons:** Synthesis complexity, higher token cost

---

## Pattern 4: Hierarchical Decomposition

**Structure:** `Manager → [SubManager A, SubManager B] → [Workers]`

**Description:** Hierarchical tree of managers and workers. Each manager delegates to sub-managers or workers.

**When to Use:**
- Large projects with subsystems
- Natural hierarchy (frontend/backend, microservices)
- Need middle management (coordination without execution)

**FR3K Implementation:**
```typescript
// Example: Full-stack project
Main Agent (FR3K)
  ├─ Frontend Manager
  │   ├─ UI Designer
  │   └─ Frontend Engineer
  └─ Backend Manager
      ├─ API Engineer
      └─ Database Architect
```

**Real Example:**
```typescript
// Algorithm orchestrates phases
OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
Each phase may spawn sub-agents
```

**Pros:** Scalable, clear authority, natural organization
**Cons:** Communication overhead, manager bottlenecks

---

## Pattern 5: Generator-Critic

**Structure:** `Agent A ↔ Agent B (loop)`

**Description:** Generator agent produces work, critic agent evaluates and requests revisions. Loop until quality threshold met.

**When to Use:**
- Iterative refinement (code → review → fix)
- Quality-critical outputs (security, production)
- Need adversarial testing

**FR3K Implementation:**
```typescript
// Example: TDD Loop
{
  "Primary": "Engineer — Implement feature",
  "Verify": "QATester — Test implementation",
  "Pattern": "TDD Loop",
  "Sequence": "Engineer ↔ QATester (until tests pass)"
}
```

**Real Example:**
```typescript
// Algorithm VERIFY phase calls QATester
// QATester finds issues → Engineer fixes → repeat
```

**Pros:** Quality assurance, adversarial testing, continuous improvement
**Cons:** Can loop forever, higher cost, slower

---

## Pattern 6: Iterative Refinement

**Structure:** `Agent A → Agent A → Agent A (loop with state)`

**Description:** Single agent iterates on task, improving with each pass. State preserved between iterations.

**When to Use:**
- Incremental improvement (refactor, optimize)
- Converging on solution (debug, optimize)
- Stateful exploration (search, refine)

**FR3K Implementation:**
```typescript
// Example: Debug loop
let debugged = false;
let attempts = 0;
while (!debugged && attempts < 5) {
  // Agent analyzes, proposes fix, tests, learns
  // State preserved between iterations
}
```

**Real Example:**
```typescript
// Hill-climbing in Algorithm
// Create ISC tasks → Execute → Verify → Update ISC → Repeat
```

**Pros:** Simple, stateful, convergent
**Cons:** Single perspective, slower convergence

---

## Pattern 7: Human-in-the-Loop

**Structure:** `Agent → Human Review → Agent`

**Description:** Agent does work, human reviews/guides, agent continues. Critical for alignment and safety.

**When to Use:**
- Security-sensitive operations (git push --force, rm -rf)
- Creative work with human taste
- Alignment-critical decisions

**FR3K Implementation:**
```typescript
// Example: AskUserQuestion for confirmation
{
  "question": "Force push rewrites history. Proceed?",
  "options": [
    { "label": "Yes, force push", "description": "Rewrite remote history" },
    { "label": "No, cancel", "description": "Keep remote history intact" }
  ]
}
```

**Real Example:**
```typescript
// SecurityValidator + AskUserQuestion
// Hook blocks destructive operations, asks user for confirmation
```

**Pros:** Safety, alignment, control
**Cons:** Slower, human bottleneck, interruption

---

## Pattern 8: Composite

**Structure:** `[Pattern A, Pattern B]` combined

**Description:** Multiple patterns composed into larger workflow. Most real systems use composites.

**When to Use:**
- Complex workflows with multiple phases
- Need different patterns for different phases
- Production systems (typically composite)

**FR3K Implementation:**
```typescript
// Example: Algorithm itself is composite
OBSERVE: Coordinator (routes to agents based on context)
THINK: Single Agent (main agent reasoning)
PLAN: Single Agent (design approach)
BUILD: Pipeline (Architect → Engineer)
EXECUTE: Fan-out (multiple agents in parallel)
VERIFY: Generator-Critic (Engineer ↔ QATester)
LEARN: Single Agent (capture learnings)
```

**Real Example:**
```typescript
// Full Algorithm execution:
// 1. OBSERVE: Coordinator pattern (analyze request)
// 2. THINK: Single agent (select capabilities)
// 3. PLAN: Single agent (design approach)
// 4. BUILD: Pipeline or Fan-out depending on task
// 5. EXECUTE: Fan-out to agents
// 6. VERIFY: Generator-Critic (test loop)
// 7. LEARN: Single agent (capture)
```

**Pros:** Flexible, realistic, handles complexity
**Cons:** Complex, harder to reason about

---

## Pattern Selection Guide

| Task Characteristics | Best Pattern | Example |
|---------------------|--------------|---------|
| Multi-stage workflow | **Pipeline** | Explore → Architect → Engineer |
| Domain categorization | **Coordinator** | Router to code/docs/test agents |
| Independent subtasks | **Fan-out/Gather** | Multi-perspective research |
| Hierarchical project | **Hierarchical** | Frontend/Backend managers |
| Quality critical | **Generator-Critic** | Engineer ↔ QATester |
| Iterative improvement | **Iterative Refinement** | Debug loop |
| Safety critical | **Human-in-the-Loop** | Destructive operations |
| Complex workflow | **Composite** | Algorithm itself |

---

## FR3K Pattern Catalog

**Current Implementations:**
- ✅ **Pipeline** - Algorithm phases, capability selection
- ✅ **Coordinator** - Hook system, skill routing
- ✅ **Fan-out/Gather** - Multi-agent research, parallel Task calls
- ✅ **Hierarchical** - Algorithm orchestrates phases
- ✅ **Generator-Critic** - TDD Loop (Engineer ↔ QA)
- ✅ **Human-in-the-Loop** - AskUserQuestion, security hooks
- ✅ **Composite** - Full Algorithm execution
- ⏳ **Iterative Refinement** - Hill-climbing with ISC tasks (partial)

**Pattern Maturity:**
- Production-ready: 7/8 patterns
- In-development: 1/8 (Iterative Refinement)
- Documentation: Complete

---

## Anti-Patterns to Avoid

**1. Single Agent for Everything**
- ❌ One agent tries to do all phases
- ✅ Use Pipeline or Composite

**2. Sequential When Parallel Possible**
- ❌ Agents run sequentially when independent
- ✅ Use Fan-out/Gather

**3. No Verification Loop**
- ❌ Agent completes work without testing
- ✅ Use Generator-Critic or TDD Loop

**4. Missing Human Gate**
- ❌ Destructive operations auto-execute
- ✅ Use Human-in-the-Loop

**5. Flat Hierarchy for Complex Systems**
- ❌ All agents report to single manager
- ✅ Use Hierarchical decomposition

---

## Implementation Guidelines

**When Adding Patterns:**

1. **Identify the pattern first** - Don't just compose agents
2. **Document the pattern choice** - In THINK phase capability selection
3. **Use standard pattern names** - Pipeline, Fan-out, etc.
4. **Specify sequence explicitly** - A → B or [A, B] → D
5. **Verify the pattern works** - Test with actual workflows

**Example Documentation:**
```typescript
{
  "Primary": "Explore — Find all hooks with PAI references",
  "Support": "Engineer — Fix all found references",
  "Verify": "QATester — Test hooks execute without errors",
  "Pattern": "Pipeline",
  "Sequence": "Explore → Engineer → QATester",
  "Rationale": "Sequential handoff required: find → fix → test"
}
```

---

## Future Enhancements

**Pattern Library (Planned):**
- Pre-built pattern templates in `skills/FR3K/Patterns/`
- One-line pattern invocation
- Automatic agent spawning based on pattern
- Pattern result aggregation

**Example Future API:**
```typescript
// Instead of manual Task calls
await invokePattern('FanOut', {
  agents: [
    { type: 'ClaudeResearcher', query: 'X' },
    { type: 'GeminiResearcher', query: 'Y' },
    { type: 'GrokResearcher', query: 'Z' }
  ],
  gather: 'Synthesize results from all three'
});
```

---

## References

- **Source:** Google Agent Development Kit (ADK)
- **Paper:** "Eight Multi-Agent Design Patterns" (2026)
- **URL:** https://www.infoq.com/news/2026/01/multi-agent-design-patterns/
- **FR3K Implementation:** Complete (7/8 patterns production-ready)

---

**Status:** ✅ Documented and integrated into FR3K Algorithm
**Next:** Create Pattern Library templates for easier invocation
