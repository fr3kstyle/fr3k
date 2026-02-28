#!/usr/bin/env bun
/**
 * Predictive Task Scheduler - LOOP 14
 *
 * Builds on LOOP 13 caching to add:
 * - Task duration prediction
 * - Success probability prediction
 * - Optimal task ordering
 * - Learning from history
 * - Resource optimization
 */

import { CachedParallelSystem } from './cached-parallel-system.js'

interface TaskPrediction {
  taskId: string
  predictedDuration: number
  predictedSuccess: number
  confidence: number
  features: number[]
}

interface HistoricalTask {
  description: string
  duration: number
  success: boolean
  features: number[]
}

class PredictiveTaskScheduler extends CachedParallelSystem {
  private history: HistoricalTask[] = []
  private predictions: Map<string, TaskPrediction> = new Map()

  constructor() {
    super()
    console.log('🚀 Initializing Predictive Task Scheduler...\n')
    console.log('✓ Predictive scheduling ready\n')
  }

  /**
   * EXECUTE WITH PREDICTION - Use predictions to optimize execution
   */
  async executeWithPrediction(tasks: string[]): Promise<{
    completed: number
    failed: number
    totalThroughput: number
    executionTime: number
    predictionAccuracy: number
    planningImprovement: number
  }> {
    console.log(`\n🔮 Executing ${tasks.length} tasks with prediction...\n`)

    const startTime = Date.now()

    // Step 1: Predict all tasks
    console.log('Step 1: Predicting task outcomes...')
    const taskPredictions: Array<{ task: string; prediction: TaskPrediction }> = []

    for (const task of tasks) {
      const prediction = await this.predictTask(task)
      this.predictions.set(task, prediction)
      taskPredictions.push({ task, prediction })

      console.log(`   ${task.slice(0, 30)}...`)
      console.log(`     Duration: ${prediction.predictedDuration}ms (confidence: ${(prediction.confidence * 100).toFixed(0)}%)`)
      console.log(`     Success: ${(prediction.predictedSuccess * 100).toFixed(0)}%`)
    }

    // Step 2: Optimize task ordering based on predictions
    console.log('\nStep 2: Optimizing task order...')
    const optimizedTasks = this.optimizeTaskOrder(taskPredictions)
    console.log(`   ✓ Reordered for optimal execution`)

    // Step 3: Execute tasks in optimized order
    console.log('\nStep 3: Executing tasks...')
    let completed = 0
    let failed = 0

    for (const { task, prediction } of optimizedTasks) {
      try {
        const result = await (this as any).integratedSystem.executeTask(task, 5)

        // Record actual outcome for learning
        this.recordHistory(task, result.executionTime, result.success)

        if (result.success) {
          completed++
        } else {
          failed++
        }
      } catch (error) {
        failed++
        this.recordHistory(task, 0, false)
      }
    }

    const executionTime = Date.now() - startTime
    const throughput = (completed / executionTime) * 1000

    // Calculate prediction accuracy
    const accuracy = this.calculatePredictionAccuracy()

    console.log(`\n✓ Predictive execution complete`)
    console.log(`   Completed: ${completed}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Execution time: ${executionTime}ms`)
    console.log(`   Throughput: ${throughput.toFixed(2)} tasks/sec`)
    console.log(`   Prediction accuracy: ${(accuracy * 100).toFixed(1)}%`)

    return {
      completed,
      failed,
      totalThroughput: throughput,
      executionTime,
      predictionAccuracy: accuracy,
      planningImprovement: 0 // Will calculate in benchmark
    }
  }

  /**
   * PREDICT TASK - Forecast duration and success probability
   */
  private async predictTask(task: string): Promise<TaskPrediction> {
    // Extract features from task description
    const features = this.extractFeatures(task)

    // Find similar tasks in history
    const similar = this.findSimilarTasks(features)

    if (similar.length >= 3) {
      // Use historical average
      const avgDuration = similar.reduce((sum, t) => sum + t.duration, 0) / similar.length
      const avgSuccess = similar.reduce((sum, t) => sum + (t.success ? 1 : 0), 0) / similar.length
      const confidence = Math.min(0.95, similar.length / 10)

      return {
        taskId: this.hashTask(task),
        predictedDuration: avgDuration,
        predictedSuccess: avgSuccess,
        confidence,
        features
      }
    }

    // Use default predictions with low confidence
    const duration = 200 + features[0] * 100 // Feature 0 = complexity
    const success = 0.5 + features[1] * 0.3 // Feature 1 = familiarity

    return {
      taskId: this.hashTask(task),
      predictedDuration: duration,
      predictedSuccess: success,
      confidence: 0.3,
      features
    }
  }

