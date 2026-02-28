#!/bin/bash
# FR3K Telegram Bot - Stop All Agents
# This script gracefully shuts down all 4 agents

set -e

BOT_DIR="$HOME/pai-telegram-bot"
PID_DIR="$BOT_DIR/.pids"

echo "🛑 Stopping FR3K Telegram Bot System..."

# Function to kill process by PID file
kill_agent() {
  local name="$1"
  local pid_file="$PID_DIR/$2.pid"

  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo "⏹️  Stopping $name (PID: $pid)..."
      kill "$pid"
      rm -f "$pid_file"
      echo "✅ $name stopped"
    else
      echo "⚠️  $name not running (stale PID file)"
      rm -f "$pid_file"
    fi
  else
    echo "⚠️  $name PID file not found"
  fi
}

# Stop all agents
kill_agent "Communication Agent" "communication-agent"
kill_agent "Voice Agent" "voice-agent"
kill_agent "Task Orchestrator" "task-orchestrator"
kill_agent "Main Bot" "main-bot"

# Also kill any remaining bun processes for this bot
pkill -f "pai-telegram-bot/agents/" 2>/dev/null || true

echo ""
echo "✅ FR3K Telegram Bot System Stopped"
