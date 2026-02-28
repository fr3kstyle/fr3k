#!/bin/bash

# PAI Dispatcher System Startup Script
# This script starts the complete parallel agent system

echo "🚀 Starting PAI Dispatcher System"
echo "===================================="

# Check if bun is available
if command -v bun &> /dev/null; then
    BUN_CMD="bun"
elif command -v node &> /dev/null; then
    BUN_CMD="node"
else
    echo "❌ Neither bun nor node found. Please install Node.js."
    exit 1
fi

echo "📋 Using: $BUN_CMD"

# Create necessary directories
mkdir -p /tmp/pai-agents
echo "✅ Created agent work directory"

# Check if components exist
if [ ! -f "agents/communication-agent.ts" ]; then
    echo "❌ Communication agent not found!"
    exit 1
fi

if [ ! -f "agents/dispatcher-agent.ts" ]; then
    echo "❌ Dispatcher agent not found!"
    exit 1
fi

if [ ! -f "index.ts" ]; then
    echo "❌ Main bot not found!"
    exit 1
fi

echo "🎯 All components found"

# Start components in background processes
echo "🔄 Starting components..."

# Start Communication Agent
echo "🤖 Starting Communication Agent..."
$BUN_CMD agents/communication-agent.ts &
COMM_PID=$!
echo "✅ Communication Agent started (PID: $COMM_PID)"

# Start Dispatcher Agent
echo "🎯 Starting Dispatcher Agent..."
$BUN_CMD agents/dispatcher-agent.ts &
DISPATCH_PID=$!
echo "✅ Dispatcher Agent started (PID: $DISPATCH_PID)"

# Wait a bit for components to initialize
sleep 3

# Start Main Bot
echo "🚀 Starting Main Bot..."
$BUN_CMD index.ts &
MAIN_PID=$!
echo "✅ Main Bot started (PID: $MAIN_PID)"

echo ""
echo "🎉 PAI Dispatcher System is running!"
echo "===================================="
echo ""
echo "📊 System Components:"
echo "   🤖 Communication Agent: PID $COMM_PID (Telegram monitoring)"
echo "   🎯 Dispatcher Agent: PID $DISPATCH_PID (Parallel coordination)"
echo "   🚀 Main Bot: PID $MAIN_PID (Response handling)"
echo ""
echo "📡 APIs:"
echo "   🔊 Voice Agent: http://localhost:8989/notify"
echo "   🎯 Dispatcher API: http://localhost:8990/agent-result"
echo "   📊 Status API: http://localhost:8990/status"
echo ""
echo "💡 Telegram Commands:"
echo "   /dispatch-status - View dispatcher statistics"
echo "   /clear-queue - Clear pending tasks"
echo "   /status - View overall system status"
echo ""
echo "🧪 Test the system:"
echo "   node test-dispatcher.js"
echo ""
echo "Press Ctrl+C to stop all components"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down PAI Dispatcher System..."
    kill $COMM_PID $DISPATCH_PID $MAIN_PID 2>/dev/null
    echo "✅ All components stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait