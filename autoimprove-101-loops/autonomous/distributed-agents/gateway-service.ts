#!/usr/bin/env bun
/**
 * Gateway Service - Central node registry and control (OpenClaw-style)
 *
 * Features:
 * - Central node registry
 * - Connection management (accept/drop nodes)
 * - Command routing to nodes
 * - Status aggregation
 * - Web dashboard (optional)
 * - REST API for external control
 */

import { NodePairingProtocol, NodeInfo } from './node-pairing-protocol.ts'
import { DistributedCommandBus } from './distributed-command-bus.ts'
import { NodeHealthMonitor } from './node-health-monitor.ts'

interface GatewayConfig {
  host: string
  port: number
  maxNodes: number
  requireAuth: boolean
}

interface SystemStatus {
  gatewayId: string
  startTime: number
  uptime: number
  registeredNodes: number
  onlineNodes: number
  totalCommandsExecuted: number
  activeConnections: number
}

class GatewayService {
  private config: GatewayConfig
  private pairingProtocol: NodePairingProtocol
  private commandBus: DistributedCommandBus
  private healthMonitor: NodeHealthMonitor
  private gatewayId: string
  private startTime: number
  private running: boolean = false
  private commandCounter: number = 0

  constructor(config: Partial<GatewayConfig> = {}) {
    this.config = {
      host: '0.0.0.0',
      port: 18789,
      maxNodes: 100,
      requireAuth: true,
      ...config
    }

    this.gatewayId = crypto.randomUUID()
    this.startTime = Date.now()

    // Initialize subsystems
    this.pairingProtocol = new NodePairingProtocol()
    this.commandBus = new DistributedCommandBus()
    this.healthMonitor = new NodeHealthMonitor()
  }

  /**
   * START - Start gateway service
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log('⚠️ Gateway already running')
      return
    }

    console.log('🚀 Starting Gateway Service...')
    console.log(`   Gateway ID: ${this.gatewayId}`)
    console.log(`   Listening: ${this.config.host}:${this.config.port}`)

    // Initialize pairing protocol
    await this.pairingProtocol.initGateway()

    // Setup health monitoring callbacks
    this.setupHealthCallbacks()

    this.running = true

    console.log('✅ Gateway Service started')
  }

  /**
   * STOP - Stop gateway service
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return
    }

    console.log('🛑 Stopping Gateway Service...')

    // Stop health monitoring for all nodes
    const nodes = await this.pairingProtocol.discoverNodes()
    for (const node of nodes) {
      this.healthMonitor.stopMonitoring(node.nodeId)
    }

    this.running = false

    console.log('✅ Gateway Service stopped')
  }

  /**
   * ACCEPT NODE - Accept and register node
   */
  async acceptNode(nodeConfig: {
    nodeId: string
    nodeType: 'gateway' | 'node' | 'viewer'
    publicKey: string
    hostname: string
    capabilities: string[]
    metadata?: Record<string, any>
  }): Promise<{ success: boolean; token?: string; message: string }> {
    console.log(`🤝 Accepting node: ${nodeConfig.nodeId}`)

    try {
      // Check max nodes
      const currentNodes = await this.pairingProtocol.discoverNodes()
      if (currentNodes.length >= this.config.maxNodes) {
        return {
          success: false,
          message: `Maximum nodes limit reached (${this.config.maxNodes})`
        }
      }

      // Register node
      const token = await this.pairingProtocol.registerNode(nodeConfig)

      // Start health monitoring
      this.healthMonitor.startMonitoring(nodeConfig.nodeId)

      // Register with command bus (mock connection string)
      this.commandBus.registerNode(nodeConfig.nodeId, `${nodeConfig.hostname}`)

      console.log(`✓ Node accepted: ${nodeConfig.nodeId}`)

      return {
        success: true,
        token,
        message: 'Node registered successfully'
      }

    } catch (error) {
      const errorMsg = (error as Error).message
      console.error(`❌ Node acceptance failed: ${errorMsg}`)

      return {
        success: false,
        message: errorMsg
      }
    }
  }

  /**
   * REMOVE NODE - Remove node from gateway
   */
  async removeNode(nodeId: string): Promise<boolean> {
    console.log(`🗑️ Removing node: ${nodeId}`)

    // Unregister from pairing protocol
    const removed = await this.pairingProtocol.removeNode(nodeId)

    if (removed) {
      // Stop health monitoring
      this.healthMonitor.stopMonitoring(nodeId)

      // Unregister from command bus
      this.commandBus.unregisterNode(nodeId)

      console.log(`✓ Node removed: ${nodeId}`)
    }

    return removed
  }

  /**
   * ROUTE COMMAND - Send command to specific node
   */
  async routeCommand(
    nodeId: string,
    command: string,
    options: {
      timeout?: number
      type?: 'shell' | 'script' | 'agent'
      args?: string[]
    } = {}
  ): Promise<{ success: boolean; result?: any; message: string }> {
    console.log(`📤 Routing to ${nodeId}: ${command}`)

    try {
      // Verify node exists and is online
      const node = await this.pairingProtocol.getNodeInfo(nodeId)

      if (!node) {
        return {
          success: false,
          message: `Node not found: ${nodeId}`
        }
      }

      if (node.status !== 'online') {
        return {
          success: false,
          message: `Node not online: ${nodeId} (status: ${node.status})`
        }
      }

      // Execute command
      const result = await this.commandBus.executeOnNode(nodeId, command, options)

      this.commandCounter++

      return {
        success: result.success,
        result,
        message: result.success ? 'Command executed' : result.stderr
      }

    } catch (error) {
      const errorMsg = (error as Error).message

      return {
        success: false,
        message: errorMsg
      }
    }
  }

