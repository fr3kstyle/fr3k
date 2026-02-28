#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * Reflection.hook.ts - Capture Learning from Each Interaction
 *
 * PURPOSE:
 * Triggers on Stop event to capture learning and insights from each interaction.
 * Analyzes the conversation to extract what worked, what didn't, and procedural
 * knowledge that should be preserved. Stores reflections in MEMORY/REFLECTIONS/
 * and updates procedural memory for future reference.
 *
 * TRIGGER: Stop (fires after Claude generates a response)
 *
 * INPUT:
 * - stdin: Hook input JSON (session_id, transcript_path, hook_event_name)
 *
 * OUTPUT:
 * - stdout: None (no context injection)
 * - stderr: Status messages
 * - exit(0): Always (non-blocking)
 *
 * SIDE EFFECTS:
 * - Creates: MEMORY/REFLECTIONS/<YYYY-MM>/<timestamp>_reflection.md
 * - Updates: MEMORY/PROCEDURAL/<category>.md with extracted procedures
 *
 * REFLECTION CATEGORIES:
 * - SUCCESS: What approaches worked well
 * - FAILURE: What went wrong and how to avoid
 * - PATTERN: Reusable patterns discovered
 * - EDGE_CASE: Rare situations that need special handling
 * - OPTIMIZATION: Performance or efficiency improvements
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: StopOrchestrator (expects Stop event)
 * - COORDINATES WITH: WorkCompletionLearning, SessionSummary
 * - MUST RUN BEFORE: SessionEnd hooks
 * - MUST RUN AFTER: Claude's response generation
 *
 * ERROR HANDLING:
 * - Missing transcript: Silent exit
 * - Parse failures: Logged, exits gracefully
 * - Write failures: Logged, silent exit
 *
 * PERFORMANCE:
 * - Non-blocking: Yes
 * - Typical execution: <150ms
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { getISOTimestamp, getPSTDate } from './lib/time';
import { getPaiDir } from './lib/paths';

const MEMORY_DIR = join(getPaiDir(), 'MEMORY');
const REFLECTIONS_DIR = join(MEMORY_DIR, 'REFLECTIONS');
const PROCEDURAL_DIR = join(MEMORY_DIR, 'PROCEDURAL');

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
}

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Reflection {
  timestamp: string;
  sessionId: string;
  category: ReflectionCategory;
  title: string;
  insight: string;
  tags: string[];
  procedure?: string;
}

type ReflectionCategory = 'SUCCESS' | 'FAILURE' | 'PATTERN' | 'EDGE_CASE' | 'OPTIMIZATION';

/**
 * Parse transcript JSONL file
 */
function parseTranscript(transcriptPath: string): TranscriptEntry[] {
  if (!existsSync(transcriptPath)) {
    return [];
  }

  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    const entries: TranscriptEntry[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.role && parsed.content) {
          entries.push({
            role: parsed.role,
            content: parsed.content,
            timestamp: parsed.timestamp,
          });
        }
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  } catch {
    return [];
  }
}

/**
 * Analyze conversation to extract learning
 */
