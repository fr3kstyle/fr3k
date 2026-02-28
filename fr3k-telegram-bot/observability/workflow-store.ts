#!/usr/bin/env bun
/**
 * PAI Workflow Execution Store
 *
 * Provides persistent storage and querying of PAI workflow executions.
 * Tracks message processing from Telegram through all 7 PAI Algorithm phases.
 *
 * Phase 3: Workflow Execution Store
 */

import { tracer } from "./tracer.js";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Phase execution status
 */
export type PhaseStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * Individual phase execution record
 */
export interface PhaseExecution {
  name: string;                    // Phase name (OBSERVE, THINK, etc.)
  status: PhaseStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes?: Record<string, any>;
  subagents?: SubagentExecution[];
  tools?: ToolExecution[];
  error?: string;
}

/**
 * Subagent execution record
 */
export interface SubagentExecution {
  type: string;                    // Agent type (Engineer, Architect, etc.)
  task: string;                    // Task description
  startTime: number;
  endTime?: number;
  duration?: number;
  status: PhaseStatus;
  traceId?: string;                // Link to distributed trace
}

/**
 * Tool invocation record
 */
export interface ToolExecution {
  name: string;                    // Tool name
  arguments: Record<string, any>;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: PhaseStatus;
  result?: string;
}

/**
 * Telegram message source
 */
export interface TelegramMessage {
  id: string;
  text: string;
  userId: string;
  username?: string;
  chatId: string;
  messageId?: number;
  timestamp: number;
}

/**
 * Complete workflow execution record
 */
export interface WorkflowExecution {
  traceId: string;                 // Distributed trace ID
  rootSpanId: string;              // Root span ID
  message: TelegramMessage;        // Original Telegram message
  status: "processing" | "completed" | "failed";
  startTime: number;
  endTime?: number;
  duration?: number;
  phases: PhaseExecution[];        // All 7 PAI phases
  response?: string;               // Final response sent to user
  sessionId?: string;              // Claude session ID for continuity
  metadata: {
    instanceId: string;            // Bot instance ID
    hostname: string;
    processedBy: string;           // Which agent processed
  };
}

// ============================================================================
// WORKFLOW STORE CLASS
// ============================================================================

const WORKFLOW_STORE_PATH = "/tmp/pai-workflow-executions.json";

export class WorkflowExecutionStore {
  private executions: Map<string, WorkflowExecution> = new Map();
  private saveTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.load();
    this.startAutoSave();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Load executions from disk
   */
  private async load(): Promise<void> {
    try {
      const data = await Bun.file(WORKFLOW_STORE_PATH).text();
      const parsed = JSON.parse(data) || {};

      this.executions = new Map(Object.entries(parsed));
      console.log(`[WorkflowStore] Loaded ${this.executions.size} executions`);
    } catch {
      console.log("[WorkflowStore] No existing store, starting fresh");
      this.executions = new Map();
    }
  }

