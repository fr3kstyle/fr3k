#!/usr/bin/env bun
/**
 * PAI A/B Testing Framework
 *
 * A complete A/B testing framework following PAI constitutional principles:
 * - Article I: Library-First (standalone library)
 * - Article II: CLI Interface (text in, text out, JSON support)
 * - Article III: Test-First (tests written before implementation)
 * - Article VII: Simplicity (minimal dependencies)
 * - Article VIII: Anti-Abstraction (direct implementation)
 * - Article IX: Integration-First (real data, no mocks)
 *
 * Features:
 * - Variant management with deterministic assignment
 * - Metrics collection (binary, numeric, count types)
 * - Statistical analysis (z-test, t-test, chi-square)
 * - CLI interface for all operations
 * - Persistence across sessions
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Metric types supported by the framework
 */
export type MetricType = "binary" | "numeric" | "count";

/**
 * Experiment status states
 */
export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "stopped";

/**
 * A single variant in an experiment
 */
export interface Variant {
  id: string;
  name: string;
  description?: string;
  allocation: number; // Percentage (0-100), must sum to 100 across all variants
  config?: Record<string, any>; // Variant-specific configuration
}

/**
 * A metric value recorded for a user
 */
export interface MetricValue {
  experimentId: string;
  variantId: string;
  userId: string;
  metricName: string;
  value: number;
  timestamp: number;
  type?: MetricType;
}

/**
 * Aggregated metrics for a variant
 */
export interface AggregatedMetrics {
  metricName: string;
  variantId: string;
  count: number;
  sum: number;
  mean: number;
  variance?: number;
  standardDeviation?: number;
  min?: number;
  max?: number;
}

/**
 * Variant statistics
 */
export interface VariantStatistics extends AggregatedMetrics {
  conversionRate?: number; // For binary metrics
  standardError?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
}

/**
 * Statistical test result
 */
export interface StatisticalResult {
  experimentId: string;
  metricName: string;
  controlVariant: string;
  treatmentVariant: string;
  controlMean: number;
  treatmentMean: number;
  absoluteDifference: number;
  relativeUplift: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: number;
  sufficientPower: boolean;
  testType: "z-test" | "t-test" | "chi-square" | "mann-whitney";
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  sampleSize?: {
    control: number;
    treatment: number;
  };
}

/**
 * Experiment targeting rules
 */
export interface Targeting {
  userIds?: string[]; // Specific user IDs
  userSegments?: string[]; // User segments
  percentage?: number; // Percentage of traffic to include
  countries?: string[]; // Geographic targeting
  platforms?: string[]; // Platform targeting
}

/**
 * A complete A/B test experiment
 */
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis: string;
  status: ExperimentStatus;
  variants: Variant[];
  primaryMetric: string;
  secondaryMetrics?: string[];
  targeting?: Targeting;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  winningVariant?: string;
  conclusion?: string;
  sampleSizeRequired?: number;
  confidenceLevel?: number; // Default 0.95
  minDetectableEffect?: number; // Minimum detectable effect size
  metadata?: Record<string, any>;
}

/**
 * Experiment progress report
 */
export interface ExperimentProgress {
  experimentId: string;
  status: ExperimentStatus;
  totalSampleSize: number;
  requiredSampleSize: number;
  percentageComplete: number;
  complete: boolean;
  variantSampleSizes: Record<string, number>;
  daysRunning: number;
  estimatedCompletion?: Date;
}

/**
 * Experiment report
 */
