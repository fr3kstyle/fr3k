#!/usr/bin/env bun
/**
 * PAI Dispatcher Agent - Parallel Agent Coordination System
 *
 * Spawns 10-20 parallel specialized agents for complex tasks.
 * Coordinates their work, merges results, and reports back via Telegram.
 * Replaces sequential processing with massive parallelization.
 */

import { Bot } from "grammy";
import { spawn } from "bun";
import { tracer } from "../observability/tracer.js";
import { getWorkflowStore } from "../observability/workflow-store.js";
import { getMessageLineage } from "../observability/message-lineage.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const DISPATCHER_QUEUE_PATH = "/tmp/pai-dispatcher-queue.json";
const AGENT_WORK_DIR = "/tmp/pai-agents";
const MAX_AGENTS = 20; // Maximum concurrent agents per task
const MIN_AGENTS = 10;  // Minimum concurrent agents per task

// ============================================================================
// AGENT TYPES AND SPECIALIZATIONS
// ============================================================================

interface AgentProfile {
  id: string;
  name: string;
  specialization: string;
  capabilities: string[];
  model: string;
  priority: number; // 1-10, 10 is highest specialization
  status: "idle" | "working" | "completed" | "failed";
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
}

interface DispatcherTask {
  id: string;
  userId: string;
  chatId: string;
  prompt: string;
  timestamp: number;
  agents: AgentProfile[];
  results: Record<string, any>;
  completedAgents: string[];
  failedAgents: string[];
  coordinationMatrix: Record<string, string[]>; // Agent dependencies
  priority: "low" | "normal" | "high" | "critical";
  status: "queued" | "dispatching" | "coordinating" | "merging" | "completed" | "failed";
  traceContext?: any;
}

// Predefined specialized agent profiles
const AGENT_PROFILES: AgentProfile[] = [
  // Research & Analysis Agents
  {
    id: "researcher-1",
    name: "Deep Researcher",
    specialization: "comprehensive research",
    capabilities: ["web_search", "document_analysis", "fact_checking", "synthesis"],
    model: "claude-3-opus",
    priority: 10,
    status: "idle"
  },
  {
    id: "researcher-2",
    name: "Fact Checker",
    specialization: "verification & validation",
    capabilities: ["source_verification", "cross_reference", "consensus_building"],
    model: "claude-3-sonnet",
    priority: 9,
    status: "idle"
  },

  // Analysis & Synthesis Agents
  {
    id: "analyst-1",
    name: "Data Analyst",
    specialization: "quantitative analysis",
    capabilities: ["statistical_analysis", "data_visualization", "pattern_recognition"],
    model: "claude-3-sonnet",
    priority: 9,
    status: "idle"
  },
  {
    id: "analyst-2",
    name: "Strategic Analyst",
    specialization: "strategic thinking",
    capabilities: ["scenario_planning", "risk_assessment", "opportunity_analysis"],
    model: "claude-3-opus",
    priority: 10,
    status: "idle"
  },

  // Creative & Content Agents
  {
    id: "creative-1",
    name: "Creative Writer",
    specialization: "content creation",
    capabilities: ["creative_writing", "storytelling", "engagement_optimization"],
    model: "claude-3-opus",
    priority: 8,
    status: "idle"
  },
  {
    id: "creative-2",
    name: "Editor",
    specialization: "content refinement",
    capabilities: ["grammar_check", "style_optimization", "clarity_enhancement"],
    model: "claude-3-sonnet",
    priority: 7,
    status: "idle"
  },

  // Technical & Implementation Agents
  {
    id: "tech-1",
    name: "Technical Architect",
    specialization: "system design",
    capabilities: ["architecture", "scalability", "performance_optimization"],
    model: "claude-3-opus",
    priority: 10,
    status: "idle"
  },
  {
    id: "tech-2",
    name: "Implementation Guide",
    specialization: "practical implementation",
    capabilities: ["code_generation", "step_by_step_guides", "troubleshooting"],
    model: "claude-3-sonnet",
    priority: 8,
    status: "idle"
  },

  // Problem Solving Agents
  {
    id: "solver-1",
    name: "Problem Solver",
    specialization: "complex problem decomposition",
    capabilities: ["root_cause_analysis", "solution_generation", "implementation_planning"],
    model: "claude-3-opus",
    priority: 10,
    status: "idle"
  },
  {
    id: "solver-2",
    name: "Constraint Optimizer",
    specialization: "resource optimization",
    capabilities: ["resource_allocation", "constraint_analysis", "efficiency_optimization"],
    model: "claude-3-sonnet",
    priority: 9,
    status: "idle"
  },

  // Domain-Specific Agents
  {
    id: "domain-1",
    name: "Business Analyst",
    specialization: "business strategy",
    capabilities: ["market_analysis", "competitive_intelligence", "business_modeling"],
    model: "claude-3-opus",
    priority: 9,
    status: "idle"
  },
  {
    id: "domain-2",
    name: "Technical Writer",
    specialization: "technical documentation",
    capabilities: ["technical_writing", "documentation_generation", "knowledge_transfer"],
    model: "claude-3-sonnet",
    priority: 7,
    status: "idle"
  },

  // Quality Assurance Agents
  {
    id: "qa-1",
    name: "Quality Auditor",
    specialization: "quality assurance",
    capabilities: ["consistency_checking", "accuracy_verification", "completeness_assessment"],
    model: "claude-3-opus",
    priority: 9,
    status: "idle"
  },
  {
    id: "qa-2",
    name: "Integration Specialist",
    specialization: "synthesis coordination",
    capabilities: ["result_integration", "consensus_building", "final_review"],
    model: "claude-3-sonnet",
    priority: 10,
    status: "idle"
  },

  // Innovation Agents
  {
    id: "innovate-1",
    name: "Innovation Catalyst",
    specialization: "creative solutions",
    capabilities: ["ideation", "alternative_approaches", "breakthrough_thinking"],
    model: "claude-3-opus",
    priority: 8,
    status: "idle"
  },

  // Validation Agents
  {
    id: "validate-1",
    name: "Validation Expert",
    specialization: "solution validation",
    capabilities: ["solution_testing", "scenario_analysis", "edge_case_coverage"],
    model: "claude-3-sonnet",
    priority: 8,
    status: "idle"
  }
];

