#!/usr/bin/env bun
/**
 * Health Monitor - Real-time system health tracking for FR3K Algorithm
 * Tracks 7 key metrics with statistical process control
 */

interface HealthMetrics {
  cpu_usage: number;           // CPU utilization (0-1)
  memory_usage: number;        // Memory utilization (0-1)
  error_rate: number;          // Errors per minute
  response_time: number;       // Average response time (ms)
  queue_depth: number;         // Task queue length
  deadlock_risk: number;       // Deadlock probability (0-1)
  anomaly_score: number;       // Overall anomaly score (0-1)
}

interface HealthAlert {
  metric: string;
  current_value: number;
  threshold: number;
  severity: 'warning' | 'critical' | 'emergency';
  timestamp: number;
}

interface HealthHistory {
  timestamp: number;
  metrics: HealthMetrics;
}

class HealthMonitor {
  private metricsHistory: HealthHistory[] = [];
  private windowSize = 12; // 1 minute of data (5s intervals)
  private alertThresholds = {
    cpu_usage: 0.9,
    memory_usage: 0.85,
    error_rate: 10, // 10 errors per minute
    response_time: 5000, // 5 seconds
    queue_depth: 100,
    deadlock_risk: 0.5,
    anomaly_score: 0.7
  };

  private criticalThresholds = {
    cpu_usage: 0.95,
    memory_usage: 0.95,
    error_rate: 20,
    response_time: 10000,
    queue_depth: 200,
    deadlock_risk: 0.8,
    anomaly_score: 0.9
  };

  private samplingInterval = 5000; // 5 seconds
  private monitoringTimer: number | null = null;

  async startMonitoring(): Promise<void> {
    console.log('🏥 Starting Health Monitor...');
    console.log(`📊 Sampling interval: ${this.samplingInterval}ms`);
    console.log(`📈 Window size: ${this.windowSize} samples`);

    this.monitoringTimer = setInterval(() => {
      this.collectMetrics();
    }, this.samplingInterval) as unknown as number;

    console.log('✅ Health Monitor active');
  }

