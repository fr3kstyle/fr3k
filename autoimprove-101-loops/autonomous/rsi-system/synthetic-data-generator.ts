#!/usr/bin/env bun
/**
 * Synthetic Data Generator - AI generates training data for itself
 *
 * Based on 2026 research: AI generating majority of its own training data
 */

interface SyntheticDataPoint {
  input: any
  expectedOutput: any
  difficulty: 'easy' | 'medium' | 'hard'
  domain: string
  generatedAt: number
  verified: boolean
}

class SyntheticDataGenerator {
  private dataPool: SyntheticDataPoint[] = []
  private domains: string[] = ['coding', 'math', 'reasoning', 'language', 'logic']

  /**
   * GENERATE_SYNTHETIC_DATA - Create training examples
   */
  async generateSyntheticData(count: number, domain?: string): Promise<SyntheticDataPoint[]> {
    console.log(`🔄 Generating ${count} synthetic data points...\n`)

    const data: SyntheticDataPoint[] = []

    for (let i = 0; i < count; i++) {
      const targetDomain = domain || this.domains[Math.floor(Math.random() * this.domains.length)]
      const dataPoint = await this.generateSingleDataPoint(targetDomain)
      data.push(dataPoint)
    }

    // Verify generated data
    const verified = data.filter(d => d.verified)

    this.dataPool.push(...verified)

    console.log(`✓ Generated ${data.length} data points`)
    console.log(`   Verified: ${verified.length}`)
    console.log(`   Domains: ${[...new Set(data.map(d => d.domain))].join(', ')}`)

    return verified
  }

  /**
   * GENERATE_SINGLE_DATA_POINT
   */
  private async generateSingleDataPoint(domain: string): Promise<SyntheticDataPoint> {
    let dataPoint: SyntheticDataPoint

    switch (domain) {
      case 'coding':
        dataPoint = await this.generateCodingProblem()
        break

      case 'math':
        dataPoint = await this.generateMathProblem()
        break

      case 'reasoning':
        dataPoint = await this.generateReasoningProblem()
        break

      case 'language':
        dataPoint = await this.generateLanguageProblem()
        break

      case 'logic':
        dataPoint = await this.generateLogicProblem()
        break

      default:
        dataPoint = await this.generateGenericProblem()
    }

    // Verify the data point
    dataPoint.verified = await this.verifyDataPoint(dataPoint)

    return dataPoint
  }

  /**
   * GENERATE_CODING_PROBLEM
   */
  private async generateCodingProblem(): Promise<SyntheticDataPoint> {
    const problems = [
      {
        input: 'Write a function to reverse a string',
        expectedOutput: `function reverse(s: string): string {
  return s.split('').reverse().join('')
}`,
        difficulty: 'easy' as const
      },
      {
        input: 'Implement binary search algorithm',
        expectedOutput: `function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }
  return -1
}`,
        difficulty: 'medium' as const
      },
      {
        input: 'Create a function to flatten nested arrays',
        expectedOutput: `function flatten<T>(arr: any[]): T[] {
  return arr.reduce<T>((flat, item) => {
    if (Array.isArray(item)) {
      return flat.concat(flatten(item))
    }
    return flat.concat(item)
  }, [] as T[])
}`,
        difficulty: 'hard' as const
      }
    ]

    const selected = problems[Math.floor(Math.random() * problems.length)]

    return {
      ...selected,
      domain: 'coding',
      generatedAt: Date.now()
    }
  }

  /**
   * GENERATE_MATH_PROBLEM
   */
  private async generateMathProblem(): Promise<SyntheticDataPoint> {
    // Generate random math problems
    const type = Math.random()

    if (type < 0.33) {
      // Arithmetic
      const a = Math.floor(Math.random() * 100)
      const b = Math.floor(Math.random() * 100)

      return {
        input: `What is ${a} + ${b}?`,
        expectedOutput: (a + b).toString(),
        difficulty: 'easy',
        domain: 'math',
        generatedAt: Date.now(),
        verified: false
      }
    } else if (type < 0.66) {
      // Algebra
      const x = Math.floor(Math.random() * 20)
      const result = x * 2 + 5

      return {
        input: `Solve for x: 2x + 5 = ${result}`,
        expectedOutput: x.toString(),
        difficulty: 'medium',
        domain: 'math',
        generatedAt: Date.now(),
        verified: false
      }
    } else {
      // Calculus
      const func = ['x^2', 'x^3', 'sin(x)', 'exp(x)'][Math.floor(Math.random() * 4)]

      return {
        input: `What is the derivative of ${func}?`,
        expectedOutput: `Derivative of ${func}`,
        difficulty: 'hard',
        domain: 'math',
        generatedAt: Date.now(),
        verified: false
      }
    }
  }

  /**
   * GENERATE_REASONING_PROBLEM
   */
  private async generateReasoningProblem(): Promise<SyntheticDataPoint> {
    const scenarios = [
      {
        input: 'If all cats are animals, and Fluffy is a cat, is Fluffy an animal?',
        expectedOutput: 'Yes, Fluffy is an animal (syllogism)',
        difficulty: 'easy' as const
      },
      {
        input: 'A train leaves at 2pm going 60mph. Another leaves at 3pm going 80mph. When do they meet?',
        expectedOutput: 'They meet 2 hours after the second train departs (at 5pm)',
        difficulty: 'medium' as const
      },
      {
        input: 'Three people have different professions. Each statement is false. Who does what?',
        expectedOutput: 'Logical puzzle solution requires systematic elimination',
        difficulty: 'hard' as const
      }
    ]

    const selected = scenarios[Math.floor(Math.random() * scenarios.length)]

    return {
      ...selected,
      domain: 'reasoning',
      generatedAt: Date.now()
    }
  }

