# 🌌 BEHEMOTH Crypto MCP Server - Developer Guide

## Overview

BEHEMOTH is an ultra-high performance crypto trading MCP server providing access to 210+ operations through 20 consolidated power tools. It supports multiple exchanges (Bybit, Binance, Bitget) with cosmic intelligence and AI-powered analysis.

## Quick Start

### Installation

```bash
npm install -g fr3k-behemoth
# or
npx fr3k-behemoth
```

### MCP Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "behemoth": {
      "command": "npx",
      "args": ["fr3k-behemoth", "start"],
      "env": {
        "BYBIT_API_KEY": "your_api_key",
        "BYBIT_API_SECRET": "your_api_secret"
      }
    }
  }
}
```

### Environment Variables

```bash
export BYBIT_API_KEY="your_api_key"
export BYBIT_API_SECRET="your_api_secret"
export BINANCE_API_KEY="your_api_key"      # Optional
export BINANCE_API_SECRET="your_api_secret" # Optional
```

## Tool Reference

### 1. Exchange Operations (`exchange`)

Access market data, place orders, and manage wallet operations.

**Operations:** `ticker`, `order`, `market`, `wallet`

#### Examples

```javascript
// Get ticker data
await exchange({
  operation: "ticker",
  exchange: "bybit",
  symbol: "BTCUSDT",
  params: { category: "spot" }
});

// Get market data
await exchange({
  operation: "market",
  exchange: "bybit",
  symbol: "BTCUSDT",
  params: { category: "linear", limit: 100 }
});

// Place limit order
await exchange({
  operation: "order",
  exchange: "bybit",
  symbol: "BTCUSDT",
  params: {
    category: "spot",
    side: "buy",
    orderType: "limit",
    qty: "0.001",
    price: "50000"
  }
});

// Check wallet balance
await exchange({
  operation: "wallet",
  exchange: "bybit",
  params: { accountType: "UNIFIED" }
});
```

**Parameters:**
- `exchange`: `"bybit" | "binance" | "bitget"`
- `symbol`: Trading pair (e.g., `"BTCUSDT"`)
- `params`: Operation-specific parameters

### 2. Technical Analysis (`technical`)

Calculate technical indicators and analyze patterns.

**Operations:** `indicator`, `pattern`, `volume`

#### Examples

```javascript
// Calculate RSI
await technical({
  operation: "indicator",
  type: "RSI",
  data: [/* price array with at least 14+ values */],
  params: { period: 14 }
});

// Calculate MACD
await technical({
  operation: "indicator",
  type: "MACD",
  data: [/* price array with at least 26+ values */],
  params: { fast: 12, slow: 26, signal: 9 }
});

// Detect patterns
await technical({
  operation: "pattern",
  type: "candlestick",
  data: [/* OHLC data */],
  params: { pattern: "doji" }
});

// Volume analysis
await technical({
  operation: "volume",
  type: "accumulation",
  data: [/* volume data */],
  params: { period: 20 }
});
```

**Parameters:**
- `type`: Indicator/pattern type
- `data`: Array of price/volume data
- `params`: Indicator-specific parameters

### 3. Cosmic Analysis (`cosmic`)

Planetary alignments and quantum trading analysis.

**Operations:** `analysis`, `quantum`, `moon`, `planetary`

#### Examples

```javascript
// Cosmic analysis
await cosmic({
  operation: "analysis",
  symbol: "BTCUSDT"
});

// Moon phase analysis
await cosmic({
  operation: "moon",
  symbol: "BTCUSDT"
});

// Planetary alignment
await cosmic({
  operation: "planetary",
  symbol: "BTCUSDT",
  params: { planets: ["mars", "venus"] }
});
```

### 4. Market Sentiment (`sentiment`)

Analyze market sentiment from multiple sources.

#### Examples

```javascript
await sentiment({
  symbol: "BTC",
  sources: ["social", "news", "fear_greed"]
});
```

**Parameters:**
- `symbol`: Asset symbol
- `sources`: Array of sources (`"social"`, `"news"`, `"fear_greed"`)

### 5. On-Chain Metrics (`onchain`)

Blockchain analysis and metrics.

**Operations:** `tvl`, `volume`, `active_addresses`, `whale_movements`

#### Examples

```javascript
// TVL analysis
await onchain({
  metric: "tvl",
  chain: "eth"
});

