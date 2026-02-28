#!/usr/bin/env bun
/**
 * FR3K Crypto Market Monitor
 *
 * Sends crypto market overview every 28 minutes with top volatile pairs
 * Using Bybit API (real trading system data)
 */

import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_USER_ID || "";
const UPDATE_INTERVAL_MS = 1680000; // 28 minutes

const bot = new Bot(BOT_TOKEN);

// ============================================================================
// BYBIT API INTEGRATION
// ============================================================================

interface BybitTicker {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  volume24h: string;
  turnover24h: string;
}

interface BybitKlineResponse {
  retCode: number;
  result: {
    list: string[][];  // [startTime, open, high, low, close, volume, ...]
  };
}

interface CryptoPrice {
  price: string;
  change: string;
  emoji: string;
}

/**
 * Fetch crypto prices from Bybit (no API key needed for public data)
 */
async function getCryptoPrices(): Promise<Record<string, CryptoPrice>> {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT'];
  const prices: Record<string, CryptoPrice> = {};

  try {
    // Fetch all tickers at once (more efficient)
    const response = await fetch('https://api.bybit.com/v5/market/tickers?category=linear');
    const data = await response.json();

    if (data.retCode !== 0 || !data.result?.list) {
      throw new Error('Bybit API error');
    }

    const tickers = data.result.list as BybitTicker[];

    // Extract prices for our symbols
    for (const symbol of symbols) {
      const ticker = tickers.find(t => t.symbol === symbol);
      if (ticker) {
        const changePercent = parseFloat(ticker.price24hPcnt) * 100; // Convert decimal to percent
        prices[symbol] = {
          price: parseFloat(ticker.lastPrice).toLocaleString(),
          change: changePercent.toFixed(2),
          emoji: changePercent >= 0 ? '📈' : '📉'
        };
      }
    }

    return prices;
  } catch (error) {
    console.error('[Bybit] Error fetching prices:', error);
    return {};
  }
}

/**
 * Calculate short-term volatility (1m timeframe) for a single symbol
 * Uses last 10 candles of 1m data to calculate average volatility
 */
async function getShortTermVolatility(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=1&limit=10`
    );
    const data = (await response.json()) as BybitKlineResponse;

    if (data.retCode !== 0 || !data.result?.list || data.result.list.length === 0) {
      return 0;
    }

    // Calculate volatility for each candle: (high - low) / close * 100
    const candles = data.result.list;
    let totalVolatility = 0;

    for (const candle of candles) {
      // Format: [startTime, open, high, low, close, volume, ...]
      const high = parseFloat(candle[2]);
      const low = parseFloat(candle[3]);
      const close = parseFloat(candle[4]);

      if (close > 0) {
        const candleVolatility = ((high - low) / close) * 100;
        totalVolatility += candleVolatility;
      }
    }

    // Return average volatility across all candles
    return totalVolatility / candles.length;
  } catch (error) {
    console.error(`[Bybit] Error fetching kline for ${symbol}:`, error);
    return 0;
  }
}

/**
 * Fetch top 3 volatile pairs from Bybit futures using SHORT-TERM volatility (1m timeframe)
 * This is suitable for scalping - shows coins moving NOW, not 24h ago
 */
async function getTopVolatilePairs(): Promise<string[]> {
  try {
    // First, get all USDT pairs with decent volume
    const tickerResponse = await fetch('https://api.bybit.com/v5/market/tickers?category=linear');
    const tickerData = await tickerResponse.json();

    if (tickerData.retCode !== 0 || !tickerData.result?.list) {
      throw new Error('Bybit API error');
    }

    const tickers = tickerData.result.list as BybitTicker[];

    // Filter for USDT pairs with minimum volume (to avoid low-volume junk)
    const minVolume = 1000000; // $1M minimum 24h volume
    const viablePairs = tickers
      .filter(t => t.symbol.endsWith('USDT'))
      .filter(t => parseFloat(t.volume24h) * parseFloat(t.lastPrice) > minVolume)
      .map(t => t.symbol)
      .slice(0, 50); // Limit to top 50 by volume for performance

    // Calculate short-term volatility for each pair (parallel for speed)
    console.log(`[Monitor] Calculating 1m volatility for ${viablePairs.length} pairs...`);
    const volatilityPromises = viablePairs.map(async (symbol) => ({
      symbol,
      volatility: await getShortTermVolatility(symbol)
    }));

    const results = await Promise.all(volatilityPromises);

    // Sort by volatility and get top 3
    const topVolatile = results
      .sort((a, b) => b.volatility - a.volatility)
      .slice(0, 3);

    // Format output with direction (get current price change from last candle)
    const formatted = await Promise.all(topVolatile.map(async (v) => {
      try {
        // Get the last 1m candle to determine direction
        const response = await fetch(
          `https://api.bybit.com/v5/market/kline?category=linear&symbol=${v.symbol}&interval=1&limit=2`
        );
        const data = (await response.json()) as BybitKlineResponse;

        let direction = 0;
        if (data.result?.list && data.result.list.length > 0) {
          const lastCandle = data.result.list[0];
          const open = parseFloat(lastCandle[1]);
          const close = parseFloat(lastCandle[4]);
          direction = ((close - open) / open) * 100;
        }

        const emoji = direction >= 0 ? '🚀' : '💥';
        const symbolClean = v.symbol.replace('USDT', '');
        return `${emoji} ${symbolClean} (${v.volatility.toFixed(2)}% 1m vol)`;
      } catch {
        const symbolClean = v.symbol.replace('USDT', '');
        return `⚡ ${symbolClean} (${v.volatility.toFixed(2)}% 1m vol)`;
      }
    }));

    return formatted;
  } catch (error) {
    console.error('[Bybit] Failed to fetch volatility data:', error);
    return ['Unable to fetch volatility data'];
  }
}

