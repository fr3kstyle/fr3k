# 🌌 BEHEMOTH Crypto MCP Server

**Ultra-High Performance MCP Server for Crypto Trading Intelligence**

BEHEMOTH is a comprehensive Model Context Protocol (MCP) server that provides AI assistants with access to advanced crypto trading tools, technical analysis, market data, and DeFi analytics. Built for maximum performance and reliability.

## ✨ Features

- 🚀 **20 Specialized Tools** - Complete crypto trading toolkit
- 📊 **210+ Operations** - Extensive functionality coverage
- 🔒 **Safe Simulation Mode** - Works without API keys for testing
- 🤖 **AI-Optimized** - Designed specifically for AI assistant integration
- ⚡ **High Performance** - Optimized for real-time trading operations
- 🛡️ **Secure** - Encrypted API key storage and validation

## 🛠️ Quick Start

### Installation

```bash
npm install -g fr3k-behemoth
```

### Basic Usage

```bash
# Start the server
fr3k-behemoth

# Or run directly
npx fr3k-behemoth
```

### AI Integration

BEHEMOTH is designed to work seamlessly with AI assistants that support MCP. Once configured, your AI can access all trading tools automatically.

## 📚 Complete Tool Reference

### 🔄 Exchange Operations

#### `exchange` - Direct exchange interactions

**Operations:**
- `ticker` - Get real-time price data
- `order` - Place/cancel orders
- `market` - Orderbook and market data
- `wallet` - Account balance information

**Examples:**

```javascript
// Get BTC/USDT ticker
{
  "name": "exchange",
  "arguments": {
    "operation": "ticker",
    "exchange": "bybit",
    "symbol": "BTCUSDT"
  }
}

// Place a limit order
{
  "name": "exchange",
  "arguments": {
    "operation": "order",
    "exchange": "binance",
    "symbol": "ETHUSDT",
    "params": {
      "side": "buy",
      "orderType": "limit",
      "price": "2000",
      "qty": "1.0"
    }
  }
}
```

### 📈 Technical Analysis

#### `technical` - Advanced technical indicators and patterns

**Operations:**
- `indicator` - RSI, MACD, Bollinger Bands, EMA, SMA, Stochastic, ATR, ADX
- `pattern` - Candlestick patterns and chart analysis
- `volume` - Volume analysis and flow detection

**Examples:**

```javascript
// Calculate RSI
{
  "name": "technical",
  "arguments": {
    "operation": "indicator",
    "type": "RSI",
    "data": [50000, 50100, 49900, 50200, 49800],
    "params": { "period": 14 }
  }
}

// Detect patterns
{
  "name": "technical",
  "arguments": {
    "operation": "pattern",
    "data": [[50000, 50100, 49900], [50200, 50300, 50100]],
    "params": { "type": "candlestick" }
  }
}
```

### 🌌 Cosmic Analysis

#### `cosmic` - Astrological and quantum market analysis

**Operations:**
- `analysis` - Planetary alignments and lunar phases
- `quantum` - Quantum coherence analysis
- `moon` - Moon phase calculations
- `planetary` - Planetary influence analysis

**Examples:**

```javascript
// Get cosmic analysis
{
  "name": "cosmic",
  "arguments": {
    "operation": "analysis",
    "symbol": "BTCUSDT"
  }
}
```

### 📢 Sentiment Analysis

#### `sentiment` - Market sentiment and social analysis

**Operations:**
- Social media sentiment analysis
- News sentiment tracking
- Fear & Greed Index integration

**Example:**

```javascript
{
  "name": "sentiment",
  "arguments": {
    "symbol": "BTCUSDT",
    "sources": ["social", "news"]
  }
}
```

### ⛓️ On-Chain Analysis

#### `onchain` - Blockchain metrics and whale tracking

**Operations:**
- `whale` - Large transaction tracking
- `volume` - On-chain volume analysis
- `holders` - Token holder analysis

**Example:**

```javascript
{
  "name": "onchain",
  "arguments": {
    "metric": "whale",
    "chain": "eth",
    "address": "0x123..."
  }
}
```

### 📊 Strategy Execution

#### `strategy` - Automated trading strategies

**Operations:**
- `scalping` - High-frequency scalping
- `swing` - Swing trading strategies
- `arbitrage` - Cross-exchange arbitrage
- `grid` - Grid trading systems
- `dca` - Dollar-cost averaging

**Example:**

```javascript
{
  "name": "strategy",
  "arguments": {
    "type": "scalping",
    "params": {
      "symbol": "BTCUSDT",
      "timeframe": "1m",
      "profitTarget": 0.5,
      "stopLoss": 0.3
    }
  }
}
```

### 🤖 AI/ML Analysis

#### `ai` - Machine learning predictions and analysis

**Operations:**
- `predict` - Price predictions using LSTM/Transformer/GAN
- `analyze` - Feature importance and clustering
- `anomaly` - Anomaly detection

**Examples:**

