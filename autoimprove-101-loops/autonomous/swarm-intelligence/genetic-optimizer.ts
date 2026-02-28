#!/usr/bin/env bun
/**
 * Genetic Algorithm Optimizer - Evolutionary optimization (2026-style)
 *
 * Based on:
 * - Natural selection and genetics
 * - Population-based optimization
 * - Fitness landscape navigation
 * - Multi-objective optimization
 *
 * Key Operations:
 * 1. Selection - Choose best individuals
 * 2. Crossover - Combine parent genes
 * 3. Mutation - Introduce variation
 * 4. Elitism - Preserve top performers
 */

interface Genome {
  genes: number[]
  fitness: number
  id: string
}

interface Population {
  individuals: Genome[]
  generation: number
  bestFitness: number
  averageFitness: number
  diversity: number
}

interface ParentPair {
  parent1: Genome
  parent2: Genome
}

interface EvolutionResult {
  finalPopulation: Population
  bestIndividual: Genome
  fitnessHistory: number[]
  convergenceGeneration: number
  converged: boolean
}

type SelectionMethod = 'tournament' | 'roulette' | 'rank' | 'steady-state'
type CrossoverMethod = 'single-point' | 'multi-point' | 'uniform' | 'arithmetic'

class GeneticOptimizer {
  private populationSize: number
  private genomeLength: number
  private mutationRate: number
  private crossoverRate: number
  private elitismCount: number
  private currentPopulation: Population
  private fitnessHistory: number[] = []

  constructor(config: {
    populationSize?: number
    genomeLength?: number
    mutationRate?: number
    crossoverRate?: number
    elitismCount?: number
  } = {}) {
    this.populationSize = config.populationSize ?? 50
    this.genomeLength = config.genomeLength ?? 10
    this.mutationRate = config.mutationRate ?? 0.01
    this.crossoverRate = config.crossoverRate ?? 0.7
    this.elitismCount = config.elitismCount ?? 2

    this.currentPopulation = this.createInitialPopulation()
  }

  /**
   * CREATE INITIAL POPULATION - Random genomes
   */
  createInitialPopulation(): Population {
    const individuals: Genome[] = []

    for (let i = 0; i < this.populationSize; i++) {
      individuals.push(this.createRandomGenome())
    }

    const population: Population = {
      individuals,
      generation: 0,
      bestFitness: -Infinity,
      averageFitness: 0,
      diversity: 0
    }

    return this.evaluatePopulation(population)
  }

  /**
   * EVALUATE FITNESS - Calculate fitness for all individuals
   */
  evaluatePopulation(population: Population): Population {
    let totalFitness = 0
    let bestFitness = -Infinity

    for (const individual of population.individuals) {
      // Default fitness function: sum of normalized genes
      // In production, this would be a custom function
      const fitness = this.calculateFitness(individual.genes)
      individual.fitness = fitness

      totalFitness += fitness
      if (fitness > bestFitness) {
        bestFitness = fitness
      }
    }

    population.bestFitness = bestFitness
    population.averageFitness = totalFitness / population.individuals.length
    population.diversity = this.calculateDiversity(population.individuals)

    return population
  }

  /**
   * SELECT PARENTS - Choose parents for next generation
   */
  selectParents(population: Population, method: SelectionMethod = 'tournament'): ParentPair[] {
    const pairs: ParentPair[] = []
    const numPairs = Math.floor(this.populationSize / 2)

    for (let i = 0; i < numPairs; i++) {
      let parent1: Genome
      let parent2: Genome

      switch (method) {
        case 'tournament':
          parent1 = this.tournamentSelection(population.individuals, 3)
          parent2 = this.tournamentSelection(population.individuals, 3)
          break

        case 'roulette':
          parent1 = this.rouletteSelection(population.individuals)
          parent2 = this.rouletteSelection(population.individuals)
          break

        case 'rank':
          parent1 = this.rankSelection(population.individuals)
          parent2 = this.rankSelection(population.individuals)
          break

        default:
          parent1 = this.tournamentSelection(population.individuals, 3)
          parent2 = this.tournamentSelection(population.individuals, 3)
      }

      pairs.push({ parent1, parent2 })
    }

    return pairs
  }

