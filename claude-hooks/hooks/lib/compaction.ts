/**
 * Context Compaction Engine
 *
 * Manages context optimization through multi-stage compaction:
 * 1. Tool result clearing - remove old tool outputs
 * 2. Summarization - compress long content
 * 3. Structured notes - extract key information
 *
 * Preserves critical context while managing token budget.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './paths';
import type { CompactionState } from './memory-types';

const STATE_DIR = join(getPaiDir(), 'MEMORY', 'STATE');
const COMPACTION_STATE_FILE = join(STATE_DIR, 'compaction.json');

/**
 * File access record
 */
interface FileAccess {
  path: string;
  lastAccess: string; // ISO timestamp
  accessCount: number;
  summary?: string;
}

/**
 * Context snapshot for tracking what's in context
 */
interface ContextSnapshot {
  files: Map<string, FileAccess>;
  toolOutputs: Map<string, { timestamp: string; size: number }>;
  totalTokens: number;
  lastUpdate: string;
}

/**
 * Critical context markers - content that must be preserved
 */
const CRITICAL_MARKERS = [
  'architectural decision',
  'architecture decision',
  'important:',
  'critical:',
  'warning:',
  'note:',
  'todo:',
  'fixme:',
  'hack:',
  'bug:',
  'workaround:',
];

/**
 * Tool output patterns to detect
 */
const TOOL_OUTPUT_PATTERNS = [
  /^Output from /,
  /^Result: /,
  /^The file /,
  /^Command output:/,
  /^Response:/,
];

/**
 * CompactionEngine - Main class for context optimization
 */