// State
let dispatcherQueue: DispatcherTask[] = [];
let activeTasks = new Map<string, DispatcherTask>();
let agentPool: AgentProfile[] = [...AGENT_PROFILES];

// Ensure agent work directory exists
Bun.mkdir(AGENT_WORK_DIR, { recursive: true });

// Load queue from disk
async function loadQueue() {
  try {
    const data = await Bun.readableStreamToText(Bun.file(DISPATCHER_QUEUE_PATH).stream());
    dispatcherQueue = JSON.parse(data) || [];
  } catch {
    dispatcherQueue = [];
  }
}

// Save queue to disk
async function saveQueue() {
  await Bun.write(DISPATCHER_QUEUE_PATH, JSON.stringify(dispatcherQueue, null, 2));
}

// Select optimal agents for a task based on prompt analysis
function selectOptimalAgents(prompt: string): AgentProfile[] {
  const promptLower = prompt.toLowerCase();

  // Dynamic agent selection based on prompt content
  const selectedAgents: AgentProfile[] = [];
  const requiredTypes = new Set<string>();

  // Analyze prompt to determine needed expertise
  if (promptLower.includes("research") || promptLower.includes("analyze") || promptLower.includes("study")) {
    requiredTypes.add("research");
    requiredTypes.add("analysis");
  }

  if (promptLower.includes("write") || promptLower.includes("create") || promptLower.includes("content")) {
    requiredTypes.add("creative");
  }

  if (promptLower.includes("tech") || promptLower.includes("system") || promptLower.includes("code")) {
    requiredTypes.add("technical");
  }

  if (promptLower.includes("business") || promptLower.includes("strategy") || promptLower.includes("market")) {
    requiredTypes.add("business");
  }

  if (promptLower.includes("problem") || promptLower.includes("solve") || promptLower.includes("issue")) {
    requiredTypes.add("problem");
  }

  // Select agents with highest priority and relevant capabilities
  const sortedAgents = [...agentPool]
    .filter(agent => requiredTypes.size === 0 || agent.capabilities.some(cap =>
      requiredTypes.has(cap.toLowerCase()) ||
      promptLower.includes(cap.toLowerCase())
    ))
    .sort((a, b) => b.priority - a.priority);

  // Select MIN_AGENTS to MAX_AGENTS agents based on task complexity
  const complexity = Math.min(MAX_AGENTS, Math.max(MIN_AGENTS,
    Math.floor(prompt.length / 100) + requiredTypes.size * 2
  ));

  return sortedAgents.slice(0, complexity);
}

