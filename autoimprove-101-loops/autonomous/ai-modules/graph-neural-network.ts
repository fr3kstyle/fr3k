/**
 * Graph Neural Network Module
 * Implements GNN for relational reasoning
 */

export interface GraphNode {
  id: string;
  features: Float32Array;
  label?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type?: string;
  features?: Float32Array;
}

export interface GraphMessage {
  source: string;
  target: string;
  vector: Float32Array;
}

export interface GNNLayer {
  aggregation: 'sum' | 'mean' | 'max';
  activation: 'relu' | 'sigmoid' | 'tanh' | 'none';
  dropout: number;
}

export interface NodeEmbedding {
  nodeId: string;
  embedding: Float32Array;
  neighborhood: string[];
  importance: number;
}

export class GraphNeuralNetwork {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private layers: GNNLayer[] = [];
  private embeddings: Map<string, Float32Array> = new Map();
  private embeddingDim: number;
  private numLayers: number;

  constructor(config?: {
    embeddingDim?: number;
    numLayers?: number;
    layers?: GNNLayer[];
  }) {
    this.embeddingDim = config?.embeddingDim || 64;
    this.numLayers = config?.numLayers || 3;

    if (config?.layers) {
      this.layers = config.layers;
    } else {
      this.initializeLayers();
    }
  }

  /**
   * Initialize default GNN layers
   */
  private initializeLayers(): void {
    for (let i = 0; i < this.numLayers; i++) {
      this.layers.push({
        aggregation: 'mean',
        activation: i < this.numLayers - 1 ? 'relu' : 'none',
        dropout: 0.1
      });
    }
  }

  /**
   * Add node to graph
   */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Add edge to graph
   */
  addEdge(edge: GraphEdge): void {
    this.edges.push(edge);
  }

  /**
   * Build graph from nodes and edges
   */
  buildGraph(nodes: GraphNode[], edges: GraphEdge[]): void {
    this.nodes.clear();
    this.edges = [];

    for (const node of nodes) {
      this.addNode(node);
    }

    for (const edge of edges) {
      this.addEdge(edge);
    }
  }

  /**
   * Perform message passing and compute embeddings
   */
  propagate(numIterations?: number): Map<string, Float32Array> {
    const iterations = numIterations || this.numLayers;

    // Initialize embeddings from node features
    for (const [id, node] of this.nodes) {
      this.embeddings.set(id, this.normalizeFeatures(node.features));
    }

    // Message passing
    for (let iter = 0; iter < iterations; iter++) {
      const layer = this.layers[iter % this.layers.length];
      const messages = this.computeMessages();
      const newEmbeddings = this.aggregateMessages(messages, layer);

      // Update embeddings
      for (const [id, embedding] of newEmbeddings) {
        this.embeddings.set(id, embedding);
      }
    }

    return this.embeddings;
  }

  /**
   * Compute messages between nodes
   */
  private computeMessages(): GraphMessage[] {
    const messages: GraphMessage[] = [];

    for (const edge of this.edges) {
      const sourceEmbedding = this.embeddings.get(edge.source);
      const targetFeatures = this.nodes.get(edge.target)?.features;

      if (sourceEmbedding && targetFeatures) {
        const message = this.transformMessage(sourceEmbedding, edge);
        messages.push({
          source: edge.source,
          target: edge.target,
          vector: message
        });
      }
    }

    return messages;
  }

  /**
   * Transform message along edge
   */
  private transformMessage(embedding: Float32Array, edge: GraphEdge): Float32Array {
    const transformed = new Float32Array(this.embeddingDim);

    // Linear transformation with edge weight
    for (let i = 0; i < this.embeddingDim; i++) {
      const idx = i % embedding.length;
      transformed[i] = embedding[idx] * edge.weight;
    }

    // Add edge features if present
    if (edge.features) {
      for (let i = 0; i < Math.min(transformed.length, edge.features.length); i++) {
        transformed[i] += edge.features[i];
      }
    }

    return transformed;
  }

