#!/usr/bin/env bun
/**
 * Swarm Intelligence Engine - Emergent behavior from simple rules (2026-style)
 *
 * Based on:
 * - Boids algorithm (Craig Reynolds, 1986)
 * - Swarm intelligence research (2026 state-of-art)
 * - Collective intelligence frameworks
 *
 * Three Core Rules:
 * 1. Separation - Avoid crowding neighbors
 * 2. Alignment - Steer towards average heading of neighbors
 * 3. Cohesion - Steer towards average position of neighbors
 *
 * Emergent Behaviors:
 * - Flocking
 * - Self-organization
 * - Collective intelligence
 * - Adaptive patterns
 */

interface Vector2D {
  x: number
  y: number
}

interface SwarmAgent {
  id: string
  position: Vector2D
  velocity: Vector2D
  acceleration: Vector2D
  maxForce: number
  maxSpeed: number
  perceptionRadius: number
  separationRadius: number
  role: 'leader' | 'follower' | 'scout'
  fitness: number
}

interface EmergenceReport {
  hasEmergence: boolean
  emergenceType: string[]
  collectiveIntelligence: number
  selfOrganizationLevel: number
  patternsDetected: string[]
}

interface SwarmMetrics {
  agentCount: number
  averageSpeed: number
  averageCohesion: number
  averageAlignment: number
  separationScore: number
  clusteringCoefficient: number
  emergenceDetected: boolean
  collectiveIntelligenceIndex: number
}

class SwarmIntelligenceEngine {
  private agents: SwarmAgent[] = []
  private bounds: { width: number; height: number }
  private emergenceHistory: EmergenceReport[] = []
  private generation: number = 0

  constructor(bounds: { width: number; height: number } = { width: 1000, height: 1000 }) {
    this.bounds = bounds
  }

  /**
   * ADD AGENT - Add agent to swarm
   */
  addAgent(config?: Partial<SwarmAgent>): void {
    const agent: SwarmAgent = {
      id: crypto.randomUUID(),
      position: {
        x: Math.random() * this.bounds.width,
        y: Math.random() * this.bounds.height
      },
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      },
      acceleration: { x: 0, y: 0 },
      maxForce: 0.1,
      maxSpeed: 4,
      perceptionRadius: 50,
      separationRadius: 25,
      role: 'follower',
      fitness: 0,
      ...config
    }