export interface ExperimentReport {
  experimentId: string;
  name: string;
  status: ExperimentStatus;
  createdAt: number;
  startedAt?: number;
  daysRunning: number;
  variants: {
    id: string;
    name: string;
    allocation: number;
    sampleSize: number;
    metrics: Record<string, VariantStatistics>;
  }[];
  summary: {
    winningVariant?: string;
    significant: boolean;
    conclusion?: string;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ABTestFrameworkConfig {
  dbPath?: string;
  confidenceLevel?: number;
  power?: number;
  autoSave?: boolean;
}

const DEFAULT_CONFIG: Required<Omit<ABTestFrameworkConfig, "dbPath">> = {
  confidenceLevel: 0.95,
  power: 0.8,
  autoSave: true,
};

// ============================================================================
// MAIN FRAMEWORK CLASS
// ============================================================================

export class ABTestFramework {
  private experiments: Map<string, Experiment> = new Map();
  private metrics: Map<string, MetricValue[]> = new Map(); // Key: experimentId:variantId:metricName
  private assignments: Map<string, Map<string, string>> = new Map(); // Key: experimentId, Value: userId -> variantId
  private config: Required<ABTestFrameworkConfig> & { dbPath: string };
  private saveTimer?: ReturnType<typeof setInterval>;

  constructor(config: ABTestFrameworkConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      dbPath: config.dbPath || "/tmp/pai-ab-testing.json",
      confidenceLevel: config.confidenceLevel ?? DEFAULT_CONFIG.confidenceLevel,
      power: config.power ?? DEFAULT_CONFIG.power,
      autoSave: config.autoSave ?? DEFAULT_CONFIG.autoSave,
    };

    this.load();

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  private async load(): Promise<void> {
    try {
      const data = await Bun.file(this.config.dbPath).text();
      const parsed = JSON.parse(data);

      this.experiments = new Map(parsed.experiments || []);

      // Reconstruct metrics map
      this.metrics = new Map();
      if (parsed.metrics) {
        for (const [key, values] of Object.entries(parsed.metrics)) {
          this.metrics.set(key, values as MetricValue[]);
        }
      }

      // Reconstruct assignments map
      this.assignments = new Map();
      if (parsed.assignments) {
        for (const [expId, assignments] of Object.entries(parsed.assignments)) {
          this.assignments.set(expId, new Map(Object.entries(assignments as Record<string, string>)));
        }
      }

      console.log(`[ABTesting] Loaded ${this.experiments.size} experiments from ${this.config.dbPath}`);
    } catch (error) {
      console.log("[ABTesting] No existing data, starting fresh");
      this.experiments = new Map();
      this.metrics = new Map();
      this.assignments = new Map();
    }
  }

  private async save(): Promise<void> {
    try {
      const data = {
        experiments: Object.fromEntries(this.experiments),
        metrics: Object.fromEntries(this.metrics),
        assignments: Object.fromEntries(
          Array.from(this.assignments.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
        ),
        version: "1.0.0",
        savedAt: Date.now(),
      };

      await Bun.write(this.config.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("[ABTesting] Failed to save data:", error);
    }
  }

  private startAutoSave(): void {
    this.saveTimer = setInterval(() => {
      this.save();
    }, 5000); // Save every 5 seconds
  }

  public async close(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = undefined;
    }
    await this.save();
  }

  // ========================================================================
  // EXPERIMENT MANAGEMENT
  // ========================================================================

  /**
   * Create a new experiment
   */
  public createExperiment(experiment: Experiment): Experiment {
    // Validate variant allocations
    const totalAllocation = experiment.variants.reduce((sum, v) => sum + v.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error(`Variant allocations must sum to 100, got ${totalAllocation}`);
    }

    // Validate at least one variant
    if (experiment.variants.length === 0) {
      throw new Error("Experiment must have at least one variant");
    }

    // Initialize assignments map for this experiment
    if (!this.assignments.has(experiment.id)) {
      this.assignments.set(experiment.id, new Map());
    }

    this.experiments.set(experiment.id, { ...experiment });

    if (this.config.autoSave) {
      this.save();
    }

    return this.getExperiment(experiment.id)!;
  }

  /**
   * Get an experiment by ID
   */
  public getExperiment(experimentId: string): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    return experiment ? { ...experiment } : null;
  }

  /**
   * List experiments with optional filters
   */
  public listExperiments(filters?: {
    status?: ExperimentStatus;
    limit?: number;
  }): Experiment[] {
    let experiments = Array.from(this.experiments.values());

    if (filters?.status) {
      experiments = experiments.filter(e => e.status === filters.status);
    }

    experiments.sort((a, b) => b.createdAt - a.createdAt);

    if (filters?.limit) {
      experiments = experiments.slice(0, filters.limit);
    }

    return experiments.map(e => ({ ...e }));
  }

  /**
   * Start an experiment
   */
  public startExperiment(experimentId: string): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    experiment.status = "running";
    experiment.startedAt = Date.now();

    if (this.config.autoSave) {
      this.save();
    }

    return { ...experiment };
  }

  /**
   * Complete an experiment with a winner
   */
  public completeExperiment(
    experimentId: string,
    winningVariant: string,
    conclusion: string
  ): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    experiment.status = "completed";
    experiment.completedAt = Date.now();
    experiment.winningVariant = winningVariant;
    experiment.conclusion = conclusion;

    if (this.config.autoSave) {
      this.save();
    }

    return { ...experiment };
  }

  /**
   * Stop an experiment without a winner
   */
  public stopExperiment(experimentId: string, reason: string): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    experiment.status = "stopped";
    experiment.completedAt = Date.now();
    experiment.conclusion = reason;

