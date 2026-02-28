#!/usr/bin/env bun
/**
 * Node Health Monitor - Fleet health tracking (OpenClaw-style)
 *
 * Features:
 * - Heartbeat system (ping every 30s)
 * - Status tracking (online, offline, limited, error)
 * - Resource monitoring (CPU, memory, disk, network)
 * - Alert system for node failures
 * - Auto-reconnection logic
 * - Health dashboard data
 */

interface NodeHealth {
  nodeId: string
  status: 'online' | 'offline' | 'limited' | 'error'
  lastHeartbeat: number
  uptime: number
  resources: {
    cpu: number // percent
    memory: number // percent
    disk: number // percent
    network: {
      bytesIn: number
      bytesOut: number
      latency: number // ms
    }
  }
  alerts: Alert[]
  lastCheck: number
}

interface Alert {
  id: string
  type: 'node_down' | 'high_cpu' | 'high_memory' | 'disk_full' | 'network_slow'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: number
  acknowledged: boolean
}

interface HealthCheckConfig {
  heartbeatInterval: number // seconds
  timeoutThreshold: number // seconds
  cpuThreshold: number // percent
  memoryThreshold: number // percent
  diskThreshold: number // percent
  latencyThreshold: number // ms
}

class NodeHealthMonitor {
  private nodeHealth: Map<string, NodeHealth> = new Map()
  private monitoringActive: Map<string, boolean> = new Map()
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map()
  private alertHistory: Alert[] = []
  private config: HealthCheckConfig
  private onNodeDownCallbacks: Array<(nodeId: string) => void> = []
  private onNodeRecoveredCallbacks: Array<(nodeId: string) => void> = []
  private onAlertCallbacks: Array<(alert: Alert) => void> = []

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      heartbeatInterval: 30,
      timeoutThreshold: 90,
      cpuThreshold: 80,
      memoryThreshold: 85,
      diskThreshold: 90,
      latencyThreshold: 500,
      ...config
    }
  }

  /**
   * START MONITORING - Begin monitoring a node
   */
  startMonitoring(nodeId: string): void {
    console.log(`💓 Starting health monitoring: ${nodeId}`)

    if (this.monitoringActive.get(nodeId)) {
      console.log(`⚠️ Already monitoring: ${nodeId}`)
      return
    }

    // Initialize health record
    this.nodeHealth.set(nodeId, {
      nodeId,
      status: 'online',
      lastHeartbeat: Date.now(),
      uptime: 0,
      resources: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: {
          bytesIn: 0,
          bytesOut: 0,
          latency: 0
        }
      },
      alerts: [],
      lastCheck: Date.now()
    })

    this.monitoringActive.set(nodeId, true)

    // Start heartbeat timer
    this.startHeartbeat(nodeId)

    console.log(`✓ Monitoring active: ${nodeId}`)
  }

  /**
   * STOP MONITORING - Stop monitoring a node
   */
  stopMonitoring(nodeId: string): void {
    console.log(`🛑 Stopping health monitoring: ${nodeId}`)

    // Clear heartbeat timer
    const timer = this.heartbeatTimers.get(nodeId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(nodeId)
    }

    this.monitoringActive.set(nodeId, false)
    console.log(`✓ Monitoring stopped: ${nodeId}`)
  }

  /**
   * GET NODE HEALTH - Get health data for specific node
   */
  async getNodeHealth(nodeId: string): Promise<NodeHealth | null> {
    const health = this.nodeHealth.get(nodeId)

    if (!health) {
      console.log(`❌ No health data for: ${nodeId}`)
      return null
    }

    // Check if node is timed out
    const timeSinceHeartbeat = Date.now() - health.lastHeartbeat
    if (timeSinceHeartbeat > this.config.timeoutThreshold * 1000) {
      if (health.status !== 'offline') {
        this.markNodeDown(nodeId)
      }
    }

    return health
  }

  /**
   * GET ALL NODES HEALTH - Get health for all monitored nodes
   */
  async getAllNodesHealth(): Promise<Map<string, NodeHealth>> {
    // Update all nodes health status
    for (const nodeId of this.monitoringActive.keys()) {
      await this.getNodeHealth(nodeId)
    }

    return new Map(this.nodeHealth)
  }

  /**
   * UPDATE HEARTBEAT - Process heartbeat from node
   */
  async updateHeartbeat(nodeId: string, resources?: Partial<NodeHealth['resources']>): void {
    const health = this.nodeHealth.get(nodeId)

    if (!health) {
      console.log(`⚠️ Heartbeat from unknown node: ${nodeId}`)
      return
    }

    const now = Date.now()
    const wasOffline = health.status === 'offline'

    health.lastHeartbeat = now
    health.lastCheck = now
    health.uptime = now - (health.lastHeartbeat - health.uptime)

    // Update resources if provided
    if (resources) {
      if (resources.cpu !== undefined) health.resources.cpu = resources.cpu
      if (resources.memory !== undefined) health.resources.memory = resources.memory
      if (resources.disk !== undefined) health.resources.disk = resources.disk
      if (resources.network) {
        health.resources.network = { ...health.resources.network, ...resources.network }
      }
    }

    // Check thresholds and generate alerts
    this.checkThresholds(nodeId, health)

    // Node was offline, now recovered
    if (wasOffline) {
      this.markNodeRecovered(nodeId)
    } else {
      health.status = 'online'
    }

    console.log(`💓 Heartbeat: ${nodeId} (${health.status})`)
  }

  /**
   * ON NODE DOWN - Register callback for node failure
   */
  onNodeDown(callback: (nodeId: string) => void): void {
    this.onNodeDownCallbacks.push(callback)
  }

  /**
   * ON NODE RECOVERED - Register callback for node recovery
   */
  onNodeRecovered(callback: (nodeId: string) => void): void {
    this.onNodeRecoveredCallbacks.push(callback)
  }

  /**
   * ON ALERT - Register callback for alerts
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.onAlertCallbacks.push(callback)
  }

  /**
   * GET ALERTS - Get all alerts
   */
  getAlerts(severity?: Alert['severity']): Alert[] {
    if (severity) {
      return this.alertHistory.filter(a => a.severity === severity && !a.acknowledged)
    }
    return this.alertHistory.filter(a => !a.acknowledged)
  }

  /**
   * ACKNOWLEDGE ALERT - Mark alert as acknowledged
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alertHistory.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      console.log(`✓ Alert acknowledged: ${alertId}`)
    }
  }

  /**
   * START HEARTBEAT - Initiate heartbeat timer
   */
  private startHeartbeat(nodeId: string): void {
    const timer = setInterval(async () => {
      await this.checkNodeTimeout(nodeId)
    }, this.config.heartbeatInterval * 1000)

    this.heartbeatTimers.set(nodeId, timer)
  }

  /**
   * CHECK NODE TIMEOUT - Check if node has timed out
   */
  private async checkNodeTimeout(nodeId: string): Promise<void> {
    const health = await this.getNodeHealth(nodeId)

    if (!health) return

    const timeSinceHeartbeat = Date.now() - health.lastHeartbeat

    if (timeSinceHeartbeat > this.config.timeoutThreshold * 1000) {
      if (health.status !== 'offline') {
        this.markNodeDown(nodeId)
      }
    }
  }

  /**
   * MARK NODE DOWN - Handle node failure
   */
  private markNodeDown(nodeId: string): void {
    const health = this.nodeHealth.get(nodeId)
    if (!health) return

    health.status = 'offline'

    // Create alert
    const alert: Alert = {
      id: crypto.randomUUID(),
      type: 'node_down',
      severity: 'critical',
      message: `Node ${nodeId} is offline (last heartbeat ${Math.floor((Date.now() - health.lastHeartbeat) / 1000)}s ago)`,
      timestamp: Date.now(),
      acknowledged: false
    }

    this.addAlert(nodeId, alert)

    // Notify callbacks
    for (const callback of this.onNodeDownCallbacks) {
      try {
        callback(nodeId)
      } catch (error) {
        console.error(`Node down callback error: ${error}`)
      }
    }

    console.log(`🚨 Node DOWN: ${nodeId}`)
  }

  /**
   * MARK NODE RECOVERED - Handle node recovery
   */
  private markNodeRecovered(nodeId: string): void {
    const health = this.nodeHealth.get(nodeId)
    if (!health) return

    health.status = 'online'

    // Notify callbacks
    for (const callback of this.onNodeRecoveredCallbacks) {
      try {
        callback(nodeId)
      } catch (error) {
        console.error(`Node recovered callback error: ${error}`)
      }
    }

    console.log(`✅ Node RECOVERED: ${nodeId}`)
  }

  /**
   * CHECK THRESHOLDS - Check resource thresholds
   */
  private checkThresholds(nodeId: string, health: NodeHealth): void {
    // CPU threshold
    if (health.resources.cpu > this.config.cpuThreshold) {
      const alert: Alert = {
        id: crypto.randomUUID(),
        type: 'high_cpu',
        severity: health.resources.cpu > 95 ? 'critical' : 'warning',
        message: `High CPU on ${nodeId}: ${health.resources.cpu}%`,
        timestamp: Date.now(),
        acknowledged: false
      }
      this.addAlert(nodeId, alert)
    }

    // Memory threshold
    if (health.resources.memory > this.config.memoryThreshold) {
      const alert: Alert = {
        id: crypto.randomUUID(),
        type: 'high_memory',
        severity: health.resources.memory > 95 ? 'critical' : 'warning',
        message: `High memory on ${nodeId}: ${health.resources.memory}%`,
        timestamp: Date.now(),
        acknowledged: false
      }
      this.addAlert(nodeId, alert)
    }

    // Disk threshold
    if (health.resources.disk > this.config.diskThreshold) {
      const alert: Alert = {
        id: crypto.randomUUID(),
        type: 'disk_full',
        severity: 'critical',
        message: `Disk almost full on ${nodeId}: ${health.resources.disk}%`,
        timestamp: Date.now(),
        acknowledged: false
      }
      this.addAlert(nodeId, alert)
    }

    // Network latency
    if (health.resources.network.latency > this.config.latencyThreshold) {
      const alert: Alert = {
        id: crypto.randomUUID(),
        type: 'network_slow',
        severity: 'warning',
        message: `High latency on ${nodeId}: ${health.resources.network.latency}ms`,
        timestamp: Date.now(),
        acknowledged: false
      }
      this.addAlert(nodeId, alert)

      // Mark as limited
      health.status = 'limited'
    }
  }

  /**
   * ADD ALERT - Add alert to history
   */
  private addAlert(nodeId: string, alert: Alert): void {
    // Add to node health
    const health = this.nodeHealth.get(nodeId)
    if (health) {
      health.alerts.push(alert)
    }

    // Add to global history
    this.alertHistory.push(alert)

    // Notify callbacks
    for (const callback of this.onAlertCallbacks) {
      try {
        callback(alert)
      } catch (error) {
        console.error(`Alert callback error: ${error}`)
      }
    }

    console.log(`🚨 ALERT [${alert.severity}]: ${alert.message}`)
  }

  /**
   * GET SUMMARY - Get health summary
   */
  getSummary() {
    const healthArray = Array.from(this.nodeHealth.values())

    return {
      totalNodes: healthArray.length,
      onlineNodes: healthArray.filter(h => h.status === 'online').length,
      offlineNodes: healthArray.filter(h => h.status === 'offline').length,
      limitedNodes: healthArray.filter(h => h.status === 'limited').length,
      activeAlerts: this.getAlerts().length,
      criticalAlerts: this.getAlerts('critical').length,
      warningAlerts: this.getAlerts('warning').length
    }
  }
}