// Whale movements
await onchain({
  metric: "whale_movements",
  chain: "btc",
  address: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5"
});
```

### 6. Trading Strategies (`strategy`)

Execute automated trading strategies.

**Types:** `scalping`, `swing`, `arbitrage`, `grid`, `dca`

#### Examples

```javascript
// Scalping strategy
await strategy({
  type: "scalping",
  params: {
    symbol: "BTCUSDT",
    timeframe: "1m",
    profitTarget: 0.5,
    stopLoss: 0.3
  },
  backtest: true
});

// DCA strategy
await strategy({
  type: "dca",
  params: {
    symbol: "ETHUSDT",
    amount: 100,
    interval: "daily",
    duration: 30
  }
});
```

### 7. Market Structure (`market`)

Analyze market microstructure and depth.

**Operations:** `microstructure`, `structure`, `depth`, `flow`

#### Examples

```javascript
// Order book depth
await market({
  operation: "depth",
  symbol: "BTCUSDT",
  exchange: "bybit"
});

// Market microstructure
await market({
  operation: "microstructure",
  symbol: "BTCUSDT",
  exchange: "bybit"
});
```

### 8. AI/ML Analysis (`ai`)

AI-powered predictions and pattern recognition.

**Operations:** `predict`, `analyze`, `anomaly`, `pattern`

#### Examples

```javascript
// Price prediction
await ai({
  operation: "predict",
  model: "lstm",
  data: {
    prices: [50000, 51000, 52000, 53000],
    volumes: [100, 120, 110, 130]
  }
});

// Anomaly detection
await ai({
  operation: "anomaly",
  model: "isolation_forest",
  data: { /* market data */ }
});
```

### 9. Risk Management (`risk`)

Portfolio risk analysis and optimization.

**Operations:** `analyze`, `optimize`, `var`, `sharpe`

#### Examples

```javascript
// Risk analysis
await risk({
  operation: "analyze",
  portfolio: [
    { symbol: "BTC", amount: 1, price: 50000 },
    { symbol: "ETH", amount: 10, price: 3000 }
  ]
});

// VaR calculation
await risk({
  operation: "var",
  portfolio: [/* positions */],
  params: { confidence: 0.95, horizon: 1 }
});
```

### 10. System Monitoring (`system`)

Monitor system health and performance.

**Operations:** `monitor`, `optimize`, `health`, `performance`

#### Examples

```javascript
// System health check
await system({
  operation: "health",
  component: "api"
});

// Performance monitoring
await system({
  operation: "performance",
  component: "trading_engine"
});
```

### 11. DeFi Analysis (`defi`)

DeFi protocol analysis and yield opportunities.

**Operations:** `tvl`, `apy`, `risk`, `opportunities`

#### Examples

```javascript
// Protocol TVL
await defi({
  protocol: "uniswap",
  operation: "tvl",
  chain: "eth"
});

// Yield opportunities
await defi({
  protocol: "compound",
  operation: "opportunities",
  chain: "eth"
});
```

### 12. Web3 Tools (`web3`)

NFT analysis, wallet tracking, gas optimization.

**Operations:** `nft`, `wallet`, `gas`, `contract`

#### Examples

```javascript
// Gas price estimation
await web3({
  operation: "gas",
  chain: "eth"
});

// Wallet analysis
await web3({
  operation: "wallet",
  address: "0x1234567890123456789012345678901234567890",
  chain: "eth"
});
```

### 13. Real-time Data (`realtime`)

Live market data streaming.

**Streams:** `trades`, `orderbook`, `liquidations`, `funding`

#### Examples

```javascript
// Live trades
await realtime({
  stream: "trades",
  symbols: ["BTCUSDT", "ETHUSDT"],
  exchange: "bybit"
});

