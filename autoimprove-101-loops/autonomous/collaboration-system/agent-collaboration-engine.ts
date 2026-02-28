#!/usr/bin/env bun
/**
 * Agent Collaboration Engine - LOOP 10
 *
 * Based on 2026 research:
 * - Multi-agent communication protocols
 * - Negotiation and bargaining theory
 * - Consensus formation algorithms
 * - Argumentation and debate systems
 * - Social choice theory
 * - Collaborative decision making
 *
 * Core Capability: Agents that communicate, negotiate, and reach consensus
 */

interface Agent {
  id: string
  name: string
  preferences: Map<string, number> // Issue -> Preference (0-1)
  capabilities: string[]
  constraints: string[]
  communicationStyle: 'cooperative' | 'competitive' | 'mixed'
}

interface Message {
  id: string
  from: string
  to: string
  type: 'proposal' | 'accept' | 'reject' | 'counter' | 'query' | 'inform'
  content: any
  timestamp: number
  thread?: string
}

interface NegotiationSession {
  id: string
  participants: string[]
  issues: string[]
  proposals: Map<string, any> // Agent -> Proposal
  status: 'ongoing' | 'agreement' | 'breakdown' | 'timeout'
  rounds: number
  maxRounds: number
}

interface ConsensusResult {
  agreement: any
  participants: string[]
  consensusLevel: number // 0-1
  satisfactionScores: Map<string, number>
  negotiationTime: number
}

interface Argument {
  claim: string
  premises: string[]
  strength: number
  agent: string
}

interface Debate {
  topic: string
  arguments: Argument[]
  proArguments: Argument[]
  conArguments: Argument[]
  consensus: any
}

class AgentCollaborationEngine {
  private agents: Map<string, Agent> = new Map()
  private messageLog: Message[] = []
  private negotiations: Map<string, NegotiationSession> = new Map()
  private debates: Map<string, Debate> = new Map()

  /**
   * REGISTER AGENT - Add agent to collaboration system
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent)
    console.log(`✓ Registered agent: ${agent.name}`)
  }

  /**
   * SEND MESSAGE - Agent-to-agent communication
   */
  async sendMessage(
    from: string,
    to: string,
    type: Message['type'],
    content: any,
    thread?: string
  ): Promise<string> {
    const message: Message = {
      id: crypto.randomUUID(),
      from,
      to,
      type,
      content,
      timestamp: Date.now(),
      thread
    }

    this.messageLog.push(message)

    console.log(`📨 ${from} → ${to}: ${type}`)
    if (type === 'proposal') {
      console.log(`   Content: ${JSON.stringify(content).slice(0, 50)}...`)
    }

    // Auto-reply for query messages
    if (type === 'query') {
      const toAgent = this.agents.get(to)
      if (toAgent && toAgent.communicationStyle === 'cooperative') {
        await this.sendMessage(to, from, 'inform', {
          query: content,
          response: 'Acknowledged'
        }, message.id)
      }
    }

    return message.id
  }

