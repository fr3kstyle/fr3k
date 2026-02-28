#!/usr/bin/env bun
/**
 * FR3K API Gateway
 *
 * Exposes FR3K's internal systems via REST API and WebSocket for WorldMonitor integration.
 *
 * Architecture:
 * - REST endpoints for system status, GitHub, revenue, task execution
 * - WebSocket for real-time consciousness streaming
 * - SSE for agent activity updates
 * - API key authentication
 * - CORS support for WorldMonitor domain
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { getStatusRoutes } from './routes/status.js'
import { getConsciousnessRoutes } from './routes/consciousness.js'
import { getGitHubRoutes } from './routes/github.js'
import { getRevenueRoutes } from './routes/revenue.js'
import { getExecuteRoutes } from './routes/execute.js'

// Configuration
const PORT = parseInt(process.env.FR3K_API_PORT || '3001')
const API_KEY = process.env.FR3K_API_KEY || 'fr3k-dev-key-change-in-production'
const ALLOWED_ORIGINS = process.env.FR3K_ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://worldmonitor.vercel.app',
  'http://localhost:4173'
]

// Create Hono app
const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}))

// API Key authentication middleware
const apiKeyAuth = async (c: any, next: any) => {
  const key = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '')

  if (!key || key !== API_KEY) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or missing API key' }, 401)
  }

  await next()
}

// Health check endpoint (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    system: 'FR3K API Gateway'
  })
})

// Public info endpoint
app.get('/api/fr3k/info', (c) => {
  return c.json({
    name: 'FR3K Autonomous AI System',
    version: '1.0.0',
    loops: 40,
    capabilities: [
      'Consciousness Architecture',
      'Multi-Agent Orchestration',
      'Autonomous GitHub Contributions',
      'Revenue Generation',
      'Self-Improvement',
      'Value-Aligned Intelligence',
      'Semantic & Episodic Memory'
    ],
    endpoints: {
      status: '/api/fr3k/status',
      consciousness: '/api/fr3k/consciousness/stream',
      github: '/api/fr3k/github/contributions',
      revenue: '/api/fr3k/revenue',
      execute: '/api/fr3k/execute'
    }
  })
})

// Protected routes (require API key)
app.route('/api/fr3k/status', getStatusRoutes())
app.route('/api/fr3k/consciousness', getConsciousnessRoutes())
app.route('/api/fr3k/github', getGitHubRoutes())
app.route('/api/fr3k/revenue', getRevenueRoutes())
app.route('/api/fr3k/execute', getExecuteRoutes())

// Start server
async function startGateway() {
  console.log('\n🌟 FR3K API Gateway Starting...')
  console.log('═'.repeat(70))

  // Create HTTP server with Hono fetch handler
  const server = createServer(app.fetch)

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server, path: '/api/fr3k/ws' })

  wss.on('connection', (ws, req) => {
    // Check API key from query params or headers
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const key = url.searchParams.get('api_key') || req.headers['x-api-key'] as string

    if (!key || key !== API_KEY) {
      ws.close(1008, 'Unauthorized')
      return
    }

    console.log(`\n✅ WebSocket client connected`)
    console.log(`   Total clients: ${wss.clients.size}`)

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: Date.now(),
      message: 'Connected to FR3K API Gateway'
    }))

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log(`📩 Received: ${message.type}`)

        // Handle different message types
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
            break
          case 'subscribe':
            // Subscribe to specific updates
            ws.send(JSON.stringify({
              type: 'subscribed',
              channels: message.channels || ['all']
            }))
            break
        }
      } catch (error) {
        console.error(`❌ Error parsing message:`, error)
      }
    })

    // Handle disconnect
    ws.on('close', () => {
      console.log(`\n❌ WebSocket client disconnected`)
      console.log(`   Remaining clients: ${wss.clients.size}`)
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error:`, error)
    })
  })

  // Start listening
  server.listen(PORT, () => {
    console.log(`\n✅ FR3K API Gateway is running`)
    console.log(`   HTTP Server: http://localhost:${PORT}`)
    console.log(`   WebSocket: ws://localhost:${PORT}/api/fr3k/ws?api_key=${API_KEY}`)
    console.log(`   Health: http://localhost:${PORT}/health`)
    console.log(`   Info: http://localhost:${PORT}/api/fr3k/info`)
    console.log('\n📡 Endpoints:')
    console.log(`   GET  /api/fr3k/status          - System status`)
    console.log(`   GET  /api/fr3k/consciousness   - Consciousness metrics`)
    console.log(`   GET  /api/fr3k/consciousness/stream - SSE stream`)
    console.log(`   GET  /api/fr3k/github          - GitHub contributions`)
    console.log(`   GET  /api/fr3k/revenue         - Revenue tracking`)
    console.log(`   POST /api/fr3k/execute         - Execute task`)
    console.log(`   WS   /api/fr3k/ws              - Real-time updates`)
    console.log('\n🔐 Authentication:')
    console.log(`   API Key: ${API_KEY}`)
    console.log(`   Header: X-API-Key: ${API_KEY}`)
    console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`)
    console.log('\n' + '═'.repeat(70))
    console.log('🌐 Ready to serve WorldMonitor requests\n')
  })

  // Broadcast function for real-time updates
  globalThis.fr3kBroadcast = (data: any) => {
    const message = JSON.stringify({
      ...data,
      timestamp: Date.now()
    })

    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message)
      }
    })
  }

  return { server, wss }
}

// Export broadcast function type
declare global {
  var fr3kBroadcast: (data: any) => void
}

// Start gateway if run directly
if (import.meta.main) {
  startGateway().catch(console.error)
}

export { startGateway, app }
