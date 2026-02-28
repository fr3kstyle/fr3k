# FR3K Telegram Bot - 3-Agent System

24/7 Telegram interface for FR3K with instant acknowledgments and voice notifications.

## Architecture

### 3 Independent Agents

1. **Communication Agent** (`communication-agent.ts`)
   - Receives all Telegram messages
   - Sends instant typing indicator acknowledgment
   - Queues messages for processing
   - Never blocks - always responsive

2. **Voice Agent** (`voice-agent.ts`)
   - Processes TTS requests asynchronously
   - Generates voice notifications via voice-server
   - Sends audio files via Telegram
   - Non-blocking voice delivery

3. **Main Bot** (`main-bot.ts`)
   - Processes queued messages through FR3K
   - Sends complete responses
   - Handles long-running tasks (60+ seconds acceptable)
   - Primary interaction interface

## Quick Start

### 1. Installation

```bash
cd ~/pai-telegram-bot
./install.sh
```

### 2. Configuration

Edit `.env` file:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_USER_ID=your_numeric_user_id
VOICE_SERVER_URL=http://localhost:8888
```

**Get Bot Token:**
- Message @BotFather on Telegram
- Create new bot
- Copy token

**Get User ID:**
- Message @userinfobot on Telegram
- Receive your numeric ID

### 3. Start System

```bash
./start-system.sh
```

### 4. Check Status

```bash
tail -f logs/communication-agent.log
```

### 5. Enable Auto-Start (Optional)

```bash
systemctl --user enable pai-telegram-bot.service
systemctl --user start pai-telegram-bot.service
```

## File Structure

```
pai-telegram-bot/
├── agents/
│   ├── communication-agent.ts    # Instant ack handler
│   ├── voice-agent.ts            # TTS notifications
│   └── main-bot.ts               # FR3K response processor
├── logs/                         # Agent logs
├── queue/                        # Message queue storage
├── config/                       # Configuration files
├── start-system.sh              # Launch all agents
├── stop-system.sh               # Shutdown all agents
├── install.sh                   # Installation script
├── package.json                 # NPM dependencies
└── README.md                    # This file
```

## Message Flow

1. **User sends message** → Telegram
2. **Communication Agent** receives instantly
   - Sends typing indicator
   - Queues message
   - Returns immediately
3. **Main Bot** monitors queue
   - Picks up message
   - Calls FR3K
   - Sends response
4. **Voice Agent** (optional)
   - Processes TTS requests
   - Sends voice notifications

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from @BotFather |
| `TELEGRAM_USER_ID` | ✅ | Your numeric Telegram user ID |
| `VOICE_SERVER_URL` | ❌ | Voice server endpoint (default: http://localhost:8888) |
| `FR3K_API_URL` | ❌ | FR3K API endpoint (if using external API) |

## Logs

Each agent writes to its own log file:

- `logs/communication-agent.log` - Message receipts and queueing
- `logs/voice-agent.log` - TTS processing and voice delivery
- `logs/main-bot.log` - FR3K responses and errors

## Troubleshooting

### Bot not responding

```bash
# Check if agents are running
ps aux | grep "pai-telegram-bot"

# Check logs
tail -f logs/communication-agent.log
tail -f logs/main-bot.log
```

### Messages not being processed

```bash
# Check queue file
cat /tmp/pai-message-queue.json

# Check message flag
ls -la /tmp/pai-new-message.flag
```

### Voice notifications not working

```bash
# Check voice server
curl http://localhost:8888/health

# Check voice agent logs
tail -f logs/voice-agent.log
```

## System Integration

The bot integrates with:

- **FR3K System** - Main AI response processing
- **Voice Server** - TTS generation for voice notifications
- **Message Queue** - Persistent message storage
- **Session Storage** - Conversation history persistence

## Security

- User ID whitelisting (only you can use the bot)
- No external API access required
- All processing happens locally
- Messages never leave your system

## License

Part of FR3K Complete System
