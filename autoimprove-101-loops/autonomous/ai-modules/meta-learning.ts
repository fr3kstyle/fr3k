/**
 * Meta-Learning Module
 * Implements learning-to-learn and transfer learning capabilities
 */

export interface Task {
  id: string;
  data: any[];
  labels: any[];
  metadata?: Record<string, any>;
}

export interface LearningStrategy {
  name: string;
  parameters: Record<string, any>;
  performance: number;
  adaptationRate: number;
}

export interface MetaKnowledge {
  taskFeatures: Map<string, number[]>;
  strategyPerformance: Map<string, number>;
  transferPatterns: Map<string, string>;
}

export class MetaLearning {
  private knowledge: MetaKnowledge;
  private strategies: LearningStrategy[] = [];
  private currentStrategy: LearningStrategy | null = null;
  private learningHistory: Array<{ taskId: string; strategy: string; performance: number }> = [];

  constructor() {
    this.knowledge = {
      taskFeatures: new Map(),
      strategyPerformance: new Map(),
      transferPatterns: new Map()
    };
    this.initializeStrategies();
  }

  /**
   * Initialize learning strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'gradient-descent',
        parameters: { learningRate: 0.01, momentum: 0.9 },
        performance: 0.5,
        adaptationRate: 0.1
      },
      {
        name: 'few-shot',
        parameters: { shots: 5, supportSize: 10 },
        performance: 0.5,
        adaptationRate: 0.3
      },
      {
        name: 'maml',
        parameters: { innerSteps: 5, metaRate: 0.001 },
        performance: 0.5,
        adaptationRate: 0.5
      },
      {
        name: 'transfer',
        parameters: { sourceTasks: [], weightDecay: 0.0001 },
        performance: 0.5,
        adaptationRate: 0.4
      }
    ];
  }

  /**
   * Learn a new task with meta-learning
   */
  learn(task: Task): {
    success: boolean;
    strategy: string;
    performance: number;
    adaptationTime: number;
  } {
    const startTime = Date.now();

    // Extract task features
    const features = this.extractTaskFeatures(task);
    this.knowledge.taskFeatures.set(task.id, features);

    // Select best strategy
    const strategy = this.selectStrategy(task.id, features);
    this.currentStrategy = strategy;

    // Simulate learning process
    const performance = this.simulateLearning(task, strategy);
    const adaptationTime = Date.now() - startTime;

    // Update knowledge
    this.updateMetaKnowledge(task.id, strategy.name, performance);

    // Record history
    this.learningHistory.push({
      taskId: task.id,
      strategy: strategy.name,
      performance
    });

    return {
      success: performance > 0.7,
      strategy: strategy.name,
      performance,
      adaptationTime
    };
  }

  /**
   * Extract features from task for meta-analysis
   */
  private extractTaskFeatures(task: Task): number[] {
    const dataDim = task.data[0]?.length || 0;
    const numSamples = task.data.length;
    const uniqueLabels = new Set(task.labels).size;
    const labelBalance = this.calculateBalance(task.labels);
    const complexity = this.estimateComplexity(task.data);

    return [dataDim, numSamples, uniqueLabels, labelBalance, complexity];
  }

  private calculateBalance(labels: any[]): number {
    const counts = new Map();
    labels.forEach(l => counts.set(l, (counts.get(l) || 0) + 1));
    const values = Array.from(counts.values());
    const max = Math.max(...values);
    const min = Math.min(...values);
    return min / max;
  }

