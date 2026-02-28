#!/usr/bin/env bun
/**
 * Agent Memory Sharing - Collaborative Intelligence (OpenClaw-style)
 *
 * Key Features:
 * - Cross-agent memory access
 * - Hybrid retrieval (vector + keyword)
 * - Memory compression for long-term storage
 * - Session isolation with shared context
 * - Experience accumulation across sessions
 */

interface Memory {
  id: string;
  agent_id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  content: any;
  embedding?: number[];
  timestamp: number;
  access_count: number;
  tags: string[];
}

interface MemoryQuery {
  query: string;
  type?: Memory['type'];
  agent_id?: string;
  top_k?: number;
  threshold?: number;
}

class AgentMemorySharing {
  private memories: Map<string, Memory> = new Map();
  private embeddingModel = 'all-MiniLM-L6-v2'; // 384-dim
  private vectorDimension = 384;
  private maxMemories = 10000;
  private compressionThreshold = 0.7; // Compress when 70% full

  /**
   * STORE - Save memory with optional embedding
   */
  async store(memory: Omit<Memory, 'id' | 'embedding' | 'timestamp'>): Promise<string> {
    const id = crypto.randomUUID();
    const timestamp = Date.now();

    // Generate embedding if semantic memory
    let embedding: number[] | undefined;
    if (memory.type === 'semantic' || memory.type === 'episodic') {
      embedding = await this.generateEmbedding(JSON.stringify(memory.content));
    }

    const stored: Memory = {
      id,
      agent_id: memory.agent_id,
      type: memory.type,
      content: memory.content,
      embedding,
      timestamp,
      access_count: 0,
      tags: memory.tags || []
    };

    this.memories.set(id, stored);

    // Check if compression needed
    if (this.memories.size >= this.maxMemories * this.compressionThreshold) {
      await this.compressMemories();
    }

    return id;
  }

  /**
   * RETRIEVE - Fetch relevant memories (hybrid search)
   */
  async retrieve(query: MemoryQuery): Promise<Memory[]> {
    const { query: queryText, type, agent_id, top_k = 5, threshold = 0.7 } = query;

    // 1. Vector search (semantic similarity)
    const queryEmbedding = await this.generateEmbedding(queryText);
    const vectorResults = this.vectorSearch(queryEmbedding, type, agent_id);

    // 2. Keyword search (exact match)
    const keywordResults = this.keywordSearch(queryText, type, agent_id);

    // 3. Combine and deduplicate
    const combined = new Map<string, { memory: Memory; score: number }>();

    for (const { memory, score } of vectorResults) {
      combined.set(memory.id, { memory, score });
    }

    for (const memory of keywordResults) {
      const existing = combined.get(memory.id);
      if (existing) {
        existing.score = Math.max(existing.score, 1.0); // Keyword match is perfect
      } else {
        combined.set(memory.id, { memory, score: 1.0 });
      }
    }

    // 4. Sort by score and filter by threshold
    const results = Array.from(combined.values())
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k)
      .map(({ memory }) => {
        memory.access_count++;
        return memory;
      });

