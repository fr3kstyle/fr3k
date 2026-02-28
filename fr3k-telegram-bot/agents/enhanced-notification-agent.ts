#!/usr/bin/env bun
/**
 * FR3K Crypto Trading System Notification Agent
 *
 * Sends hourly digest of crypto trading system status:
 * - Crypto prices (BTC, ETH, SOL, XRP)
 * - Signals generated today
 * - Active trades and P&L
 * - System health
 * - Recent trading activity
 */

import { Bot } from "grammy";
import { Database } from 'bun:sqlite';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const TRADING_DB_PATH = `${process.env.HOME}/trading-system/database/behemoth.db`;

// Initialize bot
const bot = new Bot(BOT_TOKEN);

// ============================================================================
// CRYPTO PRICES
// ============================================================================

async function getCryptoPrices(): Promise<string> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd&include_24hr_change=true'
    );
    const data = await response.json();

    const btcPrice = data.bitcoin?.usd?.toLocaleString() || 'N/A';
    const btcChange = data.bitcoin?.usd_24h_change?.toFixed(2) || 'N/A';
    const ethPrice = data.ethereum?.usd?.toLocaleString() || 'N/A';
    const ethChange = data.ethereum?.usd_24h_change?.toFixed(2) || 'N/A';
    const solPrice = data.solana?.usd?.toLocaleString() || 'N/A';
    const solChange = data.solana?.usd_24h_change?.toFixed(2) || 'N/A';
    const xrpPrice = data.ripple?.usd?.toLocaleString() || 'N/A';
    const xrpChange = data.ripple?.usd_24h_change?.toFixed(2) || 'N/A';

    const btcEmoji = parseFloat(btcChange) >= 0 ? '📈' : '📉';
    const ethEmoji = parseFloat(ethChange) >= 0 ? '📈' : '📉';
    const solEmoji = parseFloat(solChange) >= 0 ? '📈' : '📉';
    const xrpEmoji = parseFloat(xrpChange) >= 0 ? '📈' : '📉';

    let prices = `💰 *Crypto Prices*\n`;
    prices += `   BTC: $${btcPrice} (${btcEmoji} ${btcChange}%)\n`;
    prices += `   ETH: $${ethPrice} (${ethEmoji} ${ethChange}%)\n`;
    prices += `   SOL: $${solPrice} (${solEmoji} ${solChange}%)\n`;
    prices += `   XRP: $${xrpPrice} (${xrpEmoji} ${xrpChange}%)\n\n`;

    return prices;
  } catch (error) {
    console.error('[Crypto] Error fetching prices:', error);
    return `💰 *Crypto Prices*\n   Unable to fetch prices\n\n`;
  }
}

// ============================================================================
// TRADING DATABASE QUERIES
// ============================================================================

interface TradingStats {
  signals_today: number;
  trades_executed: number;
  active_trades: number;
  pnl_today: number;
  win_rate: number;
  last_signal: string;
  last_trade: string;
  database_online: boolean;
}

/**
 * Query trading system database for stats
 */
function getTradingStats(): TradingStats {
  const stats: TradingStats = {
    signals_today: 0,
    trades_executed: 0,
    active_trades: 0,
    pnl_today: 0,
    win_rate: 0,
    last_signal: 'None',
    last_trade: 'None',
    database_online: false
  };

  try {
    const db = new Database(TRADING_DB_PATH, { readonly: true });
    stats.database_online = true;

    // Get signals from today (start of day to now)
    const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const now = Math.floor(Date.now() / 1000);

    const signalsCount = db.query(
      'SELECT COUNT(*) as count FROM signals WHERE timestamp >= ? AND timestamp <= ?'
    ).get(startOfDay, now) as any;
    stats.signals_today = signalsCount?.count || 0;

    // Get trades executed today
    const tradesCount = db.query(
      'SELECT COUNT(*) as count FROM trades WHERE entry_timestamp >= ? AND entry_timestamp <= ?'
    ).get(startOfDay, now) as any;
    stats.trades_executed = tradesCount?.count || 0;

    // Get active trades (open positions)
    const activeCount = db.query(
      "SELECT COUNT(*) as count FROM trades WHERE exit_timestamp IS NULL OR exit_timestamp = 0"
    ).get() as any;
    stats.active_trades = activeCount?.count || 0;

    // Get P&L today (realized profits from closed trades)
    const pnlResult = db.query(
      'SELECT COALESCE(SUM(pnl), 0) as pnl FROM trades WHERE exit_timestamp >= ? AND exit_timestamp <= ?'
    ).get(startOfDay, now) as any;
    stats.pnl_today = pnlResult?.pnl || 0;

    // Calculate win rate today
    const winResult = db.query(
      'SELECT COUNT(*) as wins FROM trades WHERE exit_timestamp >= ? AND exit_timestamp <= ? AND pnl > 0'
    ).get(startOfDay, now) as any;
    const wins = winResult?.wins || 0;
    stats.win_rate = stats.trades_executed > 0 ? (wins / stats.trades_executed) * 100 : 0;

    // Get last signal
    const lastSignal = db.query(
      'SELECT symbol, direction, timestamp FROM signals ORDER BY timestamp DESC LIMIT 1'
    ).get() as any;
    if (lastSignal) {
      const timeAgo = Math.floor((Date.now() - lastSignal.timestamp * 1000) / 60000);
      stats.last_signal = `${lastSignal.symbol} ${lastSignal.direction} (${timeAgo}m ago)`;
    }

    // Get last trade
    const lastTrade = db.query(
      'SELECT symbol, direction, entry_timestamp FROM trades ORDER BY entry_timestamp DESC LIMIT 1'
    ).get() as any;
    if (lastTrade) {
      const timeAgo = Math.floor((Date.now() - lastTrade.entry_timestamp * 1000) / 60000);
      stats.last_trade = `${lastTrade.symbol} ${lastTrade.direction} (${timeAgo}m ago)`;
    }

    db.close();
  } catch (error) {
    console.error('[Trading DB] Error:', error);
    stats.database_online = false;
  }

  return stats;
}

