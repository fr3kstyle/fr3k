#!/usr/bin/env bun
/**
 * PAI Message Lineage Store
 *
 * Tracks message relationships and conversation history.
 * Enables end-to-end traceability from original user message to PAI response.
 *
 * Phase 6: Message Lineage
 */

import { tracer } from "./tracer.js";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Represents a single message in the conversation lineage
 */
export interface LineageMessage {
  id: string;                      // Unique message ID
  type: "user" | "pai" | "system";  // Message type
  text: string;                    // Message content
  timestamp: number;               // Unix timestamp
  userId: string;                  // Telegram user ID
  traceId?: string;                // Associated trace ID
  parentMessageId?: string;        // For threaded replies
  replyToMessageId?: number;       // Telegram reply_to_message_id
  metadata?: {
    username?: string;
    chatId?: string;
    sessionId?: string;            // Claude session ID
    phaseTimings?: {
      observe: number;
      think: number;
      plan: number;
      build: number;
      execute: number;
      verify: number;
      learn: number;
    };
    responseLength?: number;
  };
}

/**
 * Represents a conversation thread
 */
export interface ConversationThread {
  userId: string;
  messages: LineageMessage[];
  startTime: number;
  lastActivity: number;
  messageCount: number;
  sessionId?: string;              // Current Claude session
}

/**
 * Lineage query result
 */
export interface LineageQueryResult {
  messages: LineageMessage[];
  totalMessages: number;
  duration: number;                // Conversation duration in ms
  avgResponseTime: number;         // Average PAI response time
  traceIds: string[];              // All associated trace IDs
}

// ============================================================================
// MESSAGE LINEAGE STORE CLASS
// ============================================================================

const LINEAGE_STORE_PATH = "/tmp/pai-message-lineage.json";

export class MessageLineageStore {
  private conversations: Map<string, ConversationThread> = new Map();
  private messageIndex: Map<string, string> = new Map(); // messageId -> userId
  private saveTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.load();
    this.startAutoSave();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  private async load(): Promise<void> {
    try {
      const data = await Bun.file(LINEAGE_STORE_PATH).text();
      const parsed = JSON.parse(data) || {};

      this.conversations = new Map(
        Object.entries(parsed.conversations || {})
      );
      this.messageIndex = new Map(
        Object.entries(parsed.messageIndex || {})
      );

      console.log(`[MessageLineage] Loaded ${this.conversations.size} conversations`);
    } catch {
      console.log("[MessageLineage] No existing store, starting fresh");
      this.conversations = new Map();
      this.messageIndex = new Map();
    }
  }

  private async save(): Promise<void> {
    try {
      const data = {
        conversations: Object.fromEntries(this.conversations),
        messageIndex: Object.fromEntries(this.messageIndex),
      };
      await Bun.write(LINEAGE_STORE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("[MessageLineage] Failed to save:", error);
    }
  }

  private startAutoSave(): void {
    this.saveTimer = setInterval(() => {
      this.save();
    }, 10000); // Save every 10 seconds
  }

  async close(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    await this.save();
  }

  // ==========================================================================
  // MESSAGE MANAGEMENT
  // ==========================================================================

  /**
   * Add a user message to the lineage
   */
  addUserMessage(
    messageId: string,
    text: string,
    userId: string,
    traceId?: string,
    metadata?: LineageMessage["metadata"]
  ): LineageMessage {
    const message: LineageMessage = {
      id: messageId,
      type: "user",
      text,
      timestamp: Date.now(),
      userId,
      traceId,
      metadata,
    };

    this.addMessageToConversation(userId, message);
    return message;
  }

  /**
   * Add a PAI response to the lineage
   */
  addPAIResponse(
    messageId: string,
    text: string,
    userId: string,
    parentMessageId: string,
    traceId?: string,
    metadata?: LineageMessage["metadata"]
  ): LineageMessage {
    const message: LineageMessage = {
      id: messageId,
      type: "pai",
      text,
      timestamp: Date.now(),
      userId,
      traceId,
      parentMessageId,
      metadata,
    };

    this.addMessageToConversation(userId, message);
    return message;
  }

  /**
   * Add a system message to the lineage
   */
  addSystemMessage(
    text: string,
    userId: string,
    metadata?: LineageMessage["metadata"]
  ): LineageMessage {
    const messageId = `system-${Date.now()}-${userId}`;
    const message: LineageMessage = {
      id: messageId,
      type: "system",
      text,
      timestamp: Date.now(),
      userId,
      metadata,
    };

    this.addMessageToConversation(userId, message);
    return message;
  }

  private addMessageToConversation(userId: string, message: LineageMessage): void {
    let thread = this.conversations.get(userId);

    if (!thread) {
      thread = {
        userId,
        messages: [],
        startTime: message.timestamp,
        lastActivity: message.timestamp,
        messageCount: 0,
      };
      this.conversations.set(userId, thread);
    }

    thread.messages.push(message);
    thread.lastActivity = message.timestamp;
    thread.messageCount++;

    // Index message for lookup
    this.messageIndex.set(message.id, userId);

    // Broadcast event for SSE
    this.broadcastMessage("message-added", userId, message);
  }

  /**
   * Update message with phase timings
   */
  updatePhaseTimings(
    messageId: string,
    timings: LineageMessage["metadata"]["phaseTimings"]
  ): void {
    const userId = this.messageIndex.get(messageId);
    if (!userId) return;

    const thread = this.conversations.get(userId);
    if (!thread) return;

    const message = thread.messages.find(m => m.id === messageId);
    if (!message) return;

    if (!message.metadata) {
      message.metadata = {};
    }
    message.metadata.phaseTimings = timings;

    this.broadcastMessage("message-updated", userId, message);
  }

  /**
   * Update message with session ID
   */
  updateSessionId(messageId: string, sessionId: string): void {
    const userId = this.messageIndex.get(messageId);
    if (!userId) return;

    const thread = this.conversations.get(userId);
    if (!thread) return;

    const message = thread.messages.find(m => m.id === messageId);
    if (!message) return;

    if (!message.metadata) {
      message.metadata = {};
    }
    message.metadata.sessionId = sessionId;

    // Also update thread session
    thread.sessionId = sessionId;
  }

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /**
   * Get conversation for a user
   */
  getConversation(userId: string): ConversationThread | null {
    return this.conversations.get(userId) || null;
  }

  /**
   * Get messages for a user with optional limit
   */
  getMessages(userId: string, limit?: number): LineageMessage[] {
    const thread = this.conversations.get(userId);
    if (!thread) return [];

    const messages = [...thread.messages].reverse(); // Most recent first
    return limit ? messages.slice(0, limit) : messages;
  }

  /**
   * Get recent messages across all users
   */
  getRecentMessages(limit: number = 50): LineageMessage[] {
    const allMessages: LineageMessage[] = [];

    for (const thread of this.conversations.values()) {
      allMessages.push(...thread.messages);
    }

    return allMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get lineage query result for a user
   */
  getLineage(userId: string): LineageQueryResult {
    const thread = this.conversations.get(userId);
    if (!thread) {
      return {
        messages: [],
        totalMessages: 0,
        duration: 0,
        avgResponseTime: 0,
        traceIds: [],
      };
    }

    const messages = [...thread.messages];
    const traceIds = messages
      .map(m => m.traceId)
      .filter((t): t is string => !!t);

    // Calculate response times (time between user message and PAI response)
    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].type === "user" && messages[i + 1].type === "pai") {
        totalResponseTime += messages[i + 1].timestamp - messages[i].timestamp;
        responseCount++;
      }
    }

