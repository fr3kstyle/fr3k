#!/usr/bin/env bun
/**
 * Cost Optimizer - Multi-objective optimization for performance, cost, and energy
 * Uses Pareto frontier analysis to find optimal trade-offs
 */

import { ResourceMonitor } from './resource-monitor.ts';
import { ResourceOrchestrator } from './resource-orchestrator.ts';

interface CostMetrics {
  compute_cost_per_hour: number;  // USD
  memory_cost_per_gb: number;     // USD
  storage_cost_per_gb: number;    // USD
  network_cost_per_gb: number;    // USD
  energy_cost_per_kwh: number;    // USD
  carbon_emission_g_co2_per_kwh: number; // g CO2
}

interface OptimizationObjective {
  performance: number;    // 0-1, higher is better
  cost: number;          // 0-1, lower is better (inverted)
  energy: number;        // 0-1, lower is better (inverted)
}

interface OptimizationSolution {
  configuration: {
    cpu_cores: number;
    memory_gb: number;
    agent_slots: number;
    power_limit_pct: number;
  };
  objectives: OptimizationObjective;
  pareto_rank: number;
  overall_score: number;
}

class CostOptimizer {
  private monitor: ResourceMonitor;
  private orchestrator: ResourceOrchestrator;
  private currentCosts: CostMetrics;
  private optimizationHistory: OptimizationSolution[] = [];

  // Pricing model (would be external API in production)
  private pricing = {
    compute_cost_per_core_hour: 0.05, // $0.05 per core hour
    memory_cost_per_gb_hour: 0.002,   // $0.002 per GB hour
    storage_cost_per_gb_hour: 0.0001, // $0.0001 per GB hour
    network_cost_per_gb: 0.01,        // $0.01 per GB transferred
    energy_cost_per_kwh: 0.15,        // $0.15 per kWh
    carbon_intensity: 400             // 400g CO2 per kWh (grid average)
  };

  // Optimization weights
  private weights = {
    performance: 0.5,
    cost: 0.3,
    energy: 0.2
  };

  constructor() {
    this.monitor = new ResourceMonitor();
    this.orchestrator = new ResourceOrchestrator();
    this.currentCosts = this.calculateCurrentCosts();
  }

  async optimize(
    performanceTarget: number = 0.8
  ): Promise<OptimizationSolution> {
    console.log(`\n💰 Optimizing for performance target: ${(performanceTarget * 100).toFixed(0)}%`);

    // Generate candidate solutions
    const candidates = await this.generateCandidates(performanceTarget);

    // Calculate Pareto frontier
    const paretoFront = this.calculateParetoFrontier(candidates);

    // Select best solution based on weights
    const best = this.selectBestSolution(paretoFront);

    // Record optimization
    this.optimizationHistory.push(best);

    console.log(`   ✅ Optimal configuration found`);
    console.log(`   CPU cores: ${best.configuration.cpu_cores}`);
    console.log(`   Memory: ${best.configuration.memory_gb} GB`);
    console.log(`   Power limit: ${best.configuration.power_limit_pct}%`);
    console.log(`   Score: ${(best.overall_score * 100).toFixed(0)}%`);

    return best;
  }

  private async generateCandidates(
    performanceTarget: number
  ): Promise<OptimizationSolution[]> {
    const candidates: OptimizationSolution[] = [];
    const capacity = await this.monitor.getCapacity();

    // Generate 50 candidate configurations
    for (let i = 0; i < 50; i++) {
      // Vary resources around current capacity
      const cpuVariation = 0.5 + Math.random() * 0.5; // 50-100% of capacity
      const memoryVariation = 0.5 + Math.random() * 0.5;
      const powerVariation = 0.5 + Math.random() * 0.5;

      const config = {
        cpu_cores: Math.floor(capacity.cpu_cores * cpuVariation),
        memory_gb: parseFloat((capacity.memory_gb * memoryVariation).toFixed(1)),
        agent_slots: Math.floor(capacity.agent_slots * cpuVariation),
        power_limit_pct: Math.floor(50 + powerVariation * 50) // 50-100%
      };

      // Calculate objectives
      const objectives = await this.calculateObjectives(config, performanceTarget);

      candidates.push({
        configuration: config,
        objectives,
        pareto_rank: 0,
        overall_score: 0
      });
    }

    return candidates;
  }

  private async calculateObjectives(
    config: OptimizationSolution['configuration'],
    performanceTarget: number
  ): Promise<OptimizationObjective> {
    // Calculate performance score
    const cpuScore = config.cpu_cores / (await this.monitor.getCapacity()).cpu_cores;
    const memoryScore = config.memory_gb / (await this.monitor.getCapacity()).memory_gb;
    const performance = Math.min(1, (cpuScore + memoryScore) / 2);

    // Calculate cost score (lower is better, so invert)
    const hourlyCost =
      config.cpu_cores * this.pricing.compute_cost_per_core_hour +
      config.memory_gb * this.pricing.memory_cost_per_gb_hour;
    const maxCost =
      (await this.monitor.getCapacity()).cpu_cores * this.pricing.compute_cost_per_core_hour +
      (await this.monitor.getCapacity()).memory_gb * this.pricing.memory_cost_per_gb_hour;
    const cost = 1 - (hourlyCost / maxCost);

    // Calculate energy score (lower is better, so invert)
    // Power is roughly proportional to CPU cores * power limit
    const powerKw = (config.cpu_cores * 0.1) * (config.power_limit_pct / 100); // Rough estimate
    const energyScore = 1 - (config.power_limit_pct / 100);

    return {
      performance,
      cost,
      energy: energyScore
    };
  }

