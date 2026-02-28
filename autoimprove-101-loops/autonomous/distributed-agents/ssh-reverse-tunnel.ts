#!/usr/bin/env bun
/**
 * SSH Reverse Tunnel Manager - OpenClaw-style NAT traversal
 *
 * Architecture:
 * Local Node (behind NAT) → SSH Reverse Tunnel → Cloud Gateway (public IP)
 *
 * Command: ssh -R 18790:localhost:18789 user@cloud-gateway
 * Effect: Cloud connects to localhost:18789 via cloud:18790
 *
 * Features:
 * - Auto-establish reverse tunnel
 * - Connection health monitoring
 * - Auto-reconnection with exponential backoff
 * - Port conflict detection
 * - Connection state tracking
 */

import { $ } from 'bun'

interface TunnelConfig {
  cloudHost: string
  cloudUser: string
  cloudPort: number
  localPort: number
  remotePort: number
  sshKeyPath?: string
  keepaliveInterval?: number // seconds
}

type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

interface ConnectionStatus {
  state: ConnectionState
  connectedAt?: number
  lastError?: string
  reconnectAttempts: number
  uptimeSeconds?: number
}

class SSHReverseTunnel {
  private config: TunnelConfig
  private sshProcess: Bun.Process | null = null
  private connectionState: ConnectionState = 'disconnected'
  private connectedAt: number = 0
  private lastError: string = ''
  private reconnectAttempts: number = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private healthCheckTimer: NodeJS.Timeout | null = null
  private maxReconnectAttempts: number = 10
  private baseReconnectDelay: number = 1000 // ms
  private onStateChangeCallbacks: Array<(state: ConnectionState) => void> = []
  private onReconnectCallbacks: Array<() => void> = []

  constructor(config: TunnelConfig) {
    this.config = {
      keepaliveInterval: 30,
      ...config
    }
  }

