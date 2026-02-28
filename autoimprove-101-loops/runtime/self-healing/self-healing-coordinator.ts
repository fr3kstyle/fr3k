#!/usr/bin/env bun
/**
 * Self-Healing Coordinator - Orchestrates automatic bug detection and repair
 * Integrates health monitor, anomaly detector, patch generator, and sandbox validator
 */

import { HealthMonitor, HealthMetrics } from './health-monitor.ts';
import { AnomalyDetector, DetectionResult } from './anomaly-detector.ts';
import { PatchGenerator, BugReport, PatchCandidate } from './patch-generator.ts';
import { SandboxValidator, PatchTestCase } from './sandbox-validator.ts';

interface HealingEvent {
  id: string;
  timestamp: number;
  type: 'anomaly_detected' | 'bug_found' | 'patch_generated' | 'patch_validated' | 'patch_applied' | 'rollback';
  details: any;
}

interface HealingStats {
  total_events: number;
  anomalies_detected: number;
  patches_generated: number;
  patches_applied: number;
  rollbacks_performed: number;
  bugs_fixed: number;
  mean_time_to_repair_ms: number;
  uptime_improvement_pct: number;
}

class SelfHealingCoordinator {
  private healthMonitor: HealthMonitor;
  private anomalyDetector: AnomalyDetector;
  private patchGenerator: PatchGenerator;
  private sandboxValidator: SandboxValidator;

  private eventLog: HealingEvent[] = [];
  private isActive = false;
  private monitoringInterval: number | null = null;