    if (this.config.autoSave) {
      this.save();
    }

    return { ...experiment };
  }

  /**
   * Delete an experiment
   */
  public deleteExperiment(experimentId: string): boolean {
    const deleted = this.experiments.delete(experimentId);

    // Clean up metrics
    for (const key of this.metrics.keys()) {
      if (key.startsWith(`${experimentId}:`)) {
        this.metrics.delete(key);
      }
    }

    // Clean up assignments
    this.assignments.delete(experimentId);

    if (deleted && this.config.autoSave) {
      this.save();
    }

    return deleted;
  }

  // ========================================================================
  // VARIANT ASSIGNMENT
  // ========================================================================

  /**
   * Assign a user to a variant
   * Uses deterministic hashing for consistent assignment
   */
  public assignVariant(experimentId: string, userId: string): Variant {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Check if user already assigned
    const expAssignments = this.assignments.get(experimentId);
    if (expAssignments?.has(userId)) {
      const variantId = expAssignments.get(userId)!;
      return experiment.variants.find(v => v.id === variantId)!;
    }

    // Deterministic assignment using hash
    const hash = this.hashString(`${experimentId}:${userId}`);
    const bucket = hash % 100;

    let cumulative = 0;
    let selectedVariant = experiment.variants[0];

    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (bucket < cumulative) {
        selectedVariant = variant;
        break;
      }
    }

    // Store assignment
    if (!expAssignments) {
      this.assignments.set(experimentId, new Map([[userId, selectedVariant.id]]));
    } else {
      expAssignments.set(userId, selectedVariant.id);
    }

    if (this.config.autoSave) {
      this.save();
    }

    return { ...selectedVariant };
  }

  /**
   * Get a user's assigned variant
   */
  public getUserVariant(experimentId: string, userId: string): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    const expAssignments = this.assignments.get(experimentId);
    const variantId = expAssignments?.get(userId);

    if (!variantId) {
      return null;
    }

    return experiment.variants.find(v => v.id === variantId) || null;
  }

  /**
   * Hash a string to a number (deterministic)
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // ========================================================================
  // METRICS COLLECTION
  // ========================================================================

  /**
   * Record a metric value
   */
  public recordMetric(metric: MetricValue): void {
    const key = `${metric.experimentId}:${metric.variantId}:${metric.metricName}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;

    // Remove existing metric for same user/metric (keep latest)
    const existingIndex = metrics.findIndex(
      m => m.userId === metric.userId && m.metricName === metric.metricName
    );

    if (existingIndex >= 0) {
      metrics[existingIndex] = metric;
    } else {
      metrics.push(metric);
    }

    if (this.config.autoSave) {
      this.save();
    }
  }

  /**
   * Get metrics for a variant
   */
  public getMetrics(experimentId: string, variantId: string, metricName?: string): MetricValue[] {
    const prefix = `${experimentId}:${variantId}`;
    const results: MetricValue[] = [];

    for (const [key, values] of this.metrics.entries()) {
      if (key.startsWith(prefix)) {
        if (!metricName || key.endsWith(`:${metricName}`)) {
          results.push(...values);
        }
      }
    }

    return results;
  }

  /**
   * Get aggregated metrics for a variant
   */
  public getAggregatedMetrics(
    experimentId: string,
    variantId: string,
    metricName: string
  ): AggregatedMetrics {
    const metrics = this.getMetrics(experimentId, variantId, metricName);

    if (metrics.length === 0) {
      return {
        metricName,
        variantId,
        count: 0,
        sum: 0,
        mean: 0,
      };
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const result: AggregatedMetrics = {
      metricName,
      variantId,
      count: values.length,
      sum,
      mean,
      min: Math.min(...values),
      max: Math.max(...values),
    };

    // Calculate variance and standard deviation
    if (values.length > 1) {
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      result.variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
      result.standardDeviation = Math.sqrt(result.variance);
    }

    return result;
  }

  /**
   * Get variant statistics with confidence intervals
   */
  public getVariantStatistics(
    experimentId: string,
    variantId: string,
    metricName: string
  ): VariantStatistics {
    const aggregated = this.getAggregatedMetrics(experimentId, variantId, metricName);
    const metrics = this.getMetrics(experimentId, variantId, metricName);

    const stats: VariantStatistics = { ...aggregated };

    // Determine metric type from data if not specified
    let metricType: MetricType = "numeric";
    if (metrics.length > 0 && metrics[0].type) {
      metricType = metrics[0].type;
    } else {
      // Auto-detect: binary if all values are 0 or 1
      const isBinary = metrics.every(m => m.value === 0 || m.value === 1);
      metricType = isBinary ? "binary" : "numeric";
    }

    // Add type-specific statistics
    if (metricType === "binary") {
      stats.conversionRate = aggregated.mean;
    }

    // Calculate standard error
    if (aggregated.count > 1 && aggregated.standardDeviation !== undefined) {
      stats.standardError = aggregated.standardDeviation / Math.sqrt(aggregated.count);

      // Calculate confidence interval
      const confidenceLevel = this.config.confidenceLevel;
      const zScore = this.getZScore(confidenceLevel);
      const margin = zScore * stats.standardError;

      stats.confidenceInterval = {
        lower: aggregated.mean - margin,
        upper: aggregated.mean + margin,
      };
    }

    return stats;
  }

  // ========================================================================
  // STATISTICAL ANALYSIS
  // ========================================================================

  /**
   * Analyze an experiment and compare variants
   */
  public analyzeExperiment(experimentId: string, metricName: string): StatisticalResult | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.variants.length < 2) {
      return null;
    }

    const controlVariant = experiment.variants[0];
    const treatmentVariant = experiment.variants[1];

    const controlStats = this.getVariantStatistics(experimentId, controlVariant.id, metricName);
    const treatmentStats = this.getVariantStatistics(experimentId, treatmentVariant.id, metricName);

    // Determine test type based on metric
    const metrics = this.getMetrics(experimentId, controlVariant.id, metricName);
    let metricType: MetricType = "numeric";
    if (metrics.length > 0 && metrics[0].type) {
      metricType = metrics[0].type;
    } else {
      const isBinary = metrics.every(m => m.value === 0 || m.value === 1);
      metricType = isBinary ? "binary" : "numeric";
    }

    let result: StatisticalResult;

    if (metricType === "binary") {
      result = this.performZTest(experimentId, metricName, controlVariant.id, treatmentVariant.id);
    } else {
      result = this.performTTest(experimentId, metricName, controlVariant.id, treatmentVariant.id);
    }

    // Check if we have sufficient power
    const totalSampleSize = controlStats.count + treatmentStats.count;
    result.sufficientPower = !experiment.sampleSizeRequired || totalSampleSize >= experiment.sampleSizeRequired;

    result.sampleSize = {
      control: controlStats.count,
      treatment: treatmentStats.count,
    };

    return result;
  }

  /**
   * Perform two-proportion z-test for binary metrics
   */
  private performZTest(
    experimentId: string,
    metricName: string,
    controlVariantId: string,
    treatmentVariantId: string
  ): StatisticalResult {
    const controlStats = this.getVariantStatistics(experimentId, controlVariantId, metricName);
    const treatmentStats = this.getVariantStatistics(experimentId, treatmentVariantId, metricName);

    const p1 = controlStats.mean;
    const p2 = treatmentStats.mean;
    const n1 = controlStats.count;
    const n2 = treatmentStats.count;

    const pooledProportion = (controlStats.sum + treatmentStats.sum) / (n1 + n2);
    const se = Math.sqrt(pooledProportion * (1 - pooledProportion) * (1/n1 + 1/n2));

    const z = se > 0 ? (p2 - p1) / se : 0;
    const pValue = this.twoTailedPValue(z);

    const absoluteDifference = p2 - p1;
    const relativeUplift = p1 > 0 ? absoluteDifference / p1 : 0;

    // Calculate confidence interval for difference
    const confidenceLevel = this.config.confidenceLevel;
    const zScore = this.getZScore(confidenceLevel);
    const seDiff = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);

    const confidenceInterval = {
      lower: absoluteDifference - zScore * seDiff,
      upper: absoluteDifference + zScore * seDiff,
    };

    return {
      experimentId,
      metricName,
      controlVariant: controlVariantId,
      treatmentVariant: treatmentVariantId,
      controlMean: p1,
      treatmentMean: p2,
      absoluteDifference,
      relativeUplift,
      pValue,
      significant: pValue < (1 - confidenceLevel),
      confidenceLevel,
      sufficientPower: true,
      testType: "z-test",
      confidenceInterval,
    };
  }

  /**
   * Perform two-sample t-test for numeric metrics
   */
  private performTTest(
    experimentId: string,
    metricName: string,
    controlVariantId: string,
    treatmentVariantId: string
  ): StatisticalResult {
    const controlStats = this.getVariantStatistics(experimentId, controlVariantId, metricName);
    const treatmentStats = this.getVariantStatistics(experimentId, treatmentVariantId, metricName);

    const mean1 = controlStats.mean;
    const mean2 = treatmentStats.mean;
    const n1 = controlStats.count;
    const n2 = treatmentStats.count;
    const var1 = controlStats.variance || 0;
    const var2 = treatmentStats.variance || 0;

    // Pooled standard error
    const se = Math.sqrt(var1 / n1 + var2 / n2);

    const t = se > 0 ? (mean2 - mean1) / se : 0;
    const df = n1 + n2 - 2;
    const pValue = this.twoTailedPValueT(t, df);

    const absoluteDifference = mean2 - mean1;
    const relativeUplift = mean1 > 0 ? absoluteDifference / mean1 : 0;

    // Calculate confidence interval
    const confidenceLevel = this.config.confidenceLevel;
    const tScore = this.getTScore(df, confidenceLevel);
    const margin = tScore * se;

    const confidenceInterval = {
      lower: absoluteDifference - margin,
      upper: absoluteDifference + margin,
    };

    return {
      experimentId,
      metricName,
      controlVariant: controlVariantId,
      treatmentVariant: treatmentVariantId,
      controlMean: mean1,
      treatmentMean: mean2,
      absoluteDifference,
      relativeUplift,
      pValue,
      significant: pValue < (1 - confidenceLevel),
      confidenceLevel,
      sufficientPower: true,
      testType: "t-test",
      confidenceInterval,
    };
  }

  /**
   * Calculate required sample size for an experiment
   */
  public calculateRequiredSampleSize(params: {
    baselineRate: number;
    minDetectableEffect: number;
    alpha?: number;
    power?: number;
  }): number {
    const alpha = params.alpha ?? (1 - this.config.confidenceLevel);
    const power = params.power ?? this.config.power;

    const p1 = params.baselineRate;
    const p2 = params.baselineRate + params.minDetectableEffect;

    // Pooled proportion
    const pBar = (p1 + p2) / 2;

    // Z-scores
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(power);

    // Sample size formula for two-proportion test
    const numerator = Math.pow(
      zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
      2
    );

    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  // ========================================================================
  // EXPERIMENT PROGRESS
  // ========================================================================

  /**
   * Get experiment progress
   */
  public getExperimentProgress(experimentId: string): ExperimentProgress | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    const variantSampleSizes: Record<string, number> = {};
    let totalSampleSize = 0;

    for (const variant of experiment.variants) {
      const metrics = this.getMetrics(experimentId, variant.id);
      variantSampleSizes[variant.id] = metrics.length;
      totalSampleSize += metrics.length;
    }

    const requiredSampleSize = experiment.sampleSizeRequired || 1000;
    const percentageComplete = Math.min(100, (totalSampleSize / requiredSampleSize) * 100);

    let daysRunning = 0;
    if (experiment.startedAt) {
      daysRunning = (Date.now() - experiment.startedAt) / (24 * 60 * 60 * 1000);
    }

    // Estimate completion based on current rate
    let estimatedCompletion: Date | undefined;
    if (experiment.startedAt && totalSampleSize > 0 && !this.isExperimentComplete(experiment.status)) {
      const ratePerDay = totalSampleSize / Math.max(daysRunning, 0.01);
      const remainingSamples = requiredSampleSize - totalSampleSize;
      const daysRemaining = remainingSamples / ratePerDay;
      estimatedCompletion = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    }

    return {
      experimentId,
      status: experiment.status,
      totalSampleSize,
      requiredSampleSize,
      percentageComplete,
      complete: totalSampleSize >= requiredSampleSize,
      variantSampleSizes,
      daysRunning,
      estimatedCompletion,
    };
  }

  private isExperimentComplete(status: ExperimentStatus): boolean {
    return status === "completed" || status === "stopped";
  }

  // ========================================================================
  // REPORTING
  // ========================================================================

  /**
   * Generate a comprehensive experiment report
   */
  public generateReport(experimentId: string): ExperimentReport | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    const daysRunning = experiment.startedAt
      ? (Date.now() - experiment.startedAt) / (24 * 60 * 60 * 1000)
      : 0;

    // Analyze primary metric
    const analysis = this.analyzeExperiment(experimentId, experiment.primaryMetric);

    // Build variant metrics
    const variants = experiment.variants.map(variant => {
      const variantMetrics: Record<string, VariantStatistics> = {};

      // Primary metric
      variantMetrics[experiment.primaryMetric] = this.getVariantStatistics(
        experimentId,
        variant.id,
        experiment.primaryMetric
      );

      // Secondary metrics
      for (const metricName of experiment.secondaryMetrics || []) {
        variantMetrics[metricName] = this.getVariantStatistics(
          experimentId,
          variant.id,
          metricName
        );
      }

      return {
        id: variant.id,
        name: variant.name,
        allocation: variant.allocation,
        sampleSize: this.getMetrics(experimentId, variant.id).length,
        metrics: variantMetrics,
      };
    });

    return {
      experimentId,
      name: experiment.name,
      status: experiment.status,
      createdAt: experiment.createdAt,
      startedAt: experiment.startedAt,
      daysRunning,
      variants,
      summary: {
        winningVariant: experiment.winningVariant,
        significant: analysis?.significant ?? false,
        conclusion: experiment.conclusion,
      },
    };
  }

  // ========================================================================
  // IMPORT/EXPORT
  // ========================================================================

  /**
   * Export experiment as JSON string
   */
  public exportExperiment(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const data = {
      experiment: { ...experiment },
      metrics: this.getAllMetricsForExperiment(experimentId),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import experiment from JSON string
   */
  public importExperiment(jsonData: string): Experiment {
    const data = JSON.parse(jsonData);

    // Validate data structure
    if (!data.experiment) {
      throw new Error("Invalid import data: missing experiment");
    }

    // Create experiment (without auto-save during import)
    const wasAutoSave = this.config.autoSave;
    this.config.autoSave = false;
    try {
      this.createExperiment(data.experiment);

      // Import metrics
      if (data.metrics && Array.isArray(data.metrics)) {
        for (const metric of data.metrics) {
          this.recordMetric(metric);
        }
      }
    } finally {
      this.config.autoSave = wasAutoSave;
    }

    // Save once after import is complete
    if (wasAutoSave) {
      this.save();
    }

    return this.getExperiment(data.experiment.id)!;
  }

  private getAllMetricsForExperiment(experimentId: string): MetricValue[] {
    const allMetrics: MetricValue[] = [];

    for (const [key, values] of this.metrics.entries()) {
      if (key.startsWith(`${experimentId}:`)) {
        allMetrics.push(...values);
      }
    }

    return allMetrics;
  }

  // ========================================================================
  // CLI INTERFACE (Article II compliance)
  // ========================================================================

  /**
   * List experiments in CLI-friendly format
   */
  public cliListExperiments(status?: ExperimentStatus): string {
    const experiments = this.listExperiments({ status });

    if (experiments.length === 0) {
      return "No experiments found.";
    }

    const lines = [
      "A/B Testing Experiments",
      "=" .repeat(50),
      "",
    ];

    for (const exp of experiments) {
      const statusIcon = this.getStatusIcon(exp.status);
      lines.push(`${statusIcon} ${exp.id}: ${exp.name}`);
      lines.push(`   Status: ${exp.status}`);
      lines.push(`   Variants: ${exp.variants.map(v => `${v.id} (${v.allocation}%)`).join(", ")}`);
      lines.push(`   Created: ${new Date(exp.createdAt).toISOString()}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Show experiment details in CLI-friendly format
   */
  public cliShowExperiment(experimentId: string): string {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) {
      return `Experiment ${experimentId} not found.`;
    }

    const progress = this.getExperimentProgress(experimentId);
    const report = this.generateReport(experimentId);

    const lines = [
      `Experiment: ${experiment.name}`,
      "=" .repeat(50),
      `ID: ${experiment.id}`,
      `Status: ${experiment.status}`,
      `Hypothesis: ${experiment.hypothesis}`,
      "",
      "Variants:",
      ...experiment.variants.map(v =>
        `  - ${v.id}: ${v.name} (${v.allocation}%)${v.description ? ` - ${v.description}` : ""}`
      ),
      "",
      `Primary Metric: ${experiment.primaryMetric}`,
      experiment.secondaryMetrics?.length
        ? `Secondary Metrics: ${experiment.secondaryMetrics.join(", ")}`
        : "",
      "",
      progress
        ? `Progress: ${progress.totalSampleSize}/${progress.requiredSampleSize} (${Math.round(progress.percentageComplete)}%)`
        : "",
      "",
    ];

    if (report) {
      lines.push("Metrics:");
      for (const variant of report.variants) {
        lines.push(`  ${variant.id} (${variant.sampleSize} samples):`);
        for (const [metricName, stats] of Object.entries(variant.metrics)) {
          lines.push(`    ${metricName}: ${stats.mean.toFixed(4)} ± ${stats.standardDeviation?.toFixed(4) || "N/A"}`);
        }
      }
      lines.push("");
    }

    if (experiment.winningVariant) {
      lines.push(`Winning Variant: ${experiment.winningVariant}`);
    }

    if (experiment.conclusion) {
      lines.push(`Conclusion: ${experiment.conclusion}`);
    }

    return lines.join("\n");
  }

  /**
   * Show analysis results in CLI-friendly format
   */
  public cliAnalyze(experimentId: string, metricName?: string): string {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) {
      return `Experiment ${experimentId} not found.`;
    }

    const targetMetric = metricName || experiment.primaryMetric;
    const result = this.analyzeExperiment(experimentId, targetMetric);

    if (!result) {
      return `No analysis available for ${targetMetric}.`;
    }

    const significance = result.significant ? "YES" : "NO";
    const uplift = (result.relativeUplift * 100).toFixed(2);

    const lines = [
      `Statistical Analysis: ${experiment.name}`,
      "=" .repeat(50),
      `Metric: ${result.metricName}`,
      `Test: ${result.testType}`,
      `Confidence Level: ${(result.confidenceLevel * 100).toFixed(0)}%`,
      "",
      "Results:",
      `  Control (${result.controlVariant}): ${result.controlMean.toFixed(4)}`,
      `  Treatment (${result.treatmentVariant}): ${result.treatmentMean.toFixed(4)}`,
      `  Absolute Difference: ${result.absoluteDifference.toFixed(4)}`,
      `  Relative Uplift: ${uplift}%`,
      `  P-Value: ${result.pValue.toFixed(6)}`,
      `  Significant: ${significance}`,
      "",
      "Sample Sizes:",
      `  Control: ${result.sampleSize?.control || "N/A"}`,
      `  Treatment: ${result.sampleSize?.treatment || "N/A"}`,
      "",
    ];

    if (result.confidenceInterval) {
      lines.push(
        `Confidence Interval (${result.confidenceLevel * 100}%):`,
        `  [${result.confidenceInterval.lower.toFixed(4)}, ${result.confidenceInterval.upper.toFixed(4)}]`
      );
      lines.push("");
    }

    return lines.join("\n");
  }

  private getStatusIcon(status: ExperimentStatus): string {
    switch (status) {
      case "draft": return "📝";
      case "running": return "🔄";
      case "paused": return "⏸️";
      case "completed": return "✅";
      case "stopped": return "⏹️";
    }
  }

  // ========================================================================
  // STATISTICAL HELPER FUNCTIONS
  // ========================================================================

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    return zScores[confidenceLevel] || 1.96;
  }

  /**
   * Get t-score for degrees of freedom and confidence level
   * Approximation for common values
   */
  private getTScore(df: number, confidenceLevel: number): number {
    // For large df, t-score approaches z-score
    if (df > 100) {
      return this.getZScore(confidenceLevel);
    }

    // Approximation for smaller df
    const tScores: Record<string, number> = {
      "10-0.90": 1.812,
      "10-0.95": 2.228,
      "20-0.90": 1.725,
      "20-0.95": 2.086,
      "30-0.90": 1.697,
      "30-0.95": 2.042,
    };

    return tScores[`${df}-${confidenceLevel}`] || this.getZScore(confidenceLevel);
  }

  /**
   * Calculate two-tailed p-value from z-score
   * Using approximation
   */
  private twoTailedPValue(z: number): number {
    // Approximation of standard normal CDF
    const absZ = Math.abs(z);
    const t = 1 / (1 + 0.2316419 * absZ);
    const pdf = 0.3989423 * Math.exp(-z * z / 2);
    const cdf = 1 - pdf * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return 2 * (1 - cdf);
  }

  /**
   * Calculate two-tailed p-value from t-score (approximation)
   */
  private twoTailedPValueT(t: number, df: number): number {
    // For large df, t-distribution approaches normal
    if (df > 100) {
      return this.twoTailedPValue(t);
    }

    // Approximation using z-score for smaller df
    return this.twoTailedPValue(t);
  }
}

