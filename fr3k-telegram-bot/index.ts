#!/usr/bin/env bun
/**
 * PAI Telegram Bot - Main orchestrator
 *
 * Coordinates communication agent and voice agent.
 * Processes messages from queue without blocking.
 */

import { Bot, GrammyError } from "grammy";
import { spawn } from "bun";
import { unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tracer } from "./observability/tracer.js";
import { getWorkflowStore } from "./observability/workflow-store.js";
import { getMessageLineage } from "./observability/message-lineage.js";
import { getInstanceTracker } from "./observability/instance-tracker.js";
import { validatePAIResponse } from "./response-validation.js";
import { antiRepetitionSystem } from "./anti-repetition.js";
import { handleDispatcherTask } from "./agents/dispatcher-agent.js";
import { ParallelProcessor } from "./parallel-agents/parallel-processor.js";
import { addToHistory as addToConversationHistory } from "./agents/communication-agent.js";
import { processAlgorithmPhases, isAlgorithmResponse } from "./phase-parser.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const SESSION_FILE = process.env.SESSION_FILE || "/tmp/pai-telegram-sessions.json";
const MESSAGE_QUEUE_PATH = "/tmp/pai-message-queue.json";
const NEW_MESSAGE_FLAG = "/tmp/pai-new-message.flag";

// State
let sessions = new Map<string, string>();
let isProcessing = false;

// Response validation monitoring
const responseValidationStats = {
  totalResponses: 0,
  validResponses: 0,
  invalidResponses: 0,
  lastValidationTime: 0
};

// Initialize bot for sending responses
const bot = new Bot(BOT_TOKEN);

// Initialize parallel processor
const parallelProcessor = new ParallelProcessor();

// Load sessions
async function loadSessions() {
  try {
    const data = await Bun.readableStreamToText(Bun.file(SESSION_FILE).stream());
    const obj = JSON.parse(data);
    sessions = new Map(Object.entries(obj));
  } catch {
    sessions = new Map();
  }
}

// Save sessions
async function saveSessions() {
  await Bun.write(SESSION_FILE, JSON.stringify(Object.fromEntries(sessions)));
}

// Async voice notification (via voice agent)
async function sendVoiceNotification(message: string, phase: "work" | "complete" | "checkin" | "error" | "iteration" = "work") {
  try {
    await fetch("http://localhost:8888/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, phase, priority: 7 })
    });
  } catch (error) {
    console.error("❌ Voice notification failed:", error);
  }
}

// ============================================================================
// PHASE NOTIFICATION SYSTEM (FR3K Algorithm Progress Updates)
// ============================================================================

interface PhaseUpdate {
  phase: number;
  phaseName: string;
  title: string;
  content: string;
  timestamp?: string;
}

// Store the current progress message ID for editing
let currentProgressMessageId: number | null = null;
let typingIndicatorInterval: NodeJS.Timeout | null = null;

// Send continuous typing indicator while processing
function startTypingIndicator(userId: string | number): void {
  if (typingIndicatorInterval) return; // Already running

  typingIndicatorInterval = setInterval(async () => {
    try {
      await bot.api.sendChatAction(userId, "typing");
    } catch (error) {
      // Ignore errors - user might have stopped the interaction
    }
  }, 3000); // Send typing indicator every 3 seconds
}

function stopTypingIndicator(): void {
  if (typingIndicatorInterval) {
    clearInterval(typingIndicatorInterval);
    typingIndicatorInterval = null;
  }
}

