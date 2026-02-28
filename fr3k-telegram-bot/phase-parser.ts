/**
 * Algorithm Phase Parser for Telegram
 *
 * Parses Algorithm output to extract phase transitions and sends incremental updates.
 * This gives users real-time progress instead of waiting for the full response.
 */

interface ParsedPhase {
  phase: number;
  phaseName: string;
  content: string;
  voiceRequired: boolean;
}

interface PhaseUpdate {
  phase: number;
  phaseName: string;
  title: string;
  content: string;
}

/**
 * Parse Algorithm response into phases
 */
export function parseAlgorithmPhases(response: string): ParsedPhase[] {
  const phases: ParsedPhase[] = [];

  // Algorithm phase headers: "━━━ 👁️ OBSERVE ━━━ 1/7" or "🤖 FR3K ALGORITHM"
  const phaseRegex = /━━━\s+([👁️🧠📋🔨⚡✅📚])\s+(\w+)\s+━━━\s*(\d+)\/\s*7/g;

  let match;
  let lastEndIndex = 0;

  while ((match = phaseRegex.exec(response)) !== null) {
    const emoji = match[1];
    const phaseName = match[2];
    const phaseNum = parseInt(match[3]);

    // Voice required for phases 3 (PLAN) and 6 (VERIFY)
    const voiceRequired = phaseNum === 3 || phaseNum === 6;

    phases.push({
      phase: phaseNum,
      phaseName,
      content: "",
      voiceRequired
    });

    lastEndIndex = match.index + match[0].length;
  }

  // Extract content for each phase
  for (let i = 0; i < phases.length; i++) {
    const currentPhase = phases[i];
    const nextPhase = phases[i + 1];

    const startIndex = response.indexOf(currentPhase.phaseName, lastEndIndex);

    if (startIndex !== -1) {
      if (nextPhase) {
        const endIndex = response.indexOf(nextPhase.phaseName, startIndex);
        currentPhase.content = response.substring(startIndex, endIndex).trim();
      } else {
        // Last phase - take everything until end
        currentPhase.content = response.substring(startIndex).trim();
      }
    }
  }

  return phases;
}

/**
 * Generate MP3 audio file using EdgeTTS
 */
