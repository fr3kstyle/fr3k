#!/usr/bin/env bun
/**
 * Resource Orchestrator - Dynamic resource allocation and scheduling
 * Automatically distributes resources based on workload and priority
 */

import { ResourceMonitor } from './resource-monitor.ts';
import { WorkloadPredictor } from './workload-predictor.ts';

interface ResourceAllocation {
  task_id: string;
  task_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resources: {
    cpu_cores: number;
    memory_gb: number;
    network_mbps: number;
    agent_slots: number;
  };
  allocated_at: number;
  estimated_duration_ms: number;
}

interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'reallocate' | 'none';
  resource: string;
  current_value: number;
  new_value: number;
  reason: string;
  confidence: number;
}

class ResourceOrchestrator {
  private monitor: ResourceMonitor;
  private predictor: WorkloadPredictor;
  private allocations: Map<string, ResourceAllocation> = new Map();
  private allocationHistory: ResourceAllocation[] = [];
  private scalingHistory: ScalingDecision[] = [];

  // Policy parameters
  private scaleUpThreshold = 80; // Scale up when utilization > 80%
  private scaleDownThreshold = 30; // Scale down when utilization < 30%
  private predictionHorizon: '1h' | '6h' | '24h' = '1h';

  constructor() {
    this.monitor = new ResourceMonitor();
    this.predictor = new WorkloadPredictor();
  }

  async start(): Promise<void> {
    console.log('🎯 Starting Resource Orchestrator...');

    // Start monitoring
    await this.monitor.startMonitoring(60000); // 1 minute interval

    // Start orchestration loop
    setInterval(() => {
      this.orchestrationLoop();
    }, 30000); // Run every 30 seconds

    console.log('✅ Resource Orchestrator active');
  }

  async stop(): Promise<void> {
    await this.monitor.stopMonitoring();
    console.log('🛑 Resource Orchestrator stopped');
  }

  private async orchestrationLoop(): Promise<void> {
    try {
      // Get current resource state
      const summary = await this.monitor.getResourceSummary();

      // Get workload predictions
      const forecasts = await this.predictor.predictAll(this.predictionHorizon);

      // Make scaling decisions
      const decisions = await this.makeScalingDecisions(summary, forecasts);

      // Execute scaling decisions
      for (const decision of decisions) {
        if (decision.action !== 'none') {
          await this.executeScalingDecision(decision);
        }
      }

      // Reallocate resources if needed
      await this.optimizeAllocation(summary);
    } catch (error) {
      console.error(`❌ Orchestration loop error: ${(error as Error).message}`);
    }
  }

  private async makeScalingDecisions(
    summary: any,
    forecasts: any
  ): Promise<ScalingDecision[]> {
    const decisions: ScalingDecision[] = [];

    // Check each resource
    const resources = ['cpu', 'memory', 'network', 'agents'] as const;

    for (const resource of resources) {
      const utilization = summary[`${resource}_utilization`];
      const forecast = forecasts[resource as keyof typeof forecasts] as any;

      // Get predicted utilization at end of horizon
      const predictedUtil = forecast.prediction[forecast.prediction.length - 1];

      // Decision logic
      if (utilization > this.scaleUpThreshold || predictedUtil > this.scaleUpThreshold) {
        decisions.push({
          action: 'scale_up',
          resource,
          current_value: utilization,
          new_value: Math.min(100, utilization * 1.2), // Scale up by 20%
          reason: `Utilization (${utilization.toFixed(0)}%) or predicted (${predictedUtil.toFixed(0)}%) exceeds threshold`,
          confidence: 0.8
        });
      } else if (utilization < this.scaleDownThreshold && predictedUtil < this.scaleDownThreshold) {
        decisions.push({
          action: 'scale_down',
          resource,
          current_value: utilization,
          new_value: Math.max(0, utilization * 0.8), // Scale down by 20%
          reason: `Utilization (${utilization.toFixed(0)}%) and predicted (${predictedUtil.toFixed(0)}%) below threshold`,
          confidence: 0.7
        });
      }
    }

    return decisions;
  }

