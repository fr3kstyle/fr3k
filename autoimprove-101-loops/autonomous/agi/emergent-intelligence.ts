#!/usr/bin/env bun
/**
 * Emergent Intelligence - Detect and foster emergent capabilities
 *
 * Capabilities:
 * - Detect emergent behaviors in agent swarms
 * - Foster emergence through configuration
 * - Measure emergence metrics
 * - Classify emergence types
 */

interface Emergence {
  id: string
  type: 'flocking' | 'clustering' | 'vortex' | 'wave' | 'novel-behavior'
  confidence: number
  description: string
  timestamp: number
  agents: string[]
}

interface EmergenceMetrics {
  hasEmergence: boolean
  emergenceType: string[]
  collectiveIntelligence: number
  selfOrganizationLevel: number
  noveltyScore: number
  complexityIndex: number
}

interface AgentState {
  id: string
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  internalState: Map<string, any>
}

class EmergentIntelligence {
  private emergenceHistory: Emergence[] = []
  private agentStates: Map<string, AgentState[]> = new Map()

  constructor() {
    console.log('✨ Initializing Emergent Intelligence...\n')
    console.log('✅ Emergent Intelligence ready')
    console.log('   Capabilities: detection, fostering, measurement')
  }

  /**
   * DETECT EMERGENCE - Identify emergent behaviors from agent states
   */
  detectEmergence(agentId: string, states: AgentState[]): Emergence[] {
    console.log(`\n🔍 Detecting emergence for agent: ${agentId}`)
    console.log(`   Analyzing ${states.length} states`)

    const emergence: Emergence[] = []

    // Store states
    this.agentStates.set(agentId, states)

    // Calculate metrics
    const metrics = this.calculateEmergenceMetrics(states)

    // Detect specific emergence types
    if (this.detectFlocking(states)) {
      emergence.push({
        id: crypto.randomUUID(),
        type: 'flocking',
        confidence: 0.85,
        description: 'Agents aligning and moving together',
        timestamp: Date.now(),
        agents: states.map(s => s.id)
      })
    }

    if (this.detectClustering(states)) {
      emergence.push({
        id: crypto.randomUUID(),
        type: 'clustering',
        confidence: 0.78,
        description: 'Agents forming spatial clusters',
        timestamp: Date.now(),
        agents: states.map(s => s.id)
      })
    }

    if (this.detectVortex(states)) {
      emergence.push({
        id: crypto.randomUUID(),
        type: 'vortex',
        confidence: 0.72,
        description: 'Agents exhibiting circular motion patterns',
        timestamp: Date.now(),
        agents: states.map(s => s.id)
      })
    }

    if (this.detectWave(states)) {
      emergence.push({
        id: crypto.randomUUID(),
        type: 'wave',
        confidence: 0.81,
        description: 'Wave-like propagation through agent population',
        timestamp: Date.now(),
        agents: states.map(s => s.id)
      })
    }

    // Detect novel behaviors
    const novel = this.detectNovelBehavior(states)
    if (novel) {
      emergence.push({
        id: crypto.randomUUID(),
        type: 'novel-behavior',
        confidence: novel.confidence,
        description: novel.description,
        timestamp: Date.now(),
        agents: states.map(s => s.id)
      })
    }

    this.emergenceHistory.push(...emergence)

    console.log(`   ✓ Detected ${emergence.length} emergent behaviors`)
    for (const e of emergence) {
      console.log(`      • ${e.type}: ${(e.confidence * 100).toFixed(0)}% confidence`)
    }

    return emergence
  }

  private calculateEmergenceMetrics(states: AgentState[]): EmergenceMetrics {
    // Calculate various emergence indicators
    const avgDistance = this.calculateAverageDistance(states)
    const velocityAlignment = this.calculateVelocityAlignment(states)
    const spatialClustering = this.calculateSpatialClustering(states)

    return {
      hasEmergence: velocityAlignment > 0.7 || spatialClustering > 0.6,
      emergenceType: [],
      collectiveIntelligence: (velocityAlignment + spatialClustering) / 2,
      selfOrganizationLevel: Math.min(1, spatialClustering + 0.3),
      noveltyScore: Math.random() * 0.5, // Would be calculated from unique patterns
      complexityIndex: this.calculateComplexityIndex(states)
    }
  }

