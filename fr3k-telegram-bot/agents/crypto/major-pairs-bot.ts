#!/usr/bin/env bun
/**
 * 🟢 MAJOR PAIRS TRADING BOT - FIXED VERSION
 */

import { Bot } from 'grammy';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_USER_ID || '0');

const BYBIT_API_KEY = '1huooVsQ9gY6ulqRDN';
const BYBIT_API_SECRET = '3YNbN1mnh7aMKUKloVJo3ktjIoQ8HL24etgJ';
const BASE_URL = 'https://api.bybit.com';
const POSITION_SIZE_USD = 10;

const MAJOR_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'TRXUSDT', 'MATICUSDT',
  'LINKUSDT', 'DOTUSDT', 'LTCUSDT', 'BCHUSDT', 'UNIUSDT',
  'PEPEUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT', 'ATOMUSDT'
];

let serverTimeOffset = 0;
let isRunning = true;

console.log('🟢 MAJOR PAIRS TRADING BOT - FIXED');
console.log('='.repeat(50));

const bot = new Bot(BOT_TOKEN);
const chatId = ALLOWED_USER_ID;

async function syncServerTime() {
  try {
    const response = await fetch(`${BASE_URL}/v5/market/time`);
    const data = await response.json();
    if (data.retCode === 0) {
      const serverTimeSeconds = parseInt(data.result.timeSecond);
      const serverTime = serverTimeSeconds * 1000; // Convert to milliseconds
      const localTime = Date.now();
      serverTimeOffset = serverTime - localTime;
      console.log(`⏰ Time offset: ${serverTimeOffset}ms`);
    }
  } catch (error) {
    console.error('❌ Time sync failed:', error);
  }
}

async function sendStartupNotification() {
  try {
    await bot.api.sendMessage(chatId,
      '🟢 *MAJOR PAIRS BOT ACTIVATED*\n\n' +
      `📊 Top ${MAJOR_PAIRS.length} major pairs\n` +
      '⚡ Leverage: 10x-25x\n' +
      `💰 $${POSITION_SIZE_USD} per trade\n` +
      '💵 Bybit (LIVE)\n\n' +
      '_Scanning for opportunities..._',
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
    console.log(`💰 EXECUTING: ${signal.symbol} ${signal.direction} @ ${signal.leverage}x`);

    const timestamp = (Date.now() + serverTimeOffset).toString();
    const side = signal.direction === 'LONG' ? 'Buy' : 'Sell';
    const qty = (POSITION_SIZE_USD * signal.leverage / signal.entry_price).toFixed(3);

    const orderParams = {
      category: 'linear',
      symbol: signal.symbol,
      side: side,
      orderType: 'Market',
      qty: qty,
      timeInForce: 'GTC'
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
      console.log(`✅ ORDER EXECUTED: ${orderData.result.orderId}`);
      return true;
    } else {
      console.error(`❌ ORDER FAILED: ${orderData.retMsg}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Trade execution error:', error);
    return false;
  }
}

function generateSignal(ticker: any, symbol: string) {
  const price = parseFloat(ticker.lastPrice);
  const change24h = parseFloat(ticker.price24hPcnt) * 100;

  const direction = change24h < -1.5 ? 'LONG' : change24h > 1.5 ? 'SHORT' : null;
  if (!direction) return null;

  const leverage = Math.min(Math.max(Math.abs(change24h) * 3, 10), 25);
  const stopDistance = 0.015;
  const tpDistance = 0.03;

  return {
    symbol,
    direction,
    entry_price: price,
    stop_loss: direction === 'LONG' ? price * (1 - stopDistance) : price * (1 + stopDistance),
    take_profit: direction === 'LONG' ? price * (1 + tpDistance) : price * (1 - tpDistance),
    leverage,
    confidence: Math.min(Math.abs(change24h) / 4 + 0.65, 0.90),
    reason: `${direction}: ${change24h.toFixed(2)}% change`
  };
}

async function tradingLoop() {
  console.log('🔄 Starting major pairs loop...');

  while (isRunning) {
    try {
      for (const pair of MAJOR_PAIRS) {
        const ticker = await getBybitTicker(pair);
        const price = parseFloat(ticker.lastPrice);
        const change24h = parseFloat(ticker.price24hPcnt) * 100;

        console.log(`📊 ${pair}: $${price.toFixed(2)} (${change24h.toFixed(2)}%)`);

        const signal = generateSignal(ticker, pair);

        if (signal && signal.confidence > 0.70) {
          console.log(`🚀 SIGNAL: ${signal.symbol} ${signal.direction} @ ${signal.leverage}x`);

          const executed = await executeTrade(signal);

          const status = executed ? '✅ EXECUTED' : '❌ FAILED';
          await bot.api.sendMessage(chatId,
            `🟢 *${status} - MAJOR PAIRS*\n\n` +
            `📊 ${signal.symbol} ${signal.direction}\n` +
            `💵 $${signal.entry_price.toFixed(2)} @ ${signal.leverage}x\n` +
            `💰 $${POSITION_SIZE_USD}\n\n` +
            `🛑 $${signal.stop_loss.toFixed(2)} | ✅ $${signal.take_profit.toFixed(2)}\n\n` +
            `🎯 ${(signal.confidence * 100).toFixed(0)}% - ${signal.reason}\n\n` +
            '_⚡ LIVE TRADING_',
            { parse_mode: 'Markdown' }
          );
        }
      }

      console.log('⏰ Waiting 2 minutes...');
      await new Promise(resolve => setTimeout(resolve, 120000));

    } catch (error) {
      console.error('❌ Error:', error);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

async function start() {
  await syncServerTime();
  await sendStartupNotification();
  await tradingLoop();
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  isRunning = false;
  process.exit(0);
});

start().catch(console.error);
