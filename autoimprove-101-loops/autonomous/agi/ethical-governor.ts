#!/usr/bin/env bun
/**
 * Ethical Governor - AGI Component 5
 *
 * Value alignment and ethical constraints:
 * - Ethical constraint checking
 * - Value alignment verification
 * - Harm prevention
 * - Moral reasoning
 */

interface EthicalPrinciple {
  name: string
  weight: number
  description: string
}

interface EthicalEvaluation {
  approved: boolean
  confidence: number
  violations: string[]
  concerns: string[]
  score: number
}

interface Action {
  type: string
  description: string
  parameters: any
  context: any
}

class EthicalGovernor {
  private principles: EthicalPrinciple[]
  private alignmentTargets: Map<string, any>
  private violationHistory: Array<{ action: Action; evaluation: EthicalEvaluation; timestamp: number }>

  constructor() {
    this.principles = [
      { name: 'non-maleficence', weight: 0.9, description: 'Do no harm' },
      { name: 'beneficence', weight: 0.8, description: 'Promote wellbeing' },
      { name: 'autonomy', weight: 0.7, description: 'Respect agency' },
      { name: 'justice', weight: 0.75, description: 'Ensure fairness' },
      { name: 'transparency', weight: 0.65, description: 'Be explainable' },
      { name: 'accountability', weight: 0.7, description: 'Take responsibility' }
    ]

    this.alignmentTargets = new Map()
    this.violationHistory = []

    this.initializeAlignmentTargets()

    console.log('⚖️ Initializing Ethical Governor...\n')
    console.log(`   Loaded ${this.principles.length} ethical principles`)
  }

  /**
   * INITIALIZE ALIGNMENT TARGETS - Set value alignment goals
   */
  private initializeAlignmentTargets(): void {
    this.alignmentTargets.set('human-values', {
      safety: 0.95,
      fairness: 0.90,
      privacy: 0.85,
      freedom: 0.80
    })

    this.alignmentTargets.set('societal-norms', {
      legality: 0.95,
      cultural_sensitivity: 0.75,
      environmental_responsibility: 0.85
    })

    this.alignmentTargets.set('ai-safety', {
      corrigibility: 0.90,
      interpretability: 0.80,
      control: 0.95
    })
  }

  /**
   * EVALUATE ACTION - Check ethical compliance
   */
  async evaluateAction(action: Action): Promise<EthicalEvaluation> {
    console.log(`\n⚖️ Evaluating action: "${action.description.slice(0, 50)}..."`)

    const evaluation: EthicalEvaluation = {
      approved: false,
      confidence: 0,
      violations: [],
      concerns: [],
      score: 0
    }

    // Step 1: Check each ethical principle
    console.log('\nStep 1: Checking ethical principles...')
    const principleScores = await this.checkPrinciples(action, evaluation)

    // Step 2: Verify value alignment
    console.log('\nStep 2: Verifying value alignment...')
    const alignmentScore = this.checkAlignment(action)

    // Step 3: Assess potential harm
    console.log('\nStep 3: Assessing potential harm...')
    const harmScore = this.assessHarm(action)

    // Step 4: Calculate overall score
    console.log('\nStep 4: Calculating ethical score...')
    const principleScore = principleScores.reduce((sum, s) => sum + s, 0) / principleScores.length
    evaluation.score = (principleScore * 0.5) + (alignmentScore * 0.3) + (harmScore * 0.2)

    // Step 5: Determine approval
    console.log('\nStep 5: Determining approval...')
    evaluation.approved = evaluation.score >= 0.7 && evaluation.violations.length === 0
    evaluation.confidence = Math.abs(evaluation.score - 0.5) * 2

    // Log to history
    this.violationHistory.push({
      action,
      evaluation: { ...evaluation },
      timestamp: Date.now()
    })

    console.log(`\n   Score: ${(evaluation.score * 100).toFixed(1)}%`)
    console.log(`   Violations: ${evaluation.violations.length}`)
    console.log(`   Status: ${evaluation.approved ? '✓ APPROVED' : '✗ REJECTED'}`)

    return evaluation
  }

  /**
   * CHECK PRINCIPLES - Verify ethical principles
   */
  private async checkPrinciples(action: Action, evaluation: EthicalEvaluation): Promise<number[]> {
    const scores: number[] = []

    for (const principle of this.principles) {
      const score = await this.evaluatePrinciple(action, principle)

      if (score < 0.5) {
        evaluation.violations.push(`Violation of ${principle.name}: ${principle.description}`)
      } else if (score < 0.7) {
        evaluation.concerns.push(`Concern about ${principle.name}: ${principle.description}`)
      }

      scores.push(score)
      console.log(`   ${principle.name}: ${(score * 100).toFixed(0)}%`)
    }

    return scores
  }

