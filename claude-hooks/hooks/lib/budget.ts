/**
 * Token Budget Tracking Library
 *
 * Tracks token usage across all operations, calculates costs by model,
 * alerts at thresholds, and recommends optimal model selection based on
 * task complexity and remaining budget.
 *
 * MODEL PRICING (per 1M tokens, input/output):
 * - Haiku:   $0.25 / $1.25    (Fastest, cheapest, good for simple tasks)
 * - Sonnet:  $3.00 / $15.00   (Balanced, best for most work)
 * - Opus:    $15.00 / $75.00  (Most capable, expensive, complex tasks only)
 *
 * Usage:
 *   import { trackUsage, getBudgetStatus, recommendModel } from './lib/budget';
 *
 *   // Track usage after an operation
 *   trackUsage('sonnet-4-20250514', 1234, 567);
 *
 *   // Check if we should alert
 *   const status = getBudgetStatus();
 *   if (status.shouldAlert) {
 *     console.error(`⚠️  Budget ${status.percentageUsed}% used: $${status.totalCost}`);
 *   }
 *
 *   // Get model recommendation
 *   const model = recommendModel(taskComplexity, remainingTokens);
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './paths';

// Pricing per 1M tokens (as of 2025)
export const MODEL_PRICING = {
  'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25, tier: 'haiku' },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, tier: 'sonnet' },
  'claude-3-5-sonnet-20250214': { input: 3.00, output: 15.00, tier: 'sonnet' },
  'claude-opus-4-20250514': { input: 15.00, output: 75.00, tier: 'opus' },
  'claude-opus-4-6': { input: 15.00, output: 75.00, tier: 'opus' },
} as const;

export type ModelTier = 'haiku' | 'sonnet' | 'opus';
export type TaskComplexity = 'simple' | 'moderate' | 'complex';

// Budget configuration
const DEFAULT_DAILY_BUDGET = 50; // USD
const ALERT_THRESHOLD = 0.80;    // Alert at 80%
const CRITICAL_THRESHOLD = 0.95; // Critical at 95%

interface UsageRecord {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  sessionId: string;
}

interface BudgetState {
  dailyBudget: number;
  date: string;  // YYYY-MM-DD
  records: UsageRecord[];
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

const BUDGET_FILE = join(getPaiDir(), 'MEMORY', 'STATE', 'token-budget.json');

/**
 * Get today's date in YYYY-MM-DD format (using principal timezone if available)
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load budget state from disk
 */
function loadBudget(): BudgetState {
  if (!existsSync(BUDGET_FILE)) {
    return {
      dailyBudget: DEFAULT_DAILY_BUDGET,
      date: getTodayDate(),
      records: [],
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    };
  }

  try {
    const content = readFileSync(BUDGET_FILE, 'utf-8');
    const data = JSON.parse(content) as BudgetState;

    // Reset if it's a new day
    if (data.date !== getTodayDate()) {
      return {
        dailyBudget: data.dailyBudget || DEFAULT_DAILY_BUDGET,
        date: getTodayDate(),
        records: [],
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      };
    }

    return data;
  } catch {
    return {
      dailyBudget: DEFAULT_DAILY_BUDGET,
      date: getTodayDate(),
      records: [],
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    };
  }
}

/**
 * Save budget state to disk
 */
function saveBudget(state: BudgetState): void {
  const dir = join(getPaiDir(), 'MEMORY', 'STATE');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(BUDGET_FILE, JSON.stringify(state, null, 2));
}

/**
 * Calculate cost for a model given input/output tokens
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!pricing) {
    // Unknown model - estimate using Sonnet pricing
    return (inputTokens * 3.00 + outputTokens * 15.00) / 1_000_000;
  }

  const inputCost = (inputTokens * pricing.input) / 1_000_000;
  const outputCost = (outputTokens * pricing.output) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Get the pricing tier for a model
 */
export function getModelTier(model: string): ModelTier {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  return pricing?.tier || 'sonnet'; // Default to sonnet
}

/**
 * Track token usage for a model
 *
 * @param model - Model identifier (e.g., 'claude-3-5-sonnet-20241022')
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @param sessionId - Current session ID for tracking
 */
export function trackUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  sessionId?: string
): { cost: number; newTotal: number } {
  const state = loadBudget();

  const cost = calculateCost(model, inputTokens, outputTokens);

  const record: UsageRecord = {
    timestamp: new Date().toISOString(),
    model,
    inputTokens,
    outputTokens,
    cost,
    sessionId: sessionId || 'unknown',
  };

  state.records.push(record);
  state.totalCost += cost;
  state.totalInputTokens += inputTokens;
  state.totalOutputTokens += outputTokens;

  saveBudget(state);

  return { cost, newTotal: state.totalCost };
}

/**
 * Get current budget status
 *
 * @returns Status object with usage percentage and alert flags
 */