  /**
   * NEGOTIATE - Multi-agent negotiation
   */
  async negotiate(
    participants: string[],
    issues: string[],
    maxRounds: number = 10
  ): Promise<ConsensusResult> {
    console.log(`\n🤝 Negotiation: ${participants.length} agents, ${issues.length} issues`)

    const session: NegotiationSession = {
      id: crypto.randomUUID(),
      participants,
      issues,
      proposals: new Map(),
      status: 'ongoing',
      rounds: 0,
      maxRounds
    }

    this.negotiations.set(session.id, session)

    // Initial proposals
    for (const agentId of participants) {
      const proposal = await this.generateProposal(agentId, issues)
      session.proposals.set(agentId, proposal)

      console.log(`   ${agentId}: ${JSON.stringify(proposal).slice(0, 30)}...`)
    }

    // Negotiation rounds
    for (let round = 0; round < maxRounds; round++) {
      session.rounds++
      console.log(`\n   Round ${round + 1}/${maxRounds}`)

      // Check for agreement
      const agreement = await this.checkAgreement(session)
      if (agreement) {
        session.status = 'agreement'
        console.log(`   ✓ Agreement reached!`)

        const satisfactionScores = await this.calculateSatisfaction(session, agreement)
        const consensusLevel = Array.from(satisfactionScores.values())
          .reduce((a, b) => a + b, 0) / satisfactionScores.size

        return {
          agreement,
          participants,
          consensusLevel,
          satisfactionScores,
          negotiationTime: Date.now()
        }
      }

      // Make concessions
      await this.makeConcessions(session)

      // Check for breakdown
      if (await this.checkBreakdown(session)) {
        session.status = 'breakdown'
        console.log(`   ✗ Negotiation breakdown`)
        break
      }
    }

    // No agreement - return best compromise
    const compromise = await this.findCompromise(session)
    const satisfactionScores = await this.calculateSatisfaction(session, compromise)
    const consensusLevel = Array.from(satisfactionScores.values())
      .reduce((a, b) => a + b, 0) / satisfactionScores.size

    return {
      agreement: compromise,
      participants,
      consensusLevel,
      satisfactionScores,
      negotiationTime: Date.now()
    }
  }

  /**
   * GENERATE PROPOSAL - Create initial proposal
   */
  private async generateProposal(agentId: string, issues: string[]): Promise<any> {
    const agent = this.agents.get(agentId)!
    const proposal: Record<string, number> = {}

    for (const issue of issues) {
      // Agent's ideal position based on preferences
      const preference = agent.preferences.get(issue) || 0.5
      proposal[issue] = preference
    }

    return proposal
  }

  /**
   * CHECK AGREEMENT - See if agents agree
   */
  private async checkAgreement(session: NegotiationSession): Promise<any | null> {
    const proposals = Array.from(session.proposals.values())

    if (proposals.length === 0) return null

    // Check if all proposals are similar (within 0.1)
    const firstProposal = proposals[0]
    for (const proposal of proposals) {
      for (const issue of session.issues) {
        if (Math.abs(proposal[issue] - firstProposal[issue]) > 0.1) {
          return null // No agreement
        }
      }
    }

    return firstProposal
  }

  /**
   * MAKE CONCESSIONS - Agents move toward compromise
   */
  private async makeConcessions(session: NegotiationSession): Promise<void> {
    const concessions: Map<string, any> = new Map()

    for (const agentId of session.participants) {
      const agent = this.agents.get(agentId)!
      const currentProposal = session.proposals.get(agentId)!

      // Find average position
      const avgProposal: Record<string, number> = {}
      for (const issue of session.issues) {
        let sum = 0
        for (const [_, proposal] of session.proposals) {
          sum += proposal[issue]
        }
        avgProposal[issue] = sum / session.proposals.size
      }

      // Move 20% toward average
      const newProposal: Record<string, number> = {}
      for (const issue of session.issues) {
        const current = currentProposal[issue]
        const avg = avgProposal[issue]
        newProposal[issue] = current + (avg - current) * 0.2
      }

      concessions.set(agentId, newProposal)
    }

    // Update proposals
    for (const [agentId, proposal] of concessions) {
      session.proposals.set(agentId, proposal)
    }
  }

  /**
   * CHECK BREAKDOWN - See if negotiation failed
   */
  private async checkBreakdown(session: NegotiationSession): Promise<boolean> {
    // Breakdown if agents are too far apart after many rounds
    if (session.rounds < session.maxRounds / 2) return false

    const proposals = Array.from(session.proposals.values())
    let maxDiff = 0

    for (const issue of session.issues) {
      const values = proposals.map(p => p[issue])
      const max = Math.max(...values)
      const min = Math.min(...values)
      maxDiff = Math.max(maxDiff, max - min)
    }

    return maxDiff > 0.8 // Still very far apart
  }

