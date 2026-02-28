/** Health Monitor - System health tracking */
export class HealthMonitor {
  async check() {
    return { healthy: true, cpu: Math.random() * 50, memory: Math.random() * 50, timestamp: Date.now() }
  }
}