  private estimateComplexity(data: any[]): number {
    // Simple variance-based complexity estimate
    if (data.length === 0) return 0;
    const dim = data[0].length;
    let totalVar = 0;

    for (let i = 0; i < dim; i++) {
      const values = data.map(d => d[i]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
      totalVar += variance;
    }

    return totalVar / dim;
  }

  /**
   * Select optimal strategy based on meta-knowledge
   */
  private selectStrategy(taskId: string, features: number[]): LearningStrategy {
    // Find similar tasks
    const similarTasks = this.findSimilarTasks(features);

    if (similarTasks.length > 0) {
      // Use transfer learning from similar tasks
      const bestStrategy = this.getBestStrategyForTasks(similarTasks);
      return this.strategies.find(s => s.name === bestStrategy) || this.strategies[0];
    }

    // Default: select strategy with highest adaptation rate
    return this.strategies.reduce((best, current) =>
      current.adaptationRate > best.adaptationRate ? current : best
    );
  }

  private findSimilarTasks(features: number[]): string[] {
    const similar: string[] = [];

    for (const [taskId, taskFeatures] of this.knowledge.taskFeatures) {
      const similarity = this.cosineSimilarity(features, taskFeatures);
      if (similarity > 0.8) {
        similar.push(taskId);
      }
    }

    return similar;
  }

  private getBestStrategyForTasks(taskIds: string[]): string {
    const performance = new Map<string, number[]>();

    for (const record of this.learningHistory) {
      if (taskIds.includes(record.taskId)) {
        if (!performance.has(record.strategy)) {
          performance.set(record.strategy, []);
        }
        performance.get(record.strategy)!.push(record.performance);
      }
    }

    let bestStrategy = '';
    let bestAvg = 0;

    for (const [strategy, scores] of performance) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestStrategy = strategy;
      }
    }

    return bestStrategy;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Simulate learning process
   */
  private simulateLearning(task: Task, strategy: LearningStrategy): number {
    // Simulated learning curve based on strategy and task complexity
    const basePerformance = Math.random() * 0.3 + 0.5;
    const strategyBonus = strategy.adaptationRate * 0.2;
    return Math.min(1, basePerformance + strategyBonus);
  }

  /**
   * Update meta-knowledge after learning
   */
  private updateMetaKnowledge(taskId: string, strategy: string, performance: number): void {
    const currentPerf = this.knowledge.strategyPerformance.get(strategy) || 0.5;
    const updatedPerf = currentPerf * 0.9 + performance * 0.1;
    this.knowledge.strategyPerformance.set(strategy, updatedPerf);

    // Update strategy performance
    const strat = this.strategies.find(s => s.name === strategy);
    if (strat) {
      strat.performance = updatedPerf;
    }
  }

  /**
   * Transfer knowledge to new task
   */
  transfer(targetTask: Task, sourceTaskId: string): {
    transferred: boolean;
    transferScore: number;
    recommendedStrategy: string;
  } {
    const sourceFeatures = this.knowledge.taskFeatures.get(sourceTaskId);
    if (!sourceFeatures) {
      return { transferred: false, transferScore: 0, recommendedStrategy: 'few-shot' };
    }

    const targetFeatures = this.extractTaskFeatures(targetTask);
    const similarity = this.cosineSimilarity(sourceFeatures, targetFeatures);

    const bestStrategy = this.getBestStrategyForTasks([sourceTaskId]);

    this.knowledge.transferPatterns.set(targetTask.id, sourceTaskId);

    return {
      transferred: similarity > 0.7,
      transferScore: similarity,
      recommendedStrategy: bestStrategy || 'transfer'
    };
  }

  /**
   * Get meta-learning statistics
   */
  getMetaStats(): {
    totalTasks: number;
    averagePerformance: number;
    bestStrategy: string;
    transferCount: number;
  } {
    const avgPerf = this.learningHistory.length > 0
      ? this.learningHistory.reduce((sum, r) => sum + r.performance, 0) / this.learningHistory.length
      : 0;

    const bestStrategy = this.strategies.reduce((best, s) =>
      s.performance > best.performance ? s : best
    );

    return {
      totalTasks: this.knowledge.taskFeatures.size,
      averagePerformance: avgPerf,
      bestStrategy: bestStrategy.name,
      transferCount: this.knowledge.transferPatterns.size
    };
  }
}
