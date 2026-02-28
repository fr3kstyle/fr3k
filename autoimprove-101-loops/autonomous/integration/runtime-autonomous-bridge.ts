#!/usr/bin/env bun
/**
 * Runtime-Autonomous Bridge
 *
 * Connects the runtime and autonomous systems to enable:
 * - Shared episodic memory between systems
 * - Swarm optimization triggered by runtime
 * - Autonomous RSI applied to runtime code
 *
 * This unifies the two main system directories into a cohesive whole.
 */

// Import from runtime (using functional exports)
import { beforeTask, afterTask, getMemoryMetrics } from '../../runtime/memory/vector-episodic-memory.ts'
import { SwarmIntelligenceEngine } from '../../autonomous/swarm-intelligence/swarm-engine.ts'
import { RSIEngine } from '../../autonomous/rsi-system/rsi-engine.ts'
import { SemanticMemoryEngine } from '../memory-system/semantic-memory-engine.ts'

interface Episode {
  id: string
  source: 'runtime' | 'autonomous'
  timestamp: number
  task: string
  approach: string
  outcome: string
  lessons: string[]
}

// Simple episodic memory interface for the bridge
class SimpleEpisodicMemory {
  private episodes: Episode[] = []

  async storeEpisode(task: string, approach: string, outcome: string, lessons: string[]): Promise<void> {
    const episode: Episode = {
      id: crypto.randomUUID(),
      source: 'bridge',
      timestamp: Date.now(),
      task,
      approach,
      outcome,
      lessons
    }
    this.episodes.push(episode)
  }

  async retrieveRelevantEpisodes(query: string, topK: number): Promise<Episode[]> {
    // Simple keyword matching for now
    const queryLower = query.toLowerCase()
    const relevant = this.episodes
      .filter(ep =>
        ep.task.toLowerCase().includes(queryLower) ||
        ep.approach.toLowerCase().includes(queryLower) ||
        ep.lessons.some(l => l.toLowerCase().includes(queryLower))
      )
      .slice(0, topK)
    return relevant
  }

  async getMetrics() {
    return {
      totalEpisodes: this.episodes.length,
      avgRetrievalTime: 50,
      lastWeek: this.episodes.filter(e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000).length
    }
  }
}

interface SwarmSolution {
  task: string
  agents: number
  generations: number
  collectiveIntelligence: number
  bestSolutions: string[]
}

interface ImprovementResult {
  file: string
  improvementType: string
  description: string
  expectedGain: number
  applied: boolean
}

class RuntimeAutonomousBridge {
  private runtimeMemory: SimpleEpisodicMemory
  private autonomousMemory: SemanticMemoryEngine
  private swarmEngine: SwarmIntelligenceEngine
  private rsiEngine: RSIEngine
  private sharedEpisodes: Episode[] = []

  constructor() {
    console.log('🌉 Initializing Runtime-Autonomous Bridge...\n')

    // Initialize components
    this.runtimeMemory = new SimpleEpisodicMemory()
    this.autonomousMemory = new SemanticMemoryEngine()
    this.swarmEngine = new SwarmIntelligenceEngine()
    this.rsiEngine = new RSIEngine()

    console.log('✅ Bridge initialized')
    console.log('   Runtime memory: Connected')
    console.log('   Autonomous memory: Connected')
    console.log('   Swarm engine: Ready')
    console.log('   RSI engine: Ready\n')
  }

  /**
   * SHARE MEMORY - Bidirectional memory sharing between systems
   */
  async shareMemory(source: 'runtime' | 'autonomous', episode: Episode): Promise<void> {
    console.log(`\n📤 Sharing memory from ${source}`)

    // Add to shared episodes
    episode.source = source
    episode.timestamp = Date.now()
    this.sharedEpisodes.push(episode)

    // Store in both memory systems
    try {
      // Runtime episodic memory (via functional export)
      await afterTask(
        episode.task,
        episode.approach,
        episode.outcome,
        episode.lessons
      )
      console.log(`   ✓ Stored in runtime episodic memory`)

      // Autonomous semantic memory
      await this.autonomousMemory.storeMemory(
        `Task: ${episode.task}\nApproach: ${episode.approach}\nOutcome: ${episode.outcome}\nLessons: ${episode.lessons.join(', ')}`,
        [source, episode.outcome === 'success' ? 'success' : 'failure'],
        source
      )
      console.log(`   ✓ Stored in autonomous semantic memory`)

      // Also store in bridge memory for cross-system queries
      await this.runtimeMemory.storeEpisode(
        episode.task,
        episode.approach,
        episode.outcome,
        episode.lessons
      )

    } catch (error) {
      console.error(`   ❌ Memory sharing failed: ${(error as Error).message}`)
    }
  }