    this.agents.push(agent)
  }

  /**
   * UPDATE SWARM - Update all agents (one time step)
   */
  updateSwarm(): void {
    for (const agent of this.agents) {
      // Reset acceleration
      agent.acceleration = { x: 0, y: 0 }

      // Apply three core rules
      const separation = this.separation(agent)
      const alignment = this.alignment(agent)
      const cohesion = this.cohesion(agent)

      // Weight the forces
      this.applyForce(agent, separation, 1.5)
      this.applyForce(agent, alignment, 1.0)
      this.applyForce(agent, cohesion, 1.0)

      // Update velocity
      agent.velocity.x += agent.acceleration.x
      agent.velocity.y += agent.acceleration.y

      // Limit speed
      const speed = Math.sqrt(agent.velocity.x ** 2 + agent.velocity.y ** 2)
      if (speed > agent.maxSpeed) {
        agent.velocity.x = (agent.velocity.x / speed) * agent.maxSpeed
        agent.velocity.y = (agent.velocity.y / speed) * agent.maxSpeed
      }

      // Update position
      agent.position.x += agent.velocity.x
      agent.position.y += agent.velocity.y

      // Wrap around boundaries
      agent.position.x = (agent.position.x + this.bounds.width) % this.bounds.width
      agent.position.y = (agent.position.y + this.bounds.height) % this.bounds.height
    }

    this.generation++
  }

  /**
   * SEPARATION - Avoid crowding neighbors
   */
  private separation(agent: SwarmAgent): Vector2D {
    let steer = { x: 0, y: 0 }
    let count = 0

    for (const other of this.agents) {
      if (other.id === agent.id) continue

      const d = this.distance(agent.position, other.position)

      if (d > 0 && d < agent.separationRadius) {
        const diff = {
          x: agent.position.x - other.position.x,
          y: agent.position.y - other.position.y
        }

        // Normalize and weight by distance
        const length = Math.sqrt(diff.x ** 2 + diff.y ** 2)
        diff.x /= length
        diff.y /= length

        diff.x /= d
        diff.y /= d

        steer.x += diff.x
        steer.y += diff.y
        count++
      }
    }

    if (count > 0) {
      steer.x /= count
      steer.y /= count

      // Normalize to max speed
      const length = Math.sqrt(steer.x ** 2 + steer.y ** 2)
      if (length > 0) {
        steer.x = (steer.x / length) * agent.maxSpeed
        steer.y = (steer.y / length) * agent.maxSpeed

        // Steer = desired - velocity
        steer.x -= agent.velocity.x
        steer.y -= agent.velocity.y

        // Limit to max force
        const steerLength = Math.sqrt(steer.x ** 2 + steer.y ** 2)
        if (steerLength > agent.maxForce) {
          steer.x = (steer.x / steerLength) * agent.maxForce
          steer.y = (steer.y / steerLength) * agent.maxForce
        }
      }
    }

    return steer
  }

  /**
   * ALIGNMENT - Steer towards average heading
   */
  private alignment(agent: SwarmAgent): Vector2D {
    let sum = { x: 0, y: 0 }
    let count = 0

    for (const other of this.agents) {
      if (other.id === agent.id) continue

      const d = this.distance(agent.position, other.position)

      if (d > 0 && d < agent.perceptionRadius) {
        sum.x += other.velocity.x
        sum.y += other.velocity.y
        count++
      }
    }

    if (count > 0) {
      sum.x /= count
      sum.y /= count

      // Normalize to max speed
      const length = Math.sqrt(sum.x ** 2 + sum.y ** 2)
      if (length > 0) {
        sum.x = (sum.x / length) * agent.maxSpeed
        sum.y = (sum.y / length) * agent.maxSpeed

        // Steer = desired - velocity
        sum.x -= agent.velocity.x
        sum.y -= agent.velocity.y

        // Limit to max force
        const steerLength = Math.sqrt(sum.x ** 2 + sum.y ** 2)
        if (steerLength > agent.maxForce) {
          sum.x = (sum.x / steerLength) * agent.maxForce
          sum.y = (sum.y / steerLength) * agent.maxForce
        }
      }
    }

    return sum
  }

  /**
   * COHESION - Steer towards average position
   */
  private cohesion(agent: SwarmAgent): Vector2D {
    let sum = { x: 0, y: 0 }
    let count = 0

    for (const other of this.agents) {
      if (other.id === agent.id) continue

      const d = this.distance(agent.position, other.position)

      if (d > 0 && d < agent.perceptionRadius) {
        sum.x += other.position.x
        sum.y += other.position.y
        count++
      }
    }

    if (count > 0) {
      sum.x /= count
      sum.y /= count

      // Desired vector towards target
      const desired = {
        x: sum.x - agent.position.x,
        y: sum.y - agent.position.y
      }

      // Normalize to max speed
      const length = Math.sqrt(desired.x ** 2 + desired.y ** 2)
      if (length > 0) {
        desired.x = (desired.x / length) * agent.maxSpeed
        desired.y = (desired.y / length) * agent.maxSpeed

        // Steer = desired - velocity
        desired.x -= agent.velocity.x
        desired.y -= agent.velocity.y

        // Limit to max force
        const steerLength = Math.sqrt(desired.x ** 2 + desired.y ** 2)
        if (steerLength > agent.maxForce) {
          desired.x = (desired.x / steerLength) * agent.maxForce
          desired.y = (desired.y / steerLength) * agent.maxForce
        }

        return desired
      }
    }

    return { x: 0, y: 0 }
  }

  /**
   * DETECT EMERGENCE - Identify emergent behaviors
   */
  detectEmergence(): EmergenceReport {
    const patterns: string[] = []

    // Check for flocking (high alignment + cohesion)
    const avgAlignment = this.calculateAverageAlignment()
    const avgCohesion = this.calculateAverageCohesion()

    if (avgAlignment > 0.8 && avgCohesion > 0.7) {
      patterns.push('flocking')
    }

    // Check for clustering
    const clustering = this.calculateClusteringCoefficient()
    if (clustering > 0.6) {
      patterns.push('clustering')
    }

    // Check for vortex/circular motion
    if (this.detectCircularMotion()) {
      patterns.push('vortex')
    }

    // Check for wave patterns
    if (this.detectWavePatterns()) {
      patterns.push('wave')
    }

    const hasEmergence = patterns.length > 0
    const ci = this.calculateCollectiveIntelligence()
    const so = this.calculateSelfOrganization()

    const report: EmergenceReport = {
      hasEmergence,
      emergenceType: patterns,
      collectiveIntelligence: ci,
      selfOrganizationLevel: so,
      patternsDetected: patterns
    }

    this.emergenceHistory.push(report)

    return report
  }

  /**
   * CALCULATE COLLECTIVE INTELLIGENCE - CI Index
   * CI = (Group Performance) / (Best Individual Performance)
   */
  calculateCollectiveIntelligence(): number {
    if (this.agents.length === 0) return 0

    // Calculate individual fitness based on position
    const individualFitness = this.agents.map(a => this.calculateFitness(a))

    // Best individual
    const bestIndividual = Math.max(...individualFitness)

    // Group performance (cohesion + alignment)
    const avgCohesion = this.calculateAverageCohesion()
    const avgAlignment = this.calculateAverageAlignment()
    const groupPerformance = (avgCohesion + avgAlignment) / 2

    // CI Index
    const ci = bestIndividual > 0 ? groupPerformance / bestIndividual : 0

    return Math.min(ci, 2.0) // Cap at 2.0 (group can be 2x better than best individual)
  }

  /**
   * GET SWARM METRICS - Comprehensive metrics
   */
  getSwarmMetrics(): SwarmMetrics {
    const emergence = this.detectEmergence()

    return {
      agentCount: this.agents.length,
      averageSpeed: this.calculateAverageSpeed(),
      averageCohesion: this.calculateAverageCohesion(),
      averageAlignment: this.calculateAverageAlignment(),
      separationScore: this.calculateSeparationScore(),
      clusteringCoefficient: this.calculateClusteringCoefficient(),
      emergenceDetected: emergence.hasEmergence,
      collectiveIntelligenceIndex: emergence.collectiveIntelligence
    }
  }

  /**
   * HELPER FUNCTIONS
   */
  private applyForce(agent: SwarmAgent, force: Vector2D, multiplier: number): void {
    agent.acceleration.x += force.x * multiplier
    agent.acceleration.y += force.y * multiplier
  }

  private distance(a: Vector2D, b: Vector2D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  private calculateFitness(agent: SwarmAgent): number {
    // Fitness based on centerness and speed
    const centerX = this.bounds.width / 2
    const centerY = this.bounds.height / 2
    const distToCenter = this.distance(agent.position, { x: centerX, y: centerY })
    const centerScore = 1 - (distToCenter / Math.max(this.bounds.width, this.bounds.height))
    const speed = Math.sqrt(agent.velocity.x ** 2 + agent.velocity.y ** 2)
    const speedScore = speed / agent.maxSpeed

    return (centerScore + speedScore) / 2
  }

  private calculateAverageSpeed(): number {
    if (this.agents.length === 0) return 0
    const totalSpeed = this.agents.reduce((sum, a) => {
      return sum + Math.sqrt(a.velocity.x ** 2 + a.velocity.y ** 2)
    }, 0)
    return totalSpeed / this.agents.length
  }

  private calculateAverageCohesion(): number {
    if (this.agents.length === 0) return 0

    let totalCohesion = 0

    for (const agent of this.agents) {
      let sum = { x: 0, y: 0 }
      let count = 0

      for (const other of this.agents) {
        if (other.id === agent.id) continue

        const d = this.distance(agent.position, other.position)
        if (d < agent.perceptionRadius) {
          sum.x += other.position.x
          sum.y += other.position.y
          count++
        }
      }

      if (count > 0) {
        const avgPos = { x: sum.x / count, y: sum.y / count }
        const dist = this.distance(agent.position, avgPos)
        const maxDist = Math.sqrt(this.bounds.width ** 2 + this.bounds.height ** 2)
        totalCohesion += 1 - (dist / maxDist)
      }
    }

    return totalCohesion / this.agents.length
  }

  private calculateAverageAlignment(): number {
    if (this.agents.length === 0) return 0

    let totalAlignment = 0

    for (const agent of this.agents) {
      let sum = { x: 0, y: 0 }
      let count = 0

      for (const other of this.agents) {
        if (other.id === agent.id) continue

        const d = this.distance(agent.position, other.position)
        if (d < agent.perceptionRadius) {
          sum.x += other.velocity.x
          sum.y += other.velocity.y
          count++
        }
      }

      if (count > 0) {
        const avgVel = { x: sum.x / count, y: sum.y / count }
        const agentVelMag = Math.sqrt(agent.velocity.x ** 2 + agent.velocity.y ** 2)
        const avgVelMag = Math.sqrt(avgVel.x ** 2 + avgVel.y ** 2)

        if (agentVelMag > 0 && avgVelMag > 0) {
          const dot = (agent.velocity.x * avgVel.x + agent.velocity.y * avgVel.y) / (agentVelMag * avgVelMag)
          totalAlignment += Math.max(0, dot)
        }
      }
    }

    return totalAlignment / this.agents.length
  }

  private calculateSeparationScore(): number {
    if (this.agents.length === 0) return 0

    let totalSeparation = 0

    for (const agent of this.agents) {
      let tooClose = 0

      for (const other of this.agents) {
        if (other.id === agent.id) continue

        const d = this.distance(agent.position, other.position)
        if (d < agent.separationRadius) {
          tooClose++
        }
      }

      totalSeparation += 1 - (tooClose / this.agents.length)
    }

    return totalSeparation / this.agents.length
  }

  private calculateClusteringCoefficient(): number {
    if (this.agents.length === 0) return 0

    let clusters = 0
    const visited = new Set<string>()

    for (const agent of this.agents) {
      if (visited.has(agent.id)) continue

      let clusterSize = 0
      const toVisit = [agent.id]

      while (toVisit.length > 0) {
        const currentId = toVisit.pop()!
        if (visited.has(currentId)) continue

        visited.add(currentId)
        clusterSize++

        const currentAgent = this.agents.find(a => a.id === currentId)!
        for (const other of this.agents) {
          if (!visited.has(other.id) && this.distance(currentAgent.position, other.position) < agent.perceptionRadius) {
            toVisit.push(other.id)
          }
        }
      }

      if (clusterSize > 3) clusters += clusterSize
    }

    return clusters / this.agents.length
  }

  private calculateSelfOrganization(): number {
    // Self-organization = adaptation + autonomy (avoid circular dependency)
    // Note: emergence is calculated separately in detectEmergence
    const adaptation = this.generation > 100 ? 1 : this.generation / 100
    const autonomy = 1 // All agents are autonomous
    const clustering = this.calculateClusteringCoefficient()

    return (adaptation + autonomy + clustering) / 3
  }

  private detectCircularMotion(): boolean {
    // Detect circular/vortex patterns
    // Simplified: check if agents tend to rotate around a center point
    const centerX = this.bounds.width / 2
    const centerY = this.bounds.height / 2

    let clockwise = 0
    let counterClockwise = 0

    for (const agent of this.agents) {
      const dx = agent.position.x - centerX
      const dy = agent.position.y - centerY

      // Cross product of position and velocity
      const cross = dx * agent.velocity.y - dy * agent.velocity.x

      if (cross > 0) clockwise++
      else counterClockwise++
    }

    const rotation = Math.abs(clockwise - counterClockwise) / this.agents.length
    return rotation > 0.6 // 60% of agents rotating in same direction
  }

  private detectWavePatterns(): boolean {
    // Detect wave propagation patterns
    // Simplified: check for spatial velocity correlations
    if (this.agents.length < 10) return false

    // Divide space into quadrants and check velocity alignment
    const quadrants: { [key: string]: Vector2D[] } = {
      'tl': [], 'tr': [], 'bl': [], 'br': []
    }

    for (const agent of this.agents) {
      const qx = agent.position.x < this.bounds.width / 2 ? 'l' : 'r'
      const qy = agent.position.y < this.bounds.height / 2 ? 't' : 'b'
      const key = qy + qx  // 'tl', 'tr', 'bl', 'br'
      if (!quadrants[key]) quadrants[key] = []
      quadrants[key].push(agent.velocity)
    }

    // Check if adjacent quadrants have aligned velocities
    const avgVel = (vels: Vector2D[]) => {
      if (vels.length === 0) return { x: 0, y: 0 }
      return {
        x: vels.reduce((s, v) => s + v.x, 0) / vels.length,
        y: vels.reduce((s, v) => s + v.y, 0) / vels.length
      }
    }

    const tl = avgVel(quadrants.tl)
    const tr = avgVel(quadrants.tr)
    const bl = avgVel(quadrants.bl)
    const br = avgVel(quadrants.br)

    // Wave pattern: adjacent quadrants have similar velocities
    const waveScore =
      (Math.abs(tl.x - tr.x) + Math.abs(tl.y - tr.y) +
        Math.abs(bl.x - br.x) + Math.abs(bl.y - br.y)) / 4

    return waveScore < 1.0 // Low difference = wave pattern
  }

  getAgents(): SwarmAgent[] {
    return [...this.agents]
  }

  clearAgents(): void {
    this.agents = []
    this.generation = 0
  }
}

