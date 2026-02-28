#!/usr/bin/env node

/**
 * Test all the tools mentioned by the user
 */

import { spawn } from 'child_process';

const tools = [
  { name: 'strategy', args: { type: 'scalping', params: { symbol: 'BTCUSDT' } } },
  { name: 'ai', args: { operation: 'predict', model: 'lstm', data: { prices: [50000, 50100, 50200] } } },
  { name: 'system', args: { operation: 'monitor' } },
  { name: 'fr3k', args: { operation: 'status' } },
  { name: 'alert', args: { type: 'price', condition: 'BTCUSDT > 60000', action: 'notify' } },
  { name: 'arbitrage', args: { mode: 'cross-exchange', minProfit: 0.1 } },
  { name: 'backtest', args: { strategy: 'scalping', period: '1m' } },
  { name: 'liquidity', args: { operation: 'analyze', pool: 'ETH-USDC' } },
  { name: 'defi', args: { protocol: 'uniswap', operation: 'tvl' } },
  { name: 'realtime', args: { operation: 'price', symbol: 'BTCUSDT' } },
  { name: 'market', args: { operation: 'structure', symbol: 'BTCUSDT' } },
  { name: 'onchain', args: { metric: 'whale', chain: 'eth' } }
];

async function testTool(tool) {
  return new Promise((resolve) => {
    console.log(`\n🔧 Testing ${tool.name}...`);
    const server = spawn('/usr/bin/node', ['index-no-api.js', '--test'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let output = '';
    let errors = '';
    let serverStarted = false;

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errors += data.toString();
      console.log(`  STDERR: ${data.toString().trim()}`);
      if (data.toString().includes('Connected to transport successfully')) {
        serverStarted = true;
      }
    });

    server.on('error', (err) => {
      console.log(`  SERVER ERROR: ${err.message}`);
      resolve(false);
    });

    // Wait for server to fully start
    const checkStarted = setInterval(() => {
      if (serverStarted) {
        clearInterval(checkStarted);
        console.log(`  Server started, sending request for ${tool.name}...`);

        // Send the tool call
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: tool.args
          }
        };

        server.stdin.write(JSON.stringify(request) + '\n');

        // Wait for response
        setTimeout(() => {
          const hasResponse = output.includes('"result"') || output.includes('"content"');
          console.log(`${tool.name}: ${hasResponse ? '✅ WORKS' : '❌ NO RESPONSE'}`);
          if (!hasResponse) {
            console.log(`  Final output length: ${output.length}`);
            console.log(`  Final errors length: ${errors.length}`);
          }
          server.kill();
          resolve(hasResponse);
        }, 1000);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!serverStarted) {
        clearInterval(checkStarted);
        console.log(`${tool.name}: ❌ SERVER FAILED TO START`);
        server.kill();
        resolve(false);
      }
    }, 5000);
  });
}

async function testAllTools() {
  console.log('🧪 Testing all BEHEMOTH tools...\n');

  for (const tool of tools) {
    await testTool(tool);
  }

  console.log('\n✅ Testing complete!');
}

testAllTools().catch(console.error);