# How to Disable Crypto/Trading Features

**Last Updated:** 2026-02-23
**System:** FR3K Telegram Bot (`~/fr3k-telegram-bot/`)

---

## Other Annoying Notifications

### Security Health Agent Voice Alerts

If you're hearing repetitive "Security Health Alert: X health issues, Y security issues" voice notifications:

**Source:** `pai-security-agent.timer` (runs every hour)

**Disable immediately:**
```bash
systemctl --user stop pai-security-agent.timer
systemctl --user disable pai-security-agent.timer
systemctl --user stop pai-security-agent.service
systemctl --user disable pai-security-agent.service
```

**Verify it's stopped:**
```bash
systemctl --user status pai-security-agent.timer
# Should show: "inactive (dead)"
```

**File location:** `~/.pai-workspace/agents/security-health-agent.ts`

---

---

## Overview

The FR3K Telegram Bot has **two crypto/trading agents** that can be independently disabled while keeping the rest of the system running:

| Agent | File | Purpose |
|-------|------|---------|
| **Crypto Market Monitor** | `agents/autonomous-monitor.ts` | Fetches crypto prices from Bybit API, sends market updates every 28 minutes |
| **Trading Notification Agent** | `agents/enhanced-notification-agent.ts` | Reads from `~/trading-system/database/behemoth.db`, sends hourly trading digests |

**Non-crypto agents** (unaffected):
- Communication Agent (`agents/communication-agent.ts`) - Receives/sends Telegram messages
- Voice Agent (`agents/voice-agent.ts`) - TTS voice notifications
- Task Orchestrator (`agents/task-orchestrator.ts`) - Autonomous task management
- Twilio Voice Server (`agents/twilio-voice-server.ts`) - Two-way voice conversations
- Main Bot (`index.ts`) - Core message processing

---

## Quick Disable (Temporary)

To stop crypto agents immediately without restarting the system:

```bash
# Stop Crypto Market Monitor
pkill -f "autonomous-monitor.ts"

# Stop Trading Notification Agent
pkill -f "enhanced-notification-agent.ts"

# Verify they're stopped
ps aux | grep -E "autonomous-monitor|enhanced-notification" | grep -v grep
```

**To restart them later:**
```bash
cd ~/fr3k-telegram-bot
./start-system.sh
```

---

## Permanent Disable (Recommended)

Edit the `start-system.sh` script to comment out the crypto agents:

```bash
cd ~/fr3k-telegram-bot
nano start-system.sh
```

**Find and comment out these sections:**

### 1. Autonomous Monitor (Lines ~120-135)
```bash
# Start Autonomous Monitor (FIXED - now uses proper message formatting)
echo "📊 Starting Autonomous Monitor..."
$BUN_CMD agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &
MONITOR_PID=$!
echo "   PID: $MONITOR_PID"

# Wait for monitor to be ready
sleep 2
```

**Change to:**
```bash
# Start Autonomous Monitor (CRYPTO DISABLED)
# echo "📊 Starting Autonomous Monitor..."
# $BUN_CMD agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &
# MONITOR_PID=$!
# echo "   PID: $MONITOR_PID"

# Wait for monitor to be ready
# sleep 2
MONITOR_PID=""  # Set empty so cleanup doesn't fail
```

### 2. Enhanced Notification Agent (Lines ~150-165)
```bash
# Start Enhanced Notification Agent (rich content & hourly digests)
echo "📢 Starting Enhanced Notification Agent..."
$BUN_CMD agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &
NOTIFICATION_PID=$!
echo "   PID: $NOTIFICATION_PID"

# Wait for notification agent to be ready
sleep 2
```

**Change to:**
```bash
# Start Enhanced Notification Agent (CRYPTO/TRADING DISABLED)
# echo "📢 Starting Enhanced Notification Agent..."
# $BUN_CMD agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &
# NOTIFICATION_PID=$!
# echo "   PID: $NOTIFICATION_PID"

# Wait for notification agent to be ready
# sleep 2
NOTIFICATION_PID=""  # Set empty so cleanup doesn't fail
```