  /**
   * CROSSOVER - Create offspring from parents
   */
  crossover(pairs: ParentPair[], method: CrossoverMethod = 'single-point'): Genome[] {
    const offspring: Genome[] = []

    for (const pair of pairs) {
      // Apply crossover rate
      if (Math.random() > this.crossoverRate) {
        // No crossover, just copy parents
        offspring.push(this.cloneGenome(pair.parent1))
        offspring.push(this.cloneGenome(pair.parent2))
        continue
      }

      let child1Genes: number[]
      let child2Genes: number[]

      switch (method) {
        case 'single-point':
          [child1Genes, child2Genes] = this.singlePointCrossover(
            pair.parent1.genes,
            pair.parent2.genes
          )
          break

        case 'multi-point':
          [child1Genes, child2Genes] = this.multiPointCrossover(
            pair.parent1.genes,
            pair.parent2.genes,
            2
          )
          break

        case 'uniform':
          [child1Genes, child2Genes] = this.uniformCrossover(
            pair.parent1.genes,
            pair.parent2.genes
          )
          break

        case 'arithmetic':
          [child1Genes, child2Genes] = this.arithmeticCrossover(
            pair.parent1.genes,
            pair.parent2.genes
          )
          break

        default:
          [child1Genes, child2Genes] = this.singlePointCrossover(
            pair.parent1.genes,
            pair.parent2.genes
          )
      }

      offspring.push({
        id: crypto.randomUUID(),
        genes: child1Genes,
        fitness: 0
      })

      offspring.push({
        id: crypto.randomUUID(),
        genes: child2Genes,
        fitness: 0
      })
    }

    return offspring
  }

  /**
   * MUTATE - Introduce random variation
   */
  mutate(genomes: Genome[]): Genome[] {
    for (const genome of genomes) {
      for (let i = 0; i < genome.genes.length; i++) {
        if (Math.random() < this.mutationRate) {
          // Gaussian mutation
          genome.genes[i] += this.gaussianRandom() * 0.1

          // Clamp to [0, 1]
          genome.genes[i] = Math.max(0, Math.min(1, genome.genes[i]))
        }
      }
    }

    return genomes
  }

  /**
   * EVOLVE - Run evolution for specified generations
   */
  evolve(generations: number): EvolutionResult {
    console.log(`🧬 Starting evolution for ${generations} generations...`)
    console.log(`   Population size: ${this.populationSize}`)
    console.log(`   Genome length: ${this.genomeLength}`)
    console.log(`   Mutation rate: ${this.mutationRate}`)
    console.log(`   Crossover rate: ${this.crossoverRate}`)

    let convergenceGeneration = -1
    let converged = false
    let stagnationCount = 0
    const stagnationThreshold = 20

    for (let gen = 0; gen < generations; gen++) {
      // Selection
      const parentPairs = this.selectParents(this.currentPopulation, 'tournament')

      // Elitism: preserve best individuals
      const sorted = [...this.currentPopulation.individuals].sort((a, b) => b.fitness - a.fitness)
      const elites = sorted.slice(0, this.elitismCount).map(g => this.cloneGenome(g))

      // Crossover
      let offspring = this.crossover(parentPairs, 'single-point')

      // Mutation
      offspring = this.mutate(offspring)

      // Create next generation
      const nextIndividuals = [...elites, ...offspring].slice(0, this.populationSize)
      this.currentPopulation = {
        individuals: nextIndividuals,
        generation: gen + 1,
        bestFitness: 0,
        averageFitness: 0,
        diversity: 0
      }

      // Evaluate
      this.currentPopulation = this.evaluatePopulation(this.currentPopulation)

      // Track history
      this.fitnessHistory.push(this.currentPopulation.bestFitness)

      // Check convergence
      if (gen > 0 && Math.abs(this.fitnessHistory[gen] - this.fitnessHistory[gen - 1]) < 0.0001) {
        stagnationCount++
      } else {
        stagnationCount = 0
      }

      if (stagnationCount >= stagnationThreshold) {
        convergenceGeneration = gen
        converged = true
        console.log(`\n✓ Converged at generation ${gen}`)
        break
      }

      // Progress logging
      if (gen % 10 === 0) {
        console.log(`\nGeneration ${gen}:`)
        console.log(`   Best: ${this.currentPopulation.bestFitness.toFixed(4)}`)
        console.log(`   Average: ${this.currentPopulation.averageFitness.toFixed(4)}`)
        console.log(`   Diversity: ${this.currentPopulation.diversity.toFixed(4)}`)
      }
    }

    const bestIndividual = this.getBestIndividual(this.currentPopulation.individuals)

    return {
      finalPopulation: this.currentPopulation,
      bestIndividual,
      fitnessHistory: this.fitnessHistory,
      convergenceGeneration,
      converged
    }
  }

