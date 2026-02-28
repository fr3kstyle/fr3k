#!/usr/bin/env bun
/**
 * Resource Monitor - Detailed tracking of all system resources
 * Monitors CPU, memory, network, disk, and agent capacity
 */

interface ResourceSnapshot {
  timestamp: number;
  cpu: {
    total_cores: number;
    utilized_cores: number;
    utilization_pct: number;
  };
  memory: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    utilization_pct: number;
  };
  network: {
    bandwidth_mbps: number;
    utilized_mbps: number;
    utilization_pct: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    iops: number;
    utilization_pct: number;
  };
  agents: {
    total_slots: number;
    active_slots: number;
    idle_slots: number;
    utilization_pct: number;
  };
}

interface ResourceContention {
  resource: string;
  severity: 'low' | 'medium' | 'high';
  demand: number;
  supply: number;
  timestamp: number;
}

class ResourceMonitor {
  private history: ResourceSnapshot[] = [];
  private historyLimit = 10080; // 7 days of minute-resolution data
  private contentionHistory: ResourceContention[] = [];
  private monitoringInterval: number | null = null;

  // System capacity (would be detected in real system)
  private capacity = {
    cpu_cores: 8,
    memory_gb: 16,
    network_mbps: 1000,
    disk_gb: 500,
    agent_slots: 100
  };

  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    console.log(`📊 Starting Resource Monitor (interval: ${intervalMs}ms)...`);

    // Take initial snapshot
    await this.takeSnapshot();