  /**
   * ESTABLISH - Create SSH reverse tunnel
   */
  async establish(): Promise<boolean> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      console.log('⚠️ Tunnel already established or connecting')
      return false
    }

    this.setState('connecting')
    console.log(`🔌 Establishing SSH reverse tunnel...`)
    console.log(`   Local: localhost:${this.config.localPort}`)
    console.log(`   Remote: ${this.config.cloudHost}:${this.config.remotePort}`)

    try {
      // Build SSH command
      const sshArgs = this.buildSSHCommand()

      // Start SSH process
      this.sshProcess = $({
        env: {
          SSH_KEEPALIVE: (this.config.keepaliveInterval! * 60).toString()
        },
        stdout: 'pipe',
        stderr: 'pipe'
      })

      const proc = this.sshProcess.spawn(['ssh', ...sshArgs])

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 30000) // 30 second timeout

        proc.stdout.on('data', (data: Buffer) => {
          const output = data.toString()
          console.log(`   SSH stdout: ${output.trim()}`)

          // Check for successful connection indicators
          if (output.includes('Success') || output.includes('tunnel')) {
            clearTimeout(timeout)
            resolve()
          }
        })

        proc.stderr.on('data', (data: Buffer) => {
          const error = data.toString()

          // Some SSH warnings are normal, check for actual errors
          if (error.includes('Could not reverse')) {
            clearTimeout(timeout)
            reject(new Error(`Port conflict: ${error}`))
          } else if (error.includes('Connection refused')) {
            clearTimeout(timeout)
            reject(new Error('Cloud gateway unreachable'))
          } else if (error.includes('Authentication failed')) {
            clearTimeout(timeout)
            reject(new Error('SSH authentication failed'))
          }
        })

        proc.on('exit', (code: number) => {
          if (code !== 0) {
            clearTimeout(timeout)
            reject(new Error(`SSH exited with code ${code}`))
          } else {
            clearTimeout(timeout)
            resolve()
          }
        })

        // Assume success after 3 seconds if no errors
        setTimeout(() => {
          if (this.connectionState === 'connecting') {
            clearTimeout(timeout)
            resolve()
          }
        }, 3000)
      })

      this.setState('connected')
      this.connectedAt = Date.now()
      this.reconnectAttempts = 0
      console.log(`✅ SSH reverse tunnel established`)

      // Start health monitoring
      this.startHealthCheck()

      return true

    } catch (error) {
      const errorMsg = (error as Error).message
      this.lastError = errorMsg
      this.setState('error')
      console.error(`❌ Tunnel establishment failed: ${errorMsg}`)

      // Schedule reconnection
      this.scheduleReconnect()

      return false
    }
  }

  /**
   * BUILD SSH COMMAND - Construct ssh command with reverse tunnel
   */
  private buildSSHCommand(): string[] {
    const args: string[] = []

    // Reverse tunnel: -R remotePort:localhost:localPort
    args.push('-R')
    args.push(`${this.config.remotePort}:localhost:${this.config.localPort}`)

    // Server alive interval (keep connection alive)
    args.push('-o')
    args.push(`ServerAliveInterval=${this.config.keepaliveInterval!}`)

    args.push('-o')
    args.push('ServerAliveCountMax=3')

    // Exit on master failure
    args.push('-o')
    args.push('ExitOnForwardFailure=yes')

    // Disable strict host key checking (for auto-reconnect)
    args.push('-o')
    args.push('StrictHostKeyChecking=no')

    // Quiet mode (less output)
    args.push('-q')

    // Connection timeout
    args.push('-o')
    args.push('ConnectTimeout=10')

    // Custom SSH key if provided
    if (this.config.sshKeyPath) {
      args.push('-i')
      args.push(this.config.sshKeyPath)
    }

    // Destination
    args.push(`${this.config.cloudUser}@${this.config.cloudHost}`)

    // Remote port (optional if not default 22)
    if (this.config.cloudPort !== 22) {
      args.push('-p')
      args.push(this.config.cloudPort.toString())
    }

    // Remote command (keep alive)
    args.push('sleep infinity')

    return args
  }

  /**
   * CLOSE - Terminate SSH tunnel
   */
  async close(): Promise<void> {
    console.log('🔌 Closing SSH reverse tunnel...')

    // Stop health check
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    // Cancel reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // Kill SSH process
    if (this.sshProcess) {
      this.sshProcess.kill()
      this.sshProcess = null
    }

    this.setState('disconnected')
    console.log('✅ Tunnel closed')
  }

  /**
   * IS CONNECTED - Check connection status
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' &&
           this.sshProcess !== null
  }

  /**
   * GET CONNECTION STATE - Full status
   */
  getConnectionState(): ConnectionStatus {
    return {
      state: this.connectionState,
      connectedAt: this.connectedAt || undefined,
      lastError: this.lastError || undefined,
      reconnectAttempts: this.reconnectAttempts,
      uptimeSeconds: this.connectedAt > 0
        ? Math.floor((Date.now() - this.connectedAt) / 1000)
        : undefined
    }
  }

  /**
   * ON RECONNECT - Register callback for reconnection
   */
  onReconnect(callback: () => void): void {
    this.onReconnectCallbacks.push(callback)
  }

  /**
   * ON STATE CHANGE - Register callback for state changes
   */
  onStateChange(callback: (state: ConnectionState) => void): void {
    this.onStateChangeCallbacks.push(callback)
  }

  /**
   * SCHEDULE RECONNECT - Exponential backoff reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached')
      this.setState('error')
      return
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    this.setState('reconnecting')

    this.reconnectTimer = setTimeout(async () => {
      const success = await this.establish()
      if (success && this.connectionState === 'connected') {
        // Notify reconnection callbacks
        for (const callback of this.onReconnectCallbacks) {
          try {
            callback()
          } catch (error) {
            console.error(`Reconnect callback error: ${error}`)
          }
        }
      }
    }, delay)
  }

  /**
   * START HEALTH CHECK - Monitor connection health
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      if (!this.isConnected()) {
        return
      }

      // Check if SSH process is still running
      if (this.sshProcess && this.sshProcess.killed) {
        console.log('⚠️ SSH process died, reconnecting...')
        this.setState('disconnected')
        this.scheduleReconnect()
      }

    }, 5000) // Check every 5 seconds
  }

  /**
   * SET STATE - Update state and notify callbacks
   */
  private setState(state: ConnectionState): void {
    const oldState = this.connectionState
    this.connectionState = state

    if (oldState !== state) {
      console.log(`📊 State: ${oldState} → ${state}`)

      // Notify state change callbacks
      for (const callback of this.onStateChangeCallbacks) {
        try {
          callback(state)
        } catch (error) {
          console.error(`State change callback error: ${error}`)
        }
      }
    }
  }
}

// Export
export { SSHReverseTunnel, TunnelConfig, ConnectionState, ConnectionStatus }

// Test
if (import.meta.main) {
  console.log('🧪 SSH Reverse Tunnel Test\n')

  const tunnel = new SSHReverseTunnel({
    cloudHost: 'gateway.example.com',
    cloudUser: 'fr3k',
    cloudPort: 22,
    localPort: 18789,
    remotePort: 18790,
    sshKeyPath: '~/.ssh/id_ed25519',
    keepaliveInterval: 30
  })

  // Register callbacks
  tunnel.onStateChange((state) => {
    console.log(`   🔄 State changed to: ${state}`)
  })

  tunnel.onReconnect(() => {
    console.log(`   🎉 Reconnected successfully!`)
  })

  // Test connection status
  console.log('\n📊 Connection Status:')
  console.log(tunnel.getConnectionState())

  console.log('\n✅ SSH Reverse Tunnel Manager loaded')
}
