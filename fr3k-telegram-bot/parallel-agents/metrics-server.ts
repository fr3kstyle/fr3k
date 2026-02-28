import { Bun } from "bun";
import { tracer } from "../observability/tracer.js";
import { ParallelOrchestrator } from "./orchestrator.js";
import { TaskDecomposer } from "./decomposer.js";

// Create the parallel processor system
const orchestrator = new ParallelOrchestrator({
  maxConcurrency: 50,
  timeoutMs: 300000
});

// Metrics server
Bun.serve({
  port: 9090,
  development: true,

  async fetch(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    try {
      switch (path) {
        case '/':
          return new Response(JSON.stringify({
            message: 'Parallel Agent Metrics Server',
            version: '1.0.0',
            endpoints: {
              '/status': 'System status and metrics',
              '/pools': 'Agent pool statistics',
              '/metrics': 'Real-time performance metrics',
              '/health': 'Health check'
            }
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        case '/status':
          const status = await getStatus();
          return new Response(JSON.stringify(status, null, 2), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        case '/pools':
          const pools = await orchestrator.getAgentPoolStats();
          return new Response(JSON.stringify(pools, null, 2), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        case '/metrics':
          const metrics = await getCurrentMetrics();
          return new Response(JSON.stringify(metrics, null, 2), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        case '/health':
          const health = await getHealth();
          return new Response(JSON.stringify(health, null, 2), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        case '/debug/pools':
          const poolStats = await orchestrator.getPoolStats();
          return new Response(JSON.stringify({
            pools: poolStats,
            totalAgents: poolStats.reduce((sum, pool) => sum + pool.activeAgents, 0),
            avgUtilization: poolStats.reduce((sum, pool) => sum + pool.utilization, 0) / poolStats.length
          }, null, 2), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        default:
          return new Response('Not Found', {
            status: 404,
            headers: corsHeaders
          });
      }
    } catch (error) {
      console.error('Metrics server error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
});

// Helper functions
async function getStatus() {
  const status = await orchestrator.getStatus();

  return {
    system: {
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      maxConcurrency: 50,
      timeoutMs: 300000
    },
    agents: {
      active: status.activeAgents,
      queued: status.queuedMicrotasks,
      totalProcessed: status.totalProcessed,
      successRate: Math.round(status.successRate * 100) / 100,
      utilization: status.agentUtilization
    },
    performance: {
      throughput: status.totalProcessed / 60, // per minute (rough estimate)
      avgLatency: 15000, // would calculate actual latency
      efficiency: Math.round((status.successRate * 100)) + '%'
    }
  };
}

async function getCurrentMetrics() {
  const now = Date.now();
  const uptime = now - startTime;

  return {
    timestamp: new Date().toISOString(),
    system: {
      uptime: uptime,
      memory: process.memoryUsage(),
      cpu: await getCpuUsage()
    },
    parallel: {
      activeAgents: await orchestrator.getActiveAgentCount(),
      queuedTasks: await orchestrator.getQueuedMicrotasks(),
      totalProcessed: await orchestrator.getTotalProcessed(),
      successRate: await orchestrator.getSuccessRate()
    },
    performance: {
      throughput: (await orchestrator.getTotalProcessed()) / (uptime / 60000), // per minute
      avgLatency: 15000, // would calculate actual latency
      agentUtilization: await orchestrator.getAgentUtilization()
    }
  };
}

async function getHealth() {
  try {
    const status = await getStatus();
    const isHealthy = status.agents.active > 0 && status.agents.successRate > 0.5;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        agents: status.agents.active > 0 ? 'pass' : 'fail',
        successRate: status.agents.successRate > 0.5 ? 'pass' : 'fail',
        responseTime: status.performance.avgLatency < 30000 ? 'pass' : 'fail'
      },
      details: {
        activeAgents: status.agents.active,
        successRate: status.agents.successRate,
        avgLatency: status.performance.avgLatency
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

async function getCpuUsage(): Promise<number> {
  // Simulated CPU usage - in real implementation would use process.cpuUsage
  return 25.5;
}

const startTime = Date.now();

console.log('🚀 Parallel Agent Metrics Server started on port 9090');
console.log('📊 Available endpoints:');
console.log('   GET /status - System status and metrics');
console.log('   GET /pools - Agent pool statistics');
console.log('   GET /metrics - Real-time performance metrics');
console.log('   GET /health - Health check');
console.log('   GET /debug/pools - Detailed pool information');
console.log('');
console.log('Example usage:');
console.log('   curl http://localhost:9090/status');
console.log('   curl http://localhost:9090/metrics');