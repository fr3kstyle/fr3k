#!/usr/bin/env bun
/**
 * PAI Observability Test Suite
 *
 * Verifies end-to-end traceability from Telegram message through PAI processing.
 *
 * Phase 7: End-to-end trace verification
 */

import { tracer } from "./tracer.js";
import { getWorkflowStore } from "./workflow-store.js";
import { getMessageLineage } from "./message-lineage.js";
import { getInstanceTracker } from "./instance-tracker.js";

// ============================================================================
// TEST RESULTS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function recordResult(name: string, passed: boolean, message: string, duration: number) {
  results.push({ name, passed, message, duration });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${status} - ${name}: ${message} (${duration}ms)`);
}

// ============================================================================
// TEST 1: OpenTelemetry Tracer Initialization
// ============================================================================

async function testTracerInitialization(): Promise<void> {
  const start = Date.now();

  try {
    // Test tracer context generation
    const ctx = tracer.context.generate();
    const passed = !!ctx && !!ctx.traceId && !!ctx.traceParent;

    recordResult(
      "Tracer Initialization",
      passed,
      passed ? "Trace context generated successfully" : "Failed to generate trace context",
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "Tracer Initialization",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 2: Telegram Span Creation
// ============================================================================

async function testTelegramSpanCreation(): Promise<void> {
  const start = Date.now();

  try {
    const span = tracer.span.telegram({
      "telegram.message.id": "test-msg-123",
      "telegram.message.text": "Test message for observability",
      "telegram.user.id": "test-user-456",
      "telegram.chat.id": "test-chat-789",
    });

    const passed = !!span && !!span.spanContext();

    span.end();

    recordResult(
      "Telegram Span Creation",
      passed,
      passed ? "Telegram span created and closed" : "Failed to create span",
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "Telegram Span Creation",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 3: PAI Phase Span Creation
// ============================================================================

async function testPAIPhaseSpans(): Promise<void> {
  const start = Date.now();

  try {
    const phases = ["OBSERVE", "THINK", "PLAN", "BUILD", "EXECUTE", "VERIFY", "LEARN"] as const;
    const spans: any[] = [];

    for (const phase of phases) {
      const span = tracer.span.paiPhase(phase, { "test.phase": phase });
      spans.push(span);
      // Simulate phase work
      await new Promise(resolve => setTimeout(resolve, 10));
      tracer.span.success(span);
      span.end();
    }

    recordResult(
      "PAI Phase Spans",
      true,
      `Created ${phases.length} phase spans`,
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "PAI Phase Spans",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 4: Workflow Execution Store
// ============================================================================

async function testWorkflowStore(): Promise<void> {
  const start = Date.now();

  try {
    const store = getWorkflowStore();

    // Create a test execution with all required fields
    const traceId = `test-trace-${Date.now()}`;
    const execution = store.startExecution(
      traceId,
      `test-span-${Date.now()}`,
      {
        id: "test-msg-123",
        text: "Test workflow execution",
        userId: "test-user-456",
        chatId: "test-chat-789",
        timestamp: Date.now(),
      }
    );

    // Add phases
    store.addPhase(traceId, "OBSERVE", "in_progress");
    await new Promise(resolve => setTimeout(resolve, 10));
    store.completePhase(traceId, "OBSERVE");
    store.completePhase(traceId, "THINK");
    store.completePhase(traceId, "PLAN");

    // Complete execution
    store.completeExecution(traceId, "Test response", "test-session-123");

    // Give it a moment for the save to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify retrieval
    const retrieved = store.getExecution(traceId);
    const passed = !!retrieved &&
                   retrieved.status === "completed" &&
                   retrieved.phases.length >= 3;

    recordResult(
      "Workflow Store",
      passed,
      passed ? "Workflow execution tracked end-to-end" : `Failed: phases=${retrieved?.phases.length}, status=${retrieved?.status}`,
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "Workflow Store",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 5: Message Lineage Store
// ============================================================================

async function testMessageLineage(): Promise<void> {
  const start = Date.now();

  try {
    const lineage = getMessageLineage();

    const userId = "test-user-456";
    const traceId = `test-trace-${Date.now()}`;
    const userMsg = lineage.addUserMessage(
      "test-msg-123",
      "Test message for lineage",
      userId,
      traceId
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    const paiResponse = lineage.addPAIResponse(
      "test-pai-456",
      "Test PAI response",
      userId,
      "test-msg-123",
      traceId
    );

    // Give it a moment for the save to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify lineage
    const lineageResult = lineage.getLineage(userId);
    const passed = lineageResult.totalMessages >= 2 &&
                   lineageResult.messages.length >= 2;

    recordResult(
      "Message Lineage",
      passed,
      passed ? "Message lineage tracked correctly" : `Failed: total=${lineageResult.totalMessages}, length=${lineageResult.messages.length}`,
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "Message Lineage",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 6: Instance Tracker
// ============================================================================

async function testInstanceTracker(): Promise<void> {
  const start = Date.now();

  try {
    const tracker = getInstanceTracker();

    // Test instance ID
    const myId = tracker.getMyInstanceId();
    const hasId = !!myId && myId.length > 0;

    // Test heartbeat
    tracker.sendHeartbeat("idle");

    // Test leader check
    const amLeader = tracker.amILeader();

    // Test lock acquisition
    const lockAcquired = tracker.tryAcquireLock("test-msg-123", "test-trace-456");
    tracker.releaseLock();

    const passed = hasId && lockAcquired;

    recordResult(
      "Instance Tracker",
      passed,
      passed ? "Instance tracking and lock acquisition working" : "Failed instance tracking",
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "Instance Tracker",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 7: Trace Context Propagation
// ============================================================================

async function testTraceContextPropagation(): Promise<void> {
  const start = Date.now();

  try {
    // Generate initial trace context
    const ctx1 = tracer.context.generate();

    // Extract and verify
    const extracted = tracer.context.extract(ctx1.traceParent);
    const propagated = extracted?.traceId === ctx1.traceId;

    // Test injection
    const headers: Record<string, string> = {};
    const injected = tracer.context.inject(headers);
    const hasTraceParent = !!injected.traceparent;

    const passed = propagated && hasTraceParent;

    recordResult(
      "Trace Context Propagation",
      passed,
      passed ? "Trace context propagates correctly" : "Failed propagation",
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "Trace Context Propagation",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST 8: End-to-End Integration
// ============================================================================

async function testEndToEndIntegration(): Promise<void> {
  const start = Date.now();

  try {
    const store = getWorkflowStore();
    const lineage = getMessageLineage();
    const tracker = getInstanceTracker();

    const traceId = `e2e-trace-${Date.now()}`;
    const userId = "e2e-test-user";
    const messageId = `e2e-msg-${Date.now()}`;

    // Simulate full message processing flow

    // 1. Communication agent creates trace
    const traceContext = tracer.context.generate();

    // 2. Main bot starts workflow
    const execution = store.startExecution(
      traceId,
      traceContext.spanId,
      {
        id: messageId,
        text: "End-to-end test message",
        userId,
        timestamp: Date.now(),
      }
    );

    // 3. Lineage records user message
    lineage.addUserMessage(messageId, "End-to-end test message", userId, traceId);

    // 4. Track through PAI phases
    for (const phase of ["OBSERVE", "THINK", "PLAN", "BUILD", "EXECUTE", "VERIFY", "LEARN"] as const) {
      store.addPhase(traceId, phase, "in_progress");
      await new Promise(resolve => setTimeout(resolve, 5));
      store.completePhase(traceId, phase);
    }

    // 5. Complete workflow
    store.completeExecution(traceId, "End-to-end test response", "e2e-session-123");

    // 6. Record PAI response in lineage
    lineage.addPAIResponse(`pai-${messageId}`, "End-to-end test response", userId, messageId, traceId);

    // 7. Verify all stores have consistent data
    const workflow = store.getExecution(traceId);
    const lineageResult = lineage.getLineage(userId);

    const passed =
      workflow?.status === "completed" &&
      workflow.phases.length === 7 &&
      lineageResult.totalMessages === 2 &&
      lineageResult.traceIds.includes(traceId);

    recordResult(
      "End-to-End Integration",
      passed,
      passed ? "Full observability stack verified" : "Integration test failed",
      Date.now() - start
    );
  } catch (error) {
    recordResult(
      "End-to-End Integration",
      false,
      `Exception: ${(error as Error).message}`,
      Date.now() - start
    );
  }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     PAI OBSERVABILITY LAYER - TEST SUITE                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log("Running tests...\n");

  await testTracerInitialization();
  await testTelegramSpanCreation();
  await testPAIPhaseSpans();
  await testWorkflowStore();
  await testMessageLineage();
  await testInstanceTracker();
  await testTraceContextPropagation();
  await testEndToEndIntegration();

  // Print summary
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                        TEST SUMMARY                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (failed > 0) {
    console.log("Failed tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log(`║  ${failed === 0 ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}${" ".repeat(32)}  ║`);
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
}

// Run tests
runAllTests().then(() => {
  process.exit(results.filter(r => !r.passed).length > 0 ? 1 : 0);
});
