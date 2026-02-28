# Reachy Mini + PAI Integration

## Overview

Full bidirectional integration between Reachy Mini (ElevenLabs Conversational Agent), PAI Telegram Bot, and Claude Code.

## Architecture

```
┌──────────────┐
│   You        │
│  (Voice)     │
└──────┬───────┘
       │ speaks
       ▼
┌──────────────────────────────────┐
│  Reachy Mini                     │
│  ElevenLabs Conversational Agent │
│  (Hugging Face Space)            │
└──────┬───────────────────────────┘
       │ intercepted
       │
       ▼
┌──────────────────────────────────┐
│  PAI Reachy Integration Agent    │
│  (reachy-integration.ts)         │
└──────┬───────────────────────────┘
       │ routes
       │
       ├─────────────────┬────────────────┐
       │                 │                │
       ▼                 ▼                ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│ PAI Telegram │  │ Claude Code │  │ Voice       │
│ Bot          │  │ Commands    │  │ Feedback    │
└──────────────┘  └─────────────┘  └──────────────┘
```

## Setup Instructions

### 1. Get ElevenLabs Agent ID

1. Visit: https://huggingface.co/spaces/mindmodelai/reachy-mini-elevenlabs
2. Create or find your ElevenLabs Conversational Agent
3. Copy the Agent ID

### 2. Configure Environment

Add to your `.env` file:

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here

# Existing PAI Telegram config
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_USER_ID=8188688460
```

### 3. Start Integration

```bash
cd /home/fr3k/pai-telegram-bot

# Start the Reachy integration agent
bun agents/reachy-integration.ts
```

Or restart the full system:

```bash
./start-system.sh
```

## Usage

### Telegram Commands

```
/reachy start           - Activate Reachy integration
/reachy stop            - Deactivate integration
/reachy agent <id>      - Set ElevenLabs Agent ID
/reachy status          - Show integration status
```

### Voice Commands

When integration is active, speak to Reachy Mini:

**Claude Code Control:**
- "Run code check" - `/code bun test`
- "Deploy changes" - `/code git push`
- "Check status" - `/code git status`

**Conversation:**
- "What's my schedule?"
- "Analyze this code"
- "Write a function"

Regular conversation flows through ElevenLabs agent to PAI.

### Examples

**Example 1: Voice to Code**
```
You: "Hey Reachy, run the test suite"
Reachy: (sends to PAI)
PAI: (executes /code bun test)
PAI: Returns results
Reachy: "Tests passed! 15/15 successful"
```

**Example 2: Conversation**
```
You: "What's the status of my project?"
Reachy: (sends to PAI)
PAI: (checks context, analyzes)
PAI: Returns response
Reachy: "Your PAI bot is running smoothly. All agents operational."
```

## Configuration Options

### Agent Personality

Customize your ElevenLabs agent in Hugging Face Space:
- Voice selection (Rachel, Adam, etc.)
- Response style
- Context window
- Safety filters

### Command Safety

The integration includes command sanitization:
- Blocks destructive commands (rm -rf, format, etc.)
- Allows safe operations (git, bun test, etc.)
- Logs all command executions

### Feedback Loop

Reachy Mini provides voice feedback for:
- Command execution results
- Error messages
- Status updates
- Conversation responses

## Troubleshooting

### Agent Not Responding

1. Check agent ID is correct: `/reachy status`
2. Verify ElevenLabs API key in `.env`
3. Check integration is active: `/reachy status`
4. Review logs: `tail -f logs/reachy-integration.log`

### Commands Not Executing

1. Verify command syntax: `/code <command>`
2. Check Claude Code is accessible
3. Review error messages in logs
4. Test command manually first

### Voice Feedback Missing

1. Check Reachy Mini audio output
2. Verify ElevenLabs agent is configured for TTS
3. Check network connectivity to ElevenLabs API
4. Test agent directly in Hugging Face Space

## Advanced Features

### Context Awareness

The agent maintains conversation context:
- Last 5 messages
- Timestamps
- User preferences
- Session state

### Multi-Modal

Planned features:
- Image analysis via Reachy Mini camera
- Code screenshot interpretation
- Visual debugging feedback
- Gesture-based commands

### Autonomous Actions

The agent can:
- Monitor project status autonomously
- Proactively suggest optimizations
- Execute pre-approved commands
- Report issues via voice

## Security

- ✅ User ID whitelist (8188688460 only)
- ✅ Command sanitization
- ✅ API key encryption
- ✅ Audit logging
- ✅ Rate limiting

## Next Steps

1. **Configure Agent ID** - Get your ElevenLabs agent ID from Hugging Face
2. **Test Basic Commands** - Start with `/code echo "hello"`
3. **Enable Voice Feedback** - Verify Reachy Mini speaks responses
4. **Customize Personality** - Adjust agent behavior in Hugging Face Space
5. **Expand Control** - Add more Claude Code commands as needed

## Resources

- [ElevenLabs Conversational API](https://elevenlabs.io/docs/conversational-ai)
- [Reachy Mini Hugging Face Space](https://huggingface.co/spaces/mindmodelai/reachy-mini-elevenlabs)
- [PAI Telegram Bot](https://github.com/fr3kstyle/pai-telegram-bot)
- [Claude Code](https://claude.ai/code)

## Support

For issues or questions:
1. Check logs: `tail -f logs/reachy-integration.log`
2. Review status: `/reachy status` in Telegram
3. Check PAI bot health: `/status` in Telegram

---

**Status:** ✅ Integration agent created, ready for agent ID
**Next:** Provide ElevenLabs Agent ID to activate full integration