function analyzeConversation(entries: TranscriptEntry[]): Reflection[] {
  const reflections: Reflection[] = [];
  const now = getISOTimestamp();
  const sessionId = process.env.SESSION_ID || 'unknown';

  if (entries.length < 2) {
    return reflections;
  }

  // Get the last exchange
  const lastUser = entries.filter(e => e.role === 'user').pop();
  const lastAssistant = entries.filter(e => e.role === 'assistant').pop();

  if (!lastUser || !lastAssistant) {
    return reflections;
  }

  const userContent = lastUser.content.toLowerCase();
  const assistantContent = lastAssistant.content;

  // Detect completion of a task
  const completionPatterns = [
    /done|complete|finished|implement|create|build|fix|resolve/i,
    /✅|success|working|ready|deploy/i,
  ];

  const isCompletion = completionPatterns.some(p =>
    p.test(assistantContent.slice(0, 500))
  );

  if (isCompletion) {
    // Extract what was accomplished
    const titleMatch = assistantContent.match(/#{1,3}\s+(.{5,50})/);
    const title = titleMatch ? titleMatch[1].trim() : 'Task Completion';

    reflections.push({
      timestamp: now,
      sessionId,
      category: 'SUCCESS',
      title,
      insight: extractInsight(assistantContent),
      tags: extractTags(assistantContent + ' ' + lastUser.content),
    });
  }

  // Detect debugging/troubleshooting
  const debugPatterns = [
    /error|bug|issue|problem|fail|broken/i,
    /fix|resolve|debug|troubleshoot/i,
  ];

  const isDebug = debugPatterns.some(p => p.test(userContent));
  if (isDebug) {
    const errorMatch = assistantContent.match(/error[:\s]+([^\n]+)/i);
    const title = errorMatch ? `Debug: ${errorMatch[1].slice(0, 30)}` : 'Debug Session';

    reflections.push({
      timestamp: now,
      sessionId,
      category: 'FAILURE',
      title,
      insight: extractInsight(assistantContent),
      tags: [...extractTags(assistantContent), 'debug'],
    });
  }

  // Detect patterns discovered
  const patternPatterns = [
    /pattern|approach|method|strategy|best practice/i,
    /way to|how to|procedure|workflow/i,
  ];

  const isPattern = patternPatterns.some(p => p.test(assistantContent));
  if (isPattern) {
    reflections.push({
      timestamp: now,
      sessionId,
      category: 'PATTERN',
      title: 'Discovered Pattern',
      insight: extractInsight(assistantContent),
      tags: [...extractTags(assistantContent), 'pattern'],
      procedure: extractProcedure(assistantContent),
    });
  }

  // Detect optimizations
  const optimizePatterns = [
    /optimiz|improv|efficient|faster|better/i,
    /refactor|simplify|clean/i,
  ];

  const isOptimize = optimizePatterns.some(p => p.test(assistantContent));
  if (isOptimize) {
    reflections.push({
      timestamp: now,
      sessionId,
      category: 'OPTIMIZATION',
      title: 'Optimization Opportunity',
      insight: extractInsight(assistantContent),
      tags: [...extractTags(assistantContent), 'optimization'],
    });
  }

  return reflections;
}

/**
 * Extract key insight from content
 */
function extractInsight(content: string): string {
  // Look for summary/conclusion sections
  const summaryMatch = content.match(/(?:summary|conclusion|key takeaway)[:\s\n]+([^\n]+)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }

  // Look for bullet points with insights
  const bulletMatch = content.match(/[-*]\s+([A-Z][^.\n]+[.!?])/);
  if (bulletMatch) {
    return bulletMatch[1].trim();
  }

  // Return first meaningful sentence
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length > 0) {
    return sentences[0].trim().slice(0, 200);
  }

  return 'No specific insight captured.';
}

/**
 * Extract tags from content
 */
function extractTags(content: string): string[] {
  const tags = new Set<string>();
  const lower = content.toLowerCase();

  // Tech stack tags
  const techStack = [
    'typescript', 'javascript', 'python', 'rust', 'go', 'java',
    'react', 'vue', 'angular', 'svelte', 'next', 'nuxt',
    'node', 'bun', 'deno', 'docker', 'kubernetes',
    'postgres', 'mongodb', 'redis', 'sqlite',
    'graphql', 'rest', 'api', 'cli', 'web',
  ];

  for (const tech of techStack) {
    if (lower.includes(tech)) {
      tags.add(tech);
    }
  }

  // Activity tags
  const activities = [
    'testing', 'debug', 'deploy', 'refactor', 'optimize',
    'document', 'review', 'design', 'implement',
  ];

  for (const activity of activities) {
    if (lower.includes(activity)) {
      tags.add(activity);
    }
  }

  return Array.from(tags);
}

/**
 * Extract procedural knowledge
 */
