/**
 * Auto-Commit Hook
 * Automatically commits file edits to git with semantic commit messages
 *
 * Trigger: Post file edit
 * Priority: 10
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface HookContext {
  filesEdited: string[];
  editType: 'create' | 'update' | 'delete';
  timestamp: number;
}

interface AutoCommitConfig {
  enabled: boolean;
  commitThreshold: number; // Minimum files edited before auto-commit
  excludePatterns: string[]; // File patterns to exclude
  commitMessagePrefix?: string; // Optional prefix for all commits
}

const DEFAULT_CONFIG: AutoCommitConfig = {
  enabled: true,
  commitThreshold: 1,
  excludePatterns: ['*.log', '*.tmp', '.git/*', 'node_modules/*'],
  commitMessagePrefix: '🤖'
};

/**
 * Generate semantic commit message based on files edited
 */
function generateCommitMessage(files: string[], editType: string): string {
  const config = loadConfig();

  // Determine commit type based on edit type and file patterns
  let commitType = 'chore';
  if (editType === 'create') commitType = 'feat';
  else if (editType === 'delete') commitType = 'refactor';

  // Analyze file paths for scope
  const scopes = files
    .map(f => {
      const parts = f.split('/');
      if (parts.length >= 2) return parts[0]; // First directory
      if (f.includes('test')) return 'test';
      if (f.includes('doc')) return 'docs';
      return null;
    })
    .filter(Boolean) as string[];

  // Unique scopes, max 3
  const uniqueScopes = [...new Set(scopes)].slice(0, 3).join(',');

  // Build commit message
  let message = `${commitType}`;
  if (uniqueScopes) message += `(${uniqueScopes})`;

  // Add prefix if configured
  if (config.commitMessagePrefix) {
    message = `${config.commitMessagePrefix} ${message}`;
  }

  // Add file count
  message += `: ${files.length} file${files.length > 1 ? 's' : ''} auto-committed`;

  return message;
}

/**
 * Load hook configuration
 */
function loadConfig(): AutoCommitConfig {
  const configPath = join(process.env.HOME || '', '.claude', 'hooks.json');

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return {
      ...DEFAULT_CONFIG,
      ...config.settings?.['auto-commit']
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(filePath);
  });
}

/**
 * Main hook execution
 */
export async function execute(context: HookContext): Promise<void> {
  const config = loadConfig();

  if (!config.enabled) {
    return;
  }

  // Filter excluded files
  const filesToCommit = context.filesEdited.filter(
    f => !shouldExclude(f, config.excludePatterns)
  );

  // Check threshold
  if (filesToCommit.length < config.commitThreshold) {
    return;
  }

  try {
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir > /dev/null 2>&1', {
      cwd: process.env.HOME || '',
      stdio: 'ignore'
    });

    // Stage files
    execSync(`git add ${filesToCommit.join(' ')}`, {
      cwd: process.env.HOME || '',
      stdio: 'ignore'
    });

    // Generate commit message
    const message = generateCommitMessage(filesToCommit, context.editType);

    // Commit
    execSync(`git commit -m "${message}"`, {
      cwd: process.env.HOME || '',
      stdio: 'ignore'
    });

    console.log(`✅ Auto-committed ${filesToCommit.length} files`);
  } catch (error) {
    // Not in git repo or git failed - silently ignore
    console.debug('Auto-commit skipped:', error);
  }
}

// Hook metadata
export const metadata = {
  name: 'auto-commit',
  description: 'Automatically commits file edits to git',
  trigger: 'post-edit',
  priority: 10,
  version: '1.0.0'
};
