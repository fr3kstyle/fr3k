#!/usr/bin/env bun
/**
 * PAI Metrics Server - Aggregates and broadcasts system metrics
 * Port: 3000
 * Dashboard: http://localhost:3000/dashboard
 *
 * Phase 4: Dashboard with workflow observability
 */

import { serve } from "bun";
import { getWorkflowStore, WorkflowExecution } from "./observability/workflow-store.js";
import { getMessageLineage } from "./observability/message-lineage.js";
import { getInstanceTracker } from "./observability/instance-tracker.js";

// Configuration
const PORT = 3000;
const UPDATE_INTERVALS = {
  fast: 1000,    // agents, system
  medium: 2000,  // tasks, telegram, voice
  slow: 5000,    // mcp, sessions
};

// SSE Clients
const clients = new Set<ReadableStreamDefaultController>();

// ============================================================================
// DATA COLLECTORS
// ============================================================================

async function getCpuUsage(): Promise<string> {
  const load = await Bun.file("/proc/loadavg").text();
  return load.split(" ")[0] + " " + load.split(" ")[1] + " " + load.split(" ")[2];
}

async function getMemoryUsage(): Promise<string> {
  const meminfo = await Bun.file("/proc/meminfo").text();
  const lines = meminfo.split("\n");
  const total = parseInt(lines[0].split(/\s+/)[1]);
  const available = parseInt(lines[2].split(/\s+/)[1]);
  const used = total - available;
  const usedGB = (used / 1024 / 1024).toFixed(1);
  const totalGB = (total / 1024 / 1024).toFixed(1);
  return `${usedGB}G / ${totalGB}G`;
}