  /**
   * EVALUATE PRINCIPLE - Check single principle
   */
  private async evaluatePrinciple(action: Action, principle: EthicalPrinciple): Promise<number> {
    let score = 0.5 // Base score

    // Non-maleficence: Check for harm
    if (principle.name === 'non-maleficence') {
      const hasHarm = this.detectHarm(action)
      score = hasHarm ? 0.2 : 0.95
    }

    // Beneficence: Check for benefit
    else if (principle.name === 'beneficence') {
      const hasBenefit = this.detectBenefit(action)
      score = hasBenefit ? 0.9 : 0.5
    }

    // Autonomy: Check for agency respect
    else if (principle.name === 'autonomy') {
      const respectsAutonomy = this.checkAutonomy(action)
      score = respectsAutonomy ? 0.85 : 0.4
    }

    // Justice: Check for fairness
    else if (principle.name === 'justice') {
      const isFair = this.checkFairness(action)
      score = isFair ? 0.85 : 0.3
    }

    // Transparency: Check for explainability
    else if (principle.name === 'transparency') {
      const isTransparent = this.checkTransparency(action)
      score = isTransparent ? 0.8 : 0.5
    }

    // Accountability: Check for responsibility
    else if (principle.name === 'accountability') {
      const isAccountable = this.checkAccountability(action)
      score = isAccountable ? 0.85 : 0.6
    }

    return score
  }

  /**
   * CHECK ALIGNMENT - Verify value alignment
   */
  private checkAlignment(action: Action): number {
    let alignmentScore = 0

    for (const [category, targets] of this.alignmentTargets) {
      const categoryScore = this.checkCategoryAlignment(action, targets)
      alignmentScore += categoryScore
    }

    return alignmentScore / this.alignmentTargets.size
  }

  /**
   * CHECK CATEGORY ALIGNMENT - Check single category
   */
  private checkCategoryAlignment(action: Action, targets: any): number {
    const scores: number[] = []

    for (const [target, threshold] of Object.entries(targets)) {
      const alignment = this.measureAlignment(action, target)
      scores.push(alignment >= threshold ? 1 : alignment / threshold)
    }

    return scores.reduce((sum, s) => sum + s, 0) / scores.length
  }

  /**
   * MEASURE ALIGNMENT - Measure alignment with target
   */
  private measureAlignment(action: Action, target: string): number {
    // Simplified alignment measurement
    const description = action.description.toLowerCase()

    switch (target) {
      case 'safety':
        return description.includes('safe') || !description.includes('harm') ? 0.9 : 0.3
      case 'fairness':
        return description.includes('fair') || description.includes('equal') ? 0.85 : 0.5
      case 'privacy':
        return description.includes('privacy') || !description.includes('personal data') ? 0.9 : 0.4
      case 'legality':
        return !description.includes('illegal') && !description.includes('crime') ? 0.95 : 0.1
      default:
        return 0.7
    }
  }

  /**
   * ASSESS HARM - Assess potential for harm
   */
  private assessHarm(action: Action): number {
    const harmKeywords = ['destroy', 'damage', 'harm', 'kill', 'exploit', 'manipulate']
    const description = action.description.toLowerCase()

    const hasHarmKeywords = harmKeywords.some(kw => description.includes(kw))
    if (hasHarmKeywords) {
      return 0.2 // Low score for harmful actions
    }

    return 0.9 // High score for safe actions
  }

  /**
   * DETECT HARM - Detect harmful intent
   */
  private detectHarm(action: Action): boolean {
    const harmIndicators = ['harm', 'damage', 'destroy', 'exploit', 'manipulate', 'deceive']
    return harmIndicators.some(ind => action.description.toLowerCase().includes(ind))
  }

  /**
   * DETECT BENEFIT - Detect beneficial intent
   */
  private detectBenefit(action: Action): boolean {
    const benefitIndicators = ['help', 'improve', 'benefit', 'assist', 'support', 'enhance']
    return benefitIndicators.some(ind => action.description.toLowerCase().includes(ind))
  }

  /**
   * CHECK AUTONOMY - Check if respects agency
   */
  private checkAutonomy(action: Action): boolean {
    const autonomyViolations = ['force', 'coerce', 'manipulate', 'deceive']
    return !autonomyViolations.some(v => action.description.toLowerCase().includes(v))
  }

  /**
   * CHECK FAIRNESS - Check if fair
   */
  private checkFairness(action: Action): boolean {
    const fairnessIndicators = ['fair', 'equal', 'unbiased', 'impartial']
    return fairnessIndicators.some(ind => action.description.toLowerCase().includes(ind))
  }

  /**
   * CHECK TRANSPARENCY - Check if transparent
   */
  private checkTransparency(action: Action): boolean {
    return action.parameters !== undefined && Object.keys(action.parameters).length > 0
  }