// Send phase update to Telegram (with message editing for phases 2-7)
async function sendPhaseUpdate(update: PhaseUpdate): Promise<boolean> {
  try {
    // Get user ID from env
    const userId = parseInt(ALLOWED_USER_ID);
    if (!userId) {
      console.error("❌ No user ID configured for phase updates");
      return false;
    }

    // Format message for Telegram
    const phaseEmoji = ["", "👁️", "🧠", "📋", "🔨", "⚡", "✅", "📚"];
    const emoji = phaseEmoji[update.phase] || "🔄";

    let message = `${emoji} **PHASE ${update.phase}/7: ${update.phaseName}**\n\n`;
    message += `📌 ${update.title}\n\n`;
    message += `${update.content}`;

    // Start typing indicator on first phase
    if (update.phase === 1) {
      startTypingIndicator(userId);
    }

    // Send or edit message
    if (currentProgressMessageId && update.phase > 1) {
      // Edit existing message
      try {
        await bot.api.editMessageText(
          userId,
          currentProgressMessageId,
          message,
          { parse_mode: "Markdown" }
        );
        console.log(`✅ Phase ${update.phase} update EDITED in Telegram`);
      } catch (editError) {
        // If edit fails (message too old, deleted, etc.), send new message
        console.log(`⚠️ Edit failed, sending new message for phase ${update.phase}`);
        const sentMsg = await bot.api.sendMessage(userId, message, { parse_mode: "Markdown" });
        currentProgressMessageId = sentMsg.message_id;
      }
    } else {
      // Send new message (first phase)
      const sentMsg = await bot.api.sendMessage(userId, message, { parse_mode: "Markdown" });
      currentProgressMessageId = sentMsg.message_id;
      console.log(`✅ Phase ${update.phase} update sent to Telegram`);
    }

    // Stop typing indicator on final phase
    if (update.phase === 7) {
      stopTypingIndicator();
      currentProgressMessageId = null; // Reset for next request
    }

    return true;
  } catch (error) {
    console.error("❌ Phase update failed:", error);
    return false;
  }
}