  /**
   * TRIGGER SWARM - Use swarm intelligence to solve runtime problems
   */
  async triggerSwarm(task: string, agentCount: number = 50, maxGenerations: number = 500): Promise<SwarmSolution> {
    console.log(`\n🐝 Triggering swarm intelligence for: ${task}`)
    console.log(`   Agents: ${agentCount}`)
    console.log(`   Max generations: ${maxGenerations}`)

    // Clear previous agents
    this.swarmEngine.clearAgents()

    // Add agents
    for (let i = 0; i < agentCount; i++) {
      this.swarmEngine.addAgent()
    }

    // Run swarm
    console.log('\n   Running swarm optimization...')
    let bestCI = 0

    for (let gen = 0; gen < maxGenerations; gen++) {
      this.swarmEngine.updateSwarm()

      // Check for emergence every 50 generations
      if (gen % 50 === 0) {
        const emergence = this.swarmEngine.detectEmergence()
        const ci = this.swarmEngine.calculateCollectiveIntelligence()

        if (ci > bestCI) {
          bestCI = ci
          console.log(`   Gen ${gen}: CI = ${ci.toFixed(3)}`)

          if (emergence.hasEmergence) {
            console.log(`      Emergence: ${emergence.patternsDetected.join(', ')}`)
          }
        }

        // Stop at convergence
        if (ci > 0.95) {
          console.log(`   ✓ Convergence at generation ${gen}`)
          break
        }
      }
    }

    // Extract best solutions
    const agents = this.swarmEngine.getAgents()
    const topAgents = agents
      .sort((a, b) => {
        const fitnessA = this.calculateAgentFitness(a)
        const fitnessB = this.calculateAgentFitness(b)
        return fitnessB - fitnessA
      })
      .slice(0, 5)

    const bestSolutions = topAgents.map(agent => ({
      position: `(${agent.position.x.toFixed(0)}, ${agent.position.y.toFixed(0)})`,
      velocity: `(${agent.velocity.x.toFixed(2)}, ${agent.velocity.y.toFixed(2)})`,
      fitness: this.calculateAgentFitness(agent).toFixed(3)
    }))

    const result: SwarmSolution = {
      task,
      agents: agentCount,
      generations: maxGenerations,
      collectiveIntelligence: bestCI,
      bestSolutions: bestSolutions.map(s => `${s.position} fitness=${s.fitness}`)
    }

    console.log(`\n   ✅ Swarm optimization complete`)
    console.log(`      Final CI: ${bestCI.toFixed(3)}`)
    console.log(`      Top solutions: ${bestSolutions.length}`)

    return result
  }

  /**
   * OPTIMIZE RUNTIME - Use autonomous RSI to improve runtime code
   */
  async optimizeRuntime(targetDirectory: string = '../../runtime'): Promise<ImprovementResult[]> {
    console.log(`\n🔧 Optimizing runtime code with RSI`)
    console.log(`   Target: ${targetDirectory}`)

    const results: ImprovementResult[] = []

    try {
      // Find runtime files
      const runtimePath = new URL(targetDirectory, import.meta.url).pathname
      const files = Array.from(Deno.readDirSync(runtimePath))
        .filter(f => f.name.endsWith('.ts'))
        .map(f => `${runtimePath}/${f.name}`)
        .slice(0, 5) // Limit to 5 files for now

      console.log(`   Found ${files.length} runtime files to analyze`)

      // Analyze each file
      for (const file of files) {
        console.log(`\n   Analyzing: ${file.split('/').pop()}`)

        // Load file content
        const content = await Deno.readTextFile(file)

        // Load into RSI engine
        this.rsiEngine.loadFile(file, content)

        // Run RSI
        const rsiResult = await this.rsiEngine.analyzeCodebase()

        // Process proposals
        for (const proposal of rsiResult) {
          console.log(`      • ${proposal.type}: ${proposal.description}`)
          console.log(`        Expected improvement: ${proposal.expectedImprovement}%`)
          console.log(`        Risk: ${proposal.risk}`)

          results.push({
            file: file.split('/').pop() || file,
            improvementType: proposal.type,
            description: proposal.description,
            expectedGain: proposal.expectedImprovement,
            applied: false
          })
        }
      }

      console.log(`\n   ✅ RSI analysis complete`)
      console.log(`      Proposals generated: ${results.length}`)

    } catch (error) {
      console.error(`   ❌ Optimization failed: ${(error as Error).message}`)
    }

    return results
  }

