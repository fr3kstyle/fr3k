import { tracer } from "../observability/tracer.js";
import { Task, Microtask, DecompositionConfig } from "./types.js";

export class TaskDecomposer {
  private config: DecompositionConfig;
  private domainTemplates: Map<string, DecompositionConfig>;

  constructor(config: Partial<DecompositionConfig> = {}) {
    this.config = {
      minMicrotasks: 20,
      maxMicrotasks: 50,
      agentTypes: ['research', 'analysis', 'generation', 'validation'],
      strategy: 'hybrid',
      maxDepth: 3,
      timeoutPerMicrotask: 30000,
      ...config
    };

    this.domainTemplates = new Map([
      ['research', {
        minMicrotasks: 15,
        maxMicrotasks: 30,
        agentTypes: ['research', 'analysis'],
        strategy: 'domain',
        maxDepth: 2,
        timeoutPerMicrotask: 25000
      }],
      ['analysis', {
        minMicrotasks: 25,
        maxMicrotasks: 45,
        agentTypes: ['analysis', 'validation'],
        strategy: 'complexity',
        maxDepth: 3,
        timeoutPerMicrotask: 35000
      }],
      ['generation', {
        minMicrotasks: 20,
        maxMicrotasks: 40,
        agentTypes: ['generation', 'validation'],
        strategy: 'domain',
        maxDepth: 2,
        timeoutPerMicrotask: 30000
      }],
      ['security', {
        minMicrotasks: 30,
        maxMicrotasks: 50,
        agentTypes: ['research', 'analysis', 'validation'],
        strategy: 'hybrid',
        maxDepth: 3,
        timeoutPerMicrotask: 40000
      }]
    ]);
  }

  async decompose(task: Task): Promise<Microtask[]> {
    const decompositionSpan = tracer.startSpan("task.decomposition", {
      attributes: {
        "task.id": task.id,
        "task.type": task.type,
        "task.complexity": task.complexity,
        "strategy": this.config.strategy
      }
    });

    try {
      let config = this.config;

      // Use domain-specific template if available
      const domainTemplate = this.getDomainTemplate(task.type);
      if (domainTemplate) {
        config = { ...this.config, ...domainTemplate };
        decompositionSpan.setAttribute("strategy.used", "domain");
      }

      // Adjust microtask count based on complexity
      const microtaskCount = this.calculateMicrotaskCount(task.complexity, config);
      decompositionSpan.setAttribute("microtask.count", microtaskCount);

      let microtasks: Microtask[];

      switch (config.strategy) {
        case 'domain':
          microtasks = await this.decomposeByDomain(task, config);
          break;
        case 'complexity':
          microtasks = await this.decomposeByComplexity(task, config);
          break;
        case 'manual':
          microtasks = await this.decomposeManually(task, config);
          break;
        case 'hybrid':
        default:
          microtasks = await this.decomposeHybrid(task, config);
          break;
      }

      // Add dependencies for microtasks that need sequential processing
      microtasks = this.addDependencies(microtasks);

      decompositionSpan.setAttribute("microtasks.generated", microtasks.length);
      tracer.span.success(decompositionSpan);

      return microtasks;
    } catch (error) {
      tracer.span.error(decompositionSpan, error as Error);
      decompositionSpan.end();
      throw error;
    } finally {
      decompositionSpan.end();
    }
  }

  private getDomainTemplate(taskType: string): DecompositionConfig | null {
    // Extract domain from task type (e.g., "security.research" -> "security")
    const domain = taskType.split('.')[0];
    return this.domainTemplates.get(domain) || null;
  }

  private calculateMicrotaskCount(complexity: number, config: DecompositionConfig): number {
    const baseCount = Math.floor((complexity / 10) * (config.maxMicrotasks - config.minMicrotasks)) + config.minMicrotasks;
    return Math.max(config.minMicrotasks, Math.min(config.maxMicrotasks, baseCount));
  }

  private async decomposeByDomain(task: Task, config: DecompositionConfig): Promise<Microtask[]> {
    const microtasks: Microtask[] = [];
    const taskSize = typeof task.content === 'string' ? task.content.length : JSON.stringify(task.content).length;

    // Domain-specific decomposition patterns
    const patterns = this.getDomainPatterns(task.type);

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const content = this.extractSubtask(task.content, pattern, i);

      microtasks.push({
        id: `${task.id}-${pattern.id}`,
        taskId: task.id,
        type: pattern.agentType,
        content: content,
        priority: task.priority,
        agentType: pattern.agentType,
        timeout: config.timeoutPerMicrotask,
        metadata: {
          pattern: pattern.name,
          domain: task.type,
          index: i
        }
      });
    }