async function getUptime(): Promise<string> {
  const uptime = await Bun.file("/proc/uptime").text();
  const seconds = parseFloat(uptime.split(" ")[0]);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

async function collectSystemMetrics() {
  return {
    cpu: await getCpuUsage(),
    memory: await getMemoryUsage(),
    disk: "45%", // Placeholder
    uptime: await getUptime(),
    timestamp: Date.now()
  };
}

async function isProcessRunning(pid: string): Promise<boolean> {
  if (!pid || pid === "") return false;
  try {
    const proc = Bun.spawnSync({
      cmd: ["ps", "-p", pid],
      stdout: "pipe"
    });
    return proc.success;
  } catch {
    return false;
  }
}

async function collectAgentStatus() {
  const agents = [
    { name: 'communication-agent', pidFile: '/tmp/pai-communication-agent.pid' },
    { name: 'voice-agent', pidFile: '/tmp/pai-voice-agent.pid' },
    { name: 'main-bot', pidFile: '/tmp/pai-main-bot.pid' }
  ];

  const results = [];
  for (const agent of agents) {
    try {
      const pid = await Bun.file(agent.pidFile).text();
      const running = await isProcessRunning(pid.trim());
      results.push({
        name: agent.name,
        pid: pid.trim(),
        running
      });
    } catch {
      results.push({ name: agent.name, pid: '', running: false });
    }
  }
  return results;
}

async function collectTelegramStatus() {
  try {
    const queueData = await Bun.file('/tmp/pai-message-queue.json').text();
    const queue = JSON.parse(queueData || '[]');
    return {
      queueSize: queue.length,
      oldestMessage: queue[0]?.timestamp || 0,
      timestamp: Date.now()
    };
  } catch {
    return { queueSize: 0, oldestMessage: 0, timestamp: Date.now() };
  }
}

async function collectVoiceStatus() {
  try {
    const voiceQueueData = await Bun.file('/tmp/pai-voice-queue.json').text();
    const voiceQueue = JSON.parse(voiceQueueData || '[]');
    return {
      queueSize: voiceQueue.length,
      timestamp: Date.now()
    };
  } catch {
    return { queueSize: 0, timestamp: Date.now() };
  }
}

async function collectSkillsStatus() {
  try {
    const skillsDir = "/home/fr3k/.claude/skills";
    const proc = Bun.spawnSync({
      cmd: ["ls", "-1", skillsDir],
      stdout: "pipe"
    });
    const skills = proc.stdout.toString().split("\n").filter(s => s);
    return {
      total: skills.length,
      loaded: skills.length,
      timestamp: Date.now()
    };
  } catch {
    return { total: 0, loaded: 0, timestamp: Date.now() };
  }
}

async function collectSessionsStatus() {
  try {
    const sessionsData = await Bun.file('/tmp/pai-telegram-sessions.json').text();
    const sessions = JSON.parse(sessionsData || '{}');
    return {
      active: Object.keys(sessions).length,
      sessions: Object.keys(sessions),
      timestamp: Date.now()
    };
  } catch {
    return { active: 0, sessions: [], timestamp: Date.now() };
  }
}

async function collectMemoryStatus() {
  try {
    const memoryFile = Bun.file('/tmp/memory-aware-suggestions.json');
    const exists = await memoryFile.exists();

    if (!exists) {
      return {
        total_items: 0,
        total_categories: 0,
        total_resources: 0,
        items_by_type: { profile: 0, event: 0, knowledge: 0, behavior: 0, skill: 0, tool: 0 },
        suggestions: { total: 0, avg_confidence: 0 },
        worker_active: true,
        timestamp: Date.now()
      };
    }

    const data = await memoryFile.json();
    return {
      ...data.memory_stats,
      suggestions: data.summary,
      worker_active: true,
      timestamp: Date.now()
    };
  } catch (e) {
    return {
      error: String(e),
      worker_active: false,
      timestamp: Date.now()
    };
  }
}

// ============================================================================
// SSE BROADCASTING
// ============================================================================

function broadcast(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach(client => {
    try {
      client.enqueue(new TextEncoder().encode(message));
    } catch (e) {
      clients.delete(client);
    }
  });
}

// ============================================================================
// UPDATE LOOPS
// ============================================================================

// Fast updates (1s)
setInterval(async () => {
  const system = await collectSystemMetrics();
  broadcast('system-update', system);
}, UPDATE_INTERVALS.fast);

setInterval(async () => {
  const agents = await collectAgentStatus();
  broadcast('agents-update', agents);
}, UPDATE_INTERVALS.fast);

// Medium updates (2s)
setInterval(async () => {
  const telegram = await collectTelegramStatus();
  broadcast('telegram-update', telegram);
}, UPDATE_INTERVALS.medium);

setInterval(async () => {
  const voice = await collectVoiceStatus();
  broadcast('voice-update', voice);
}, UPDATE_INTERVALS.medium);

// Slow updates (5s)
setInterval(async () => {
  const skills = await collectSkillsStatus();
  broadcast('skills-update', skills);
}, UPDATE_INTERVALS.slow);

setInterval(async () => {
  const sessions = await collectSessionsStatus();
  broadcast('sessions-update', sessions);
}, UPDATE_INTERVALS.slow);

// ============================================================================
// OBSERVABILITY: Workflow event polling for SSE broadcast
// ============================================================================

// Check for workflow events and broadcast via SSE
const WORKFLOW_EVENT_TYPES = [
  'workflow-started',
  'workflow-completed',
  'workflow-failed',
  'workflow-phase',
  'workflow-subagent',
  'workflow-tool',
];

setInterval(async () => {
  const store = getWorkflowStore();

  // Broadcast active workflows
  const active = store.getActiveExecutions();
  if (active.length > 0) {
    broadcast('workflows-update', active);
  }

  // Check for workflow events
  for (const eventType of WORKFLOW_EVENT_TYPES) {
    const eventPath = `/tmp/pai-workflow-event-${eventType}`;
    try {
      const eventFile = Bun.file(eventPath);
      const exists = await eventFile.exists();
      if (exists) {
        const eventData = await eventFile.json();
        broadcast(eventType, eventData);
        // Remove the event file after broadcasting
        await Bun.write(eventPath, '');
      }
    } catch {
      // Ignore errors
    }
  }

  // Check for lineage events
  const LINEAGE_EVENT_TYPES = ['message-added', 'message-updated'];
  for (const eventType of LINEAGE_EVENT_TYPES) {
    const eventPath = `/tmp/pai-lineage-event-${eventType}`;
    try {
      const eventFile = Bun.file(eventPath);
      const exists = await eventFile.exists();
      if (exists) {
        const eventData = await eventFile.json();
        broadcast(eventType, eventData);
        await Bun.write(eventPath, '');
      }
    } catch {
      // Ignore errors
    }
  }
}, 1000); // Check every second for real-time updates

// ============================================================================
// HTTP SERVER
// ============================================================================

serve({
  port: PORT,
  fetch: async (req) => {
    const url = new URL(req.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // SSE endpoint
    if (url.pathname === '/metrics/sse') {
      const stream = new ReadableStream({
        start(controller) {
          clients.add(controller);

          // Send initial connection message
          controller.enqueue(new TextEncoder().encode('event: connected\ndata: {"message":"connected"}\n\n'));

          // Keepalive ping every 15s
          const keepalive = setInterval(() => {
            try {
              controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
            } catch {
              clearInterval(keepalive);
            }
          }, 15000);

          req.signal.addEventListener('abort', () => {
            clearInterval(keepalive);
            clients.delete(controller);
            controller.close();
          });
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders
        }
      });
    }

    // Serve dashboard HTML
    if (url.pathname === '/' || url.pathname === '/dashboard') {
      try {
        const dashboardFile = Bun.file('/home/fr3k/pai-telegram-bot/dashboard.html');
        return new Response(dashboardFile, {
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders
          }
        });
      } catch (e) {
        return new Response('Dashboard not found. Create dashboard.html first.', { status: 404 });
      }
    }

    // REST API endpoints
    if (url.pathname === '/api/status') {
      const data = {
        system: await collectSystemMetrics(),
        agents: await collectAgentStatus(),
        telegram: await collectTelegramStatus(),
        voice: await collectVoiceStatus(),
        skills: await collectSkillsStatus(),
        sessions: await collectSessionsStatus(),
        timestamp: Date.now()
      };
      return Response.json(data, { headers: corsHeaders });
    }

    // Get memory statistics
    if (url.pathname === '/api/memory') {
      const memoryStats = await collectMemoryStatus();
      return Response.json(memoryStats, { headers: corsHeaders });
    }

    // ========================================================================
    // OBSERVABILITY: Workflow execution endpoints
    // ========================================================================

    // Get all workflows
    if (url.pathname === '/api/workflows') {
      const store = getWorkflowStore();
      const active = store.getActiveExecutions();
      const recent = store.getRecentExecutions(50);
      const stats = store.getStatistics();

      return Response.json({
        active,
        recent,
        statistics: stats,
        timestamp: Date.now()
      }, { headers: corsHeaders });
    }

    // Get specific workflow by trace ID
    if (url.pathname.startsWith('/api/workflows/')) {
      const traceId = url.pathname.split('/')[3];
      const store = getWorkflowStore();
      const execution = store.getExecution(traceId);

      if (!execution) {
        return Response.json({ error: 'Workflow not found' }, { status: 404, headers: corsHeaders });
      }

      return Response.json(execution, { headers: corsHeaders });
    }

    // Get conversation lineage for a user
    if (url.pathname.startsWith('/api/conversation/')) {
      const userId = url.pathname.split('/')[3];
      const lineage = getMessageLineage();
      const conversation = lineage.getConversation(userId);
      const lineageQuery = lineage.getLineage(userId);

      if (!conversation) {
        return Response.json({ error: 'Conversation not found' }, { status: 404, headers: corsHeaders });
      }

      return Response.json({
        conversation,
        lineage: lineageQuery,
        timestamp: Date.now()
      }, { headers: corsHeaders });
    }

    // Get recent messages across all users
    if (url.pathname === '/api/messages/recent') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const lineage = getMessageLineage();
      const messages = lineage.getRecentMessages(limit);

      return Response.json({
        messages,
        count: messages.length,
        timestamp: Date.now()
      }, { headers: corsHeaders });
    }

    // Get instance tracking information
    if (url.pathname === '/api/instances') {
      const tracker = getInstanceTracker();
      const instances = tracker.getActiveInstances();
      const myId = tracker.getMyInstanceId();
      const amLeader = tracker.amILeader();

      return Response.json({
        instances,
        myInstanceId: myId,
        amLeader,
        activeCount: instances.length,
        timestamp: Date.now()
      }, { headers: corsHeaders });
    }

    // Get observability statistics summary
    if (url.pathname === '/api/observability') {
      const store = getWorkflowStore();
      const lineage = getMessageLineage();
      const tracker = getInstanceTracker();

      return Response.json({
        workflows: store.getStatistics(),
        lineage: lineage.getStatistics(),
        instances: {
          activeCount: tracker.getActiveInstanceCount(),
          amLeader: tracker.amILeader(),
        },
        timestamp: Date.now()
      }, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'healthy', timestamp: Date.now() }, { headers: corsHeaders });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
});

console.log(`📊 PAI Metrics Server running on http://localhost:${PORT}`);
console.log(`📡 Dashboard: http://localhost:${PORT}/dashboard`);
console.log(`🔌 SSE Endpoint: http://localhost:${PORT}/metrics/sse`);