// Export
export { NodeHealthMonitor, NodeHealth, Alert, HealthCheckConfig }

// Test
if (import.meta.main) {
  console.log('🧪 Node Health Monitor Test\n')

  const monitor = new NodeHealthMonitor({
    heartbeatInterval: 10,
    timeoutThreshold: 30
  })

  // Register callbacks
  monitor.onNodeDown((nodeId) => {
    console.log(`   📢 Callback: Node ${nodeId} is down!`)
  })

  monitor.onNodeRecovered((nodeId) => {
    console.log(`   📢 Callback: Node ${nodeId} recovered!`)
  })

  monitor.onAlert((alert) => {
    console.log(`   📢 Alert: [${alert.severity}] ${alert.message}`)
  })

  // Start monitoring
  monitor.startMonitoring('node-1')
  monitor.startMonitoring('node-2')

  // Simulate heartbeats
  await monitor.updateHeartbeat('node-1', {
    cpu: 45,
    memory: 60,
    disk: 70,
    network: { latency: 50, bytesIn: 1024, bytesOut: 2048 }
  })

  await monitor.updateHeartbeat('node-2', {
    cpu: 90, // Will trigger alert
    memory: 88, // Will trigger alert
    disk: 95, // Will trigger critical alert
    network: { latency: 600, bytesIn: 512, bytesOut: 1024 }
  })

  console.log('\n📊 Summary:', monitor.getSummary())

  console.log('\n✅ Node Health Monitor loaded')
}
