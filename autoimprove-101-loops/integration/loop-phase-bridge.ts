#!/usr/bin/env bun
/**
 * Loop-Phase Bridge - Bidirectional Integration Between 101 Loops and 7-Phase Algorithm
 *
 * PURPOSE:
 * Bridges the 101 self-improvement loops with the FR3K 7-phase algorithm.
 * Enables:
 * - LEARN phase to trigger 101 loops for self-improvement
 * - 101 loops to inform OBSERVE phase with context
 * - Bidirectional communication between loops and algorithm
 * - Persistent storage of loop results in hey-fr3k
 *
 * INTEGRATION POINTS:
 * - LEARN phase → Store learnings → Trigger self-evolve loops
 * - 101 loops → Store improvements → OBSERVE phase retrieves context
 * - hey-fr3k → Semantic memory for both systems
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Paths
const LOOPS_DIR = join(homedir(), '.opencode', 'fr3k', 'autoimprove-101-loops');
const RUNTIME_DIR = join(LOOPS_DIR, 'runtime');
const INTEGRATION_STATE = join(RUNTIME_DIR, 'integration-state.json');

interface IntegrationState {
  lastLoopExecution: number;
  lastImprovementStored: number;
  pendingImprovements: Improvement[];
  phaseHistory: PhaseRecord[];
}

interface Improvement {
  id: string;
  loopName: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: number;
  applied: boolean;
}

interface PhaseRecord {
  phase: number;
  phaseName: string;
  timestamp: number;
  loopsTriggered: string[];
}

// MCP tool wrappers
interface MCPCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Call hey-fr3k MCP server via stdio
 */
