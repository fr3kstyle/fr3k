#!/usr/bin/env bun
/**
 * PAI Voice Notification Server
 *
 * Provides /notify endpoint for voice notifications
 * Uses EdgeTTS for text-to-speech (FREE)
 */

const PORT = 8888;

interface NotifyRequest {
  message: string;
  title?: string;
  voice_id?: string;
  voice_enabled?: boolean;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", server: "pai-voice-server", port: PORT });
    }

    // Notify endpoint
    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const body: NotifyRequest = await req.json();
        const { message, title = "Notification", voice_enabled = true } = body;

        if (!message) {
          return Response.json({ error: "message is required" }, { status: 400 });
        }

        console.log(`[Voice] ${title}: ${message}`);

        if (voice_enabled) {
          // Generate TTS and play
          const proc = Bun.spawn([
            "edge-tts",
            "--text", message,
            "--voice", "en-US-AvaNeural",
            "--write-media", "/tmp/voice-notification.mp3"
          ], {
            stdout: "pipe",
            stderr: "pipe"
          });

          await proc.exited;

          // Play the audio
          const playProc = Bun.spawn(["paplay", "/tmp/voice-notification.mp3"], {
            stdout: "pipe",
            stderr: "pipe"
          });

          await playProc.exited;
        }

        return Response.json({ success: true, message: "Notification sent" });

      } catch (error: any) {
        console.error("[Voice] Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`🔊 PAI Voice Server running on http://localhost:${PORT}`);
console.log(`🎤 EdgeTTS voice: en-US-AvaNeural`);
console.log(`📡 Health check: http://localhost:${PORT}/health`);
