#!/bin/bash

# Parallel Agent System Stop Script

echo "🛑 Stopping Parallel Agent System..."
echo "================================="

# Function to kill process by PID
kill_process() {
    if [ -f "$1" ]; then
        local pid=$(cat "$1")
        if ps -p $pid > /dev/null; then
            echo "🔧 Stopping process with PID $pid..."
            kill -TERM $pid 2>/dev/null
            sleep 2
            if ps -p $pid > /dev/null; then
                echo "🔥 Force killing process $pid..."
                kill -KILL $pid 2>/dev/null
            fi
            echo "✅ Process stopped"
        fi
        rm -f "$1"
    fi
}

# Kill processes
echo "🔄 Stopping parallel system components..."

# Kill metrics server
kill_process /tmp/pai-metrics.pid

# Kill main bot
kill_process /tmp/pai-main.pid

# Kill any remaining parallel agent processes
echo "🔍 Cleaning up any remaining processes..."
pkill -f "metrics-server.ts" 2>/dev/null || true
pkill -f "parallel-agents" 2>/dev/null || true

# Check for any remaining processes
if pgrep -f "index.ts" > /dev/null; then
    echo "⚠️  Found remaining main bot processes..."
    pkill -f "index.ts" 2>/dev/null || true
    sleep 2
fi

if pgrep -f "metrics-server" > /dev/null; then
    echo "⚠️  Found remaining metrics server processes..."
    pkill -f "metrics-server" 2>/dev/null || true
    sleep 2
fi

echo ""
echo "✅ Parallel Agent System Stopped"
echo "================================"

# Show final status
echo ""
echo "🔍 Final System Check:"
if check_process "index.ts"; then
    echo "❌ Main bot is still running"
fi

if check_process "metrics-server.ts"; then
    echo "❌ Metrics server is still running"
fi

if curl -s http://localhost:9090/status > /dev/null 2>&1; then
    echo "❌ Metrics server is still responding"
fi

echo ""
echo "🎉 System shutdown complete!"