// Create coordination matrix for parallel agents
function createCoordinationMatrix(agents: AgentProfile[]): Record<string, string[]> {
  const matrix: Record<string, string[]> = {};

  // All agents work in parallel initially
  agents.forEach(agent => {
    matrix[agent.id] = agents.filter(a => a.id !== agent.id).map(a => a.id);
  });

  // Add specific coordination rules based on agent types
  const techAgents = agents.filter(a => a.id.startsWith("tech-"));
  const qaAgents = agents.filter(a => a.id.startsWith("qa-"));

  // QA agents wait for technical agents
  qaAgents.forEach(qa => {
    if (techAgents.length > 0) {
      matrix[qa.id] = techAgents.map(t => t.id);
    }
  });

  return matrix;
}

// Spawn a specialized agent with specific task
async function spawnAgent(task: DispatcherTask, agent: AgentProfile): Promise<void> {
  const agentTask = {
    agentId: agent.id,
    taskId: task.id,
    prompt: task.prompt,
    specialization: agent.specialization,
    capabilities: agent.capabilities,
    timestamp: Date.now()
  };

  // Create specialized agent script
  const agentScript = `
#!/usr/bin/env bun
// Specialized Agent: ${agent.name}
// Task ID: ${task.id}
// Specialization: ${agent.specialization}

import { tracer } from "../observability/tracer.js";

const task = ${JSON.stringify(agentTask)};

console.log("🤖 ${agent.name} starting task...");

const span = tracer.span.agent("${agent.id}", {
  "agent.name": "${agent.name}",
  "agent.specialization": "${agent.specialization}",
  "task.id": "${task.id}",
  "task.prompt.length": task.prompt.length
});

try {
  // Agent-specific processing based on specialization
  const result = await processSpecializedTask(task);

  span.setAttribute("agent.result.success", true);
  span.setAttribute("agent.result.length", result?.length || 0);

  // Send result back to dispatcher
  const response = await fetch("http://localhost:8990/agent-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: "${agent.id}",
      taskId: "${task.id}",
      result: result,
      timestamp: Date.now()
    })
  });

  if (!response.ok) {
    throw new Error("Failed to send result to dispatcher");
  }

  console.log("✅ ${agent.name} completed task successfully");
  tracer.span.success(span);
} catch (error) {
  console.error("❌ ${agent.name} failed:", error);
  span.setAttribute("agent.result.success", false);
  span.setAttribute("agent.error", error.message);
  tracer.span.error(span, error);

  // Send error back to dispatcher
  await fetch("http://localhost:8990/agent-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: "${agent.id}",
      taskId: "${task.id}",
      error: error.message,
      timestamp: Date.now()
    })
  });
} finally {
  span.end();
}

async function processSpecializedTask(task) {
  // Specialized processing based on agent type
  const prompt = \`\`\`
  [SPECIALIZED_AGENT:${task.specialization}]
  Task: \${task.prompt}

  Your capabilities: \${JSON.stringify(task.capabilities)}

  Please provide your specialized analysis focusing on your specific expertise.
  Focus on depth in your domain and complement other agents' work.
  \`\`\`

  // Call PAI with specialized prompt
  const claudePath = "/home/fr3k/.nvm/versions/node/v24.13.0/bin/claude";
  const args = ["-p", "--output-format", "json"];

  const shellScript = \`
    echo \${JSON.stringify(prompt)} | \${claudePath} \${args.join(' ')}
  \`;

  const proc = Bun.spawn({
    cmd: ["/bin/bash", "-c", shellScript],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PATH: \`\${process.env.PATH}:/home/fr3k/.nvm/versions/node/v24.13.0/bin\`,
      AGENT_ID: "${agent.id}",
      TASK_ID: "${task.id}"
    }
  });

  const output = await new Response(proc.stdout).text();
  const result = JSON.parse(output);

  return result.result || "No result from specialized agent";
}
`;

  // Write agent script to work directory
  const agentPath = `${AGENT_WORK_DIR}/agent-${agent.id}-${task.id}.ts`;
  await Bun.write(agentPath, agentScript);

  // Make the agent script executable
  await new Promise(resolve => {
    Bun.$`chmod +x ${agentPath}`.then(() => resolve(undefined));
  });

  // Spawn agent in background
  const agentProc = spawn({
    cmd: ["bun", agentPath],
    stdout: "inherit",
    stderr: "inherit",
    cwd: AGENT_WORK_DIR
  });

  // Don't wait for completion - agent reports back via HTTP
  console.log(`🚀 Spawned ${agent.name} for task ${task.id}`);
}

