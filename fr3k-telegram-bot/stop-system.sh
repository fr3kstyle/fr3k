#!/bin/bash
# Stop all PAI Telegram Bot agents

echo "🛑 Stopping PAI Telegram Bot System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Stop via systemd if running
if systemctl --user is-active pai-telegram-bot.service >/dev/null 2>&1; then
    echo "Stopping systemd service..."
    systemctl --user stop pai-telegram-bot.service
fi

# Kill any remaining processes
pkill -f "pai-telegram-bot" 2>/dev/null
pkill -f "communication-agent" 2>/dev/null
pkill -f "voice-agent" 2>/dev/null
pkill -f "task-orchestrator" 2>/dev/null
pkill -f "autonomous-monitor" 2>/dev/null
pkill -f "twilio-voice-server" 2>/dev/null
pkill -f "enhanced-notification-agent" 2>/dev/null
pkill -f "autonomous-monitor" 2>/dev/null
pkill -f "index.ts" 2>/dev/null

# Clean up flag files
rm -f /tmp/pai-new-message.flag
rm -f /tmp/pai-message-queue.json

# Remove PID files
rm -f /tmp/pai-voice-agent.pid
rm -f /tmp/pai-communication-agent.pid
rm -f /tmp/pai-task-orchestrator.pid
rm -f /tmp/pai-autonomous-monitor.pid
rm -f /tmp/pai-twilio-voice-server.pid
rm -f /tmp/pai-enhanced-notification-agent.pid
rm -f /tmp/pai-main-bot.pid

echo "✅ All agents stopped"
echo ""
echo "Restart with: systemctl --user start pai-telegram-bot"
echo "Or: ./start-system.sh"
