#!/usr/bin/env bun
/**
 * FR3K Autonomous Monitor - Fixed Version
 *
 * Proactive monitoring with proper message formatting
 * to avoid broken Telegram status updates.
 */

import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const UPDATE_INTERVAL_MS = 1200000; // 20 minutes
const CHECK_INTERVAL_MS = 60000; // Check every minute

interface TaskResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

let lastUpdateTime = 0;
let taskResults: TaskResult[] = [];

const bot = new Bot(BOT_TOKEN);

// ============================================================================
// MONITORING TASKS (Simplified for reliability)
// ============================================================================

async function checkSystemHealth(): Promise<TaskResult> {
  try {
    // Check disk usage
    const diskProc = Bun.spawn(['df', '-h', '/home'], { stdout: 'pipe' });
    const diskOutput = await new Response(diskProc.stdout).text();
    const diskLines = diskOutput.trim().split('\n');
    const diskData = diskLines[1].split(/\s+/);
    const diskPercent = parseInt(diskData[4].replace('%', ''));

    let status: 'success' | 'warning' | 'error' = 'success';
    if (diskPercent > 90) status = 'error';
    else if (diskPercent > 85) status = 'warning';

    return {
      name: 'Disk Usage',
      status,
      message: `${diskPercent}% used`,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Disk Usage',
      status: 'warning',
      message: 'Check failed',
      timestamp: Date.now()
    };
  }
}

async function checkServices(): Promise<TaskResult> {
  try {
    const services = ['pai-voice-server', 'pai-telegram-bot', 'pai-memu-bridge', 'nanobot'];
    let running = 0;

    for (const service of services) {
      const proc = Bun.spawn(['systemctl', '--user', 'is-active', service], { stdout: 'pipe' });
      const output = await new Response(proc.stdout).text();
      if (output.trim() === 'active') running++;
    }

    const status = running === services.length ? 'success' : running >= services.length - 1 ? 'warning' : 'error';
    return {
      name: 'Services',
      status,
      message: `${running}/${services.length} running`,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Services',
      status: 'warning',
      message: 'Unable to check',
      timestamp: Date.now()
    };
  }
}

async function checkMemory(): Promise<TaskResult> {
  try {
    const memProc = Bun.spawn(['free', '-h'], { stdout: 'pipe' });
    const memOutput = await new Response(memProc.stdout).text();
    const memLines = memOutput.trim().split('\n');
    const memData = memLines[1].split(/\s+/);
    const memUsed = memData[2];
    const memTotal = memData[1];

    // Extract percentage
    const memPercentMatch = memData[4].match(/(\d+)%/);
    const memPercent = memPercentMatch ? parseInt(memPercentMatch[1]) : 50;

    let status: 'success' | 'warning' | 'error' = 'success';
    if (memPercent > 90) status = 'error';
    else if (memPercent > 80) status = 'warning';

    return {
      name: 'Memory',
      status,
      message: `${memUsed}/${memTotal}`,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Memory',
      status: 'warning',
      message: 'Check failed',
      timestamp: Date.now()
    };
  }
}

// ============================================================================
// REPORT GENERATION (Fixed - avoids long messages and special chars)
// ============================================================================

function generateSafeReport(results: TaskResult[]): string {
  const emoji = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  // Keep messages short and avoid special formatting issues
  let report = `FR3K Monitor Report\n`;
  report += `${new Date().toLocaleTimeString()}\n\n`;

  for (const result of results) {
    report += `${emoji[result.status]} ${result.name}: ${result.message}\n`;
  }

  // Overall status
  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  if (hasErrors) {
    report += `\nStatus: Issues detected`;
  } else if (hasWarnings) {
    report += `\nStatus: Minor warnings`;
  } else {
    report += `\nStatus: All systems OK`;
  }

  // Ensure message is under 4000 characters (Telegram limit is 4096)
  if (report.length > 3900) {
    report = report.substring(0, 3900) + '...';
  }

  return report;
}

// ============================================================================
// UPDATE DELIVERY
// ============================================================================

async function sendUpdate() {
  try {
    console.log('[Monitor] Running checks...');

    // Run all tasks
    taskResults = await Promise.all([
      checkSystemHealth(),
      checkServices(),
      checkMemory()
    ]);

    // Check for critical issues
    const criticalIssues = taskResults.filter(r => r.status === 'error');

    if (criticalIssues.length > 0) {
      console.log(`[Monitor] ${criticalIssues.length} critical issues detected`);

      // Voice notification for critical issues
      try {
        await fetch('http://localhost:8888/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Monitor: ${criticalIssues.length} critical issues`,
            priority: 8
          })
        });
      } catch (e) {
        // Voice failed, continue
      }
    }

    // Generate safe report
    const report = generateSafeReport(taskResults);

    // Send to Telegram
    const chatId = parseInt(ALLOWED_USER_ID);
    await bot.api.sendMessage(chatId, report);

    console.log('[Monitor] Update sent successfully');
    lastUpdateTime = Date.now();

  } catch (error) {
    console.error('[Monitor] Failed to send update:', error);
  }
}

// ============================================================================
// MONITORING LOOP
// ============================================================================

async function monitoringLoop() {
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;

  // Check if it's time for an update
  if (timeSinceLastUpdate >= UPDATE_INTERVAL_MS || lastUpdateTime === 0) {
    await sendUpdate();
  }

  // Schedule next check
  setTimeout(monitoringLoop, CHECK_INTERVAL_MS);
}

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  console.log('[Monitor] Autonomous Monitor Starting...');

  // Wait for system to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Send startup report
  console.log('[Monitor] Running startup checks...');
  taskResults = await Promise.all([
    checkSystemHealth(),
    checkServices(),
    checkMemory()
  ]);

  const startupReport = `FR3K Monitor - ONLINE
${new Date().toLocaleTimeString()}
Update interval: ${UPDATE_INTERVAL_MS / 60000} minutes

${generateSafeReport(taskResults)}

Monitoring active!`;

  try {
    const chatId = parseInt(ALLOWED_USER_ID);
    await bot.api.sendMessage(chatId, startupReport);
    console.log('[Monitor] Startup report sent');
  } catch (error) {
    console.error('[Monitor] Failed to send startup report:', error);
  }

  lastUpdateTime = Date.now();

  // Start monitoring loop
  console.log('[Monitor] Starting monitoring loop...');
  monitoringLoop();

  console.log('[Monitor] Autonomous monitor ready!');

  // Voice notification
  try {
    await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Autonomous monitor online',
        priority: 6
      })
    });
  } catch (error) {
    console.error('[Monitor] Voice notification failed:', error);
  }
}

// Graceful shutdown
const shutdown = () => {
  console.log('[Monitor] Shutting down...');
  bot.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
startup().catch(console.error);