    return {
      messages,
      totalMessages: messages.length,
      duration: thread.lastActivity - thread.startTime,
      avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      traceIds: [...new Set(traceIds)],
    };
  }

  /**
   * Find message by ID
   */
  findMessage(messageId: string): LineageMessage | null {
    const userId = this.messageIndex.get(messageId);
    if (!userId) return null;

    const thread = this.conversations.get(userId);
    if (!thread) return null;

    return thread.messages.find(m => m.id === messageId) || null;
  }

  /**
   * Get all trace IDs for a user
   */
  getTraceIds(userId: string): string[] {
    const thread = this.conversations.get(userId);
    if (!thread) return [];

    return thread.messages
      .map(m => m.traceId)
      .filter((t): t is string => !!t);
  }

  /**
   * Get conversation statistics
   */
  getStatistics(): {
    totalConversations: number;
    totalMessages: number;
    avgMessagesPerConversation: number;
    activeConversations: number;  // Active in last hour
  } {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    const totalConversations = this.conversations.size;
    let totalMessages = 0;
    let activeConversations = 0;

    for (const thread of this.conversations.values()) {
      totalMessages += thread.messages.length;
      if (thread.lastActivity >= hourAgo) {
        activeConversations++;
      }
    }

    return {
      totalConversations,
      totalMessages,
      avgMessagesPerConversation: totalConversations > 0
        ? totalMessages / totalConversations
        : 0,
      activeConversations,
    };
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Remove old conversations
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [userId, thread] of this.conversations.entries()) {
      if (thread.lastActivity < cutoff) {
        // Remove from message index
        for (const message of thread.messages) {
          this.messageIndex.delete(message.id);
        }

        this.conversations.delete(userId);
        removed++;
      }
    }

    if (removed > 0) {
      this.save();
    }

    return removed;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.conversations.clear();
    this.messageIndex.clear();
    this.save();
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private broadcastMessage(
    eventType: string,
    userId: string,
    message: LineageMessage
  ): void {
    const eventKey = `/tmp/pai-lineage-event-${eventType}`;
    Bun.write(eventKey, JSON.stringify({
      type: eventType,
      userId,
      message,
      timestamp: Date.now(),
    }));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let lineageInstance: MessageLineageStore | null = null;

export function getMessageLineage(): MessageLineageStore {
  if (!lineageInstance) {
    lineageInstance = new MessageLineageStore();
  }
  return lineageInstance;
}

// Auto-cleanup every 6 hours
setInterval(() => {
  const store = getMessageLineage();
  const removed = store.cleanup();
  if (removed > 0) {
    console.log(`[MessageLineage] Cleaned up ${removed} old conversations`);
  }
}, 6 * 60 * 60 * 1000);
