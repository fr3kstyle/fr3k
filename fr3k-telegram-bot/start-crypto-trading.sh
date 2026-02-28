#!/bin/bash
# 🌌 BEHEMOTH CRYPTO TRADING SYSTEM
# Replaces generic PAI notifications with crypto trading alerts

echo "🌌 STARTING BEHEMOTH CRYPTO TRADING SYSTEM..."

# Kill existing generic agents
echo "🛑 Stopping generic agents..."
pkill -f "enhanced-notification-agent" || true
pkill -f "autonomous-monitor" || true
pkill -f "task-orchestrator" || true
pkill -f "proactive-agent" || true

sleep 2

# Start crypto trading agent
echo "🚀 Starting Crypto Trading Agent..."
cd ~/fr3k-telegram-bot
bun run agents/crypto/crypto-trading-agent.ts &
CRYPTO_PID=$!

echo "✅ CRYPTO TRADING AGENT started (PID: $CRYPTO_PID)"
echo "📊 Monitoring: BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, TRX, MATIC"
echo "⚡ Dynamic Leverage: 10x-50x"
echo "💵 Exchange: Bybit (LIVE)"

# Keep running
wait
