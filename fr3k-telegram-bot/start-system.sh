#!/bin/bash
# PAI Telegram Bot System Launcher
# Starts all four agents in background with logging

set -e

BUN_CMD="/home/fr3k/.bun/bin/bun"

echo "🚀 Starting PAI Telegram Bot System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create logs directory
mkdir -p logs

# CRITICAL: Kill any existing agents first to avoid 409 conflicts
echo "🧹 Cleaning up any existing agents..."
pkill -f "communication-agent.ts" || true
pkill -f "voice-agent.ts" || true
pkill -f "task-orchestrator.ts" || true
pkill -f "autonomous-monitor.ts" || true
pkill -f "twilio-voice-server.ts" || true
pkill -f "enhanced-notification-agent.ts" || true
pkill -f "index.ts" || true
sleep 2

# Clean up any existing flag files
rm -f /tmp/pai-new-message.flag
rm -f /tmp/pai-message-queue.json
touch /tmp/pai-message-queue.json

# Start Voice Agent (port 8888)
echo "🔊 Starting Voice Agent..."
$BUN_CMD agents/voice-agent.ts > logs/voice-agent.log 2>&1 &
VOICE_PID=$!
echo "   PID: $VOICE_PID"

# Wait for voice agent to be ready
sleep 2

# Start Communication Agent (Telegram listener)
echo "🤖 Starting Communication Agent..."
$BUN_CMD agents/communication-agent.ts > logs/communication-agent.log 2>&1 &
COMM_PID=$!
echo "   PID: $COMM_PID"

# Wait for communication agent to be ready
sleep 2

# Start Task Orchestrator (autonomous background agent)
echo "🧠 Starting Task Orchestrator..."
$BUN_CMD agents/task-orchestrator.ts > logs/task-orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
echo "   PID: $ORCHESTRATOR_PID"

# Wait for orchestrator to be ready
sleep 2

# Start Autonomous Monitor (CRYPTO DISABLED - See DISABLE-CRYPTO-TRADING.md to re-enable)
# echo "📊 Starting Autonomous Monitor..."
# $BUN_CMD agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &
# MONITOR_PID=$!
# echo "   PID: $MONITOR_PID"

# Wait for monitor to be ready
# sleep 2
MONITOR_PID=""  # Empty since crypto disabled

# Start Twilio Voice Server (two-way voice conversations)
echo "📞 Starting Twilio Voice Server..."
$BUN_CMD agents/twilio-voice-server.ts > logs/twilio-voice-server.log 2>&1 &
TWILIO_PID=$!
echo "   PID: $TWILIO_PID"

# Wait for Twilio server to be ready
sleep 2

# Start Enhanced Notification Agent (CRYPTO/TRADING DISABLED - See DISABLE-CRYPTO-TRADING.md to re-enable)
# echo "📢 Starting Enhanced Notification Agent..."
# $BUN_CMD agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &
# NOTIFICATION_PID=$!
# echo "   PID: $NOTIFICATION_PID"

# Wait for notification agent to be ready
# sleep 2
NOTIFICATION_PID=""  # Empty since crypto/trading disabled

# Start Main Bot (message processor)
echo "🔄 Starting Main Bot..."
$BUN_CMD index.ts > logs/main-bot.log 2>&1 &
MAIN_PID=$!
echo "   PID: $MAIN_PID"

# Save PIDs for cleanup
echo "$VOICE_PID" > /tmp/pai-voice-agent.pid
echo "$COMM_PID" > /tmp/pai-communication-agent.pid
echo "$ORCHESTRATOR_PID" > /tmp/pai-task-orchestrator.pid
# echo "$MONITOR_PID" > /tmp/pai-autonomous-monitor.pid  # Crypto disabled
echo "$TWILIO_PID" > /tmp/pai-twilio-voice-server.pid
# echo "$NOTIFICATION_PID" > /tmp/pai-enhanced-notification-agent.pid  # Crypto/trading disabled
echo "$MAIN_PID" > /tmp/pai-main-bot.pid

echo ""
echo "✅ All agents started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Voice Agent:        http://localhost:8888"
echo "Twilio Voice:       http://localhost:8080"
echo "Task Orchestrator:  Running autonomously"
echo "Crypto/Trading:     DISABLED (see DISABLE-CRYPTO-TRADING.md)"
echo "Logs:               ./logs/"
echo ""
echo "Stop system:         ./stop-system.sh"
echo "Check logs:          tail -f logs/*.log"
echo ""
echo "🎯 System ready for 24/7 operation!"
