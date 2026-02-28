#!/usr/bin/env bun
/**
 * Planning Agent - Long-horizon planning and temporal reasoning
 *
 * Capabilities:
 * - Hierarchical task networks
 * - Temporal planning with time constraints
 * - Resource allocation optimization
 * - Contingency planning for uncertainty
 */

interface Task {
  id: string
  name: string
  duration: number
  dependencies: string[]
  resources: string[]
  deadline?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface Plan {
  id: string
  tasks: Task[]
  timeline: Map<string, { start: number; end: number }>
  resourceAllocation: Map<string, string[]>
  makespan: number
  criticalPath: string[]
}

interface Contingency {
  risk: string
  probability: number
  impact: number
  mitigation: string[]
  contingencyPlan: Plan
}

class PlanningAgent {
  constructor() {
    console.log('📋 Initializing Planning Agent...\n')
    console.log('✅ Planning Agent ready')
    console.log('   Capabilities: hierarchical planning, temporal reasoning, contingency')
  }

  /**
   * CREATE PLAN - Generate optimal plan from tasks
   */
  createPlan(tasks: Task[], resourcePool: string[]): Plan {
    console.log(`\n📊 Creating plan for ${tasks.length} tasks`)
    console.log(`   Available resources: ${resourcePool.join(', ')}`)

    // Topological sort for task ordering
    const ordered = this.topologicalSort(tasks)
    console.log(`   ✓ Task ordering determined`)

    // Calculate timeline using critical path method
    const timeline = this.calculateTimeline(ordered)
    console.log(`   ✓ Timeline calculated`)

    // Allocate resources
    const resourceAllocation = this.allocateResources(ordered, resourcePool)
    console.log(`   ✓ Resources allocated`)

    // Find critical path
    const criticalPath = this.findCriticalPath(ordered, timeline)
    console.log(`   ✓ Critical path: ${criticalPath.length} tasks`)

    const makespan = Math.max(...[...timeline.values()].map(t => t.end))

    const plan: Plan = {
      id: crypto.randomUUID(),
      tasks: ordered,
      timeline,
      resourceAllocation,
      makespan,
      criticalPath
    }

    console.log(`   ✅ Plan created`)
    console.log(`      Makespan: ${makespan} hours`)
    console.log(`      Critical path: ${criticalPath.length} tasks`)

    return plan
  }

  private topologicalSort(tasks: Task[]): Task[] {
    const graph = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    const taskMap = new Map<string, Task>()

    for (const task of tasks) {
      taskMap.set(task.id, task)
      graph.set(task.id, [])
      inDegree.set(task.id, 0)
    }

    for (const task of tasks) {
      for (const dep of task.dependencies) {
        graph.get(dep)?.push(task.id)
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1)
      }
    }