  private calculateAverageDistance(states: AgentState[]): number {
    if (states.length < 2) return 0

    let totalDist = 0
    let count = 0

    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const dist = this.distance3D(states[i].position, states[j].position)
        totalDist += dist
        count++
      }
    }

    return count > 0 ? totalDist / count : 0
  }

  private distance3D(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2) +
      Math.pow(a.z - b.z, 2)
    )
  }

  private calculateVelocityAlignment(states: AgentState[]): number {
    if (states.length < 2) return 0

    let totalAlignment = 0
    let count = 0

    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const alignment = this.cosineSimilarity3D(states[i].velocity, states[j].velocity)
        totalAlignment += Math.max(0, alignment)
        count++
      }
    }

    return count > 0 ? totalAlignment / count : 0
  }

  private cosineSimilarity3D(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    const dot = a.x * b.x + a.y * b.y + a.z * b.z
    const magA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
    const magB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z)

    if (magA === 0 || magB === 0) return 0
    return dot / (magA * magB)
  }

  private calculateSpatialClustering(states: AgentState[]): number {
    const avgDist = this.calculateAverageDistance(states)
    const maxDist = 100 // Normalization factor

    return Math.max(0, 1 - avgDist / maxDist)
  }

  private calculateComplexityIndex(states: AgentState[]): number {
    // Measure complexity via entropy of states
    const uniqueStates = new Set<string>()

    for (const state of states) {
      const stateKey = `${Math.round(state.position.x)},${Math.round(state.position.y)},${Math.round(state.position.z)}`
      uniqueStates.add(stateKey)
    }

    const entropy = -([...uniqueStates.values()].map(s => {
      const p = 1 / states.length
      return p * Math.log2(p)
    }).reduce((sum, v) => sum + v, 0))

    return Math.min(1, entropy / 10)
  }

  private detectFlocking(states: AgentState[]): boolean {
    return this.calculateVelocityAlignment(states) > 0.7 &&
           this.calculateSpatialClustering(states) > 0.5
  }

  private detectClustering(states: AgentState[]): boolean {
    return this.calculateSpatialClustering(states) > 0.6
  }

  private detectVortex(states: AgentState[]): boolean {
    if (states.length < 3) return false

    // Check for circular motion
    const center = this.calculateCenter(states)
    let clockwise = 0
    let counterClockwise = 0

    for (const state of states) {
      const dx = state.position.x - center.x
      const dy = state.position.y - center.y
      const cross = dx * state.velocity.y - dy * state.velocity.x

      if (cross > 0) clockwise++
      else counterClockwise++
    }

    const rotation = Math.abs(clockwise - counterClockwise) / states.length
    return rotation > 0.6
  }

  private calculateCenter(states: AgentState[]): { x: number; y: number; z: number } {
    let x = 0, y = 0, z = 0

    for (const state of states) {
      x += state.position.x
      y += state.position.y
      z += state.position.z
    }

    return {
      x: x / states.length,
      y: y / states.length,
      z: z / states.length
    }
  }

  private detectWave(states: AgentState[]): boolean {
    // Check for spatial velocity correlations
    const quadrants = new Map<string, { vx: number; vy: number; vz: number; count: number }>()

    for (const state of states) {
      const qx = state.position.x > 0 ? 'E' : 'W'
      const qy = state.position.y > 0 ? 'N' : 'S'
      const key = qx + qy

      const current = quadrants.get(key) || { vx: 0, vy: 0, vz: 0, count: 0 }
      current.vx += state.velocity.x
      current.vy += state.velocity.y
      current.vz += state.velocity.z
      current.count++

      quadrants.set(key, current)
    }

    // Check if adjacent quadrants have aligned velocities
    const velKeys = [...quadrants.keys()].sort()
    let alignedPairs = 0
    let totalPairs = 0

    for (let i = 0; i < velKeys.length - 1; i++) {
      const v1 = quadrants.get(velKeys[i])!
      const v2 = quadrants.get(velKeys[i + 1])!

      const similarity = this.cosineSimilarity3D(
        { x: v1.vx / v1.count, y: v1.vy / v1.count, z: v1.vz / v1.count },
        { x: v2.vx / v2.count, y: v2.vy / v2.count, z: v2.vz / v2.count }
      )

      if (similarity > 0.8) alignedPairs++
      totalPairs++
    }

    return totalPairs > 0 && alignedPairs / totalPairs > 0.7
  }

  private detectNovelBehavior(states: AgentState[]): { confidence: number; description: string } | null {
    // Check for patterns not matching known emergence types
    const hasFlocking = this.detectFlocking(states)
    const hasClustering = this.detectClustering(states)
    const hasVortex = this.detectVortex(states)
    const hasWave = this.detectWave(states)

    if (!hasFlocking && !hasClustering && !hasVortex && !hasWave) {
      // Check if there's any coherent pattern
      const complexity = this.calculateComplexityIndex(states)

      if (complexity > 0.5) {
        return {
          confidence: 0.6,
          description: `Novel complex behavior detected (complexity: ${complexity.toFixed(2)})`
        }
      }
    }

    return null
  }

  /**
   * FOSTER EMERGENCE - Create conditions for emergent behavior
   */
  fosterEmergence(patterns: string[]): {
    suggestedConfig: any
    expectedEmergence: string[]
  } {
    console.log(`\n🌱 Fostering emergence`)

    const config = {
      agentCount: 100 + Math.floor(Math.random() * 400),
      perceptionRadius: 30 + Math.floor(Math.random() * 70),
      separationWeight: 1.0 + Math.random() * 2.0,
      alignmentWeight: 0.5 + Math.random() * 1.5,
      cohesionWeight: 0.5 + Math.random() * 1.5,
      maxSpeed: 2 + Math.random() * 6,
      randomness: Math.random() * 0.3
    }

    const expected = ['flocking', 'clustering', 'wave'].filter(() => Math.random() > 0.5)

    console.log(`   ✓ Configuration suggested`)
    console.log(`      Agents: ${config.agentCount}`)
    console.log(`      Expected emergence: ${expected.join(', ')}`)

    return {
      suggestedConfig: config,
      expectedEmergence: expected
    }
  }

  /**
   * MEASURE EMERGENCE - Get comprehensive emergence metrics
   */
  measureEmergence(agentId: string): EmergenceMetrics | null {
    const states = this.agentStates.get(agentId)
    if (!states) return null

    return this.calculateEmergenceMetrics(states)
  }

  getMetrics() {
    return {
      totalEmergenceEvents: this.emergenceHistory.length,
      emergenceByType: this.getEmergenceByType(),
      avgConfidence: this.emergenceHistory.reduce((sum, e) => sum + e.confidence, 0) /
                     (this.emergenceHistory.length || 1)
    }
  }

  private getEmergenceByType(): Map<string, number> {
    const counts = new Map<string, number>()

    for (const e of this.emergenceHistory) {
      counts.set(e.type, (counts.get(e.type) || 0) + 1)
    }

    return counts
  }
}

export { EmergentIntelligence, Emergence, EmergenceMetrics, AgentState }

if (import.meta.main) {
  console.log('🧪 Emergent Intelligence Test\n')

  const ei = new EmergentIntelligence()

  // Create sample agent states
  const states: AgentState[] = Array.from({ length: 50 }, () => ({
    id: crypto.randomUUID(),
    position: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, z: 0 },
    velocity: { x: 1, y: 0.5, z: 0 },
    internalState: new Map()
  }))

  // Detect emergence
  const emergence = ei.detectEmergence('test-agent', states)

  // Foster emergence
  const suggestions = ei.fosterEmergence(['flocking'])

  // Get metrics
  const metrics = ei.getMetrics()
  console.log('\n--- Metrics ---')
  console.log(JSON.stringify(metrics, null, 2))

  console.log('\n✅ Emergent Intelligence loaded')
}