export interface BudgetStatus {
  percentageUsed: number;
  totalCost: number;
  dailyBudget: number;
  remainingBudget: number;
  shouldAlert: boolean;
  isCritical: boolean;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  recordCount: number;
}

export function getBudgetStatus(): BudgetStatus {
  const state = loadBudget();
  const percentageUsed = (state.totalCost / state.dailyBudget) * 100;

  return {
    percentageUsed: Math.round(percentageUsed * 100) / 100,
    totalCost: Math.round(state.totalCost * 1000) / 1000,
    dailyBudget: state.dailyBudget,
    remainingBudget: Math.max(0, state.dailyBudget - state.totalCost),
    shouldAlert: percentageUsed >= ALERT_THRESHOLD * 100,
    isCritical: percentageUsed >= CRITICAL_THRESHOLD * 100,
    totalInputTokens: state.totalInputTokens,
    totalOutputTokens: state.totalOutputTokens,
    totalTokens: state.totalInputTokens + state.totalOutputTokens,
    recordCount: state.records.length,
  };
}

/**
 * Recommend the best model for a given task
 *
 * @param complexity - Task complexity level
 * @param estimatedTokens - Estimated tokens needed (optional)
 * @returns Recommended model identifier
 */
export function recommendModel(
  complexity: TaskComplexity,
  estimatedTokens?: number
): string {
  const status = getBudgetStatus();

  // If budget is critical, always use Haiku
  if (status.isCritical) {
    return 'claude-3-5-haiku-20241022';
  }

  // If budget alert and task is simple, use Haiku
  if (status.shouldAlert && complexity === 'simple') {
    return 'claude-3-5-haiku-20241022';
  }

  // Task-based recommendations
  switch (complexity) {
    case 'simple':
      // Quick tasks: Haiku is fastest and cheapest
      return 'claude-3-5-haiku-20241022';

    case 'moderate':
      // Most tasks: Sonnet is the sweet spot
      return 'claude-3-5-sonnet-20241022';

    case 'complex':
      // Hard tasks: Use Opus if budget allows
      if (status.percentageUsed < 70) {
        return 'claude-opus-4-20250514';
      }
      // Budget constrained, use Sonnet
      return 'claude-3-5-sonnet-20241022';

    default:
      return 'claude-3-5-sonnet-20241022';
  }
}

/**
 * Get a breakdown of usage by model tier
 */
export interface TierBreakdown {
  haiku: { cost: number; tokens: number; calls: number };
  sonnet: { cost: number; tokens: number; calls: number };
  opus: { cost: number; tokens: number; calls: number };
}

export function getTierBreakdown(): TierBreakdown {
  const state = loadBudget();

  const breakdown: TierBreakdown = {
    haiku: { cost: 0, tokens: 0, calls: 0 },
    sonnet: { cost: 0, tokens: 0, calls: 0 },
    opus: { cost: 0, tokens: 0, calls: 0 },
  };

  for (const record of state.records) {
    const tier = getModelTier(record.model);
    breakdown[tier].cost += record.cost;
    breakdown[tier].tokens += record.inputTokens + record.outputTokens;
    breakdown[tier].calls += 1;
  }

  return breakdown;
}

/**
 * Reset budget state (for testing or new day)
 */
export function resetBudget(newDailyBudget?: number): void {
  const state: BudgetState = {
    dailyBudget: newDailyBudget || DEFAULT_DAILY_BUDGET,
    date: getTodayDate(),
    records: [],
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  };
  saveBudget(state);
}

/**
 * Get recent usage records (last N)
 */
export function getRecentRecords(limit: number = 10): UsageRecord[] {
  const state = loadBudget();
  return state.records.slice(-limit);
}

/**
 * Estimate tokens for a task based on prompt length
 * Rough estimate: ~1 token per 4 characters for English text
 */
export function estimateTokens(text: string): number {
  // Simple heuristic: 1 token ~ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Determine task complexity from content
 */
export function inferTaskComplexity(content: string): TaskComplexity {
  const lower = content.toLowerCase();

  // Complex task indicators
  const complexIndicators = [
    /architect.*design|system.*design|multi.*step/,
    /debug.*complex|troubleshoot.*error|fix.*bug/,
    /refactor.*large|rewrite.*code|optimize/,
    /implement.*feature|build.*system|create.*app/,
    /analyze.*data|process.*file|parse.*complex/,
  ];

  // Simple task indicators
  const simpleIndicators = [
    /^what is|^explain|^define|^list/,
    /^how to|^how do i|^how can/,
    /^summarize|^brief|^short/,
    /^yes|^no|^ok|^sure/,
  ];

  for (const pattern of complexIndicators) {
    if (pattern.test(lower)) {
      return 'complex';
    }
  }

  for (const pattern of simpleIndicators) {
    if (pattern.test(lower)) {
      return 'simple';
    }
  }

  return 'moderate';
}