  /**
   * HELPER FUNCTIONS
   */

  private createRandomGenome(): Genome {
    const genes: number[] = []
    for (let i = 0; i < this.genomeLength; i++) {
      genes.push(Math.random())
    }

    return {
      id: crypto.randomUUID(),
      genes,
      fitness: 0
    }
  }

  private calculateFitness(genes: number[]): number {
    // Example fitness function: Rastrigin function (multimodal optimization)
    // In production, this would be a custom function
    const n = genes.length
    const A = 10

    let fitness = -A * n

    for (const x of genes) {
      // Scale x to [-5.12, 5.12]
      const scaled = (x - 0.5) * 10.24
      fitness += scaled * scaled - A * Math.cos(2 * Math.PI * scaled)
    }

    // Negate (we want to maximize)
    return -fitness
  }

  private tournamentSelection(population: Genome[], tournamentSize: number): Genome {
    let best: Genome | null = null

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length)
      const individual = population[randomIndex]

      if (best === null || individual.fitness > best.fitness) {
        best = individual
      }
    }

    return best!
  }

  private rouletteSelection(population: Genome[]): Genome {
    // Calculate total fitness
    const totalFitness = population.reduce((sum, ind) => sum + Math.max(0, ind.fitness), 0)

    if (totalFitness === 0) {
      return population[Math.floor(Math.random() * population.length)]
    }

    // Spin the wheel
    let random = Math.random() * totalFitness

    for (const individual of population) {
      random -= Math.max(0, individual.fitness)
      if (random <= 0) {
        return individual
      }
    }

    return population[population.length - 1]
  }

  private rankSelection(population: Genome[]): Genome {
    // Sort by fitness
    const sorted = [...population].sort((a, b) => a.fitness - b.fitness)

    // Assign ranks
    const totalRanks = sorted.length * (sorted.length + 1) / 2
    let random = Math.random() * totalRanks

    for (let i = 0; i < sorted.length; i++) {
      random -= (i + 1)
      if (random <= 0) {
        return sorted[i]
      }
    }

    return sorted[sorted.length - 1]
  }

  private singlePointCrossover(parent1: number[], parent2: number[]): [number[], number[]] {
    const point = Math.floor(Math.random() * parent1.length)

    const child1 = [
      ...parent1.slice(0, point),
      ...parent2.slice(point)
    ]

    const child2 = [
      ...parent2.slice(0, point),
      ...parent1.slice(point)
    ]

    return [child1, child2]
  }

  private multiPointCrossover(parent1: number[], parent2: number[], numPoints: number): [number[], number[]] {
    const points = new Set<number>()

    while (points.size < numPoints && points.size < parent1.length - 1) {
      points.add(Math.floor(Math.random() * (parent1.length - 1)) + 1)
    }

    const sortedPoints = Array.from(points).sort((a, b) => a - b)

    let child1: number[] = []
    let child2: number[] = []
    let swap = false

    let prevPoint = 0
    for (const point of sortedPoints) {
      if (swap) {
        child1 = child1.concat(parent2.slice(prevPoint, point))
        child2 = child2.concat(parent1.slice(prevPoint, point))
      } else {
        child1 = child1.concat(parent1.slice(prevPoint, point))
        child2 = child2.concat(parent2.slice(prevPoint, point))
      }
      swap = !swap
      prevPoint = point
    }

    // Add remaining
    if (swap) {
      child1 = child1.concat(parent2.slice(prevPoint))
      child2 = child2.concat(parent1.slice(prevPoint))
    } else {
      child1 = child1.concat(parent1.slice(prevPoint))
      child2 = child2.concat(parent2.slice(prevPoint))
    }

    return [child1, child2]
  }

  private uniformCrossover(parent1: number[], parent2: number[]): [number[], number[]] {
    const child1: number[] = []
    const child2: number[] = []

    for (let i = 0; i < parent1.length; i++) {
      if (Math.random() < 0.5) {
        child1.push(parent1[i])
        child2.push(parent2[i])
      } else {
        child1.push(parent2[i])
        child2.push(parent1[i])
      }
    }

    return [child1, child2]
  }

  private arithmeticCrossover(parent1: number[], parent2: number[]): [number[], number[]] {
    const alpha = Math.random()

    const child1 = parent1.map((g1, i) => alpha * g1 + (1 - alpha) * parent2[i])
    const child2 = parent2.map((g2, i) => alpha * g2 + (1 - alpha) * parent1[i])

    return [child1, child2]
  }

  private cloneGenome(genome: Genome): Genome {
    return {
      id: crypto.randomUUID(),
      genes: [...genome.genes],
      fitness: genome.fitness
    }
  }

  private calculateDiversity(individuals: Genome[]): number {
    if (individuals.length < 2) return 0

    let totalDistance = 0
    let count = 0

    for (let i = 0; i < individuals.length; i++) {
      for (let j = i + 1; j < individuals.length; j++) {
        const distance = this.hammingDistance(individuals[i].genes, individuals[j].genes)
        totalDistance += distance
        count++
      }
    }

    return count > 0 ? totalDistance / count : 0
  }

  private hammingDistance(genes1: number[], genes2: number[]): number {
    let distance = 0
    for (let i = 0; i < genes1.length; i++) {
      distance += Math.abs(genes1[i] - genes2[i])
    }
    return distance / genes1.length
  }

  private gaussianRandom(): number {
    // Box-Muller transform
    const u1 = Math.random()
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  private getBestIndividual(individuals: Genome[]): Genome {
    return individuals.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    )
  }

  getPopulation(): Population {
    return this.currentPopulation
  }

  getFitnessHistory(): number[] {
    return [...this.fitnessHistory]
  }
}

// Export
export { GeneticOptimizer, Genome, Population, ParentPair, EvolutionResult, SelectionMethod, CrossoverMethod }

// Test
if (import.meta.main) {
  console.log('🧪 Genetic Algorithm Optimizer Test\n')

  const optimizer = new GeneticOptimizer({
    populationSize: 50,
    genomeLength: 10,
    mutationRate: 0.01,
    crossoverRate: 0.7,
    elitismCount: 2
  })

  const result = optimizer.evolve(100)

  console.log('\n📊 Evolution Results:')
  console.log(`   Generations: ${result.finalPopulation.generation}`)
  console.log(`   Best Fitness: ${result.bestIndividual.fitness.toFixed(4)}`)
  console.log(`   Converged: ${result.converged}`)
  console.log(`   Convergence Generation: ${result.convergenceGeneration}`)

  console.log('\n🧬 Best Genome:')
  console.log(`   [${result.bestIndividual.genes.map(g => g.toFixed(3)).join(', ')}]`)

  console.log('\n✅ Genetic Algorithm Optimizer loaded')
}