function extractProcedure(content: string): string | undefined {
  // Look for numbered steps or procedure sections
  const procedureMatch = content.match(/(?:procedure|steps|how to)[:\s\n]+([^#]+)/i);
  if (procedureMatch) {
    const procedure = procedureMatch[1].trim();
    // Only return if it has multiple steps
    if (procedure.includes(/\d+\./) || procedure.includes(/[-*]/)) {
      return procedure.slice(0, 500);
    }
  }

  return undefined;
}

/**
 * Get month directory for reflections
 */
function getMonthDir(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const monthDir = join(REFLECTIONS_DIR, `${year}-${month}`);

  if (!existsSync(monthDir)) {
    mkdirSync(monthDir, { recursive: true });
  }

  return monthDir;
}

/**
 * Write a reflection to disk
 */
function writeReflection(reflection: Reflection): void {
  const monthDir = getMonthDir();
  const dateStr = getPSTDate();
  const timeStr = new Date().toISOString().split('T')[1].slice(0, 5).replace(':', '');
  const titleSlug = reflection.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);

  const filename = `${dateStr}_${timeStr}_${reflection.category.toLowerCase()}_${titleSlug}.md`;
  const filepath = join(monthDir, filename);

  const content = `# ${reflection.title}

**Category:** ${reflection.category}
**Tags:** ${reflection.tags.join(', ') || 'none'}
**Session:** ${reflection.sessionId}
**Time:** ${reflection.timestamp}

---

## Insight

${reflection.insight}

${reflection.procedure ? `

## Procedure

${reflection.procedure}
` : ''}

---

*Auto-captured by Reflection hook*
`;

  writeFileSync(filepath, content);
  console.error(`[Reflection] Captured: ${reflection.category} - ${reflection.title}`);
}

/**
 * Update procedural memory if procedure exists
 */
function updateProceduralMemory(reflection: Reflection): void {
  if (!reflection.procedure) {
    return;
  }

  // Create PROCEDURAL directory if needed
  if (!existsSync(PROCEDURAL_DIR)) {
    mkdirSync(PROCEDURAL_DIR, { recursive: true });
  }

  // Determine procedural file based on tags
  const tag = reflection.tags.find(t =>
    ['testing', 'debug', 'deploy', 'design', 'implement'].includes(t)
  ) || 'general';

  const proceduralFile = join(PROCEDURAL_DIR, `${tag}.md`);

  // Append to procedural file
  const entry = `

## ${reflection.title}
*${reflection.timestamp}*

${reflection.procedure}

`;

  if (existsSync(proceduralFile)) {
    const existing = readFileSync(proceduralFile, 'utf-8');
    writeFileSync(proceduralFile, existing + entry);
  } else {
    const header = `# Procedural Knowledge: ${tag.charAt(0).toUpperCase() + tag.slice(1)}

*Auto-generated from reflections*

`;
    writeFileSync(proceduralFile, header + entry);
  }
}

/**
 * Read stdin content (works with both Bun and Node)
 */
async function readStdin(): Promise<string> {
  // Try Bun first
  if (typeof (globalThis as any).Bun !== 'undefined') {
    return await (globalThis as any).Bun.stdin.text();
  }

  // Fallback to Node
  return new Promise((resolve) => {
    let input = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => { resolve(input); });

    // Timeout after 500ms
    setTimeout(() => { resolve(input); }, 500);
  });
}

/**
 * Main hook handler
 */
async function main() {
  try {
    // Read input from stdin
    const input = await readStdin();
    if (!input || input.trim() === '') {
      process.exit(0);
    }

    const data = JSON.parse(input) as HookInput;

    if (!data.transcript_path || !existsSync(data.transcript_path)) {
      process.exit(0);
    }

    // Parse transcript
    const entries = parseTranscript(data.transcript_path);
    if (entries.length === 0) {
      process.exit(0);
    }

    // Analyze conversation
    const reflections = analyzeConversation(entries);

    // Write reflections and update procedural memory
    for (const reflection of reflections) {
      writeReflection(reflection);
      updateProceduralMemory(reflection);
    }

    process.exit(0);
  } catch (error) {
    // Silent failure - don't disrupt workflow
    console.error(`[Reflection] Error: ${error}`);
    process.exit(0);
  }
}

main();
