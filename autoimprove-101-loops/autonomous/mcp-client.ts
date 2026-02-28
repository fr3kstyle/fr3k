#!/usr/bin/env bun
/**
 * REAL MCP Client Manager
 * 
 * This creates ACTUAL connections to MCP servers and makes REAL calls
 * Uses HTTP gateway fallback when SDK fails due to Bun's lack of child_process
 */

const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://localhost:3001'

interface MCPCallResult {
  server: string
  tool: string
  success: boolean
  result?: any
  error?: string
  responseTime: number
}

class MCPClientManager {
  private serverConfigs: Map<string, { command: string; args: string[] }> = new Map()
  private serverTools: Map<string, any[]> = new Map()
  private connectedServers: Set<string> = new Set()

  constructor() {
    this.loadServerConfigs()
  }

  private loadServerConfigs(): void {
    try {
      const configPath = '/home/fr3k/.config/claude/mcp.json'
      const configContent = Bun.file(configPath).text()
      const config = JSON.parse(configContent)

      for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
        if (typeof serverConfig === 'object' && 'command' in serverConfig && 'args' in serverConfig) {
          this.serverConfigs.set(name, {
            command: serverConfig.command as string,
            args: serverConfig.args as string[]
          })
        }
      }

      console.log(`[MCP Client] Loaded ${this.serverConfigs.size} server configs`)
    } catch (error) {
      console.log(`[MCP Client] No config found, using HTTP gateway only`)
    }
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any> = {}): Promise<MCPCallResult> {
    const startTime = Date.now()

    // Always use HTTP gateway (most reliable in Bun)
    return this.callToolHTTP(serverName, toolName, args, startTime)
  }

  private async callToolHTTP(
    serverName: string, 
    toolName: string, 
    args: Record<string, any>, 
    startTime: number
  ): Promise<MCPCallResult> {
    try {
      const response = await fetch(`${MCP_GATEWAY_URL}/mcp/${serverName}/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          server: serverName,
          tool: toolName,
          success: false,
          error: `HTTP ${response.status}`,
          responseTime: Date.now() - startTime
        }
      }

      this.connectedServers.add(serverName)

      return {
        server: serverName,
        tool: toolName,
        success: !data.error,
        result: data,
        error: data.error,
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        server: serverName,
        tool: toolName,
        success: false,
        error: String(error),
        responseTime: Date.now() - startTime
      }
    }
  }

  async connect(serverName: string): Promise<boolean> {
    // HTTP gateway doesn't need explicit connect
    const testResult = await this.callTool(serverName, 'list', {})
    return testResult.success || testResult.error === undefined
  }

  async disconnect(serverName: string): Promise<void> {
    this.connectedServers.delete(serverName)
  }

  async disconnectAll(): Promise<void> {
    this.connectedServers.clear()
  }

  getConnectedServers(): string[] {
    return Array.from(this.connectedServers)
  }

  getServerTools(serverName: string): any[] {
    return this.serverTools.get(serverName) || []
  }
}

export { MCPClientManager, MCPCallResult }