    const sorted: Task[] = []
    const queue: string[] = []

    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id)
      }
    }

    while (queue.length > 0) {
      const id = queue.shift()!
      sorted.push(taskMap.get(id)!)

      for (const dependent of graph.get(id) || []) {
        inDegree.set(dependent, (inDegree.get(dependent) || 0) - 1)
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent)
        }
      }
    }

    return sorted
  }

  private calculateTimeline(tasks: Task[]): Map<string, { start: number; end: number }> {
    const timeline = new Map<string, { start: number; end: number }>()
    const taskMap = new Map<string, Task>()

    for (const task of tasks) {
      taskMap.set(task.id, task)
    }

    for (const task of tasks) {
      let maxEnd = 0

      for (const dep of task.dependencies) {
        const depEnd = timeline.get(dep)?.end || 0
        maxEnd = Math.max(maxEnd, depEnd)
      }

      timeline.set(task.id, {
        start: maxEnd,
        end: maxEnd + task.duration
      })
    }

    return timeline
  }

  private allocateResources(tasks: Task[], resources: string[]): Map<string, string[]> {
    const allocation = new Map<string, string[]>()
    const resourceUsage = new Map<string, number>()

    for (const task of tasks) {
      const assigned: string[] = []

      for (const req of task.resources) {
        // Find available resource
        for (const res of resources) {
          if (res.includes(req) && (resourceUsage.get(res) || 0) < 3) {
            assigned.push(res)
            resourceUsage.set(res, (resourceUsage.get(res) || 0) + 1)
            break
          }
        }
      }

      allocation.set(task.id, assigned)
    }

    return allocation
  }

  private findCriticalPath(tasks: Task[], timeline: Map<string, { start: number; end: number }>): string[] {
    const endTasks = tasks.filter(t => !tasks.some(other => other.dependencies.includes(t.id)))

    let maxDuration = 0
    let criticalEnd: string | null = null

    for (const task of endTasks) {
      const t = timeline.get(task.id)!
      if (t.end > maxDuration) {
        maxDuration = t.end
        criticalEnd = task.id
      }
    }

    // Trace back to find critical path
    const path: string[] = []
    let current = criticalEnd

    while (current) {
      path.unshift(current)
      const task = tasks.find(t => t.id === current)
      if (!task || task.dependencies.length === 0) break

      // Find predecessor on critical path
      let maxPredecessorEnd = -1
      let criticalPredecessor: string | null = null

      for (const dep of task.dependencies) {
        const depEnd = timeline.get(dep)?.end || 0
        if (depEnd > maxPredecessorEnd) {
          maxPredecessorEnd = depEnd
          criticalPredecessor = dep
        }
      }

      current = criticalPredecessor
    }

    return path
  }

  /**
   * GENERATE CONTINGENCY PLANS - Plan for risks and uncertainties
   */
  generateContingencyPlans(plan: Plan): Contingency[] {
    console.log(`\n🛡️ Generating contingency plans`)

    const contingencies: Contingency[] = []

    // Identify risks
    const risks = [
      {
        risk: 'Resource shortage',
        probability: 0.3,
        impact: 0.8,
        affectedTasks: plan.tasks.filter(t => t.resources.length > 2)
      },
      {
        risk: 'Task delay',
        probability: 0.4,
        impact: 0.6,
        affectedTasks: plan.tasks.filter(t => t.duration > 10)
      },
      {
        risk: 'Dependency failure',
        probability: 0.2,
        impact: 0.9,
        affectedTasks: plan.tasks.filter(t => t.dependencies.length > 0)
      }
    ]

    for (const risk of risks) {
      if (risk.affectedTasks.length === 0) continue

      console.log(`   • ${risk.risk} (${(risk.probability * 100).toFixed(0)}% probability)`)

      const mitigation: string[] = []

      if (risk.risk === 'Resource shortage') {
        mitigation.push('Add backup resources to pool')
        mitigation.push('Enable resource sharing across tasks')
        mitigation.push('Prioritize critical path tasks')
      } else if (risk.risk === 'Task delay') {
        mitigation.push('Add buffer time to long tasks')
        mitigation.push('Break into smaller subtasks')
        mitigation.push('Parallelize where possible')
      } else if (risk.risk === 'Dependency failure') {
        mitigation.push('Add alternative dependency chains')
        mitigation.push('Create fallback tasks')
        mitigation.push('Implement checkpoint system')
      }

      // Generate simplified contingency plan
      const contingencyPlan: Plan = {
        id: crypto.randomUUID(),
        tasks: risk.affectedTasks.map(t => ({
          ...t,
          id: `fallback-${t.id}`,
          duration: t.duration * 1.2 // Add buffer
        })),
        timeline: new Map(),
        resourceAllocation: new Map(),
        makespan: plan.makespan * 1.3,
        criticalPath: []
      }

      contingencies.push({
        risk: risk.risk,
        probability: risk.probability,
        impact: risk.impact,
        mitigation,
        contingencyPlan
      })
    }

    console.log(`   ✓ Generated ${contingencies.length} contingency plans`)

    return contingencies
  }

  /**
   * OPTIMIZE PLAN - Improve plan efficiency
   */
  optimizePlan(plan: Plan, objective: 'time' | 'resources' | 'cost'): Plan {
    console.log(`\n⚡ Optimizing plan for: ${objective}`)

    const optimized = { ...plan }
    let improvement = 0

    if (objective === 'time') {
      // Try to parallelize tasks
      for (const task of optimized.tasks) {
        if (task.dependencies.length <= 1 && task.duration < 5) {
          // Can potentially parallelize
          const timeline = optimized.timeline.get(task.id)!
          const currentEnd = timeline.end

          // Simulate parallel execution
          const potentialStart = Math.max(...task.dependencies.map(d =>
            optimized.timeline.get(d)?.start || 0
          ))

          if (potentialStart < timeline.start) {
            optimized.timeline.set(task.id, {
              start: potentialStart,
              end: potentialStart + task.duration
            })
            improvement += (timeline.start - potentialStart)
          }
        }
      }
    }

    console.log(`   ✓ Optimization complete: ${improvement.toFixed(1)} hour improvement`)

    return optimized
  }

  getMetrics() {
    return {
      plansCreated: 0,
      averageOptimization: 0,
      contingencyPlansGenerated: 0
    }
  }
}

export { PlanningAgent, Task, Plan, Contingency }

if (import.meta.main) {
  console.log('🧪 Planning Agent Test\n')

  const agent = new PlanningAgent()

  // Create sample tasks
  const tasks: Task[] = [
    {
      id: 't1',
      name: 'Data collection',
      duration: 8,
      dependencies: [],
      resources: ['analyst'],
      priority: 'high'
    },
    {
      id: 't2',
      name: 'Model training',
      duration: 16,
      dependencies: ['t1'],
      resources: ['gpu', 'engineer'],
      priority: 'critical'
    },
    {
      id: 't3',
      name: 'Validation',
      duration: 6,
      dependencies: ['t2'],
      resources: ['analyst'],
      priority: 'high'
    },
    {
      id: 't4',
      name: 'Deployment',
      duration: 4,
      dependencies: ['t3'],
      resources: ['engineer'],
      priority: 'medium'
    }
  ]

  const resources = ['analyst-1', 'analyst-2', 'engineer-1', 'gpu-1']

  // Create plan
  const plan = agent.createPlan(tasks, resources)
  console.log(`\nPlan makespan: ${plan.makespan} hours`)

  // Generate contingencies
  const contingencies = agent.generateContingencyPlans(plan)
  console.log(`\nContingencies: ${contingencies.length}`)

  // Optimize
  const optimized = agent.optimizePlan(plan, 'time')

  console.log('\n✅ Planning Agent loaded')
}