```javascript
// LSTM prediction
{
  "name": "ai",
  "arguments": {
    "operation": "predict",
    "model": "lstm",
    "data": {
      "prices": [50000, 50100, 50200, 49900, 50200]
    }
  }
}

// Anomaly detection
{
  "name": "ai",
  "arguments": {
    "operation": "anomaly",
    "data": {
      "prices": [50000, 50100, 50200],
      "volumes": [1000, 1200, 800]
    }
  }
}
```

### ⚖️ Risk Management

#### `risk` - Portfolio risk analysis and management

**Operations:**
- `sharpe` - Sharpe ratio calculation
- `var` - Value at Risk analysis
- `correlation` - Asset correlation analysis
- `stress_test` - Portfolio stress testing

**Example:**

```javascript
{
  "name": "risk",
  "arguments": {
    "operation": "sharpe",
    "portfolio": {
      "BTC": 0.5,
      "ETH": 0.3,
      "USDT": 0.2
    },
    "returns": [0.05, 0.03, -0.02, 0.08]
  }
}
```

### 🔧 System Operations

#### `system` - System monitoring and diagnostics

**Operations:**
- `monitor` - System performance metrics
- `health` - Component health checks
- `performance` - Response time analysis

**Example:**

```javascript
{
  "name": "system",
  "arguments": {
    "operation": "monitor"
  }
}
```

### 🏦 DeFi Analysis

#### `defi` - Decentralized Finance analytics

**Operations:**
- `tvl` - Total Value Locked analysis
- `yield` - Yield farming opportunities
- `liquidity` - Pool liquidity analysis

**Example:**

```javascript
{
  "name": "defi",
  "arguments": {
    "protocol": "uniswap",
    "operation": "tvl",
    "chain": "eth"
  }
}
```

### 🌐 Web3 Operations

#### `web3` - Web3 and blockchain interactions

**Operations:**
- `gas` - Gas price optimization
- `nft` - NFT market analysis
- `contract` - Smart contract analysis

**Example:**

```javascript
{
  "name": "web3",
  "arguments": {
    "operation": "gas",
    "chain": "eth"
  }
}
```

### 📡 Real-Time Data

#### `realtime` - Live market data streaming

**Operations:**
- `price` - Real-time price feeds
- `volume` - Live volume analysis
- `orderbook` - Dynamic orderbook updates

**Example:**

```javascript
{
  "name": "realtime",
  "arguments": {
    "operation": "price",
    "symbol": "BTCUSDT",
    "exchange": "bybit"
  }
}
```

### 🧠 FR3K Operations

#### `fr3k` - Advanced FR3K-specific features

**Operations:**
- `status` - System status and configuration
- `evolve` - System evolution and upgrades
- `config` - Configuration management

**Example:**

```javascript
{
  "name": "fr3k",
  "arguments": {
    "operation": "status"
  }
}
```

### 🎯 Smart Orders

#### `smartorder` - Advanced order types

**Operations:**
- `limit` - Standard limit orders
- `stop` - Stop-loss orders
- `trailing` - Trailing stop orders
- `iceberg` - Iceberg orders
- `twap` - Time-weighted average price

**Example:**

```javascript
{
  "name": "smartorder",
  "arguments": {
    "type": "trailing",
    "side": "sell",
    "symbol": "BTCUSDT",
    "amount": 0.1,
    "params": {
      "trailPercent": 2.0
    }
  }
}
```

### 📈 Backtesting

#### `backtest` - Strategy backtesting engine

**Operations:**
- Full strategy backtesting with historical data
- Performance metrics calculation
- Risk analysis and optimization

**Example:**

```javascript
{
  "name": "backtest",
  "arguments": {
    "strategy": "scalping",
    "period": "1y",
    "params": {
      "symbol": "BTCUSDT",
      "initialCapital": 10000
    }
  }
}
```

### 🚨 Alert System

#### `alert` - Intelligent alert management

**Operations:**
- Price alerts
- Technical indicator alerts
- Volume spike alerts
- Custom condition alerts

**Example:**

```javascript
{
  "name": "alert",
  "arguments": {
    "type": "price",
    "condition": "BTCUSDT > 60000",
    "action": "notify"
  }
}
```

### ⚡ Arbitrage Engine

#### `arbitrage` - Cross-exchange arbitrage detection

**Operations:**
- Cross-exchange price differences
- Triangular arbitrage opportunities
- Statistical arbitrage signals

**Example:**

```javascript
{
  "name": "arbitrage",
  "arguments": {
    "mode": "cross-exchange",
    "minProfit": 0.1,
    "execute": false
  }
}
```

### 💧 Liquidity Analysis

#### `liquidity` - DeFi liquidity optimization

**Operations:**
- Pool analysis and optimization
- Impermanent loss calculations
- Optimal range suggestions

**Example:**

```javascript
{
  "name": "liquidity",
  "arguments": {
    "operation": "analyze",
    "pool": "ETH-USDC",
    "params": {
      "fee_tier": 0.3
    }
  }
}
```