async function callHeyFr3k(tool: string, params: any): Promise<MCPCallResult> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['-y', 'hey-fr3k'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const input = JSON.stringify({
      tool_name: tool,
      tool_input: params,
      session_id: `loop-phase-bridge-${Date.now()}`,
    });

    proc.stdin.write(input);
    proc.stdin.end();

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('exit', (code) => {
      if (code === 0 && stdout) {
        try {
          const data = JSON.parse(stdout);
          resolve({ success: true, data });
        } catch {
          resolve({ success: true, data: stdout });
        }
      } else {
        resolve({ success: false, error: stderr || `Exit code: ${code}` });
      }
    });

    proc.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

/**
 * Load integration state
 */
function loadState(): IntegrationState {
  if (existsSync(INTEGRATION_STATE)) {
    try {
      const data = readFileSync(INTEGRATION_STATE, 'utf-8');
      return JSON.parse(data);
    } catch {
      // Invalid state, return default
    }
  }

  return {
    lastLoopExecution: 0,
    lastImprovementStored: 0,
    pendingImprovements: [],
    phaseHistory: [],
  };
}

/**
 * Save integration state
 */
function saveState(state: IntegrationState): void {
  if (!existsSync(RUNTIME_DIR)) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  writeFileSync(INTEGRATION_STATE, JSON.stringify(state, null, 2));
}

/**
 * LEARN PHASE: Store learnings and trigger self-improvement loops
 *
 * Called from 7-phase algorithm LEARN phase
 */
export async function onLearnPhase(learnings: {
  keyInsights: string[];
  patterns: string[];
  improvements: string[];
}): Promise<void> {
  console.log('📚 LEARN PHASE: Storing learnings and triggering loops...\n');

  const state = loadState();

  // Store key insights in hey-fr3k
  for (const insight of learnings.keyInsights) {
    await callHeyFr3k('store_fr3k', {
      content: insight,
      memory_type: 'solution',
      project_scope: 'fr3k-algorithm',
      expires_days: 180,
    });
    console.log(`✓ Stored insight: ${insight.substring(0, 50)}...`);
  }

  // Store patterns
  for (const pattern of learnings.patterns) {
    await callHeyFr3k('store_fr3k', {
      content: pattern,
      memory_type: 'pattern',
      project_scope: 'fr3k-algorithm',
      expires_days: 365,
    });
    console.log(`✓ Stored pattern: ${pattern.substring(0, 50)}...`);
  }

  // Trigger self-evolve for improvements
  for (const improvement of learnings.improvements) {
    await callHeyFr3k('store_fr3k', {
      content: `Improvement opportunity: ${improvement}`,
      memory_type: 'decision',
      project_scope: 'fr3k-self-improvement',
      expires_days: 90,
    });

    // Store as pending improvement for loops to process
    state.pendingImprovements.push({
      id: crypto.randomUUID(),
      loopName: 'learn-phase',
      description: improvement,
      impact: 'medium',
      timestamp: Date.now(),
      applied: false,
    });
  }

  // Record phase history
  state.phaseHistory.push({
    phase: 7,
    phaseName: 'LEARN',
    timestamp: Date.now(),
    loopsTriggered: learnings.improvements.map(() => 'self-evolve'),
  });

  saveState(state);
  console.log(`\n✓ Stored ${learnings.keyInsights.length} insights, ${learnings.patterns.length} patterns`);
  console.log(`✓ Triggered ${learnings.improvements.length} self-improvement opportunities`);
}

/**
 * OBSERVE PHASE: Retrieve context from 101 loops
 *
 * Called from 7-phase algorithm OBSERVE phase
 */
export async function onObservePhase(): Promise<{
  recentImprovements: Improvement[];
  pendingActions: string[];
  systemLearnings: string[];
}> {
  console.log('👁️ OBSERVE PHASE: Retrieving context from 101 loops...\n');

  const state = loadState();

  // Get recent improvements from loops
  const recentImprovements = state.pendingImprovements.slice(0, 10);

  // Get recent learnings from hey-fr3k
  const recentLearningsResult = await callHeyFr3k('recent_fr3k', { limit: 10 });
  const systemLearnings = recentLearningsResult.success && recentLearningsResult.data
    ? (recentLearningsResult.data as any[]).map((item: any) => item.content || item)
    : [];

  // Build pending actions
  const pendingActions = state.pendingImprovements
    .filter(i => !i.applied)
    .map(i => `[${i.impact}] ${i.description}`);

  console.log(`✓ Found ${recentImprovements.length} recent improvements`);
  console.log(`✓ Found ${systemLearnings.length} system learnings`);
  console.log(`✓ Found ${pendingActions.length} pending actions`);

  return {
    recentImprovements,
    pendingActions,
    systemLearnings,
  };
}

/**
 * LOOP EXECUTION: Called when 101 loop completes
 *
 * Stores loop results in hey-fr3k for retrieval in OBSERVE phase
 */
export async function onLoopComplete(loopName: string, result: {
  success: boolean;
  improvements?: string[];
  errors?: string[];
}): Promise<void> {
  console.log(`🔄 LOOP COMPLETE: ${loopName}\n`);

  const state = loadState();
  state.lastLoopExecution = Date.now();

  if (result.success && result.improvements) {
    // Store improvements in hey-fr3k
    for (const improvement of result.improvements) {
      await callHeyFr3k('store_fr3k', {
        content: `Loop ${loopName} improvement: ${improvement}`,
        memory_type: 'solution',
        project_scope: 'fr3k-loops',
        expires_days: 90,
      });
    }

    console.log(`✓ Stored ${result.improvements.length} improvements from ${loopName}`);

    // Update pending improvements
    for (const improvement of result.improvements) {
      state.pendingImprovements.push({
        id: crypto.randomUUID(),
        loopName,
        description: improvement,
        impact: 'medium',
        timestamp: Date.now(),
        applied: false,
      });
    }
  }

  if (result.errors && result.errors.length > 0) {
    // Store errors for review
    for (const error of result.errors) {
      await callHeyFr3k('store_fr3k', {
        content: `Loop ${loopName} error: ${error}`,
        memory_type: 'error',
        project_scope: 'fr3k-loops',
        expires_days: 30,
      });
    }
  }

  saveState(state);
}

/**
 * Get integration status
 */
export async function getIntegrationStatus(): Promise<{
  lastLoopExecution: number;
  lastImprovementStored: number;
  pendingImprovements: number;
  phaseHistoryCount: number;
}> {
  const state = loadState();
  return {
    lastLoopExecution: state.lastLoopExecution,
    lastImprovementStored: state.lastImprovementStored,
    pendingImprovements: state.pendingImprovements.filter(i => !i.applied).length,
    phaseHistoryCount: state.phaseHistory.length,
  };
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args[0] === 'learn') {
    // Simulate LEARN phase call
    await onLearnPhase({
      keyInsights: ['Test insight from CLI'],
      patterns: ['Test pattern from CLI'],
      improvements: ['Test improvement from CLI'],
    });
  } else if (args[0] === 'observe') {
    // Simulate OBSERVE phase call
    const context = await onObservePhase();
    console.log('\nContext retrieved:', JSON.stringify(context, null, 2));
  } else if (args[0] === 'status') {
    // Get integration status
    const status = await getIntegrationStatus();
    console.log('\nIntegration Status:', JSON.stringify(status, null, 2));
  } else {
    console.log('Usage:');
    console.log('  bun loop-phase-bridge.ts learn    - Test LEARN phase integration');
    console.log('  bun loop-phase-bridge.ts observe  - Test OBSERVE phase integration');
    console.log('  bun loop-phase-bridge.ts status   - Get integration status');
  }
}