// Dispatch a task to multiple agents
async function dispatchTask(task: DispatcherTask): Promise<void> {
  task.status = "dispatching";
  const selectedAgents = selectOptimalAgents(task.prompt);

  task.agents = selectedAgents;
  task.coordinationMatrix = createCoordinationMatrix(selectedAgents);
  task.results = {};
  task.completedAgents = [];
  task.failedAgents = [];

  console.log(`🎯 Dispatching task ${task.id} to ${selectedAgents.length} agents`);

  // Spawn all agents in parallel
  const spawnPromises = selectedAgents.map(agent =>
    spawnAgent(task, agent).catch(error => {
      console.error(`❌ Failed to spawn ${agent.name}:`, error);
      task.failedAgents.push(agent.id);
    })
  );

  await Promise.all(spawnPromises);

  task.status = "coordinating";
  console.log(`✅ All agents spawned for task ${task.id}`);

  // Start coordination process
  coordinateTask(task);
}

// Coordinate agent work and collect results
async function coordinateTask(task: DispatcherTask): Promise<void> {
  const coordinationInterval = setInterval(async () => {
    try {
      // Check for results from all agents
      const completed = await fetchAgentResults(task.id);

      if (completed.length === task.agents.length) {
        clearInterval(coordinationInterval);
        task.status = "merging";
        await mergeResults(task);
        return;
      }

      // Update task status
      const progress = (task.completedAgents.length / task.agents.length) * 100;
      console.log(`📊 Task ${task.id} progress: ${Math.round(progress)}%`);

    } catch (error) {
      console.error(`❌ Coordination error for task ${task.id}:`, error);
    }
  }, 1000); // Check every second
}

// Simulated agent result collection (in real implementation, this would be via HTTP)
async function fetchAgentResults(taskId: string): Promise<string[]> {
  // This would normally fetch from agent result endpoint
  // For now, simulate based on completed agents count
  const task = activeTasks.get(taskId);
  if (!task) return [];

  return task.completedAgents;
}

// Merge results from all agents
async function mergeResults(task: DispatcherTask): Promise<void> {
  console.log(`🔄 Merging results for task ${task.id}`);

  // Initialize result merger
  const mergerPrompt = `
[RESULT_MERGER]
Task: ${task.prompt}

Specialized Agent Results:
${Object.entries(task.results).map(([agentId, result]) => `
${agentId}: ${result}
`).join('\n')}

Please synthesize these specialized results into a comprehensive, coherent response.
Identify key insights, cross-validate findings, and provide an integrated analysis.
Maintain each specialist's expertise while creating a unified perspective.
`;

  // Call merger agent to synthesize results
  const claudePath = "/home/fr3k/.nvm/versions/node/v24.13.0/bin/claude";
  const args = ["-p", "--output-format", "json"];

  const shellScript = `
    echo ${JSON.stringify(mergerPrompt)} | ${claudePath} ${args.join(' ')}
  `;

  const proc = Bun.spawn({
    cmd: ["/bin/bash", "-c", shellScript],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PATH: `${process.env.PATH}:/home/fr3k/.nvm/versions/node/v24.13.0/bin`,
      MERGE_TASK: "true"
    }
  });

  const output = await new Response(proc.stdout).text();
  const mergeResult = JSON.parse(output);

  // Store final merged result
  task.results["merged"] = mergeResult.result;

  task.status = "completed";
  console.log(`✅ Task ${task.id} completed successfully`);

  // Send final result via Telegram
  await sendTelegramResponse(task.userId, task.chatId, mergeResult.result);

  // Remove from active tasks
  activeTasks.delete(task.id);
}

// Send response via Telegram
async function sendTelegramResponse(userId: string, chatId: string, response: string): Promise<void> {
  const bot = new Bot(BOT_TOKEN);

  // Format response with agent attribution
  const formattedResponse = `
🤖 PAI DISPATCHER RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━

✨ **Specialized Agents Analysis**

Your request has been processed by ${activeTasks.get(userId)?.agents.length || 0} specialized agents working in parallel.

📊 **Consolidated Results:**
${response}

🎯 **This represents the collective intelligence of multiple specialized agents working together to provide comprehensive analysis and solutions.**

━━━━━━━━━━━━━━━━━━━━━━━━
*Powered by Parallel Agent Dispatch System*
`;

  try {
    await bot.api.sendMessage(parseInt(chatId), formattedResponse);
    console.log(`✅ Response sent to user ${userId}`);
  } catch (error) {
    console.error("❌ Failed to send response:", error);
  }
}