  /**
   * EXTRACT FEATURES - Convert task to feature vector
   */
  private extractFeatures(task: string): number[] {
    const taskLower = task.toLowerCase()

    // Feature 0: Complexity (0-1)
    let complexity = 0.3
    if (taskLower.includes('optimiz') || taskLower.includes('refactor')) complexity += 0.3
    if (taskLower.includes('implement') || taskLower.includes('design')) complexity += 0.2
    if (taskLower.includes('fix') || taskLower.includes('debug')) complexity += 0.1
    complexity = Math.min(1, complexity)

    // Feature 1: Familiarity (0-1, higher = more familiar)
    let familiarity = 0.3
    if (taskLower.includes('test') || taskLower.includes('add')) familiarity += 0.3
    if (taskLower.includes('database') || taskLower.includes('api')) familiarity += 0.2
    if (taskLower.includes('logging') || taskLower.includes('error')) familiarity += 0.2
    familiarity = Math.min(1, familiarity)

    // Feature 2: Resource needs (0-1)
    let resources = 0.3
    if (taskLower.includes('optimiz') || taskLower.includes('refactor')) resources += 0.4
    if (taskLower.includes('implement') || taskLower.includes('design')) resources += 0.3
    resources = Math.min(1, resources)

    return [complexity, familiarity, resources]
  }

  /**
   * FIND SIMILAR TASKS - Find historical tasks with similar features
   */
  private findSimilarTasks(features: number[]): HistoricalTask[] {
    const similar: HistoricalTask[] = []
    const threshold = 0.2 // Feature distance threshold

    for (const historical of this.history) {
      const distance = this.featureDistance(features, historical.features)

      if (distance < threshold) {
        similar.push(historical)
      }
    }

    return similar.slice(0, 10) // Top 10 most similar
  }