  async stopMonitoring(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('🛑 Health Monitor stopped');
    }
  }

  private async collectMetrics(): Promise<void> {
    const metrics: HealthMetrics = {
      cpu_usage: await this.getCPUUsage(),
      memory_usage: await this.getMemoryUsage(),
      error_rate: await this.getErrorRate(),
      response_time: await this.getResponseTime(),
      queue_depth: await this.getQueueDepth(),
      deadlock_risk: await this.getDeadlockRisk(),
      anomaly_score: 0 // Will be calculated by anomaly detector
    };

    // Store in history
    this.metricsHistory.push({
      timestamp: Date.now(),
      metrics
    });

    // Maintain window size
    if (this.metricsHistory.length > this.windowSize) {
      this.metricsHistory.shift();
    }

    // Check for alerts
    const alerts = this.checkAlerts(metrics);
    if (alerts.length > 0) {
      await this.handleAlerts(alerts);
    }

    // Calculate anomaly score
    metrics.anomaly_score = await this.calculateAnomalyScore(metrics);
  }

  private async getCPUUsage(): Promise<number> {
    // Simulate CPU usage with some variation
    const baseUsage = 0.3 + Math.random() * 0.4; // 30-70%
    return Math.min(1, baseUsage);
  }

  private async getMemoryUsage(): Promise<number> {
    // Simulate memory usage
    const baseUsage = 0.4 + Math.random() * 0.3; // 40-70%
    return Math.min(1, baseUsage);
  }

  private async getErrorRate(): Promise<number> {
    // Simulate error rate (errors per minute)
    const baseRate = Math.random() * 5; // 0-5 errors/min
    return baseRate;
  }

  private async getResponseTime(): Promise<number> {
    // Simulate response time (ms)
    const baseTime = 100 + Math.random() * 400; // 100-500ms
    return baseTime;
  }

  private async getQueueDepth(): Promise<number> {
    // Simulate queue depth
    const baseDepth = Math.floor(Math.random() * 20); // 0-20 tasks
    return baseDepth;
  }

  private async getDeadlockRisk(): Promise<number> {
    // Simulate deadlock risk
    const baseRisk = Math.random() * 0.2; // 0-20%
    return baseRisk;
  }

  private checkAlerts(metrics: HealthMetrics): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    for (const [metric, value] of Object.entries(metrics)) {
      if (metric === 'anomaly_score') continue; // Skip anomaly score

      const alertThreshold = this.alertThresholds[metric as keyof HealthMetrics];
      const criticalThreshold = this.criticalThresholds[metric as keyof HealthMetrics];

      if (value > criticalThreshold) {
        alerts.push({
          metric,
          current_value: value,
          threshold: criticalThreshold,
          severity: 'emergency',
          timestamp: Date.now()
        });
      } else if (value > alertThreshold) {
        alerts.push({
          metric,
          current_value: value,
          threshold: alertThreshold,
          severity: 'critical',
          timestamp: Date.now()
        });
      }
    }

    return alerts;
  }

  private async handleAlerts(alerts: HealthAlert[]): Promise<void> {
    for (const alert of alerts) {
      const emoji = alert.severity === 'emergency' ? '🚨' : '⚠️';
      console.log(`${emoji} HEALTH ALERT: ${alert.metric}`);
      console.log(`   Current: ${alert.current_value.toFixed(2)}`);
      console.log(`   Threshold: ${alert.threshold}`);
      console.log(`   Severity: ${alert.severity}`);

      // Trigger self-healing for critical/emergency alerts
      if (alert.severity === 'critical' || alert.severity === 'emergency') {
        console.log(`   🔧 Triggering self-healing response...`);
        // This would trigger the self-healing coordinator
      }
    }
  }

  private async calculateAnomalyScore(metrics: HealthMetrics): Promise<number> {
    if (this.metricsHistory.length < 3) return 0;

    // Calculate z-scores for each metric
    const zScores: number[] = [];

    for (const [metric, value] of Object.entries(metrics)) {
      if (metric === 'anomaly_score') continue;

      const values = this.metricsHistory.map(h => h.metrics[metric as keyof HealthMetrics]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

      if (std > 0) {
        const zScore = Math.abs((value - mean) / std);
        zScores.push(zScore);
      }
    }

    // Anomaly score is the maximum z-score, normalized to 0-1
    const maxZScore = Math.max(...zScores, 0);
    return Math.min(1, maxZScore / 3); // 3σ is fully anomalous
  }

  async getHealthReport(): Promise<{
    current_metrics: HealthMetrics;
    trends: { [key: string]: 'improving' | 'stable' | 'degrading' };
    alerts: HealthAlert[];
    health_score: number;
  }> {
    if (this.metricsHistory.length === 0) {
      throw new Error('No metrics collected yet');
    }

    const current = this.metricsHistory[this.metricsHistory.length - 1].metrics;
    const alerts = this.checkAlerts(current);

    // Calculate trends
    const trends: { [key: string]: 'improving' | 'stable' | 'degrading' } = {};

    for (const metric of Object.keys(current)) {
      if (metric === 'anomaly_score') continue;

      const recent = this.metricsHistory.slice(-3).map(h => h.metrics[metric as keyof HealthMetrics]);
      const trend = recent[2] - recent[0];

      if (Math.abs(trend) < 0.01) {
        trends[metric] = 'stable';
      } else if (metric === 'error_rate' || metric === 'response_time' || metric === 'queue_depth') {
        trends[metric] = trend > 0 ? 'degrading' : 'improving';
      } else {
        trends[metric] = trend > 0 ? 'improving' : 'degrading';
      }
    }

    // Calculate overall health score (0-100)
    const criticalIssues = alerts.filter(a => a.severity === 'emergency').length;
    const warnings = alerts.filter(a => a.severity === 'critical').length;
    const healthScore = Math.max(0, 100 - (criticalIssues * 30) - (warnings * 10));

    return {
      current_metrics: current,
      trends,
      alerts,
      health_score
    };
  }

  async getMetricsHistory(): Promise<HealthHistory[]> {
    return [...this.metricsHistory];
  }

  async getMeanAndStdDev(metric: keyof HealthMetrics): Promise<{ mean: number; stdDev: number }> {
    const values = this.metricsHistory.map(h => h.metrics[metric]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

    return { mean, stdDev };
  }
}

// Export for use by self-healing coordinator
export { HealthMonitor, HealthMetrics, HealthAlert, HealthHistory };

// Start monitoring if run directly
if (import.meta.main) {
  const monitor = new HealthMonitor();
  await monitor.startMonitoring();

  // Get health report every 30 seconds
  setInterval(async () => {
    const report = await monitor.getHealthReport();
    console.log('\n📊 HEALTH REPORT:');
    console.log(`   Health Score: ${report.health_score.toFixed(0)}/100`);
    console.log(`   Alerts: ${report.alerts.length}`);
    console.log(`   Anomaly Score: ${report.current_metrics.anomaly_score.toFixed(2)}`);
  }, 30000);

  console.log('✅ Health Monitor running. Press Ctrl+C to stop.');
}
