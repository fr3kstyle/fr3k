#!/usr/bin/env bun
/**
 * 🔥 VOLATILE SCALP BOT - Final working version
 * Top 20 most volatile coins, 25-50x leverage, FAST scalping
 */
import { Bot } from 'grammy';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_USER_ID || '0');

const BYBIT_API_KEY = '1huooVsQ9gY6ulqRDN';
const BYBIT_API_SECRET = '3YNbN1mnh7aMKUKloVJo3ktjIoQ8HL24etgJ';
const BASE_URL = 'https://api.bybit.com';
const POSITION_SIZE_USD = 2;

let serverTimeOffset = 0;
let volatilePairs: string[] = [];
let isRunning = true;

console.log('🔥 VOLATILE SCALP BOT');
console.log('='.repeat(50));

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

function sign(ts: string, queryString: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', BYBIT_API_SECRET).update(ts + BYBIT_API_KEY + '5000' + queryString).digest('hex');
}

async function discoverVolatilePairs() {
  const res = await fetch(`${BASE_URL}/v5/market/tickers?category=linear`);
  const data = await res.json();

  if (data.retCode === 0) {
    const sorted = data.result.list
      .filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.volume24h) > 10000000)
      .map((t: any) => ({
        symbol: t.symbol,
        volatility: Math.abs(parseFloat(t.price24hPcnt) * 100)
      }))
      .sort((a: any, b: any) => b.volatility - a.volatility)
      .slice(0, 20);

    volatilePairs = sorted.map((p: any) => p.symbol);
    console.log(`🔥 Top ${volatilePairs.length} volatile:`, volatilePairs.slice(0, 5).join(', '), '...');
  }
}

async function executeTrade(signal: any): Promise<boolean> {
  try {
    console.log(`⚡ ${signal.symbol} ${signal.direction} @ ${signal.leverage}x`);

    const ts = (Date.now() + serverTimeOffset).toString();
    const side = signal.direction === 'LONG' ? 'Buy' : 'Sell';
    const qty = (POSITION_SIZE_USD * signal.leverage / signal.entry_price).toFixed(3);

    const orderBody = {
      category: 'linear',
      symbol: signal.symbol,
      side: side,
      orderType: 'Market',
      qty: qty,
      timeInForce: 'GTC'
    };

    // Sign the JSON body string, not query params
    const bodyStr = JSON.stringify(orderBody);
    const signature = sign(ts, bodyStr);

    const res = await fetch(`${BASE_URL}/v5/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': ts,
        'X-BAPI-RECV-WINDOW': '5000',
        'X-BAPI-SIGN': signature
      },
      body: bodyStr
    });

    const data = await res.json();

    if (data.retCode === 0) {
      console.log(`✅ SCALP EXECUTED`);
      await bot.api.sendMessage(chatId,
        `🔥 *SCALP EXECUTED*\n\n` +
        `⚡ ${signal.symbol} ${signal.direction}\n` +
        `💵 $${signal.entry_price.toFixed(2)} @ ${signal.leverage}x\n` +
        `💰 $${POSITION_SIZE_USD}\n\n` +
        `🛑 $${signal.stop_loss.toFixed(2)}\n` +
        `✅ $${signal.take_profit.toFixed(2)}\n\n` +
        '_⚡ HIGH RISK - VOLATILE SCALP_',
        { parse_mode: 'Markdown' }
      );
      return true;
    } else {
      console.error(`❌ ${data.retMsg}`);
      return false;
    }
  } catch (e) {
    console.error(`❌ ERROR:`, e);
    return false;
  }
}

async function scalpLoop() {
  await bot.api.sendMessage(chatId, '🔥 *VOLATILE SCALP BOT ACTIVATED*\n\n_Top 20 most volatile_\n⚡ 25x-50x leverage\n💰 $2 per trade\n💵 Bybit LIVE\n\n_Scalping extreme moves..._', { parse_mode: 'Markdown' });

  while (isRunning) {
    try {
      for (const pair of volatilePairs) {
        try {
          const res = await fetch(`${BASE_URL}/v5/market/tickers?category=linear&symbol=${pair}`);
          const data = await res.json();

          if (data.retCode === 0 && data.result.list?.[0]) {
            const ticker = data.result.list[0];
            const price = parseFloat(ticker.lastPrice);
            const change = parseFloat(ticker.price24hPcnt) * 100;

            // Trade on ANY 2%+ move for scalping
            if (Math.abs(change) > 2.0) {
              const direction = change < 0 ? 'LONG' : 'SHORT';
              const leverage = Math.min(Math.max(Math.abs(change) * 5, 25), 50);

              console.log(`⚡ ${pair}: ${change.toFixed(2)}% -> ${direction} @ ${leverage}x`);

              await executeTrade({
                symbol: pair,
                direction,
                entry_price: price,
                stop_loss: direction === 'LONG' ? price * 0.99 : price * 1.01,
                take_profit: direction === 'LONG' ? price * 1.02 : price * 0.98,
                leverage
              });
            }
          }
        } catch (e) {
          // Skip errors
        }
      }

      console.log('⏰ Waiting 90 sec...');
      await new Promise(r => setTimeout(r, 90000));
    } catch (e) {
      console.error('❌ Loop error:', e);
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

syncTime().then(() => discoverVolatilePairs().then(() => scalpLoop())).catch(console.error);

process.on('SIGINT', () => { isRunning = false; process.exit(0); });
