#!/usr/bin/env bun
/**
 * Semantic Memory Engine - LOOP 7
 *
 * Based on 2026 research:
 * - Vector embeddings as primary memory representation
 * - Knowledge graphs for relationship extraction
 * - Retrieval-Augmented Generation (RAG) as standard
 * - Long-term memory with consolidation
 * - Temporal memory decay and reinforcement
 *
 * Core Capability: Human-like semantic memory with associative recall
 */

interface MemoryNode {
  id: string
  content: string
  embedding: number[] // Vector representation
  importance: number // 0-1, decays over time
  timestamp: number
  accessCount: number
  lastAccessed: number
  tags: string[]
  source: string
}

interface MemoryRelation {
  from: string // Memory ID
  to: string // Memory ID
  type: 'semantic' | 'temporal' | 'causal' | 'hierarchical' | 'associative'
  strength: number // 0-1
  createdAt: number
}

interface KnowledgeGraph {
  nodes: Map<string, MemoryNode>
  relations: MemoryRelation[]
  clusters: Map<string, string[]> // Cluster ID -> Memory IDs
}

interface RecallResult {
  memory: MemoryNode
  relevance: number
  path: string[] // Association path
  context: MemoryNode[]
}

class SemanticMemoryEngine {
  private knowledgeGraph: KnowledgeGraph
  private embeddingDim: number = 384 // Default embedding dimension
  private consolidationThreshold: number = 100 // Consolidate after N memories
  private decayRate: number = 0.01 // Per day
  private reinforcementBoost: number = 0.1

  constructor() {
    this.knowledgeGraph = {
      nodes: new Map(),
      relations: [],
      clusters: new Map()
    }
  }

  /**
   * STORE MEMORY - Add new memory with semantic embedding
   */
  async storeMemory(
    content: string,
    tags: string[] = [],
    source: string = 'manual'
  ): Promise<string> {
    const id = crypto.randomUUID()

    // Generate embedding (simulated - in production use actual embedding model)
    const embedding = await this.generateEmbedding(content)

    // Calculate initial importance
    const importance = this.calculateInitialImportance(content, tags)

    const node: MemoryNode = {
      id,
      content,
      embedding,
      importance,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      source
    }

    this.knowledgeGraph.nodes.set(id, node)

    // Find and create relations to similar memories
    await this.createSemanticRelations(node)

    // Check if consolidation needed
    if (this.knowledgeGraph.nodes.size >= this.consolidationThreshold) {
      await this.consolidateMemory()
    }

    console.log(`✓ Stored memory: ${content.slice(0, 50)}...`)
    console.log(`   ID: ${id.slice(0, 8)}`)
    console.log(`   Importance: ${importance.toFixed(2)}`)

    return id
  }