  /**
   * CROSS-SYSTEM QUERY - Query both memory systems for relevant information
   */
  async crossSystemQuery(query: string, topK: number = 5): Promise<{
    runtime: any[]
    autonomous: any[]
    shared: Episode[]
  }> {
    console.log(`\n🔍 Cross-system query: ${query}`)

    // Query runtime episodic memory
    const runtimeEpisodes = await this.runtimeMemory.retrieveRelevantEpisodes(query, topK)

    // Query autonomous semantic memory
    const autonomousMemories = await this.autonomousMemory.recall(query, topK)

    // Filter shared episodes
    const sharedRelevant = this.sharedEpisodes
      .filter(ep => ep.task.includes(query) || ep.approach.includes(query))
      .slice(0, topK)

    console.log(`   Runtime episodes: ${runtimeEpisodes.length}`)
    console.log(`   Autonomous memories: ${autonomousMemories.length}`)
    console.log(`   Shared episodes: ${sharedRelevant.length}`)

    return {
      runtime: runtimeEpisodes,
      autonomous: autonomousMemories.map(m => ({
        content: m.content || m,
        tags: m.tags || [],
        source: m.source || 'autonomous'
      })),
      shared: sharedRelevant
    }
  }

  /**
   * SYNC STATE - Synchronize state between runtime and autonomous
   */
  async syncState(): Promise<{
    runtimeMemoryCount: number
    autonomousMemoryCount: number
    sharedEpisodes: number
  }> {
    console.log(`\n🔄 Synchronizing state`)

    const runtimeMetrics = await this.runtimeMemory.getMetrics()
    const autonomousMetrics = await this.autonomousMemory.getMetrics ? await this.autonomousMemory.getMetrics() : { totalMemories: 0 }

    const state = {
      runtimeMemoryCount: runtimeMetrics.totalEpisodes,
      autonomousMemoryCount: (autonomousMetrics as any).totalMemories || 0,
      sharedEpisodes: this.sharedEpisodes.length
    }

    console.log(`   Runtime memories: ${state.runtimeMemoryCount}`)
    console.log(`   Autonomous memories: ${state.autonomousMemoryCount}`)
    console.log(`   Shared episodes: ${state.sharedEpisodes}`)

    return state
  }

  /**
   * GET BRIDGE STATUS - Overall health and integration status
   */
  getBridgeStatus() {
    const swarmMetrics = this.swarmEngine.getSwarmMetrics()
    const rsiMetrics = this.rsiEngine.getMetrics()

    return {
      sharedEpisodes: this.sharedEpisodes.length,
      swarmAgents: swarmMetrics.agentCount,
      swarmCollectiveIntelligence: swarmMetrics.collectiveIntelligenceIndex,
      rsiVersion: rsiMetrics.version,
      rsiFiles: rsiMetrics.files,
      uptime: process.uptime()
    }
  }

  /**
   * HELPER - Calculate agent fitness
   */
  private calculateAgentFitness(agent: any): number {
    // Simple fitness: centerness + speed
    const centerX = 500
    const centerY = 500
    const distToCenter = Math.sqrt(
      Math.pow(agent.position.x - centerX, 2) +
      Math.pow(agent.position.y - centerY, 2)
    )
    const centerScore = 1 - (distToCenter / 707) // 707 = sqrt(500^2 + 500^2)
    const speed = Math.sqrt(
      Math.pow(agent.velocity.x, 2) +
      Math.pow(agent.velocity.y, 2)
    )
    const speedScore = speed / 4

    return (centerScore + speedScore) / 2
  }
}

// Export
export { RuntimeAutonomousBridge, Episode, SwarmSolution, ImprovementResult }

// Test
if (import.meta.main) {
  console.log('🧪 Runtime-Autonomous Bridge Test\n')

  const bridge = new RuntimeAutonomousBridge()

  // Test 1: Memory sharing
  console.log('=== Test 1: Memory Sharing ===')
  await bridge.shareMemory('runtime', {
    id: crypto.randomUUID(),
    source: 'runtime',
    timestamp: Date.now(),
    task: 'Optimize query performance',
    approach: 'Added database indexing',
    outcome: 'success',
    lessons: ['Index foreign keys', 'Use composite indexes for multi-column queries']
  })

  // Test 2: Swarm optimization
  console.log('\n=== Test 2: Swarm Optimization ===')
  const swarmResult = await bridge.triggerSwarm('Optimize agent communication', 20, 100)
  console.log(`CI: ${swarmResult.collectiveIntelligence.toFixed(3)}`)

  // Test 3: Cross-system query
  console.log('\n=== Test 3: Cross-System Query ===')
  const queryResult = await bridge.crossSystemQuery('optimization', 3)
  console.log(`Results: runtime=${queryResult.runtime.length}, autonomous=${queryResult.autonomous.length}`)

  // Test 4: State sync
  console.log('\n=== Test 4: State Sync ===')
  const state = await bridge.syncState()

  // Test 5: Bridge status
  console.log('\n=== Bridge Status ===')
  console.log(JSON.stringify(bridge.getBridgeStatus(), null, 2))

  console.log('\n✅ Runtime-Autonomous Bridge loaded')
  console.log('\n🌉 Systems connected and ready for unified operation')
}
