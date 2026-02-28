#!/usr/bin/env bun
/**
 * PAI Voice Agent - Async notification system
 *
 * Handles all voice notifications without blocking main PAI workflow.
 * Runs as independent background process.
 */

const VOICE_SERVER = process.env.PAI_VOICE_SERVER || "http://localhost:8888";
const NOTIFICATION_QUEUE_PATH = "/tmp/pai-voice-queue.json";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

interface VoiceNotification {
  id: string;
  message: string;
  phase: "work" | "complete" | "checkin" | "error" | "iteration";
  priority: number; // 1-10, 10 is highest
  timestamp: number;
}

let voiceQueue: VoiceNotification[] = [];
let isProcessing = false;

// Voice IDs for different phases
const VOICE_IDS = {
  work: "21m00Tcm4TlvDq8ikWAM", // Default
  complete: "21m00Tcm4TlvDq8ikWAM", // Can customize
  checkin: "21m00Tcm4TlvDq8ikWAM",
  error: "21m00Tcm4TlvDq8ikWAM",
  iteration: "21m00Tcm4TlvDq8ikWAM"
};

// Load queue
async function loadQueue() {
  try {
    const data = await Bun.readableStreamToText(Bun.file(NOTIFICATION_QUEUE_PATH).stream());
    voiceQueue = JSON.parse(data) || [];
  } catch {
    voiceQueue = [];
  }
}

// Save queue
async function saveQueue() {
  await Bun.write(NOTIFICATION_QUEUE_PATH, JSON.stringify(voiceQueue, null, 2));
}

// Send voice notification
async function sendVoice(notification: VoiceNotification): Promise<boolean> {
  const voiceId = VOICE_IDS[notification.phase] || DEFAULT_VOICE_ID;

  try {
    const response = await fetch(`${VOICE_SERVER}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: notification.message,
        voice_id: voiceId
      }),
      // Timeout after 15 seconds (ElevenLabs API can take 5-10 seconds)
      signal: AbortSignal.timeout(15000)
    });

    if (response.ok) {
      console.log(`🔊 [${notification.phase.toUpperCase()}] ${notification.message.substring(0, 50)}`);
      return true;
    } else {
      console.error(`❌ Voice failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Voice notification error:", error);
    return false;
  }
}

// Process queue (high priority first)
async function processQueue() {
  if (isProcessing || voiceQueue.length === 0) return;

  isProcessing = true;

  // Sort by priority (highest first)
  voiceQueue.sort((a, b) => b.priority - a.priority);

  while (voiceQueue.length > 0) {
    const notification = voiceQueue.shift();
    if (!notification) break;

    await saveQueue();

    const success = await sendVoice(notification);

    if (!success) {
      // Re-queue with lower priority
      notification.priority = Math.max(1, notification.priority - 1);
      voiceQueue.push(notification);
      await saveQueue();

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      break;
    }
  }

  isProcessing = false;
}

// Queue a notification (can be called from anywhere)
export async function queueVoiceNotification(
  message: string,
  phase: VoiceNotification["phase"] = "work",
  priority: number = 5
) {
  const notification: VoiceNotification = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    phase,
    priority,
    timestamp: Date.now()
  };

  voiceQueue.push(notification);
  await saveQueue();

  // Trigger processing
  processQueue().catch(console.error);
}

// Priority presets for common events
export const VoicePriority = {
  CRITICAL: 10,  // Errors, emergencies
  HIGH: 8,       // User messages, completions
  NORMAL: 5,     // Phase transitions, updates
  LOW: 3,        // Status, background tasks
  MINIMAL: 1     // Debug, logs
};

// API for other agents to send notifications
export async function notifyWork(message: string) {
  return queueVoiceNotification(message, "work", VoicePriority.HIGH);
}

export async function notifyComplete(message: string) {
  return queueVoiceNotification(message, "complete", VoicePriority.HIGH);
}

export async function notifyIteration(message: string) {
  return queueVoiceNotification(message, "iteration", VoicePriority.NORMAL);
}

export async function notifyCheckin(message: string) {
  return queueVoiceNotification(message, "checkin", VoicePriority.NORMAL);
}

export async function notifyError(message: string) {
  return queueVoiceNotification(message, "error", VoicePriority.CRITICAL);
}

// Background processing loop
setInterval(() => {
  processQueue().catch(console.error);
}, 1000); // Check every second

// HTTP API for other processes to queue notifications
Bun.serve({
  port: 8989,
  fetch: async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/notify") {
      try {
        const body = await req.json();
        await queueVoiceNotification(
          body.message || "Notification",
          body.phase || "work",
          body.priority || VoicePriority.NORMAL
        );
        return Response.json({ success: true, queued: voiceQueue.length });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
      }
    }

    if (url.pathname === "/status") {
      return Response.json({
        queueSize: voiceQueue.length,
        processing: isProcessing,
        uptime: process.uptime()
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
});

// Start
console.log("🔊 PAI Voice Agent Starting...");
await loadQueue();
console.log("✅ Voice Agent ready! Listening on :8989");
console.log("📡 HTTP API: http://localhost:8989/notify");

// Startup notification
await queueVoiceNotification("Voice agent online. Ready for notifications.", "complete", VoicePriority.HIGH);

// Keep alive
const shutdown = () => {
  console.log("\n🛑 Voice Agent shutting down...");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
