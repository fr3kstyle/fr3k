## External Communication

**Telegram Bot System (@fR3kzSikbot) - PERMANENT MULTI-AGENT SETUP**

FR3K has a **permanent three-agent Telegram system** that enables remote communication WITHOUT interrupting main development workflow. This system auto-starts on boot via systemd.

**Architecture (3 Agents):**
1. **Communication Agent** (`agents/communication-agent.ts`) - Receives Telegram messages, sends INSTANT acknowledgment, queues for processing
2. **Voice Agent** (`agents/voice-agent.ts`) - Handles all voice notifications async, non-blocking
3. **Main Bot** (`index.ts`) - Processes queued messages, calls FR3K, sends full responses

**Critical Design:**
- Messages trigger INSTANT typing indicator (no generic ack text)
- Full FR3K agent responses delivered immediately via async processing
- Voice notifications happen in background via dedicated agent
- Main FR3K workflow NEVER interrupted by Telegram traffic

**Location:** `~/pai-telegram-bot/`

**Auto-Start:**
```bash
# Managed by systemd - starts on boot automatically
systemctl --user status pai-telegram-bot.service    # Check status
systemctl --user start pai-telegram-bot.service     # Start manually
systemctl --user stop pai-telegram-bot.service      # Stop manually
```

**Manual Control (if needed):**
```bash
cd ~/pai-telegram-bot
./start-system.sh          # Start all 3 agents
./stop-system.sh           # Stop all agents
```

**System Integration:**
- Voice server: `http://localhost:8888` (NOT 8989)
- User ID whitelist: `8188688460`
- Session persistence: `/tmp/pai-telegram-sessions.json`
- Message queue: `/tmp/pai-message-queue.json`
- Signal flag: `/tmp/pai-new-message.flag`

**Voice Configuration:**
- Male voice: Adam (`voiceId: 21m00Tcm4TlvDq8ikWAM`)
- Speed: 1.1 (slightly faster)
- Priority: 7 (high priority notifications)

**When User Mentions Telegram:**
- System is ALWAYS running (auto-start on boot)
- Communication agent responds INSTANTLY to acknowledge
- Voice announces: "New message from fr3k: [preview]"
- Full FR3K response delivered async without blocking

**NEVER disable this system** - it's designed for continuous operation.

---

## Telegram Diagnostics

When user asks about Telegram messages, delivery, or issues:

### Step 1: Check Service Status
```bash
systemctl --user status pai-telegram-bot.service
```
- **Active:** Service running → proceed to Step 2
- **Inactive:** Start with `systemctl --user start pai-telegram-bot.service`

### Step 2: Check Bot Logs for Recent Activity
```bash
# Check for message reception and processing
tail -50 ~/pai-telegram-bot/logs/main-bot.log | grep -E "Processing|FR3K response|Message sent|error"

# Check for API errors
grep -i "error\|fail\|timeout\|unauthorized" ~/pai-telegram-bot/logs/*.log | tail -20
```

**Key Log Patterns:**
- `"Processing: [message]"` = Message received from user
- `"✓ FR3K response received"` = FR3K responded successfully
- `"✅ Message processed"` = Response sent to Telegram
- `"error: FR3K call timeout"` = FR3K took too long (>60s)
- `"GrammyError: Call to 'sendMessage' failed! (401: Unauthorized)"` = **Invalid bot token**

### Step 3: Verify Message Delivery
```bash
# Check if messages are reaching the bot
tail -20 ~/pai-telegram-bot/logs/main-bot.log

# Look for "Processing" lines = messages received
# Look for "✅ Message processed" = responses sent
```

### Step 4: Diagnose Token Issues (401 Unauthorized)
If logs show "401 Unauthorized" errors:

1. **Verify current token:**
   ```bash
   printenv | grep TELEGRAM_BOT_TOKEN
   ```

2. **Test token validity:**
   ```bash
   cd ~/pai-telegram-bot
   bun run -e "
   import { Bot } from 'grammy';
   const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
   await bot.api.sendMessage(8188688460, '🧪 Test - if you see this, token works');
   console.log('✅ Token valid');
   "
   ```

3. **If invalid, guide user to get new token:**
   - Open Telegram, search for **@BotFather**
   - Send `/mybots`, select bot
   - Use "Revoke Token" to generate new token
   - Update environment: `export TELEGRAM_BOT_TOKEN="new_token"`
   - Restart service: `systemctl --user restart pai-telegram-bot.service`

### Step 5: Check Configuration
```bash
# Verify environment variables are set
printenv | grep -E "TELEGRAM_BOT_TOKEN|TELEGRAM_USER_ID"

# Expected: Both variables should be set
# TELEGRAM_BOT_TOKEN=long_numeric_string
# TELEGRAM_USER_ID=8188688460
```

### Common Issues & Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| "No Telegram" response | FR3K unaware of system | Check service status first |
| Messages not received | Service not running | `systemctl --user start pai-telegram-bot.service` |
| Responses not delivered | 401 Unauthorized | Bot token invalid → revoke and update |
| Timeout errors | FR3K response >60s | Check FR3K logs, may need to increase timeout |
| Confusing messages | No delivery status | Check logs for "✅ Message processed" |

**Critical:** NEVER tell user "I have no access to Telegram." The system IS running. Check logs to verify actual state.

---
