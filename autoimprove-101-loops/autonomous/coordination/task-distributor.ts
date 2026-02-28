/** Task Distribution - Load balancing across agents */
export class TaskDistributor {
  distribute(tasks: any[], agents: string[]) {
    return agents.map((agent, i) => ({
      agent,
      tasks: tasks.slice(i * Math.ceil(tasks.length / agents.length), (i + 1) * Math.ceil(tasks.length / agents.length))
    }))
  }
}
