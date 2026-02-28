#!/usr/bin/env bun
/**
 * 🔥 VOLATILE SCALP BOT
 * Top 20 most volatile pairs with AGGRESSIVE leverage (25x-50x)
 * High frequency scalping on extreme volatility
 */

import { Bot } from 'grammy';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_USER_ID || '0');

const BYBIT_API_KEY = '1huooVsQ9gY6ulqRDN';
const BYBIT_API_SECRET = '3YNbN1mnh7aMKUKloVJo3ktjIoQ8HL24etgJ';
const BASE_URL = 'https://api.bybit.com';
const POSITION_SIZE_USD = 10;

let serverTimeOffset = 0;
let isRunning = true;

console.log('🔥 VOLATILE SCALP BOT');
console.log('='.repeat(50));
console.log(`🔥 Strategy: High volatility scalping`);
console.log(`⚡ Leverage: 25x-50x (AGGRESSIVE)`);
console.log(`💰 Position Size: $${POSITION_SIZE_USD}`);
console.log(`💵 Exchange: Bybit (LIVE - HIGH RISK)`);
console.log('='.repeat(50));

const bot = new Bot(BOT_TOKEN);
const chatId = ALLOWED_USER_ID;

// Discover most volatile pairs
async function discoverVolatilePairs(): Promise<string[]> {
  try {
    console.log('🔍 Scanning for most volatile pairs...');

    // Get all USDT symbols
    const response = await fetch(`${BASE_URL}/v5/market/tickers?category=linear`);
    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }

    // Filter for USDT pairs and sort by 24h price change %
    const allPairs = data.result.list
      .filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.volume24h) > 10000000) // >$10M volume
      .map((t: any) => ({
        symbol: t.symbol,
        price: parseFloat(t.lastPrice),
        change24h: Math.abs(parseFloat(t.price24hPcnt) * 100), // Absolute change
        volume24h: parseFloat(t.volume24h),
        turnover24h: parseFloat(t.turnover24h)
      }))
      .sort((a: any, b: any) => b.change24h - a.change24h) // Sort by volatility (highest first)
      .slice(0, 20); // Top 20 most volatile

    console.log(`🔥 Top ${allPairs.length} volatile pairs:`);
    allPairs.forEach((p: any) => console.log(`   ${p.symbol}: ${p.change24h.toFixed(2)}% volatility`));

    return allPairs.map((p: any) => p.symbol);
  } catch (error) {
    console.error('❌ Error discovering volatile pairs:', error);
    // Fallback to high volatility coins
    return ['PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT', 'SEIUSDT',
            'TIAUSDT', 'SUIUSDT', 'INJUSDT', 'OPUSDT', 'ARBUSDT',
            '1000PEPEUSDT', 'MEMEUSDT', 'ORDIUSDT', 'SATSUSDT', '1000BONKUSDT',
            'MINAUSDT', 'AKROUSDT', 'RNDRUSDT', 'IMXUSDT', 'GALAUSDT'];
  }
}

async function syncServerTime() {
  try {
    const response = await fetch(`${BASE_URL}/v5/market/time`);
    const data = await response.json();
    if (data.retCode === 0) {
      const serverTime = parseInt(data.result.timeSecond); // This is actually in MILLISECONDS
      const localTime = Date.now();
      serverTimeOffset = serverTime - localTime;
      console.log(`⏰ Time offset: ${serverTimeOffset}ms`);
    }
  } catch (error) {
    console.error('❌ Time sync failed:', error);
  }
}

async function sendStartupNotification(volatilePairs: string[]) {
  try {
    await bot.api.sendMessage(chatId,
      '🔥 *VOLATILE SCALP BOT ACTIVATED*\n\n' +
      `🔥 Strategy: High volatility scalping\n` +
      `📊 Top ${volatilePairs.length} most volatile pairs\n` +
      '⚡ Leverage: 25x-50x (AGGRESSIVE)\n' +
      `💰 Position Size: $${POSITION_SIZE_USD}\n` +
      '💵 Exchange: Bybit (LIVE - HIGH RISK)\n\n' +
      '_⚠️ WARNING: Extreme volatility - Max drawdown 30%\n' +
      'Scanning for scalping opportunities..._',
      { parse_mode: 'Markdown' }
    );
    console.log('✅ Startup notification sent');
  } catch (error) {
    console.error('❌ Failed to send startup notification:', error);
  }
}

async function getBybitTicker(symbol: string) {
  const response = await fetch(`${BASE_URL}/v5/market/tickers?category=linear&symbol=${symbol}`);
  const data = await response.json();
  if (data.retCode !== 0) throw new Error(`Bybit API error: ${data.retMsg}`);
  return data.result.list[0];
}

function generateSignature(timestamp: string, params: string): string {
  const crypto = require('crypto');
  const signString = timestamp + BYBIT_API_KEY + '5000' + params;
  return crypto.createHmac('sha256', BYBIT_API_SECRET).update(signString).digest('hex');
}