  private async executeScalingDecision(decision: ScalingDecision): Promise<void> {
    console.log(`\n🎯 Scaling Decision: ${decision.action.toUpperCase()} ${decision.resource}`);
    console.log(`   Current: ${decision.current_value.toFixed(0)}%`);
    console.log(`   Target: ${decision.new_value.toFixed(0)}%`);
    console.log(`   Reason: ${decision.reason}`);

    // In a real system, this would:
    // - Provision/deprovision resources
    // - Adjust quotas and limits
    // - Rebalance workloads

    // Record decision
    this.scalingHistory.push({
      ...decision,
      timestamp: Date.now()
    } as ScalingDecision & { timestamp: number });

    // Simulate scaling action
    if (decision.action === 'scale_up') {
      console.log(`   ✅ Scaled up ${decision.resource}`);
    } else if (decision.action === 'scale_down') {
      console.log(`   ✅ Scaled down ${decision.resource}`);
    }
  }

  private async optimizeAllocation(summary: any): Promise<void> {
    // Check if any reallocation is needed
    if (summary.bottlenecks.length > 0) {
      console.log(`\n⚠️ Bottlenecks detected: ${summary.bottlenecks.join(', ')}`);
      console.log(`   🔧 Reallocating resources...`);

      // In a real system, this would:
      // - Identify low-priority tasks using bottlenecked resources
      // - Migrate or preempt those tasks
      // - Reallocate resources to high-priority tasks
    }
  }

  async allocateResources(
    taskId: string,
    taskName: string,
    priority: ResourceAllocation['priority'],
    estimatedDurationMs: number,
    requirements: Partial<ResourceAllocation['resources']>
  ): Promise<ResourceAllocation> {
    // Get available resources
    const current = await this.monitor.getCurrentSnapshot();

    // Calculate available resources
    const available = {
      cpu_cores: current.cpu.total_cores - current.cpu.utilized_cores,
      memory_gb: current.memory.available_gb,
      network_mbps: current.network.bandwidth_mbps - current.network.utilized_mbps,
      agent_slots: current.agents.idle_slots
    };

    // Allocate based on priority
    let multiplier = 1;
    switch (priority) {
      case 'critical':
        multiplier = 1.0;
        break;
      case 'high':
        multiplier = 0.7;
        break;
      case 'medium':
        multiplier = 0.5;
        break;
      case 'low':
        multiplier = 0.3;
        break;
    }

    const allocation: ResourceAllocation = {
      task_id: taskId,
      task_name: taskName,
      priority,
      resources: {
        cpu_cores: Math.min(
          available.cpu_cores * multiplier,
          requirements.cpu_cores || available.cpu_cores * 0.5
        ),
        memory_gb: Math.min(
          available.memory_gb * multiplier,
          requirements.memory_gb || available.memory_gb * 0.5
        ),
        network_mbps: Math.min(
          available.network_mbps * multiplier,
          requirements.network_mbps || available.network_mbps * 0.3
        ),
        agent_slots: Math.min(
          available.agent_slots * multiplier,
          requirements.agent_slots || 1
        )
      },
      allocated_at: Date.now(),
      estimated_duration_ms: estimatedDurationMs
    };

    // Store allocation
    this.allocations.set(taskId, allocation);
    this.allocationHistory.push(allocation);

    console.log(`\n✅ Allocated resources to task: ${taskName} (${priority})`);
    console.log(`   CPU: ${allocation.resources.cpu_cores.toFixed(1)} cores`);
    console.log(`   Memory: ${allocation.resources.memory_gb.toFixed(1)} GB`);
    console.log(`   Network: ${allocation.resources.network_mbps.toFixed(0)} Mbps`);
    console.log(`   Agents: ${allocation.resources.agent_slots} slots`);

    return allocation;
  }

