#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * EvidenceRequirement.hook.ts - Enforce Evidence for Task Completion
 *
 * PURPOSE:
 * Prevents tasks from being marked "completed" without proper evidence.
 * Implements the Cycle 4 Verification Discipline requirement:
 * "Done means verified. Verified means evidenced."
 *
 * TRIGGER: TaskUpdate tool (PostToolUse)
 *
 * OUTPUT:
 * - exit(0): Allow completion (evidence provided or trivial task)
 * - exit(1): Block completion (evidence required but missing)
 * - Warning message: Evidence guidance
 */

import { getIdentity } from './lib/identity';

interface HookInput {
  tool_name: string;
  tool_input: {
    taskId: string;
    status: string;
    subject?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
  tool_result: any;
  session_id: string;
}

// Evidence types that count as valid
const VALID_EVIDENCE_TYPES = [
  'test_results',
  'screenshot',
  'console_output',
  'before_after',
  'file_verification',
  'network_request',
  'service_status',
];

// Keywords that indicate non-trivial work requiring evidence
const NON_TRIVIAL_KEYWORDS = [
  'implement', 'fix', 'deploy', 'build', 'create', 'update', 'modify',
  'refactor', 'optimize', 'configure', 'install', 'setup', 'integrate',
  'removed', 'deleted', 'added', 'changed', 'migrated', 'converted'
];

// Task patterns that are trivial (don't require evidence)
const TRIVIAL_PATTERNS = [
  /^analy/i, /^review/i, /^check/i, /^list/i, /^read/i,
  /^document/i, /^note/i, /^summarize/i
];

function isNonTrivialTask(subject: string = '', description: string = ''): boolean {
  const text = `${subject} ${description}`.toLowerCase();

  // Check if matches trivial pattern
  if (TRIVIAL_PATTERNS.some(p => p.test(text))) {
    return false;
  }

  // Check if contains non-trivial keyword
  return NON_TRIVIAL_KEYWORDS.some(kw => text.includes(kw));
}

function hasValidEvidence(metadata: Record<string, any> = {}): boolean {
  // Check for evidence_type field
  if (!metadata.evidence_type) {
    return false;
  }

  // Validate evidence type
  if (!VALID_EVIDENCE_TYPES.includes(metadata.evidence_type)) {
    return false;
  }

  // Check for evidence data (path or output)
  if (!metadata.evidence_path && !metadata.evidence_data && !metadata.evidence) {
    return false;
  }

  return true;
}

function generateEvidenceGuidance(task: {
  subject?: string;
  description?: string;
}): string {
  const text = `${task.subject || ''} ${task.description || ''}`.toLowerCase();

  // Suggest evidence type based on task content
  if (text.includes('test') || text.includes('fix') || text.includes('code')) {
    return `Test results required. Run tests and include output.`;
  } else if (text.includes('ui') || text.includes('web') || text.includes('page') || text.includes('deploy')) {
    return `Screenshot required. Use Browser skill to capture deployed page.`;
  } else if (text.includes('service') || text.includes('system') || text.includes('config')) {
    return `Console output required. Include systemctl status or config verification.`;
  } else if (text.includes('before') || text.includes('after') || text.includes('optimi')) {
    return `Before/after measurements required. Show performance improvement.`;
  } else {
    return `Evidence required: test_results, screenshot, console_output, or before_after.`;
  }
}

async function main() {
  try {
    const input = await Bun.stdin.text();
    if (!input) {
      process.exit(0);
    }

    const data = JSON.parse(input) as HookInput;

    // Only check TaskUpdate calls
    if (data.tool_name !== 'TaskUpdate') {
      process.exit(0);
    }

    const toolInput = data.tool_input;
    const status = toolInput?.status;

    // Only block when status is "completed"
    if (status !== 'completed') {
      process.exit(0);
    }

    const subject = toolInput?.subject || '';
    const description = toolInput?.description || '';
    const metadata = toolInput?.metadata || {};

    // Check if task is non-trivial
    if (!isNonTrivialTask(subject, description)) {
      // Trivial task - allow without evidence
      process.exit(0);
    }

    // Check for valid evidence
    if (hasValidEvidence(metadata)) {
      // Evidence provided - allow completion
      process.exit(0);
    }

    // Evidence required but missing - block and warn
    const guidance = generateEvidenceGuidance({ subject, description });

    console.error(`\n❌ EVIDENCE REQUIRED - Task cannot be marked complete`);
    console.error(`\nTask: "${subject}"`);
    console.error(`\n${guidance}`);
    console.error(`\nValid evidence types: ${VALID_EVIDENCE_TYPES.join(', ')}`);
    console.error(`\nExample TaskUpdate with evidence:`);
    console.error(`TaskUpdate({`);
    console.error(`  taskId: "${toolInput.taskId}",`);
    console.error(`  status: "completed",`);
    console.error(`  metadata: {`);
    console.error(`    evidence_type: "test_results",`);
    console.error(`    evidence_data: "npm test output here..."`);
    console.error(`  }`);
    console.error(`})\n`);

    // Send voice notification warning
    const identity = getIdentity();
    fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(1000),
      body: JSON.stringify({
        message: `${identity.name}: Evidence required for task completion. Please provide verification.`,
        title: 'Evidence Required',
        voice_enabled: true,
        voice_id: identity.voiceId || '21m00Tcm4TlvDq8ikWAM',
      }),
    }).catch(() => {});

    // Block completion
    process.exit(1);

  } catch (error) {
    // On error, allow to prevent blocking valid work
    console.error('EvidenceRequirement hook error:', error);
    process.exit(0);
  }
}

main();