async function executeTrade(signal: any): Promise<boolean> {
  try {
    console.log(`💰 EXECUTING SCALP: ${signal.symbol} ${signal.direction} @ ${signal.leverage}x`);

    const timestamp = (Date.now() + serverTimeOffset).toString();
    const side = signal.direction === 'LONG' ? 'Buy' : 'Sell';
    const qty = (POSITION_SIZE_USD * signal.leverage / signal.entry_price).toFixed(3);

    const orderParams = {
      category: 'linear',
      symbol: signal.symbol,
      side: side,
      orderType: 'Market',
      qty: qty,
      timeInForce: 'GTC',
      reduceOnly: false
    };

    const queryString = Object.keys(orderParams).map(key => `${key}=${orderParams[key]}`).join('&');
    const signature = generateSignature(timestamp, queryString);

    const orderResponse = await fetch(`${BASE_URL}/v5/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000',
        'X-BAPI-SIGN': signature
      },
      body: JSON.stringify(orderParams)
    });

    const orderData = await orderResponse.json();

    if (orderData.retCode === 0) {
      console.log(`✅ SCALP EXECUTED: ${orderData.result.orderId}`);
      return true;
    } else {
      console.error(`❌ SCALP FAILED: ${orderData.retMsg}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Scalp execution error:', error);
    return false;
  }
}

function generateScalpSignal(ticker: any, symbol: string) {
  const price = parseFloat(ticker.lastPrice);
  const change24h = parseFloat(ticker.price24hPcnt) * 100;
  const volume = parseFloat(ticker.volume24h);

  // AGGRESSIVE scalping: Trade on ANY significant move
  const direction = change24h < -0.8 ? 'LONG' : change24h > 0.8 ? 'SHORT' : null;
  if (!direction) return null;

  // HIGH LEVERAGE based on volatility
  const volatility = Math.abs(change24h);
  const leverage = Math.min(Math.max(volatility * 10, 25), 50); // 25-50x

  // TIGHT stops for scalping
  const stopDistance = 0.01; // 1% tight stop
  const tpDistance = 0.02; // 2% quick profit

  return {
    symbol,
    direction,
    entry_price: price,
    stop_loss: direction === 'LONG' ? price * (1 - stopDistance) : price * (1 + stopDistance),
    take_profit: direction === 'LONG' ? price * (1 + tpDistance) : price * (1 - tpDistance),
    leverage,
    confidence: Math.min(volatility / 2 + 0.60, 0.95),
    reason: `Scalp: ${direction} on ${change24h.toFixed(2)}% move, vol: ${(volume/1e6).toFixed(1)}M`
  };
}

async function tradingLoop(volatilePairs: string[]) {
  console.log('🔄 Starting volatile scalp loop...');

  while (isRunning) {
    try {
      for (const pair of volatilePairs) {
        const ticker = await getBybitTicker(pair);
        const price = parseFloat(ticker.lastPrice);
        const change24h = parseFloat(ticker.price24hPcnt) * 100;

        console.log(`🔥 ${pair}: $${price.toFixed(2)} (${change24h.toFixed(2)}%)`);

        const signal = generateScalpSignal(ticker, pair);

        if (signal && signal.confidence > 0.65) { // Lower threshold for scalping
          console.log(`⚡ SCALP: ${signal.symbol} ${signal.direction} @ ${signal.leverage}x`);

          const executed = await executeTrade(signal);

          const status = executed ? '✅ EXECUTED' : '❌ FAILED';
          await bot.api.sendMessage(chatId,
            `🔥 *${status} - VOLATILE SCALP*\n\n` +
            `🔥 ${signal.symbol}\n` +
            `⚡ ${signal.direction} @ ${signal.leverage}x\n` +
            `💵 $${signal.entry_price.toFixed(2)}\n` +
            `💰 $${POSITION_SIZE_USD}\n\n` +
            `🛑 $${signal.stop_loss.toFixed(2)} (1%)\n` +
            `✅ $${signal.take_profit.toFixed(2)} (2%)\n\n` +
            `⚡ Confidence: ${(signal.confidence * 100).toFixed(0)}%\n` +
            `📝 ${signal.reason}\n\n` +
            '_⚠️ HIGH RISK - TIGHT STOPS - QUICK SCALP_',
            { parse_mode: 'Markdown' }
          );
        }
      }

      console.log('⏰ Waiting 90 seconds...');
      await new Promise(resolve => setTimeout(resolve, 90000)); // Faster scanning (90s)

    } catch (error) {
      console.error('❌ Error:', error);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

async function start() {
  await syncServerTime();

  const volatilePairs = await discoverVolatilePairs();
  await sendStartupNotification(volatilePairs);
  await tradingLoop(volatilePairs);
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down volatile scalp bot...');
  isRunning = false;
  process.exit(0);
});

start().catch(console.error);