  async releaseResources(taskId: string): Promise<void> {
    const allocation = this.allocations.get(taskId);

    if (allocation) {
      console.log(`\n🔓 Released resources from task: ${allocation.task_name}`);
      this.allocations.delete(taskId);
    }
  }

  async getAllocationSummary(): Promise<{
    active_allocations: number;
    total_resources_allocated: {
      cpu_cores: number;
      memory_gb: number;
      agent_slots: number;
    };
    by_priority: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  }> {
    const active = Array.from(this.allocations.values());

    const total = {
      cpu_cores: active.reduce((sum, a) => sum + a.resources.cpu_cores, 0),
      memory_gb: active.reduce((sum, a) => sum + a.resources.memory_gb, 0),
      agent_slots: active.reduce((sum, a) => sum + a.resources.agent_slots, 0)
    };

    const byPriority = {
      low: active.filter(a => a.priority === 'low').length,
      medium: active.filter(a => a.priority === 'medium').length,
      high: active.filter(a => a.priority === 'high').length,
      critical: active.filter(a => a.priority === 'critical').length
    };

    return {
      active_allocations: active.length,
      total_resources_allocated: total,
      by_priority: byPriority
    };
  }

  async getEfficiencyMetrics(): Promise<{
    resource_utilization: number;
    allocation_efficiency: number;
    scaling_frequency: number;
    prediction_accuracy: number;
  }> {
    const summary = await this.monitor.getResourceSummary();
    const allocation = await this.getAllocationSummary();

    // Calculate efficiency metrics
    const avgUtil = (
      summary.cpu_utilization +
      summary.memory_utilization +
      summary.network_utilization +
      summary.agent_utilization
    ) / 4;

    const allocationEff = allocation.active_allocations > 0
      ? (allocation.total_resources_allocated.cpu_cores / (await this.monitor.getCapacity()).cpu_cores) * 100
      : 0;

    const scalingFreq = this.scalingHistory.filter(
      s => s.timestamp > Date.now() - 3600000
    ).length;

    return {
      resource_utilization: avgUtil,
      allocation_efficiency: allocationEff,
      scaling_frequency: scalingFreq,
      prediction_accuracy: 0 // Would be calculated from actual vs predicted
    };
  }
}

// Export for use by cost optimizer
export { ResourceOrchestrator, ResourceAllocation, ScalingDecision };

// Test if run directly
if (import.meta.main) {
  const orchestrator = new ResourceOrchestrator();

  console.log('🧪 Testing Resource Orchestrator...\n');

  await orchestrator.start();

  // Allocate some resources
  await orchestrator.allocateResources(
    'task-1',
    'Data Processing',
    'high',
    300000,
    { cpu_cores: 2, memory_gb: 4, agent_slots: 5 }
  );

  await orchestrator.allocateResources(
    'task-2',
    'Model Training',
    'critical',
    600000,
    { cpu_cores: 4, memory_gb: 8, agent_slots: 10 }
  );

  // Get allocation summary
  const summary = await orchestrator.getAllocationSummary();
  console.log('\n📊 Allocation Summary:');
  console.log(`   Active allocations: ${summary.active_allocations}`);
  console.log(`   CPU allocated: ${summary.total_resources_allocated.cpu_cores.toFixed(1)} cores`);
  console.log(`   Memory allocated: ${summary.total_resources_allocated.memory_gb.toFixed(1)} GB`);
  console.log(`   Priority breakdown:`, summary.by_priority);

  // Get efficiency metrics
  const metrics = await orchestrator.getEfficiencyMetrics();
  console.log('\n📈 Efficiency Metrics:');
  console.log(`   Resource utilization: ${metrics.resource_utilization.toFixed(0)}%`);
  console.log(`   Allocation efficiency: ${metrics.allocation_efficiency.toFixed(0)}%`);
  console.log(`   Scaling frequency: ${metrics.scaling_frequency} actions/hour`);

  console.log('\n✅ Resource Orchestrator loaded');
}