### 3. Update PID File Saving (Lines ~168-175)
```bash
echo "$MONITOR_PID" > /tmp/pai-autonomous-monitor.pid
echo "$NOTIFICATION_PID" > /tmp/pai-enhanced-notification-agent.pid
```

**Change to:**
```bash
# echo "$MONITOR_PID" > /tmp/pai-autonomous-monitor.pid
# echo "$NOTIFICATION_PID" > /tmp/pai-enhanced-notification-agent.pid
```

### 4. Update Success Message (Lines ~180-195)
Remove references to crypto agents from the startup message.

---

## Apply Changes

After editing `start-system.sh`:

```bash
# Stop the system
systemctl --user stop pai-telegram-bot.service

# Start it again (crypto agents won't start)
systemctl --user start pai-telegram-bot.service

# Verify crypto agents are NOT running
ps aux | grep -E "autonomous-monitor|enhanced-notification" | grep -v grep

# Verify other agents ARE running
systemctl --user status pai-telegram-bot.service
```

---

## One-Line Disable (Fastest Method)

If you want to disable crypto agents RIGHT NOW without editing files:

```bash
cd ~/fr3k-telegram-bot

# Kill crypto agents
pkill -f "autonomous-monitor.ts"
pkill -f "enhanced-notification-agent.ts"

# Remove from auto-start in systemd (prevents restart)
sudo sed -i '/autonomous-monitor/d' /home/fr3k/.config/systemd/user/pai-telegram-bot.service
sudo sed -i '/enhanced-notification-agent/d' /home/fr3k/.config/systemd/user/pai-telegram-bot.service

# Reload systemd
systemctl --user daemon-reload

# Restart service
systemctl --user restart pai-telegram-bot.service
```

---

## Verify Crypto Agents Are Disabled

```bash
# Should return empty (no crypto processes running)
ps aux | grep -E "autonomous-monitor|enhanced-notification" | grep -v grep

# Should show other agents running
ps aux | grep -E "communication-agent|voice-agent|task-orchestrator|index.ts" | grep -v grep
```

---

## Re-enable Crypto/Trading Later

To re-enable crypto agents later:

1. **If you edited `start-system.sh`:** Uncomment the lines you commented out
2. **If you used the one-line method:** Restore the service file from backup or manually add the agents back to `start-system.sh`

Then restart:
```bash
systemctl --user restart pai-telegram-bot.service
```

---

## What's Still Running (No Crypto)

After disabling crypto agents, these features **still work**:

✅ Telegram message reception and sending
✅ FR3K AI responses
✅ Voice notifications (text-to-speech)
✅ Task orchestration and autonomous background tasks
✅ Two-way voice conversations via Twilio
✅ Session persistence and conversation history

---

## Troubleshooting

**Crypto agents keep restarting:**
- Check if systemd is auto-restarting them: `systemctl --user list-units | grep crypto`
- Kill them: `pkill -f "autonomous-monitor.ts"`

**Still seeing crypto messages in Telegram:**
- Clear the message queue: `rm /tmp/pai-message-queue.json && touch /tmp/pai-message-queue.json`
- Restart the bot: `systemctl --user restart pai-telegram-bot.service`

**Want to completely remove crypto code:**
- Delete `agents/autonomous-monitor.ts`
- Delete `agents/enhanced-notification-agent.ts`
- Edit `start-system.sh` to remove all references to them

---

## Summary

**To disable crypto/trading RIGHT NOW:**
```bash
pkill -f "autonomous-monitor.ts"
pkill -f "enhanced-notification-agent.ts"
```

**To disable PERMANENTLY:**
```bash
nano ~/fr3k-telegram-bot/start-system.sh
# Comment out autonomous-monitor and enhanced-notification-agent sections
systemctl --user restart pai-telegram-bot.service
```

**To verify:**
```bash
ps aux | grep -E "autonomous-monitor|enhanced-notification" | grep -v grep
# Should return nothing
```

---

**Questions?** Check the logs: `tail -f ~/fr3k-telegram-bot/logs/*.log`
