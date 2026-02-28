/**
 * Dependency Monitor Hook
 * Checks for outdated dependencies and security vulnerabilities on session start
 *
 * Trigger: Session start
 * Priority: 5
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface HookContext {
  sessionId: string;
  startTime: number;
}

interface DependencyCheck {
  outdated: PackageCheck[];
  vulnerable: VulnerabilityCheck[];
  timestamp: number;
}

interface PackageCheck {
  name: string;
  current: string;
  latest: string;
  type: 'dev' | 'prod';
}

interface VulnerabilityCheck {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  vulnerability: string;
}

interface DependencyMonitorConfig {
  enabled: boolean;
  checkInterval: number; // Milliseconds between checks
  severity: 'low' | 'moderate' | 'high' | 'critical';
  cacheFile: string;
}

const DEFAULT_CONFIG: DependencyMonitorConfig = {
  enabled: true,
  checkInterval: 86400000, // 24 hours
  severity: 'moderate',
  cacheFile: '/tmp/fr3k-dependency-cache.json'
};

/**
 * Load hook configuration
 */
function loadConfig(): DependencyMonitorConfig {
  const configPath = join(process.env.HOME || '', '.claude', 'hooks.json');

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return {
      ...DEFAULT_CONFIG,
      ...config.settings?.['dependency-monitor']
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Load cached check results
 */
function loadCache(): DependencyCheck | null {
  const config = loadConfig();

  if (!existsSync(config.cacheFile)) {
    return null;
  }

  try {
    const cache = JSON.parse(readFileSync(config.cacheFile, 'utf-8'));
    const age = Date.now() - cache.timestamp;

    // Return cache if fresh enough
    if (age < config.checkInterval) {
      return cache;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Save check results to cache
 */
function saveCache(check: DependencyCheck): void {
  const config = loadConfig();

  try {
    writeFileSync(config.cacheFile, JSON.stringify(check), 'utf-8');
  } catch (error) {
    console.debug('Failed to save dependency cache:', error);
  }
}

/**
 * Check for outdated packages
 */
function checkOutdated(): PackageCheck[] {
  const outdated: PackageCheck[] = [];

  try {
    // Check npm outdated
    const output = execSync('npm outdated --json', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    const data = JSON.parse(output);
    for (const [name, info] of Object.entries(data)) as any) {
      outdated.push({
        name,
        current: info.current,
        latest: info.latest,
        type: info.type || 'prod'
      });
    }
  } catch (error) {
    // Command failed (no outdated packages or not an npm project)
    // Try bun
    try {
      const output = execSync('bun pm outdated --json', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const data = JSON.parse(output);
      for (const [name, info] of Object.entries(data)) as any) {
        outdated.push({
          name,
          current: info.current,
          latest: info.latest,
          type: 'prod'
        });
      }
    } catch {
      // No package manager or no outdated packages
    }
  }

  return outdated;
}

/**
 * Check for security vulnerabilities
 */
function checkVulnerabilities(): VulnerabilityCheck[] {
  const vulnerabilities: VulnerabilityCheck[] = [];

  try {
    // Run npm audit
    const output = execSync('npm audit --json', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    const data = JSON.parse(output);
    const vulns = data.vulnerabilities || {};

    for (const [name, info] of Object.entries(vulns) as any) {
      if (info.severity === 'critical' || info.severity === 'high') {
        vulnerabilities.push({
          name,
          severity: info.severity,
          vulnerability: info.via?.[0]?.title || 'Security vulnerability'
        });
      }
    }
  } catch (error) {
    // Audit failed (not an npm project or no vulnerabilities)
  }

  return vulnerabilities;
}

/**
 * Send notification about dependency issues
 */
async function notifyIssues(check: DependencyCheck): Promise<void> {
  const messages: string[] = [];

  if (check.outdated.length > 0) {
    messages.push(`⚠️ ${check.outdated.length} outdated packages`);
    // Show top 3
    check.outdated.slice(0, 3).forEach(pkg => {
      messages.push(`   - ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
    });
  }

  if (check.vulnerable.length > 0) {
    messages.push(`🚨 ${check.vulnerable.length} vulnerable packages`);
    check.vulnerable.forEach(vuln => {
      messages.push(`   - ${vuln.name}: ${vuln.severity} - ${vuln.vulnerability}`);
    });
  }

  if (messages.length > 0) {
    // Send to voice server
    try {
      const message = `Dependency check complete. ${check.outdated.length} outdated, ${check.vulnerable.length} vulnerable`;
      execSync(
        `curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d '${JSON.stringify({ message, voice_id: "21m00Tcm4TlvDq8ikWAM" })}'`,
        { stdio: 'ignore' }
      );
    } catch {
      // Voice server not available
    }

    // Log to console
    console.log('\n📦 Dependency Check Results:');
    messages.forEach(msg => console.log(msg));
  }
}

/**
 * Main hook execution
 */
export async function execute(context: HookContext): Promise<void> {
  const config = loadConfig();

  if (!config.enabled) {
    return;
  }

  // Check cache
  const cached = loadCache();
  if (cached) {
    console.log('✅ Dependency check recent (cached)');
    return;
  }

  // Run checks
  const outdated = checkOutdated();
  const vulnerable = checkVulnerabilities();

  const check: DependencyCheck = {
    outdated,
    vulnerable,
    timestamp: Date.now()
  };

  // Save to cache
  saveCache(check);

  // Notify if issues found
  if (outdated.length > 0 || vulnerable.length > 0) {
    await notifyIssues(check);
  } else {
    console.log('✅ All dependencies up to date and secure');
  }
}

// Hook metadata
export const metadata = {
  name: 'dependency-monitor',
  description: 'Checks for outdated and vulnerable dependencies',
  trigger: 'session-start',
  priority: 5,
  version: '1.0.0'
};