  /**
   * FIND COMPROMISE - Average position when no agreement
   */
  private async findCompromise(session: NegotiationSession): Promise<any> {
    const compromise: Record<string, number> = {}

    for (const issue of session.issues) {
      let sum = 0
      for (const [_, proposal] of session.proposals) {
        sum += proposal[issue]
      }
      compromise[issue] = sum / session.proposals.size
    }

    return compromise
  }

  /**
   * CALCULATE SATISFACTION - How happy agents are with outcome
   */
  private async calculateSatisfaction(
    session: NegotiationSession,
    outcome: any
  ): Promise<Map<string, number>> {
    const satisfaction = new Map<string, number>()

    for (const agentId of session.participants) {
      const agent = this.agents.get(agentId)!
      const agentProposal = session.proposals.get(agentId)!

      let totalDiff = 0
      for (const issue of session.issues) {
        const pref = agent.preferences.get(issue) || 0.5
        const actual = outcome[issue]
        totalDiff += Math.abs(pref - actual)
      }

      // Satisfaction inverse to distance from preference
      const avgDiff = totalDiff / session.issues.length
      const sat = 1 - avgDiff
      satisfaction.set(agentId, Math.max(0, Math.min(1, sat)))
    }

    return satisfaction
  }

  /**
   * DEBATE - Structured argumentation
   */
  async debate(
    topic: string,
    participants: string[],
    rounds: number = 3
  ): Promise<Debate> {
    console.log(`\n🎤 Debate: ${topic}`)
    console.log(`   Participants: ${participants.length}, Rounds: ${rounds}`)

    const debate: Debate = {
      topic,
      arguments: [],
      proArguments: [],
      conArguments: [],
      consensus: null
    }

    for (let round = 0; round < rounds; round++) {
      console.log(`\n   Round ${round + 1}:`)

      for (const agentId of participants) {
        const agent = this.agents.get(agentId)!

        // Generate argument
        const argument = await this.generateArgument(agent, topic, debate)
        debate.arguments.push(argument)

        // Classify as pro or con
        if (argument.strength > 0.5) {
          debate.proArguments.push(argument)
        } else {
          debate.conArguments.push(argument)
        }

        console.log(`   ${agent.name}: ${argument.claim.slice(0, 50)}... (${(argument.strength * 100).toFixed(0)}%)`)
      }
    }

    // Determine consensus based on stronger side
    const proStrength = debate.proArguments.reduce((sum, a) => sum + a.strength, 0)
    const conStrength = debate.conArguments.reduce((sum, a) => sum + a.strength, 0)

    if (proStrength > conStrength) {
      debate.consensus = { position: 'pro', confidence: proStrength / (proStrength + conStrength) }
    } else {
      debate.consensus = { position: 'con', confidence: conStrength / (proStrength + conStrength) }
    }

    console.log(`\n   Consensus: ${debate.consensus.position} (${(debate.consensus.confidence * 100).toFixed(1)}%)`)

    this.debates.set(topic, debate)

    return debate
  }

  /**
   * GENERATE ARGUMENT - Create argument for debate
   */
  private async generateArgument(
    agent: Agent,
    topic: string,
    debate: Debate
  ): Promise<Argument> {
    const claims = [
      `${topic} is beneficial because it improves efficiency`,
      `${topic} should be rejected due to potential risks`,
      `${topic} requires careful consideration of trade-offs`,
      `The evidence suggests ${topic} will succeed`,
      `${topic} has significant drawbacks that cannot be ignored`
    ]

    const premises = [
      'Historical data supports this',
      'Expert opinion agrees',
      'Cost-benefit analysis favorable',
      'Risk assessment within limits',
      'Stakeholder feedback positive'
    ]

    const claim = claims[Math.floor(Math.random() * claims.length)]
    const numPremises = 2 + Math.floor(Math.random() * 2)
    const selectedPremises = premises.slice(0, numPremises)

    // Strength based on agent's communication style
    let baseStrength = 0.5
    if (agent.communicationStyle === 'cooperative') {
      baseStrength = 0.6
    } else if (agent.communicationStyle === 'competitive') {
      baseStrength = 0.7
    }

    return {
      claim,
      premises: selectedPremises,
      strength: baseStrength + Math.random() * 0.3,
      agent: agent.id
    }
  }

