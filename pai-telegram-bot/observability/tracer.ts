#!/usr/bin/env bun
/**
 * PAI Simple Tracer - Lightweight Distributed Tracing for Bun
 *
 * Provides distributed tracing for PAI Telegram Bot system.
 * Optimized for Bun runtime with minimal dependencies.
 *
 * Phase 1: Distributed Tracing Foundation (Bun-compatible)
 */

import { trace, context, Span, SpanStatusCode, SpanKind } from "@opentelemetry/api";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SERVICE_NAME = "pai-telegram-bot";
const SERVICE_VERSION = "1.0.0";

// ============================================================================
// SIMPLE SPAN IMPLEMENTATION (works without SDK)
// ============================================================================

class SimpleSpan implements Span {
  private _spanContext: { traceId: string; spanId: string; traceFlags: number };
  private _attributes: Record<string, any> = {};
  private _events: any[] = [];
  private _status: { code: SpanStatusCode; message?: string } = { code: SpanStatusCode.UNSET };
  private _ended: boolean = false;
  private _startTime: number = Date.now();
  private _endTime: number = 0;
  private _name: string;
  private _kind: SpanKind;
  private _parentSpanId?: string;

  constructor(name: string, kind: SpanKind = SpanKind.INTERNAL, parentContext?: any) {
    this._name = name;
    this._kind = kind;

    // Generate trace/span IDs
    this._spanContext = {
      traceId: this.generateId(),
      spanId: this.generateId(),
      traceFlags: 1,
    };

    // Link parent if provided
    if (parentContext?.traceId) {
      this._spanContext.traceId = parentContext.traceId;
      this._parentSpanId = parentContext.spanId;
    }
  }

  private generateId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  spanContext() {
    return this._spanContext;
  }

  setAttributes(attributes: Record<string, any>): this {
    Object.assign(this._attributes, attributes);
    return this;
  }

  setAttribute(key: string, value: any): this {
    this._attributes[key] = value;
    return this;
  }

  addEvent(name: string, attributes?: Record<string, any>): this {
    this._events.push({ name, attributes, time: Date.now() });
    return this;
  }

  setStatus(status: { code: SpanStatusCode; message?: string }): this {
    this._status = status;
    return this;
  }

  recordException(exception: Error, time?: number): this {
    this._events.push({
      name: 'exception',
      attributes: {
        'exception.type': exception.name,
        'exception.message': exception.message,
        'exception.stacktrace': exception.stack,
      },
      time: time || Date.now(),
    });
    this._status = { code: SpanStatusCode.ERROR, message: exception.message };
    return this;
  }

  updateName(name: string): this {
    this._name = name;
    return this;
  }

  end(endTime?: number): void {
    if (this._ended) return;
    this._endTime = endTime || Date.now();
    this._ended = true;

    // Log span for debugging
    const duration = this._endTime - this._startTime;
    console.log(`[Span] ${this._name} (${duration}ms) - ${this._status.code}`);
  }

  isRecording(): boolean {
    return !this._ended;
  }

  get startTime() {
    return this._startTime;
  }

  get name() {
    return this._name;
  }

  get kind() {
    return this._kind;
  }

  get attributes() {
    return this._attributes;
  }

  get status() {
    return this._status;
  }

  toJSON() {
    return {
      name: this._name,
      kind: this._kind,
      traceId: this._spanContext.traceId,
      spanId: this._spanContext.spanId,
      parentSpanId: this._parentSpanId,
      startTime: this._startTime,
      endTime: this._endTime,
      duration: this._endTime - this._startTime,
      attributes: this._attributes,
      events: this._events,
      status: this._status,
    };
  }
}

// ============================================================================
// TRACE CONTEXT MANAGEMENT
// ============================================================================

export interface TraceContext {
  traceParent: string;
  traceState?: string;
  traceId: string;
  spanId: string;
}

export function extractTraceContext(traceParent: string): TraceContext | null {
  try {
    const parts = traceParent.split("-");
    if (parts.length < 4) return null;

    const [, traceId, spanId] = parts;

    return {
      traceParent,
      traceId,
      spanId,
    };
  } catch {
    return null;
  }
}

