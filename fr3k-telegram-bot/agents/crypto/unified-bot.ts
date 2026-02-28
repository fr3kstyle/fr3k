#!/usr/bin/env bun
/**
 * 🌌 BEHEMOTH UNIFIED CRYPTO TRADING BOT
 * Both major pairs + volatile scalping in ONE bot
 */

import { Bot } from 'grammy';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_USER_ID || '0');

const BYBIT_API_KEY = '1huooVsQ9gY6ulqRDN';
const BYBIT_API_SECRET = '3YNbN1mnh7aMKUKloVJo3ktjIoQ8HL24etgJ';
const BASE_URL = 'https://api.bybit.com';
const POSITION_SIZE_USD = 2;  // $2 per trade

const MAJOR_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'TRXUSDT', 'MATICUSDT'];

let serverTimeOffset = 0;
let isRunning = true;

console.log('🌌 BEHEMOTH UNIFIED TRADING BOT');
console.log('='.repeat(60));

const bot = new Bot(BOT_TOKEN);
const chatId = ALLOWED_USER_ID;

async function syncTime() {
  const res = await fetch(`${BASE_URL}/v5/market/time`);
  const data = await res.json();
  if (data.retCode === 0) {
    serverTimeOffset = (parseInt(data.result.timeSecond) * 1000) - Date.now();
    console.log(`⏰ Offset: ${serverTimeOffset}ms`);
  }
}

function sign(ts: string, params: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', BYBIT_API_SECRET).update(ts + BYBIT_API_KEY + '5000' + params).digest('hex');
}

async function executeTrade(signal: any): Promise<boolean> {
  try {
    console.log(`💰 ${signal.symbol} ${signal.direction} @ ${signal.leverage}x`);

    const ts = (Date.now() + serverTimeOffset).toString();
    const side = signal.direction === 'LONG' ? 'Buy' : 'Sell';
    const qty = (POSITION_SIZE_USD * signal.leverage / signal.entry_price).toFixed(3);

    const params = `category=linear&symbol=${signal.symbol}&side=${side}&orderType=Market&qty=${qty}&timeInForce=GTC`;

    const res = await fetch(`${BASE_URL}/v5/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': ts,
        'X-BAPI-RECV-WINDOW': '5000',
        'X-BAPI-SIGN': sign(ts, params)
      },
      body: JSON.stringify({
        category: 'linear',
        symbol: signal.symbol,
        side,
        orderType: 'Market',
        qty,
        timeInForce: 'GTC'
      })
    });

    const data = await res.json();

    if (data.retCode === 0) {
      console.log(`✅ EXECUTED: ${data.result.orderId}`);
      await bot.api.sendMessage(chatId,
        `✅ *LIVE TRADE EXECUTED*\n\n` +
        `📊 ${signal.symbol} ${signal.direction}\n` +
        `💵 $${signal.entry_price.toFixed(2)} @ ${signal.leverage}x\n` +
        `💰 $${POSITION_SIZE_USD}\n\n` +
        `🛑 $${signal.stop_loss.toFixed(2)}\n` +
        `✅ $${signal.take_profit.toFixed(2)}\n\n` +
        '_⚡ REAL MONEY - LIVE TRADING_',
        { parse_mode: 'Markdown' }
      );
      return true;
    } else {
      console.error(`❌ FAILED: ${data.retMsg}`);
      return false;
    }
  } catch (e) {
    console.error(`❌ ERROR:`, e);
    return false;
  }
}

async function tradingLoop() {
  await bot.api.sendMessage(chatId, '🌌 *BEHEMOTH TRADING ACTIVATED*\n\n_Monitoring 10 major pairs_\n⚡ 10x-25x leverage\n💰 $2 per trade (conservative)\n💵 Bybit LIVE\n\n_Only trading on 3%+ moves_', { parse_mode: 'Markdown' });

  while (isRunning) {
    try {
      for (const pair of MAJOR_PAIRS) {
        const res = await fetch(`${BASE_URL}/v5/market/tickers?category=linear&symbol=${pair}`);
        const data = await res.json();

        if (data.retCode === 0) {
          const ticker = data.result.list[0];
          const price = parseFloat(ticker.lastPrice);
          const change = parseFloat(ticker.price24hPcnt) * 100;

          console.log(`📊 ${pair}: $${price.toFixed(2)} (${change.toFixed(2)}%)`);

          // Only trade on STRONG signals (3%+ moves)
          if (Math.abs(change) > 3.0) {
            const direction = change < 0 ? 'LONG' : 'SHORT';
            const leverage = Math.min(Math.max(Math.abs(change) * 2, 10), 25);

            await executeTrade({
              symbol: pair,
              direction,
              entry_price: price,
              stop_loss: direction === 'LONG' ? price * 0.985 : price * 1.015,
              take_profit: direction === 'LONG' ? price * 1.03 : price * 0.97,
              leverage
            });
          }
        }
      }

      console.log('⏰ Waiting 2 min...');
      await new Promise(r => setTimeout(r, 120000));
    } catch (e) {
      console.error('❌ Loop error:', e);
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

syncTime().then(() => tradingLoop()).catch(console.error);

process.on('SIGINT', () => { isRunning = false; process.exit(0); });