  /**
   * Save executions to disk
   */
  private async save(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.executions);
      await Bun.write(WORKFLOW_STORE_PATH, JSON.stringify(obj, null, 2));
    } catch (error) {
      console.error("[WorkflowStore] Failed to save:", error);
    }
  }

  /**
   * Start auto-save timer (every 5 seconds)
   */
  private startAutoSave(): void {
    this.saveTimer = setInterval(() => {
      this.save();
    }, 5000);
  }

  /**
   * Stop auto-save and flush
   */
  async close(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    await this.save();
  }

  // ==========================================================================
  // EXECUTION MANAGEMENT
  // ==========================================================================

  /**
   * Start a new workflow execution
   */
  startExecution(
    traceId: string,
    rootSpanId: string,
    message: TelegramMessage,
    metadata?: Partial<WorkflowExecution["metadata"]>
  ): WorkflowExecution {
    const execution: WorkflowExecution = {
      traceId,
      rootSpanId,
      message,
      status: "processing",
      startTime: Date.now(),
      phases: [],
      metadata: {
        instanceId: metadata?.instanceId || this.getInstanceId(),
        hostname: metadata?.hostname || this.getHostname(),
        processedBy: metadata?.processedBy || "main-bot",
      },
    };

    this.executions.set(traceId, execution);

    // Also broadcast to SSE clients
    this.broadcastExecution("workflow-started", execution);

    return execution;
  }

  /**
   * Add or update a phase in the execution
   */
  addPhase(
    traceId: string,
    phaseName: string,
    status: PhaseStatus,
    attributes?: Record<string, any>
  ): PhaseExecution | null {
    const execution = this.executions.get(traceId);
    if (!execution) return null;

    let phase = execution.phases.find(p => p.name === phaseName);

    if (phase) {
      // Update existing phase
      phase.status = status;
      if (attributes) {
        phase.attributes = { ...phase.attributes, ...attributes };
      }
      if (status === "completed" || status === "failed") {
        phase.endTime = Date.now();
        phase.duration = phase.endTime - phase.startTime;
      }
    } else {
      // Create new phase
      phase = {
        name: phaseName,
        status,
        startTime: Date.now(),
        attributes,
      };
      execution.phases.push(phase);
    }

    // Broadcast phase update
    this.broadcastExecution("workflow-phase", execution);

    return phase;
  }

  /**
   * Complete a phase with success
   */
  completePhase(
    traceId: string,
    phaseName: string,
    attributes?: Record<string, any>
  ): PhaseExecution | null {
    return this.addPhase(traceId, phaseName, "completed", attributes);
  }

  /**
   * Mark a phase as failed
   */
  failPhase(
    traceId: string,
    phaseName: string,
    error: string,
    attributes?: Record<string, any>
  ): PhaseExecution | null {
    const phase = this.addPhase(traceId, phaseName, "failed", attributes);
    if (phase) {
      phase.error = error;
    }
    return phase;
  }

  /**
   * Add a subagent execution to a phase
   */
  addSubagent(
    traceId: string,
    phaseName: string,
    subagent: SubagentExecution
  ): void {
    const execution = this.executions.get(traceId);
    if (!execution) return;

    const phase = execution.phases.find(p => p.name === phaseName);
    if (!phase) return;

    if (!phase.subagents) {
      phase.subagents = [];
    }

    phase.subagents.push(subagent);

    // Broadcast subagent spawn
    this.broadcastExecution("workflow-subagent", execution);
  }

  /**
   * Add a tool invocation to a phase
   */
  addTool(
    traceId: string,
    phaseName: string,
    tool: ToolExecution
  ): void {
    const execution = this.executions.get(traceId);
    if (!execution) return;

    const phase = execution.phases.find(p => p.name === phaseName);
    if (!phase) return;

    if (!phase.tools) {
      phase.tools = [];
    }

    phase.tools.push(tool);

    // Broadcast tool invocation
    this.broadcastExecution("workflow-tool", execution);
  }

  /**
   * Complete the entire workflow execution
   */
  completeExecution(
    traceId: string,
    response: string,
    sessionId?: string
  ): WorkflowExecution | null {
    const execution = this.executions.get(traceId);
    if (!execution) return null;

    execution.status = "completed";
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    execution.response = response;
    if (sessionId) {
      execution.sessionId = sessionId;
    }

    // Broadcast completion
    this.broadcastExecution("workflow-completed", execution);

    return execution;
  }

  /**
   * Mark execution as failed
   */
  failExecution(traceId: string, error: string): WorkflowExecution | null {
    const execution = this.executions.get(traceId);
    if (!execution) return null;

    execution.status = "failed";
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;

    // Add error to last active phase
    const activePhase = [...execution.phases]
      .reverse()
      .find(p => p.status === "in_progress");

    if (activePhase) {
      activePhase.status = "failed";
      activePhase.error = error;
      activePhase.endTime = Date.now();
      activePhase.duration = activePhase.endTime - activePhase.startTime;
    }

    // Broadcast failure
    this.broadcastExecution("workflow-failed", execution);

    return execution;
  }

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /**
   * Get execution by trace ID
   */
  getExecution(traceId: string): WorkflowExecution | null {
    return this.executions.get(traceId) || null;
  }

  /**
   * Get all active (processing) executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return [...this.executions.values()]
      .filter(e => e.status === "processing")
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get recent executions (completed or failed)
   */
  getRecentExecutions(limit: number = 50): WorkflowExecution[] {
    return [...this.executions.values()]
      .filter(e => e.status !== "processing")
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Search executions by user ID
   */
  searchByUserId(userId: string): WorkflowExecution[] {
    return [...this.executions.values()]
      .filter(e => e.message.userId === userId)
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Search executions by time range
   */
  searchByTimeRange(start: number, end: number): WorkflowExecution[] {
    return [...this.executions.values()]
      .filter(e => e.startTime >= start && e.startTime <= end)
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Search executions by status
   */
  searchByStatus(status: WorkflowExecution["status"]): WorkflowExecution[] {
    return [...this.executions.values()]
      .filter(e => e.status === status)
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): WorkflowExecution[] {
    return [...this.executions.values()];
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    total: number;
    processing: number;
    completed: number;
    failed: number;
    avgDuration: number;
  } {
    const executions = [...this.executions.values()];
    const completed = executions.filter(e => e.status === "completed" && e.duration);

    return {
      total: executions.length,
      processing: executions.filter(e => e.status === "processing").length,
      completed: executions.filter(e => e.status === "completed").length,
      failed: executions.filter(e => e.status === "failed").length,
      avgDuration: completed.length > 0
        ? completed.reduce((sum, e) => sum + (e.duration || 0), 0) / completed.length
        : 0,
    };
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Remove old executions (older than specified milliseconds)
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [traceId, execution] of this.executions.entries()) {
      if (execution.startTime < cutoff && execution.status !== "processing") {
        this.executions.delete(traceId);
        removed++;
      }
    }

    if (removed > 0) {
      this.save();
    }

    return removed;
  }

  /**
   * Clear all executions (useful for testing)
   */
  clear(): void {
    this.executions.clear();
    this.save();
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private getInstanceId(): string {
    return process.env.PAI_INSTANCE_ID || `bot-${process.pid}`;
  }

  private getHostname(): string {
    return process.env.HOSTNAME || "localhost";
  }

  /**
   * Broadcast execution events to SSE clients
   * This is used by the metrics server to push real-time updates
   */
  private broadcastExecution(
    eventType: string,
    execution: WorkflowExecution
  ): void {
    // Store latest event for polling
    // The metrics server will read this and broadcast via SSE
    const eventKey = `/tmp/pai-workflow-event-${eventType}`;
    Bun.write(eventKey, JSON.stringify({
      type: eventType,
      execution,
      timestamp: Date.now(),
    }));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let storeInstance: WorkflowExecutionStore | null = null;

export function getWorkflowStore(): WorkflowExecutionStore {
  if (!storeInstance) {
    storeInstance = new WorkflowExecutionStore();
  }
  return storeInstance;
}

// Auto-cleanup old executions every hour
setInterval(() => {
  const store = getWorkflowStore();
  const removed = store.cleanup();
  if (removed > 0) {
    console.log(`[WorkflowStore] Cleaned up ${removed} old executions`);
  }
}, 60 * 60 * 1000);
