import { Bot } from "grammy";
import { Database } from 'bun:sqlite';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");
const TRADING_DB_PATH = `${process.env.HOME}/trading-system/database/behemoth.db`;

const db = new Database(TRADING_DB_PATH, { readonly: true });

// Get signals from today
const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
const now = Math.floor(Date.now() / 1000);

const signalsCount = db.query(
  'SELECT COUNT(*) as count FROM signals WHERE timestamp >= ? AND timestamp <= ?'
).get(startOfDay, now) as any;

const tradesCount = db.query(
  'SELECT COUNT(*) as count FROM trades WHERE entry_timestamp >= ? AND entry_timestamp <= ?'
).get(startOfDay, now) as any;

const activeCount = db.query(
  "SELECT COUNT(*) as count FROM trades WHERE exit_timestamp IS NULL OR exit_timestamp = 0"
).get() as any;

const pnlResult = db.query(
  'SELECT COALESCE(SUM(pnl), 0) as pnl FROM trades WHERE exit_timestamp >= ? AND exit_timestamp <= ?'
).get(startOfDay, now) as any;

const lastSignal = db.query(
  'SELECT symbol, direction, timestamp FROM signals ORDER BY timestamp DESC LIMIT 1'
).get() as any;

const lastTrade = db.query(
  'SELECT symbol, direction, entry_timestamp FROM trades ORDER BY entry_timestamp DESC LIMIT 1'
).get() as any;

db.close();

let lastSignalStr = 'None';
let lastTradeStr = 'None';

if (lastSignal) {
  const timeAgo = Math.floor((Date.now() - lastSignal.timestamp * 1000) / 60000);
  lastSignalStr = `${lastSignal.symbol} ${lastSignal.direction} (${timeAgo}m ago)`;
}

if (lastTrade) {
  const timeAgo = Math.floor((Date.now() - lastTrade.entry_timestamp * 1000) / 60000);
  lastTradeStr = `${lastTrade.symbol} ${lastTrade.direction} (${timeAgo}m ago)`;
}

const digest = `
🪙 *Crypto Trading System Digest*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 *${new Date().toLocaleString()}*

✅ *Database: Online*

📊 *Today's Performance*
   📈 Signals: ${signalsCount?.count || 0}
   💼 Trades: ${tradesCount?.count || 0}
   💰 P&L: $${(pnlResult?.pnl || 0).toFixed(2)}
   🔓 Active Positions: ${activeCount?.count || 0}

⏱️ *Recent Activity*
   📊 Last Signal: ${lastSignalStr}
   💹 Last Trade: ${lastTradeStr}
`;

console.log('Sending trading digest...');
await bot.api.sendMessage(parseInt(process.env.TELEGRAM_USER_ID || '0'), digest, { parse_mode: 'Markdown' });
console.log('✓ Digest sent successfully!');
