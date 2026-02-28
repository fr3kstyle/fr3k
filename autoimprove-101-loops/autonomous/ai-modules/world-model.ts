/**
 * World Model Module
 * Implements environment modeling and prediction
 */

export interface State {
  id: string;
  features: Float32Array;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Action {
  type: string;
  parameters: Record<string, any>;
}

export interface Transition {
  fromState: string;
  action: Action;
  toState: string;
  reward: number;
  probability: number;
}

export interface Prediction {
  expectedState: Float32Array;
  confidence: number;
  expectedReward: number;
  possibleOutcomes: Array<{ state: Float32Array; probability: number }>;
}

export class WorldModel {
  private states: Map<string, State> = new Map();
  private transitions: Transition[] = [];
  private stateGraph: Map<string, Map<string, number>> = new Map();
  private actionEffects: Map<string, Float32Array> = new Map();
  private maxHistory: number = 1000;

  /**
   * Add observed state to model
   */
  addState(state: State): void {
    this.states.set(state.id, state);
    this.pruneOldStates();
  }

  /**
   * Record transition between states
   */
  addTransition(transition: Transition): void {
    this.transitions.push(transition);

    // Update state graph
    if (!this.stateGraph.has(transition.fromState)) {
      this.stateGraph.set(transition.fromState, new Map());
    }
    const edgeMap = this.stateGraph.get(transition.fromState)!;
    const key = this.actionKey(transition.action);
    edgeMap.set(key, transition.toState);

    // Update action effects
    this.updateActionEffects(transition);

    this.pruneTransitions();
  }

  /**
   * Predict outcome of taking action from state
   */
  predict(stateId: string, action: Action): Prediction | null {
    const state = this.states.get(stateId);
    if (!state) return null;

    const actionKey = this.actionKey(action);
    const transitions = this.transitions.filter(
      t => t.fromState === stateId && this.actionKey(t.action) === actionKey
    );

    if (transitions.length === 0) {
      // Use learned action effects as fallback
      return this.predictFromEffects(state.features, action);
    }

    // Aggregate predictions from similar transitions
    const outcomes = this.aggregateOutcomes(transitions);
    const confidence = Math.min(1, transitions.length / 10);

    return {
      expectedState: this.averageState(outcomes.map(o => o.state)),
      confidence,
      expectedReward: outcomes.reduce((sum, o) => sum + o.probability * o.reward, 0),
      possibleOutcomes: outcomes
    };
  }

  /**
   * Get best predicted action from state
   */
  predictBestAction(stateId: string): {
    action: Action;
    prediction: Prediction;
  } | null {
    const state = this.states.get(stateId);
    if (!state) return null;

    const outgoing = this.stateGraph.get(stateId);
    if (!outgoing || outgoing.size === 0) return null;

    let bestAction: Action | null = null;
    let bestPrediction: Prediction | null = null;
    let bestValue = -Infinity;

    for (const [actionKey, toState] of outgoing) {
      const action = this.parseActionKey(actionKey);
      const prediction = this.predict(stateId, action);

      if (prediction && prediction.expectedReward > bestValue) {
        bestValue = prediction.expectedReward;
        bestAction = action;
        bestPrediction = prediction;
      }
    }

    if (!bestAction || !bestPrediction) return null;

    return { action: bestAction, prediction: bestPrediction };
  }

  /**
   * Simulate trajectory through world model
   */
  simulate(
    startState: string,
    actions: Action[],
    maxDepth: number = 10
  ): Array<{ state: string; action: Action; prediction: Prediction }> {
    const trajectory: Array<{ state: string; action: Action; prediction: Prediction }> = [];
    let currentState = startState;

    for (let i = 0; i < Math.min(actions.length, maxDepth); i++) {
      const prediction = this.predict(currentState, actions[i]);
      if (!prediction) break;

      trajectory.push({
        state: currentState,
        action: actions[i],
        prediction
      });

      // Find most similar next state
      currentState = this.findMostSimilarState(prediction.expectedState);
      if (!currentState) break;
    }

    return trajectory;
  }

  /**
   * Update model with new experience
   */
  update(transition: Transition): void {
    this.addTransition(transition);
    this.refinePredictions(transition);
  }

