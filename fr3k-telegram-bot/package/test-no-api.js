#!/usr/bin/env node

/**
 * Test script for fr3k-behemoth v3.5.0 no-API simulation mode
 */

import { spawn } from 'child_process';

console.log('🧪 Testing fr3k-behemoth v3.5.0 simulation mode...\n');

// Test 1: Check if server starts in simulation mode
console.log('Test 1: Starting server in simulation mode...');
const server = spawn('node', ['index-no-api.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, LOG_LEVEL: 'info' }
});

let serverOutput = '';
let serverErrors = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  serverErrors += data.toString();
});

setTimeout(() => {
  console.log('Server output:', serverOutput);
  console.log('Server errors:', serverErrors);

  // Test 2: Check if simulation warnings are shown
  if (serverOutput.includes('SIMULATION MODE') || serverErrors.includes('SIMULATION MODE')) {
    console.log('✅ Test 1 PASSED: Simulation mode detected');
  } else {
    console.log('❌ Test 1 FAILED: No simulation mode warning');
  }

  server.kill();
}, 2000);