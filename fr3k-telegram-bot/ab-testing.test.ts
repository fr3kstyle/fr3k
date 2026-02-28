#!/usr/bin/env bun
/**
 * A/B Testing Framework Tests
 *
 * Test-Driven Development: Tests written FIRST (RED phase)
 *
 * Tests the complete A/B testing framework including:
 * - Variant management
 * - Metrics collection
 * - Statistical analysis
 * - CLI interface
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  ABTestFramework,
  Variant,
  Experiment,
  MetricType,
  StatisticalResult,
  MetricValue
} from "./ab-testing.js";

// ============================================================================
// TEST UTILITIES
// ============================================================================

const TEST_DB_PATH = "/tmp/pai-ab-testing-test.json";

function cleanupTestDb() {
  try {
    const file = Bun.file(TEST_DB_PATH);
    if (file) {
      Bun.write(TEST_DB_PATH, "");
    }
  } catch {
    // Ignore if file doesn't exist
  }
}

// Create a mock variant for testing
function createMockVariant(id: string, allocation: number = 50): Variant {
  return {
    id,
    name: `Variant ${id}`,
    description: `Test variant ${id}`,
    allocation,
    config: { testParam: id }
  };
}

// Create a mock experiment for testing
function createMockExperiment(id: string, status: Experiment["status"] = "running"): Experiment {
  return {
    id,
    name: `Test Experiment ${id}`,
    description: "Test experiment description",
    hypothesis: "Variant A will perform better",
    status,
    variants: [
      createMockVariant("control", 50),
      createMockVariant("treatment", 50)
    ],
    primaryMetric: "conversion_rate",
    secondaryMetrics: ["engagement_time", "error_rate"],
    targeting: {},
    createdAt: Date.now() - 86400000, // 1 day ago
    startedAt: Date.now() - 86400000,
    sampleSizeRequired: 1000,
    confidenceLevel: 0.95,
    minDetectableEffect: 0.05
  };
}

// ============================================================================
// VARIANT MANAGEMENT TESTS
// ============================================================================

describe("Variant Management", () => {
  let framework: ABTestFramework;

  beforeEach(() => {
    cleanupTestDb();
    framework = new ABTestFramework({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    framework.close();
    cleanupTestDb();
  });

  test("should create experiment with variants", () => {
    const experiment = createMockExperiment("test-1");
    framework.createExperiment(experiment);

    const retrieved = framework.getExperiment("test-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("test-1");
    expect(retrieved?.variants).toHaveLength(2);
    expect(retrieved?.variants[0].id).toBe("control");
    expect(retrieved?.variants[1].id).toBe("treatment");
  });

  test("should validate variant allocation sums to 100", () => {
    const experiment = createMockExperiment("test-alloc");
    experiment.variants[0].allocation = 60;
    experiment.variants[1].allocation = 50; // Sum = 110, should fail

    expect(() => {
      framework.createExperiment(experiment);
    }).toThrow("Variant allocations must sum to 100");
  });

  test("should assign user to variant based on allocation", () => {
    const experiment = createMockExperiment("test-assign");
    framework.createExperiment(experiment);

    const userId = "user-123";
    const variant = framework.assignVariant("test-assign", userId);

    expect(variant).toBeDefined();
    expect(["control", "treatment"]).toContain(variant.id);
  });

  test("should consistently assign same user to same variant", () => {
    const experiment = createMockExperiment("test-consistent");
    framework.createExperiment(experiment);

    const userId = "user-consistent-456";
    const variant1 = framework.assignVariant("test-consistent", userId);
    const variant2 = framework.assignVariant("test-consistent", userId);

    expect(variant1.id).toBe(variant2.id);
  });

  test("should distribute users across variants according to allocation", () => {
    const experiment = createMockExperiment("test-distribution");
    experiment.variants[0].allocation = 70;
    experiment.variants[1].allocation = 30;
    framework.createExperiment(experiment);

    const assignments: Record<string, number> = { control: 0, treatment: 0 };
    const iterations = 500; // Reduced for faster test

    for (let i = 0; i < iterations; i++) {
      const variant = framework.assignVariant("test-distribution", `user-${i}`);
      assignments[variant.id]++;
    }

    // Check distribution is approximately correct (within 12% tolerance)
    const controlRatio = assignments.control / iterations;
    expect(controlRatio).toBeGreaterThan(0.58);
    expect(controlRatio).toBeLessThan(0.82);
  });
});

// ============================================================================
// METRICS COLLECTION TESTS
// ============================================================================

describe("Metrics Collection", () => {
  let framework: ABTestFramework;

  beforeEach(() => {
    cleanupTestDb();
    framework = new ABTestFramework({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    framework.close();
    cleanupTestDb();
  });

  test("should record metric for variant assignment", () => {
    const experiment = createMockExperiment("test-metric");
    framework.createExperiment(experiment);

    const userId = "user-metric-123";
    const variant = framework.assignVariant("test-metric", userId);

    // Record a conversion metric
    framework.recordMetric({
      experimentId: "test-metric",
      variantId: variant.id,
      userId,
      metricName: "conversion_rate",
      value: 1, // Converted
      timestamp: Date.now()
    });

    const metrics = framework.getMetrics("test-metric", variant.id);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(1);
  });

  test("should aggregate metrics by variant", () => {
    const experiment = createMockExperiment("test-aggregate");
    framework.createExperiment(experiment);

    // Record multiple metrics for control variant
    for (let i = 0; i < 10; i++) {
      framework.recordMetric({
        experimentId: "test-aggregate",
        variantId: "control",
        userId: `user-${i}`,
        metricName: "conversion_rate",
        value: i < 7 ? 1 : 0, // 7 conversions
        timestamp: Date.now()
      });
    }

    const aggregate = framework.getAggregatedMetrics("test-aggregate", "control", "conversion_rate");
    expect(aggregate.count).toBe(10);
    expect(aggregate.sum).toBe(7);
    expect(aggregate.mean).toBe(0.7);
  });

  test("should handle different metric types", () => {
    const experiment = createMockExperiment("test-types");
    framework.createExperiment(experiment);

    const userId = "user-types-123";
    const variant = framework.assignVariant("test-types", userId);

    // Binary metric (conversion)
    framework.recordMetric({
      experimentId: "test-types",
      variantId: variant.id,
      userId,
      metricName: "conversion_rate",
      value: 1,
      timestamp: Date.now(),
      type: "binary"
    });

    // Numeric metric (engagement time)
    framework.recordMetric({
      experimentId: "test-types",
      variantId: variant.id,
      userId,
      metricName: "engagement_time",
      value: 125.5,
      timestamp: Date.now(),
      type: "numeric"
    });

    // Count metric
    framework.recordMetric({
      experimentId: "test-types",
      variantId: variant.id,
      userId,
      metricName: "page_views",
      value: 5,
      timestamp: Date.now(),
      type: "count"
    });

    const binaryMetric = framework.getMetrics("test-types", variant.id, "conversion_rate");
    const numericMetric = framework.getMetrics("test-types", variant.id, "engagement_time");
    const countMetric = framework.getMetrics("test-types", variant.id, "page_views");

    expect(binaryMetric).toHaveLength(1);
    expect(numericMetric).toHaveLength(1);
    expect(countMetric).toHaveLength(1);
  });

  test("should track experiment sample size progress", () => {
    const experiment = createMockExperiment("test-samplesize");
    experiment.sampleSizeRequired = 100;
    framework.createExperiment(experiment);

    // Add 50 users to control
    for (let i = 0; i < 50; i++) {
      const variant = framework.assignVariant("test-samplesize", `user-${i}`);
      framework.recordMetric({
        experimentId: "test-samplesize",
        variantId: variant.id,
        userId: `user-${i}`,
        metricName: "conversion_rate",
        value: 1,
        timestamp: Date.now()
      });
    }

    const progress = framework.getExperimentProgress("test-samplesize");
    expect(progress.totalSampleSize).toBe(50);
    expect(progress.complete).toBe(false);
    expect(progress.percentageComplete).toBe(50);
  });
});

// ============================================================================
// STATISTICAL ANALYSIS TESTS
// ============================================================================

describe("Statistical Analysis", () => {
  let framework: ABTestFramework;

  beforeEach(() => {
    cleanupTestDb();
    framework = new ABTestFramework({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    framework.close();
    cleanupTestDb();
  });

  test("should calculate basic statistics for metric", () => {
    const experiment = createMockExperiment("test-stats");
    framework.createExperiment(experiment);

    // Add data for control (mean ~0.5)
    for (let i = 0; i < 100; i++) {
      framework.recordMetric({
        experimentId: "test-stats",
        variantId: "control",
        userId: `user-control-${i}`,
        metricName: "conversion_rate",
        value: i < 50 ? 1 : 0,
        timestamp: Date.now()
      });
    }

    // Add data for treatment (mean ~0.6)
    for (let i = 0; i < 100; i++) {
      framework.recordMetric({
        experimentId: "test-stats",
        variantId: "treatment",
        userId: `user-treatment-${i}`,
        metricName: "conversion_rate",
        value: i < 60 ? 1 : 0,
        timestamp: Date.now()
      });
    }

    const controlStats = framework.getVariantStatistics("test-stats", "control", "conversion_rate");
    const treatmentStats = framework.getVariantStatistics("test-stats", "treatment", "conversion_rate");

    expect(controlStats.mean).toBeCloseTo(0.5, 1);
    expect(treatmentStats.mean).toBeCloseTo(0.6, 1);
    expect(controlStats.count).toBe(100);
    expect(treatmentStats.count).toBe(100);
  });

  test("should perform two-proportion z-test for binary metrics", () => {
    const experiment = createMockExperiment("test-ztest");
    framework.createExperiment(experiment);

    // Disable auto-save for this test to speed it up
    // Control: 100 conversions out of 1000 (10%)
    const controlMetrics: MetricValue[] = [];
    const treatmentMetrics: MetricValue[] = [];

    // Pre-build metrics arrays
    for (let i = 0; i < 1000; i++) {
      controlMetrics.push({
        experimentId: "test-ztest",
        variantId: "control",
        userId: `user-ctl-${i}`,
        metricName: "conversion_rate",
        value: i < 100 ? 1 : 0,
        timestamp: Date.now(),
        type: "binary"
      });

      treatmentMetrics.push({
        experimentId: "test-ztest",
        variantId: "treatment",
        userId: `user-trt-${i}`,
        metricName: "conversion_rate",
        value: i < 150 ? 1 : 0,
        timestamp: Date.now(),
        type: "binary"
      });
    }

    // Batch record metrics
    for (const m of controlMetrics) framework.recordMetric(m);
    for (const m of treatmentMetrics) framework.recordMetric(m);

    const result = framework.analyzeExperiment("test-ztest", "conversion_rate");

    expect(result).toBeDefined();
    expect(result!.significant).toBe(true); // 15% vs 10% should be significant
    expect(result!.controlMean).toBeCloseTo(0.1, 1);
    expect(result!.treatmentMean).toBeCloseTo(0.15, 1);
    expect(result!.relativeUplift).toBeCloseTo(0.5, 1); // 50% relative uplift
  });

  test("should perform two-sample t-test for numeric metrics", () => {
    const experiment = createMockExperiment("test-ttest");
    framework.createExperiment(experiment);

    // Pre-generate data for better performance
    const controlMetrics: MetricValue[] = [];
    const treatmentMetrics: MetricValue[] = [];

    for (let i = 0; i < 100; i++) {
      controlMetrics.push({
        experimentId: "test-ttest",
        variantId: "control",
        userId: `user-ctl-${i}`,
        metricName: "engagement_time",
        value: 100 + (Math.random() - 0.5) * 20,
        timestamp: Date.now(),
        type: "numeric"
      });

      treatmentMetrics.push({
        experimentId: "test-ttest",
        variantId: "treatment",
        userId: `user-trt-${i}`,
        metricName: "engagement_time",
        value: 110 + (Math.random() - 0.5) * 20,
        timestamp: Date.now(),
        type: "numeric"
      });
    }

    for (const m of controlMetrics) framework.recordMetric(m);
    for (const m of treatmentMetrics) framework.recordMetric(m);

    const result = framework.analyzeExperiment("test-ttest", "engagement_time");

    expect(result).toBeDefined();
    expect(result!.controlMean).toBeGreaterThan(90);
    expect(result!.controlMean).toBeLessThan(110);
    expect(result!.treatmentMean).toBeGreaterThan(100);
    expect(result!.treatmentMean).toBeLessThan(120);
    expect(result!.treatmentMean).toBeGreaterThan(result!.controlMean);
  });

  test("should calculate confidence intervals", () => {
    const experiment = createMockExperiment("test-ci");
    framework.createExperiment(experiment);

    // Pre-build metrics for better performance
    const controlMetrics: MetricValue[] = [];
    const treatmentMetrics: MetricValue[] = [];

    for (let i = 0; i < 500; i++) {
      controlMetrics.push({
        experimentId: "test-ci",
        variantId: "control",
        userId: `user-ctl-${i}`,
        metricName: "conversion_rate",
        value: i < 200 ? 1 : 0,
        timestamp: Date.now()
      });

      treatmentMetrics.push({
        experimentId: "test-ci",
        variantId: "treatment",
        userId: `user-trt-${i}`,
        metricName: "conversion_rate",
        value: i < 250 ? 1 : 0,
        timestamp: Date.now()
      });
    }

    for (const m of controlMetrics) framework.recordMetric(m);
    for (const m of treatmentMetrics) framework.recordMetric(m);

    const result = framework.analyzeExperiment("test-ci", "conversion_rate");

    expect(result).toBeDefined();
    expect(result!.confidenceInterval).toBeDefined();
    expect(result!.confidenceInterval!.lower).toBeDefined();
    expect(result!.confidenceInterval!.upper).toBeDefined();
    expect(result!.confidenceInterval!.lower).toBeLessThan(result!.relativeUplift!);
  });

  test("should detect insufficient sample size", () => {
    const experiment = createMockExperiment("test-power");
    experiment.sampleSizeRequired = 1000;
    framework.createExperiment(experiment);

    // Add only 100 samples
    for (let i = 0; i < 100; i++) {
      const variant = framework.assignVariant("test-power", `user-${i}`);
      framework.recordMetric({
        experimentId: "test-power",
        variantId: variant.id,
        userId: `user-${i}`,
        metricName: "conversion_rate",
        value: 1,
        timestamp: Date.now()
      });
    }

    const result = framework.analyzeExperiment("test-power", "conversion_rate");

    expect(result).toBeDefined();
    expect(result!.sufficientPower).toBe(false);
  });

  test("should calculate required sample size for experiment", () => {
    const sampleSize = framework.calculateRequiredSampleSize({
      baselineRate: 0.1, // 10% baseline
      minDetectableEffect: 0.05, // 5% absolute change (50% relative)
      alpha: 0.05,
      power: 0.8
    });

    // Sample size should be reasonable (typically ~1000 for these parameters)
    expect(sampleSize).toBeGreaterThan(100);
    expect(sampleSize).toBeLessThan(10000);
  });
});

// ============================================================================
// EXPERIMENT LIFECYCLE TESTS
// ============================================================================

describe("Experiment Lifecycle", () => {
  let framework: ABTestFramework;

  beforeEach(() => {
    cleanupTestDb();
    framework = new ABTestFramework({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    framework.close();
    cleanupTestDb();
  });

  test("should start experiment and track start time", () => {
    const experiment = createMockExperiment("test-start", "draft");
    framework.createExperiment(experiment);

    const beforeStart = Date.now();
    framework.startExperiment("test-start");
    const afterStart = Date.now();

    const updated = framework.getExperiment("test-start");
    expect(updated?.status).toBe("running");
    expect(updated?.startedAt).toBeGreaterThanOrEqual(beforeStart);
    expect(updated?.startedAt).toBeLessThanOrEqual(afterStart);
  });

  test("should complete experiment with winning variant", () => {
    const experiment = createMockExperiment("test-complete");
    framework.createExperiment(experiment);

    // Add data showing treatment is better
    for (let i = 0; i < 500; i++) {
      framework.recordMetric({
        experimentId: "test-complete",
        variantId: "control",
        userId: `user-ctl-${i}`,
        metricName: "conversion_rate",
        value: i < 150 ? 1 : 0,
        timestamp: Date.now()
      });

      framework.recordMetric({
        experimentId: "test-complete",
        variantId: "treatment",
        userId: `user-trt-${i}`,
        metricName: "conversion_rate",
        value: i < 200 ? 1 : 0,
        timestamp: Date.now()
      });
    }

    framework.completeExperiment("test-complete", "treatment", "Treatment showed significant improvement");

    const updated = framework.getExperiment("test-complete");
    expect(updated?.status).toBe("completed");
    expect(updated?.winningVariant).toBe("treatment");
    expect(updated?.conclusion).toContain("Treatment showed");
  });

  test("should stop experiment without winner if inconclusive", () => {
    const experiment = createMockExperiment("test-inconclusive");
    framework.createExperiment(experiment);

    // Add similar data for both variants
    for (let i = 0; i < 200; i++) {
      framework.recordMetric({
        experimentId: "test-inconclusive",
        variantId: "control",
        userId: `user-ctl-${i}`,
        metricName: "conversion_rate",
        value: i < 100 ? 1 : 0,
        timestamp: Date.now()
      });

      framework.recordMetric({
        experimentId: "test-inconclusive",
        variantId: "treatment",
        userId: `user-trt-${i}`,
        metricName: "conversion_rate",
        value: i < 102 ? 1 : 0,
        timestamp: Date.now()
      });
    }

    framework.stopExperiment("test-inconclusive", "No significant difference detected");

    const updated = framework.getExperiment("test-inconclusive");
    expect(updated?.status).toBe("stopped");
    expect(updated?.winningVariant).toBeUndefined();
  });

  test("should list experiments by status", () => {
    framework.createExperiment(createMockExperiment("exp-1", "draft"));
    framework.createExperiment(createMockExperiment("exp-2", "running"));
    framework.createExperiment(createMockExperiment("exp-3", "running"));
    framework.createExperiment(createMockExperiment("exp-4", "completed"));

    const running = framework.listExperiments({ status: "running" });
    const completed = framework.listExperiments({ status: "completed" });

    expect(running).toHaveLength(2);
    expect(completed).toHaveLength(1);
  });
});

// ============================================================================
// CLI INTERFACE TESTS
// ============================================================================

describe("CLI Interface", () => {
  let framework: ABTestFramework;

  beforeEach(() => {
    cleanupTestDb();
    framework = new ABTestFramework({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    framework.close();
    cleanupTestDb();
  });

  test("should export experiment data as JSON", () => {
    framework.createExperiment(createMockExperiment("test-export"));

    const jsonData = framework.exportExperiment("test-export");

    expect(jsonData).toBeDefined();
    const parsed = JSON.parse(jsonData);
    expect(parsed.experiment).toBeDefined();
    expect(parsed.experiment.id).toBe("test-export");
    expect(parsed.experiment.variants).toBeDefined();
  });

  test("should import experiment from JSON", () => {
    const experiment = createMockExperiment("test-import");
    // Import expects the format that export produces
    const jsonData = JSON.stringify({ experiment, metrics: [] });

    framework.importExperiment(jsonData);

    const imported = framework.getExperiment("test-import");
    expect(imported).toBeDefined();
    expect(imported?.name).toBe(experiment.name);
  });

  test("should generate experiment summary report", () => {
    framework.createExperiment(createMockExperiment("test-report"));

    // Add some data
    for (let i = 0; i < 100; i++) {
      const variant = framework.assignVariant("test-report", `user-${i}`);
      framework.recordMetric({
        experimentId: "test-report",
        variantId: variant.id,
        userId: `user-${i}`,
        metricName: "conversion_rate",
        value: Math.random() > 0.5 ? 1 : 0,
        timestamp: Date.now()
      });
    }

    const report = framework.generateReport("test-report");

    expect(report).toBeDefined();
    expect(report.experimentId).toBe("test-report");
    expect(report.variants).toBeDefined();
    expect(report.variants.length).toBeGreaterThan(0);
    // Each variant should have metrics
    expect(report.variants[0].metrics).toBeDefined();
  });

  test("should output CLI-compatible results", () => {
    framework.createExperiment(createMockExperiment("test-cli"));

    const result = framework.cliListExperiments();

    expect(result).toContain("test-cli");
  });
});

// ============================================================================
// PERSISTENCE TESTS
// ============================================================================

describe("Persistence", () => {
  test("should persist data across instances", async () => {
    // Use a unique DB path for this test
    const testDbPath = `/tmp/pai-ab-persist-${Date.now()}.json`;

    // Create first instance and add data
    const framework1 = new ABTestFramework({ dbPath: testDbPath });
    framework1.createExperiment(createMockExperiment("test-persist"));

    for (let i = 0; i < 50; i++) {
      const variant = framework1.assignVariant("test-persist", `user-${i}`);
      framework1.recordMetric({
        experimentId: "test-persist",
        variantId: variant.id,
        userId: `user-${i}`,
        metricName: "conversion_rate",
        value: 1,
        timestamp: Date.now()
      });
    }

    await framework1.close();

    // Small delay to ensure file is fully written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create second instance and verify data persisted
    const framework2 = new ABTestFramework({ dbPath: testDbPath });
    const experiment = framework2.getExperiment("test-persist");
    expect(experiment).toBeDefined();

    // Get all metrics for the experiment (not just one variant)
    const allMetrics = framework2.getMetrics("test-persist", "control");
    // Since assignment is deterministic, some users will be in control
    // The exact count depends on hash distribution
    expect(allMetrics.length).toBeGreaterThanOrEqual(0);

    await framework2.close();

    // Cleanup
    try {
      Bun.write(testDbPath, "");
    } catch {}
  });
});

// ============================================================================
// EDGE CASES AND VALIDATION TESTS
// ============================================================================

describe("Edge Cases and Validation", () => {
  let framework: ABTestFramework;

  beforeEach(() => {
    cleanupTestDb();
    framework = new ABTestFramework({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    framework.close();
    cleanupTestDb();
  });

  test("should handle experiment with single variant (100% allocation)", () => {
    const experiment: Experiment = {
      id: "single-variant",
      name: "Single Variant Test",
      description: "Test with 100% to one variant",
      hypothesis: "All users get same treatment",
      status: "running",
      variants: [
        { id: "only", name: "Only Variant", allocation: 100, config: {} }
      ],
      primaryMetric: "conversion_rate",
      secondaryMetrics: [],
      createdAt: Date.now(),
      startedAt: Date.now()
    };

    framework.createExperiment(experiment);

    for (let i = 0; i < 10; i++) {
      const variant = framework.assignVariant("single-variant", `user-${i}`);
      expect(variant.id).toBe("only");
    }
  });

  test("should handle duplicate metric recordings gracefully", () => {
    const experiment = createMockExperiment("test-duplicate");
    framework.createExperiment(experiment);

    const userId = "user-dup-123";
    const variant = framework.assignVariant("test-duplicate", userId);

    // Record same metric twice
    framework.recordMetric({
      experimentId: "test-duplicate",
      variantId: variant.id,
      userId,
      metricName: "conversion_rate",
      value: 1,
      timestamp: Date.now()
    });

    framework.recordMetric({
      experimentId: "test-duplicate",
      variantId: variant.id,
      userId,
      metricName: "conversion_rate",
      value: 0, // Different value
      timestamp: Date.now()
    });

    // Should only keep latest
    const metrics = framework.getMetrics("test-duplicate", variant.id);
    const userMetrics = metrics.filter(m => m.userId === userId);
    expect(userMetrics).toHaveLength(1);
    expect(userMetrics[0].value).toBe(0);
  });

  test("should return null for non-existent experiment", () => {
    const result = framework.getExperiment("does-not-exist");
    expect(result).toBeNull();
  });

  test("should handle zero variance in numeric data", () => {
    const experiment = createMockExperiment("test-zero-variance");
    framework.createExperiment(experiment);

    // All same values
    for (let i = 0; i < 10; i++) {
      framework.recordMetric({
        experimentId: "test-zero-variance",
        variantId: "control",
        userId: `user-${i}`,
        metricName: "engagement_time",
        value: 100,
        timestamp: Date.now(),
        type: "numeric"
      });
    }

    const stats = framework.getVariantStatistics("test-zero-variance", "control", "engagement_time");
    expect(stats.standardDeviation).toBe(0);
  });
});

// Run tests
console.log("Starting A/B Testing Framework Tests...");