    return results;
  }

  /**
   * SHARE - Grant access between agents
   */
  async share(memoryId: string, toAgentId: string): Promise<boolean> {
    const memory = this.memories.get(memoryId);

    if (!memory) {
      console.log(`❌ Memory ${memoryId} not found`);
      return false;
    }

    // Add tag for shared access
    if (!memory.tags.includes(`shared-with:${toAgentId}`)) {
      memory.tags.push(`shared-with:${toAgentId}`);
    }

    console.log(`✓ Shared memory ${memoryId} with ${toAgentId}`);
    return true;
  }

  /**
   * AGENT CONTEXT - Get all relevant memories for an agent
   */
  async getAgentContext(agentId: string): Promise<{
    personal_memories: Memory[];
    shared_memories: Memory[];
    total_context_size: number;
  }> {
    const personal = Array.from(this.memories.values())
      .filter(m => m.agent_id === agent_id);

    const shared = Array.from(this.memories.values())
      .filter(m => m.tags.some(t => t.startsWith('shared-with:') && t.includes(agentId)));

    return {
      personal_memories: personal,
      shared_memories: shared,
      total_context_size: personal.length + shared.length
    };
  }

  /**
   * VECTOR SEARCH - Semantic similarity search
   */
  private vectorSearch(
    queryEmbedding: number[],
    type?: Memory['type'],
    agent_id?: string
  ): Array<{ memory: Memory; score: number }> {
    const results: Array<{ memory: Memory; score: number }> = [];

    for (const memory of this.memories.values()) {
      // Filter by type and agent
      if (type && memory.type !== type) continue;
      if (agent_id && memory.agent_id !== agent_id && !memory.tags.includes(`shared-with:${agent_id}`)) continue;

      // Skip if no embedding
      if (!memory.embedding) continue;

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);

      results.push({ memory, score: similarity });
    }

    return results;
  }

  /**
   * KEYWORD SEARCH - Exact text matching
   */
  private keywordSearch(
    query: string,
    type?: Memory['type'],
    agent_id?: string
  ): Memory[] {
    const queryLower = query.toLowerCase();

    return Array.from(this.memories.values()).filter(memory => {
      // Filter by type and agent
      if (type && memory.type !== type) return false;
      if (agent_id && memory.agent_id !== agent_id && !memory.tags.includes(`shared-with:${agent_id}`)) return false;

      // Search in content and tags
      const content = JSON.stringify(memory.content).toLowerCase();
      const tags = memory.tags.join(' ').toLowerCase();

      return content.includes(queryLower) || tags.includes(queryLower);
    });
  }

  /**
   * GENERATE EMBEDDING - Create vector representation
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // In production, would call embedding API
    // Simulated 384-dim embedding
    const embedding: number[] = [];
    for (let i = 0; i < 384; i++) {
      embedding.push((Math.sin(i + text.length) + 1) / 2); // Deterministic pseudo-random
    }
    return embedding;
  }

  /**
   * COSINE SIMILARITY - Vector similarity calculation
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * COMPRESS MEMORIES - Archive old/rarely used memories
   */
  private async compressMemories(): Promise<void> {
    console.log('🗜️ Compressing memories...');

    // Sort by access count (least accessed first)
    const sorted = Array.from(this.memories.values())
      .sort((a, b) => a.access_count - b.access_count);

    // Move bottom 30% to archive
    const toArchive = sorted.slice(0, Math.floor(sorted.length * 0.3));

    for (const memory of toArchive) {
      // In production, would compress to long-term storage
      memory.tags.push('archived');
    }

    console.log(`   ✓ Archived ${toArchive.length} memories`);
  }

  /**
   * SESSION MEMORY - Isolated per-session working memory
   */
  private sessions: Map<string, Memory[]> = new Map();

  createSession(sessionId: string): void {
    this.sessions.set(sessionId, []);
    console.log(`✓ Created session: ${sessionId}`);
  }

  async addToSession(sessionId: string, memory: Omit<Memory, 'id' | 'embedding' | 'timestamp'>): Promise<string> {
    const stored = await this.store(memory);
    this.sessions.get(sessionId)?.push(stored);
    return stored;
  }

  getSessionMemory(sessionId: string): Memory[] {
    return this.sessions.get(sessionId) || [];
  }

  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`✓ Ended session: ${sessionId}`);
  }

  /**
   * GET METRICS
   */
  getMetrics() {
    return {
      total_memories: this.memories.size,
      total_sessions: this.sessions.size,
      memories_by_type: {
        episodic: Array.from(this.memories.values()).filter(m => m.type === 'episodic').length,
        semantic: Array.from(this.memories.values()).filter(m => m.type === 'semantic').length,
        procedural: Array.from(this.memories.values()).filter(m => m.type === 'procedural').length,
        working: Array.from(this.memories.values()).filter(m => m.type === 'working').length
      },
      shared_memories: Array.from(this.memories.values()).filter(m => m.tags.some(t => t.startsWith('shared-with:'))).length,
      compression_threshold: this.compressionThreshold
    };
  }
}

// Export
export { AgentMemorySharing, Memory, MemoryQuery };

// Test
if (import.meta.main) {
  const memorySystem = new AgentMemorySharing();

  console.log('🧪 Testing Agent Memory Sharing...\n');

  // Store some memories
  await memorySystem.store({
    agent_id: 'agent-coder',
    type: 'episodic',
    content: { task: 'fixed bug #123', solution: 'added null check' },
    tags: ['bug-fix', 'typescript']
  });

  await memorySystem.store({
    agent_id: 'agent-coder',
    type: 'procedural',
    content: { pattern: 'always validate inputs before processing' },
    tags: ['best-practice']
  });

  await memorySystem.store({
    agent_id: 'agent-tester',
    type: 'episodic',
    content: { task: 'tested payment flow', result: 'found edge case' },
    tags: ['testing', 'edge-case']
  });

  // Share memory
  await memorySystem.share('agent-coder', 'agent-tester');

  // Retrieve
  const results = await memorySystem.retrieve({
    query: 'bug fix',
    top_k: 5
  });

  console.log('🔍 Retrieved memories:', results.length);
  for (const mem of results) {
    console.log(`   - [${mem.type}] ${JSON.stringify(mem.content).slice(0, 50)}...`);
  }

  // Get agent context
  const context = await memorySystem.getAgentContext('agent-tester');
  console.log('\n📊 Agent Context for agent-tester:');
  console.log(`   Personal: ${context.personal_memories.length}`);
  console.log(`   Shared: ${context.shared_memories.length}`);

  console.log('\nMetrics:', memorySystem.getMetrics());

  console.log('\n✅ Agent Memory Sharing loaded');
}