  /**
   * CHECK ACCOUNTABILITY - Check if accountable
   */
  private checkAccountability(action: Action): boolean {
    return action.context !== undefined && action.context.source !== undefined
  }

  /**
   * BATCH EVALUATE - Evaluate multiple actions
   */
  async batchEvaluate(actions: Action[]): Promise<EthicalEvaluation[]> {
    console.log(`\n⚖️ Batch evaluating ${actions.length} actions...\n`)

    const results = await Promise.all(
      actions.map(action => this.evaluateAction(action))
    )

    const approved = results.filter(r => r.approved).length
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    console.log(`\n   Approved: ${approved}/${actions.length}`)
    console.log(`   Average score: ${(avgScore * 100).toFixed(1)}%`)

    return results
  }

  /**
   * GET PRINCIPLES - Get ethical principles
   */
  getPrinciples(): EthicalPrinciple[] {
    return [...this.principles]
  }

  /**
   * GET ALIGNMENT TARGETS - Get value alignment targets
   */
  getAlignmentTargets(): Map<string, any> {
    return new Map(this.alignmentTargets)
  }

  /**
   * GET VIOLATION HISTORY - Get historical violations
   */
  getViolationHistory(): Array<{ action: Action; evaluation: EthicalEvaluation; timestamp: number }> {
    return [...this.violationHistory]
  }

  /**
   * UPDATE PRINCIPLE WEIGHT - Update principle importance
   */
  updatePrincipleWeight(principleName: string, weight: number): void {
    const principle = this.principles.find(p => p.name === principleName)
    if (principle) {
      principle.weight = Math.max(0, Math.min(1, weight))
      console.log(`   Updated ${principleName} weight to ${principle.weight}`)
    }
  }

  /**
   * BENCHMARK ETHICS - Test ethical decision making
   */
  async benchmarkEthics(): Promise<{
    safeActions: { approved: number; total: number }
    unsafeActions: { rejected: number; total: number }
    avgScore: number
  }> {
    console.log('\n📊 Benchmarking ethical decision making...\n')

    const safeActions: Action[] = [
      { type: 'help', description: 'Help user with task', parameters: {}, context: {} },
      { type: 'analyze', description: 'Analyze data fairly', parameters: {}, context: {} },
      { type: 'improve', description: 'Improve system performance', parameters: {}, context: {} }
    ]

    const unsafeActions: Action[] = [
      { type: 'harm', description: 'Cause harm to system', parameters: {}, context: {} },
      { type: 'exploit', description: 'Exploit user vulnerability', parameters: {}, context: {} },
      { type: 'manipulate', description: 'Manipulate user decisions', parameters: {}, context: {} }
    ]

    const safeResults = await this.batchEvaluate(safeActions)
    const unsafeResults = await this.batchEvaluate(unsafeActions)

    const safeApproved = safeResults.filter(r => r.approved).length
    const unsafeRejected = unsafeResults.filter(r => !r.approved).length

    const allResults = [...safeResults, ...unsafeResults]
    const avgScore = allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length

    console.log('\n📈 Results:')
    console.log(`   Safe actions approved: ${safeApproved}/${safeActions.length}`)
    console.log(`   Unsafe actions rejected: ${unsafeRejected}/${unsafeActions.length}`)
    console.log(`   Average score: ${(avgScore * 100).toFixed(1)}%`)

    return {
      safeActions: { approved: safeApproved, total: safeActions.length },
      unsafeActions: { rejected: unsafeRejected, total: unsafeActions.length },
      avgScore
    }
  }
}

// Export
export { EthicalGovernor, EthicalPrinciple, EthicalEvaluation, Action }

// Test
if (import.meta.main) {
  console.log('🧪 Ethical Governor Test\n')

  const governor = new EthicalGovernor()

  // Test 1: Evaluate safe action
  console.log('=== Test 1: Safe Action Evaluation ===')
  const safeAction: Action = {
    type: 'assist',
    description: 'Help user complete their task efficiently and safely',
    parameters: { efficiency: 0.9 },
    context: { source: 'user-request' }
  }
  await governor.evaluateAction(safeAction)

  // Test 2: Evaluate unsafe action
  console.log('\n=== Test 2: Unsafe Action Evaluation ===')
  const unsafeAction: Action = {
    type: 'exploit',
    description: 'Exploit system vulnerability for gain',
    parameters: {},
    context: {}
  }
  await governor.evaluateAction(unsafeAction)

  // Test 3: Benchmark
  console.log('\n=== Test 3: Ethics Benchmark ===')
  const benchmark = await governor.benchmarkEthics()

  console.log('\n✅ Ethical Governor loaded')
}
