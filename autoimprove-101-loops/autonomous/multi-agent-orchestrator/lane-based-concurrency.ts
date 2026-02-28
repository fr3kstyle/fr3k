#!/usr/bin/env bun
/**
 * Lane-Based Concurrency System (OpenClaw-style)
 *
 * Problem: Single-queue systems cause starvation
 * Solution: Independent lanes for different task priorities
 *
 * Lanes:
 * - main: User-initiated interactive tasks (highest priority)
 * - interactive: Agent-initiated tasks requiring attention
 * - background: Periodic/scheduled tasks
 * - subagent: Nested agent calls
 */

interface TaskLane {
  name: 'main' | 'interactive' | 'background' | 'subagent';
  queue: AgentTask[];
  active: boolean;
  priority: number;
}

interface AgentTask {
  id: string;
  type: string;
  lane: TaskLane['name'];
  execute: () => Promise<any>;
}

class LaneBasedConcurrency {
  private lanes: Map<string, TaskLane> = new Map();
  private activeTask: Map<string, AgentTask> = new Map();

  constructor() {
    // Initialize lanes
    this.lanes.set('main', { name: 'main', queue: [], active: false, priority: 1 });
    this.lanes.set('interactive', { name: 'interactive', queue: [], active: false, priority: 2 });
    this.lanes.set('background', { name: 'background', queue: [], active: false, priority: 3 });
    this.lanes.set('subagent', { name: 'subagent', queue: [], active: false, priority: 4 });
  }

  /**
   * SUBMIT - Add task to appropriate lane
   */
  async submit(task: AgentTask): Promise<void> {
    const lane = this.lanes.get(task.lane)!;
    lane.queue.push(task);
    console.log(`📥 Task queued: ${task.id} → lane [${task.lane}]`);

    // Process lane if not active
    if (!lane.active) {
      this.processLane(task.lane);
    }
  }

  /**
   * PROCESS LANE - Execute tasks from lane
   */
  private async processLane(laneName: string): Promise<void> {
    const lane = this.lanes.get(laneName)!;
    lane.active = true;

    while (lane.queue.length > 0) {
      const task = lane.queue.shift()!;
      this.activeTask.set(laneName, task);

      console.log(`🔄 Executing [${laneName}]: ${task.id}`);

      try {
        await task.execute();
        console.log(`✅ Completed [${laneName}]: ${task.id}`);
      } catch (error) {
        console.error(`❌ Failed [${laneName}]: ${task.id} - ${(error as Error).message}`);
      }

      this.activeTask.delete(laneName);
    }

    lane.active = false;
  }

  /**
   * GET STATUS - Current state
   */
  getStatus() {
    return {
      lanes: Array.from(this.lanes.entries()).map(([name, lane]) => ({
        name,
        queue_length: lane.queue.length,
        active: lane.active,
        active_task: this.activeTask.get(name)?.id || null
      })),
      total_queued: Array.from(this.lanes.values()).reduce((sum, lane) => sum + lane.queue.length, 0),
      active_lanes: Array.from(this.lanes.values()).filter(l => l.active).length
    };
  }
}

/**
 * Model Fallback Chain - Resiliency through multiple models
 */
class ModelFallbackChain {
  private models: Map<string, any> = new Map();
  private healthStatus: Map<string, boolean> = new Map();

  constructor() {
    // Register models in priority order
    this.registerModel('anthropic', { endpoint: 'https://api.anthropic.com', priority: 1 });
    this.registerModel('openai-codex', { endpoint: 'https://api.openai.com', priority: 2 });
    this.registerModel('google-antigravity', { endpoint: 'https://.googleapis.com', priority: 3 });
    this.registerModel('local', { endpoint: 'http://localhost:11434', priority: 4 });
  }

  /**
   * EXECUTE WITH FALLBACK - Try models in order
   */
  async executeWithFallback(
    prompt: string,
    options: any = {}
  ): Promise<{ model: string; result: any; attempts: number }> {
    const sortedModels = Array.from(this.models.values())
      .sort((a, b) => a.priority - b.priority);

    let attempts = 0;

    for (const model of sortedModels) {
      attempts++;

      if (!this.isHealthy(model.name)) {
        console.log(`⚠️ ${model.name} unhealthy, skipping...`);
        continue;
      }

      try {
        console.log(`🎯 Attempting ${model.name} (attempt ${attempts})...`);

        const result = await this.callModel(model.name, prompt, options);

        return {
          model: model.name,
          result,
          attempts
        };
      } catch (error) {
        console.log(`❌ ${model.name} failed: ${(error as Error).message}`);
        this.markUnhealthy(model.name);
      }
    }

    throw new Error('All models failed');
  }

  /**
   * CALL MODEL - Execute on specific model
   */
  private async callModel(modelName: string, prompt: string, options: any): Promise<any> {
    // In production, would make actual API call
    // Simulated for now
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      return {
        model: modelName,
        response: `[Simulated response from ${modelName}]`,
        timestamp: new Date().toISOString()
      };
    }

    throw new Error('Model unavailable');
  }

  /**
   * MODEL HEALTH MANAGEMENT
   */
  private registerModel(name: string, config: any): void {
    this.models.set(name, { name, ...config });
    this.healthStatus.set(name, true);
  }

  private isHealthy(modelName: string): boolean {
    return this.healthStatus.get(modelName) ?? false;
  }

  private markUnhealthy(modelName: string): void {
    this.healthStatus.set(modelName, false);

    // Schedule health check after 60 seconds
    setTimeout(() => {
      this.healthStatus.set(modelName, true);
      console.log(`💚 ${modelName} marked healthy again`);
    }, 60000);
  }

  getMetrics() {
    return {
      total_models: this.models.size,
      healthy_models: Array.from(this.healthStatus.values()).filter(h => h).length,
      models: Array.from(this.models.values()).map(m => m.name)
    };
  }
}

// Export
export { LaneBasedConcurrency, ModelFallbackChain, AgentTask, TaskLane };

// Test
if (import.meta.main) {
  const concurrency = new LaneBasedConcurrency();
  const fallback = new ModelFallbackChain();

  console.log('🧪 Testing Lane-Based Concurrency...\n');

  // Submit tasks to different lanes
  await concurrency.submit({
    id: 'user-query-1',
    type: 'chat',
    lane: 'main',
    execute: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return 'User query result';
    }
  });

  await concurrency.submit({
    id: 'scheduled-backup',
    type: 'backup',
    lane: 'background',
    execute: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return 'Backup complete';
    }
  });

  console.log('\nStatus:', concurrency.getStatus());

  console.log('\n🧪 Testing Model Fallback Chain...\n');
  const result = await fallback.executeWithFallback('Explain quantum entanglement');
  console.log('Result:', result);
  console.log('Metrics:', fallback.getMetrics());

  console.log('\n✅ Lane-based Concurrency & Model Fallback loaded');
}
