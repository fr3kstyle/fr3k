#!/usr/bin/env bun
/**
 * Anomaly Detector - ML-based pattern analysis for bug prediction
 * Uses isolation forest algorithm and statistical process control
 */

interface AnomalyPattern {
  id: string;
  pattern: number[];          // Feature vector
  severity: 'low' | 'medium' | 'high';
  frequency: number;          // How often this pattern occurs
  last_seen: number;
  bug_occurred: boolean;      // Whether this pattern led to a bug
}

interface DetectionResult {
  is_anomaly: boolean;
  confidence: number;         // 0-1
  pattern_id: string | null;
  likely_bug_type: string | null;
  recommended_action: string | null;
}

class AnomalyDetector {
  private patterns: AnomalyPattern[] = [];
  private isolationForest: IsolationForest;
  private featureDim = 7; // Matches health metrics count

  constructor() {
    this.isolationForest = new IsolationForest(this.featureDim, 100);
  }

  async train(patterns: AnomalyPattern[]): Promise<void> {
    console.log('🧠 Training Anomaly Detector...');
    this.patterns = patterns;

    const featureVectors = patterns.map(p => p.pattern);
    this.isolationForest.train(featureVectors);

    console.log(`✅ Trained on ${patterns.length} patterns`);
  }

  async detect(metrics: number[]): Promise<DetectionResult> {
    // Ensure we have 7 features
    if (metrics.length !== this.featureDim) {
      throw new Error(`Expected ${this.featureDim} features, got ${metrics.length}`);
    }

    // Check isolation forest anomaly score
    const anomalyScore = this.isolationForest.score(metrics);

    // Find similar patterns
    const similarPattern = this.findSimilarPattern(metrics);

    // Determine if anomaly
    const isAnomaly = anomalyScore > 0.6 || similarPattern?.bug_occurred;

    let likelyBugType: string | null = null;
    let recommendedAction: string | null = null;

    if (similarPattern?.bug_occurred) {
      likelyBugType = this.inferBugType(metrics, similarPattern);
      recommendedAction = this.getRecommendedAction(likelyBugType);
    }

    return {
      is_anomaly: isAnomaly,
      confidence: anomalyScore,
      pattern_id: similarPattern?.id || null,
      likely_bug_type: likelyBugType,
      recommended_action: recommendedAction
    };
  }

  private findSimilarPattern(metrics: number[]): AnomalyPattern | null {
    let bestMatch: AnomalyPattern | null = null;
    let bestSimilarity = 0.8; // Threshold

    for (const pattern of this.patterns) {
      const similarity = this.cosineSimilarity(metrics, pattern.pattern);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private inferBugType(metrics: number[], pattern: AnomalyPattern): string {
    // Infer bug type based on which metrics are anomalous
    const threshold = 2.0; // Z-score threshold

    const metricNames = ['cpu', 'memory', 'error_rate', 'response_time', 'queue', 'deadlock', 'anomaly'];

    for (let i = 0; i < metrics.length; i++) {
      if (metrics[i] > threshold) {
        switch (metricNames[i]) {
          case 'memory':
            return 'memory_leak';
          case 'cpu':
            return 'infinite_loop';
          case 'deadlock':
            return 'deadlock';
          case 'error_rate':
            return 'exception_handling';
          case 'response_time':
            return 'performance_degradation';
          case 'queue':
            return 'resource_exhaustion';
        }
      }
    }

    return 'unknown';
  }

  private getRecommendedAction(bugType: string): string {
    const actions: { [key: string]: string } = {
      'memory_leak': 'Check for unclosed connections and large object retention',
      'infinite_loop': 'Review loop conditions and recursion base cases',
      'deadlock': 'Analyze lock acquisition order and add timeouts',
      'exception_handling': 'Add try-catch blocks and improve error handling',
      'performance_degradation': 'Profile hot paths and optimize algorithms',
      'resource_exhaustion': 'Implement connection pooling and rate limiting',
      'unknown': 'Conduct full system audit'
    };

    return actions[bugType] || 'Investigate manually';
  }

  async recordPattern(metrics: number[], bugOccurred: boolean, severity: AnomalyPattern['severity']): Promise<void> {
    const pattern: AnomalyPattern = {
      id: crypto.randomUUID(),
      pattern: metrics,
      severity,
      frequency: 1,
      last_seen: Date.now(),
      bug_occurred: bugOccurred
    };

    // Check if pattern already exists
    const existing = this.findSimilarPattern(metrics);

    if (existing && existing.bug_occurred === bugOccurred) {
      existing.frequency++;
      existing.last_seen = Date.now();
    } else {
      this.patterns.push(pattern);
    }
  }

  async getPatternStats(): Promise<{
    total_patterns: number;
    bug_patterns: number;
    safe_patterns: number;
    high_severity: number;
  }> {
    return {
      total_patterns: this.patterns.length,
      bug_patterns: this.patterns.filter(p => p.bug_occurred).length,
      safe_patterns: this.patterns.filter(p => !p.bug_occurred).length,
      high_severity: this.patterns.filter(p => p.severity === 'high').length
    };
  }
}

/**
 * Isolation Forest Implementation
 * Efficient anomaly detection using random forests
 */
class IsolationForest {
  private trees: IsolationTree[];
  private numTrees: number;
  private subSamplingSize: number;

  constructor(numFeatures: number, numTrees: number = 100) {
    this.numTrees = numTrees;
    this.subSamplingSize = Math.min(256, numFeatures * 2);
    this.trees = [];
  }

  train(data: number[][]): void {
    console.log(`🌲 Training Isolation Forest (${this.numTrees} trees)...`);

    this.trees = [];

    for (let i = 0; i < this.numTrees; i++) {
      // Subsample data
      const sample = this.subsample(data);
      const tree = new IsolationTree();
      tree.fit(sample);
      this.trees.push(tree);
    }

    console.log('✅ Isolation Forest trained');
  }

  private subsample(data: number[][]): number[][] {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(this.subSamplingSize, data.length));
  }

  score(instance: number[]): number {
    // Path length averaged across all trees
    let totalPathLength = 0;

    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(instance);
    }

    const avgPathLength = totalPathLength / this.trees.length;

    // Normalize to 0-1 (shorter path = more anomalous)
    const maxPathLength = Math.log2(this.subSamplingSize);
    const normalizedScore = 1 - Math.pow(2, -avgPathLength / maxPathLength);

    return normalizedScore;
  }
}

