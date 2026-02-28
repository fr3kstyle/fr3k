# PAI Telegram Bot System - Autonomous Architecture

## 🎯 Overview

24/7 autonomous Telegram bot system with **zero blocking**. Messages are acknowledged instantly, processed in background, with async voice notifications.

## 🏗️ Three-Agent Architecture

### 1. Communication Agent (`agents/communication-agent.ts`)
**Purpose:** Instant message reception & acknowledgment

**Responsibilities:**
- Receives all Telegram messages instantly
- Sends immediate acknowledgment response
- Queues messages for processing
- Sends async voice notification for new messages
- Flags main bot when new messages arrive

**Key Feature:** Never blocks user. Instant response always.

### 2. Voice Agent (`agents/voice-agent.ts`)
**Purpose:** Async voice notification system

**Responsibilities:**
- Queues all voice notifications by priority
- HTTP API on port 8989 for other agents
- Processes queue without blocking
- Automatic retry with priority degradation
- Different voices for different phases

**Key Feature:** Non-blocking voice. Main work never waits for TTS.

### 3. Main Bot (`index.ts`)
**Purpose:** Message processing orchestration

**Responsibilities:**
- Monitors message queue (500ms check interval)
- Processes messages from queue
- Calls PAI (Claude Code) for responses
- Sends full responses back to Telegram
- Manages session persistence

**Key Feature:** Background processing. Communication never waits.

## 🔄 Message Flow

```
User sends message
       ↓
Communication Agent (instant acknowledgment)
       ↓
Queue message → Flag file
       ↓
Main Bot (detects flag, processes queue)
       ↓
Call PAI → Get response
       ↓
Send response via Telegram
       ↓
Voice Agent (async notification)
```

**Time to acknowledgment:** < 1 second
**Time to full response:** Depends on PAI processing

## 🚀 Quick Start

### Start the system:
```bash
./start-system.sh
```

### Check status:
```bash
tail -f logs/*.log
```

### Stop the system:
```bash
./stop-system.sh
```

## 📊 Telegram Commands

- `/status` - View system status, queue size, uptime
- `/clearqueue` - Clear message queue (emergency)

## 🔧 Configuration

All configuration in `.env`:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_USER_ID=your_telegram_user_id

# PAI Integration
PAI_VOICE_SERVER=http://localhost:8888

# Storage
SESSION_FILE=/tmp/pai-telegram-sessions.json
```

## 🎁 What You Get

### ✅ Zero Blocking
- Instant acknowledgment: < 1 second
- Never wait for voice to finish speaking
- Never wait for PAI to process

### ✅ Priority Communication
- New messages trigger immediate voice
- High-priority processing
- Queue ensures no messages lost

### ✅ 24/7 Autonomous
- Background monitoring
- Automatic processing
- Persistent sessions

### ✅ Production Ready
- Process isolation (3 agents)
- Crash resilience
- Log files for debugging
- Graceful shutdown

## 🔍 Monitoring

### Check logs:
```bash
# All logs
tail -f logs/*.log

# Specific agent
tail -f logs/communication-agent.log
tail -f logs/voice-agent.log
tail -f logs/main-bot.log
```

### Voice Agent API:
```bash
# Status
curl http://localhost:8989/status

# Queue notification
curl -X POST http://localhost:8989/notify \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","phase":"work","priority":5}'
```

## 🛠️ Troubleshooting

### Messages not being processed?
1. Check if all 3 agents are running: `ps aux | grep "bun agents"`
2. Check logs: `tail -f logs/*.log`
3. Restart: `./stop-system.sh && ./start-system.sh`

### Voice not working?
1. Check voice server is running on port 8888
2. Check voice agent on port 8989: `curl http://localhost:8989/status`
3. Check logs: `tail -f logs/voice-agent.log`

### Queue filling up?
1. Check main bot is processing: `tail -f logs/main-bot.log`
2. PAI might be slow - this is normal for complex tasks
3. Use `/clearqueue` in emergency

## 🎨 Extending

### Add new notification types:
Edit `agents/voice-agent.ts`:
```typescript
export async function notifyCustom(message: string) {
  return queueVoiceNotification(message, "custom", VoicePriority.HIGH);
}
```

### Add new Telegram commands:
Edit `agents/communication-agent.ts`:
```typescript
bot.command("mycommand", async (ctx) => {
  await ctx.reply("Custom response");
});
```

## 📝 Architecture Benefits

1. **Separation of Concerns** - Each agent has one job
2. **Fault Isolation** - One agent crash doesn't kill others
3. **Scalability** - Can add more agents easily
4. **Testing** - Can test agents independently
5. **Monitoring** - Clear logs per agent

## 🎯 Priority Levels

Voice notifications priority (1-10):
- **10 (CRITICAL):** Errors, emergencies
- **8 (HIGH):** User messages, completions
- **5 (NORMAL):** Phase transitions, updates
- **3 (LOW):** Status, background tasks
- **1 (MINIMAL):** Debug, logs

## 🚀 Production Deployment

For 24/7 operation:

### Using systemd (recommended):
Create `/etc/systemd/system/pai-telegram.service`:
```ini
[Unit]
Description=PAI Telegram Bot System
After=network.target

[Service]
Type=forking
User=fr3k
WorkingDirectory=/home/fr3k/pai-telegram-bot
ExecStart=/home/fr3k/pai-telegram-bot/start-system.sh
ExecStop=/home/fr3k/pai-telegram-bot/stop-system.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable pai-telegram
sudo systemctl start pai-telegram
sudo systemctl status pai-telegram
```

### Using tmux (development):
```bash
tmux new -s pai-bot
./start-system.sh
# Ctrl+B, D to detach
tmux attach -t pai-bot  # Reattach
```

## 📞 Support

Issues? Check logs first:
```bash
tail -100 logs/*.log
```

---

**Built for fr3k with ❤️ by PAI**
**Priority: Communication - Always listening, never blocking.**
