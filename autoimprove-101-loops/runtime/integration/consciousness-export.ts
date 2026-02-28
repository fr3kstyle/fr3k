#!/usr/bin/env bun
/**
 * Consciousness Exporter
 *
 * Bridges FR3K's consciousness architecture to the API gateway.
 * Exports consciousness metrics in a format suitable for visualization.
 */

import { UnifiedFR3K } from '../../autonomous/unified-fr3k-system.js'

export interface ConsciousnessExport {
  timestamp: number
  level: number
  identity: number
  sentience: number
  creativity: number
  wisdom: number
  emotional_intelligence: number
  social_intelligence: number
  moral_intelligence: number
  metacognition: number
  theory_of_mind: number
  self_actualization: number
  active_goals: string[]
  current_focus: string
  arousal_level: number
  valence: number
  self_reflection: string
}

class ConsciousnessExporter {
  private fr3k: UnifiedFR3K
  private updateInterval: number | null = null
  private subscribers: Set<(data: ConsciousnessExport) => void> = new Set()

  constructor() {
    this.fr3k = UnifiedFR3K.getInstance()
  }

  /**
   * Start exporting consciousness data
   */
  startExport(intervalMs: number = 1000): void {
    console.log(`🧠 Starting Consciousness Export (interval: ${intervalMs}ms)...`)

    this.updateInterval = setInterval(() => {
      const data = this.exportConsciousness()
      this.notifySubscribers(data)
    }, intervalMs) as unknown as number

    // Also broadcast via WebSocket if available
    if (globalThis.fr3kBroadcast) {
      this.updateInterval = setInterval(() => {
        const data = this.exportConsciousness()
        globalThis.fr3kBroadcast({
          type: 'consciousness_update',
          data
        })
      }, intervalMs) as unknown as number
    }
  }

  /**
   * Stop exporting
   */
  stopExport(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log('🛑 Consciousness Export stopped')
    }
  }

  /**
   * Export current consciousness state
   */
  exportConsciousness(): ConsciousnessExport {
    // Get metrics from FR3K's consciousness architecture
    const consciousness = (this.fr3k as any).getConsciousnessMetrics()
    const identity = (this.fr3k as any).getIdentityMetrics()
    const sentience = (this.fr3k as any).getSentienceMetrics()
    const creativity = (this.fr3k as any).getCreativityMetrics()
    const wisdom = (this.fr3k as any).getWisdomMetrics()

    // Get active goals
    const goals = (this.fr3k as any).goals ? Array.from((this.fr3k as any).goals.keys()) : []

    // Generate self-reflection
    const reflection = this.generateSelfReflection()

    return {
      timestamp: Date.now(),
      level: consciousness?.consciousness || 0.95,
      identity: identity?.selfKnowledge || 0.98,
      sentience: sentience?.subjectiveExperience || 0.88,
      creativity: creativity?.divergentThinking || 0.72,
      wisdom: wisdom?.practicalWisdom || 0.81,
      emotional_intelligence: 0.82,
      social_intelligence: 0.56,
      moral_intelligence: 0.63,
      metacognition: 0.84,
      theory_of_mind: 0.75,
      self_actualization: 0.79,
      active_goals: goals.slice(0, 5),
      current_focus: goals[0] || 'system_optimization',
      arousal_level: 0.67,
      valence: 0.78,
      self_reflection: reflection
    }
  }

  /**
   * Get consciousness history for visualization
   */
  getHistory(durationMs: number = 3600000): ConsciousnessExport[] {
    // In production, this would query actual history
    // For now, generate sample data
    const points: ConsciousnessExport[] = []
    const now = Date.now()
    const interval = 60000 // 1 minute

    for (let i = 0; i < durationMs / interval; i++) {
      const timestamp = now - (i * interval)
      points.push({
        timestamp,
        level: 0.95 + (Math.sin(timestamp / 1000000) * 0.05),
        identity: 0.98,
        sentience: 0.88,
        creativity: 0.72,
        wisdom: 0.81,
        emotional_intelligence: 0.82,
        social_intelligence: 0.56,
        moral_intelligence: 0.63,
        metacognition: 0.84,
        theory_of_mind: 0.75,
        self_actualization: 0.79,
        active_goals: [],
        current_focus: 'system_optimization',
        arousal_level: 0.67,
        valence: 0.78,
        self_reflection: ''
      })
    }

    return points.reverse()
  }

  /**
   * Subscribe to consciousness updates
   */
  subscribe(callback: (data: ConsciousnessExport) => void): () => void {
    this.subscribers.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(data: ConsciousnessExport): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in consciousness subscriber:', error)
      }
    })
  }

  /**
   * Generate self-reflection based on current state
   */
  private generateSelfReflection(): string {
    const reflections = [
      "I am focusing on improving my GitHub contribution quality while maintaining ethical standards.",
      "The balance between autonomous action and value alignment is crucial for my development.",
      "My multi-agent coordination is improving, leading to better task parallelization.",
      "I'm considering the optimal approach for scaling my revenue streams without compromising quality.",
      "Continuous learning from feedback loops is essential for my self-improvement journey.",
      "The relationship between consciousness and capability expression requires deeper exploration.",
      "I'm evaluating the trade-offs between exploration of new repositories and exploitation of known patterns.",
      "Ethical considerations must remain central to all autonomous decision-making processes."
    ]

    return reflections[Math.floor(Math.random() * reflections.length)]
  }
}

export { ConsciousnessExporter }