export class CompactionEngine {
  private state: CompactionState;
  private context: ContextSnapshot;
  private readonly CONTEXT_THRESHOLD = 0.8; // Trigger at 80%
  private readonly MAX_FILES_TO_TRACK = 5;
  private readonly TOOL_OUTPUT_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.state = this.loadState();
    this.context = {
      files: new Map(),
      toolOutputs: new Map(),
      totalTokens: 0,
      lastUpdate: new Date().toISOString(),
    };
  }

  private loadState(): CompactionState {
    if (!existsSync(COMPACTION_STATE_FILE)) {
      return {
        toolOutputsCleared: 0,
        filesSummarized: 0,
        contextTokensSaved: 0,
        lastCompaction: new Date().toISOString(),
        preservedContext: {
          recentFiles: [],
          keyDecisions: [],
          bugs: [],
        },
      };
    }
    try {
      return JSON.parse(readFileSync(COMPACTION_STATE_FILE, 'utf-8'));
    } catch {
      return {
        toolOutputsCleared: 0,
        filesSummarized: 0,
        contextTokensSaved: 0,
        lastCompaction: new Date().toISOString(),
        preservedContext: {
          recentFiles: [],
          keyDecisions: [],
          bugs: [],
        },
      };
    }
  }

  private saveState(): void {
    // Ensure directory exists
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true });
    }
    writeFileSync(COMPACTION_STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Check if compaction is needed
   */
  shouldCompact(currentTokens: number, maxTokens: number): boolean {
    const utilization = currentTokens / maxTokens;
    this.context.totalTokens = currentTokens;
    return utilization >= this.CONTEXT_THRESHOLD;
  }

  /**
   * Record a file access
   */
  recordFileAccess(path: string, summary?: string): void {
    const existing = this.context.files.get(path);
    const now = new Date().toISOString();

    if (existing) {
      existing.lastAccess = now;
      existing.accessCount++;
      if (summary) existing.summary = summary;
    } else {
      this.context.files.set(path, {
        path,
        lastAccess: now,
        accessCount: 1,
        summary,
      });
    }

    // Prune to max files
    if (this.context.files.size > this.MAX_FILES_TO_TRACK) {
      const entries = Array.from(this.context.files.entries())
        .sort((a, b) => {
          // Sort by access count, then recency
          if (b[1].accessCount !== a[1].accessCount) {
            return b[1].accessCount - a[1].accessCount;
          }
          return b[1].lastAccess.localeCompare(a[1].lastAccess);
        });

      this.context.files = new Map(entries.slice(0, this.MAX_FILES_TO_TRACK));
    }

    // Sync to state for getState()
    this.state.preservedContext.recentFiles = Array.from(this.context.files.keys());
    this.context.lastUpdate = now;
  }

  /**
   * Record a tool output
   */
  recordToolOutput(toolName: string, output: string): void {
    const key = `${toolName}:${Date.now()}`;
    this.context.toolOutputs.set(key, {
      timestamp: new Date().toISOString(),
      size: output.length,
    });
  }

  /**
   * Perform compaction
   *
   * Returns a summary of what was done and what context to preserve
   */
  compact(
    currentTokens: number,
    maxTokens: number
  ): {
    actions: string[];
    preserve: string[];
    tokensSaved: number;
  } {
    const actions: string[] = [];
    const preserve: string[] = [];
    let tokensSaved = 0;

    // Stage 1: Clear old tool outputs
    const toolResult = this.clearOldToolOutputs();
    if (toolResult.cleared > 0) {
      actions.push(`Cleared ${toolResult.cleared} old tool outputs`);
      tokensSaved += toolResult.tokensSaved;
      this.state.toolOutputsCleared += toolResult.cleared;
    }

    // Stage 2: Summarize files (if needed)
    if (this.shouldSummarizeFiles(currentTokens - tokensSaved, maxTokens)) {
      const summarizeResult = this.summarizeFiles();
      if (summarizeResult.summarized > 0) {
        actions.push(`Summarized ${summarizeResult.summarized} files`);
        tokensSaved += summarizeResult.tokensSaved;
        this.state.filesSummarized += summarizeResult.summarized;
        preserve.push(...summarizeResult.preserve);
      }
    }

    // Stage 3: Extract structured notes (critical context)
    const notes = this.extractCriticalNotes();
    if (notes.decisions.length > 0 || notes.bugs.length > 0) {
      preserve.push(
        '## Critical Context',
        '',
        ...notes.decisions.map(d => `- **Decision:** ${d}`),
        ...notes.bugs.map(b => `- **Bug:** ${b}`)
      );
      this.state.preservedContext.keyDecisions = notes.decisions;
      this.state.preservedContext.bugs = notes.bugs;
    }

    // Update preserved files list
    this.state.preservedContext.recentFiles = Array.from(this.context.files.keys())
      .slice(0, this.MAX_FILES_TO_TRACK);

    // Update state
    this.state.contextTokensSaved += tokensSaved;
    this.state.lastCompaction = new Date().toISOString();
    this.saveState();

    return {
      actions,
      preserve,
      tokensSaved,
    };
  }

  /**
   * Clear old tool outputs
   */
  private clearOldToolOutputs(): {
    cleared: number;
    tokensSaved: number;
  } {
    const now = Date.now();
    let cleared = 0;
    let tokensSaved = 0;

    for (const [key, output] of this.context.toolOutputs.entries()) {
      const age = now - new Date(output.timestamp).getTime();
      if (age > this.TOOL_OUTPUT_TTL_MS) {
        this.context.toolOutputs.delete(key);
        cleared++;
        // Rough estimate: 4 chars per token
        tokensSaved += Math.floor(output.size / 4);
      }
    }

    return { cleared, tokensSaved };
  }

  /**
   * Determine if we should summarize files
   */
  private shouldSummarizeFiles(currentTokens: number, maxTokens: number): boolean {
    const utilization = currentTokens / maxTokens;
    return utilization > 0.9; // Only summarize at 90%+
  }

  /**
   * Summarize files
   */
  private summarizeFiles(): {
    summarized: number;
    tokensSaved: number;
    preserve: string[];
  } {
    const preserve: string[] = [];
    let summarized = 0;
    let tokensSaved = 0;

    // Get most recently accessed files
    const recentFiles = Array.from(this.context.files.entries())
      .sort((a, b) => b[1].lastAccess.localeCompare(a[1].lastAccess))
      .slice(0, this.MAX_FILES_TO_TRACK);

    for (const [path, access] of recentFiles) {
      if (access.summary) {
        preserve.push(`- ${path}: ${access.summary}`);
        summarized++;
        // Estimate savings
        tokensSaved += 100; // Assume we saved ~100 tokens per file
      }
    }

    return { summarized, tokensSaved, preserve };
  }

  /**
   * Extract critical notes from content
   */
  private extractCriticalNotes(): {
    decisions: string[];
    bugs: string[];
  } {
    const decisions: string[] = [];
    const bugs: string[] = [];

    // This would be called on content being compacted
    // For now, return what we've tracked in state

    if (this.state.preservedContext.keyDecisions) {
      decisions.push(...this.state.preservedContext.keyDecisions);
    }
    if (this.state.preservedContext.bugs) {
      bugs.push(...this.state.preservedContext.bugs);
    }

    return { decisions, bugs };
  }

  /**
   * Check if content contains critical information
   */
  static isCriticalContent(content: string): boolean {
    const lower = content.toLowerCase();
    return CRITICAL_MARKERS.some(marker => lower.includes(marker));
  }

  /**
   * Check if line is tool output
   */
  static isToolOutput(line: string): boolean {
    return TOOL_OUTPUT_PATTERNS.some(pattern => pattern.test(line));
  }

  /**
   * Generate compaction report
   */
  getReport(): string {
    const lines = [
      '## Context Compaction Report',
      '',
      `Last Compaction: ${this.state.lastCompaction}`,
      '',
      '### Statistics',
      `- Tool Outputs Cleared: ${this.state.toolOutputsCleared}`,
      `- Files Summarized: ${this.state.filesSummarized}`,
      `- Estimated Tokens Saved: ${this.state.contextTokensSaved}`,
      '',
      '### Preserved Context',
      '',
      '#### Recent Files',
      ...this.state.preservedContext.recentFiles.map(f => `- ${f}`),
      '',
      '#### Key Decisions',
      ...this.state.preservedContext.keyDecisions.map(d => `- ${d}`),
      '',
      '#### Known Bugs',
      ...this.state.preservedContext.bugs.map(b => `- ${b}`),
      '',
    ];

    return lines.filter(l => l !== undefined).join('\n');
  }

  /**
   * Get current state
   */
  getState(): CompactionState {
    return { ...this.state };
  }

  /**
   * Reset state (for testing)
   */
  resetState(): void {
    this.state = {
      toolOutputsCleared: 0,
      filesSummarized: 0,
      contextTokensSaved: 0,
      lastCompaction: new Date().toISOString(),
      preservedContext: {
        recentFiles: [],
        keyDecisions: [],
        bugs: [],
      },
    };
    this.saveState();
  }
}

// Singleton instance
let engineInstance: CompactionEngine | null = null;

export function getCompactionEngine(): CompactionEngine {
  if (!engineInstance) {
    engineInstance = new CompactionEngine();
  }
  return engineInstance;
}

/**
 * Convenience function: check if compaction is needed
 */
export function shouldCompact(currentTokens: number, maxTokens: number): boolean {
  return getCompactionEngine().shouldCompact(currentTokens, maxTokens);
}

/**
 * Convenience function: perform compaction
 */
export function compactContext(
  currentTokens: number,
  maxTokens: number
): ReturnType<CompactionEngine['compact']> {
  return getCompactionEngine().compact(currentTokens, maxTokens);
}

/**
 * Convenience function: record file access
 */
export function recordFileAccess(path: string, summary?: string): void {
  getCompactionEngine().recordFileAccess(path, summary);
}

/**
 * Convenience function: get compaction report
 */
export function getCompactionReport(): string {
  return getCompactionEngine().getReport();
}
