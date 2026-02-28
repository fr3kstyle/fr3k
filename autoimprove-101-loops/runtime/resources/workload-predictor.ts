#!/usr/bin/env bun
/**
 * Workload Predictor - ML-based forecasting of resource demand
 * Uses ARIMA time series forecasting with confidence intervals
 */

interface WorkloadForecast {
  horizon: '1h' | '6h' | '24h';
  prediction: number[];
  confidence_upper: number[];
  confidence_lower: number[];
  timestamp: number;
  model: 'arima' | 'pattern' | 'ensemble';
}

interface WorkloadPattern {
  hour_of_day: number;
  day_of_week: number;
  avg_cpu: number;
  avg_memory: number;
  avg_agents: number;
  samples: number;
}

class WorkloadPredictor {
  private history: Map<string, number[]> = new Map(); // Resource -> historical values
  private patterns: WorkloadPattern[] = [];
  private forecastWindow = 1440; // 24 hours of minute data

  constructor() {
    // Initialize resource histories
    this.history.set('cpu', []);
    this.history.set('memory', []);
    this.history.set('network', []);
    this.history.set('agents', []);
  }

  async ingestMetrics(metrics: {
    cpu_utilization: number;
    memory_utilization: number;
    network_utilization: number;
    agent_utilization: number;
  }): Promise<void> {
    const timestamp = Date.now();

    // Add to histories
    this.history.get('cpu')!.push(metrics.cpu_utilization);
    this.history.get('memory')!.push(metrics.memory_utilization);
    this.history.get('network')!.push(metrics.network_utilization);
    this.history.get('agents')!.push(metrics.agent_utilization);

    // Maintain window size
    for (const [resource, values] of this.history) {
      if (values.length > this.forecastWindow) {
        values.shift();
      }
    }

    // Update patterns
    await this.updatePatterns(metrics, timestamp);
  }

  private async updatePatterns(
    metrics: any,
    timestamp: number
  ): Promise<void> {
    const date = new Date(timestamp);
    const hourOfDay = date.getHours();
    const dayOfWeek = date.getDay();

    // Find or create pattern
    let pattern = this.patterns.find(
      p => p.hour_of_day === hourOfDay && p.day_of_week === dayOfWeek
    );

    if (!pattern) {
      pattern = {
        hour_of_day: hourOfDay,
        day_of_week: dayOfWeek,
        avg_cpu: 0,
        avg_memory: 0,
        avg_agents: 0,
        samples: 0
      };
      this.patterns.push(pattern);
    }

    // Update running average
    const alpha = 0.1; // Smoothing factor
    pattern.avg_cpu = (1 - alpha) * pattern.avg_cpu + alpha * metrics.cpu_utilization;
    pattern.avg_memory = (1 - alpha) * pattern.avg_memory + alpha * metrics.memory_utilization;
    pattern.avg_agents = (1 - alpha) * pattern.avg_agents + alpha * metrics.agent_utilization;
    pattern.samples++;
  }

  async predict(
    resource: string,
    horizon: '1h' | '6h' | '24h' = '6h'
  ): Promise<WorkloadForecast> {
    const history = this.history.get(resource);

    if (!history || history.length < 60) {
      throw new Error(`Insufficient history for ${resource} prediction`);
    }

    // Use ensemble of ARIMA and pattern-based prediction
    const arimaPred = this.arimaPredict(history, horizon);
    const patternPred = this.patternPredict(resource, horizon);

    // Combine predictions (weighted average)
    const weights = { arima: 0.6, pattern: 0.4 };
    const combined = arimaPred.map((val, i) => {
      return val * weights.arima + patternPred[i] * weights.pattern;
    });

    // Calculate confidence intervals
    const stdError = this.calculateStdError(history, arimaPred);
    const confidence = 1.96; // 95% confidence

    const prediction = combined;
    const confidence_upper = combined.map(v => Math.min(100, v + confidence * stdError));
    const confidence_lower = combined.map(v => Math.max(0, v - confidence * stdError));

    return {
      horizon,
      prediction,
      confidence_upper,
      confidence_lower,
      timestamp: Date.now(),
      model: 'ensemble'
    };
  }

  private arimaPredict(history: number[], horizon: '1h' | '6h' | '24h'): number[] {
    // Simplified ARIMA(1,1,1) implementation
    // In production, use statsmodels or similar library

    const steps = horizon === '1h' ? 60 : horizon === '6h' ? 360 : 1440;

    // Differencing (make stationary)
    const diff = [];
    for (let i = 1; i < history.length; i++) {
      diff.push(history[i] - history[i - 1]);
    }

    // Simple autoregressive prediction
    const predictions: number[] = [];
    let lastValue = history[history.length - 1];
    let lastDiff = diff[diff.length - 1];

    for (let i = 0; i < steps; i++) {
      // AR(1) component
      const ar = 0.7 * lastDiff;
      // MA(1) component (simplified)
      const ma = 0.3 * (Math.random() - 0.5) * 2;

      const newDiff = ar + ma;
      predictions.push(Math.max(0, Math.min(100, lastValue + newDiff)));

      lastValue = predictions[predictions.length - 1];
      lastDiff = newDiff;
    }

    return predictions;
  }

