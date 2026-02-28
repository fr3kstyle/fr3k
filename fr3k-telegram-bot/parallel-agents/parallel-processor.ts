import { tracer } from "../observability/tracer.js";
import { Task, TaskResult } from "./types.js";
import { ParallelOrchestrator } from "./orchestrator.js";
import { TaskDecomposer } from "./decomposer.js";

export class ParallelProcessor {
  private orchestrator: ParallelOrchestrator;
  private decomposer: TaskDecomposer;

  constructor() {
    this.orchestrator = new ParallelOrchestrator();
    this.decomposer = new TaskDecomposer();
  }

  async processTask(task: Task): Promise<TaskResult> {
    const processingSpan = tracer.startSpan("parallel.processor", {
      attributes: {
        "task.id": task.id,
        "task.type": task.type,
        "task.complexity": task.complexity,
        "task.priority": task.priority
      }
    });

    try {
      // Check if task should use parallel processing
      const shouldUseParallel = this.shouldUseParallelProcessing(task);

      if (!shouldUseParallel) {
        processingSpan.setAttribute("processing.method", "sequential");
        tracer.span.success(processingSpan);
        return this.sequentialProcess(task);
      }

      processingSpan.setAttribute("processing.method", "parallel");
      processingSpan.setAttribute("parallel.microtasks", await this.estimateMicrotasks(task));

      // Process using parallel orchestrator
      const result = await this.orchestrator.execute(task);

      // Enhance result with parallel processing metadata
      result.metadata = {
        ...result.metadata,
        parallel: true,
        agentCount: result.metadata?.successfulCount || 0,
        confidence: result.metadata?.confidence || 0.8,
        mergeStrategy: result.metadata?.mergeStrategy || 'all-success'
      };

      processingSpan.setAttribute("result.success", result.success);
      processingSpan.setAttribute("result.size", result.content?.length || 0);
      processingSpan.setAttribute("parallel.agents.used", result.metadata?.agentCount || 0);

      tracer.span.success(processingSpan);
      return result;

    } catch (error) {
      tracer.span.error(processingSpan, error as Error);
      processingSpan.end();
      throw error;
    } finally {
      processingSpan.end();
    }
  }

  private shouldUseParallelProcessing(task: Task): boolean {
    // Simple heuristic to determine when to use parallel processing
    const factors = {
      complexity: task.complexity > 5,
      length: typeof task.content === 'string' ? task.content.length > 200 : true,
      type: this.isParallelizableType(task.type),
      priority: task.priority === 'high' || task.priority === 'critical'
    };

    // Use parallel processing if any factor is true
    return Object.values(factors).some(Boolean);
  }

  private isParallelizableType(taskType: string): boolean {
    const parallelizableTypes = [
      'research',
      'analysis',
      'generation',
      'security',
      'content',
      'documentation',
      'report'
    ];

    return parallelizableTypes.some(type => taskType.includes(type));
  }

  private async estimateMicrotasks(task: Task): Promise<number> {
    const config = this.decomposer['config'];
    const complexityFactor = task.complexity / 10;

    const baseCount = Math.floor(
      (complexityFactor * (config.maxMicrotasks - config.minMicrotasks)) + config.minMicrotasks
    );

    return Math.max(config.minMicrotasks, Math.min(config.maxMicrotasks, baseCount));
  }

  private sequentialProcess(task: Task): TaskResult {
    // Fallback to sequential processing for simple tasks
    return {
      success: true,
      content: `Sequential processing completed for ${task.type} task`,
      metadata: {
        method: 'sequential',
        complexity: task.complexity,
        timestamp: new Date().toISOString()
      }
    };
  }

  async getStatus(): Promise<{
    parallelTasks: number;
    sequentialTasks: number;
    totalAgents: number;
    avgLatency: number;
    successRate: number;
  }> {
    return {
      parallelTasks: 0, // Track in real implementation
      sequentialTasks: 0,
      totalAgents: this.orchestrator.getActiveAgentCount(),
      avgLatency: 0,
      successRate: 0
    };
  }
}