async function generateAudioFile(text: string, phase: number): Promise<string | null> {
  try {
    const tmpDir = "/tmp/telegram-phase-audio";
    await Bun.$`mkdir -p ${tmpDir}`;

    const filename = `phase-${phase}-${Date.now()}.mp3`;
    const filepath = `${tmpDir}/${filename}`;

    // Use EdgeTTS to generate audio
    const proc = Bun.spawn([
      'edge-tts',
      '--text', text,
      '--voice', 'en-US-AvaNeural',
      '--write-media', filepath
    ], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    await proc.exited;

    if (!require('fs').existsSync(filepath)) {
      console.error("❌ Audio file not created");
      return null;
    }

    console.log(`✅ Audio generated: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error("❌ Audio generation error:", error);
    return null;
  }
}

/**
 * Send audio file via Telegram
 */
async function sendTelegramAudio(audioPath: string, bot: any, chatId: number): Promise<boolean> {
  try {
    // Use Grammy's InputFile for local files
    const { InputFile } = await import('grammy');
    const filename = audioPath.split('/').pop() || 'phase-audio.mp3';
    const audio = new InputFile(audioPath, filename);

    await bot.api.sendAudio(chatId, audio, {
      caption: '🔊 Voice overview for this phase'
    });

    console.log(`✅ Audio sent to Telegram: ${audioPath}`);
    return true;
  } catch (error) {
    console.error("❌ Telegram audio send error:", error);
    return false;
  }
}

/**
 * Send voice notification for phases 3 and 6
 */
async function sendVoiceNotification(
  phase: number,
  phaseName: string,
  content: string,
  bot: any,
  chatId: number
): Promise<void> {
  try {
    const voiceMessages = {
      3: `Phase ${phaseName} complete. ${content.substring(0, 200)}`,
      6: `Phase ${phaseName} complete. ${content.substring(0, 200)}`
    };

    const message = voiceMessages[phase as keyof typeof voiceMessages];
    if (!message) return;

    // Generate audio file
    const audioPath = await generateAudioFile(message, phase);
    if (!audioPath) {
      console.error("❌ Failed to generate audio");
      return;
    }

    // Send via Telegram
    await sendTelegramAudio(audioPath, bot, chatId);

    console.log(`🔊 Voice notification sent for phase ${phase}`);
  } catch (error) {
    console.error("❌ Voice notification error:", error);
  }
}

/**
 * Send phase update to Telegram bot's phase notification server
 */
async function sendPhaseUpdate(update: PhaseUpdate): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:8898/api/phase-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...update,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error(`❌ Phase ${update.phase} update failed: ${await response.text()}`);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("❌ Phase update error:", error);
    return false;
  }
}

/**
 * Process Algorithm response and send incremental phase updates
 */
export async function processAlgorithmPhases(
  response: string,
  bot: any,
  chatId: number
): Promise<void> {
  const phases = parseAlgorithmPhases(response);

  if (phases.length === 0) {
    console.log("ℹ️ No Algorithm phases detected in response");
    return;
  }

  console.log(`📊 Detected ${phases.length} Algorithm phases, sending incremental updates...`);

  // Send each phase update
  for (const phase of phases) {
    // Generate title from phase content
    const title = generatePhaseTitle(phase);

    // For phase 2, include team info and thinking tools
    let content = phase.content.substring(0, 2000);
    if (phase.phase === 2) {
      const teamInfo = extractTeamInfo(phase.content);
      const thinkingTools = extractThinkingTools(phase.content);
      content = `${content}\n\n**Thinking Tools Assessment:**\n${thinkingTools}\n\n**Team Composition:**\n${teamInfo}`;
    }

    // Send update with voice flag
    const success = await sendPhaseUpdate({
      phase: phase.phase,
      phaseName: phase.phaseName,
      title,
      content
    });

    if (success) {
      console.log(`✅ Phase ${phase.phase}/${phase.phaseName} update sent${phase.voiceRequired ? ' with voice' : ''}`);

      // Send audio file for phases 3 and 6
      if (phase.voiceRequired) {
        await sendVoiceNotification(phase.phase, phase.phaseName, phase.content, bot, chatId);
      }
    }

    // Small delay between phases
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("✅ All phase updates sent");

  // Send final completion message
  try {
    await bot.api.sendMessage(chatId, `
✅ **FR3K Algorithm Complete**

All 7 phases executed successfully:
1. OBSERVE - Request analyzed
2. THINK - Strategy assessed
3. PLAN - Approach designed
4. BUILD - Solution created
5. EXECUTE - Work implemented
6. VERIFY - Results confirmed
7. LEARN - Insights captured

**Ready for your next task.**
    `.trim(), { parse_mode: "Markdown" });

    console.log("✅ Final completion message sent");
  } catch (error) {
    console.error("❌ Failed to send final message:", error);
  }
}

/**
 * Extract team composition from phase content
 */
function extractTeamInfo(content: string): string {
  const lines = content.split('\n');
  let teamInfo = "";

  // Look for capability selection block
  const inCapabilityBlock = lines.some(line =>
    line.includes("CAPABILITY SELECTION") ||
    line.includes("The fR3k t3aM") ||
    line.includes("Skills:")
  );

  if (inCapabilityBlock) {
    for (const line of lines) {
      if (line.includes("│ Skills:") ||
          line.includes("│ Thinking:") ||
          line.includes("│ Primary:") ||
          line.includes("│ Support:") ||
          line.includes("│ Verify:") ||
          line.includes("│ Pattern:") ||
          line.includes("│ Sequence:")) {
        teamInfo += line + "\n";
      }
    }
  }

  return teamInfo || "Team info not available in response";
}

/**
 * Extract thinking tools assessment from phase content
 */
function extractThinkingTools(content: string): string {
  const lines = content.split('\n');
  let thinkingTools = "";

  // Look for thinking tools assessment block
  const inThinkingBlock = lines.some(line =>
    line.includes("THINKING TOOLS ASSESSMENT") ||
    line.includes("THINKING TOOLS")
  );

  if (inThinkingBlock) {
    let inAssessment = false;
    for (const line of lines) {
      // Start of assessment block
      if (line.includes("THINKING TOOLS ASSESSMENT")) {
        inAssessment = true;
        thinkingTools += line + "\n";
        continue;
      }

      // End of assessment block (stop at capability selection)
      if (inAssessment && (line.includes("🎯") || line.includes("CAPABILITY SELECTION"))) {
        break;
      }

      // Capture assessment lines
      if (inAssessment && line.trim().length > 0) {
        thinkingTools += line + "\n";
      }
    }
  }

  return thinkingTools || "Thinking tools assessment not available";
}

/**
 * Generate a concise title for the phase
 */
function generatePhaseTitle(phase: ParsedPhase): string {
  const content = phase.content;

  // Extract key information from content
  if (content.includes("Reverse Engineering:")) {
    return "Request Analysis Complete";
  }

  if (content.includes("CAPABILITY SELECTION") || content.includes("The fR3k t3aM")) {
    return "Capabilities Selected";
  }

  if (content.includes("Plan:")) {
    return "Plan Created";
  }

  if (content.includes("Creating") || content.includes("Building")) {
    return "Build Phase";
  }

  if (content.includes("Running") || content.includes("Executing")) {
    return "Execution Phase";
  }

  if (content.includes("VERIFICATION") || content.includes("Testing")) {
    return "Verification Complete";
  }

  if (content.includes("LEARN") || content.includes("Key Learnings")) {
    return "Learnings Captured";
  }

  // Default: use phase name
  return `${phase.phaseName} Phase`;
}

/**
 * Check if response contains Algorithm format
 */
export function isAlgorithmResponse(response: string): boolean {
  return response.includes("🤖") &&
    (response.includes("━━━") || response.includes("OBSERVE") || response.includes("ALGORITHM"));
}
