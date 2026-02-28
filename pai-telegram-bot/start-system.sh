#!/bin/bash
# FR3K Telegram Bot - Start All Agents
# This script launches all 3 agents in the background

set -e

BOT_DIR="$HOME/pai-telegram-bot"
LOG_DIR="$BOT_DIR/logs"
PID_DIR="$BOT_DIR/.pids"

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

echo "🚀 Starting FR3K Telegram Bot System..."

# Kill any existing processes
"$BOT_DIR/stop-system.sh" 2>/dev/null || true

# Start Communication Agent
echo "📨 Starting Communication Agent..."
cd "$BOT_DIR"
nohup bun agents/communication-agent.ts > "$LOG_DIR/communication-agent.log" 2>&1 &
COMM_PID=$!
echo $COMM_PID > "$PID_DIR/communication-agent.pid"
echo "✅ Communication Agent started (PID: $COMM_PID)"

# Wait a moment for communication agent to initialize
sleep 2

# Start Voice Agent
echo "🎙️ Starting Voice Agent..."
nohup bun agents/voice-agent.ts > "$LOG_DIR/voice-agent.log" 2>&1 &
VOICE_PID=$!
echo $VOICE_PID > "$PID_DIR/voice-agent.pid"
echo "✅ Voice Agent started (PID: $VOICE_PID)"

# Wait a moment for voice agent to initialize
sleep 2

# Start Main Bot
echo "🤖 Starting Main Bot..."
nohup bun agents/main-bot.ts > "$LOG_DIR/main-bot.log" 2>&1 &
MAIN_PID=$!
echo $MAIN_PID > "$PID_DIR/main-bot.pid"
echo "✅ Main Bot started (PID: $MAIN_PID)"

echo ""
echo "✅ FR3K Telegram Bot System Started!"
echo ""
echo "📊 Status:"
echo "  - Communication Agent: PID $COMM_PID"
echo "  - Voice Agent: PID $VOICE_PID"
echo "  - Main Bot: PID $MAIN_PID"
echo ""
echo "📝 Logs:"
echo "  - Communication: $LOG_DIR/communication-agent.log"
echo "  - Voice: $LOG_DIR/voice-agent.log"
echo "  - Main: $LOG_DIR/main-bot.log"
echo ""
echo "🔍 Monitor logs:"
echo "  tail -f $LOG_DIR/communication-agent.log"
echo ""
echo "⏹️  Stop system:"
echo "  ./stop-system.sh"
