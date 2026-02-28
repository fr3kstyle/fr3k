# How to Start Crypto/Trading Agents Manually

**Last Updated:** 2026-02-23

---

## Current Status

✅ **Crypto agents are DISABLED** and will **NOT start on boot**
✅ Main telegram bot system works without crypto
✅ Auto-start is **disabled** for pai-telegram-bot.service

---

## Start Crypto Agents (Manual Only)

If you want to enable crypto/trading features temporarily:

### Option 1: Start Agents Individually

```bash
cd ~/fr3k-telegram-bot

# Start Crypto Market Monitor (Bybit API - market updates every 28 min)
bun agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &

# Start Trading Notification Agent (reads from trading-system database)
bun agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &

# Verify they're running
ps aux | grep -E "autonomous-monitor|enhanced-notification" | grep -v grep
```

### Option 2: Enable in start-system.sh (Permanent)

Edit the start script to uncomment crypto agents:

```bash
cd ~/fr3k-telegram-bot
nano start-system.sh
```

**Uncomment these lines:**

Around line 60:
```bash
# Change from:
# $BUN_CMD agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &
# MONITOR_PID=$!

# To:
$BUN_CMD agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &
MONITOR_PID=$!
```

Around line 79:
```bash
# Change from:
# $BUN_CMD agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &
# NOTIFICATION_PID=$!

# To:
$BUN_CMD agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &
NOTIFICATION_PID=$!
```

Around lines 97-99:
```bash
# Change from:
# echo "$MONITOR_PID" > /tmp/pai-autonomous-monitor.pid
# echo "$NOTIFICATION_PID" > /tmp/pai-enhanced-notification-agent.pid

# To:
echo "$MONITOR_PID" > /tmp/pai-autonomous-monitor.pid
echo "$NOTIFICATION_PID" > /tmp/pai-enhanced-notification-agent.pid
```

Then restart:
```bash
systemctl --user restart pai-telegram-bot.service
```

---

## Stop Crypto Agents

### Stop Immediately

```bash
pkill -f "autonomous-monitor.ts"
pkill -f "enhanced-notification-agent.ts"
```

### Verify They're Stopped

```bash
ps aux | grep -E "autonomous-monitor|enhanced-notification" | grep -v grep
# Should return nothing
```

---

## Auto-Start Configuration

### Enable Bot to Start on Boot (Without Crypto)

```bash
systemctl --user enable pai-telegram-bot.service
```

**Note:** This will start the bot on boot, but crypto agents will remain disabled (as configured in start-system.sh)

### Disable Auto-Start Completely

```bash
systemctl --user disable pai-telegram-bot.service
systemctl --user stop pai-telegram-bot.service
```

### Current Auto-Start Status

Check what's enabled:
```bash
systemctl --user list-units --type=service --state=running | grep -E "pai|telegram"
```

---

## Manual Bot Start/Stop

### Start Bot Manually

```bash
cd ~/fr3k-telegram-bot
./start-system.sh
```

### Stop Bot Manually

```bash
cd ~/fr3k-telegram-bot
./stop-system.sh
```

### Check Bot Status

```bash
systemctl --user status pai-telegram-bot.service
```

---

## What You Get With/Without Crypto

### WITHOUT Crypto Agents (Current Default)

✅ Telegram message reception and sending
✅ FR3K AI responses
✅ Voice notifications
✅ Task orchestration
✅ Two-way voice conversations (Twilio)
✅ Session persistence
✅ Phase notifications (new feature)

❌ No crypto market updates
❌ No trading digests
❌ No Bybit API calls

### WITH Crypto Agents (Manual Start)

All of the above, plus:
✅ Crypto market updates every 28 minutes
✅ Trading system hourly digests
✅ Bybit API integration for real prices
✅ Trading database notifications

---

## Summary

**Current Configuration:**
- ✅ Bot auto-start: **DISABLED**
- ✅ Crypto agents: **DISABLED in start-system.sh**
- ✅ Phase notifications: **ENABLED**

**To Start Everything (including crypto):**
```bash
# Edit start-system.sh to uncomment crypto agents
nano ~/fr3k-telegram-bot/start-system.sh

# Restart bot
systemctl --user restart pai-telegram-bot.service

# Or just start crypto agents manually
cd ~/fr3k-telegram-bot
bun agents/autonomous-monitor.ts > logs/autonomous-monitor.log 2>&1 &
bun agents/enhanced-notification-agent.ts > logs/enhanced-notification-agent.log 2>&1 &
```

**To Start Bot (no crypto):**
```bash
systemctl --user start pai-telegram-bot.service
# OR
cd ~/fr3k-telegram-bot
./start-system.sh
```

**To Stop Everything:**
```bash
systemctl --user stop pai-telegram-bot.service
# OR
cd ~/fr3k-telegram-bot
./stop-system.sh
```

---

**Documentation:**
- Crypto disable guide: `~/pai-telegram-bot/DISABLE-CRYPTO-TRADING.md`
- Phase notifications: `~/pai-telegram-bot/PHASE-NOTIFICATIONS.md`
- Main README: `~/pai-telegram-bot/README.md`
