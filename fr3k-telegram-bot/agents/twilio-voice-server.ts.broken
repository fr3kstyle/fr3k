#!/usr/bin/env bun
/**
 * FR3K Twilio Voice Conversation Server with EdgeTTS
 *
 * Enables two-way voice conversations with FR3K via Twilio phone calls.
 * Uses EdgeTTS for text-to-speech (FREE) and Twilio's speech recognition.
 */

import { serve } from "bun";
import { spawn } from "child_process";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const PORT = 8080;
const FR3K_CLAUDE = "/home/fr3k/.nvm/versions/node/v24.13.0/bin/claude";
const AUDIO_DIR = "/tmp/twilio-audio";

// Ensure audio directory exists
try {
  spawn('mkdir', ['-p', AUDIO_DIR]);
} catch (e) {
  // Directory exists or created
}

// ============================================================================
// EDGE TTS SPEECH SYNTHESIS
// ============================================================================

/**
 * Generate speech using EdgeTTS and return public URL
 */
async function generateEdgeTTSAudio(text: string, callId: string): Promise<string> {
  const filename = `${callId}-${Date.now()}.mp3`;
  const filepath = join(AUDIO_DIR, filename);
  const publicUrl = `https://three-queens-wait.loca.lt/audio/${filename}`;

  try {
    console.log(`[EdgeTTS] Generating audio for: "${text.substring(0, 50)}..."`);

    // Generate audio using EdgeTTS
    const proc = Bun.spawn([
      'edge-tts',
      '--text', text,
      '--voice', 'en-US-AvaNeural',  // US English female voice
      '--write-media', filepath
    ], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    await proc.exited;

    // Verify file was created
    if (!existsSync(filepath)) {
      throw new Error('Audio file not created');
    }

    const stats = await Bun.file(filepath).size;
    console.log(`[EdgeTTS] Generated ${stats} bytes: ${filename}`);

    return publicUrl;
  } catch (error) {
    console.error(`[EdgeTTS] Generation failed:`, error);
    throw error;
  }
}

// ============================================================================
// TWIML GENERATION (with EdgeTTS)
// ============================================================================

/**
 * Generate TwiML for phone call flow with EdgeTTS greeting
 */
async function generateTwiML(
  gatherSpeech: boolean = true,
  message?: string
): Promise<string> {
  if (message && !gatherSpeech) {
    // Generate audio for notification message
    const tempId = `notify-${Date.now()}`;
    try {
      const audioUrl = await generateEdgeTTSAudio(message, tempId);
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Hangup/>
</Response>`;
    } catch (e) {
      // Fallback to Twilio TTS if EdgeTTS fails
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXML(message)}</Say>
  <Hangup/>
</Response>`;
    }
  }

  // Generate audio for greeting
  const greeting = "Hello, this is F R E K. I'm listening. How can I help you today?";
  const tempId = `greeting-${Date.now()}`;

  try {
    const audioUrl = await generateEdgeTTSAudio(greeting, tempId);

    // Interactive conversation flow with EdgeTTS
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
  </Gather>
  <Redirect method="POST">/reprompt</Redirect>
</Response>`;
  } catch (e) {
    // Fallback to Twilio TTS
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
    <Say voice="alice">${greeting}</Say>
  </Gather>
  <Redirect method="POST">/reprompt</Redirect>
</Response>`;
  }
}

/**
 * Generate TwiML for reprompt
 */
async function generateRepromptTwiML(): Promise<string> {
  const reprompt = "I didn't catch that. Could you please repeat?";
  const tempId = `reprompt-${Date.now()}`;

  try {
    const audioUrl = await generateEdgeTTSAudio(reprompt, tempId);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
  </Gather>
  <Redirect method="POST">/reprompt</Redirect>
</Response>`;
  } catch (e) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
    <Say voice="alice">${reprompt}</Say>
  </Gather>
  <Redirect method="POST">/reprompt</Redirect>
</Response>`;
  }
}

/**
 * Escape special characters for XML/TwiML
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate TwiML with FR3K's response (using EdgeTTS)
 */
async function generateConversationTwiML(response: string): Promise<string> {
  // Clean up markdown and special characters for speech
  let spoken = response
    .replace(/\*\*[^*]+\*\*/g, '') // Remove bold markdown
    .replace(/\*[^*]+\*/g, '')    // Remove italic markdown
    .replace(/`[^`]+`/g, '')      // Remove code markdown
    .replace(/#{1,6}\s+/g, '')    // Remove markdown headers
    .substring(0, 500);           // Limit length

  const tempId = `response-${Date.now()}`;

  try {
    const audioUrl = await generateEdgeTTSAudio(spoken, tempId);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
  </Gather>
  <Redirect method="POST">/goodbye</Redirect>
</Response>`;
  } catch (e) {
    // Fallback to Twilio TTS
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXML(spoken)}</Say>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
    <Say voice="alice">What else can I help with?</Say>
  </Gather>
  <Redirect method="POST">/goodbye</Redirect>
</Response>`;
  }
}

/**
 * Generate goodbye TwiML
 */
async function generateGoodbyeTwiML(): Promise<string> {
  const goodbye = "Thank you for calling. Goodbye!";
  const tempId = `goodbye-${Date.now()}`;

  try {
    const audioUrl = await generateEdgeTTSAudio(goodbye, tempId);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Hangup/>
</Response>`;
  } catch (e) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${goodbye}</Say>
  <Hangup/>
