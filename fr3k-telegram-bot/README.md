# PAI Telegram Bot - Permanent System

## Overview

Three-agent system for Telegram integration that provides INSTANT acknowledgment without interrupting main PAI workflow.

**Status:** ✅ AUTO-START ON BOOT via systemd

## Architecture

```
Telegram (@fR3kzSikbot)
    ↓
[1] Communication Agent (instant acknowledgment)
    ↓
Message Queue (/tmp/pai-message-queue.json)
    ↓
[2] Main Bot (processes queue, calls PAI)
    ↓
[3] Voice Agent (async notifications)
    ↓
Voice Server (localhost:8888)
```

## Key Features

- **Instant Response:** < 100ms acknowledgment via Communication Agent
- **Non-Blocking:** Full PAI processing happens asynchronously
- **Auto-Start:** Systemd service starts on boot
- **Male Voice:** Adam (21m00Tcm4TlvDq8ikWAM) for all notifications
- **Session Persistence:** Conversations continue across messages

## Management

### Check Status
```bash
systemctl --user status pai-telegram-bot.service
```

### Start/Stop
```bash
systemctl --user start pai-telegram-bot.service
systemctl --user stop pai-telegram-bot.service
```

### View Logs
```bash
# All agents
tail -f ~/pai-telegram-bot/logs/*.log

# Specific agent
tail -f ~/pai-telegram-bot/logs/communication-agent.log
tail -f ~/pai-telegram-bot/logs/main-bot.log
tail -f ~/pai-telegram-bot/logs/voice-agent.log

# Systemd logs
journalctl --user -u pai-telegram-bot.service -f
```

### Manual Control (if systemd fails)
```bash
cd ~/pai-telegram-bot
./start-system.sh
./stop-system.sh
```

## Files

- **Communication Agent:** `agents/communication-agent.ts` - Receives messages, sends ack
- **Voice Agent:** `agents/voice-agent.ts` - Async voice notifications
- **Main Bot:** `index.ts` - Processes queue, calls PAI
- **Systemd Unit:** `~/.config/systemd/user/pai-telegram-bot.service`
- **Environment:** `.env` (BOT_TOKEN, USER_ID, VOICE_SERVER)

## Configuration

**Bot:** @fR3kzSikbot
**User ID:** 8188688460
**Voice:** Adam (21m00Tcm4TlvDq8ikWAM)
**Voice Server:** http://localhost:8888
**Session File:** /tmp/pai-telegram-sessions.json

## Troubleshooting

### Bot not responding?
```bash
# Check if agents are running
ps aux | grep -E "communication-agent|voice-agent|index.ts"

# Restart via systemd
systemctl --user restart pai-telegram-bot.service
```

### Voice not working?
```bash
# Check voice server
curl http://localhost:8888/health

# Should return: {"status":"healthy"...}
```

### Messages queued but not processed?
```bash
# Check queue
cat /tmp/pai-message-queue.json | jq '.'
```

## Design Philosophy

This system is designed for **continuous operation without interruption**:

1. **Communication Agent** runs separately - handles Telegram connection
2. **Main Bot** processes messages asynchronously - doesn't block main PAI work
3. **Voice Agent** handles notifications in background - non-blocking

**NEVER disable this system** - it's permanent infrastructure.

---

**Installed:** 2026-02-07
**Auto-Start:** Enabled via systemd
**Status:** Always running
