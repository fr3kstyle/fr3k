#!/usr/bin/env bun
/**
 * FR3K Twilio Voice Server - Quick Fix
 * Uses EdgeTTS for speech synthesis
 */

import { serve } from "bun";
import { spawn } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const PORT = 8080;
const AUDIO_DIR = "/tmp/twilio-audio";

// Create audio directory
spawn('mkdir', ['-p', AUDIO_DIR]);

// EdgeTTS generation
async function generateAudio(text: string, id: string): Promise<string> {
  const filepath = join(AUDIO_DIR, `${id}.mp3`);

  const proc = Bun.spawn([
    'edge-tts',
    '--text', text,
    '--voice', 'en-US-AvaNeural',
    '--write-media', filepath
  ], { stdout: 'pipe', stderr: 'pipe' });

  await proc.exited;

  if (!existsSync(filepath)) {
    throw new Error('Audio generation failed');
  }

  return `https://sperm-practical-milan-keys.trycloudflare.com/audio/${id}.mp3`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Clean markdown for speech
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*[^*]+\*\*/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#{1,6}\s+/g, '')
    .substring(0, 500);
}

// Gemini 2.5 Flash API for fast responses
const GEMINI_API_KEY = "AIzaSyChw1CL2kcer7tV0zxKEucmGwS1MrVvSAs";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Run shell command and get output
async function runCommand(cmd: string[]): Promise<string> {
  try {
    const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' });
    await proc.exited;
    const output = await new Response(proc.stdout).text();
    return output.trim();
  } catch {
    return "";
  }
}

// Gather system context based on user input
async function getSystemContext(input: string): Promise<string> {
  const lowerInput = input.toLowerCase();
  let context = "";

  // Always include basic system info
  const uptime = await runCommand(['uptime']);
  context += `\n\nSYSTEM UPTIME:\n${uptime}`;

  // Disk space queries (or always include)
  if (lowerInput.includes('disk') || lowerInput.includes('space') || lowerInput.includes('storage') || lowerInput.includes('agent') || lowerInput.includes('background') || lowerInput.includes('what')) {
    const df = await runCommand(['df', '-h', '/']);
    context += `\n\nSYSTEM DISK INFO:\n${df}`;
  }

  // Memory queries
  if (lowerInput.includes('memory') || lowerInput.includes('ram') || lowerInput.includes('agent') || lowerInput.includes('background')) {
    const mem = await runCommand(['free', '-h']);
    context += `\n\nSYSTEM MEMORY:\n${mem}`;
  }

  // Background agents / systemd services
  if (lowerInput.includes('agent') || lowerInput.includes('background') || lowerInput.includes('nanobot') || lowerInput.includes('running') || lowerInput.includes('what') || lowerInput.includes('process') || lowerInput.includes('service')) {
    // Get all user services
    const services = await runCommand(['systemctl', '--user', 'list-units', '--type=service', '--no-legend']);

    // Parse systemctl output - format: "UNIT LOAD ACTIVE SUB DESCRIPTION"
    const serviceLines = services.split('\n').filter(line => line.trim().length > 0);
    const activeServices = serviceLines
      .filter(line => {
        // Check if service is active/running (column 3)
        const parts = line.trim().split(/\s+/);
        const state = parts[2]; // LOAD column
        const sub = parts[3]; // SUB column
        return (sub === 'running' || sub === 'active' || sub === 'listening') && state !== 'failed';
      })
      .map(line => {
        // Extract service name (first column)
        const parts = line.trim().split(/\s+/);
        return parts[0]?.replace(/^[\u25cf\u25a0]\s+/, '') || ''; // Remove bullet character
      })
      .filter(name => name.length > 0);

    // Focus on PAI/FR3K services
    const paiServices = activeServices.filter(s =>
      s.includes('pai-') ||
      s.includes('fr3k') ||
      s.includes('telegram') ||
      s.includes('memu') ||
      s.includes('voice') ||
      s.includes('monitor') ||
      s.includes('bot') ||
      s.includes('agent')
    );

    if (paiServices.length > 0) {
      context += `\n\nACTIVE PAI/FR3K AGENTS (${paiServices.length}):\n${paiServices.slice(0, 15).join('\n')}`;
    } else {
      // Show a few example services if no PAI services found
      const examples = activeServices.slice(0, 5);
      context += `\n\nACTIVE SYSTEMD SERVICES (${activeServices.length} total):\n${examples.join('\n')}\n(No PAI agents detected)`;
    }

    // Get background processes
    const bgProcesses = await runCommand(['ps', 'aux', '--sort=-pcpu', '-u', 'fr3k']);
    if (bgProcesses) {
      const processLines = bgProcesses.split('\n').slice(1, 25); // Skip header, get top 24
      // Filter to show interesting processes
      const interestingProcesses = processLines.filter(line =>
        line.includes('pai-') ||
        line.includes('telegram') ||
        line.includes('memu') ||
        line.includes('voice') ||
        line.includes('agent') ||
        line.includes('bun') ||
        line.includes('edge-tts') ||
        line.toLowerCase().includes('fr3k') ||
        line.includes('bot') ||
        line.includes('monitor')
      );

      if (interestingProcesses.length > 0) {
        context += `\n\nBACKGROUND PROCESSES:\n${interestingProcesses.map(line => {
          const parts = line.split(/\s+/);
          return `PID ${parts[1]}: ${parts[10]} (${parts[2]}% CPU)`;
        }).join('\n')}`;
      }
    }
  }

  // CPU queries
  if (lowerInput.includes('cpu') || lowerInput.includes('processor') || lowerInput.includes('load')) {
    const load = await runCommand(['uptime']);
    context += `\n\nSYSTEM LOAD:\n${load}`;
  }

  // Time queries
  if (lowerInput.includes('time') || lowerInput.includes('date')) {
    const now = new Date().toISOString();
    context += `\n\nCURRENT TIME: ${now}`;
  }

  return context;
}