    // Schedule periodic snapshots
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs) as unknown as number;

    console.log('✅ Resource Monitor active');
  }

  async stopMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Resource Monitor stopped');
    }
  }

  private async takeSnapshot(): Promise<void> {
    const snapshot: ResourceSnapshot = {
      timestamp: Date.now(),
      cpu: await this.getCPUStats(),
      memory: await this.getMemoryStats(),
      network: await this.getNetworkStats(),
      disk: await this.getDiskStats(),
      agents: await this.getAgentStats()
    };

    this.history.push(snapshot);

    // Maintain history limit
    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }

    // Check for contention
    await this.checkContention(snapshot);
  }

  private async getCPUStats(): Promise<ResourceSnapshot['cpu']> {
    // Simulate CPU usage
    const utilized = Math.floor(this.capacity.cpu_cores * (0.3 + Math.random() * 0.5));

    return {
      total_cores: this.capacity.cpu_cores,
      utilized_cores: utilized,
      utilization_pct: (utilitized / this.capacity.cpu_cores) * 100
    };
  }

  private async getMemoryStats(): Promise<ResourceSnapshot['memory']> {
    // Simulate memory usage
    const used = this.capacity.memory_gb * (0.4 + Math.random() * 0.4);

    return {
      total_gb: this.capacity.memory_gb,
      used_gb: parseFloat(used.toFixed(1)),
      available_gb: parseFloat((this.capacity.memory_gb - used).toFixed(1)),
      utilization_pct: ((used / this.capacity.memory_gb) * 100)
    };
  }

  private async getNetworkStats(): Promise<ResourceSnapshot['network']> {
    // Simulate network usage
    const utilized = Math.floor(this.capacity.network_mbps * (0.1 + Math.random() * 0.3));

    return {
      bandwidth_mbps: this.capacity.network_mbps,
      utilized_mbps: utilized,
      utilization_pct: (utilitized / this.capacity.network_mbps) * 100
    };
  }

  private async getDiskStats(): Promise<ResourceSnapshot['disk']> {
    // Simulate disk usage
    const used = this.capacity.disk_gb * (0.2 + Math.random() * 0.1);
    const iops = Math.floor(100 + Math.random() * 500);

    return {
      total_gb: this.capacity.disk_gb,
      used_gb: parseFloat(used.toFixed(1)),
      iops,
      utilization_pct: ((used / this.capacity.disk_gb) * 100)
    };
  }

  private async getAgentStats(): Promise<ResourceSnapshot['agents']> {
    // Simulate agent usage
    const active = Math.floor(this.capacity.agent_slots * (0.2 + Math.random() * 0.6));

    return {
      total_slots: this.capacity.agent_slots,
      active_slots: active,
      idle_slots: this.capacity.agent_slots - active,
      utilization_pct: (active / this.capacity.agent_slots) * 100
    };
  }

  private async checkContention(snapshot: ResourceSnapshot): Promise<void> {
    const threshold = 80; // 80% utilization

    if (snapshot.cpu.utilization_pct > threshold) {
      this.recordContention('cpu', snapshot.cpu.utilization_pct, threshold);
    }

    if (snapshot.memory.utilization_pct > threshold) {
      this.recordContention('memory', snapshot.memory.utilization_pct, threshold);
    }

    if (snapshot.network.utilization_pct > threshold) {
      this.recordContention('network', snapshot.network.utilization_pct, threshold);
    }

    if (snapshot.agents.utilization_pct > threshold) {
      this.recordContention('agents', snapshot.agents.utilization_pct, threshold);
    }
  }

  private recordContention(resource: string, demand: number, supply: number): void {
    const severity: ResourceContention['severity'] =
      demand > 95 ? 'high' : demand > 90 ? 'medium' : 'low';

    this.contentionHistory.push({
      resource,
      severity,
      demand,
      supply,
      timestamp: Date.now()
    });

    console.log(`⚠️ Resource contention: ${resource} at ${demand.toFixed(0)}% (${severity})`);
  }

  async getCurrentSnapshot(): Promise<ResourceSnapshot> {
    if (this.history.length === 0) {
      await this.takeSnapshot();
    }

    return this.history[this.history.length - 1];
  }

  async getHistory(durationMs: number = 3600000): Promise<ResourceSnapshot[]> {
    const cutoff = Date.now() - durationMs;
    return this.history.filter(s => s.timestamp > cutoff);
  }

  async getAverageUtilization(resource: keyof ResourceSnapshot, durationMs: number = 3600000): Promise<number> {
    const snapshots = await this.getHistory(durationMs);

    if (snapshots.length === 0) return 0;

    const total = snapshots.reduce((sum, s) => {
      const r = s[resource];
      if (typeof r === 'object' && 'utilization_pct' in r) {
        return sum + r.utilization_pct;
      }
      return sum;
    }, 0);

    return total / snapshots.length;
  }

  async getContentionHistory(durationMs: number = 3600000): Promise<ResourceContention[]> {
    const cutoff = Date.now() - durationMs;
    return this.contentionHistory.filter(c => c.timestamp > cutoff);
  }

  async getResourceSummary(): Promise<{
    cpu_utilization: number;
    memory_utilization: number;
    network_utilization: number;
    disk_utilization: number;
    agent_utilization: number;
    overall_efficiency: number;
    bottlenecks: string[];
  }> {
    const current = await this.getCurrentSnapshot();

    const utilizations = {
      cpu_utilization: current.cpu.utilization_pct,
      memory_utilization: current.memory.utilization_pct,
      network_utilization: current.network.utilization_pct,
      disk_utilization: current.disk.utilization_pct,
      agent_utilization: current.agents.utilization_pct
    };

    // Calculate overall efficiency (balanced utilization)
    const values = Object.values(utilizations);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);
    const overall_efficiency = Math.max(0, 100 - stdDev); // Lower variance = higher efficiency

    // Identify bottlenecks (>80% utilization)
    const bottlenecks = Object.entries(utilizations)
      .filter(([_, util]) => util > 80)
      .map(([resource, _]) => resource);

    return {
      ...utilizations,
      overall_efficiency,
      bottlenecks
    };
  }

  async getCapacity(): Promise<typeof this.capacity> {
    return { ...this.capacity };
  }

  async setCapacity(capacity: Partial<typeof this.capacity>): Promise<void> {
    Object.assign(this.capacity, capacity);
    console.log('📊 Resource capacity updated:', this.capacity);
  }
}

// Export for use by resource orchestrator
export { ResourceMonitor, ResourceSnapshot, ResourceContention };

// Test if run directly
if (import.meta.main) {
  const monitor = new ResourceMonitor();

  console.log('🧪 Testing Resource Monitor...');

  await monitor.startMonitoring(5000); // 5 second interval for testing

  // Get summary every 15 seconds
  setInterval(async () => {
    const summary = await monitor.getResourceSummary();
    console.log('\n📊 Resource Summary:');
    console.log(`   CPU: ${summary.cpu_utilization.toFixed(0)}%`);
    console.log(`   Memory: ${summary.memory_utilization.toFixed(0)}%`);
    console.log(`   Network: ${summary.network_utilization.toFixed(0)}%`);
    console.log(`   Disk: ${summary.disk_utilization.toFixed(0)}%`);
    console.log(`   Agents: ${summary.agent_utilization.toFixed(0)}%`);
    console.log(`   Efficiency: ${summary.overall_efficiency.toFixed(0)}%`);
    if (summary.bottlenecks.length > 0) {
      console.log(`   ⚠️ Bottlenecks: ${summary.bottlenecks.join(', ')}`);
    }
  }, 15000);

  console.log('✅ Resource Monitor running. Press Ctrl+C to stop.');
}