  /**
   * FEATURE DISTANCE - Calculate distance between feature vectors
   */
  private featureDistance(a: number[], b: number[]): number {
    let sum = 0
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      sum += Math.pow(a[i] - b[i], 2)
    }
    return Math.sqrt(sum)
  }

  /**
   * OPTIMIZE TASK ORDER - Sort tasks for optimal execution
   */
  private optimizeTaskOrder(taskPredictions: Array<{ task: string; prediction: TaskPrediction }>): Array<{ task: string; prediction: TaskPrediction }> {
    // Sort by: (success probability / predicted duration) - do fast, high-success tasks first
    return taskPredictions.sort((a, b) => {
      const scoreA = a.prediction.predictedSuccess / (a.prediction.predictedDuration / 1000)
      const scoreB = b.prediction.predictedSuccess / (b.prediction.predictedDuration / 1000)
      return scoreB - scoreA
    })
  }

  /**
   * RECORD HISTORY - Store actual outcome for learning
   */
  private recordHistory(task: string, duration: number, success: boolean): void {
    this.history.push({
      description: task,
      duration,
      success,
      features: this.extractFeatures(task)
    })

    // Keep history manageable
    if (this.history.length > 1000) {
      this.history = this.history.slice(-500)
    }
  }

  /**
   * CALCULATE PREDICTION ACCURACY - How accurate were predictions
   */
  private calculatePredictionAccuracy(): number {
    if (this.history.length < 5) return 0.5

    // Calculate accuracy of recent predictions
    let correct = 0
    let total = 0

    for (const historical of this.history.slice(-20)) {
      // Would we have predicted this correctly?
      // Simplified: check if prediction was within 50% of actual
      const prediction = this.predictTaskSync(historical.description)

      if (prediction) {
        const durationError = Math.abs(prediction.predictedDuration - historical.duration) / historical.duration
        const successError = Math.abs(prediction.predictedSuccess - (historical.success ? 1 : 0))

        if (durationError < 0.5 && successError < 0.3) {
          correct++
        }
        total++
      }
    }

    return total > 0 ? correct / total : 0.5
  }

  /**
   * PREDICT TASK SYNC - Synchronous version for accuracy calculation
   */
  private predictTaskSync(task: string): TaskPrediction | null {
    const features = this.extractFeatures(task)
    const similar = this.findSimilarTasks(features)

    if (similar.length >= 3) {
      const avgDuration = similar.reduce((sum, t) => sum + t.duration, 0) / similar.length
      const avgSuccess = similar.reduce((sum, t) => sum + (t.success ? 1 : 0), 0) / similar.length

      return {
        taskId: this.hashTask(task),
        predictedDuration: avgDuration,
        predictedSuccess: avgSuccess,
        confidence: 0.7,
        features
      }
    }

    return null
  }

  /**
   * HASH TASK - Consistent hash for task
   */
  private hashTask(task: string): string {
    let hash = 0
    for (let i = 0; i < task.length; i++) {
      const char = task.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `pred_${Math.abs(hash)}`
  }

  /**
   * BENCHMARK PREDICTION - Compare predicted vs naive execution
   */
  async benchmarkPrediction(): Promise<{
    naive: { throughput: number; time: number; failedRate: number }
    predicted: { throughput: number; time: number; failedRate: number }
    improvement: { throughput: number; failure: number; planning: number }
  }> {
    const tasks = [
      'Optimize database queries',
      'Add comprehensive tests',
      'Refactor legacy code',
      'Implement caching',
      'Fix memory leaks',
      'Improve error handling',
      'Add logging system',
      'Optimize API performance',
      'Design architecture',
      'Code review'
    ]

    console.log('\n📊 Benchmark: Naive vs Predictive Execution\n')

    // Naive execution (no prediction, original order)
    console.log('Running NAIVE execution...')
    const naiveResult = await this.executeParallelTasks(tasks)

    // Clear cache and history
    this.clearCache()
    this.history = []

    // Predictive execution (LOOP 14)
    console.log('\nRunning PREDICTIVE execution...')
    const predictedResult = await this.executeWithPrediction(tasks)

    const throughputImprovement = ((predictedResult.totalThroughput - naiveResult.totalThroughput) / naiveResult.totalThroughput) * 100
    const failureReduction = ((naiveResult.failed / naiveResult.completed) - (predictedResult.failed / predictedResult.completed)) * 100
    const planningImprovement = (1 - (predictedResult.executionTime / naiveResult.executionTime)) * 100

    console.log('\n📈 Benchmark Results:')
    console.log(`   Naive: ${naiveResult.totalThroughput.toFixed(2)} tasks/sec, ${((naiveResult.failed / naiveResult.completed) * 100).toFixed(1)}% failed`)
    console.log(`   Predicted: ${predictedResult.totalThroughput.toFixed(2)} tasks/sec, ${((predictedResult.failed / predictedResult.completed) * 100).toFixed(1)}% failed`)
    console.log(`   Throughput: +${throughputImprovement.toFixed(1)}%`)
    console.log(`   Failure reduction: ${failureReduction > 0 ? '+' : ''}${failureReduction.toFixed(1)}%`)
    console.log(`   Planning improvement: +${planningImprovement.toFixed(1)}%`)
    console.log(`   Prediction accuracy: ${(predictedResult.predictionAccuracy * 100).toFixed(1)}%`)

    return {
      naive: { throughput: naiveResult.totalThroughput, time: naiveResult.executionTime, failedRate: naiveResult.failed / naiveResult.completed },
      predicted: { throughput: predictedResult.totalThroughput, time: predictedResult.executionTime, failedRate: predictedResult.failed / predictedResult.completed },
      improvement: { throughput: throughputImprovement, failure: failureReduction, planning: planningImprovement }
    }
  }

  /**
   * GET MODEL STATISTICS - Prediction model performance
   */
  getModelStatistics(): {
    historySize: number
    avgDuration: number
    avgSuccessRate: number
    featureDistribution: any
  } {
    if (this.history.length === 0) {
      return { historySize: 0, avgDuration: 0, avgSuccessRate: 0, featureDistribution: {} }
    }

    const avgDuration = this.history.reduce((sum, t) => sum + t.duration, 0) / this.history.length
    const avgSuccess = this.history.reduce((sum, t) => sum + (t.success ? 1 : 0), 0) / this.history.length

    return {
      historySize: this.history.length,
      avgDuration,
      avgSuccessRate: avgSuccess,
      featureDistribution: {} // Would calculate distribution
    }
  }
}

// Export
export { PredictiveTaskScheduler, TaskPrediction, HistoricalTask }

// Test
if (import.meta.main) {
  console.log('🧪 Predictive Task Scheduler Test\n')

  const scheduler = new PredictiveTaskScheduler()

  // Test predictive execution
  console.log('=== Test 1: Predictive Execution ===')
  const tasks = [
    'Add comprehensive tests',
    'Optimize database queries',
    'Refactor legacy code',
    'Implement caching',
    'Fix memory leaks',
    'Improve error handling',
    'Add logging system',
    'Optimize API performance'
  ]

  const result = await scheduler.executeWithPrediction(tasks)

  // Run benchmark
  console.log('\n=== Benchmark: Prediction Benefits ===')
  const benchmark = await scheduler.benchmarkPrediction()

  console.log('\n✅ Predictive Task Scheduler loaded')
  console.log('\n📊 LOOP 14 Achievement:')
  console.log(`   Prediction accuracy: ${(result.predictionAccuracy * 100).toFixed(1)}%`)
  console.log(`   Throughput: ${result.totalThroughput.toFixed(2)} tasks/sec`)
  console.log(`   Target: 80% accuracy, 50% faster planning`)
  console.log(`   Achieved: ${result.predictionAccuracy >= 0.8 ? '✅' : '⚠️'} accuracy, ${benchmark.improvement.planning >= 50 ? '✅' : '⚠️'} planning speedup`)
}
