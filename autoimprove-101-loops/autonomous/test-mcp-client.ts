#!/usr/bin/env bun
/**
 * Direct test of MCP Client - verifies real connections
 */

import { MCPClientManager } from './mcp-client.js'

async function testMCPClient() {
  console.log('🧪 Testing REAL MCP Client\n')

  const manager = new MCPClientManager()

  console.log('--- Testing hey-fr3k connection ---')
  const heyfr3kConnected = await manager.connect('hey-fr3k')
  console.log(`Connected: ${heyfr3kConnected}`)

  if (heyfr3kConnected) {
    console.log('\n--- Calling hey-fr3k recent_fr3k ---')
    const recent = await manager.callTool('hey-fr3k', 'recent_fr3k', { limit: 5 })
    console.log(`Success: ${recent.success}`)
    console.log(`Response time: ${recent.responseTime}ms`)
    console.log(`Result: ${JSON.stringify(recent.result, null, 2).substring(0, 200)}...`)
    if (recent.error) console.log(`Error: ${recent.error}`)
  }

  console.log('\n--- Testing fr3k-think connection ---')
  const thinkConnected = await manager.connect('fr3k-think')
  console.log(`Connected: ${thinkConnected}`)

  if (thinkConnected) {
    console.log('\n--- Calling fr3k-think think ---')
    const think = await manager.callTool('fr3k-think', 'think', {
      thought: 'Test MCP connection',
      thoughtNumber: 1,
      totalThoughts: 1
    })
    console.log(`Success: ${think.success}`)
    console.log(`Response time: ${think.responseTime}ms`)
    console.log(`Result: ${JSON.stringify(think.result, null, 2).substring(0, 200)}...`)
    if (think.error) console.log(`Error: ${think.error}`)
  }

  console.log('\n--- Testing unified-pantheon-mcp connection ---')
  const pantheonConnected = await manager.connect('unified-pantheon-mcp')
  console.log(`Connected: ${pantheonConnected}`)

  if (pantheonConnected) {
    console.log('\n--- Calling unified-pantheon-mcp analyze_with_demon_angel ---')
    const tas = await manager.callTool('unified-pantheon-mcp', 'analyze_with_demon_angel', {
      action: 'Test connection',
      demonScore: 30,
      angelScore: 70
    })
    console.log(`Success: ${tas.success}`)
    console.log(`Response time: ${tas.responseTime}ms`)
    console.log(`Result: ${JSON.stringify(tas.result, null, 2).substring(0, 200)}...`)
    if (tas.error) console.log(`Error: ${tas.error}`)
  }

  await manager.disconnectAll()
  console.log('\n✓ Test complete')
}

testMCPClient().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