// ============================================================================
// CRYPTO MARKET DATA
// ============================================================================

async function getCryptoMarketOverview(): Promise<string> {
  try {
    // Fetch crypto prices from Bybit
    const prices = await getCryptoPrices();

    const btc = prices['BTCUSDT'] || { price: 'N/A', change: 'N/A', emoji: '❓' };
    const eth = prices['ETHUSDT'] || { price: 'N/A', change: 'N/A', emoji: '❓' };
    const sol = prices['SOLUSDT'] || { price: 'N/A', change: 'N/A', emoji: '❓' };
    const xrp = prices['XRPUSDT'] || { price: 'N/A', change: 'N/A', emoji: '❓' };

    // Calculate trend from main coins
    const validChanges = [btc.change, eth.change, sol.change, xrp.change]
      .filter(c => c !== 'N/A')
      .map(c => parseFloat(c));

    const avgChange = validChanges.length > 0
      ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length
      : 0;

    const trend = avgChange >= 0 ? '🚀 Bullish' : '🐻 Bearish';

    let overview = `🪙 Crypto Market Overview\n`;
    overview += `${new Date().toLocaleTimeString()}\n\n`;
    overview += `💰 MAJOR COINS (Bybit Futures)\n`;
    overview += `BTC: $${btc.price} (${btc.emoji} ${btc.change}%)\n`;
    overview += `ETH: $${eth.price} (${eth.emoji} ${eth.change}%)\n`;
    overview += `SOL: $${sol.price} (${sol.emoji} ${sol.change}%)\n`;
    overview += `XRP: $${xrp.price} (${xrp.emoji} ${xrp.change}%)\n\n`;

    // Get top 3 volatile pairs
    const volatile = await getTopVolatilePairs();
    overview += `⚡ TOP VOLATILE (Bybit Futures)\n`;
    volatile.forEach(v => overview += `${v}\n`);

    overview += `\nTrend: ${trend}`;

    return overview;
  } catch (error) {
    console.error('[Monitor] Failed to fetch crypto data:', error);
    return `🪙 Crypto Market Overview\n${new Date().toLocaleTimeString()}\n\nUnable to fetch market data`;
  }
}

// ============================================================================
// UPDATE DELIVERY
// ============================================================================

async function sendUpdate() {
  try {
    console.log('[Monitor] Fetching crypto market data from Bybit...');

    // Get crypto overview
    const overview = await getCryptoMarketOverview();

    // Send to Telegram
    const chatId = parseInt(ALLOWED_USER_ID);
    await bot.api.sendMessage(chatId, overview);

    console.log('[Monitor] Crypto overview sent successfully');

    // Voice notification
    try {
      await fetch('http://localhost:8888/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Crypto market update ready',
          priority: 5
        })
      });
    } catch (e) {
      // Voice failed, continue
    }

  } catch (error) {
    console.error('[Monitor] Failed to send update:', error);
  }
}

// ============================================================================
// MONITORING LOOP
// ============================================================================

async function monitoringLoop() {
  await sendUpdate();

  // Schedule next update
  setTimeout(monitoringLoop, UPDATE_INTERVAL_MS);
}

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  console.log('[Monitor] Crypto Market Monitor Starting...');
  console.log('[Monitor] Using Bybit API for real trading system data');

  // Wait for system to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Send startup report
  const startupReport = `🪙 Crypto Market Monitor - ONLINE
${new Date().toLocaleTimeString()}
Update interval: ${UPDATE_INTERVAL_MS / 60000} minutes
Data Source: Bybit Futures API
Coins: BTC, ETH, SOL, XRP + Top 3 Volatile

Monitoring crypto market conditions!`;

  try {
    const chatId = parseInt(ALLOWED_USER_ID);
    await bot.api.sendMessage(chatId, startupReport);
    console.log('[Monitor] Startup report sent');
  } catch (error) {
    console.error('[Monitor] Failed to send startup report:', error);
  }

  // Start monitoring loop
  console.log('[Monitor] Starting crypto market monitoring loop...');
  monitoringLoop();

  console.log('[Monitor] Crypto market monitor ready!');

  // Voice notification
  try {
    await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Crypto market monitor online',
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
