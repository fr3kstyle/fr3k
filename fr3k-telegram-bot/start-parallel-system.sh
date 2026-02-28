#!/bin/bash

# Parallel Agent System Startup Script

echo "🚀 Starting Parallel Agent System..."
echo "===================================="

# Check if required processes are running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo "✅ $1 is running"
        return 0
    else
        echo "❌ $1 is not running"
        return 1
    fi
}

# Check if metrics server is running
check_metrics_server() {
    if curl -s http://localhost:9090/status > /dev/null 2>&1; then
        echo "✅ Metrics server is running on port 9090"
        return 0
    else
        echo "❌ Metrics server is not responding"
        return 1
    fi
}

# Start parallel agents
echo "🔧 Starting parallel agent components..."

# Start metrics server
echo "📊 Starting metrics server..."
bun run ./parallel-agents/metrics-server.ts &
METRICS_PID=$!

# Wait for metrics server to start
sleep 3

# Check if metrics server is running
if ! check_metrics_server; then
    echo "❌ Metrics server failed to start"
    exit 1
fi

# Start main bot with parallel processing
echo "🤖 Starting main bot with parallel processing..."
bun run index.ts &
MAIN_PID=$!

# Wait for main bot to start
sleep 5

# Check if main bot is running
if ! check_process "index.ts"; then
    echo "❌ Main bot failed to start"
    kill $METRICS_PID 2>/dev/null
    exit 1
fi

# Show final status
echo ""
echo "🎉 Parallel Agent System Started Successfully!"
echo "============================================"
echo "📊 Metrics Server: http://localhost:9090"
echo "📊 Status: http://localhost:9090/status"
echo "📈 Live Metrics: http://localhost:9090/metrics"
echo "🤖 Main Bot: Running"
echo ""
echo "📱 Telegram Commands:"
echo "   /status - Main system status"
echo "   /parallel-test - Test parallel agents"
echo "   /parallel-status - Parallel system status"
echo ""
echo "🔧 To stop the system:"
echo "   ./stop-parallel-system.sh"
echo ""
echo "✨ System is ready for massive parallel processing!"

# Store PIDs for stopping
echo $METRICS_PID > /tmp/pai-metrics.pid
echo $MAIN_PID > /tmp/pai-main.pid

# Monitor the system
echo "📡 Monitoring system..."
while check_process "index.ts" && check_metrics_server; do
    sleep 30
    echo "💓 System heartbeat at $(date)"
done

echo ""
echo "⚠️  System processes stopped"