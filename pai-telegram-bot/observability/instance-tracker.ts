#!/usr/bin/env bun
/**
 * PAI Instance Tracker
 *
 * Tracks multiple PAI bot instances to detect race conditions
 * and coordinate distributed processing.
 *
 * Phase 5: Multi-Instance Tracking
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface InstanceInfo {
  id: string;
  pid: number;
  hostname: string;
  startTime: number;
  lastHeartbeat: number;
  status: "active" | "idle" | "processing" | "stopped";
  currentMessageId?: string;
  currentTraceId?: string;
}

export interface HeartbeatData {
  instanceId: string;
  status: InstanceInfo["status"];
  currentMessageId?: string;
  currentTraceId?: string;
}

// ============================================================================
// INSTANCE TRACKER CLASS
// ============================================================================

const INSTANCE_TRACK_PATH = "/tmp/pai-instances.json";
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute

export class InstanceTracker {
  private instances: Map<string, InstanceInfo> = new Map();
  private myInstanceId: string;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(instanceId?: string) {
    this.myInstanceId = instanceId || this.generateInstanceId();
    this.load();
    this.startHeartbeat();
    this.startCleanup();
    this.registerMyself();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  private generateInstanceId(): string {
    const hostname = process.env.HOSTNAME || "localhost";
    const pid = process.pid;
    const timestamp = Date.now();
    return `${hostname}-${pid}-${timestamp}`;
  }

  private async load(): Promise<void> {
    try {
      const data = await Bun.file(INSTANCE_TRACK_PATH).text();
      const parsed = JSON.parse(data) || {};
      this.instances = new Map(Object.entries(parsed));
      console.log(`[InstanceTracker] Loaded ${this.instances.size} instances`);
    } catch {
      console.log("[InstanceTracker] No existing tracker, starting fresh");
      this.instances = new Map();
    }
  }

  private async save(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.instances);
      await Bun.write(INSTANCE_TRACK_PATH, JSON.stringify(obj, null, 2));
    } catch (error) {
      console.error("[InstanceTracker] Failed to save:", error);
    }
  }

  private registerMyself(): void {
    const info: InstanceInfo = {
      id: this.myInstanceId,
      pid: process.pid,
      hostname: process.env.HOSTNAME || "localhost",
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
      status: "idle",
    };

    this.instances.set(this.myInstanceId, info);
    this.save();

    console.log(`[InstanceTracker] Registered instance: ${this.myInstanceId}`);
  }

  // ==========================================================================
  // HEARTBEAT
  // ==========================================================================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 10000); // Every 10 seconds
  }

  sendHeartbeat(status?: InstanceInfo["status"], currentMessageId?: string, currentTraceId?: string): void {
    const info = this.instances.get(this.myInstanceId);
    if (!info) return;

    info.lastHeartbeat = Date.now();
    if (status) {
      info.status = status;
    }
    if (currentMessageId) {
      info.currentMessageId = currentMessageId;
    }
    if (currentTraceId) {
      info.currentTraceId = currentTraceId;
    }

    this.instances.set(this.myInstanceId, info);
    this.save();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleInstances();
    }, CLEANUP_INTERVAL);
  }

  private cleanupStaleInstances(): void {
    const now = Date.now();
    let removed = 0;

    for (const [id, instance] of this.instances.entries()) {
      // Don't remove myself
      if (id === this.myInstanceId) continue;

      // Remove instances that haven't sent heartbeat
      if (now - instance.lastHeartbeat > HEARTBEAT_TIMEOUT) {
        this.instances.delete(id);
        removed++;
        console.log(`[InstanceTracker] Removed stale instance: ${id}`);
      }
    }

    if (removed > 0) {
      this.save();
    }
  }

  // ==========================================================================
  // INSTANCE STATUS
  // ==========================================================================

  setStatus(status: InstanceInfo["status"], currentMessageId?: string, currentTraceId?: string): void {
    this.sendHeartbeat(status, currentMessageId, currentTraceId);
  }

  setProcessing(messageId: string, traceId: string): void {
    this.setStatus("processing", messageId, traceId);
  }

  setIdle(): void {
    this.setStatus("idle");
  }

  // ==========================================================================
  // RACE DETECTION
  // ==========================================================================

  /**
   * Check if another instance is already processing this message
   */
  isMessageBeingProcessed(messageId: string): boolean {
    for (const [id, instance] of this.instances.entries()) {
      if (id !== this.myInstanceId &&
          instance.status === "processing" &&
          instance.currentMessageId === messageId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if another instance is processing this trace
   */
  isTraceBeingProcessed(traceId: string): boolean {
    for (const [id, instance] of this.instances.entries()) {
      if (id !== this.myInstanceId &&
          instance.status === "processing" &&
          instance.currentTraceId === traceId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all active instances
   */
  getActiveInstances(): InstanceInfo[] {
    const now = Date.now();
    return [...this.instances.values()]
      .filter(i => now - i.lastHeartbeat < HEARTBEAT_TIMEOUT)
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get count of active instances
   */
  getActiveInstanceCount(): number {
    return this.getActiveInstances().length;
  }

  /**
   * Check if I'm the leader (first instance)
   */
  amILeader(): boolean {
    const active = this.getActiveInstances();
    if (active.length === 0) return true;
    return active[0].id === this.myInstanceId;
  }

  /**
   * Get my instance ID
   */
  getMyInstanceId(): string {
    return this.myInstanceId;
  }

  /**
   * Get info about a specific instance
   */
  getInstance(instanceId: string): InstanceInfo | null {
    return this.instances.get(instanceId) || null;
  }

  // ==========================================================================
  // COORDINATION
  // ==========================================================================

  /**
   * Try to acquire exclusive lock for processing this message
   * Returns true if lock acquired, false if another instance is processing
   */
  tryAcquireLock(messageId: string, traceId: string): boolean {
    if (this.isMessageBeingProcessed(messageId)) {
      console.log(`[InstanceTracker] Message ${messageId} already being processed`);
      return false;
    }

    if (this.isTraceBeingProcessed(traceId)) {
      console.log(`[InstanceTracker] Trace ${traceId} already being processed`);
      return false;
    }

    this.setProcessing(messageId, traceId);
    return true;
  }

  /**
   * Release the processing lock
   */
  releaseLock(): void {
    this.setIdle();
  }

  // ==========================================================================
  // SHUTDOWN
  // ==========================================================================

  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Remove myself from instances
    this.instances.delete(this.myInstanceId);
    await this.save();

    console.log(`[InstanceTracker] Unregistered instance: ${this.myInstanceId}`);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let trackerInstance: InstanceTracker | null = null;

export function getInstanceTracker(instanceId?: string): InstanceTracker {
  if (!trackerInstance) {
    trackerInstance = new InstanceTracker(instanceId);
  }
  return trackerInstance;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (trackerInstance) {
    await trackerInstance.shutdown();
  }
});

process.on("SIGTERM", async () => {
  if (trackerInstance) {
    await trackerInstance.shutdown();
  }
});
