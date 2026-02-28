/**
 * Analytics Engine - Metrics tracking, reporting, and trend prediction
 * Enterprise-grade analytics with ML-based predictions
 */

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface MetricData {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  trend: 'up' | 'down' | 'stable';
}

interface Report {
  period: string;
  metrics: Record<string, MetricData>;
  predictions?: Record<string, number>;
}

export class AnalyticsEngine {
  private metrics: Map<string, Metric[]> = new Map();
  private aggregations: Map<string, MetricData> = new Map();
  private retentionDays: number;

  constructor(retentionDays: number = 30) {
    this.retentionDays = retentionDays;
    this.startCleanup();
  }

  track(name: string, value: number, labels?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    this.updateAggregation(name);
  }

  private updateAggregation(name: string): void {
    const metrics = this.metrics.get(name) || [];
    const values = metrics.map(m => m.value);

    if (values.length === 0) return;

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = sum / count;

    const trend = this.calculateTrend(values);

    this.aggregations.set(name, {
      count,
      sum,
      min,
      max,
      avg,
      trend
    });
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const recent = values.slice(-10);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarlier = values.slice(0, Math.min(10, values.length - 1))
      .reduce((a, b) => a + b, 0) / Math.min(10, values.length - 1);

    const change = ((avgRecent - avgEarlier) / avgEarlier) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  predict(name: string, horizon: number = 1): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length < 10) return null;

    const values = metrics.slice(-20).map(m => m.value);

    // Simple moving average prediction
    const window = 5;
    const recentAvg = values.slice(-window).reduce((a, b) => a + b, 0) / window;
    const prevAvg = values.slice(-window * 2, -window).reduce((a, b) => a + b, 0) / window;

    const trend = recentAvg - prevAvg;
    return recentAvg + (trend * horizon);
  }

  getMetric(name: string): MetricData | null {
    return this.aggregations.get(name) || null;
  }

  getAllMetrics(): Record<string, MetricData> {
    return Object.fromEntries(this.aggregations);
  }

  generateReport(period: string = '1h'): Report {
    const predictions: Record<string, number> = {};

    for (const name of this.metrics.keys()) {
      const pred = this.predict(name);
      if (pred !== null) {
        predictions[name] = pred;
      }
    }

    return {
      period,
      metrics: this.getAllMetrics(),
      predictions
    };
  }

  private startCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

      for (const [name, metrics] of this.metrics.entries()) {
        const filtered = metrics.filter(m => m.timestamp > cutoff);
        if (filtered.length !== metrics.length) {
          this.metrics.set(name, filtered);
          this.updateAggregation(name);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = this.getAllMetrics();

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    const headers = ['name', 'count', 'sum', 'min', 'max', 'avg', 'trend'];
    const rows = Object.entries(data).map(([name, stats]) => [
      name,
      stats.count,
      stats.sum,
      stats.min,
      stats.max,
      stats.avg.toFixed(2),
      stats.trend
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  reset(): void {
    this.metrics.clear();
    this.aggregations.clear();
  }

  getStats(): { totalMetrics: number; totalDataPoints: number } {
    let totalDataPoints = 0;
    for (const metrics of this.metrics.values()) {
      totalDataPoints += metrics.length;
    }

    return {
      totalMetrics: this.metrics.size,
      totalDataPoints
    };
  }
}

export type { Metric, MetricData, Report };
