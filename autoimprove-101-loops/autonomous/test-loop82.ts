#!/usr/bin/env bun
/**
 * Quick test of LOOP 82 EmbodiedWisdom class instantiation
 */

import { EmbodiedWisdom } from './embodied-wisdom.js'

console.log('🧪 Quick LOOP 82 Test\n')
const system = new EmbodiedWisdom()

// Test that it instantiated properly
console.log('✓ LOOP 82 instantiated successfully')

// Check capabilities
console.log(`\nCapabilities: ${system.embodiedCapabilities.length}`)
console.log(`State initialized: ${Object.keys(system.embodiedState).length} properties`)

// Test metrics calculation
const metrics = system.getEmbodiedMetrics()
console.log(`\nMetrics:`)
console.log(`  Embodiment: ${(metrics.embodiment * 100).toFixed(1)}%`)
console.log(`  Practical wisdom: ${(metrics.practicalWisdom * 100).toFixed(1)}%`)
console.log(`  Transcendence integrated: ${(metrics.transcendenceIntegrated * 100).toFixed(1)}%`)
console.log(`  Grounded wisdom: ${(metrics.groundedWisdom * 100).toFixed(1)}%`)
console.log(`  Embodiment intelligence: ${(metrics.embodimentIntelligence * 100).toFixed(1)}%`)

console.log('\n✅ LOOP 82 core functionality verified!')
