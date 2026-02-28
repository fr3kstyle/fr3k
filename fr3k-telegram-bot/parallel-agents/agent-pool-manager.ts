import { tracer } from "../observability/tracer.js";
import { AgentPool, TaskResult, Microtask } from "./types.js";
import { AgentWorker } from "./agent-worker.js";

export class AgentPoolManager {
  private pools: Map<string, AgentPool>;
  private workers: Map<string, AgentWorker>;
  private metrics: Map<string, {
    totalProcessed: number;
    totalFailed: number;
    totalLatency: number;
    lastUpdated: Date;
  }>;

  constructor(initialPools: AgentPool[] = []) {
    this.pools = new Map();
    this.workers = new Map();
    this.metrics = new Map();

    // Initialize with default pools
    const defaultPools: AgentPool[] = [
      {
        id: 'research-pool',
        type: 'research',
        agents: [],
        minSize: 8,
        maxSize: 12,
        currentSize: 8,
        maxConcurrency: 4,
        agentType: 'research',
        specializations: ['information-gathering', 'research', 'data-collection'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'analysis-pool',
        type: 'analysis',
        agents: [],
        minSize: 10,
        maxSize: 15,
        currentSize: 10,
        maxConcurrency: 5,
        agentType: 'analysis',
        specializations: ['data-analysis', 'pattern-recognition', 'evaluation'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'generation-pool',
        type: 'generation',
        agents: [],
        minSize: 8,
        maxSize: 10,
        currentSize: 8,
        maxConcurrency: 3,
        agentType: 'generation',
        specializations: ['content-creation', 'synthesis', 'writing'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'validation-pool',
        type: 'validation',
        agents: [],
        minSize: 4,
        maxSize: 6,
        currentSize: 4,
        maxConcurrency: 2,
        agentType: 'validation',
        specializations: ['quality-check', 'verification', 'review'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add initial pools
    [...defaultPools, ...initialPools].forEach(pool => {
      this.addPool(pool);
    });
  }

  addPool(pool: AgentPool): void {
    this.pools.set(pool.id, pool);
    this.initializePoolWorkers(pool);
    this.metrics.set(pool.id, {
      totalProcessed: 0,
      totalFailed: 0,
      totalLatency: 0,
      lastUpdated: new Date()
    });
  }

  async execute(agentId: string, microtask: Microtask): Promise<TaskResult> {
    const worker = this.workers.get(agentId);
    if (!worker) {
      throw new Error(`Worker ${agentId} not found`);
    }

    const startTime = Date.now();
    const span = tracer.startSpan("agent.pool.execute", {
      attributes: {
        "agent.id": agentId,
        "microtask.id": microtask.id,
        "microtask.type": microtask.type
      }
    });

    try {
      const result = await worker.execute(microtask);

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateAgentMetrics(agentId, result, duration);

      span.setAttribute("result.success", result.success);
      span.setAttribute("result.duration", duration);

      if (result.success) {
        tracer.span.success(span);
      } else {
        tracer.span.error(span, new Error(result.error));
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateAgentMetrics(agentId, { success: false, error: (error as Error).message }, duration);

      tracer.span.error(span, error as Error);
      span.end();
      throw error;
    } finally {
      span.end();
    }
  }

  private initializePoolWorkers(pool: AgentPool): void {
    // Create workers for the pool
    for (let i = 0; i < pool.currentSize; i++) {
      const workerId = `${pool.id}-${i}`;
      const worker = new AgentWorker({
        id: workerId,
        type: pool.type,
        specializations: pool.specializations,
        maxConcurrency: pool.maxConcurrency
      });

      this.workers.set(workerId, worker);
    }
  }

  private updateAgentMetrics(agentId: string, result: TaskResult, duration: number): void {
    const poolId = this.getPoolIdForAgent(agentId);
    const poolMetrics = this.metrics.get(poolId);

    if (poolMetrics) {
      poolMetrics.lastUpdated = new Date();

      if (result.success) {
        poolMetrics.totalProcessed++;
        poolMetrics.totalLatency += duration;
      } else {
        poolMetrics.totalFailed++;
      }
    }
  }

  private getPoolIdForAgent(agentId: string): string {
    for (const [poolId, pool] of this.pools) {
      if (agentId.startsWith(pool.id)) {
        return poolId;
      }
    }
    return 'unknown';
  }

  getActiveAgentCount(): number {
    let total = 0;
    for (const pool of this.pools.values()) {
      total += pool.currentSize;
    }
    return total;
  }

  getQueuedMicrotasks(): number {
    let total = 0;
    for (const worker of this.workers.values()) {
      total += worker.getQueueSize();
    }
    return total;
  }

  async getTotalProcessed(): Promise<number> {
    let total = 0;
    for (const metrics of this.metrics.values()) {
      total += metrics.totalProcessed;
    }
    return total;
  }

  async getSuccessRate(): Promise<number> {
    let totalProcessed = 0;
    let totalSuccess = 0;

    for (const metrics of this.metrics.values()) {
      totalProcessed += metrics.totalProcessed;
      totalSuccess += metrics.totalProcessed - metrics.totalFailed;
    }

    return totalProcessed > 0 ? totalSuccess / totalProcessed : 0;
  }

  getAgentUtilization(): Record<string, number> {
    const utilization: Record<string, number> = {};

    for (const [poolId, pool] of this.pools) {
      const poolUtilization = this.calculatePoolUtilization(pool);
      utilization[poolId] = poolUtilization;
    }

    return utilization;
  }

  private calculatePoolUtilization(pool: AgentPool): number {
    let busyWorkers = 0;
    const poolWorkers = Array.from(this.workers.values()).filter(
      worker => worker.getId().startsWith(pool.id)
    );

    for (const worker of poolWorkers) {
      if (worker.isBusy()) {
        busyWorkers++;
      }
    }

    return poolWorkers.length > 0 ? (busyWorkers / poolWorkers.length) * 100 : 0;
  }

  scalePool(poolId: string, newSize: number): void {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool ${poolId} not found`);
    }

    pool.status = 'scaling';
    pool.updatedAt = new Date();

    if (newSize > pool.currentSize) {
      // Scale up - add workers
      const workersToAdd = newSize - pool.currentSize;
      for (let i = pool.currentSize; i < newSize; i++) {
        const workerId = `${pool.id}-${i}`;
        const worker = new AgentWorker({
          id: workerId,
          type: pool.type,
          specializations: pool.specializations,
          maxConcurrency: pool.maxConcurrency
        });
        this.workers.set(workerId, worker);
      }
    } else if (newSize < pool.currentSize) {
      // Scale down - remove workers
      const workersToRemove = pool.currentSize - newSize;
      for (let i = pool.currentSize - 1; i >= newSize; i--) {
        const workerId = `${pool.id}-${i}`;
        const worker = this.workers.get(workerId);
        if (worker) {
          worker.shutdown();
          this.workers.delete(workerId);
        }
      }
    }

    pool.currentSize = newSize;
    pool.status = 'active';
    pool.updatedAt = new Date();
  }

  getPoolStats(): Array<{
    id: string;
    type: string;
    activeAgents: number;
    utilization: number;
    processedTasks: number;
    failedTasks: number;
    avgResponseTime: number;
  }> {
    return Array.from(this.pools.values()).map(pool => {
      const metrics = this.metrics.get(pool.id);
      return {
        id: pool.id,
        type: pool.type,
        activeAgents: pool.currentSize,
        utilization: this.calculatePoolUtilization(pool),
        processedTasks: metrics?.totalProcessed || 0,
        failedTasks: metrics?.totalFailed || 0,
        avgResponseTime: metrics?.totalProcessed > 0
          ? metrics.totalLatency / metrics.totalProcessed
          : 0
      };
    });
  }
}