    return microtasks;
  }

  private async decomposeByComplexity(task: Task, config: DecompositionConfig): Promise<Microtask[]> {
    const microtasks: Microtask[] = [];
    const complexityFactor = task.complexity / 10;

    // Create research subtasks
    const researchCount = Math.floor(5 + complexityFactor * 5);
    for (let i = 0; i < researchCount; i++) {
      microtasks.push({
        id: `${task.id}-research-${i}`,
        taskId: task.id,
        type: 'research',
        content: this.createResearchQuery(task.content, i),
        priority: task.priority,
        agentType: 'research',
        timeout: config.timeoutPerMicrotask,
        metadata: {
          complexity: task.complexity,
          domain: 'research'
        }
      });
    }

    // Create analysis subtasks
    const analysisCount = Math.floor(5 + complexityFactor * 5);
    for (let i = 0; i < analysisCount; i++) {
      microtasks.push({
        id: `${task.id}-analysis-${i}`,
        taskId: task.id,
        type: 'analysis',
        content: this.createAnalysisTask(task.content, i),
        priority: task.priority,
        agentType: 'analysis',
        timeout: config.timeoutPerMicrotask,
        metadata: {
          complexity: task.complexity,
          domain: 'analysis'
        }
      });
    }

    // Create validation subtasks
    const validationCount = Math.floor(2 + complexityFactor * 2);
    for (let i = 0; i < validationCount; i++) {
      microtasks.push({
        id: `${task.id}-validation-${i}`,
        taskId: task.id,
        type: 'validation',
        content: this.createValidationTask(task.content, i),
        priority: task.priority,
        agentType: 'validation',
        timeout: config.timeoutPerMicrotask,
        metadata: {
          complexity: task.complexity,
          domain: 'validation'
        }
      });
    }

    return microtasks;
  }

  private async decomposeManually(task: Task, config: DecompositionConfig): Promise<Microtask[]> {
    // Manual decomposition - use predefined structure
    const manualStructure = this.getManualStructure(task.type);
    const microtasks: Microtask[] = [];

    manualStructure.forEach((part, index) => {
      microtasks.push({
        id: `${task.id}-${part.type}-${index}`,
        taskId: task.id,
        type: part.type,
        content: part.content,
        priority: task.priority,
        agentType: part.agentType,
        timeout: config.timeoutPerMicrotask,
        metadata: {
          manual: true,
          index
        }
      });
    });

    return microtasks;
  }

  private async decomposeHybrid(task: Task, config: DecompositionConfig): Promise<Microtask[]> {
    // Combine domain and complexity-based decomposition
    const domainMicrotasks = await this.decomposeByDomain(task, config);
    const complexityMicrotasks = await this.decomposeByComplexity(task, config);

    // Merge and deduplicate
    const allMicrotasks = [...domainMicrotasks, ...complexityMicrotasks];
    const uniqueMicrotasks = allMicrotasks.filter((task, index, self) =>
      index === self.findIndex(t => t.id === task.id)
    );

    return uniqueMicrotasks;
  }

  private addDependencies(microtasks: Microtask[]): Microtask[] {
    // Add dependencies for tasks that need sequential processing
    const analysisTasks = microtasks.filter(t => t.type === 'analysis');
    const validationTasks = microtasks.filter(t => t.type === 'validation');

    // Validation tasks depend on all analysis tasks
    validationTasks.forEach(validation => {
      validation.dependencies = analysisTasks.map(a => a.id);
    });

    return microtasks;
  }

  private getDomainPatterns(taskType: string): Array<{
    id: string;
    name: string;
    agentType: string;
    description: string;
  }> {
    const patterns: Array<{
      id: string;
      name: string;
      agentType: string;
      description: string;
    }> = [];

    switch (taskType) {
      case 'security.research':
        patterns.push(
          { id: 'threat-intel', name: 'Threat Intelligence', agentType: 'research', description: 'Gather threat intelligence' },
          { id: 'vulnerability-scan', name: 'Vulnerability Scan', agentType: 'analysis', description: 'Analyze vulnerabilities' },
          { id: 'compliance-check', name: 'Compliance Check', agentType: 'validation', description: 'Verify compliance' }
        );
        break;
      case 'content.generation':
        patterns.push(
          { id: 'research', name: 'Research', agentType: 'research', description: 'Research topic' },
          { id: 'outline', name: 'Outline', agentType: 'analysis', description: 'Create outline' },
          { id: 'draft', name: 'Draft', agentType: 'generation', description: 'Generate draft' },
          { id: 'review', name: 'Review', agentType: 'validation', description: 'Review content' }
        );
        break;
      default:
        // Generic patterns
        patterns.push(
          { id: 'research', name: 'Research', agentType: 'research', description: 'Research phase' },
          { id: 'analysis', name: 'Analysis', agentType: 'analysis', description: 'Analysis phase' },
          { id: 'generation', name: 'Generation', agentType: 'generation', description: 'Generation phase' },
          { id: 'validation', name: 'Validation', agentType: 'validation', description: 'Validation phase' }
        );
    }

    return patterns;
  }

  private extractSubtask(content: any, pattern: any, index: number): any {
    // Implement subtask extraction based on pattern
    if (typeof content === 'string') {
      // Split content into parts for parallel processing
      const words = content.split(' ');
      const chunkSize = Math.ceil(words.length / 5);
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, words.length);

      return {
        text: words.slice(start, end).join(' '),
        pattern: pattern.name,
        index,
        total: 5
      };
    }

    return {
      content,
      pattern: pattern.name,
      index
    };
  }

  private createResearchQuery(content: any, index: number): any {
    return {
      query: typeof content === 'string' ? content : JSON.stringify(content),
      focus: `aspect_${index}`,
      depth: Math.floor(index / 5) + 1
    };
  }

  private createAnalysisTask(content: any, index: number): any {
    return {
      data: typeof content === 'string' ? content : JSON.stringify(content),
      perspective: `perspective_${index}`,
      analysisType: ['qualitative', 'quantitative'][index % 2]
    };
  }

  private createValidationTask(content: any, index: number): any {
    return {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      criteria: ['accuracy', 'completeness', 'clarity'][index % 3],
      threshold: 0.8
    };
  }

  private getManualStructure(taskType: string): Array<{
    type: string;
    content: any;
    agentType: string;
  }> {
    // Return predefined structure for manual decomposition
    return [
      { type: 'research', content: 'Initial research phase', agentType: 'research' },
      { type: 'analysis', content: 'Analysis phase', agentType: 'analysis' },
      { type: 'generation', content: 'Generation phase', agentType: 'generation' },
      { type: 'validation', content: 'Validation phase', agentType: 'validation' }
    ];
  }
}