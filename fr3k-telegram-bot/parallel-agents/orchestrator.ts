import { tracer } from "../observability/tracer.js";
import { Task, Microtask, TaskResult, AgentPool } from "./types.js";
import { TaskDecomposer } from "./decomposer.js";
import { AgentPoolManager } from "./agent-pool-manager.js";
import { ResultOrchestrator } from "./result-orchestrator.js";
import { LoadBalancer } from "./load-balancer.js";

export class ParallelOrchestrator {
  private decomposer: TaskDecomposer;
  private agentPool: AgentPoolManager;
  private resultOrchestrator: ResultOrchestrator;
  private loadBalancer: LoadBalancer;
  private maxConcurrency: number;
  private timeoutMs: number;

  constructor(config: {
    maxConcurrency?: number;
    timeoutMs?: number;
    agentPools?: AgentPool[];
  } = {}) {
    this.decomposer = new TaskDecomposer();
    this.agentPool = new AgentPoolManager(config.agentPools);
    this.resultOrchestrator = new ResultOrchestrator();
    this.loadBalancer = new LoadBalancer();
    this.maxConcurrency = config.maxConcurrency || 50;
    this.timeoutMs = config.timeoutMs || 300000; // 5 minutes
  }

  async execute(task: Task): Promise<TaskResult> {
    const orchestrationSpan = tracer.startSpan("parallel.orchestration", {
      attributes: {
        "task.id": task.id,
        "task.type": task.type,
        "task.complexity": task.complexity,
        "max.concurrency": this.maxConcurrency,
        "timeout.ms": this.timeoutMs
      }
    });

    try {
      // Step 1: Decompose task into microtasks
      const microtasks = await this.decomposer.decompose(task);
      orchestrationSpan.setAttribute("microtasks.count", microtasks.length);

      // Step 2: Distribute microtasks to agent pools
      const agentAssignments = this.loadBalancer.assign(microtasks, this.agentPool);
      orchestrationSpan.setAttribute("agents.assigned", agentAssignments.length);

      // Step 3: Execute microtasks in parallel
      const results = await this.executeMicrotasks(agentAssignments, orchestrationSpan);

      // Step 4: Merge results
      const finalResult = await this.resultOrchestrator.merge(results);

      orchestrationSpan.setAttribute("result.size", finalResult.content?.length || 0);
      orchestrationSpan.setAttribute("result.success", finalResult.success);

      tracer.span.success(orchestrationSpan);
      return finalResult;

    } catch (error) {
      tracer.span.error(orchestrationSpan, error as Error);
      orchestrationSpan.end();
      throw error;
    } finally {
      orchestrationSpan.end();
    }
  }

  private async executeMicrotasks(
    assignments: Array<{ microtask: Microtask; agentId: string }>,
    parentSpan: any
  ): Promise<TaskResult[]> {
    const executionSpan = tracer.startSpan("parallel.execution", {
      parent: parentSpan,
      attributes: {
        "microtasks.count": assignments.length,
        "concurrency.limit": this.maxConcurrency
      }
    });

    const results: TaskResult[] = [];
    const chunks = this.chunkArray(assignments, this.maxConcurrency);

    for (const chunk of chunks) {
      const chunkSpan = tracer.startSpan("parallel.execution.chunk", {
        parent: executionSpan,
        attributes: {
          "chunk.size": chunk.length,
          "chunk.index": chunks.indexOf(chunk) + 1
        }
      });

      const chunkResults = await Promise.allSettled(
        chunk.map(async ({ microtask, agentId }) => {
          const agentSpan = tracer.startSpan("parallel.agent.execution", {
            parent: chunkSpan,
            attributes: {
              "microtask.id": microtask.id,
              "agent.id": agentId,
              "microtask.type": microtask.type,
              "microtask.priority": microtask.priority
            }
          });

          try {
            const result = await this.agentPool.execute(agentId, microtask);

            agentSpan.setAttribute("agent.result.success", result.success);
            agentSpan.setAttribute("agent.result.size", result.content?.length || 0);

            if (result.success) {
              tracer.span.success(agentSpan);
            } else {
              tracer.span.error(agentSpan, new Error(result.error));
            }

            agentSpan.end();
            return result;
          } catch (error) {
            tracer.span.error(agentSpan, error as Error);
            agentSpan.end();
            throw error;
          }
        })
      );

      // Process settled results
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Microtask failed: ${result.reason}`);
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            content: null,
            metadata: {
              microtaskFailed: true,
              error: result.reason
            }
          });
        }
      }

      chunkSpan.end();
    }

    executionSpan.setAttribute("results.count", results.length);
    executionSpan.setAttribute("results.success", results.filter(r => r.success).length);
    executionSpan.setAttribute("results.failed", results.filter(r => !r.success).length);

    tracer.span.success(executionSpan);
    executionSpan.end();

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getStatus(): Promise<{
    activeAgents: number;
    queuedMicrotasks: number;
    totalProcessed: number;
    successRate: number;
    agentUtilization: Record<string, number>;
  }> {
    return {
      activeAgents: this.agentPool.getActiveAgentCount(),
      queuedMicrotasks: this.agentPool.getQueuedMicrotasks(),
      totalProcessed: await this.agentPool.getTotalProcessed(),
      successRate: await this.agentPool.getSuccessRate(),
      agentUtilization: this.agentPool.getAgentUtilization()
    };
  }
}