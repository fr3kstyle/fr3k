#!/usr/bin/env node

/**
 * Test script for fr3k-behemoth v3.6.0 interactive vs MCP behavior
 */

import { spawn } from 'child_process';

console.log('🧪 Testing fr3k-behemoth v3.6.0 interactive behavior...\n');

// Test 1: Check if splash screen shows in interactive mode
console.log('Test 1: Starting server interactively (should show splash screen)...');
const server = spawn('node', ['index-no-api.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, LOG_LEVEL: 'info' }
});

let output = '';
let errors = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errors += data.toString();
});

setTimeout(() => {
  console.log('Output received:', output.length, 'characters');
  console.log('Errors received:', errors.length, 'characters');

  // Check if splash screen was shown
  if (output.includes('COSMIC CRYPTO TRADING INTELLIGENCE') || errors.includes('COSMIC CRYPTO TRADING INTELLIGENCE')) {
    console.log('✅ Test 1 PASSED: Splash screen shown in interactive mode');
  } else {
    console.log('❌ Test 1 FAILED: No splash screen in interactive mode');
  }

  // Check if simulation mode warnings are shown
  if (errors.includes('SIMULATION MODE') || output.includes('SIMULATION MODE')) {
    console.log('✅ Test 2 PASSED: Simulation mode warnings shown');
  } else {
    console.log('❌ Test 2 FAILED: No simulation mode warnings');
  }

  server.kill();
}, 3000);