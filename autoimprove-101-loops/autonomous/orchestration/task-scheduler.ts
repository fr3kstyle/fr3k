/**
 * Task Scheduler
 * Advanced task scheduling with priorities, dependencies, and resource awareness
 */

interface Task {
  id: string;
  name: string;
  priority: number;
  estimatedDuration: number;
  dependencies: string[];
  requiredCapabilities: string[];
  deadline?: number;
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledTime?: number;
  assignedAgent?: string;
  retryCount: number;
  maxRetries: number;
}

interface ScheduleSlot {
  startTime: number;
  endTime: number;
  agentId: string;
  taskId: string;
}

export class TaskScheduler {
  private tasks = new Map<string, Task>();
  private schedule: ScheduleSlot[] = [];
  private timeHorizon = 86400000; // 24 hours
  private granularity = 60000; // 1 minute slots

  addTask(task: Omit<Task, 'id' | 'status' | 'retryCount'>): string {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retryCount: 0
    };

    this.tasks.set(newTask.id, newTask);
    return newTask.id;
  }

  scheduleTasks(agentCapabilities: Map<string, string[]>): ScheduleSlot[] {
    this.schedule = [];
    const pendingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        // Priority first
        if (b.priority !== a.priority) return b.priority - a.priority;
        // Then deadline
        if (a.deadline && b.deadline) return a.deadline - b.deadline;
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        // Then estimated duration
        return a.estimatedDuration - b.estimatedDuration;
      });

    const now = Date.now();
    const agentAvailability = new Map<string, number>();

    agentCapabilities.forEach((_, agentId) => {
      agentAvailability.set(agentId, now);
    });

    for (const task of pendingTasks) {
      if (!this.areDependenciesMet(task)) continue;

      const eligibleAgents = this.findEligibleAgents(task, agentCapabilities, agentAvailability);
      if (eligibleAgents.length === 0) continue;

      const bestAgent = this.selectBestAgent(task, eligibleAgents, agentAvailability);
      const availableTime = agentAvailability.get(bestAgent) || now;

      const slot: ScheduleSlot = {
        startTime: availableTime,
        endTime: availableTime + task.estimatedDuration,
        agentId: bestAgent,
        taskId: task.id
      };

      this.schedule.push(slot);
      task.status = 'scheduled';
      task.scheduledTime = availableTime;
      task.assignedAgent = bestAgent;

      agentAvailability.set(bestAgent, slot.endTime);
    }

    return this.schedule;
  }

  private areDependenciesMet(task: Task): boolean {
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep?.status === 'completed';
    });
  }

  private findEligibleAgents(
    task: Task,
    agentCapabilities: Map<string, string[]>,
    agentAvailability: Map<string, number>
  ): string[] {
    const eligible: string[] = [];

    agentCapabilities.forEach((caps, agentId) => {
      const hasCapabilities = task.requiredCapabilities.every(cap => caps.includes(cap));
      const meetsDeadline = !task.deadline ||
        (agentAvailability.get(agentId) || 0) + task.estimatedDuration <= task.deadline;

      if (hasCapabilities && meetsDeadline) {
        eligible.push(agentId);
      }
    });

    return eligible;
  }

  private selectBestAgent(task: Task, eligibleAgents: string[], availability: Map<string, number>): string {
    return eligibleAgents
      .sort((a, b) => {
        const timeA = availability.get(a) || 0;
        const timeB = availability.get(b) || 0;

        // Prefer earlier availability
        if (timeA !== timeB) return timeA - timeB;

        // Tie-breaker: alphabetical
        return a.localeCompare(b);
      })[0];
  }

  getSchedule(timeWindow?: { start: number; end: number }): ScheduleSlot[] {
    if (!timeWindow) return this.schedule;

    return this.schedule.filter(slot =>
      slot.startTime >= timeWindow.start && slot.endTime <= timeWindow.end
    );
  }

  getUpcomingTasks(agentId: string, count: number = 5): Task[] {
    return this.schedule
      .filter(slot => slot.agentId === agentId && slot.startTime > Date.now())
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, count)
      .map(slot => this.tasks.get(slot.taskId)!)
      .filter(Boolean);
  }

  markTaskStarted(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'scheduled') {
      task.status = 'running';
    }
  }

  markTaskCompleted(taskId: string, success: boolean = true): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (success) {
      task.status = 'completed';
      this.removeFromSchedule(taskId);
    } else {
      task.status = 'failed';
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        this.removeFromSchedule(taskId);
      }
    }
  }

  private removeFromSchedule(taskId: string): void {
    this.schedule = this.schedule.filter(slot => slot.taskId !== taskId);
  }

  rescheduleTask(taskId: string, newPriority?: number): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    this.removeFromSchedule(taskId);
    task.status = 'pending';
    task.scheduledTime = undefined;
    task.assignedAgent = undefined;

    if (newPriority !== undefined) {
      task.priority = newPriority;
    }
  }

  getOverdueTasks(): Task[] {
    const now = Date.now();
    return Array.from(this.tasks.values()).filter(task =>
      task.deadline &&
      task.deadline < now &&
      task.status !== 'completed'
    );
  }

  getUtilization(agentId: string, timeWindow: { start: number; end: number }): number {
    const slots = this.schedule.filter(slot =>
      slot.agentId === agentId &&
      slot.startTime >= timeWindow.start &&
      slot.endTime <= timeWindow.end
    );

    const totalBusyTime = slots.reduce((sum, slot) => sum + (slot.endTime - slot.startTime), 0);
    const windowDuration = timeWindow.end - timeWindow.start;

    return totalBusyTime / windowDuration;
  }

  optimizeSchedule(): void {
    const now = Date.now();
    const scheduled = Array.from(this.tasks.values())
      .filter(t => t.status === 'scheduled' && t.scheduledTime! > now);

    // Reschedule tasks that could start earlier
    scheduled.forEach(task => {
      const currentSlot = this.schedule.find(s => s.taskId === task.id);
      if (!currentSlot) return;

      const couldStartEarlier = this.schedule
        .filter(s =>
          s.agentId === currentSlot.agentId &&
          s.endTime <= currentSlot.startTime &&
          s.endTime + task.estimatedDuration <= currentSlot.startTime
        ).length > 0;

      if (couldStartEarlier) {
        this.rescheduleTask(task.id);
      }
    });

    // Re-run scheduling to fill gaps
    this.scheduleTasks(new Map());
  }

  clearCompletedTasks(olderThan: number = 86400000): void {
    const cutoff = Date.now() - olderThan;
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' && task.scheduledTime! < cutoff) {
        this.tasks.delete(id);
      }
    }
  }
}