  // Performance targets
  private readonly BUG_DETECTION_TARGET = 0.85; // 85%
  private readonly PATCH_SUCCESS_TARGET = 0.70; // 70%
  private readonly MTTR_TARGET_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DOWNTIME_REDUCTION_TARGET = 0.50; // 50%

  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.anomalyDetector = new AnomalyDetector();
    this.patchGenerator = new PatchGenerator();
    this.sandboxValidator = new SandboxValidator();
  }

  async start(): Promise<void> {
    if (this.isActive) {
      console.log('⚠️ Self-healing already active');
      return;
    }

    console.log('\n🔧 Starting Self-Healing Coordinator...');

    // Train anomaly detector with historical patterns
    await this.trainAnomalyDetector();

    // Start health monitoring
    await this.healthMonitor.startMonitoring();

    // Start healing loop
    this.monitoringInterval = setInterval(() => {
      this.healingLoop();
    }, 10000) as unknown as number; // Check every 10 seconds

    this.isActive = true;
    this.logEvent('system_started', { timestamp: Date.now() });

    console.log('✅ Self-Healing Coordinator active');
    console.log(`   Detection target: ${(this.BUG_DETECTION_TARGET * 100).toFixed(0)}%`);
    console.log(`   Patch success target: ${(this.PATCH_SUCCESS_TARGET * 100).toFixed(0)}%`);
    console.log(`   MTTR target: ${(this.MTTR_TARGET_MS / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Downtime reduction target: ${(this.DOWNTIME_REDUCTION_TARGET * 100).toFixed(0)}%`);
  }

  async stop(): Promise<void> {
    if (!this.isActive) return;

    console.log('🛑 Stopping Self-Healing Coordinator...');

    await this.healthMonitor.stopMonitoring();

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isActive = false;
    console.log('✅ Self-Healing Coordinator stopped');
  }

  private async trainAnomalyDetector(): Promise<void> {
    // Load historical bug patterns
    const patterns = await this.loadHistoricalPatterns();
    await this.anomalyDetector.train(patterns);
    console.log('   ✅ Anomaly detector trained');
  }

  private async loadHistoricalPatterns(): Promise<any[]> {
    // In a real implementation, this would load from episodic memory
    // For now, return some dummy patterns
    return [
      {
        id: 'pattern-1',
        pattern: [0.3, 0.4, 0.1, 200, 5, 0.01, 0.1],
        severity: 'low',
        frequency: 100,
        last_seen: Date.now(),
        bug_occurred: false
      },
      {
        id: 'pattern-2',
        pattern: [0.95, 0.98, 25, 8000, 150, 0.9, 0.95],
        severity: 'high',
        frequency: 5,
        last_seen: Date.now(),
        bug_occurred: true
      }
    ];
  }

  private async healingLoop(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Get current health metrics
      const healthReport = await this.healthMonitor.getHealthReport();

      // Check for anomalies
      const metricsArray = this.metricsToArray(healthReport.current_metrics);
      const detectionResult = await this.anomalyDetector.detect(metricsArray);

      if (detectionResult.is_anomaly) {
        await this.handleAnomaly(healthReport.current_metrics, detectionResult);
      }
    } catch (error) {
      console.error(`❌ Healing loop error: ${(error as Error).message}`);
    }
  }

  private metricsToArray(metrics: HealthMetrics): number[] {
    return [
      metrics.cpu_usage,
      metrics.memory_usage,
      metrics.error_rate / 100, // Normalize to 0-1
      metrics.response_time / 10000, // Normalize to 0-1
      metrics.queue_depth / 200, // Normalize to 0-1
      metrics.deadlock_risk,
      metrics.anomaly_score
    ];
  }

  private async handleAnomaly(metrics: HealthMetrics, detection: DetectionResult): Promise<void> {
    const eventId = crypto.randomUUID();

    this.logEvent('anomaly_detected', {
      metrics,
      detection,
      confidence: detection.confidence
    });

    console.log(`\n🚨 Anomaly detected!`);
    console.log(`   Confidence: ${(detection.confidence * 100).toFixed(0)}%`);
    console.log(`   Likely bug type: ${detection.likely_bug_type || 'unknown'}`);
    console.log(`   Recommended: ${detection.recommended_action || 'Investigate'}`);

    // If high confidence anomaly, attempt auto-healing
    if (detection.confidence > 0.7 && detection.likely_bug_type) {
      await this.atendAutoHealing(metrics, detection, eventId);
    }
  }

  private async atendAutoHealing(
    metrics: HealthMetrics,
    detection: DetectionResult,
    eventId: string
  ): Promise<void> {
    const startTime = Date.now();

    // Create bug report
    const bugReport: BugReport = {
      id: eventId,
      error_message: `Anomaly detected: ${detection.likely_bug_type}`,
      stack_trace: [], // Would be populated from actual error
      file_path: '/unknown', // Would be determined from stack trace
      line_number: 0,
      bug_type: detection.likely_bug_type || 'unknown',
      severity: detection.confidence > 0.8 ? 'high' : 'medium'
    };

    this.logEvent('bug_found', { bugReport });

    // Generate patches
    console.log(`\n🔧 Generating patches...`);
    const patches = await this.patchGenerator.generatePatches(bugReport);

    this.logEvent('patch_generated', {
      bugId: bugReport.id,
      patchCount: patches.length
    });

    // Select best patch
    const bestPatch = await this.patchGenerator.selectBestPatch(patches);

    if (!bestPatch) {
      console.log('❌ No suitable patch found');
      return;
    }

    // Validate patch
    console.log(`\n🧪 Validating patch...`);
    const testCases = await this.generateTestCases(bugReport);
    const validationResult = await this.sandboxValidator.validatePatch(
      bestPatch.id,
      '', // Original code (would be loaded)
      '', // Patched code (would be generated)
      testCases
    );

    this.logEvent('patch_validated', {
      patchId: bestPatch.id,
      result: validationResult
    });

    // Apply patch if validation passed
    if (validationResult.passed && validationResult.overall_confidence > 0.7) {
      console.log(`\n✅ Patch validated, applying...`);
      await this.patchGenerator.applyPatch(bestPatch, bugReport.file_path);

      this.logEvent('patch_applied', {
        patchId: bestPatch.id,
        success: true
      });

      const timeToRepair = Date.now() - startTime;
      console.log(`🎉 Bug fixed in ${(timeToRepair / 1000).toFixed(1)}s`);

      // Record success in episodic memory
      await this.recordHealingSuccess(bugReport, bestPatch, timeToRepair);
    } else {
      console.log(`❌ Patch validation failed (confidence: ${(validationResult.overall_confidence * 100).toFixed(0)}%)`);
    }
  }

  private async generateTestCases(bugReport: BugReport): Promise<PatchTestCase[]> {
    // In a real implementation, this would generate test cases based on:
    // - The bug type
    // - The code context
    // - Existing test suite

    return [
      {
        name: 'Regression test',
        input: {},
        expected_output: {},
        timeout_ms: 5000
      }
    ];
  }

  private async recordHealingSuccess(
    bugReport: BugReport,
    patch: PatchCandidate,
    timeToRepair: number
  ): Promise<void> {
    // Store in episodic memory for learning
    // This would integrate with the existing vector-episodic-memory system

    const episode = {
      task: `Fix ${bugReport.bug_type} bug`,
      approach: patch.strategy,
      outcome: 'SUCCESS',
      lessons: [
        `Patch strategy ${patch.strategy} worked`,
        `Time to repair: ${timeToRepair}ms`,
        `Confidence: ${patch.confidence}`
      ],
      timestamp: Date.now()
    };

    // Would call: await episodicMemory.storeEpisode(...)
  }

  private logEvent(type: HealingEvent['type'], details: any): void {
    const event: HealingEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      details
    };

    this.eventLog.push(event);

    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog.shift();
    }
  }

  async getHealingStats(): Promise<HealingStats> {
    const anomalies = this.eventLog.filter(e => e.type === 'anomaly_detected');
    const patchesGenerated = this.eventLog.filter(e => e.type === 'patch_generated');
    const patchesApplied = this.eventLog.filter(e => e.type === 'patch_applied');
    const rollbacks = this.eventLog.filter(e => e.type === 'rollback');

    // Calculate mean time to repair
    const repairs = patchesApplied.filter(e => e.details.success);
    const mttr = repairs.length > 0
      ? repairs.reduce((sum, e) => sum + (e.details.timeToRepair || 0), 0) / repairs.length
      : 0;

    return {
      total_events: this.eventLog.length,
      anomalies_detected: anomalies.length,
      patches_generated: patchesGenerated.length,
      patches_applied: patchesApplied.length,
      rollbacks_performed: rollbacks.length,
      bugs_fixed: repairs.length,
      mean_time_to_repair_ms: mttr,
      uptime_improvement_pct: 0 // Would be calculated from actual uptime data
    };
  }

  async getHealthReport(): Promise<any> {
    return await this.healthMonitor.getHealthReport();
  }

  async getPatternStats(): Promise<any> {
    return await this.anomalyDetector.getPatternStats();
  }
}

// Export
export { SelfHealingCoordinator, HealingEvent, HealingStats };

// Start if run directly
if (import.meta.main) {
  const coordinator = new SelfHealingCoordinator();

  console.log('🚀 Starting Self-Healing System...\n');

  await coordinator.start();

  // Display stats every 60 seconds
  setInterval(async () => {
    const stats = await coordinator.getHealingStats();
    console.log('\n📊 Self-Healing Stats:');
    console.log(`   Events: ${stats.total_events}`);
    console.log(`   Anomalies detected: ${stats.anomalies_detected}`);
    console.log(`   Patches generated: ${stats.patches_generated}`);
    console.log(`   Patches applied: ${stats.patches_applied}`);
    console.log(`   Bugs fixed: ${stats.bugs_fixed}`);
    console.log(`   MTTR: ${(stats.mean_time_to_repair_ms / 1000).toFixed(1)}s`);
  }, 60000);

  console.log('\n✅ Self-Healing System running...');
  console.log('Press Ctrl+C to stop.\n');

  // Keep running
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await coordinator.stop();
    process.exit(0);
  });
}
