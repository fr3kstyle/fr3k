#!/usr/bin/env bun
/**
 * PAI Proactive Agent - Autonomous background operations
 *
 * Performs proactive maintenance, monitoring, and optimizations
 * without requiring user intervention.
 */

import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const MAIN_LOOP_INTERVAL_MS = 300000; // 5 minutes
const QUICK_CHECK_INTERVAL_MS = 60000; // 1 minute

// Task execution tracking
interface TaskResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

let taskResults: TaskResult[] = [];

// Initialize bot for sending alerts
const bot = new Bot(BOT_TOKEN);

// ============================================================================
// PROACTIVE TASKS
// ============================================================================

async function cleanupTempFiles(): Promise<TaskResult> {
  try {
    const proc = Bun.spawn({
      cmd: ['bash', '-c', 'find /tmp -name "pai-*" -mtime +1 -delete 2>/dev/null || true'],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    await proc.exited;

    return {
      name: 'Temp File Cleanup',
      status: 'success',
      message: 'Cleaned old temp files',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Temp File Cleanup',
      status: 'warning',
      message: `Cleanup failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

async function checkDiskSpace(): Promise<TaskResult> {
  try {
    const proc = Bun.spawn({
      cmd: ['df', '-h', '/home'],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    const output = await new Response(proc.stdout).text();
    const lines = output.trim().split('\n');
    const data = lines[1].split(/\s+/);
    const usedPercent = parseInt(data[4].replace('%', ''));

    if (usedPercent > 85) {
      return {
        name: 'Disk Space Check',
        status: 'warning',
        message: `Disk usage high: ${usedPercent}%`,
        timestamp: Date.now()
      };
    }

    return {
      name: 'Disk Space Check',
      status: 'success',
      message: `Disk usage: ${usedPercent}%`,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Disk Space Check',
      status: 'error',
      message: `Check failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

async function rotateLogs(): Promise<TaskResult> {
  try {
    const logsDir = '/home/fr3k/pai-telegram-bot/logs';
    const proc = Bun.spawn({
      cmd: ['bash', `-c`, `find ${logsDir} -name "*.log" -size +100M -exec gzip {} \\; 2>/dev/null || true`],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    await proc.exited;

    return {
      name: 'Log Rotation',
      status: 'success',
      message: 'Large logs compressed',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Log Rotation',
      status: 'warning',
      message: `Rotation failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

async function checkAgentHealth(): Promise<TaskResult> {
  try {
    const agents = [
      'agents/voice-agent.ts',
      'agents/communication-agent.ts',
      'agents/task-orchestrator.ts',
      'index.ts',
      'agents/proactive-agent.ts'
    ];

    const running: string[] = [];
    const dead: string[] = [];

    const agentDisplayNames: Record<string, string> = {
      'agents/voice-agent.ts': 'voice-agent',
      'agents/communication-agent.ts': 'communication-agent',
      'agents/task-orchestrator.ts': 'task-orchestrator',
      'index.ts': 'main-bot',
      'agents/proactive-agent.ts': 'proactive-agent'
    };

    for (const agent of agents) {
      const proc = Bun.spawn({
        cmd: ['pgrep', '-f', agent],
        stdout: 'pipe',
        stderr: 'pipe'
      });
      const output = await new Response(proc.stdout).text();

      if (output.trim().length > 0) {
        running.push(agentDisplayNames[agent]);
      } else {
        dead.push(agentDisplayNames[agent]);
      }
    }

    if (dead.length > 0) {
      return {
        name: 'Agent Health Check',
        status: 'error',
        message: `Dead agents: ${dead.join(', ')}`,
        timestamp: Date.now()
      };
    }

    return {
      name: 'Agent Health Check',
      status: 'success',
      message: `All ${running.length} agents healthy`,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Agent Health Check',
      status: 'error',
      message: `Health check failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

async function clearBunCache(): Promise<TaskResult> {
  try {
    const proc = Bun.spawn({
      cmd: ['bash', '-c', 'rm -rf ~/.bun/install/cache/* 2>/dev/null || true'],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    await proc.exited;

    return {
      name: 'Cache Cleanup',
      status: 'success',
      message: 'Bun cache cleared',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Cache Cleanup',
      status: 'warning',
      message: `Cleanup failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

async function checkForUpdates(): Promise<TaskResult> {
  try {
    const proc = Bun.spawn({
      cmd: ['bash', '-c', 'cd /home/fr3k/pai-telegram-bot && bun update --check 2>&1 | head -5'],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    const output = await new Response(proc.stdout).text();

    return {
      name: 'Update Check',
      status: 'success',
      message: 'Checked for updates',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      name: 'Update Check',
      status: 'warning',
      message: `Update check failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

// ============================================================================
// TASK EXECUTION
// ============================================================================

async function runProactiveTasks(): Promise<TaskResult[]> {
  const results: TaskResult[] = [];

  console.log(`🔍 [${new Date().toISOString()}] Running proactive tasks...`);

  // Run all proactive tasks
  results.push(await cleanupTempFiles());
  results.push(await checkDiskSpace());
  results.push(await rotateLogs());
  results.push(await checkAgentHealth());
  results.push(await clearBunCache());
  results.push(await checkForUpdates());

  return results;
}

function generateTaskReport(results: TaskResult[]): string {
  const emoji = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  let report = `
🤖 PAI Proactive Agent Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString()}
`;

  for (const result of results) {
    report += `\n${emoji[result.status]} ${result.name}\n   ${result.message}\n`;
  }

  // Overall status
  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  report += `\n`;
  if (hasErrors) {
    report += `🚨 Status: Issues detected - attention needed\n`;
  } else if (hasWarnings) {
    report += `⚠️  Status: Minor warnings - monitoring\n`;
  } else {
    report += `✨ Status: All systems optimal\n`;
  }

  return report.trim();
}

// ============================================================================
// MAIN LOOP
// ============================================================================

let lastFullRun = 0;

async function mainLoop() {
  const now = Date.now();
  const timeSinceLastRun = now - lastFullRun;

  // Run full proactive tasks every 5 minutes
  if (timeSinceLastRun >= MAIN_LOOP_INTERVAL_MS || lastFullRun === 0) {
    console.log('⚡ Running full proactive tasks...');
    taskResults = await runProactiveTasks();

    // Check for critical issues
    const criticalIssues = taskResults.filter(r => r.status === 'error');

    if (criticalIssues.length > 0) {
      console.log(`🚨 ${criticalIssues.length} critical issues detected`);

      const report = generateTaskReport(taskResults);

      try {
        const chatId = parseInt(ALLOWED_USER_ID);
        await bot.api.sendMessage(chatId, report);
        console.log('✅ Critical alert sent');
      } catch (error) {
        console.error('❌ Failed to send alert:', error);
      }
    }

    lastFullRun = Date.now();
  }

  // Schedule next check
  setTimeout(mainLoop, QUICK_CHECK_INTERVAL_MS);
}

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  console.log('🚀 PAI Proactive Agent Starting...');

  // Wait for system to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Run initial tasks
  console.log('📊 Running initial proactive tasks...');
  taskResults = await runProactiveTasks();

  const startupReport = `
🤖 PAI Proactive Agent - ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Started: ${new Date().toLocaleString()}
🔄 Check interval: ${MAIN_LOOP_INTERVAL_MS / 60000} minute(s)

${generateTaskReport(taskResults)}

✨ Proactive monitoring active!
  `.trim();

  try {
    const chatId = parseInt(ALLOWED_USER_ID);
    await bot.api.sendMessage(chatId, startupReport);
    console.log('✅ Startup report sent');
  } catch (error) {
    console.error('❌ Failed to send startup report:', error);
  }

  lastFullRun = Date.now();

  // Start main loop
  console.log('🔄 Starting main loop...');
  mainLoop();

  console.log('✅ Proactive agent ready!');

  // Voice notification
  try {
    await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Proactive agent online',
        phase: 'complete',
        priority: 6
      })
    });
  } catch (error) {
    console.error('❌ Voice notification failed:', error);
  }
}

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Proactive agent shutting down...');
  bot.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
startup().catch(console.error);