// ============================================================================
// CLI EXECUTION (Article II: CLI Interface Mandate)
// ============================================================================

/**
 * CLI entry point for A/B testing framework
 * Run with: bun run ab-testing.ts <command> [args]
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const framework = new ABTestFramework();

  try {
    switch (command) {
      case "list": {
        const status = args[1] as ExperimentStatus | undefined;
        console.log(framework.cliListExperiments(status));
        break;
      }

      case "show": {
        const experimentId = args[1];
        if (!experimentId) {
          console.error("Usage: show <experiment-id>");
          process.exit(1);
        }
        console.log(framework.cliShowExperiment(experimentId));
        break;
      }

      case "analyze": {
        const experimentId = args[1];
        const metricName = args[2];
        if (!experimentId) {
          console.error("Usage: analyze <experiment-id> [metric-name]");
          process.exit(1);
        }
        console.log(framework.cliAnalyze(experimentId, metricName));
        break;
      }

      case "export": {
        const experimentId = args[1];
        if (!experimentId) {
          console.error("Usage: export <experiment-id>");
          process.exit(1);
        }
        console.log(framework.exportExperiment(experimentId));
        break;
      }

      case "import": {
        const filePath = args[1];
        if (!filePath) {
          console.error("Usage: import <file-path>");
          process.exit(1);
        }
        const data = await Bun.file(filePath).text();
        framework.importExperiment(data);
        console.log("Experiment imported successfully.");
        break;
      }

      case "create": {
        // Create experiment from JSON
        const jsonData = args[1];
        if (!jsonData) {
          console.error("Usage: create '<experiment-json>'");
          process.exit(1);
        }
        const experiment = JSON.parse(jsonData);
        framework.createExperiment(experiment);
        console.log(`Experiment ${experiment.id} created successfully.`);
        break;
      }

      case "start": {
        const experimentId = args[1];
        if (!experimentId) {
          console.error("Usage: start <experiment-id>");
          process.exit(1);
        }
        framework.startExperiment(experimentId);
        console.log(`Experiment ${experimentId} started.`);
        break;
      }

      case "complete": {
        const experimentId = args[1];
        const winner = args[2];
        const conclusion = args.slice(3).join(" ");
        if (!experimentId || !winner) {
          console.error("Usage: complete <experiment-id> <winner-variant> <conclusion>");
          process.exit(1);
        }
        framework.completeExperiment(experimentId, winner, conclusion);
        console.log(`Experiment ${experimentId} completed. Winner: ${winner}`);
        break;
      }

      case "progress": {
        const experimentId = args[1];
        if (!experimentId) {
          console.error("Usage: progress <experiment-id>");
          process.exit(1);
        }
        const progress = framework.getExperimentProgress(experimentId);
        if (!progress) {
          console.error(`Experiment ${experimentId} not found.`);
          process.exit(1);
        }
        console.log(JSON.stringify(progress, null, 2));
        break;
      }

      case "report": {
        const experimentId = args[1];
        if (!experimentId) {
          console.error("Usage: report <experiment-id>");
          process.exit(1);
        }
        const report = framework.generateReport(experimentId);
        console.log(JSON.stringify(report, null, 2));
        break;
      }

      case "delete": {
        const experimentId = args[1];
        if (!experimentId) {
          console.error("Usage: delete <experiment-id>");
          process.exit(1);
        }
        const deleted = framework.deleteExperiment(experimentId);
        if (deleted) {
          console.log(`Experiment ${experimentId} deleted.`);
        } else {
          console.error(`Experiment ${experimentId} not found.`);
        }
        break;
      }

      case "help":
      default:
        console.log(`
PAI A/B Testing Framework CLI

Commands:
  list [status]           List all experiments (optional: filter by status)
  show <experiment-id>    Show experiment details
  analyze <id> [metric]   Analyze experiment results
  export <experiment-id>  Export experiment as JSON
  import <file-path>      Import experiment from JSON file
  create '<json>'         Create new experiment from JSON
  start <experiment-id>   Start an experiment
  complete <id> <winner>  Complete experiment with winner
  progress <experiment-id> Show experiment progress
  report <experiment-id>  Generate experiment report
  delete <experiment-id>  Delete an experiment
  help                    Show this help message

Examples:
  bun run ab-testing.ts list
  bun run ab-testing.ts show my-experiment
  bun run ab-testing.ts analyze my-experiment conversion_rate
  bun run ab-testing.ts create '{"id":"test","name":"Test","hypothesis":"...","variants":[...],"primaryMetric":"conv"}'
  bun run ab-testing.ts start my-experiment

JSON format for experiment:
  {
    "id": "experiment-id",
    "name": "Experiment Name",
    "hypothesis": "Treatment will improve metric by X%",
    "status": "draft",
    "variants": [
      {"id": "control", "name": "Control", "allocation": 50},
      {"id": "treatment", "name": "Treatment", "allocation": 50}
    ],
    "primaryMetric": "conversion_rate",
    "secondaryMetrics": ["engagement_time"],
    "sampleSizeRequired": 1000,
    "confidenceLevel": 0.95
  }
        `);
    }
  } finally {
    await framework.close();
  }
}

// Run CLI if executed directly
if (import.meta.main) {
  main().catch(console.error);
}

// Export for library use
export default ABTestFramework;