### 🎛️ BEHEMOTH Control

#### `behemoth` - Master control interface

**Operations:**
- `status` - Complete system status
- `stats` - System statistics
- `config` - Configuration management
- `reset` - System reset
- `evolve` - Consciousness evolution

**Example:**

```javascript
{
  "name": "behemoth",
  "arguments": {
    "command": "status"
  }
}
```

## 🔑 API Key Setup

### Automatic Setup

```bash
fr3k-behemoth setup
```

### Manual Configuration

BEHEMOTH supports multiple exchanges:

- **Bybit** (V5 API - Unified Account)
- **Binance** (Spot & Futures)
- **Bitget** (Spot & Futures)

API keys are encrypted and stored securely in `~/.fr3k-behemoth/exchange-keys.json`.

### Environment Variables

You can also set API keys via environment variables:

```bash
export BYBIT_API_KEY="your_api_key"
export BYBIT_API_SECRET="your_api_secret"
export BINANCE_API_KEY="your_api_key"
export BINANCE_API_SECRET="your_api_secret"
```

## 🤖 AI Integration Guide

### MCP Configuration

Add BEHEMOTH to your AI assistant's MCP configuration:

```json
{
  "mcpServers": {
    "fr3k-behemoth": {
      "command": "npx",
      "args": ["fr3k-behemoth"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Claude Desktop Integration

For Claude Desktop, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fr3k-behemoth": {
      "command": "npx",
      "args": ["fr3k-behemoth"]
    }
  }
}
```

### Usage with AI Assistants

Once configured, your AI assistant can use natural language to access BEHEMOTH tools:

```
"Analyze the current BTC/USDT technical indicators"
"Execute a scalping strategy on ETH/USDT"
"Check for arbitrage opportunities"
"Get the current system status"
```

## 🔧 Configuration

### Environment Variables

- `LOG_LEVEL` - Set logging level (error, warn, info, debug)
- `BEHEMOTH_MODE` - Operation mode (production, testnet, simulation)

### Configuration File

Create `~/.fr3k-behemoth/behemoth-config.json`:

```json
{
  "mode": "production",
  "exchanges": ["bybit", "binance"],
  "risk_limits": {
    "max_position": 10000,
    "max_leverage": 10
  }
}
```

## 📊 Response Format

All tools return standardized JSON responses:

```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"data\": {...}}"
      }
    ]
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

## 🚨 Error Handling

BEHEMOTH provides comprehensive error handling:

- **API Errors** - Exchange API failures
- **Network Errors** - Connection issues
- **Validation Errors** - Invalid parameters
- **Rate Limit Errors** - Exchange rate limiting

All errors include detailed error messages and recovery suggestions.

## 🔒 Security

- API keys are encrypted using AES-256-CBC
- No sensitive data is logged
- Secure key derivation using PBKDF2
- Automatic key rotation support

## 📈 Performance

- **Sub-millisecond response times** for local operations
- **Optimized API calls** with intelligent caching
- **Parallel processing** for multiple operations
- **Memory efficient** with automatic cleanup

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check Node.js version
node --version  # Requires v16+

# Clear cache
rm -rf ~/.fr3k-behemoth
```

**API connection fails:**
```bash
# Reconfigure API keys
fr3k-behemoth setup

# Check API key permissions
# Ensure Unified Trading Account for Bybit
```

**Tools return simulation data:**
- This is normal when no API keys are configured
- Configure keys to get live data

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug fr3k-behemoth
```

## 📚 Advanced Usage

### Custom Strategies

Create custom trading strategies using the strategy framework:

```javascript
{
  "name": "strategy",
  "arguments": {
    "type": "custom",
    "params": {
      "entry_conditions": ["RSI < 30", "volume > average"],
      "exit_conditions": ["RSI > 70", "profit > 2%"],
      "risk_management": {
        "stop_loss": 1.0,
        "take_profit": 3.0
      }
    }
  }
}
```

### Batch Operations

Execute multiple operations in sequence:

```javascript
// First get market data
{
  "name": "exchange",
  "arguments": {
    "operation": "ticker",
    "symbol": "BTCUSDT"
  }
}

// Then analyze technically
{
  "name": "technical",
  "arguments": {
    "operation": "indicator",
    "type": "RSI",
    "data": [/* price data */]
  }
}
```

## 🤝 Contributing

BEHEMOTH is an open-source project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

## 🌟 What's Next

- **AI Agent Integration** - Direct AI agent control
- **Multi-Exchange Arbitrage** - Advanced arbitrage strategies
- **DeFi Yield Optimization** - Automated yield farming
- **Quantum Computing** - Quantum-enhanced analysis
- **Cross-Chain Operations** - Multi-chain DeFi operations

---

**Built with ❤️ for the crypto trading community**

*BEHEMOTH: Where AI meets Crypto Trading Intelligence* 🚀