  /**
   * VOTE - Social choice / voting mechanism
   */
  async vote(
    participants: string[],
    options: string[],
    method: 'plurality' | 'approval' | 'ranked' | 'condorcet' = 'plurality'
  ): Promise<{
    winner: string
    results: Map<string, number>
    method: string
  }> {
    console.log(`\n🗳️ Vote: ${participants.length} agents, ${options.length} options`)
    console.log(`   Method: ${method}`)

    const votes = new Map<string, number[]>()

    // Collect votes
    for (const agentId of participants) {
      const agent = this.agents.get(agentId)!
      let vote: number[]

      switch (method) {
        case 'plurality':
          // Single choice
          vote = [Math.floor(Math.random() * options.length)]
          break

        case 'approval':
          // Approve any option above threshold
          vote = options.map((_, i) => Math.random() > 0.5 ? 1 : 0)
          break

        case 'ranked':
          // Ranking from best to worst
          const ranking = options.map((_, i) => i)
          for (let i = ranking.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[ranking[i], ranking[j]] = [ranking[j], ranking[i]]
          }
          vote = ranking
          break

        case 'condorcet':
          // Pairwise preferences
          vote = options.map(() => Math.random())
          break
      }

      votes.set(agentId, vote)
      console.log(`   ${agent.name}: ${vote.join(', ')}`)
    }

    // Tally votes
    const results = await this.tallyVotes(votes, options, method)

    // Find winner
    let winner = options[0]
    let maxVotes = 0

    for (const [option, count] of results) {
      if (count > maxVotes) {
        maxVotes = count
        winner = option
      }
    }

    console.log(`\n   Winner: ${winner} (${maxVotes} votes)`)

    return { winner, results, method }
  }

  /**
   * TALLY VOTES - Count votes based on method
   */
  private async tallyVotes(
    votes: Map<string, number[]>,
    options: string[],
    method: string
  ): Promise<Map<string, number>> {
    const results = new Map<string, number>()

    for (const option of options) {
      results.set(option, 0)
    }

    for (const [_, vote] of votes) {
      if (method === 'plurality') {
        const choice = vote[0]
        results.set(options[choice], (results.get(options[choice]) || 0) + 1)
      } else if (method === 'approval') {
        for (let i = 0; i < vote.length; i++) {
          if (vote[i] === 1) {
            results.set(options[i], (results.get(options[i]) || 0) + 1)
          }
        }
      } else if (method === 'ranked') {
        // Borda count
        for (let i = 0; i < vote.length; i++) {
          const points = vote.length - i
          results.set(options[vote[i]], (results.get(options[vote[i]]) || 0) + points)
        }
      } else if (method === 'condorcet') {
        // Pairwise comparison
        for (let i = 0; i < vote.length; i++) {
          for (let j = i + 1; j < vote.length; j++) {
            if (vote[i] > vote[j]) {
              results.set(options[i], (results.get(options[i]) || 0) + 1)
            } else {
              results.set(options[j], (results.get(options[j]) || 0) + 1)
            }
          }
        }
      }
    }

    return results
  }