export function generateTraceContext(): TraceContext {
  const traceId = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const spanId = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return {
    traceParent: `00-${traceId}-${spanId}-01`,
    traceId,
    spanId,
  };
}

export function getCurrentTraceContext(): TraceContext | null {
  // For simple implementation, we don't have active context tracking
  return null;
}

// ============================================================================
// PAI Algorithm phase names
// ============================================================================

export const PAI_PHASES = {
  OBSERVE: "pai.algorithm.observe",
  THINK: "pai.algorithm.think",
  PLAN: "pai.algorithm.plan",
  BUILD: "pai.algorithm.build",
  EXECUTE: "pai.algorithm.execute",
  VERIFY: "pai.algorithm.verify",
  LEARN: "pai.algorithm.learn",
} as const;

// ============================================================================
// SPAN CREATION HELPERS
// ============================================================================

export function createTelegramMessageSpan(
  attributes: {
    "telegram.message.id": string;
    "telegram.message.text": string;
    "telegram.user.id": string;
    "telegram.user.username"?: string;
    "telegram.chat.id": string;
  }
): Span {
  const span = new SimpleSpan("telegram.message.received", SpanKind.CONSUMER);
  span.setAttributes({
    ...attributes,
    "messaging.system": "telegram",
    "messaging.operation": "receive",
  });
  return span;
}

export function createPAIPhaseSpan(
  phase: keyof typeof PAI_PHASES,
  attributes: Record<string, any> = {}
): Span {
  const span = new SimpleSpan(PAI_PHASES[phase], SpanKind.INTERNAL);
  span.setAttributes({
    "pai.phase": phase,
    ...attributes,
  });
  return span;
}

export function createSubagentSpan(
  agentType: string,
  taskDescription: string
): Span {
  const span = new SimpleSpan("pai.subagent.execute", SpanKind.CLIENT);
  span.setAttributes({
    "pai.subagent.type": agentType,
    "pai.subagent.task": taskDescription,
  });
  return span;
}

export function createToolSpan(
  toolName: string,
  attributes: Record<string, any> = {}
): Span {
  const span = new SimpleSpan(`pai.tool.${toolName}`, SpanKind.CLIENT);
  span.setAttributes({
    "pai.tool.name": toolName,
    ...attributes,
  });
  return span;
}

// ============================================================================
// SPAN HELPERS
// ============================================================================

export function spanError(span: Span, error: Error): void {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
}

export function spanSuccess(span: Span): void {
  span.setStatus({
    code: SpanStatusCode.OK,
  });
}

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  attributes: Record<string, any> = {}
): Promise<T> {
  const span = new SimpleSpan(name);
  span.setAttributes(attributes);

  try {
    const result = await fn(span);
    spanSuccess(span);
    return result;
  } catch (error) {
    spanError(span, error as Error);
    throw error;
  } finally {
    span.end();
  }
}

// ============================================================================
// TRACE PROPAGATION
// ============================================================================

export function injectTraceContext(
  headers: Record<string, string> = {}
): Record<string, string> {
  const traceContext = generateTraceContext();
  headers["traceparent"] = traceContext.traceParent;
  return headers;
}

export function extractAndActivateTraceContext(
  headers: Record<string, string>
): any {
  const traceParent = headers["traceparent"];
  if (!traceParent) {
    return undefined;
  }

  return extractTraceContext(traceParent);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const tracer = {
  context: {
    extract: extractTraceContext,
    generate: generateTraceContext,
    current: getCurrentTraceContext,
    inject: injectTraceContext,
    extractAndActivate: extractAndActivateTraceContext,
  },
  span: {
    telegram: createTelegramMessageSpan,
    paiPhase: createPAIPhaseSpan,
    subagent: createSubagentSpan,
    tool: createToolSpan,
    error: spanError,
    success: spanSuccess,
    with: withSpan,
  },
  phases: PAI_PHASES,
};

// Export SimpleSpan class for external use
export { SimpleSpan };

// Auto-initialization (log only for Bun-compatible version)
console.log(`[Tracer] Simple tracer initialized`);
console.log(`[Tracer] Service: ${SERVICE_NAME} v${SERVICE_VERSION}`);