  /**
   * Aggregate messages at each node
   */
  private aggregateMessages(
    messages: GraphMessage[],
    layer: GNNLayer
  ): Map<string, Float32Array> {
    const aggregated = new Map<string, Float32Array>();

    // Group messages by target
    const messageGroups = new Map<string, Float32Array[]>();
    for (const msg of messages) {
      if (!messageGroups.has(msg.target)) {
        messageGroups.set(msg.target, []);
      }
      messageGroups.get(msg.target)!.push(msg.vector);
    }

    // Aggregate using layer's aggregation function
    for (const [nodeId, node] of this.nodes) {
      const msgs = messageGroups.get(nodeId) || [];
      const currentEmbedding = this.embeddings.get(nodeId)!;

      if (msgs.length === 0) {
        // No messages, keep current embedding
        aggregated.set(nodeId, currentEmbedding);
        continue;
      }

      const aggregatedMsg = this.aggregateVectors(msgs, layer.aggregation);
      const updated = this.updateEmbedding(currentEmbedding, aggregatedMsg, layer);
      aggregated.set(nodeId, updated);
    }

    return aggregated;
  }

  /**
   * Aggregate vectors using specified function
   */
  private aggregateVectors(
    vectors: Float32Array[],
    method: 'sum' | 'mean' | 'max'
  ): Float32Array {
    if (vectors.length === 0) return new Float32Array(this.embeddingDim);

    const result = new Float32Array(this.embeddingDim);

    switch (method) {
      case 'sum':
        for (const vec of vectors) {
          for (let i = 0; i < result.length; i++) {
            result[i] += vec[i];
          }
        }
        break;

      case 'mean':
        for (const vec of vectors) {
          for (let i = 0; i < result.length; i++) {
            result[i] += vec[i];
          }
        }
        for (let i = 0; i < result.length; i++) {
          result[i] /= vectors.length;
        }
        break;

      case 'max':
        for (let i = 0; i < result.length; i++) {
          let max = -Infinity;
          for (const vec of vectors) {
            if (vec[i] > max) max = vec[i];
          }
          result[i] = max;
        }
        break;
    }

    return result;
  }

  /**
   * Update embedding with aggregated message
   */
  private updateEmbedding(
    current: Float32Array,
    message: Float32Array,
    layer: GNNLayer
  ): Float32Array {
    const updated = new Float32Array(this.embeddingDim);

    // Combine current embedding with message
    for (let i = 0; i < this.embeddingDim; i++) {
      const idx = i % Math.min(current.length, message.length);
      updated[i] = current[idx] * 0.5 + message[idx] * 0.5;
    }

    // Apply activation
    this.applyActivation(updated, layer.activation);

    // Apply dropout
    if (layer.dropout > 0 && Math.random() < layer.dropout) {
      for (let i = 0; i < updated.length; i++) {
        updated[i] = 0;
      }
    }

    return updated;
  }

  /**
   * Apply activation function
   */
  private applyActivation(vector: Float32Array, activation: string): void {
    for (let i = 0; i < vector.length; i++) {
      switch (activation) {
        case 'relu':
          vector[i] = Math.max(0, vector[i]);
          break;
        case 'sigmoid':
          vector[i] = 1 / (1 + Math.exp(-vector[i]));
          break;
        case 'tanh':
          vector[i] = Math.tanh(vector[i]);
          break;
        case 'none':
          // No activation
          break;
      }
    }
  }

  /**
   * Get node embedding
   */
  getEmbedding(nodeId: string): Float32Array | null {
    return this.embeddings.get(nodeId) || null;
  }

  /**
   * Get all node embeddings
   */
  getEmbeddings(): NodeEmbedding[] {
    const result: NodeEmbedding[] = [];

    for (const [nodeId, embedding] of this.embeddings) {
      const neighborhood = this.getNeighbors(nodeId);
      const importance = this.computeNodeImportance(nodeId);

      result.push({
        nodeId,
        embedding,
        neighborhood,
        importance
      });
    }

    return result;
  }

