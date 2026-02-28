/**
 * Memory Augmented Network Module
 * Implements Neural Turing Machine variant with external memory
 */

export interface MemoryCell {
  key: Float32Array;
  value: Float32Array;
  usage: number;
  age: number;
}

export interface MemoryAddress {
  content: Float32Array;
  key: Float32Array;
  strength: number;
}

export interface ReadHead {
  key: Float32Array;
  beta: number;  // Key strength
  readVector: Float32Array;
}

export interface WriteHead {
  key: Float32Array;
  beta: number;
  eraseVector: Float32Array;
  writeVector: Float32Array;
}

export interface MemoryState {
  memory: MemoryCell[];
  readWeights: Float32Array;
  writeWeights: Float32Array;
  lastRead: Float32Array;
}

export class MemoryAugmentedNetwork {
  private memory: MemoryCell[] = [];
  private memorySize: number;
  private cellSize: number;
  private readHeads: ReadHead[] = [];
  private writeHeads: WriteHead[] = [];
  private numReadHeads: number;
  private numWriteHeads: number;
  private timestep: number = 0;

  constructor(config?: {
    memorySize?: number;
    cellSize?: number;
    numReadHeads?: number;
    numWriteHeads?: number;
  }) {
    this.memorySize = config?.memorySize || 128;
    this.cellSize = config?.cellSize || 64;
    this.numReadHeads = config?.numReadHeads || 2;
    this.numWriteHeads = config?.numWriteHeads || 1;

    this.initializeMemory();
    this.initializeHeads();
  }

  /**
   * Initialize memory cells
   */
  private initializeMemory(): void {
    this.memory = [];
    for (let i = 0; i < this.memorySize; i++) {
      this.memory.push({
        key: new Float32Array(this.cellSize),
        value: new Float32Array(this.cellSize),
        usage: 0,
        age: 0
      });
    }
  }

  /**
   * Initialize read and write heads
   */
  private initializeHeads(): void {
    for (let i = 0; i < this.numReadHeads; i++) {
      this.readHeads.push({
        key: new Float32Array(this.cellSize),
        beta: 1.0,
        readVector: new Float32Array(this.cellSize)
      });
    }

    for (let i = 0; i < this.numWriteHeads; i++) {
      this.writeHeads.push({
        key: new Float32Array(this.cellSize),
        beta: 1.0,
        eraseVector: new Float32Array(this.cellSize),
        writeVector: new Float32Array(this.cellSize)
      });
    }
  }

  /**
   * Read from memory using content-based addressing
   */
  read(readHead: ReadHead): Float32Array {
    const weights = this.contentBasedReadWeights(readHead.key, readHead.beta);
    const readVector = this.weightedRead(weights);

    // Update read head state
    readHead.readVector = readVector;

    return readVector;
  }

  /**
   * Write to memory
   */
  write(writeHead: WriteHead): void {
    const weights = this.contentBasedWriteWeights(
      writeHead.key,
      writeHead.beta
    );

    // Apply write operation
    for (let i = 0; i < this.memorySize; i++) {
      if (weights[i] > 0.01) {
        // Erase
        for (let j = 0; j < this.cellSize; j++) {
          this.memory[i].value[j] *= (1 - writeHead.eraseVector[j] * weights[i]);
        }
        // Write
        for (let j = 0; j < this.cellSize; j++) {
          this.memory[i].value[j] += writeHead.writeVector[j] * weights[i];
        }
        // Update key
        this.memory[i].key.set(writeHead.key);
        // Update usage
        this.memory[i].usage = weights[i];
        this.memory[i].age = 0;
      }
    }

    // Age all cells
    for (const cell of this.memory) {
      cell.age++;
    }
  }