  private calculateParetoFrontier(candidates: OptimizationSolution[]): OptimizationSolution[] {
    // Simple Pareto ranking: solution is Pareto-optimal if no other solution
    // is better in all objectives

    const paretoOptimal: OptimizationSolution[] = [];

    for (const candidate of candidates) {
      let isDominated = false;

      for (const other of candidates) {
        if (other === candidate) continue;

        // Check if 'other' dominates 'candidate'
        const betterInAll =
          other.objectives.performance >= candidate.objectives.performance &&
          other.objectives.cost >= candidate.objectives.cost &&
          other.objectives.energy >= candidate.objectives.energy;

        const betterInAtLeastOne =
          other.objectives.performance > candidate.objectives.performance ||
          other.objectives.cost > candidate.objectives.cost ||
          other.objectives.energy > candidate.objectives.energy;

        if (betterInAll && betterInAtLeastOne) {
          isDominated = true;
          break;
        }
      }

      if (!isDominated) {
        paretoOptimal.push(candidate);
      }
    }

    return paretoOptimal;
  }

  private selectBestSolution(paretoFront: OptimizationSolution[]): OptimizationSolution {
    // Calculate weighted score for each solution
    for (const solution of paretoFront) {
      solution.overall_score =
        solution.objectives.performance * this.weights.performance +
        solution.objectives.cost * this.weights.cost +
        solution.objectives.energy * this.weights.energy;
    }

    // Sort by overall score
    paretoFront.sort((a, b) => b.overall_score - a.overall_score);

    return paretoFront[0];
  }

  private calculateCurrentCosts(): CostMetrics {
    const capacity = {
      cpu_cores: 8,
      memory_gb: 16,
      storage_gb: 500
    };

    return {
      compute_cost_per_hour: capacity.cpu_cores * this.pricing.compute_cost_per_core_hour,
      memory_cost_per_gb: this.pricing.memory_cost_per_gb_hour,
      storage_cost_per_gb: this.pricing.storage_cost_per_gb_hour,
      network_cost_per_gb: this.pricing.network_cost_per_gb,
      energy_cost_per_kwh: this.pricing.energy_cost_per_kwh,
      carbon_emission_g_co2_per_kwh: this.pricing.carbon_intensity
    };
  }

  async getCostReport(): Promise<{
    hourly_cost_usd: number;
    monthly_cost_usd: number;
    annual_cost_usd: number;
    carbon_footprint_kg_monthly: number;
    cost_saving_opportunities: string[];
  }> {
    const capacity = await this.monitor.getCapacity();
    const summary = await this.monitor.getResourceSummary();

    // Calculate actual costs based on current utilization
    const utilizedCores = (summary.cpu_utilization / 100) * capacity.cpu_cores;
    const utilizedMemory = (summary.memory_utilization / 100) * capacity.memory_gb;

    const hourlyCost =
      utilizedCores * this.pricing.compute_cost_per_core_hour +
      utilizedMemory * this.pricing.memory_cost_per_gb_hour;

    // Estimate power consumption
    const powerKw = utilizedCores * 0.1; // Rough estimate: 0.1kW per core
    const hourlyEnergy = powerKw * 1; // 1 hour
    const monthlyEnergy = hourlyEnergy * 24 * 30; // 30 days
    const carbonKg = (monthlyEnergy * this.pricing.carbon_intensity) / 1000;

    const monthlyCost = hourlyCost * 24 * 30;
    const annualCost = monthlyCost * 12;

    // Identify saving opportunities
    const opportunities: string[] = [];
    if (summary.overall_efficiency < 70) {
      opportunities.push('Improve resource balancing to increase efficiency');
    }
    if (summary.cpu_utilization < 30) {
      opportunities.push('Scale down CPU allocation during low-demand periods');
    }
    if (summary.memory_utilization < 30) {
      opportunities.push('Reduce memory allocation or consolidate workloads');
    }

    return {
      hourly_cost_usd: parseFloat(hourlyCost.toFixed(4)),
      monthly_cost_usd: parseFloat(monthlyCost.toFixed(2)),
      annual_cost_usd: parseFloat(annualCost.toFixed(2)),
      carbon_footprint_kg_monthly: parseFloat(carbonKg.toFixed(2)),
      cost_saving_opportunities: opportunities
    };
  }

  setOptimizationWeights(weights: Partial<typeof this.weights>): void {
    Object.assign(this.weights, weights);
    console.log('📊 Optimization weights updated:', this.weights);
  }

  async getOptimizationHistory(): Promise<OptimizationSolution[]> {
    return [...this.optimizationHistory];
  }
}

// Export
export { CostOptimizer, CostMetrics, OptimizationObjective, OptimizationSolution };

// Test if run directly
if (import.meta.main) {
  const optimizer = new CostOptimizer();

  console.log('🧪 Testing Cost Optimizer...\n');

  // Run optimization
  const solution = await optimizer.optimize(0.8);

  console.log('\n📊 Optimization Results:');
  console.log('   Configuration:', solution.configuration);
  console.log('   Objectives:', solution.objectives);
  console.log('   Overall Score:', (solution.overall_score * 100).toFixed(0) + '%');

  // Get cost report
  const costReport = await optimizer.getCostReport();
  console.log('\n💰 Cost Report:');
  console.log(`   Hourly: $${costReport.hourly_cost_usd}`);
  console.log(`   Monthly: $${costReport.monthly_cost_usd}`);
  console.log(`   Annual: $${costReport.annual_cost_usd}`);
  console.log(`   Carbon: ${costReport.carbon_footprint_kg_monthly} kg CO2/month`);

  if (costReport.cost_saving_opportunities.length > 0) {
    console.log('\n💡 Saving Opportunities:');
    costReport.cost_saving_opportunities.forEach(op => {
      console.log(`   - ${op}`);
    });
  }

  console.log('\n✅ Cost Optimizer loaded');
}
