import { Bot } from "grammy";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

interface BybitTicker {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
}

// Fetch all Bybit futures tickers
const response = await fetch('https://api.bybit.com/v5/market/tickers?category=linear');
const data = await response.json();

if (data.retCode === 0 && data.result?.list) {
  const tickers = data.result.list as BybitTicker[];

  // Get main coins
  const btc = tickers.find(t => t.symbol === 'BTCUSDT');
  const eth = tickers.find(t => t.symbol === 'ETHUSDT');
  const sol = tickers.find(t => t.symbol === 'SOLUSDT');
  const xrp = tickers.find(t => t.symbol === 'XRPUSDT');

  // Get top 3 volatile
  const volatile = tickers
    .map(t => ({
      symbol: t.symbol.replace('USDT', ''),
      change: Math.abs(parseFloat(t.price24hPcnt) * 100),
      actualChange: parseFloat(t.price24hPcnt) * 100
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  let message = `🪙 Bybit Futures Data Test\n\n`;
  message += `BTC: $${btc ? parseFloat(btc.lastPrice).toLocaleString() : 'N/A'} (${btc ? (parseFloat(btc.price24hPcnt) * 100).toFixed(2) : 'N/A'}%)\n`;
  message += `ETH: $${eth ? parseFloat(eth.lastPrice).toLocaleString() : 'N/A'} (${eth ? (parseFloat(eth.price24hPcnt) * 100).toFixed(2) : 'N/A'}%)\n`;
  message += `SOL: $${sol ? parseFloat(sol.lastPrice).toLocaleString() : 'N/A'} (${sol ? (parseFloat(sol.price24hPcnt) * 100).toFixed(2) : 'N/A'}%)\n`;
  message += `XRP: $${xrp ? parseFloat(xrp.lastPrice).toLocaleString() : 'N/A'} (${xrp ? (parseFloat(xrp.price24hPcnt) * 100).toFixed(2) : 'N/A'}%)\n\n`;

  message += `⚡ TOP VOLATILE\n`;
  volatile.forEach(v => {
    const emoji = v.actualChange >= 0 ? '🚀' : '💥';
    message += `${emoji} ${v.symbol} (${v.actualChange >= 0 ? '+' : ''}${v.actualChange.toFixed(1)}%)\n`;
  });

  console.log('Sending test message from Bybit...');
  console.log(message);
  await bot.api.sendMessage(parseInt(process.env.TELEGRAM_USER_ID || '0'), message);
  console.log('✓ Test message sent!');
} else {
  console.log('Error fetching from Bybit');
}
