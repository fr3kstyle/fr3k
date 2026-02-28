#!/usr/bin/env bun
/**
 * Test short-term volatility calculation
 */

import { Bot } from "grammy";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: string[][];  // [startTime, open, high, low, close, volume, ...]
  };
}

/**
 * Calculate short-term volatility from 1m k-line data
 */
async function getShortTermVolatility(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=1&limit=10`
    );
    const data = await response.json() as BybitKlineResponse;

    if (data.retCode !== 0 || !data.result?.list || data.result.list.length === 0) {
      return 0;
    }

    // Calculate volatility: (high - low) / close * 100 for each candle
    const candles = data.result.list;
    let totalVolatility = 0;

    for (const candle of candles) {
      const open = parseFloat(candle[1]);
      const high = parseFloat(candle[2]);
      const low = parseFloat(candle[3]);
      const close = parseFloat(candle[4]);

      const volatility = ((high - low) / close) * 100;
      totalVolatility += volatility;
    }

    // Return average volatility across all candles
    return totalVolatility / candles.length;
  } catch (error) {
    console.error(`Error fetching volatility for ${symbol}:`, error);
    return 0;
  }
}

async function testVolatility() {
  console.log('🧪 Testing short-term volatility calculation...\n');

  const testPairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];

  const results = await Promise.all(
    testPairs.map(async (symbol) => {
      const volatility = await getShortTermVolatility(symbol);
      return { symbol, volatility };
    })
  );

  // Sort by volatility
  results.sort((a, b) => b.volatility - a.volatility);

  console.log('📊 Short-term volatility (1m timeframe, last 10 candles):\n');
  results.forEach(({ symbol, volatility }) => {
    console.log(`   ${symbol}: ${volatility.toFixed(3)}% volatility`);
  });

  console.log('\n✅ Test complete!');
  console.log('Note: This is average (high-low)/close across last 10 one-minute candles');
  console.log('Higher % = more price movement in last 10 minutes = better for scalping');
}

testVolatility().catch(console.error);