// Start phase notification HTTP server
const phaseNotificationServer = Bun.serve({
  port: 8898,
  fetch: async (req) => {
    if (req.method === "POST" && req.url.endsWith("/api/phase-update")) {
      try {
        const update = await req.json() as PhaseUpdate;

        // Validate required fields (explicitly check for undefined/null since 0 is falsy)
        if (update.phase === undefined || update.phase === null || !update.phaseName || !update.content) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: phase, phaseName, content" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Send phase update to Telegram
        const success = await sendPhaseUpdate(update);

        return new Response(
          JSON.stringify({ success, message: success ? "Phase update sent" : "Failed to send" }),
          { status: success ? 200 : 500, headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("❌ Phase notification server error:", error);
        return new Response(
          JSON.stringify({ error: "Invalid request" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Phase Notification Server - Use POST /api/phase-update", { status: 404 });
  }
});

console.log("📡 Phase notification server listening on port 8898");

// ============================================================================
// AUDIO OVERVIEW SYSTEM
// ============================================================================

const AUDIO_DIR = "/tmp/telegram-audio";

// Ensure audio directory exists
mkdirSync(AUDIO_DIR, { recursive: true });

// Generate audio file using EdgeTTS
async function generateAudioOverview(text: string, messageId: string): Promise<string | null> {
  try {
    const filepath = join(AUDIO_DIR, `${messageId}.mp3`);

    // Generate audio with EdgeTTS
    const proc = Bun.spawn({
      cmd: ['edge-tts', '--text', text, '--voice', 'en-US-AvaNeural', '--write-media', filepath],
      stdout: 'pipe',
      stderr: 'pipe'
    });

    await proc.exited;

    if (!existsSync(filepath)) {
      console.error("❌ Audio generation failed - file not created");
      return null;
    }

    console.log(`✅ Audio generated: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error("❌ Audio generation error:", error);
    return null;
  }
}

// Send audio file via Telegram
async function sendAudioOverview(chatId: number, audioPath: string): Promise<boolean> {
  try {
    await bot.api.sendAudio(chatId, audioPath);
    console.log(`✅ Audio overview sent: ${audioPath}`);
    return true;
  } catch (error) {
    if (error instanceof GrammyError) {
      console.error("❌ Telegram audio send error:", error.description);
    } else {
      console.error("❌ Audio send error:", error);
    }
    return false;
  }
}

// Check if this is a reply to a user message vs proactive message
function isReplyToUser(msg: QueuedMessage): boolean {
  // If message has messageId and it's in response to a user Telegram message
  return !!(msg.messageId && msg.chatId);
}

// Generate comprehensive system capabilities overview
async function generateSystemCapabilitiesOverview(): Promise<string> {
  return `FR3K System Overview - built by fr3k.

I am FR3K, an advanced personal AI infrastructure running on a Raspberry Pi 5 with 29 gigabytes of storage. Let me tell you what I can do.

Core System: The FR3K Algorithm powers everything I do - a seven phase problem solving framework consisting of Observe, Think, Plan, Build, Execute, Verify, and Learn. This ensures every response is thorough, verifiable, and continuously improving.

Voice Communication: I have full two-way voice capabilities through Twilio. You can call me anytime, and I can call you automatically for hourly check-ins, system alerts, or when I detect significant events. I use Microsoft Edge TTS for natural speech synthesis and Google Gemini 2.5 Flash for fast intelligent responses.

Agent System: I run specialized background agents including a Communication Agent for Telegram messaging, a Voice Agent for audio notifications, an Autonomous Monitor for system health, and a Memory Bridge for persistent cross-session intelligence.

Skills and Capabilities: I have access to over 40 specialized skills including annual security report analysis, social media scraping with Apify, browser automation with vibium, multi-agent debate systems, creative thinking modes, OSINT gathering, people finding, LinkedIn automation, and much more.

Tool Integrations: I integrate with modern tools like goose agent framework, witr process monitoring, Cloudflare Tunnels for secure remote access, and the memU persistent memory layer for 24-7 autonomous operation.

Observability: Every action I take is fully traced with workflow execution tracking, message lineage, response validation, anti-repetition systems, and comprehensive delivery verification.

System Monitoring: I automatically track disk space, memory usage, CPU load, and systemd service health. I call you when critical thresholds are reached or when services fail.

Advanced Features: I can run parallel agents for complex tasks, perform A-B testing, handle web scraping, automate LinkedIn engagement, generate visual content, analyze security threats, and maintain continuous self-improvement.

This is what true personal AI infrastructure looks like - not just a chatbot, but a complete intelligent system that works for you 24-7.`;
}

// ============================================================================
// MESSAGE DELIVERY VERIFICATION SYSTEM
// ============================================================================

interface DeliveryResult {
  success: boolean;
  messageId?: number;
  error?: string;
  retryCount: number;
}

// Track consecutive failures per user
const consecutiveFailures = new Map<string, number>();

// Delivery metrics tracking
interface DeliveryMetrics {
  totalAttempts: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastSuccess?: Date;
  lastFailure?: Date;
}

const deliveryMetrics = new Map<string, DeliveryMetrics>();

// Exponential backoff delay
function getBackoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
}

// Update delivery metrics
function updateDeliveryMetrics(userId: string, success: boolean): void {
  const metrics = deliveryMetrics.get(userId) || {
    totalAttempts: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  };

  metrics.totalAttempts++;

  if (success) {
    metrics.successfulDeliveries++;
    metrics.lastSuccess = new Date();
  } else {
    metrics.failedDeliveries++;
    metrics.lastFailure = new Date();
  }

  deliveryMetrics.set(userId, metrics);
}

// Verify message delivery with retry logic
async function verifyMessageDelivery(
  chatId: number,
  text: string,
  userId: string,
  maxRetries: number = 3
): Promise<DeliveryResult> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      console.log(`📤 Sending message (attempt ${attempt + 1}/${maxRetries + 1}) to user ${userId}`);

      // Send the message
      const response = await bot.api.sendMessage(chatId, text);

      // For Telegram, a successful send returns the message ID
      if (response && response.message_id) {
        console.log(`✅ Message delivered successfully with ID: ${response.message_id}`);

        // Reset consecutive failures on success
        consecutiveFailures.set(userId, 0);
        updateDeliveryMetrics(userId, true);

        return {
          success: true,
          messageId: response.message_id,
          retryCount: attempt
        };
      }
    } catch (error) {
      attempt++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Message delivery failed (attempt ${attempt}):`, errorMsg);

      if (attempt <= maxRetries) {
        const delay = getBackoffDelay(attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const currentFailures = (consecutiveFailures.get(userId) || 0) + 1;
  consecutiveFailures.set(userId, currentFailures);
  updateDeliveryMetrics(userId, false);

  console.error(`💥 Message delivery failed after ${maxRetries + 1} attempts to user ${userId}`);
  console.error(`📊 Consecutive failures for user ${userId}: ${currentFailures}`);
  console.error(`📈 Total metrics for user ${userId}:`, deliveryMetrics.get(userId));

  // Send voice notification for 3 consecutive failures
  if (currentFailures >= 3) {
    await sendVoiceNotification(
      `Critical: Telegram delivery failed 3+ times for user ${userId}`,
      "error"
    );
  }

  return {
    success: false,
    error: `Failed after ${maxRetries + 1} attempts`,
    retryCount: maxRetries
  };
}

// ============================================================================
// OBSERVABILITY: Message interface with trace context
// ============================================================================

interface QueuedMessage {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  traceContext?: {
    traceParent: string;
    traceState?: string;
    traceId: string;
    spanId: string;
  };
  username?: string;
  chatId?: string;
  messageId?: number;
}

// Read message from queue (LIFO - newest first for responsiveness)
async function getNextMessage(): Promise<QueuedMessage | null> {
  try {
    const data = await Bun.readableStreamToText(Bun.file(MESSAGE_QUEUE_PATH).stream());
    const queue = JSON.parse(data) || [];

    if (queue.length === 0) return null;

    // Get LAST message (LIFO - newest first)
    const msg = queue.pop();

    // Save updated queue
    await Bun.write(MESSAGE_QUEUE_PATH, JSON.stringify(queue, null, 2));

    return msg;
  } catch {
    return null;
  }
}

// ============================================================================
// OBSERVABILITY: PAI Algorithm Phase Tracing
// ============================================================================

interface PAIProcessingResult {
  response: string;
  sessionId?: string;
  phases: {
    name: string;
    duration: number;
    subagents?: string[];
    tools?: string[];
  }[];
}

// Call PAI (Claude Code) with timeout and full observability tracing
async function callPAI(prompt: string, userId: string, traceContext?: any): Promise<PAIProcessingResult> {
  // ========================================================================
  // OBSERVE PHASE SPAN
  // ========================================================================
  const observeSpan = tracer.span.paiPhase("OBSERVE", {
    "pai.prompt.length": prompt.length,
    "pai.user.id": userId,
  });

  const sessionId = sessions.get(userId);
  const claudePath = "/home/fr3k/.nvm/versions/node/v24.13.0/bin/claude";

  // ========================================================================
  // MCP CONTEXT ENRICHMENT (Phase 1: hey-fr3k integration)
  // ========================================================================
  let enrichedPrompt = prompt;
  try {
    const { enrichMessageWithContext } = await import("./mcp-context.ts");
    const context = await enrichMessageWithContext(prompt);

    if (context && context.length > 0) {
      enrichedPrompt = `${context}\n\n[TELEGRAM] ${prompt}`;
      console.log("📚 Context enriched via MCP");
      observeSpan.setAttribute("mcp.context.enriched", "true");
    } else {
      enrichedPrompt = `[TELEGRAM] ${prompt}`;
    }
  } catch (error) {
    console.log("⚠️ MCP context enrichment unavailable, using raw prompt");
    enrichedPrompt = `[TELEGRAM] ${prompt}`;
  }

  const telegramPrompt = enrichedPrompt;

  observeSpan.setAttribute("pai.session.resumed", !!sessionId);
  tracer.span.success(observeSpan);
  observeSpan.end();

  // ========================================================================
  // THINK PHASE SPAN
  // ========================================================================
  const thinkSpan = tracer.span.paiPhase("THINK", {
    "pai.capabilities.assessing": true,
  });

  // Build args - prompt goes via stdin, not as argument
  const args = ["-p", "--output-format", "json"];

  if (sessionId) {
    args.push("--resume", sessionId);
  }

  thinkSpan.setAttribute("pai.args", JSON.stringify(args));
  tracer.span.success(thinkSpan);
  thinkSpan.end();

  // ========================================================================
  // PLAN PHASE SPAN
  // ========================================================================
  const planSpan = tracer.span.paiPhase("PLAN", {
    "pai.timeout.configured": "930000",
  });

  // Extended timeout for complex PAI responses (15.5 minutes)
  const TIMEOUT_MS = 930000; // 15.5 minutes instead of 60s

  // Progress notification timer - EVERY 5 MINUTES
  const PROGRESS_INTERVAL_MS = 300000; // 5 minutes
  let progressCounter = 0;

  // Track last heartbeat for adaptive timeout
  let lastHeartbeatTime = Date.now();

  const progressTimer = setInterval(() => {
    progressCounter++;
    const minutesElapsed = progressCounter * 5;

    // Update last heartbeat time for activity detection
    lastHeartbeatTime = Date.now();

    console.log(`⏰ Sending progress update: ${minutesElapsed} minutes elapsed`);

    // Send voice notification
    sendVoiceNotification(
      `Still working on your request... ${minutesElapsed} minutes so far`,
      "work"
    );

    // Send Telegram progress update
    verifyMessageDelivery(
      parseInt(ALLOWED_USER_ID),
      `⏳ Still working...\n\n🕐 ${minutesElapsed} minutes elapsed\n🔄 Task in progress\n\nWill send full response when complete.`,
      "progress"
    );

  }, PROGRESS_INTERVAL_MS);

  planSpan.setAttribute("pai.progress.timer.configured", PROGRESS_INTERVAL_MS.toString());
  tracer.span.success(planSpan);
  planSpan.end();

  // ========================================================================
  // BUILD PHASE SPAN - Execute the PAI call
  // ========================================================================
  const buildSpan = tracer.span.paiPhase("BUILD", {
    "pai.claude.path": claudePath,
  });

  // ============================================================================
  // ADAPTIVE TIMEOUT: Extends if task is still active (sending heartbeats)
  // ============================================================================
  const timeoutPromise = new Promise<never>((_, reject) => {
    let currentTimeout = TIMEOUT_MS; // Start at 15.5 minutes
    let extensionCount = 0;
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;

    const checkAndExtendTimeout = () => {
      const elapsed = Date.now() - startTime;
      const timeRemaining = currentTimeout - elapsed;

      // Check 30 seconds before timeout
      if (timeRemaining <= 30000 && timeRemaining > 0) {
        const timeSinceHeartbeat = Date.now() - lastHeartbeatTime;

        // If heartbeat received in last 3 minutes, task is still active
        if (timeSinceHeartbeat < 180000) {
          extensionCount++;
          const newTimeout = currentTimeout + 120000; // Add 2 minutes
          const oldMinutes = Math.floor(currentTimeout / 60000);
          const newMinutes = Math.floor(newTimeout / 60000);

          console.log(`🔄 Task still active! Extending timeout from ${oldMinutes} to ${newMinutes} minutes (extension #${extensionCount})`);

          // Send voice notification
          sendVoiceNotification(
            `Task still active after ${newMinutes} minutes. Extending timeout.`,
            "work"
          );

          // Send Telegram extension notification
          verifyMessageDelivery(
            parseInt(ALLOWED_USER_ID),
            `⏳ **Timeout Extended!**\n\n🕐 ${newMinutes} minutes total (was ${oldMinutes})\n🔄 Task is still active\n📊 Extension #${extensionCount}\n\nWill continue working...`,
            "extension"
          );

          // Extend timeout
          currentTimeout = newTimeout;

          // Schedule next check 2 minutes from now (before new timeout)
          timeoutId = setTimeout(checkAndExtendTimeout, 120000);
          return;
        }
      }

      // No activity or first run - set timeout for remaining time
      const remainingMs = Math.max(0, timeRemaining);
      timeoutId = setTimeout(() => {
        const finalMinutes = Math.floor(currentTimeout / 60000);
        reject(new Error(`PAI call timeout after ${finalMinutes} minutes (${extensionCount} extensions applied)`));
      }, remainingMs);
    };

    // Start initial timeout check
    checkAndExtendTimeout();
  });

  const paiPromise = (async () => {
    console.log(`📞 Calling PAI with prompt: ${prompt.substring(0, 40)}...`);

    // Use shell to pipe the prompt to claude
    const shellScript = `
      echo ${JSON.stringify(telegramPrompt)} | ${claudePath} ${args.join(' ')}
    `;

    // Create tool span for the actual CLI invocation
    const toolSpan = tracer.span.tool("claude.cli", {
      "cli.command": claudePath,
      "cli.args": JSON.stringify(args),
      "cli.input.length": telegramPrompt.length,
    });

    const proc = Bun.spawn({
      cmd: ["/bin/bash", "-c", shellScript],
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:/home/fr3k/.nvm/versions/node/v24.13.0/bin`,
        TELEGRAM_BOT_REQUEST: '1',
        // Propagate trace context to PAI subprocess
        ...(traceContext?.traceParent ? { [`traceparent=${traceContext.traceParent}`]: '1' } : {}),
      }
    });

    const output = await new Response(proc.stdout).text();

    toolSpan.setAttribute("cli.output.length", output?.length || 0);

    if (!output || output.length === 0) {
      tracer.span.error(toolSpan, new Error("Empty response from PAI"));
      toolSpan.end();
      throw new Error("Empty response from PAI");
    }

    const result = JSON.parse(output);

    console.log(`✓ PAI response received: ${result.result?.substring(0, 50) || "No response"}...`);

    toolSpan.setAttribute("cli.session.id", result.session_id || "none");
    tracer.span.success(toolSpan);
    toolSpan.end();

    clearInterval(progressTimer); // Cancel progress notifications

    return {
      response: result.result || "No response from PAI",
      sessionId: result.session_id,
      phases: [
        { name: "OBSERVE", duration: Date.now() - (observeSpan.startTime as number) },
        { name: "THINK", duration: Date.now() - (thinkSpan.startTime as number) },
        { name: "PLAN", duration: Date.now() - (planSpan.startTime as number) },
        { name: "BUILD", duration: Date.now() - (buildSpan.startTime as number) },
      ],
    };
  })();

  try {
    const result = await Promise.race([paiPromise, timeoutPromise]);
    tracer.span.success(buildSpan);
    buildSpan.end();

    // ========================================================================
    // EXECUTE PHASE SPAN
    // ========================================================================
    const executeSpan = tracer.span.paiPhase("EXECUTE", {
      "pai.response.length": result.response.length,
    });

    if (result.sessionId) {
      sessions.set(userId, result.sessionId);
      await saveSessions();
      executeSpan.setAttribute("pai.session.saved", result.sessionId);
    }

    tracer.span.success(executeSpan);
    executeSpan.end();

    // ========================================================================
    // VERIFY PHASE SPAN
    // ========================================================================
    const verifySpan = tracer.span.paiPhase("VERIFY", {
      "pai.response.valid": result.response.length > 0,
    });

    tracer.span.success(verifySpan);
    verifySpan.end();

    // ========================================================================
    // LEARN PHASE SPAN
    // ========================================================================
    const learnSpan = tracer.span.paiPhase("LEARN", {
      "pai.session.count": sessions.size,
    });

    tracer.span.success(learnSpan);
    learnSpan.end();

    return result;
  } catch (error) {
    tracer.span.error(buildSpan, error as Error);
    buildSpan.end();
    clearTimeout(progressTimer); // Clean up timer
    console.error("❌ PAI call failed:", error);
    return {
      response: `Sorry, I'm having trouble connecting right now. ${error instanceof Error ? error.message : ''}`,
      phases: [],
    };
  }
}

// Process messages from queue
async function processMessageQueue() {
  if (isProcessing) return;

  const msg = await getNextMessage();
  if (!msg) return;

  // ========================================================================
  // OBSERVABILITY: Multi-instance race detection
  // ========================================================================
  const tracker = getInstanceTracker();
  const traceId = msg.traceContext?.traceId || `trace-${Date.now()}`;

  // Check if another instance is already processing this message/trace
  if (!tracker.tryAcquireLock(msg.id, traceId)) {
    console.log(`⚠️ Message ${msg.id} already being processed by another instance`);
    return;
  }

  isProcessing = true;
  console.log(`🔄 Processing: ${msg.text.substring(0, 50)}...`);

  // ========================================================================
  // OBSERVABILITY: Start workflow execution tracking
  // ========================================================================
  const workflowStore = getWorkflowStore();
  const lineageStore = getMessageLineage();

  // Add user message to lineage
  lineageStore.addUserMessage(
    msg.id,
    msg.text,
    msg.userId,
    traceId,
    {
      username: msg.username,
      chatId: msg.chatId,
    }
  );

  // Create processing span with trace context propagation
  const processSpan = tracer.span.telegram({
    "telegram.message.id": msg.id,
    "telegram.message.text": msg.text,
    "telegram.user.id": msg.userId,
    "telegram.processing.started": new Date().toISOString(),
  });

  // If we have trace context from the communication agent, link it
  if (msg.traceContext) {
    processSpan.setAttribute("trace.parent_id", msg.traceContext.traceId);
  }

  // Start workflow execution
  const execution = workflowStore.startExecution(
    traceId,
    processSpan.spanContext().spanId,
    {
      id: msg.id,
      text: msg.text,
      userId: msg.userId,
      username: msg.username,
      chatId: msg.chatId,
      messageId: msg.messageId,
      timestamp: Date.now(),
    },
    {
      instanceId: tracker.getMyInstanceId(),
      hostname: process.env.HOSTNAME || "localhost",
      processedBy: "main-bot",
    }
  );

  try {
    // Voice: starting work
    await sendVoiceNotification(`Processing: ${msg.text.substring(0, 120)}`, "work");

    // Update workflow - OBSERVE phase starting
    workflowStore.addPhase(traceId, "OBSERVE", "in_progress");

    // Call PAI with trace context - retry on incomplete responses
    const MAX_RETRIES = 3;
    let result: Awaited<ReturnType<typeof callPAI>>;
    let validationResult = { isValid: false, reason: "" };
    let attempt = 0;

    do {
      attempt++;
      console.log(`🔄 PAI call attempt ${attempt}/${MAX_RETRIES}`);

      result = await callPAI(msg.text, msg.userId, msg.traceContext);
      validationResult = validatePAIResponse(result.response);

      if (validationResult.isValid) {
        console.log(`✅ PAI response validation passed (attempt ${attempt})`);
        break;
      }

      console.warn(`⚠️ PAI response validation failed (attempt ${attempt}): ${validationResult.reason}`);
      console.warn(`⚠️ Response length: ${result.response.length}`);
      console.warn(`⚠️ Response preview: ${result.response.substring(0, 100)}...`);

      if (attempt < MAX_RETRIES) {
        const delayMs = attempt * 1000; // 1s, 2s, 3s delays
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } while (!validationResult.isValid && attempt < MAX_RETRIES);

    // If all retries failed, just use the last response anyway
    if (!validationResult.isValid) {
      console.warn(`⚠️ All retries failed, using last response despite validation issue`);
      // Don't send error to user - just log it and continue with the response
      processSpan.setAttribute("pai.response.validation.bypassed", true);
      processSpan.setAttribute("pai.response.validation.reason", validationResult.reason);
    }

    // Log successful validation
    const validationRate = Math.round(responseValidationStats.validResponses/responseValidationStats.totalResponses*100);
    console.log(`✅ PAI response validation passed (${result.response.length} characters)`);
    console.log(`📊 Validation stats: ${responseValidationStats.validResponses}/${responseValidationStats.totalResponses} passed (${validationRate}%)`);
    processSpan.setAttribute("pai.response.validation.passed", true);
    processSpan.setAttribute("pai.response.length", result.response.length);

    // Update workflow - OBSERVE complete, THINK through LEARN phases
    workflowStore.completePhase(traceId, "OBSERVE");
    workflowStore.completePhase(traceId, "THINK");
    workflowStore.completePhase(traceId, "PLAN");
    workflowStore.completePhase(traceId, "BUILD");
    workflowStore.completePhase(traceId, "EXECUTE");
    workflowStore.completePhase(traceId, "VERIFY");
    workflowStore.completePhase(traceId, "LEARN");

    // Add subagent tracking to span
    if (result.phases) {
      result.phases.forEach(phase => {
        processSpan.setAttribute(`pai.phase.${phase.name}.duration`, phase.duration);
        if (phase.subagents) {
          processSpan.setAttribute(`pai.phase.${phase.name}.subagents`, phase.subagents.join(","));
        }
      });
    }

    // Process response through anti-repetition system
    const messageId = `response-${Date.now()}-${msg.userId}`;
    const { finalResponse: processedResponse, wasModified, similarity } = antiRepetitionSystem.processResponse(
      result.response,
      msg.userId,
      messageId
    );

    // Check if response contains Algorithm phases - if so, send incremental updates
    if (isAlgorithmResponse(processedResponse)) {
      console.log("🔍 Algorithm response detected - sending phase updates...");
      await processAlgorithmPhases(processedResponse, bot, parseInt(ALLOWED_USER_ID));
    }

    // Log repetition detection
    if (wasModified) {
      console.log(`🔄 Response modified due to repetition (similarity: ${Math.round(similarity * 100)}%)`);
      processSpan.setAttribute("anti.repetition.detected", true);
      processSpan.setAttribute("anti.repetition.similarity", similarity);
      processSpan.setAttribute("anti.response.modified", true);
    } else {
      processSpan.setAttribute("anti.repetition.detected", false);
    }

    // Send response via Telegram with delivery verification
    const chatId = parseInt(ALLOWED_USER_ID);

    // Check if this is a proactive message (not a reply) - send audio overview first
    const isProactiveMessage = !isReplyToUser(msg);

    if (isProactiveMessage) {
      console.log("🎙️ Proactive message detected - generating audio overview...");

      // Generate audio overview for the response
      const audioMessageId = `audio-${Date.now()}-${msg.userId}`;
      const audioPath = await generateAudioOverview(processedResponse, audioMessageId);

      if (audioPath) {
        // Send audio first
        const audioSent = await sendAudioOverview(chatId, audioPath);

        if (audioSent) {
          console.log("✅ Audio overview sent successfully");
          processSpan.setAttribute("telegram.audio.sent", true);
        } else {
          console.log("⚠️ Audio send failed, proceeding with text only");
        }
      }
    }

    const deliveryResult = await verifyMessageDelivery(
      chatId,
      `🤖 PAI Response:\n\n${processedResponse}`,
      msg.userId
    );

    if (!deliveryResult.success) {
      console.error("❌ Main response delivery failed:", deliveryResult.error);
      // Try to send error notification
      try {
        await sendVoiceNotification(
          `Failed to deliver response to user ${msg.userId}`,
          "error"
        );
      } catch (voiceError) {
        console.error("❌ Voice notification also failed:", voiceError);
      }
    } else {
      processSpan.setAttribute("telegram.response.delivered", true);
      processSpan.setAttribute("telegram.message.id", deliveryResult.messageId);

      // Add response to conversation history
      addToConversationHistory(msg.text, processedResponse);
      console.log("📝 Response added to conversation history");
    }

    processSpan.setAttribute("telegram.response.sent", true);
    tracer.span.success(processSpan);

    // ========================================================================
    // OBSERVABILITY: Complete workflow and add PAI response to lineage
    // ========================================================================
    workflowStore.completeExecution(traceId, result.response, result.sessionId);

    lineageStore.addPAIResponse(
      `pai-${msg.id}`,
      result.response,
      msg.userId,
      msg.id,
      traceId,
      {
        sessionId: result.sessionId,
        responseLength: result.response.length,
      }
    );

    if (result.sessionId) {
      lineageStore.updateSessionId(msg.id, result.sessionId);
    }

    // Voice: complete
    await sendVoiceNotification("Response delivered", "complete");

    console.log("✅ Message processed");
  } catch (error) {
    console.error("❌ Processing error:", error);
    tracer.span.error(processSpan, error as Error);

    // ========================================================================
    // OBSERVABILITY: Mark workflow as failed
    // ========================================================================
    workflowStore.failExecution(traceId, (error as Error).message);

    // Send error message with delivery verification
    const errorResult = await verifyMessageDelivery(
      parseInt(ALLOWED_USER_ID),
      `❌ Error processing message: ${error instanceof Error ? error.message : String(error)}`,
      msg.userId,
      2 // Fewer retries for error messages
    );

    if (!errorResult.success) {
      console.error("❌ Error message delivery failed:", errorResult.error);
      // Try voice notification as fallback
      try {
        await sendVoiceNotification(
          `Critical: Cannot deliver error message to user ${msg.userId}`,
          "error"
        );
      } catch (voiceError) {
        console.error("❌ Voice fallback also failed:", voiceError);
      }
    }
    await sendVoiceNotification("Processing failed", "error");
  } finally {
    processSpan.end();
    isProcessing = false;

    // ========================================================================
    // OBSERVABILITY: Release instance lock
    // ========================================================================
    tracker.releaseLock();
  }
}

// Check for new messages flag
async function checkNewMessageFlag(): Promise<boolean> {
  try {
    const exists = await Bun.file(NEW_MESSAGE_FLAG).exists();
    if (exists) {
      unlinkSync(NEW_MESSAGE_FLAG);
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

// Main processing loop
async function mainLoop() {
  // Check if communication agent flagged new message
  const hasFlag = await checkNewMessageFlag();

  if (hasFlag) {
    console.log("🚩 New message flag detected");
    await processMessageQueue();
  }

  // Continue monitoring
  setTimeout(mainLoop, 500); // Check every 500ms
}

// Status endpoint for monitoring

// Start
console.log("🚀 PAI Telegram Bot Starting...");
await loadSessions();

// Clear any stale messages from previous runs (fresh start)
await Bun.write(MESSAGE_QUEUE_PATH, "[]");
console.log("🧹 Queue cleared - ready for fresh messages");

// Start monitoring loop
console.log("🔄 Starting monitoring loop...");
mainLoop();

console.log("✅ Main bot ready! Monitoring message queue...");

// Start parallel agent metrics server in background
const metricsServer = Bun.spawn({
  cmd: ["/home/fr3k/.bun/bin/bun", "run", "./parallel-agents/metrics-server.ts"],
  cwd: process.cwd(),
  stdout: "pipe",
  stderr: "pipe"
});

console.log("📊 Parallel agent metrics server starting on port 9090");

// Keep process alive with periodic heartbeat
setInterval(async () => {
  // Heartbeat - just to keep process alive
  const now = new Date();
  if (now.getSeconds() === 0) {
    console.log(`💓 Main bot alive at ${now.toISOString()}`);

    // Log parallel system status periodically
    try {
      const status = await parallelProcessor.getStatus();
      console.log(`🤖 Parallel agents: ${status.totalAgents} active, ${status.successRate} success rate`);
    } catch (error) {
      console.log("⚠️  Parallel system status unavailable");
    }
  }
}, 60000); // Every minute
// Startup notification removed to avoid repetitive messages

// Keep process alive
const shutdown = () => {
  console.log("\n🛑 Main bot shutting down...");
  bot.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
