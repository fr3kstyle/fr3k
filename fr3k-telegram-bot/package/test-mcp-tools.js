#!/usr/bin/env node

/**
 * Test script to call BEHEMOTH MCP tools directly
 */

import { spawn } from 'child_process';

console.log('🧪 Testing BEHEMOTH MCP tools...\n');

// Start the MCP server
const server = spawn('node', ['index-no-api.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errors = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errors += data.toString();
});

// Wait for server to start
setTimeout(() => {
  console.log('Server started, initializing MCP...');

  // First send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for initialize response, then test tools
  setTimeout(() => {
    console.log('Testing strategy tool...');

    // Test strategy tool
    const strategyRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'strategy',
        arguments: {
          type: 'scalping',
          params: { symbol: 'BTCUSDT' }
        }
      }
    };

    server.stdin.write(JSON.stringify(strategyRequest) + '\n');

    // Wait for response
    setTimeout(() => {
      console.log('Strategy tool response:');
      console.log('Output:', output);
      console.log('Errors:', errors);

      server.kill();
    }, 1000);
  }, 1000);
}, 2000);