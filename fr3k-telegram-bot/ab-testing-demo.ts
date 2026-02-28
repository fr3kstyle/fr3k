#!/usr/bin/env bun
/**
 * A/B Testing Framework Demo
 *
 * Demonstrates the complete A/B testing workflow
 */

import { ABTestFramework } from "./ab-testing.js";

async function main() {
  console.log("=== PAI A/B Testing Framework Demo ===\n");

  // Initialize framework
  const framework = new ABTestFramework({
    dbPath: "/tmp/pai-ab-demo.json",
    confidenceLevel: 0.95,
  });

  try {
    // ========================================================================
    // 1. Create an experiment
    // ========================================================================
    console.log("1. Creating experiment...");

    framework.createExperiment({
      id: "demo-experiment",
      name: "Demo Button Color Test",
      description: "Testing if green button increases conversions",
      hypothesis: "Green button will increase conversion rate by 5%",
      status: "running",
      variants: [
        { id: "control", name: "Blue Button", allocation: 50, config: { color: "blue" } },
        { id: "treatment", name: "Green Button", allocation: 50, config: { color: "green" } },
      ],
      primaryMetric: "conversion_rate",
      secondaryMetrics: ["click_rate", "engagement_time"],
      createdAt: Date.now(),
      startedAt: Date.now(),
      sampleSizeRequired: 500,
      confidenceLevel: 0.95,
    });

    console.log("   OK Experiment created\n");

    // ========================================================================
    // 2. Assign users to variants
    // ========================================================================
    console.log("2. Assigning users to variants...");

    const assignments: Record<string, string[]> = { control: [], treatment: [] };

    for (let i = 0; i < 100; i++) {
      const userId = "user-" + i;
      const variant = framework.assignVariant("demo-experiment", userId);
      assignments[variant.id].push(userId);
    }

    console.log("   OK Control: " + assignments.control.length + " users");
    console.log("   OK Treatment: " + assignments.treatment.length + " users\n");

    // ========================================================================
    // 3. Record metrics (simulated data)
    // ========================================================================
    console.log("3. Recording metrics...");

    // Control: 20% conversion rate
    for (const userId of assignments.control) {
      framework.recordMetric({
        experimentId: "demo-experiment",
        variantId: "control",
        userId: userId,
        metricName: "conversion_rate",
        value: Math.random() < 0.20 ? 1 : 0,
        timestamp: Date.now(),
        type: "binary",
      });
    }

    // Treatment: 28% conversion rate (40% relative lift)
    for (const userId of assignments.treatment) {
      framework.recordMetric({
        experimentId: "demo-experiment",
        variantId: "treatment",
        userId: userId,
        metricName: "conversion_rate",
        value: Math.random() < 0.28 ? 1 : 0,
        timestamp: Date.now(),
        type: "binary",
      });
    }

    console.log("   OK Metrics recorded\n");

    // ========================================================================
    // 4. Get statistics
    // ========================================================================
    console.log("4. Getting variant statistics...");

    const controlStats = framework.getVariantStatistics("demo-experiment", "control", "conversion_rate");
    const treatmentStats = framework.getVariantStatistics("demo-experiment", "treatment", "conversion_rate");

    const controlRate = (controlStats.conversionRate! * 100).toFixed(1);
    const treatmentRate = (treatmentStats.conversionRate! * 100).toFixed(1);

    console.log("   OK Control: " + controlRate + "% conversion");
    console.log("   OK Treatment: " + treatmentRate + "% conversion\n");

    // ========================================================================
    // 5. Analyze experiment
    // ========================================================================
    console.log("5. Analyzing experiment...");

    const result = framework.analyzeExperiment("demo-experiment", "conversion_rate");

    const absDiff = (result!.absoluteDifference * 100).toFixed(1);
    const relUplift = (result!.relativeUplift * 100).toFixed(1);

    console.log("   OK Absolute Difference: " + absDiff + "%");
    console.log("   OK Relative Uplift: " + relUplift + "%");
    console.log("   OK P-Value: " + result!.pValue.toFixed(6));
    console.log("   OK Significant: " + (result!.significant ? "YES" : "NO"));
    console.log("   OK Test Type: " + result!.testType);

    if (result!.confidenceInterval) {
      const ciLower = (result!.confidenceInterval.lower * 100).toFixed(1);
      const ciUpper = (result!.confidenceInterval.upper * 100).toFixed(1);
      console.log("   OK 95% CI: [" + ciLower + "%, " + ciUpper + "%]");
    }
    console.log("");

    // ========================================================================
    // 6. Check progress
    // ========================================================================
    console.log("6. Checking experiment progress...");

    const progress = framework.getExperimentProgress("demo-experiment");
    console.log("   OK Sample Size: " + progress!.totalSampleSize + "/" + progress!.requiredSampleSize);
    console.log("   OK Complete: " + (progress!.complete ? "YES" : "NO") + " (" + Math.round(progress!.percentageComplete) + "%)");
    console.log("");

    // ========================================================================
    // 7. Generate report
    // ========================================================================
    console.log("7. Generating report...");

    const report = framework.generateReport("demo-experiment");
    console.log("   OK Report generated with " + report!.variants.length + " variants");
    console.log("");

    // ========================================================================
    // 8. Complete experiment
    // ========================================================================
    if (result!.significant) {
      console.log("8. Experiment is significant! Completing with winner...");

      framework.completeExperiment(
        "demo-experiment",
        "treatment",
        "Green button showed " + relUplift + "% lift in conversions (p=" + result!.pValue.toFixed(4) + ")"
      );

      console.log("   OK Experiment completed\n");
    } else {
      console.log("8. Experiment not significant. Stopping...");

      framework.stopExperiment("demo-experiment", "No significant difference detected");

      console.log("   OK Experiment stopped\n");
    }

    // ========================================================================
    // 9. CLI output example
    // ========================================================================
    console.log("9. CLI-style output:");
    console.log(framework.cliListExperiments());

  } finally {
    await framework.close();
  }

  console.log("\n=== Demo Complete ===");
}

main().catch(console.error);