  /**
   * BROADCAST COMMAND - Send command to all nodes
   */
  async broadcastCommand(
    command: string,
    options: {
      timeout?: number
      parallel?: boolean
    } = {}
  ): Promise<Map<string, any>> {
    console.log(`📡 Broadcasting: ${command}`)

    const results = await this.commandBus.executeOnAllNodes(command, options)

    this.commandCounter += results.size

    return results
  }

  /**
   * GET REGISTERED NODES - List all nodes
   */
  async getRegisteredNodes(): Promise<NodeInfo[]> {
    return await this.pairingProtocol.discoverNodes()
  }

  /**
   * GET SYSTEM STATUS - Gateway status summary
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const nodes = await this.pairingProtocol.discoverNodes()
    const healthSummary = this.healthMonitor.getSummary()

    return {
      gatewayId: this.gatewayId,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime,
      registeredNodes: nodes.length,
      onlineNodes: healthSummary.onlineNodes,
      totalCommandsExecuted: this.commandCounter,
      activeConnections: healthSummary.onlineNodes
    }
  }

  /**
   * GET NODE HEALTH - Get health for specific node
   */
  async getNodeHealth(nodeId: string): Promise<any> {
    return await this.healthMonitor.getNodeHealth(nodeId)
  }

  /**
   * GET ALL NODES HEALTH - Get health for all nodes
   */
  async getAllNodesHealth(): Promise<Map<string, any>> {
    return await this.healthMonitor.getAllNodesHealth()
  }

  /**
   * GET ALERTS - Get active alerts
   */
  getAlerts(severity?: 'info' | 'warning' | 'critical'): any[] {
    return this.healthMonitor.getAlerts(severity)
  }

  /**
   * QUEUE COMMAND - Queue command for later execution
   */
  async queueCommand(command: {
    type: 'shell' | 'script' | 'agent'
    target: string
    command: string
    args?: string[]
    timeout?: number
    priority?: 'high' | 'normal' | 'low'
  }): Promise<string> {
    return await this.commandBus.queueCommand({
      ...command,
      priority: command.priority || 'normal'
    })
  }

  /**
   * GET COMMAND HISTORY - Get command history
   */
  async getCommandHistory(limit?: number): Promise<any[]> {
    return await this.commandBus.getCommandHistory(limit)
  }

  /**
   * SETUP HEALTH CALLBACKS
   */
  private setupHealthCallbacks(): void {
    this.healthMonitor.onNodeDown(async (nodeId) => {
      console.log(`🚨 Health monitor: Node ${nodeId} is down`)

      // Update pairing protocol status
      this.pairingProtocol.updateNodeStatus(nodeId, 'offline')
    })

    this.healthMonitor.onNodeRecovered(async (nodeId) => {
      console.log(`✅ Health monitor: Node ${nodeId} recovered`)

      // Update pairing protocol status
      this.pairingProtocol.updateNodeStatus(nodeId, 'online')
    })

    this.healthMonitor.onAlert((alert) => {
      console.log(`🚨 Alert: [${alert.severity}] ${alert.message}`)
    })
  }

  /**
   * GET METRICS
   */
  getMetrics() {
    return {
      gateway: {
        id: this.gatewayId,
        uptime: Date.now() - this.startTime,
        running: this.running
      },
      nodes: this.pairingProtocol.getMetrics(),
      commands: this.commandBus.getStatus(),
      health: this.healthMonitor.getSummary()
    }
  }
}

// Export
export { GatewayService, GatewayConfig, SystemStatus }

// Test
if (import.meta.main) {
  console.log('🧪 Gateway Service Test\n')

  const gateway = new GatewayService({
    port: 18789,
    maxNodes: 10
  })

  // Start gateway
  await gateway.start()

  // Accept some nodes
  const node1 = await gateway.acceptNode({
    nodeId: 'node-1',
    nodeType: 'node',
    publicKey: 'key-1',
    hostname: 'home-server.local',
    capabilities: ['github-agent', 'multi-agent'],
    metadata: { cpu: 8, memory: 16 }
  })

  console.log('\nNode 1:', node1)

  const node2 = await gateway.acceptNode({
    nodeId: 'node-2',
    nodeType: 'node',
    publicKey: 'key-2',
    hostname: 'laptop.local',
    capabilities: ['testing', 'development'],
    metadata: { cpu: 4, memory: 8 }
  })

  console.log('Node 2:', node2)

  // Get registered nodes
  const nodes = await gateway.getRegisteredNodes()
  console.log('\n📊 Registered nodes:', nodes.length)

  // Get system status
  const status = await gateway.getSystemStatus()
  console.log('\n📊 System Status:', status)

  // Get metrics
  console.log('\n📊 Metrics:', gateway.getMetrics())

  console.log('\n✅ Gateway Service loaded')
}