  /**
   * Find similar memories
   */
  findSimilar(query: Float32Array, k: number = 5): Array<{
    index: number;
    similarity: number;
    value: Float32Array;
  }> {
    const similarities = this.memory.map((cell, idx) => ({
      index: idx,
      similarity: this.cosineSimilarity(query, cell.key),
      value: cell.value
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  /**
   * Get memory state
   */
  getMemoryState(): MemoryState {
    return {
      memory: [...this.memory],
      readWeights: this.contentBasedReadWeights(this.readHeads[0]?.key || new Float32Array(this.cellSize), 1),
      writeWeights: this.contentBasedWriteWeights(this.writeHeads[0]?.key || new Float32Array(this.cellSize), 1),
      lastRead: this.readHeads[0]?.readVector || new Float32Array(this.cellSize)
    };
  }

  /**
   * Reset memory to initial state
   */
  reset(): void {
    this.initializeMemory();
    this.timestep = 0;
  }

  /**
   * Process input through memory network
   */
  process(input: Float32Array): {
    output: Float32Array;
    memoryState: MemoryState;
  } {
    this.timestep++;

    // Read from memory
    const readVectors: Float32Array[] = [];
    for (const head of this.readHeads) {
      head.key.set(input);
      const vec = this.read(head);
      readVectors.push(vec);
    }

    // Combine read vectors with input
    const combined = this.combineInputAndReads(input, readVectors);

    // Write to memory
    for (const head of this.writeHeads) {
      head.key.set(combined.slice(0, this.cellSize));
      head.writeVector.set(combined.slice(this.cellSize, this.cellSize * 2));
      head.eraseVector.fill(0.1); // Slight decay
      this.write(head);
    }

    return {
      output: combined,
      memoryState: this.getMemoryState()
    };
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    utilization: number;
    averageAge: number;
    totalReads: number;
    totalWrites: number;
    sparsity: number;
  } {
    const usedCells = this.memory.filter(c => c.usage > 0.01).length;
    const avgAge = this.memory.reduce((sum, c) => sum + c.age, 0) / this.memorySize;
    const totalUsage = this.memory.reduce((sum, c) => sum + c.usage, 0);
    const sparsity = 1 - (totalUsage / this.memorySize);

    return {
      utilization: usedCells / this.memorySize,
      averageAge: avgAge,
      totalReads: this.timestep * this.numReadHeads,
      totalWrites: this.timestep * this.numWriteHeads,
      sparsity
    };
  }

  // Private helper methods

  private contentBasedReadWeights(key: Float32Array, beta: number): Float32Array {
    const weights = new Float32Array(this.memorySize);

    for (let i = 0; i < this.memorySize; i++) {
      const similarity = this.cosineSimilarity(key, this.memory[i].key);
      weights[i] = Math.pow(similarity, beta);
    }

    // Softmax normalization
    const max = Math.max(...weights);
    const exp = weights.map(w => Math.exp(w - max));
    const sum = exp.reduce((a, b) => a + b, 0);

    return new Float32Array(exp.map(e => e / sum));
  }

  private contentBasedWriteWeights(key: Float32Array, beta: number): Float32Array {
    // Combine similarity with usage for allocation
    const simWeights = this.contentBasedReadWeights(key, beta);

    // Least-used allocation
    const usageWeights = new Float32Array(this.memorySize);
    for (let i = 0; i < this.memorySize; i++) {
      usageWeights[i] = 1 - this.memory[i].usage;
    }

    // Combine similarity and usage
    const combined = new Float32Array(this.memorySize);
    for (let i = 0; i < this.memorySize; i++) {
      combined[i] = simWeights[i] * 0.7 + usageWeights[i] * 0.3;
    }

    // Normalize
    const sum = combined.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < this.memorySize; i++) {
        combined[i] /= sum;
      }
    }

    return combined;
  }

  private weightedRead(weights: Float32Array): Float32Array {
    const result = new Float32Array(this.cellSize);

    for (let i = 0; i < this.memorySize; i++) {
      for (let j = 0; j < this.cellSize; j++) {
        result[j] += this.memory[i].value[j] * weights[i];
      }
    }

    return result;
  }

  private combineInputAndReads(input: Float32Array, readVectors: Float32Array[]): Float32Array {
    const combined = new Float32Array(input.length);

    // Start with input
    combined.set(input);

    // Add read vectors
    for (const vec of readVectors) {
      for (let i = 0; i < combined.length; i++) {
        combined[i] += vec[i] * 0.3;
      }
    }

    // Apply non-linearity
    for (let i = 0; i < combined.length; i++) {
      combined[i] = Math.tanh(combined[i]);
    }

    return combined;
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

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
}
