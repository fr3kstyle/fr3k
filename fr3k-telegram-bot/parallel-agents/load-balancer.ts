import { tracer } from "../observability/tracer.js";
import { Microtask, AgentPool, LoadBalancingConfig } from "./types.js";
import { AgentPoolManager } from "./agent-pool-manager.js";

export class LoadBalancer {
  private config: LoadBalancingConfig;
  private poolManager: AgentPoolManager;

  constructor(config: Partial<LoadBalancingConfig> = {}, poolManager?: AgentPoolManager) {
    this.config = {
      strategy: 'least-loaded',
      weight: {},
      affinityRules: {},
      maxRetries: 3,
      timeoutPerAssignment: 5000,
      ...config
    };
    this.poolManager = poolManager || new AgentPoolManager();
  }

  assign(microtasks: Microtask[], poolManager: AgentPoolManager): Array<{ microtask: Microtask; agentId: string }> {
    const assignments: Array<{ microtask: Microtask; agentId: string }> = [];

    for (const microtask of microtasks) {
      const agentId = this.findBestAgent(microtask, poolManager);
      if (agentId) {
        assignments.push({ microtask, agentId });
      }
    }

    return assignments;
  }

  private findBestAgent(microtask: Microtask, poolManager: AgentPoolManager): string | null {
    const availableAgents = this.getAvailableAgents(microtask, poolManager);

    if (availableAgents.length === 0) {
      return null;
    }

    switch (this.config.strategy) {
      case 'round-robin':
        return this.roundRobinAssignment(availableAgents);
      case 'weighted':
        return this.weightedAssignment(availableAgents);
      case 'priority':
        return this.priorityAssignment(availableAgents, microtask);
      case 'affinity':
        return this.affinityAssignment(availableAgents, microtask);
      case 'least-loaded':
      default:
        return this.leastLoadedAssignment(availableAgents, poolManager);
    }
  }

  private getAvailableAgents(microtask: Microtask, poolManager: AgentPoolManager): string[] {
    // Get all agents that can handle this microtask
    const availableAgents: string[] = [];

    // In a real implementation, this would query the pool manager for available agents
    // For now, we'll simulate agent selection

    return availableAgents;
  }

  private roundRobinAssignment(agents: string[]): string {
    // Simple round-robin selection
    const index = Date.now() % agents.length;
    return agents[index];
  }

  private weightedAssignment(agents: string[]): string {
    // Weighted random selection based on agent capabilities
    const weights = agents.map(agent => this.getAgentWeight(agent));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < agents.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return agents[i];
      }
    }

    return agents[0];
  }

  private priorityAssignment(agents: string[], microtask: Microtask): string {
    // Assign based on microtask priority
    const priorityMap = {
      'critical': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    };

    const microtaskPriority = priorityMap[microtask.priority] || 2;

    // Sort agents by capability for this priority level
    const sortedAgents = agents.sort((a, b) => {
      const aCapability = this.getAgentCapability(a, microtask.type, microtaskPriority);
      const bCapability = this.getAgentCapability(b, microtask.type, microtaskPriority);
      return bCapability - aCapability;
    });

    return sortedAgents[0];
  }

  private affinityAssignment(agents: string[], microtask: Microtask): string {
    // Assign based on affinity rules
    const affinityRules = this.config.affinityRules;

    // Check for specific affinity rules
    for (const [rule, agentIds] of Object.entries(affinityRules)) {
      if (microtask.type.includes(rule) && agentIds.some(id => agents.includes(id))) {
        return agents.find(id => agentIds.includes(id))!;
      }
    }

    // Fall back to least loaded
    return this.leastLoadedAssignment(agents, this.poolManager);
  }

  private leastLoadedAssignment(agents: string[], poolManager: AgentPoolManager): string {
    // Assign to the least busy agent
    const utilization = poolManager.getAgentUtilization();

    return agents.reduce((best, agent) => {
      const agentUtilization = utilization[agent] || 0;
      const bestUtilization = utilization[best] || 0;

      return agentUtilization < bestUtilization ? agent : best;
    });
  }

  private getAgentWeight(agentId: string): number {
    // Get agent weight based on capability and current load
    const baseWeight = this.config.weight[agentId] || 1;
    const loadFactor = this.getLoadFactor(agentId);

    return baseWeight * (1 / loadFactor);
  }

  private getAgentCapability(agentId: string, taskType: string, priority: number): number {
    // Calculate agent capability for specific task type and priority
    const baseCapability = this.getBaseCapability(agentId, taskType);
    const priorityBonus = priority * 0.2;

    return baseCapability + priorityBonus;
  }

  private getLoadFactor(agentId: string): number {
    // Calculate agent load factor (0.1 = low load, 2.0 = high load)
    // In a real implementation, this would query actual agent metrics
    return 1.0; // Default
  }

  private getBaseCapability(agentId: string, taskType: string): number {
    // Get base capability for agent and task type
    // In a real implementation, this would be based on agent specialization
    return 0.8; // Default capability
  }

  updateConfig(newConfig: Partial<LoadBalancingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoadBalancingConfig {
    return { ...this.config };
  }

  getStrategyPerformance(): Record<string, number> {
    // Return performance metrics for each strategy
    // In a real implementation, this would track actual performance
    return {
      'round-robin': 0.8,
      'weighted': 0.85,
      'priority': 0.9,
      'affinity': 0.75,
      'least-loaded': 0.88
    };
  }
}