// Handle incoming task from communication agent
export async function handleDispatcherTask(task: {
  id: string;
  userId: string;
  chatId: string;
  prompt: string;
  timestamp: number;
  traceContext?: any;
}): Promise<void> {
  const dispatcherTask: DispatcherTask = {
    id: task.id,
    userId: task.userId,
    chatId: task.chatId,
    prompt: task.prompt,
    timestamp: task.timestamp,
    agents: [],
    results: {},
    completedAgents: [],
    failedAgents: [],
    coordinationMatrix: {},
    priority: "normal",
    status: "queued",
    traceContext: task.traceContext
  };

  // Add to dispatch queue
  dispatcherQueue.push(dispatcherTask);
  await saveQueue();

  // Process immediately
  await processDispatcherQueue();
}

// Process dispatcher queue
async function processDispatcherQueue(): Promise<void> {
  // Get next queued task
  const task = dispatcherQueue.shift();
  if (!task) return;

  await saveQueue();

  // Check if already processing (shouldn't happen with proper coordination)
  if (activeTasks.has(task.id)) {
    console.warn(`⚠️ Task ${task.id} already being processed`);
    return;
  }

  // Add to active tasks
  activeTasks.set(task.id, task);

  console.log(`🎯 Dispatcher processing task: ${task.prompt.substring(0, 50)}...`);

  // Dispatch to agents
  await dispatchTask(task);
}

// HTTP API for agent results
Bun.serve({
  port: 8990,
  fetch: async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/agent-result") {
      try {
        const body = await req.json();
        const { agentId, taskId, result, error } = body;

        const task = activeTasks.get(taskId);
        if (task) {
          if (error) {
            task.failedAgents.push(agentId);
            console.error(`❌ Agent ${agentId} failed: ${error}`);
          } else {
            task.completedAgents.push(agentId);
            task.results[agentId] = result;
            console.log(`✅ Agent ${agentId} completed task`);
          }
        }

        return Response.json({ success: true });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
      }
    }

    if (url.pathname === "/status") {
      return Response.json({
        queueSize: dispatcherQueue.length,
        activeTasks: activeTasks.size,
        totalAgents: agentPool.length,
        idleAgents: agentPool.filter(a => a.status === "idle").length
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
});

// Bot for dispatcher commands
const bot = new Bot(BOT_TOKEN);

bot.command("dispatch-status", async (ctx) => {
  const queueSize = dispatcherQueue.length;
  const activeCount = activeTasks.size;
  const totalAgents = agentPool.length;
  const idleAgents = agentPool.filter(a => a.status === "idle").length;

  await ctx.reply(`
🎯 PAI Dispatcher Status
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Status: Active & Parallel Processing
📋 Queued Tasks: ${queueSize}
🔄 Active Tasks: ${activeCount}
🤖 Total Agents: ${totalAgents}
✨ Idle Agents: ${idleAgents}
⚡ Max Concurrent: ${MAX_AGENTS}
🎯 Min Concurrent: ${MIN_AGENTS}

🚀 Massive parallelization active!
✨ Leveraging ${MIN_AGENTS}-${MAX_AGENTS} specialized agents per task
    `.trim());
});

bot.command("clear-queue", async (ctx) => {
  const cleared = dispatcherQueue.length;
  dispatcherQueue = [];
  await saveQueue();
  await ctx.reply(`🗑️ Dispatcher queue cleared! Removed ${cleared} tasks.`);
});

// Export functions for other agents
export { dispatcherQueue, activeTasks, agentPool };
export async function getDispatcherStats() {
  return {
    queueSize: dispatcherQueue.length,
    activeTasks: activeTasks.size,
    totalAgents: agentPool.length,
    idleAgents: agentPool.filter(a => a.status === "idle").length,
    maxCapacity: MAX_AGENTS
  };
}

// Start dispatcher
console.log("🎯 PAI Dispatcher Agent Starting...");
await loadQueue();
console.log(`✅ Dispatcher ready! Coordinating ${MIN_AGENTS}-${MAX_AGENTS} parallel agents`);
console.log(`📡 HTTP API: http://localhost:8990/agent-result`);
console.log(`📊 Status API: http://localhost:8990/status`);

// Start monitoring loop
console.log("🔄 Starting dispatcher monitoring loop...");
setInterval(async () => {
  if (dispatcherQueue.length > 0) {
    await processDispatcherQueue();
  }
}, 1000); // Check every second for new tasks

console.log("✅ Dispatcher fully operational! Parallel agent system active.");
console.log(`🚀 Ready to spawn ${MIN_AGENTS}-${MAX_AGENTS} specialized agents per task`);

// Keep process alive
const shutdown = () => {
  console.log("\n🛑 Dispatcher Agent shutting down...");
  bot.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);