/**
 * Performance Tracker Hook
 * Logs metrics and analyzes patterns to suggest optimizations
 *
 * Trigger: Task completion
 * Priority: 3
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

interface HookContext {
  taskId: string;
  taskDescription: string;
  duration: number; // milliseconds
  success: boolean;
  timestamp: number;
}

interface PerformanceMetric {
  taskId: string;
  taskDescription: string;
  duration: number;
  success: boolean;
  timestamp: number;
  phase?: string;
  toolsUsed?: string[];
}

interface PerformanceInsight {
  type: 'optimization' | 'pattern' | 'anomaly';
  message: string;
  confidence: number; // 0-1
}

interface PerformanceTrackerConfig {
  enabled: boolean;
  logPath: string;
  retentionDays: number;
  analyzePattern: boolean;
  suggestionsEnabled: boolean;
}

const DEFAULT_CONFIG: PerformanceTrackerConfig = {
  enabled: true,
  logPath: '/tmp/fr3k-performance.json',
  retentionDays: 30,
  analyzePattern: true,
  suggestionsEnabled: true
};

/**
 * Load hook configuration
 */
function loadConfig(): PerformanceTrackerConfig {
  const configPath = join(process.env.HOME || '', '.claude', 'hooks.json');

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return {
      ...DEFAULT_CONFIG,
      ...config.settings?.['performance-tracker']
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Load performance metrics history
 */
function loadMetrics(): PerformanceMetric[] {
  const config = loadConfig();

  if (!existsSync(config.logPath)) {
    return [];
  }

  try {
    const data = readFileSync(config.logPath, 'utf-8');
    const metrics = JSON.parse(data);

    // Filter old metrics beyond retention period
    const cutoff = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    return metrics.filter((m: PerformanceMetric) => m.timestamp > cutoff);
  } catch {
    return [];
  }
}

/**
 * Save performance metric
 */
function saveMetric(metric: PerformanceMetric): void {
  const config = loadConfig();
  const metrics = loadMetrics();

  metrics.push(metric);

  try {
    writeFileSync(config.logPath, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch (error) {
    console.debug('Failed to save performance metric:', error);
  }
}

/**
 * Analyze performance patterns
 */
function analyzePatterns(metrics: PerformanceMetric[]): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];

  if (metrics.length < 5) {
    return insights; // Need more data
  }

  // Find slowest tasks (top 5%)
  const sortedByDuration = [...metrics].sort((a, b) => b.duration - a.duration);
  const slowThreshold = sortedByDuration[Math.floor(sortedByDuration.length * 0.05)]?.duration || 0;

  const slowTasks = metrics.filter(m => m.duration > slowThreshold);
  if (slowTasks.length > 0) {
    const avgSlowDuration = slowTasks.reduce((sum, m) => sum + m.duration, 0) / slowTasks.length;
    insights.push({
      type: 'pattern',
      message: `${slowTasks.length} tasks take >${Math.round(avgSlowDuration / 1000)}s on average. Consider breaking them into smaller tasks.`,
      confidence: 0.7
    });
  }

  // Find frequently failing tasks
  const failedTasks = metrics.filter(m => !m.success);
  if (failedTasks.length > 2) {
    const failureRate = failedTasks.length / metrics.length;
    if (failureRate > 0.2) {
      insights.push({
        type: 'anomaly',
        message: `${(failureRate * 100).toFixed(0)}% task failure rate detected. Review error patterns.`,
        confidence: 0.8
      });
    }
  }

  // Find task descriptions that repeat (opportunity for automation)
  const descriptionCounts = new Map<string, number>();
  metrics.forEach(m => {
    const desc = m.taskDescription.toLowerCase();
    descriptionCounts.set(desc, (descriptionCounts.get(desc) || 0) + 1);
  });

  const repeatTasks = [...descriptionCounts.entries()]
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  if (repeatTasks.length > 0) {
    const [topTask, count] = repeatTasks[0];
    insights.push({
      type: 'optimization',
      message: `"${topTask}" has been done ${count} times. Consider creating a skill or workflow.`,
      confidence: 0.9
    });
  }

  // Detect performance degradation (recent tasks slower than average)
  const recentMetrics = metrics.slice(-10);
  const olderMetrics = metrics.slice(0, -10);

  if (recentMetrics.length >= 5 && olderMetrics.length >= 5) {
    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const olderAvg = olderMetrics.reduce((sum, m) => sum + m.duration, 0) / olderMetrics.length;

    if (recentAvg > olderAvg * 1.5) {
      insights.push({
        type: 'anomaly',
        message: `Recent tasks ${(recentAvg / olderAvg).toFixed(1)}x slower than average. System may need optimization.`,
        confidence: 0.6
      });
    }
  }

  return insights;
}

/**
 * Send notification with insights
 */
async function notifyInsights(insights: PerformanceInsight[]): Promise<void> {
  if (insights.length === 0) return;

  console.log('\n📊 Performance Insights:');

  for (const insight of insights) {
    const emoji = insight.type === 'optimization' ? '💡' :
                  insight.type === 'pattern' ? '📈' : '⚠️';
    console.log(`${emoji} ${insight.message} (${(insight.confidence * 100).toFixed(0)}% confidence)`);
  }

  // Send to voice server if high confidence
  const topInsight = insights.sort((a, b) => b.confidence - a.confidence)[0];
  if (topInsight.confidence > 0.7) {
    try {
      const { execSync } = require('child_process');
      execSync(
        `curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d '${JSON.stringify({ message: `Performance tip: ${topInsight.message}`, voice_id: "21m00Tcm4TlvDq8ikWAM" })}'`,
        { stdio: 'ignore' }
      );
    } catch {
      // Voice server not available
    }
  }
}

/**
 * Main hook execution
 */
export async function execute(context: HookContext): Promise<void> {
  const config = loadConfig();

  if (!config.enabled) {
    return;
  }

  // Save metric
  const metric: PerformanceMetric = {
    taskId: context.taskId,
    taskDescription: context.taskDescription,
    duration: context.duration,
    success: context.success,
    timestamp: context.timestamp || Date.now()
  };

  saveMetric(metric);

  // Analyze patterns if enabled
  if (config.analyzePattern && config.suggestionsEnabled) {
    const metrics = loadMetrics();

    if (metrics.length >= 5) { // Need minimum data
      const insights = analyzePatterns(metrics);
      await notifyInsights(insights);
    }
  }

  // Log metric
  const durationSec = (context.duration / 1000).toFixed(1);
  const status = context.success ? '✅' : '❌';
  console.log(`${status} Task ${context.taskId} completed in ${durationSec}s`);
}

/**
 * Get performance summary
 */
export function getSummary(): {
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  topTaskTypes: string[];
} {
  const metrics = loadMetrics();

  if (metrics.length === 0) {
    return {
      totalTasks: 0,
      successRate: 0,
      avgDuration: 0,
      topTaskTypes: []
    };
  }

  const successful = metrics.filter(m => m.success).length;
  const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

  // Top task types
  const taskCounts = new Map<string, number>();
  metrics.forEach(m => {
    taskCounts.set(m.taskDescription, (taskCounts.get(m.taskDescription) || 0) + 1);
  });

  const topTaskTypes = [...taskCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([task, count]) => `${task} (${count})`);

  return {
    totalTasks: metrics.length,
    successRate: (successful / metrics.length) * 100,
    avgDuration,
    topTaskTypes
  };
}

// Hook metadata
export const metadata = {
  name: 'performance-tracker',
  description: 'Tracks task performance and suggests optimizations',
  trigger: 'task-complete',
  priority: 3,
  version: '1.0.0'
};