  /**
   * RECALL - Retrieve memories by semantic similarity
   */
  async recall(query: string, limit: number = 5): Promise<RecallResult[]> {
    const queryEmbedding = await this.generateEmbedding(query)

    // Calculate similarity to all memories
    const results: RecallResult[] = []

    for (const [id, node] of this.knowledgeGraph.nodes) {
      const similarity = this.cosineSimilarity(queryEmbedding, node.embedding)

      // Adjust by importance and recency
      const timeDecay = this.calculateTimeDecay(node)
      const adjustedScore = similarity * node.importance * (1 - timeDecay)

      if (adjustedScore > 0.3) { // Threshold
        // Find association path
        const path = await this.findAssociationPath(id)

        // Get related context
        const context = await this.getContextualMemories(id, 3)

        results.push({
          memory: node,
          relevance: adjustedScore,
          path,
          context
        })

        // Update access stats (reinforcement)
        node.accessCount++
        node.lastAccessed = Date.now()
        node.importance = Math.min(1, node.importance + this.reinforcementBoost)
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)

    console.log(`✓ Recall: ${query}`)
    console.log(`   Found ${results.length} relevant memories`)

    return results.slice(0, limit)
  }

  /**
   * ASSOCIATIVE RECALL - Follow memory associations
   */
  async associativeRecall(
    startId: string,
    depth: number = 3
  ): Promise<RecallResult[]> {
    const visited = new Set<string>()
    const results: RecallResult[] = []
    const queue: { id: string; currentDepth: number }[] = [
      { id: startId, currentDepth: 0 }
    ]

    while (queue.length > 0 && results.length < 20) {
      const { id, currentDepth } = queue.shift()!

      if (visited.has(id) || currentDepth > depth) continue
      visited.add(id)

      const node = this.knowledgeGraph.nodes.get(id)
      if (!node) continue

      // Find related memories
      const relations = this.knowledgeGraph.relations.filter(
        r => r.from === id || r.to === id
      )

      for (const rel of relations) {
        const relatedId = rel.from === id ? rel.to : rel.from
        const relatedNode = this.knowledgeGraph.nodes.get(relatedId)

        if (relatedNode && !visited.has(relatedId)) {
          results.push({
            memory: relatedNode,
            relevance: rel.strength,
            path: [startId, relatedId],
            context: []
          })

          queue.push({ id: relatedId, currentDepth: currentDepth + 1 })
        }
      }
    }

    console.log(`✓ Associative recall from ${startId.slice(0, 8)}`)
    console.log(`   Depth: ${depth}, Found: ${results.length} memories`)

    return results
  }

  /**
   * GET KNOWLEDGE GRAPH - Extract knowledge structure
   */
  async getKnowledgeGraph(): Promise<{
    nodes: number
    relations: number
    clusters: number
    density: number
    keyConcepts: Array<{ id: string; content: string; connections: number }>
  }> {
    const nodeCount = this.knowledgeGraph.nodes.size
    const relationCount = this.knowledgeGraph.relations.length
    const clusterCount = this.knowledgeGraph.clusters.size

    // Calculate graph density
    const maxRelations = (nodeCount * (nodeCount - 1)) / 2
    const density = maxRelations > 0 ? relationCount / maxRelations : 0

    // Find key concepts (highly connected nodes)
    const connections = new Map<string, number>()
    for (const rel of this.knowledgeGraph.relations) {
      connections.set(rel.from, (connections.get(rel.from) || 0) + 1)
      connections.set(rel.to, (connections.get(rel.to) || 0) + 1)
    }

    const keyConcepts = Array.from(connections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => {
        const node = this.knowledgeGraph.nodes.get(id)!
        return {
          id,
          content: node.content.slice(0, 100),
          connections: count
        }
      })

    return {
      nodes: nodeCount,
      relations: relationCount,
      clusters: clusterCount,
      density,
      keyConcepts
    }
  }

  /**
   * CONSENSOLIDATE MEMORY - Merge and optimize memory structure
   */
  private async consolidateMemory(): Promise<void> {
    console.log('\n🔄 Consolidating memory...')

    // Step 1: Find clusters (similar memories)
    await this.findClusters()

    // Step 2: Merge redundant memories
    await this.mergeRedundantMemories()

    // Step 3: Decay old, unaccessed memories
    await this.decayMemories()

    // Step 4: Strengthen strong associations
    await this.strengthenAssociations()

    console.log('✓ Memory consolidated')
  }

  /**
   * FIND CLUSTERS - Group similar memories
   */
  private async findClusters(): Promise<void> {
    const nodes = Array.from(this.knowledgeGraph.nodes.values())
    const clusters: Map<string, string[]> = new Map()
    const assigned = new Set<string>()

    for (const node of nodes) {
      if (assigned.has(node.id)) continue

      // Find similar nodes
      const cluster: string[] = [node.id]
      assigned.add(node.id)

      for (const other of nodes) {
        if (assigned.has(other.id)) continue

        const similarity = this.cosineSimilarity(node.embedding, other.embedding)
        if (similarity > 0.85) { // High similarity threshold
          cluster.push(other.id)
          assigned.add(other.id)
        }
      }

      if (cluster.length > 1) {
        const clusterId = `cluster-${clusters.size}`
        clusters.set(clusterId, cluster)
      }
    }

    this.knowledgeGraph.clusters = clusters

    console.log(`   Found ${clusters.size} clusters`)
  }

  /**
   * MERGE REDUNDANT MEMORIES - Remove duplicates
   */
  private async mergeRedundantMemories(): Promise<void> {
    const toRemove: string[] = []

    for (const [clusterId, members] of this.knowledgeGraph.clusters) {
      if (members.length < 2) continue

      // Keep most important/accessed
      const sorted = members.sort((a, b) => {
        const nodeA = this.knowledgeGraph.nodes.get(a)!
        const nodeB = this.knowledgeGraph.nodes.get(b)!
        return nodeB.importance - nodeA.importance
      })

      // Merge into first, remove rest
      const primary = sorted[0]
      const duplicates = sorted.slice(1)

      for (const dup of duplicates) {
        const node = this.knowledgeGraph.nodes.get(dup)!
        const primaryNode = this.knowledgeGraph.nodes.get(primary)!

        // Combine tags
        primaryNode.tags.push(...node.tags.filter(t => !primaryNode.tags.includes(t)))

        // Update relations
        for (const rel of this.knowledgeGraph.relations) {
          if (rel.from === dup) rel.from = primary
          if (rel.to === dup) rel.to = primary
        }

        toRemove.push(dup)
      }
    }

    // Remove duplicates
    for (const id of toRemove) {
      this.knowledgeGraph.nodes.delete(id)
    }

    if (toRemove.length > 0) {
      console.log(`   Merged ${toRemove.length} redundant memories`)
    }
  }

  /**
   * DECAY MEMORIES - Reduce importance of old, unaccessed memories
   */
  private async decayMemories(): Promise<void> {
    const now = Date.now()
    const dayInMs = 86400000

    for (const [id, node] of this.knowledgeGraph.nodes) {
      const daysSinceAccess = (now - node.lastAccessed) / dayInMs
      const decay = daysSinceAccess * this.decayRate

      node.importance = Math.max(0.1, node.importance - decay)

      // Remove very weak, old memories
      if (node.importance < 0.2 && daysSinceAccess > 30) {
        this.knowledgeGraph.nodes.delete(id)
      }
    }

    console.log('   Applied temporal decay')
  }

  /**
   * STRENGTHEN ASSOCIATIONS - Reinforce strong connections
   */
  private async strengthenAssociations(): Promise<void> {
    // Strengthen frequently used relations
    for (const rel of this.knowledgeGraph.relations) {
      const fromNode = this.knowledgeGraph.nodes.get(rel.from)
      const toNode = this.knowledgeGraph.nodes.get(rel.to)

      if (fromNode && toNode) {
        // If both memories are strong, strengthen relation
        if (fromNode.importance > 0.7 && toNode.importance > 0.7) {
          rel.strength = Math.min(1, rel.strength * 1.1)
        }
      }
    }

    // Remove weak relations
    this.knowledgeGraph.relations = this.knowledgeGraph.relations.filter(
      r => r.strength > 0.2
    )

    console.log('   Strengthened associations')
  }

  /**
   * CREATE SEMANTIC RELATIONS - Connect similar memories
   */
  private async createSemanticRelations(node: MemoryNode): Promise<void> {
    const relationThreshold = 0.75 // Similarity threshold for relation

    for (const [otherId, otherNode] of this.knowledgeGraph.nodes) {
      if (otherId === node.id) continue

      const similarity = this.cosineSimilarity(node.embedding, otherNode.embedding)

      if (similarity > relationThreshold) {
        // Check if relation already exists
        const exists = this.knowledgeGraph.relations.some(
          r => (r.from === node.id && r.to === otherId) ||
               (r.from === otherId && r.to === node.id)
        )

        if (!exists) {
          this.knowledgeGraph.relations.push({
            from: node.id,
            to: otherId,
            type: 'semantic',
            strength: similarity,
            createdAt: Date.now()
          })
        }
      }
    }
  }

  /**
   * FIND ASSOCIATION PATH - Find path between memories
   */
  private async findAssociationPath(targetId: string): Promise<string[]> {
    // BFS to find shortest path
    const queue: string[][] = [[]]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const path = queue.shift()!
      const currentId = path.length > 0 ? path[path.length - 1] : targetId

      if (currentId === targetId && path.length > 0) {
        return path
      }

      if (visited.has(currentId)) continue
      visited.add(currentId)

      // Find neighbors
      const neighbors = this.knowledgeGraph.relations
        .filter(r => r.from === currentId || r.to === currentId)
        .map(r => r.from === currentId ? r.to : r.from)

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([...path, neighbor])
        }
      }
    }

    return []
  }

  /**
   * GET CONTEXTUAL MEMORIES - Get related memories for context
   */
  private async getContextualMemories(
    memoryId: string,
    count: number
  ): Promise<MemoryNode[]> {
    // Find directly related memories
    const relations = this.knowledgeGraph.relations.filter(
      r => r.from === memoryId || r.to === memoryId
    )

    const relatedIds = relations.map(r => r.from === memoryId ? r.to : r.from)

    // Sort by relation strength
    const sorted = relatedIds.sort((a, b) => {
      const relA = relations.find(r => r.from === a || r.to === a)!
      const relB = relations.find(r => r.from === b || r.to === b)!
      return relB.strength - relA.strength
    })

    return sorted.slice(0, count).map(id => this.knowledgeGraph.nodes.get(id)!)
  }

  /**
   * GENERATE EMBEDDING - Create vector representation (simulated)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simulated embedding - in production use actual model
    const embedding: number[] = []
    const hash = this.simpleHash(text)

    for (let i = 0; i < this.embeddingDim; i++) {
      // Deterministic pseudo-random based on text
      const value = ((hash * (i + 1)) % 1000) / 1000
      embedding.push(value)
    }

    return embedding
  }

  /**
   * COSINE SIMILARITY - Calculate vector similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * CALCULATE INITIAL IMPORTANCE - Score memory importance
   */
  private calculateInitialImportance(content: string, tags: string[]): number {
    let importance = 0.5 // Base importance

    // Length factor (medium length is better)
    const length = content.length
    if (length > 50 && length < 500) {
      importance += 0.1
    }

    // Tag factor
    if (tags.length > 0) {
      importance += 0.1
    }

    // Content factors
    const keywords = ['important', 'critical', 'error', 'success', 'learned']
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        importance += 0.05
      }
    }

    return Math.min(1, importance)
  }

  /**
   * CALCULATE TIME DECAY - How much memory has decayed
   */
  private calculateTimeDecay(node: MemoryNode): number {
    const now = Date.now()
    const daysSinceAccess = (now - node.lastAccessed) / 86400000
    return Math.min(1, daysSinceAccess * this.decayRate)
  }

  /**
   * SIMPLE HASH - Hash string for deterministic embedding
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * GET METRICS - Memory system statistics
   */
  getMetrics(): {
    totalMemories: number
    totalRelations: number
    clusters: number
    avgImportance: number
    mostAccessed: MemoryNode | null
  } {
    let totalImportance = 0
    let mostAccessed: MemoryNode | null = null
    let maxAccess = 0

    for (const node of this.knowledgeGraph.nodes.values()) {
      totalImportance += node.importance
      if (node.accessCount > maxAccess) {
        maxAccess = node.accessCount
        mostAccessed = node
      }
    }

    return {
      totalMemories: this.knowledgeGraph.nodes.size,
      totalRelations: this.knowledgeGraph.relations.length,
      clusters: this.knowledgeGraph.clusters.size,
      avgImportance: this.knowledgeGraph.nodes.size > 0
        ? totalImportance / this.knowledgeGraph.nodes.size
        : 0,
      mostAccessed
    }
  }

  /**
   * EXPORT KNOWLEDGE GRAPH - Export to JSON
   */
  exportKnowledgeGraph(): string {
    const data = {
      nodes: Array.from(this.knowledgeGraph.nodes.values()),
      relations: this.knowledgeGraph.relations,
      clusters: Array.from(this.knowledgeGraph.clusters.entries()),
      exportedAt: Date.now()
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * IMPORT KNOWLEDGE GRAPH - Import from JSON
   */
  importKnowledgeGraph(json: string): void {
    const data = JSON.parse(json)

    this.knowledgeGraph.nodes = new Map(
      data.nodes.map((n: MemoryNode) => [n.id, n])
    )
    this.knowledgeGraph.relations = data.relations
    this.knowledgeGraph.clusters = new Map(data.clusters)

    console.log(`✓ Imported ${data.nodes.length} memories`)
  }
}

// Export
export { SemanticMemoryEngine, MemoryNode, MemoryRelation, RecallResult }

// Test
if (import.meta.main) {
  console.log('🧪 Semantic Memory Engine Test\n')

  const memory = new SemanticMemoryEngine()

  // Store some memories
  console.log('Storing memories...\n')
  await memory.storeMemory('FR3K Algorithm is a 7-phase improvement system', ['fr3k', 'algorithm'])
  await memory.storeMemory('Loop 5 implemented Recursive Self-Improvement', ['loop-5', 'rsi'])
  await memory.storeMemory('Loop 6 integrated all systems with hyper-agent orchestrator', ['loop-6', 'integration'])
  await memory.storeMemory('Vector embeddings enable semantic memory', ['embeddings', 'memory'])
  await memory.storeMemory('Knowledge graphs represent relationships between concepts', ['knowledge-graph'])

  // Test recall
  console.log('\nRecalling memories about FR3K...\n')
  const results = await memory.recall('FR3K algorithm improvement')
  for (const result of results) {
    console.log(`→ [${result.relevance.toFixed(2)}] ${result.memory.content}`)
  }

  // Test knowledge graph
  console.log('\nKnowledge Graph Statistics:')
  const graph = await memory.getKnowledgeGraph()
  console.log(`   Nodes: ${graph.nodes}`)
  console.log(`   Relations: ${graph.relations}`)
  console.log(`   Clusters: ${graph.clusters}`)
  console.log(`   Density: ${graph.density.toFixed(3)}`)

  console.log('\n   Key Concepts:')
  for (const concept of graph.keyConcepts.slice(0, 5)) {
    console.log(`   - ${concept.content} (${concept.connections} connections)`)
  }

  // Test associative recall
  console.log('\nAssociative Recall Test:')
  const firstMemory = Array.from(memory['knowledgeGraph'].nodes.keys())[0]
  const associations = await memory.associativeRecall(firstMemory, 2)
  console.log(`   Found ${associations.length} associations`)

  console.log('\n📊 Metrics:', memory.getMetrics())

  console.log('\n✅ Semantic Memory Engine loaded')
}