class IsolationTree {
  private root: IsolationTreeNode | null = null;
  private maxDepth: number = Math.log2(256); // Default subsample size

  fit(data: number[][]): void {
    this.root = this.buildTree(data, 0);
  }

  private buildTree(data: number[][], depth: number): IsolationTreeNode | null {
    // Stopping conditions
    if (data.length <= 1 || depth >= this.maxDepth) {
      return { type: 'external', size: data.length, depth };
    }

    // Split on random feature
    const numFeatures = data[0].length;
    const splitFeature = Math.floor(Math.random() * numFeatures);

    // Get feature values
    const featureValues = data.map(d => d[splitFeature]);
    const minVal = Math.min(...featureValues);
    const maxVal = Math.max(...featureValues);

    // If all values are the same, make external node
    if (minVal === maxVal) {
      return { type: 'external', size: data.length, depth };
    }

    // Random split value
    const splitValue = minVal + Math.random() * (maxVal - minVal);

    // Partition data
    const leftData = data.filter(d => d[splitFeature] < splitValue);
    const rightData = data.filter(d => d[splitFeature] >= splitValue);

    const node: IsolationTreeNode = {
      type: 'internal',
      splitFeature,
      splitValue,
      left: null,
      right: null,
      depth
    };

    node.left = this.buildTree(leftData, depth + 1);
    node.right = this.buildTree(rightData, depth + 1);

    return node;
  }

  pathLength(instance: number[]): number {
    return this.pathLengthHelper(instance, this.root, 0);
  }

  private pathLengthHelper(instance: number[], node: IsolationTreeNode | null, depth: number): number {
    if (!node || node.type === 'external') {
      // Adjust for external node size
      if (node && node.type === 'external') {
        const c = this.harmonic(node.size);
        return depth + c;
      }
      return depth;
    }

    if (instance[node.splitFeature] < node.splitValue) {
      return this.pathLengthHelper(instance, node.left, depth + 1);
    } else {
      return this.pathLengthHelper(instance, node.right, depth + 1);
    }
  }

  private harmonic(n: number): number {
    // Expected path length for unsuccessful search
    if (n <= 1) return 0;
    if (n === 2) return 1;

    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

type IsolationTreeNode = {
  type: 'internal' | 'external';
  depth: number;
} & (
  | { type: 'internal'; splitFeature: number; splitValue: number; left: IsolationTreeNode | null; right: IsolationTreeNode | null }
  | { type: 'external'; size: number }
);

// Export for use by self-healing coordinator
export { AnomalyDetector, DetectionResult, AnomalyPattern };

// Test if run directly
if (import.meta.main) {
  const detector = new AnomalyDetector();

  // Train on some dummy patterns
  const patterns: AnomalyPattern[] = [
    {
      id: '1',
      pattern: [0.3, 0.4, 0.1, 200, 5, 0.01, 0.1], // Normal
      severity: 'low',
      frequency: 100,
      last_seen: Date.now(),
      bug_occurred: false
    },
    {
      id: '2',
      pattern: [0.95, 0.98, 25, 8000, 150, 0.9, 0.95], // Memory leak bug
      severity: 'high',
      frequency: 5,
      last_seen: Date.now(),
      bug_occurred: true
    }
  ];

  await detector.train(patterns);

  // Test detection
  const normalMetrics = [0.35, 0.45, 0.2, 250, 8, 0.02, 0.15];
  const anomalousMetrics = [0.92, 0.95, 20, 7500, 120, 0.85, 0.9];

  console.log('\n🔍 Testing Anomaly Detection:');
  console.log('Normal metrics:', await detector.detect(normalMetrics));
  console.log('Anomalous metrics:', await detector.detect(anomalousMetrics));

  console.log('\n✅ Anomaly Detector loaded');
}