// Order book updates
await realtime({
  stream: "orderbook",
  symbols: ["BTCUSDT"],
  exchange: "bybit"
});
```

### 14. FR3K Analysis (`fr3k`)

Special quantum coherence and multiversal analysis.

**Modes:** `quantum`, `coherence`, `multiversal`, `prophetic`

#### Examples

```javascript
// Quantum analysis
await fr3k({
  mode: "quantum",
  target: "BTC"
});

// Multiversal coherence
await fr3k({
  mode: "coherence",
  target: "market"
});
```

### 15. Smart Orders (`smartorder`)

Advanced order types and execution.

**Types:** `limit`, `market`, `stop`, `trailing`, `iceberg`, `twap`

#### Examples

```javascript
// Trailing stop order
await smartorder({
  type: "trailing",
  side: "sell",
  symbol: "BTCUSDT",
  amount: 0.1,
  params: {
    trailPercent: 2.0,
    activationPrice: 55000
  }
});

// Iceberg order
await smartorder({
  type: "iceberg",
  side: "buy",
  symbol: "BTCUSDT",
  amount: 1.0,
  params: {
    displaySize: 0.1,
    totalSize: 1.0
  }
});
```

### 16. Backtesting (`backtest`)

Historical strategy testing.

#### Examples

```javascript
await backtest({
  strategy: "rsi",
  period: "1y",
  params: {
    rsi_period: 14,
    overbought: 70,
    oversold: 30,
    stop_loss: 2,
    take_profit: 5
  }
});
```

### 17. Price Alerts (`alert`)

Set up automated alerts and notifications.

**Types:** `price`, `volume`, `technical`, `custom`

#### Examples

```javascript
// Price alert
await alert({
  type: "price",
  condition: {
    symbol: "BTCUSDT",
    operator: "above",
    value: 60000
  },
  action: "notify"
});

// Technical alert
await alert({
  type: "technical",
  condition: {
    indicator: "RSI",
    operator: "above",
    value: 80
  },
  action: "email"
});
```

### 18. Arbitrage (`arbitrage`)

Cross-exchange arbitrage detection.

**Modes:** `spot`, `futures`, `triangular`, `defi`

#### Examples

```javascript
// Spot arbitrage
await arbitrage({
  mode: "spot",
  minProfit: 0.1,
  execute: false
});

// Triangular arbitrage
await arbitrage({
  mode: "triangular",
  minProfit: 0.05,
  execute: true
});
```

### 19. Liquidity Analysis (`liquidity`)

AMM liquidity analysis and optimization.

**Operations:** `analyze`, `provide`, `optimal_range`, `impermanent_loss`

#### Examples

```javascript
// Liquidity analysis
await liquidity({
  operation: "analyze",
  pool: "BTC-USDT",
  params: { dex: "uniswap" }
});

// Optimal range calculation
await liquidity({
  operation: "optimal_range",
  pool: "ETH-USDC",
  params: {
    volatility: 0.8,
    fee_tier: 0.3
  }
});
```

### 20. BEHEMOTH Control (`behemoth`)

System control and meta operations.

**Commands:** `status`, `config`, `stats`, `reset`, `evolve`

#### Examples

```javascript
// System status
await behemoth({
  command: "status"
});