// ============================================================================
// DIGEST GENERATION
// ============================================================================

/**
 * Generate trading system status digest
 */
async function generateTradingDigest(): Promise<string> {
  let markdown = `
🪙 *Crypto Trading System Digest*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 *${new Date().toLocaleString()}*

`;

  try {
    // Get crypto prices
    const prices = await getCryptoPrices();
    markdown += prices;

    // Get trading statistics
    const stats = getTradingStats();

    // Database status
    const dbEmoji = stats.database_online ? '✅' : '❌';
    markdown += `${dbEmoji} *Database: ${stats.database_online ? 'Online' : 'Offline'}*\n\n`;

    if (!stats.database_online) {
      markdown += `\n⚠️ Trading database offline - cannot fetch system stats\n`;
      return markdown.trim();
    }

    // Today's Performance
    markdown += `📊 *Today's Performance*\n`;
    markdown += `   📈 Signals: ${stats.signals_today}\n`;
    markdown += `   💼 Trades: ${stats.trades_executed}\n`;
    markdown += `   💰 P&L: $${stats.pnl_today.toFixed(2)}\n`;
    markdown += `   🎯 Win Rate: ${stats.win_rate.toFixed(1)}%\n`;
    markdown += `   🔓 Active Positions: ${stats.active_trades}\n\n`;

    // Recent Activity
    markdown += `⏱️ *Recent Activity*\n`;
    markdown += `   📊 Last Signal: ${stats.last_signal}\n`;
    markdown += `   💹 Last Trade: ${stats.last_trade}\n\n`;

    // System Health
    const health = await getSystemHealth();
    markdown += `${health}\n`;

  } catch (error) {
    markdown += `\n❌ Error generating digest: ${error}\n`;
  }

  return markdown.trim();
}

/**
 * Get system health summary
 */
async function getSystemHealth(): Promise<string> {
  try {
    // Check disk usage
    const diskProc = Bun.spawn(['df', '-h', '/home'], { stdout: 'pipe' });
    const diskOutput = await new Response(diskProc.stdout).text();
    const diskLines = diskOutput.trim().split('\n');
    const diskData = diskLines[1].split(/\s+/);
    const diskPercent = diskData[4];

    // Check memory
    const memProc = Bun.spawn(['free', '-h'], { stdout: 'pipe' });
    const memOutput = await new Response(memProc.stdout).text();
    const memLines = memOutput.trim().split('\n');
    const memData = memLines[1].split(/\s+/);
    const memUsed = memData[2];
    const memTotal = memData[1];

    // Check trading system processes
    const tradingProc = Bun.spawn([
      'pgrep', '-f', '-a', 'trading-system'
    ], { stdout: 'pipe' });
    const tradingOutput = await new Response(tradingProc.stdout).text();
    const tradingProcesses = tradingOutput.trim().split('\n').filter(l => l.length > 0).length;

    return `
🖥️ *System Health*
   💾 Disk: ${diskPercent} used
   🧠 Memory: ${memUsed} / ${memTotal}
   ⚙️  Trading Processes: ${tradingProcesses}
`;
  } catch (error) {
    return `🖥️ System health: unavailable\n`;
  }
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

/**
 * Send rich content notification to Telegram
 */
async function sendTelegramNotification(message: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
  try {
    const chatId = parseInt(ALLOWED_USER_ID);
    await bot.api.sendMessage(chatId, message, { parse_mode: parseMode });
    console.log('[Telegram] Trading digest sent');
    return true;
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error);
    return false;
  }
}

// ============================================================================
// MAIN LOOP
// ============================================================================

let lastHourlyDigest = 0;
const HOURLY_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function mainLoop(): Promise<void> {
  const now = Date.now();
  const timeSinceLastDigest = now - lastHourlyDigest;

  // Send hourly digest
  if (timeSinceLastDigest >= HOURLY_INTERVAL_MS || lastHourlyDigest === 0) {
    console.log(`[${new Date().toISOString()}] Sending hourly trading digest...`);

    const digest = await generateTradingDigest();
    await sendTelegramNotification(digest);

    lastHourlyDigest = now;
  }

  // Schedule next check
  setTimeout(mainLoop, 60000); // Check every minute
}

// ============================================================================
// STARTUP
// ============================================================================

async function startup(): Promise<void> {
  console.log('🚀 FR3K Trading System Notification Agent Starting...');

  // Wait for system to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Send startup notification
  const startupMessage = `
🪙 *Crypto Trading System Notification Agent*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Online and monitoring trading system
📊 Hourly trading digests: Active
💰 Crypto prices: BTC, ETH, SOL, XRP
💾 Database: ${TRADING_DB_PATH}

Watching BEHEMOTH trading system 24/7!
`;

  await sendTelegramNotification(startupMessage);

  // Voice notification via local voice server
  try {
    await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Trading Notification Agent',
        message: 'Trading system notification agent online',
        priority: 6
      })
    });
  } catch (error) {
    console.error('Voice notification failed:', error);
  }

  // Start main loop
  console.log('🔄 Starting main loop...');
  mainLoop();

  console.log('✅ Trading notification agent ready!');

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Trading notification agent shutting down...');
    bot.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start
startup().catch(console.error);
