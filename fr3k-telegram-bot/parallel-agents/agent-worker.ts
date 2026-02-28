import { tracer } from "../observability/tracer.js";
import { Microtask, TaskResult } from "./types.js";

export interface AgentWorkerConfig {
  id: string;
  type: string;
  specializations: string[];
  maxConcurrency: number;
}

export class AgentWorker {
  private config: AgentWorkerConfig;
  private taskQueue: Array<{ microtask: Microtask; resolve: (result: TaskResult) => void; reject: (error: Error) => void }>;
  private activeTasks: Map<string, Promise<TaskResult>>;
  private isRunning: boolean;
  private stats: {
    tasksCompleted: number;
    tasksFailed: number;
    totalLatency: number;
    startTime: Date;
    lastActivity: Date;
  };

  constructor(config: AgentWorkerConfig) {
    this.config = config;
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.isRunning = false;
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalLatency: 0,
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  async execute(microtask: Microtask): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ microtask, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.activeTasks.size >= this.config.maxConcurrency) {
      return;
    }

    this.isRunning = true;

    while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.maxConcurrency) {
      const { microtask, resolve, reject } = this.taskQueue.shift()!;
      this.executeMicrotask(microtask, resolve, reject);
    }

    this.isRunning = false;
  }

  private async executeMicrotask(
    microtask: Microtask,
    resolve: (result: TaskResult) => void,
    reject: (error: Error) => void
  ): Promise<void> {
    const span = tracer.startSpan("agent.worker.execute", {
      attributes: {
        "worker.id": this.config.id,
        "worker.type": this.config.type,
        "microtask.id": microtask.id,
        "microtask.type": microtask.type
      }
    });

    const startTime = Date.now();
    this.activeTasks.set(microtask.id, new Promise(async (taskResolve, taskReject) => {
      try {
        const result = await this.performTask(microtask);
        this.updateStats(result, Date.now() - startTime);
        span.setAttribute("result.success", result.success);
        span.setAttribute("result.duration", Date.now() - startTime);
        resolve(result);
      } catch (error) {
        const failedResult: TaskResult = {
          success: false,
          error: (error as Error).message,
          content: null,
          metadata: { microtask: microtask.id, worker: this.config.id }
        };
        this.updateStats(failedResult, Date.now() - startTime);
        span.setAttribute("result.success", false);
        span.setAttribute("result.error", failedResult.error);
        reject(error);
      } finally {
        this.activeTasks.delete(microtask.id);
        span.end();
        this.processQueue();
      }
    }));

    this.stats.lastActivity = new Date();
  }

  private async performTask(microtask: Microtask): Promise<TaskResult> {
    // Simulate different task types based on agent type
    const baseDelay = Math.random() * 1000 + 500; // 0.5-1.5s base delay

    switch (this.config.type) {
      case 'research':
        await this.delay(baseDelay * 2); // Research takes longer
        return {
          success: true,
          content: {
            research: `Research findings for ${microtask.type}`,
            data: `Data from ${microtask.id}`,
            confidence: 0.8 + Math.random() * 0.2
          },
          metadata: {
            agent: this.config.id,
            microtask: microtask.id,
            duration: baseDelay * 2
          }
        };

      case 'analysis':
        await this.delay(baseDelay * 1.5); // Analysis takes moderate time
        return {
          success: true,
          content: {
            analysis: `Analysis results for ${microtask.type}`,
            insights: `Key insights from ${microtask.id}`,
            confidence: 0.7 + Math.random() * 0.3
          },
          metadata: {
            agent: this.config.id,
            microtask: microtask.id,
            duration: baseDelay * 1.5
          }
        };

      case 'generation':
        await this.delay(baseDelay); // Generation is faster
        return {
          success: true,
          content: {
            generated: `Generated content for ${microtask.type}`,
            output: `Output from ${microtask.id}`,
            quality: 0.6 + Math.random() * 0.4
          },
          metadata: {
            agent: this.config.id,
            microtask: microtask.id,
            duration: baseDelay
          }
        };

      case 'validation':
        await this.delay(baseDelay * 0.8); // Validation is quickest
        return {
          success: true,
          content: {
            validation: `Validation results for ${microtask.type}`,
            passed: Math.random() > 0.2, // 80% success rate
            score: 0.5 + Math.random() * 0.5
          },
          metadata: {
            agent: this.config.id,
            microtask: microtask.id,
            duration: baseDelay * 0.8
          }
        };

      default:
        await this.delay(baseDelay);
        return {
          success: true,
          content: `Task completed by ${this.config.type} agent`,
          metadata: {
            agent: this.config.id,
            microtask: microtask.id,
            duration: baseDelay
          }
        };
    }
  }

  private updateStats(result: TaskResult, duration: number): void {
    if (result.success) {
      this.stats.tasksCompleted++;
    } else {
      this.stats.tasksFailed++;
    }
    this.stats.totalLatency += duration;
    this.stats.lastActivity = new Date();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getId(): string {
    return this.config.id;
  }

  getType(): string {
    return this.config.type;
  }

  getQueueSize(): number {
    return this.taskQueue.length;
  }

  isBusy(): boolean {
    return this.activeTasks.size > 0;
  }

  getStats(): {
    tasksCompleted: number;
    tasksFailed: number;
    totalLatency: number;
    avgLatency: number;
    uptime: number;
    utilization: number;
  } {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const avgLatency = this.stats.tasksCompleted > 0 ? this.stats.totalLatency / this.stats.tasksCompleted : 0;
    const utilization = uptime > 0 ? (this.stats.totalLatency / uptime) * 100 : 0;

    return {
      tasksCompleted: this.stats.tasksCompleted,
      tasksFailed: this.stats.tasksFailed,
      totalLatency: this.stats.totalLatency,
      avgLatency,
      uptime,
      utilization
    };
  }

  shutdown(): void {
    // Cancel all pending tasks
    for (const { microtask, reject } of this.taskQueue) {
      reject(new Error(`Worker ${this.config.id} shutting down`));
    }
    this.taskQueue = [];
    this.activeTasks.clear();
  }

  canHandle(microtask: Microtask): boolean {
    return this.config.specializations.some(spec =>
      microtask.type.includes(spec) ||
      microtask.agentType === this.config.type
    );
  }
}