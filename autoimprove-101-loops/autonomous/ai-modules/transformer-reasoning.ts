/**
 * Transformer Reasoning Module
 * Implements attention mechanisms and contextual reasoning
 */

export interface AttentionConfig {
  numHeads: number;
  headDim: number;
  dropout: number;
}

export interface ContextVector {
  embeddings: Float32Array;
  attentionWeights: Float32Array;
  metadata: Record<string, any>;
}

export class MultiHeadAttention {
  private numHeads: number;
  private headDim: number;
  private dropout: number;

  constructor(config: AttentionConfig) {
    this.numHeads = config.numHeads;
    this.headDim = config.headDim;
    this.dropout = config.dropout;
  }

  /**
   * Compute attention between query, key, and value vectors
   */
  attend(query: Float32Array, key: Float32Array, value: Float32Array): Float32Array {
    const scores = this.computeScores(query, key);
    const weights = this.softmax(scores);
    return this.applyAttention(weights, value);
  }

  private computeScores(query: Float32Array, key: Float32Array): Float32Array {
    const dim = Math.sqrt(query.length);
    const scores = new Float32Array(query.length);

    for (let i = 0; i < query.length; i++) {
      scores[i] = (query[i] * key[i]) / dim;
    }

    return scores;
  }

  private softmax(scores: Float32Array): Float32Array {
    const max = Math.max(...scores);
    const exp = scores.map(s => Math.exp(s - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return new Float32Array(exp.map(e => e / sum));
  }

  private applyAttention(weights: Float32Array, value: Float32Array): Float32Array {
    const result = new Float32Array(value.length);
    for (let i = 0; i < value.length; i++) {
      result[i] = weights[i] * value[i];
    }
    return result;
  }
}

export class TransformerReasoning {
  private attention: MultiHeadAttention;
  private contextHistory: ContextVector[] = [];
  private maxHistory: number = 100;

  constructor(config?: Partial<AttentionConfig>) {
    const defaultConfig: AttentionConfig = {
      numHeads: 8,
      headDim: 64,
      dropout: 0.1,
      ...config
    };
    this.attention = new MultiHeadAttention(defaultConfig);
  }

  /**
   * Process input with contextual attention
   */
  process(input: Float32Array): ContextVector {
    const context = this.buildContext(input);
    const attentionWeights = this.attention.attend(
      input,
      context,
      input
    );

    const result: ContextVector = {
      embeddings: input,
      attentionWeights,
      metadata: {
        timestamp: Date.now(),
        contextSize: this.contextHistory.length
      }
    };

    this.addToHistory(result);
    return result;
  }

  /**
   * Build context from history
   */
  private buildContext(input: Float32Array): Float32Array {
    if (this.contextHistory.length === 0) {
      return new Float32Array(input.length);
    }

    const context = new Float32Array(input.length);
    const recentContexts = this.contextHistory.slice(-10);

    for (let i = 0; i < input.length; i++) {
      let sum = 0;
      for (const ctx of recentContexts) {
        sum += ctx.embeddings[i];
      }
      context[i] = sum / recentContexts.length;
    }

    return context;
  }

  /**
   * Add context to history with size limit
   */
  private addToHistory(context: ContextVector): void {
    this.contextHistory.push(context);
    if (this.contextHistory.length > this.maxHistory) {
      this.contextHistory.shift();
    }
  }

  /**
   * Get contextual reasoning insights
   */
  getInsights(): {
    contextUtilization: number;
    attentionDistribution: number[];
    coherence: number;
  } {
    if (this.contextHistory.length === 0) {
      return {
        contextUtilization: 0,
        attentionDistribution: [],
        coherence: 0
      };
    }

    const latest = this.contextHistory[this.contextHistory.length - 1];
    const contextUtilization = this.contextHistory.length / this.maxHistory;

    const attentionDist = Array.from(latest.attentionWeights);
    const coherence = this.calculateCoherence();

    return {
      contextUtilization,
      attentionDistribution: attentionDist,
      coherence
    };
  }

  private calculateCoherence(): number {
    if (this.contextHistory.length < 2) return 1;

    let totalSim = 0;
    const recent = this.contextHistory.slice(-5);

    for (let i = 1; i < recent.length; i++) {
      totalSim += this.cosineSimilarity(
        recent[i - 1].embeddings,
        recent[i].embeddings
      );
    }

    return totalSim / (recent.length - 1);
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Clear context history
   */
  clearHistory(): void {
    this.contextHistory = [];
  }
}