  /**
   * Get model statistics
   */
  getStats(): {
    totalStates: number;
    totalTransitions: number;
    averageBranching: number;
    modelCoverage: number;
  } {
    let totalBranches = 0;
    for (const edges of this.stateGraph.values()) {
      totalBranches += edges.size;
    }

    const avgBranching = this.stateGraph.size > 0
      ? totalBranches / this.stateGraph.size
      : 0;

    const modelCoverage = this.states.size > 0
      ? this.transitions.length / (this.states.size * this.states.size)
      : 0;

    return {
      totalStates: this.states.size,
      totalTransitions: this.transitions.length,
      averageBranching: avgBranching,
      modelCoverage: Math.min(1, modelCoverage)
    };
  }

  // Private helper methods

  private actionKey(action: Action): string {
    return `${action.type}:${JSON.stringify(action.parameters)}`;
  }

  private parseActionKey(key: string): Action {
    const [type, params] = key.split(':');
    return { type, parameters: JSON.parse(params) };
  }

  private updateActionEffects(transition: Transition): void {
    const fromState = this.states.get(transition.fromState);
    const toState = this.states.get(transition.toState);

    if (!fromState || !toState) return;

    const effect = new Float32Array(fromState.features.length);
    for (let i = 0; i < effect.length; i++) {
      effect[i] = toState.features[i] - fromState.features[i];
    }

    const key = this.actionKey(transition.action);
    const existing = this.actionEffects.get(key);

    if (existing) {
      // Update with exponential moving average
      for (let i = 0; i < effect.length; i++) {
        existing[i] = existing[i] * 0.8 + effect[i] * 0.2;
      }
    } else {
      this.actionEffects.set(key, effect);
    }
  }

  private predictFromEffects(state: Float32Array, action: Action): Prediction {
    const key = this.actionKey(action);
    const effect = this.actionEffects.get(key);

    if (!effect) {
      return {
        expectedState: state,
        confidence: 0,
        expectedReward: 0,
        possibleOutcomes: []
      };
    }

    const predictedState = new Float32Array(state.length);
    for (let i = 0; i < state.length; i++) {
      predictedState[i] = state[i] + (effect[i] || 0);
    }

    return {
      expectedState: predictedState,
      confidence: 0.5,
      expectedReward: 0,
      possibleOutcomes: [{ state: predictedState, probability: 1.0 }]
    };
  }

  private aggregateOutcomes(transitions: Transition[]): Array<{
    state: Float32Array;
    probability: number;
    reward: number;
  }> {
    const outcomes: Array<{ state: Float32Array; probability: number; reward: number }> = [];

    for (const t of transitions) {
      const toState = this.states.get(t.toState);
      if (toState) {
        outcomes.push({
          state: toState.features,
          probability: t.probability,
          reward: t.reward
        });
      }
    }

    // Normalize probabilities
    const totalProb = outcomes.reduce((sum, o) => sum + o.probability, 0);
    if (totalProb > 0) {
      for (const o of outcomes) {
        o.probability /= totalProb;
      }
    }

    return outcomes;
  }

  private averageState(states: Float32Array[]): Float32Array {
    if (states.length === 0) return new Float32Array(0);

    const dim = states[0].length;
    const avg = new Float32Array(dim);

    for (const state of states) {
      for (let i = 0; i < dim; i++) {
        avg[i] += state[i];
      }
    }

    for (let i = 0; i < dim; i++) {
      avg[i] /= states.length;
    }

    return avg;
  }

  private findMostSimilarState(features: Float32Array): string | null {
    let bestState: string | null = null;
    let bestSimilarity = -Infinity;

    for (const [id, state] of this.states) {
      const similarity = this.cosineSimilarity(features, state.features);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestState = id;
      }
    }

    return bestState;
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

  private refinePredictions(transition: Transition): void {
    // Update transition probabilities based on new evidence
    const fromState = transition.fromState;
    const actionKey = this.actionKey(transition.action);

    const similar = this.transitions.filter(
      t => t.fromState === fromState && this.actionKey(t.action) === actionKey
    );

    for (const t of similar) {
      t.probability = t.probability * 0.9 + 0.1 / similar.length;
    }
  }

  private pruneOldStates(): void {
    if (this.states.size <= this.maxHistory) return;

    const sorted = Array.from(this.states.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (let i = 0; i < sorted.length - this.maxHistory; i++) {
      this.states.delete(sorted[i][0]);
    }
  }

  private pruneTransitions(): void {
    if (this.transitions.length <= this.maxHistory * 2) return;

    this.transitions = this.transitions.slice(-this.maxHistory * 2);
  }
}