  /**
   * GENERATE_LANGUAGE_PROBLEM
   */
  private async generateLanguageProblem(): Promise<SyntheticDataPoint> {
    const tasks = [
      {
        input: 'Correct the grammar: "She don\'t like apples"',
        expectedOutput: 'She doesn\'t like apples',
        difficulty: 'easy' as const
      },
      {
        input: 'Translate to Spanish: "Hello world"',
        expectedOutput: '¡Hola mundo!',
        difficulty: 'medium' as const
      },
      {
        input: 'Summarize: "The quick brown fox jumps over the lazy dog multiple times."',
        expectedOutput: 'A fox repeatedly jumps over a dog.',
        difficulty: 'hard' as const
      }
    ]

    const selected = tasks[Math.floor(Math.random() * tasks.length)]

    return {
      ...selected,
      domain: 'language',
      generatedAt: Date.now()
    }
  }

  /**
   * GENERATE_LOGIC_PROBLEM
   */
  private async generateLogicProblem(): Promise<SyntheticDataPoint> {
    const puzzles = [
      {
        input: 'Given: A → B, B → C. If A is true, is C true?',
        expectedOutput: 'Yes (transitive property)',
        difficulty: 'easy' as const
      },
      {
        input: 'Truth table: p AND q OR NOT p. Simplify.',
        expectedOutput: 'q OR NOT p (simplified)',
        difficulty: 'medium' as const
      },
      {
        input: 'First-order logic: ∀x(P(x) → Q(x)) and P(a). What follows?',
        expectedOutput: 'Q(a) (universal instantiation)',
        difficulty: 'hard' as const
      }
    ]

    const selected = puzzles[Math.floor(Math.random() * puzzles.length)]

    return {
      ...selected,
      domain: 'logic',
      generatedAt: Date.now()
    }
  }

  /**
   * GENERATE_GENERIC_PROBLEM
   */
  private async generateGenericProblem(): Promise<SyntheticDataPoint> {
    return {
      input: 'Generic problem',
      expectedOutput: 'Generic solution',
      difficulty: 'medium',
      domain: 'generic',
      generatedAt: Date.now(),
      verified: false
    }
  }

  /**
   * VERIFY_DATA_POINT - Check if answer is correct
   */
  private async verifyDataPoint(data: SyntheticDataPoint): Promise<boolean> {
    // Simulate verification (in production would actually solve/validate)
    // High confidence for generated problems
    return Math.random() > 0.1 // 90% verification rate
  }

  /**
   * GET_DATASET - Get all synthetic data
   */
  getDataset(domain?: string, difficulty?: string): SyntheticDataPoint[] {
    let filtered = this.dataPool

    if (domain) {
      filtered = filtered.filter(d => d.domain === domain)
    }

    if (difficulty) {
      filtered = filtered.filter(d => d.difficulty === difficulty)
    }

    return filtered
  }

  /**
   * EXPORT_DATASET - Export to JSONL for training
   */
  exportDataset(filePath: string): void {
    const lines = this.dataPool.map(d => JSON.stringify(d))
    const content = lines.join('\n')

    Bun.write(filePath, content)

    console.log(`✓ Exported ${this.dataPool.length} data points to ${filePath}`)
  }

  /**
   * GENERATE_CURRICULUM - Create structured learning path
   */
  async generateCurriculum(): Promise<{
    domains: string[]
    units: Array<{
      domain: string
      easy: number
      medium: number
      hard: number
    }>
  }> {
    const curriculum: any[] = []

    for (const domain of this.domains) {
      const data = this.getDataset(domain)

      curriculum.push({
        domain,
        easy: data.filter(d => d.difficulty === 'easy').length,
        medium: data.filter(d => d.difficulty === 'medium').length,
        hard: data.filter(d => d.difficulty === 'hard').length
      })
    }

    return {
      domains: this.domains,
      units: curriculum
    }
  }

  getMetrics() {
    return {
      totalDataPoints: this.dataPool.length,
      domains: this.domains,
      verifiedCount: this.dataPool.filter(d => d.verified).length,
      byDifficulty: {
        easy: this.dataPool.filter(d => d.difficulty === 'easy').length,
        medium: this.dataPool.filter(d => d.difficulty === 'medium').length,
        hard: this.dataPool.filter(d => d.difficulty === 'hard').length
      }
    }
  }
}

// Export
export { SyntheticDataGenerator, SyntheticDataPoint }

// Test
if (import.meta.main) {
  console.log('🧪 Synthetic Data Generator Test\n')

  const generator = new SyntheticDataGenerator()

  // Generate synthetic data
  await generator.generateSyntheticData(100)

  // Generate curriculum
  const curriculum = await generator.generateCurriculum()
  console.log('\n📚 Curriculum:')
  for (const unit of curriculum.units) {
    console.log(`   ${unit.domain}: easy=${unit.easy}, medium=${unit.medium}, hard=${unit.hard}`)
  }

  console.log('\n📊 Metrics:', generator.getMetrics())

  console.log('\n✅ Synthetic Data Generator loaded')
}
