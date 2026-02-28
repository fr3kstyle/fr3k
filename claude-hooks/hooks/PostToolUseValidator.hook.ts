#!/home/fr3k/.nvm/versions/node/v24.13.0/bin/tsx
/**
 * PostToolUseValidator.hook.ts - Quality Validation After Tool Execution
 *
 * PURPOSE:
 * Validates file operations (Write, Edit, Read) immediately after tool execution.
 * Runs linters based on file type to catch quality issues early. Logs to stderr
 * for visibility without blocking execution (always exits 0).
 *
 * TRIGGER: PostToolUse (fires after each tool completes)
 *
 * INPUT:
 * - stdin: Hook input JSON (tool_name, tool_input, tool_result, session_id)
 *
 * OUTPUT:
 * - stdout: None (no context injection)
 * - stderr: Quality issues found during validation
 * - exit(0): Always (non-blocking)
 *
 * SIDE EFFECTS:
 * - Runs linters on modified files (eslint for JS/TS, ruff for Python)
 * - Logs quality issues to stderr
 *
 * LINTER CONFIGURATION:
 * - ESLint: Runs if node_modules/.bin/eslint exists or eslint is in PATH
 * - Ruff: Runs if .venv/bin/ruff exists or ruff is in PATH
 * - Configuration files must exist in project (.eslintrc.*, pyproject.toml, ruff.toml)
 *
 * ERROR HANDLING:
 * - Missing linter: Silent skip (logs to stderr)
 * - Linter errors: Logged but don't block
 * - File not found: Silent exit
 *
 * PERFORMANCE:
 * - Non-blocking: Yes (async execution)
 * - Typical execution: 50-200ms per file
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: None
 * - COORDINATES WITH: SecurityValidator (PreToolUse)
 * - MUST RUN AFTER: Tool execution completes
 * - MUST RUN BEFORE: None
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

interface HookInput {
  tool_name: string;
  tool_input: any;
  tool_result: any;
  session_id: string;
}

// File extensions and their corresponding linters
interface LinterConfig {
  name: string;
  extensions: string[];
  command: string;
  args: string[];
  checkProject: (projectRoot: string) => boolean;
}

const LINTER_CONFIGS: LinterConfig[] = [
  {
    name: 'ESLint',
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    command: 'eslint',
    args: ['--format', 'compact', '--no-ignore'],
    checkProject: (root) => {
      // Check for ESLint config
      const configs = [
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.eslintrc.json',
        '.eslintrc.yaml',
        '.eslintrc.yml',
        'eslint.config.js',
        'eslint.config.mjs',
      ];
      return configs.some(c => existsSync(join(root, c)));
    },
  },
  {
    name: 'Ruff',
    extensions: ['.py'],
    command: 'ruff',
    args: ['check', '--output-format', 'concise'],
    checkProject: (root) => {
      // Check for Ruff config
      const configs = [
        'pyproject.toml',
        'ruff.toml',
        '.ruff.toml',
      ];
      return configs.some(c => existsSync(join(root, c)));
    },
  },
];

/**
 * Find the project root for a given file
 * Looks for package.json, pyproject.toml, or .git directory
 */
function findProjectRoot(filePath: string): string | null {
  let currentDir = dirname(filePath);
  const homeDir = process.env.HOME!;

  // Traverse up to find project root
  while (currentDir !== homeDir && currentDir !== '/') {
    // Check for common project markers
    const markers = [
      'package.json',
      'pyproject.toml',
      'setup.py',
      'setup.cfg',
      '.git',
    ];

    for (const marker of markers) {
      if (existsSync(join(currentDir, marker))) {
        return currentDir;
      }
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Find a linter executable, checking multiple locations
 */
function findLinter(command: string, projectRoot: string): string | null {
  // Check project local bin first
  const localBins = [
    join(projectRoot, 'node_modules', '.bin', command),
    join(projectRoot, '.venv', 'bin', command),
    join(projectRoot, 'venv', 'bin', command),
  ];

  for (const bin of localBins) {
    if (existsSync(bin)) {
      return bin;
    }
  }

  // Check PATH
  return command; // Will use PATH resolution
}

/**
 * Run a linter on a file and return results
 */
async function runLinter(
  linter: LinterConfig,
  filePath: string,
  projectRoot: string
): Promise<{ issues: string[]; success: boolean }> {
  return new Promise((resolve) => {
    const executable = findLinter(linter.command, projectRoot);
    if (!executable) {
      resolve({ issues: [], success: false });
      return;
    }

    const args = [...linter.args, filePath];
    const proc = spawn(executable, args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000, // 5 second timeout
      shell: '/usr/bin/bash',  // Fix ENOENT error - /bin/sh doesn't exist
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 || code === 1) {
        // Exit 0 = no issues, Exit 1 = lint issues found
        const issues = (stdout + stderr)
          .split('\n')
          .filter((line) => line.trim() && !line.startsWith('warning:'))
          .map((line) => `[${linter.name}] ${line}`);
        resolve({ issues, success: true });
      } else {
        // Linter not available or error
        resolve({ issues: [], success: false });
      }
    });

    proc.on('error', () => {
      resolve({ issues: [], success: false });
    });
  });
}

/**
 * Get file path from tool input
 */
function getFilePath(toolInput: any): string | null {
  // Direct file_path parameter
  if (toolInput?.file_path) {
    return toolInput.file_path;
  }

  // Nested in parameters object
  if (toolInput?.parameters?.file_path) {
    return toolInput.parameters.file_path;
  }

  // Old-style hook format
  if (toolInput?.path) {
    return toolInput.path;
  }

  return null;
}

/**
 * Determine if a file should be linted based on extension
 */
function shouldLint(filePath: string, linter: LinterConfig): boolean {
  const ext = filePath.toLowerCase();
  return linter.extensions.some(e => ext.endsWith(e));
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
    const toolName = data.tool_name || '';

    // Only validate file operations
    if (
!['Write', 'Edit', 'Read'].includes(toolName)
) {
      process.exit(0);
    }

    const filePath = getFilePath(data.tool_input);
    if (!filePath) {
      process.exit(0);
    }

    // Skip if file doesn't exist (Read may fail)
    if (!existsSync(filePath)) {
      process.exit(0);
    }

    // Find project root
    const projectRoot = findProjectRoot(filePath);
    if (!projectRoot) {
      // No project root found, skip linting
      process.exit(0);
    }

    // Find appropriate linter for this file type
    const linter = LINTER_CONFIGS.find(l => shouldLint(filePath, l));
    if (!linter) {
      process.exit(0);
    }

    // Check if project has linter config
    if (!linter.checkProject(projectRoot)) {
      process.exit(0);
    }

    // Run linter and wait for result before exiting
    const { issues, success } = await runLinter(linter, filePath, projectRoot);

    if (success && issues.length > 0) {
      console.error(`[PostToolUseValidator] Quality issues in ${filePath}:`);
      issues.forEach(issue => console.error(`  ${issue}`));
    } else if (!success) {
      console.error(`[PostToolUseValidator] ${linter.name} not available for ${filePath}`);
    }

    // Exit after linter completes (still non-blocking for the workflow)
    process.exit(0);
  } catch (error) {
    // Silent failure - don't disrupt workflow
    process.exit(0);
  }
}

main();
