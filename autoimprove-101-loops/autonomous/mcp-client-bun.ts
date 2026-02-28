#!/usr/bin/env bun
/**
 * Bun-native MCP Client Manager
 *
 * Uses bun's native spawn to call MCP servers via stdio
 * Implements JSON-RPC protocol for MCP communication
 */

import { spawn } from 'bun'

interface MCPConnection {
  name: string
  process: any
  requestId: number
  pendingRequests: Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>
  tools: any[]
}

interface MCPCallResult {
  server: string
  tool: string
  success: boolean
  result?: any
  error?: string
  responseTime: number
}

class MCPClientManager {
  private connections: Map<string, MCPConnection> = new Map()
  private serverConfigs: Map<string, { command: string; args: string[] }> = new Map()

  constructor() {
    // Note: configs will be loaded when connect() is first called
  }

  private async loadServerConfigs(): Promise<void> {
    try {
      const configPath = '/home/fr3k/.config/claude/mcp.json'
      const configContent = await fetch(`file://${configPath}`).then(r => r.text())

      const config = JSON.parse(configContent)

      for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
        const cfg = serverConfig as any
        if (cfg && typeof cfg.command === 'string' && Array.isArray(cfg.args)) {
          this.serverConfigs.set(name, {
            command: cfg.command,
            args: cfg.args
          })
        }
      }

      console.log(`Loaded ${this.serverConfigs.size} MCP server configs`)
    } catch (error) {
      console.error(`Failed to load MCP configs: ${error}`)
    }
  }

  async connect(serverName: string): Promise<boolean> {
    // Load configs if not loaded
    if (this.serverConfigs.size === 0) {
      await this.loadServerConfigs()
    }

    if (this.connections.has(serverName)) {
      const conn = this.connections.get(serverName)!
      return conn.process !== null
    }

    const config = this.serverConfigs.get(serverName)
    if (!config) {
      console.error(`No config found for MCP server: ${serverName}`)
      return false
    }

    try {
      // Use 'npx' from PATH instead of absolute path
      const proc = spawn({
        cmd: 'npx',
        args: ['-y', ...config.args.slice(1)], // Skip '-y' if it's already in config, or use it directly
        stdout: 'pipe',
        stdin: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          PATH: process.env.PATH
        }
      })

      const connection: MCPConnection = {
        name: serverName,
        process: proc,
        requestId: 0,
        pendingRequests: new Map(),
        tools: []
      }

      // Handle stdout responses
      if (proc.stdout) {
        const reader = proc.stdout.getReader()
        const buffer = new Uint8Array()

        const readLoop = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              // Process JSON-RPC responses
              const text = new TextDecoder().decode(value)
              this.handleResponse(connection, text)
            }
          } catch (error) {
            // Stream closed
          }
        }

        readLoop().catch(() => {})
      }

      // Initialize connection
      await this.sendRequest(connection, {
        jsonrpc: '2.0',
        id: ++connection.requestId,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'fr3k-loops',
            version: '1.0.0'
          }
        }
      })

      // List tools
      const toolsResult = await this.sendRequest(connection, {
        jsonrpc: '2.0',
        id: ++connection.requestId,
        method: 'tools/list',
        params: {}
      })

      if (toolsResult && toolsResult.result) {
        connection.tools = toolsResult.result.tools || []
      }

      this.connections.set(serverName, connection)
      console.log(`✓ Connected to ${serverName} (${connection.tools.length} tools)`)
      return true
    } catch (error) {
      console.error(`✗ Failed to connect to ${serverName}: ${error}`)
      return false
    }
  }

  private async sendRequest(connection: MCPConnection, request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = connection.requestId

      connection.pendingRequests.set(id, { resolve, reject })

      // Set timeout
      const timeout = setTimeout(() => {
        connection.pendingRequests.delete(id)
        reject(new Error('Request timeout'))
      }, 30000)

      // Override resolve/reject to clear timeout
      const originalResolve = resolve
      const originalReject = reject

      resolve = (value: any) => {
        clearTimeout(timeout)
        originalResolve(value)
      }

      reject = (error: any) => {
        clearTimeout(timeout)
        originalReject(error)
      }

      connection.pendingRequests.set(id, { resolve, reject })

      // Send request
      const requestStr = JSON.stringify(request) + '\n'
      if (connection.process.stdin) {
        connection.process.stdin.write(requestStr)
      }
    })
  }

  private handleResponse(connection: MCPConnection, text: string): void {
    try {
      const lines = text.split('\n').filter(line => line.trim().length > 0)

      for (const line of lines) {
        const response = JSON.parse(line)

        if (response.id && connection.pendingRequests.has(response.id)) {
          const { resolve } = connection.pendingRequests.get(response.id)!
          connection.pendingRequests.delete(response.id)
          resolve(response)
        }
      }
    } catch (error) {
      console.error('Failed to parse MCP response:', error)
    }
  }

  async callTool(serverName: string, toolName: string, args: any = {}): Promise<MCPCallResult> {
    const startTime = Date.now()

    const connection = this.connections.get(serverName)
    if (!connection) {
      const connected = await this.connect(serverName)
      if (!connected) {
        return {
          server: serverName,
          tool: toolName,
          success: false,
          error: 'Not connected',
          responseTime: Date.now() - startTime
        }
      }
    }

    const conn = this.connections.get(serverName)!

    try {
      const response = await this.sendRequest(conn, {
        jsonrpc: '2.0',
        id: ++conn.requestId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })

      const responseTime = Date.now() - startTime

      if (response.error) {
        return {
          server: serverName,
          tool: toolName,
          success: false,
          error: response.error.message,
          responseTime
        }
      }

      // Parse result content
      let parsedResult: any = null
      if (response.result && response.result.content) {
        const content = response.result.content[0]
        if (content.type === 'text') {
          try {
            parsedResult = JSON.parse(content.text)
          } catch {
            parsedResult = { text: content.text }
          }
        }
      }

      return {
        server: serverName,
        tool: toolName,
        success: true,
        result: parsedResult,
        responseTime
      }
    } catch (error: any) {
      return {
        server: serverName,
        tool: toolName,
        success: false,
        error: String(error?.message || error),
        responseTime: Date.now() - startTime
      }
    }
  }

  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName)
    if (connection && connection.process) {
      try {
        connection.process.kill()
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.connections.delete(serverName)
  }

  async disconnectAll(): Promise<void> {
    for (const [name] of this.connections) {
      await this.disconnect(name)
    }
  }

  getConnectedServers(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.process !== null)
      .map(([name, _]) => name)
  }
}

export { MCPClientManager, MCPConnection, MCPCallResult }
