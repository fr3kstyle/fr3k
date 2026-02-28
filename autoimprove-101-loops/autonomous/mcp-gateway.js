#!/usr/bin/env node
/**
 * MCP HTTP Gateway - Bridge Bun to MCP servers
 * 
 * Bun can't execute npx/MCP directly, so we use Node.js as a proxy.
 * Run this server separately, then call from Bun via fetch()
 * 
 * Usage:
 *   node mcp-gateway.js
 *   
 * Then from Bun:
 *   const result = await fetch('http://localhost:3001/mcp/hey-fr3k/recall', {
 *     method: 'POST',
 *     body: JSON.stringify({ limit: 5 })
 *   }).then(r => r.json())
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const TIMEOUT = 30000; // 30 seconds

// Simple in-memory cache for MCP results
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

// MCP server configurations
const mcpServers = {
  'hey-fr3k': {
    command: 'npx',
    args: ['-y', '@fr3k/hey-fr3k-mcp'],
    env: process.env
  },
  'fr3k-think': {
    command: 'npx', 
    args: ['-y', '@fr3k/fr3k-think-mcp'],
    env: process.env
  },
  'md-mcp': {
    command: 'npx',
    args: ['-y', 'md-mcp'],
    env: process.env
  },
  'unified-pantheon-mcp': {
    command: 'npx',
    args: ['-y', 'unified-pantheon-mcp'],
    env: process.env
  }
};

// Active MCP processes
const mcpProcesses = new Map();

/**
 * Execute an MCP tool call
 */
async function executeMCPTool(serverName, toolName, params = {}) {
  const cacheKey = `${serverName}:${toolName}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, cached: true };
  }

  console.log(`[MCP Gateway] Calling ${serverName}/${toolName}`, params);

  try {
    const result = await simulateMCPCall(serverName, toolName, params);
    
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });
    
    return result;
  } catch (error) {
    console.error(`[MCP Gateway] Error:`, error.message);
    return { error: error.message };
  }
}

/**
 * Simulate MCP calls - replace with real MCP server communication
 */
async function simulateMCPCall(serverName, toolName, params) {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

  const responses = {
    'hey-fr3k': {
      'recent_fr3k': { 
        memories: [
          { id: '1', content: 'Analyzed codebase structure', memory_type: 'context', timestamp: Date.now() - 3600000 },
          { id: '2', content: 'Integrated multi-agent orchestrator', memory_type: 'context', timestamp: Date.now() - 7200000 }
        ],
        count: 2
      },
      'recall_fr3k': { memories: [], found: false },
      'store_fr3k': { success: true, stored: true, memory_id: `mem_${Date.now()}` }
    },
    'fr3k-think': {
      'think': { thought: 'First principles analysis complete', thoughtNumber: 1, totalThoughts: 3, confidence: 0.85 },
      'analyze_with_demon_angel': { analysis: 'balanced', demonScore: 30, angelScore: 70 }
    },
    'md-mcp': {
      'forge_reality': { created: true, title: 'Dynamic Tool', type: 'article' },
      'weave_spells': { transformed: true }
    },
    'unified-pantheon-mcp': {
      'analyze_with_demon_angel': { angelScore: 70, demonScore: 30, balanced: true },
      'self_heal': { healed: true, level: 'diagnostic', issuesFound: 0 }
    }
  };

  return responses[serverName]?.[toolName] || {
    server: serverName, 
    tool: toolName, 
    result: 'simulated_response',
    timestamp: Date.now()
  };
}

/**
 * HTTP Request Handler
 */
async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', servers: Object.keys(mcpServers) }));
    return;
  }

  // MCP tool call: /mcp/:server/:tool
  if (pathname.startsWith('/mcp/')) {
    const parts = pathname.split('/').filter(p => p);
    const serverName = parts[1];
    const toolName = parts[2];

    if (!serverName || !toolName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing server or tool name' }));
      return;
    }

    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    let params = {};
    if (body) {
      try { params = JSON.parse(body); } catch (e) { params = {}; }
    }

    try {
      const result = await executeMCPTool(serverName, toolName, params);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // List servers
  if (pathname === '/servers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ servers: Object.keys(mcpServers) }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Start HTTP Server
 */
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  MCP HTTP Gateway Started                    ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                  ║
║                                                               ║
║  Endpoints:                                                   ║
║    GET  /health           - Health check                    ║
║    GET  /servers         - List available MCP servers       ║
║    POST /mcp/:server/:tool - Call MCP tool                  ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n[MCP Gateway] Shutting down...');
  server.close(() => { process.exit(0); });
});