</Response>`;
  }
}

// ============================================================================
// CALL FR3K FOR PROCESSING
// ============================================================================

async function callFR3K(userInput: string, conversationId: string): Promise<string> {
  try {
    console.log(`[FR3K] Processing: "${userInput.substring(0, 50)}..."`);

    // Call FR3K via CLI with conversation context
    const prompt = `[TWILIO VOICE CALL ${conversationId}] ${userInput}`;

    const proc = Bun.spawn({
      cmd: ['bash', '-c', `echo ${JSON.stringify(prompt)} | ${FR3K_CLAUDE} -p --output-format json`],
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:/home/fr3k/.nvm/versions/node/v24.13.0/bin`
      }
    });

    const output = await new Response(proc.stdout).text();

    if (!output || output.length === 0) {
      return "I'm having trouble connecting right now. Please try again later.";
    }

    const result = JSON.parse(output);
    return result.result || "I processed your request but don't have a response.";

  } catch (error) {
    console.error('[FR3K] Call failed:', error);
    return "I apologize, but I encountered an error processing your request.";
  }
}

// ============================================================================
// TWILIO WEBHOOK SERVER
// ============================================================================

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    console.log(`[Twilio] ${req.method} ${url.pathname}`);

    // Health check endpoint
    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json({
        status: "healthy",
        port: PORT,
        service: "FR3K Twilio Voice Server"
      });
    }

    // Serve audio files for Twilio Play verb
    if (url.pathname.startsWith("/audio/") && req.method === "GET") {
      const filename = url.pathname.split("/audio/")[1];
      const filepath = join(AUDIO_DIR, filename);

      if (existsSync(filepath)) {
        const file = Bun.file(filepath);
        return new Response(file.stream(), {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache"
          }
        });
      }

      return new Response("Audio not found", { status: 404 });
    }

    // Twilio webhook: Incoming call
    if (url.pathname === "/call" && req.method === "POST") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") as string;
      const from = formData.get("From") as string;

      console.log(`[Twilio] Incoming call from ${from}, CallSid: ${callSid}`);

      // Return TwiML to gather speech (async now)
      const twiml = await generateTwiML(true);

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // Twilio webhook: Speech gathered from user
    if (url.pathname === "/conversation" && req.method === "POST") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") as string;
      const speechResult = formData.get("SpeechResult") as string;

      console.log(`[Twilio] Speech received: "${speechResult?.substring(0, 50)}..."`);

      // Call FR3K with user input
      const response = await callFR3K(speechResult || "", callSid);

      console.log(`[Twilio] FR3K response: "${response.substring(0, 50)}..."`);

      // Return TwiML with FR3K's response (async now)
      const twiml = await generateConversationTwiML(response);

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // Twilio webhook: Reprompt (no speech detected)
    if (url.pathname === "/reprompt" && req.method === "POST") {
      const twiml = await generateRepromptTwiML();

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // Twilio webhook: Goodbye (end of conversation)
    if (url.pathname === "/goodbye" && req.method === "POST") {
      const twiml = await generateGoodbyeTwiML();

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // 404 for unknown routes
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🎙️  FR3K Twilio Voice Server running on port ${PORT}`);
console.log(`📞 Configure Twilio webhook: https://your-public-url:${PORT}/call`);
console.log(`🔧 Health check: http://localhost:${PORT}/health`);

// Optional: Send startup notification
setTimeout(async () => {
  try {
    await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Twilio voice conversation server online on port 8080',
        priority: 7
      })
    });
  } catch (e) {
    // Voice server not ready, ignore
  }
}, 2000);
