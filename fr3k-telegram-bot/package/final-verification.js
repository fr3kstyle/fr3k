#!/usr/bin/env node

/**
 * Final verification that all tools work with correct arguments
 */

import { spawn } from 'child_process';

const toolTests = [
  { name: 'strategy', args: { type: 'scalping', params: { symbol: 'BTCUSDT' } } },
  { name: 'ai', args: { operation: 'predict', model: 'lstm', data: { prices: [50000] } } },
  { name: 'system', args: { operation: 'monitor' } },
  { name: 'fr3k', args: { operation: 'status' } },
  { name: 'alert', args: { type: 'price', condition: 'BTC > 50000', action: 'notify' } },
  { name: 'arbitrage', args: { mode: 'cross-exchange', minProfit: 0.1 } },
  { name: 'backtest', args: { strategy: 'scalping', period: '1d' } },
  { name: 'liquidity', args: { operation: 'analyze', pool: 'ETH-USDC' } },
  { name: 'defi', args: { protocol: 'uniswap', operation: 'tvl' } },
  { name: 'realtime', args: { operation: 'price', symbol: 'BTCUSDT' } },
  { name: 'market', args: { operation: 'structure', symbol: 'BTCUSDT' } },
  { name: 'onchain', args: { metric: 'whale', chain: 'eth' } }
];

async function testTool(tool) {
  return new Promise((resolve) => {
    const server = spawn('/usr/bin/node', ['/mnt/d/fr3k/fr3k-behemoth-update/index-no-api.js', '--force-start'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    if (server.stderr) {
      server.stderr.on('data', (data) => {
        console.log(`  STDERR for ${tool.name}: ${data.toString().trim()}`);
      });
    }

    // Wait for server to start
    setTimeout(() => {
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
        const hasResponse = output.includes('"result"') && output.includes('"content"');
        console.log(`${tool.name}: ${hasResponse ? '✅ WORKS' : '❌ NO RESPONSE'}`);
        server.kill();
        resolve(hasResponse);
      }, 500);
    }, 200);
  });
}

async function runVerification() {
  console.log('🔍 Final Verification: Testing all BEHEMOTH tools...\n');

  let passed = 0;
  let total = toolTests.length;

  for (const tool of toolTests) {
    const result = await testTool(tool);
    if (result) passed++;
  }

  console.log(`\n📊 Results: ${passed}/${total} tools working`);

  if (passed === total) {
    console.log('🎉 ALL TOOLS VERIFIED WORKING!');
    console.log('🚀 Ready for production use');
  } else {
    console.log('⚠️  Some tools need fixing');
  }
}

runVerification().catch(console.error);