  /**
   * Query graph for similar nodes
   */
  query(queryEmbedding: Float32Array, k: number = 5): Array<{
    nodeId: string;
    similarity: number;
    embedding: Float32Array;
  }> {
    const results: Array<{
      nodeId: string;
      similarity: number;
      embedding: Float32Array;
    }> = [];

    for (const [nodeId, embedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      results.push({
        nodeId,
        similarity,
        embedding
      });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  /**
   * Perform relational reasoning between nodes
   */
  relate(nodeId1: string, nodeId2: string): {
    directRelation: number;
    indirectRelation: number;
    pathLength: number;
    commonNeighbors: number;
  } {
    const embedding1 = this.embeddings.get(nodeId1);
    const embedding2 = this.embeddings.get(nodeId2);

    if (!embedding1 || !embedding2) {
      return {
        directRelation: 0,
        indirectRelation: 0,
        pathLength: Infinity,
        commonNeighbors: 0
      };
    }

    // Direct relation: cosine similarity
    const directRelation = this.cosineSimilarity(embedding1, embedding2);

    // Indirect relation: through neighbors
    const neighbors1 = this.getNeighbors(nodeId1);
    const neighbors2 = this.getNeighbors(nodeId2);
    const common = neighbors1.filter(n => neighbors2.includes(n));
    const indirectRelation = common.length / Math.max(neighbors1.length, neighbors2.length);

    // Find shortest path length
    const pathLength = this.findShortestPath(nodeId1, nodeId2);

    return {
      directRelation,
      indirectRelation,
      pathLength,
      commonNeighbors: common.length
    };
  }

  /**
   * Get graph statistics
   */
  getGraphStats(): {
    numNodes: number;
    numEdges: number;
    avgDegree: number;
    density: number;
    clustering: number;
  } {
    const numNodes = this.nodes.size;
    const numEdges = this.edges.length;
    const avgDegree = numNodes > 0 ? (2 * numEdges) / numNodes : 0;
    const maxEdges = (numNodes * (numNodes - 1)) / 2;
    const density = maxEdges > 0 ? numEdges / maxEdges : 0;

    // Approximate clustering coefficient
    const clustering = this.computeClusteringCoefficient();

    return {
      numNodes,
      numEdges,
      avgDegree,
      density,
      clustering
    };
  }

  // Private helper methods

  private getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];

    for (const edge of this.edges) {
      if (edge.source === nodeId) {
        neighbors.push(edge.target);
      } else if (edge.target === nodeId) {
        neighbors.push(edge.source);
      }
    }

    return neighbors;
  }

  private computeNodeImportance(nodeId: string): number {
    const neighbors = this.getNeighbors(nodeId);
    let importance = neighbors.length;

    // Add secondary importance
    for (const neighborId of neighbors) {
      importance += this.getNeighbors(neighborId).length * 0.5;
    }

    return importance;
  }

  private findShortestPath(from: string, to: string): number {
    if (from === to) return 0;

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; distance: number }> = [
      { nodeId: from, distance: 0 }
    ];

    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;

      if (nodeId === to) return distance;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      for (const neighbor of this.getNeighbors(nodeId)) {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, distance: distance + 1 });
        }
      }
    }

    return Infinity;
  }

  private computeClusteringCoefficient(): number {
    let totalClustering = 0;
    let count = 0;

    for (const nodeId of this.nodes.keys()) {
      const neighbors = this.getNeighbors(nodeId);
      if (neighbors.length < 2) continue;

      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (this.areConnected(neighbors[i], neighbors[j])) {
            triangles++;
          }
        }
      }

      const possible = neighbors.length * (neighbors.length - 1) / 2;
      totalClustering += triangles / possible;
      count++;
    }

    return count > 0 ? totalClustering / count : 0;
  }

  private areConnected(nodeId1: string, nodeId2: string): boolean {
    return this.edges.some(
      e =>
        (e.source === nodeId1 && e.target === nodeId2) ||
        (e.source === nodeId2 && e.target === nodeId1)
    );
  }

  private normalizeFeatures(features: Float32Array): Float32Array {
    const normalized = new Float32Array(this.embeddingDim);

    // Copy or pad features
    for (let i = 0; i < this.embeddingDim; i++) {
      normalized[i] = features[i % features.length];
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < normalized.length; i++) {
      norm += normalized[i] * normalized[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < normalized.length; i++) {
        normalized[i] /= norm;
      }
    }

    return normalized;
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
}