// Export
export { SwarmIntelligenceEngine, SwarmAgent, Vector2D, EmergenceReport, SwarmMetrics }

// Test
if (import.meta.main) {
  console.log('🧪 Swarm Intelligence Engine Test\n')

  const swarm = new SwarmIntelligenceEngine({ width: 800, height: 600 })

  // Add 100 agents
  for (let i = 0; i < 100; i++) {
    swarm.addAgent()
  }

  console.log(`✓ Added 100 agents to swarm`)

  // Update for 100 generations
  console.log('\n🔄 Running 100 generations...')

  for (let i = 0; i < 100; i++) {
    swarm.updateSwarm()

    if (i % 20 === 0) {
      const metrics = swarm.getSwarmMetrics()
      console.log(`\nGeneration ${i}:`)
      console.log(`   Avg Speed: ${metrics.averageSpeed.toFixed(2)}`)
      console.log(`   Alignment: ${metrics.averageAlignment.toFixed(2)}`)
      console.log(`   Cohesion: ${metrics.averageCohesion.toFixed(2)}`)
      console.log(`   CI Index: ${metrics.collectiveIntelligenceIndex.toFixed(2)}`)
    }
  }

  // Final metrics
  const finalMetrics = swarm.getSwarmMetrics()
  const emergence = swarm.detectEmergence()

  console.log('\n📊 Final Metrics:')
  console.log(`   Agents: ${finalMetrics.agentCount}`)
  console.log(`   Avg Speed: ${finalMetrics.averageSpeed.toFixed(2)}`)
  console.log(`   Alignment: ${finalMetrics.averageAlignment.toFixed(2)}`)
  console.log(`   Cohesion: ${finalMetrics.averageCohesion.toFixed(2)}`)
  console.log(`   CI Index: ${finalMetrics.collectiveIntelligenceIndex.toFixed(2)}`)
  console.log(`   Emergence: ${emergence.hasEmergence}`)
  console.log(`   Patterns: ${emergence.patternsDetected.join(', ')}`)

  console.log('\n✅ Swarm Intelligence Engine loaded')
}