// Configuration
await behemoth({
  command: "config",
  params: { mode: "production" }
});
```

## Complete Parameter Reference

### Exchange Tool Parameters

```typescript
interface ExchangeParams {
  operation: "ticker" | "order" | "market" | "wallet";
  exchange: "bybit" | "binance" | "bitget";
  symbol?: string;
  params?: {
    // For ticker
    category?: "spot" | "linear" | "inverse";
    
    // For order
    side?: "buy" | "sell";
    orderType?: "limit" | "market";
    qty?: string;
    price?: string;
    timeInForce?: "GTC" | "IOC" | "FOK";
    takeProfit?: string;
    stopLoss?: string;
    
    // For market
    limit?: number;
    depth?: number;
    
    // For wallet
    accountType?: "UNIFIED" | "CONTRACT";
    coin?: string;
  };
}
```

### Technical Tool Parameters

```typescript
interface TechnicalParams {
  operation: "indicator" | "pattern" | "volume";
  type: string;
  data: number[] | OHLC[];
  params?: {
    // For indicators
    period?: number;
    fast?: number;
    slow?: number;
    signal?: number;
    stdDev?: number;
    
    // For patterns
    pattern?: string;
    threshold?: number;
    
    // For volume
    volumeType?: "obv" | "vwap" | "accumulation";
  };
}
```

### Strategy Tool Parameters

```typescript
interface StrategyParams {
  type: "scalping" | "swing" | "arbitrage" | "grid" | "dca";
  params: {
    symbol: string;
    timeframe?: string;
    amount?: number;
    profitTarget?: number;
    stopLoss?: number;
    gridLevels?: number;
    interval?: string;
    duration?: number;
  };
  backtest?: boolean;
}
```

## Error Handling

All tools return structured responses with error handling:

```javascript
{
  "success": true|false,
  "data": { /* result data */ },
  "error": "error message if applicable",
  "timestamp": 1234567890
}
```

## Best Practices

1. **API Keys**: Store securely, never log or expose
2. **Rate Limits**: Respect exchange API limits
3. **Testing**: Use testnet/sandbox for development
4. **Error Handling**: Always check response success status
5. **Data Validation**: Validate inputs before sending
6. **Monitoring**: Use system tools to monitor health

## Advanced Usage

### Combining Tools

```javascript
// Get market data and run technical analysis
const ticker = await exchange({
  operation: "ticker",
  exchange: "bybit",
  symbol: "BTCUSDT"
});

const analysis = await technical({
  operation: "indicator",
  type: "RSI",
  data: ticker.data.priceHistory,
  params: { period: 14 }
});

// Make cosmic-informed decision
const cosmic = await cosmic({
  operation: "analysis",
  symbol: "BTCUSDT"
});

if (analysis.data.value < 30 && cosmic.data.alignment > 0.8) {
  // Place buy order
  await smartorder({
    type: "limit",
    side: "buy",
    symbol: "BTCUSDT",
    amount: 0.1,
    params: { price: ticker.data.lastPrice * 0.99 }
  });
}
```

### Custom Strategies

```javascript
// Multi-exchange arbitrage with risk management
async function executeArbitrage() {
  // Check prices across exchanges
  const [bybit, binance] = await Promise.all([
    exchange({ operation: "ticker", exchange: "bybit", symbol: "BTCUSDT" }),
    exchange({ operation: "ticker", exchange: "binance", symbol: "BTCUSDT" })
  ]);
  
  // Calculate arbitrage opportunity
  const priceDiff = Math.abs(bybit.data.price - binance.data.price);
  const profitPercent = (priceDiff / Math.min(bybit.data.price, binance.data.price)) * 100;
  
  if (profitPercent > 0.1) {
    // Check risk
    const riskCheck = await risk({
      operation: "analyze",
      portfolio: [{ symbol: "BTC", amount: 0.1, price: bybit.data.price }]
    });
    
    if (riskCheck.data.score < 0.7) {
      // Execute arbitrage
      await arbitrage({
        mode: "spot",
        minProfit: 0.1,
        execute: true
      });
    }
  }
}
```

## Troubleshooting

### Common Issues

- **"Illegal category"**: Specify correct category (spot, linear, inverse)
- **"Insufficient data"**: Provide enough data points for indicators
- **"API rate limit"**: Implement exponential backoff
- **"Authentication failed"**: Check API keys and permissions

### Debug Mode

Enable debug logging:

```bash
export BEHEMOTH_DEBUG=true
export LOG_LEVEL=debug
```

## API Limits

| Exchange | Public API | Private API |
|----------|------------|-------------|
| Bybit    | 120 req/min | 600 req/min |
| Binance  | 1200 req/min | 6000 req/min |
| Bitget   | 120 req/min | 300 req/min |

## Support

For issues and feature requests:
- GitHub Issues: Report bugs and request features
- Documentation: Check this guide for updates
- Community: Join the FR3K Discord for support

---

*Built with 🌌 cosmic intelligence by FR3K*