  private patternPredict(resource: string, horizon: '1h' | '6h' | '24h'): number[] {
    const steps = horizon === '1h' ? 60 : horizon === '6h' ? 360 : 1440;
    const predictions: number[] = [];

    const now = new Date();
    const avgPattern = this.getAveragePattern();

    for (let i = 0; i < steps; i++) {
      const futureTime = new Date(now.getTime() + i * 60000);
      const hourOfDay = futureTime.getHours();
      const dayOfWeek = futureTime.getDay();

      // Find matching pattern
      const pattern = this.patterns.find(
        p => p.hour_of_day === hourOfDay && p.day_of_week === dayOfWeek
      );

      let value = 50; // Default
      if (pattern) {
        switch (resource) {
          case 'cpu':
            value = pattern.avg_cpu;
            break;
          case 'memory':
            value = pattern.avg_memory;
            break;
          case 'agents':
            value = pattern.avg_agents;
            break;
          default:
            value = 50;
        }
      }

      predictions.push(value);
    }

    return predictions;
  }

  private getAveragePattern(): WorkloadPattern {
    if (this.patterns.length === 0) {
      return {
        hour_of_day: 0,
        day_of_week: 0,
        avg_cpu: 50,
        avg_memory: 50,
        avg_agents: 50,
        samples: 0
      };
    }

    const totalSamples = this.patterns.reduce((sum, p) => sum + p.samples, 0);

    return {
      hour_of_day: 0,
      day_of_week: 0,
      avg_cpu: this.patterns.reduce((sum, p) => sum + p.avg_cpu * p.samples, 0) / totalSamples,
      avg_memory: this.patterns.reduce((sum, p) => sum + p.avg_memory * p.samples, 0) / totalSamples,
      avg_agents: this.patterns.reduce((sum, p) => sum + p.avg_agents * p.samples, 0) / totalSamples,
      samples: totalSamples
    };
  }

  private calculateStdError(history: number[], predictions: number[]): number {
    // Calculate residual standard error
    const residuals = history.slice(-predictions.length).map((actual, i) => {
      return actual - predictions[i];
    });

    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;
    return Math.sqrt(mse);
  }

  async predictAll(horizon: '1h' | '6h' | '24h' = '6h'): Promise<{
    cpu: WorkloadForecast;
    memory: WorkloadForecast;
    network: WorkloadForecast;
    agents: WorkloadForecast;
  }> {
    return {
      cpu: await this.predict('cpu', horizon),
      memory: await this.predict('memory', horizon),
      network: await this.predict('network', horizon),
      agents: await this.predict('agents', horizon)
    };
  }

  async getPredictionAccuracy(
    resource: string,
    actualValues: number[],
    predictedValues: number[]
  ): Promise<{
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    accuracy_pct: number;
  }> {
    if (actualValues.length !== predictedValues.length) {
      throw new Error('Actual and predicted values must have same length');
    }

    let sumAbsPctError = 0;
    let sumSqError = 0;

    for (let i = 0; i < actualValues.length; i++) {
      const actual = actualValues[i];
      const predicted = predictedValues[i];

      sumAbsPctError += Math.abs((actual - predicted) / actual) * 100;
      sumSqError += Math.pow(actual - predicted, 2);
    }

    const mape = sumAbsPctError / actualValues.length;
    const rmse = Math.sqrt(sumSqError / actualValues.length);
    const accuracy_pct = 100 - mape;

    return { mape, rmse, accuracy_pct };
  }

  async getPatterns(): Promise<WorkloadPattern[]> {
    return [...this.patterns];
  }

  async getHistoryLength(): Promise<number> {
    return this.history.get('cpu')!.length;
  }
}

// Export for use by resource orchestrator
export { WorkloadPredictor, WorkloadForecast, WorkloadPattern };

// Test if run directly
if (import.meta.main) {
  const predictor = new WorkloadPredictor();

  console.log('🧪 Testing Workload Predictor...');

  // Ingest some dummy metrics
  for (let i = 0; i < 500; i++) {
    await predictor.ingestMetrics({
      cpu_utilization: 30 + Math.sin(i / 50) * 20 + Math.random() * 10,
      memory_utilization: 40 + Math.random() * 20,
      network_utilization: 20 + Math.random() * 15,
      agent_utilization: 25 + Math.random() * 30
    });
  }

  console.log(`✅ Ingested 500 data points`);
  console.log(`✅ Learned ${predictor.getPatterns().then(p => p.length)} patterns`);

  // Generate predictions
  const forecast = await predictor.predict('cpu', '1h');

  console.log('\n📊 CPU Forecast (1 hour):');
  console.log(`   Current: ${forecast.prediction[0].toFixed(1)}%`);
  console.log(`   In 1 hour: ${forecast.prediction[forecast.prediction.length - 1].toFixed(1)}%`);
  console.log(`   Range: ${forecast.confidence_lower[forecast.prediction.length - 1].toFixed(1)}% - ${forecast.confidence_upper[forecast.prediction.length - 1].toFixed(1)}%`);

  console.log('\n✅ Workload Predictor loaded');
}