  /**
   * FORM CONSENSUS - Find general agreement
   */
  async formConsensus(
    participants: string[],
    proposal: any
  ): Promise<{
    consensus: boolean
    agreement: number // 0-1
    objections: string[]
  }> {
    console.log(`\n🤝 Consensus formation: ${participants.length} agents`)

    const agreement: number[] = []
    const objections: string[] = []

    for (const agentId of participants) {
      const agent = this.agents.get(agentId)

      // Check if proposal aligns with agent preferences
      let alignment = 0
      for (const [key, value] of Object.entries(proposal)) {
        const pref = agent?.preferences.get(key) || 0.5
        if (typeof value === 'number') {
          alignment += 1 - Math.abs(pref - value)
        }
      }

      const avgAlignment = alignment / Object.keys(proposal).length
      agreement.push(avgAlignment)

      if (avgAlignment < 0.5) {
        objections.push(agentId)
      }
    }

    const avgAgreement = agreement.reduce((a, b) => a + b, 0) / agreement.length
    const consensus = avgAgreement > 0.7 && objections.length < participants.length / 3

    console.log(`   Average agreement: ${(avgAgreement * 100).toFixed(1)}%`)
    console.log(`   Objections: ${objections.length}`)
    console.log(`   Consensus: ${consensus ? '✓' : '✗'}`)

    return {
      consensus,
      agreement: avgAgreement,
      objections
    }
  }

  /**
   * GET METRICS - Collaboration statistics
   */
  getMetrics(): {
    totalAgents: number
    messagesSent: number
    negotiations: number
    debates: number
    agreements: number
  } {
    return {
      totalAgents: this.agents.size,
      messagesSent: this.messageLog.length,
      negotiations: this.negotiations.size,
      debates: this.debates.size,
      agreements: Array.from(this.negotiations.values()).filter(n => n.status === 'agreement').length
    }
  }
}

// Export
export { AgentCollaborationEngine, Agent, Message, NegotiationSession, ConsensusResult, Argument, Debate }

// Test
if (import.meta.main) {
  console.log('🧪 Agent Collaboration Engine Test\n')

  const engine = new AgentCollaborationEngine()

  // Register agents
  const agents: Agent[] = [
    {
      id: 'agent1',
      name: 'Alice',
      preferences: new Map([['budget', 0.8], ['timeline', 0.6], ['quality', 0.9]]),
      capabilities: ['planning', 'analysis'],
      constraints: [],
      communicationStyle: 'cooperative'
    },
    {
      id: 'agent2',
      name: 'Bob',
      preferences: new Map([['budget', 0.4], ['timeline', 0.9], ['quality', 0.7]]),
      capabilities: ['execution', 'testing'],
      constraints: [],
      communicationStyle: 'competitive'
    },
    {
      id: 'agent3',
      name: 'Charlie',
      preferences: new Map([['budget', 0.6], ['timeline', 0.7], ['quality', 0.8]]),
      capabilities: ['design', 'review'],
      constraints: [],
      communicationStyle: 'mixed'
    }
  ]

  for (const agent of agents) {
    engine.registerAgent(agent)
  }

  // Test 1: Communication
  console.log('=== Test 1: Agent Communication ===')
  await engine.sendMessage('agent1', 'agent2', 'proposal', { budget: 100, timeline: 30 })
  await engine.sendMessage('agent2', 'agent3', 'query', { question: 'Ready?' })

  // Test 2: Negotiation
  console.log('\n=== Test 2: Negotiation ===')
  const result = await engine.negotiate(
    ['agent1', 'agent2', 'agent3'],
    ['budget', 'timeline', 'quality'],
    5
  )
  console.log(`   Consensus level: ${(result.consensusLevel * 100).toFixed(1)}%`)

  // Test 3: Debate
  console.log('\n=== Test 3: Debate ===')
  await engine.debate(
    'Should we increase the budget?',
    ['agent1', 'agent2', 'agent3'],
    2
  )

  // Test 4: Voting
  console.log('\n=== Test 4: Voting ===')
  await engine.vote(
    ['agent1', 'agent2', 'agent3'],
    ['Option A', 'Option B', 'Option C'],
    'plurality'
  )

  // Test 5: Consensus
  console.log('\n=== Test 5: Consensus Formation ===')
  await engine.formConsensus(
    ['agent1', 'agent2', 'agent3'],
    { budget: 0.6, timeline: 0.7, quality: 0.8 }
  )

  console.log('\n📊 Metrics:', engine.getMetrics())

  console.log('\n✅ Agent Collaboration Engine loaded')
}