async function callFR3K(input: string): Promise<string> {
  console.log(`[Gemini] Processing: "${input}"`);

  try {
    // Get relevant system context
    const systemContext = await getSystemContext(input);
    console.log(`[Context] Generated ${systemContext.length} bytes of context`);
    if (systemContext.includes('agent') || systemContext.includes('service')) {
      console.log(`[Context] Includes agent/service info`);
    }

    const prompt = systemContext
      ? `You are FR3K, a helpful AI assistant running on the user's system. You have full access to system information. Keep responses concise (under 100 words) and natural for voice conversation.\n\n${systemContext}\n\nUser says: "${input}"`
      : `You are FR3K, a helpful AI assistant. Keep responses concise (under 100 words) and natural for voice conversation. User says: "${input}"`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          candidateCount: 1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return result || "I heard you. How can I help?";
  } catch (error) {
    console.log(`[Gemini] Error: ${error}`);
    const fallbacks = [
      "I'm thinking about that. Could you say more?",
      "I'm processing your request. What else can I help with?",
      "I heard you. Give me a moment to think.",
      "I'm working on that. Is there anything else you need?"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json({ status: "healthy", port: PORT, tts: "EdgeTTS" });
    }

    // Serve audio files
    if (url.pathname.startsWith("/audio/") && req.method === "GET") {
      const filename = url.pathname.split("/audio/")[1];
      const filepath = join(AUDIO_DIR, filename);

      if (existsSync(filepath)) {
        const file = Bun.file(filepath);
        return new Response(file.stream(), {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-cache" }
        });
      }
      return new Response("Not found", { status: 404 });
    }

    // Incoming call
    if (url.pathname === "/call" && req.method === "POST") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") || "unknown";
      const reason = url.searchParams.get("reason") || null;

      console.log(`[Twilio] Call from ${formData.get("From")}, SID: ${callSid}${reason ? `, reason: ${reason}` : ''}`);

      // Custom greeting based on call reason
      let greetingText = "Hello, this is F R E K. I'm listening. How can I help you today?";

      if (reason) {
        if (reason.includes('Hourly')) {
          greetingText = "Hey, just calling in for our hourly check-in. Everything okay?";
        } else if (reason.includes('idle')) {
          greetingText = "Hey, noticed you've been idle for a while. Just checking in.";
        } else if (reason.includes('Big moment')) {
          greetingText = "Hey, calling because something important happened on your system.";
        } else if (reason.includes('Disk')) {
          greetingText = "Hey, calling because your disk space is getting critical.";
        } else if (reason.includes('Memory')) {
          greetingText = "Hey, calling because your memory usage is getting critical.";
        } else if (reason.includes('service') || reason.includes('failed')) {
          greetingText = "Hey, calling because some systemd services failed.";
        } else {
          greetingText = `Hey, calling because ${reason}. How can I help?`;
        }
      }

      const audioUrl = await generateAudio(greetingText, `greeting-${callSid}`);

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
  </Gather>
  <Redirect method="POST">/reprompt</Redirect>
</Response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    // Conversation
    if (url.pathname === "/conversation" && req.method === "POST") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") || "unknown";
      const speech = formData.get("SpeechResult") || "";

      console.log(`[Twilio] Speech: "${speech.substring(0, 50)}..."`);

      const response = await callFR3K(speech);
      const cleanResponse = cleanForSpeech(response);

      const audioUrl = await generateAudio(cleanResponse, `response-${callSid}-${Date.now()}`);

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
  </Gather>
  <Redirect method="POST">/goodbye</Redirect>
</Response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    // Reprompt
    if (url.pathname === "/reprompt" && req.method === "POST") {
      const audioUrl = await generateAudio("I didn't catch that. Could you please repeat?", `reprompt`);

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="/conversation" speechTimeout="auto" speechModel="phone_call">
  </Gather>
  <Redirect method="POST">/reprompt</Redirect>
</Response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    // Goodbye
    if (url.pathname === "/goodbye" && req.method === "POST") {
      const audioUrl = await generateAudio("Thank you for calling. Goodbye!", `goodbye`);

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Hangup/>
</Response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    return new Response("Not found", { status: 404 });
  }
});

console.log(`Twilio Voice Server with EdgeTTS running on port ${PORT}`);
