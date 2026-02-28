# FR3K Complete System Distribution

> **Full Autoimprove 101 Loops | PAI/FR3K System | Telegram Relay | Voice Server**

Complete portable distribution of the FR3K autonomous AI system. Includes all components for full system setup on a new machine.

---

## 📦 What's Included

| Component | Description | Location |
|-----------|-------------|----------|
| **Autoimprove 101 Loops** | Self-improvement loop system with 100+ iterations | `autoimprove-101-loops/` |
| **PAI/FR3K System** | Personal AI Infrastructure core | `claude-skills/CORE/`, `claude-skills/FR3K/` |
| **Telegram Relay** | Bidirectional Telegram-Claude bridge | `telegram-relay/` |
| **FR3K Telegram Bot** | Main Telegram interface | `fr3k-telegram-bot/` |
| **PAI Telegram Bot** | Algorithm-focused Telegram bot | `pai-telegram-bot/` |
| **Voice Server** | TTS notification system | `voice-server/` |
| **Claude Hooks** | Lifecycle event handlers | `claude-hooks/` |
| **Claude Skills** | All Claude Code skills | `claude-skills/` |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Operating System: Linux (Debian/Ubuntu recommended)
# Minimum: 2GB RAM, 10GB storage
# Recommended: 4GB+ RAM, 20GB+ storage

# Required tools
sudo apt update
sudo apt install -y git curl bun python3 python3-pip nodejs npm
```

### Installation

```bash
# 1. Extract the archive
tar -xzf fr3k-system.tar.gz
cd fr3k-export

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your API keys

# 3. Install dependencies
bun install

# 4. Install Claude Code (if not already installed)
npm install -g @anthropic-ai/claude-code

# 5. Run setup
./setup/install.sh
```

---

## 📋 Detailed Setup

### 1. Environment Configuration

Edit `.env` with your values:

```bash
# Required: Anthropic API Key
ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx

# Required: Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_USER_ID=123456789

# Optional: Voice APIs
ELEVENLABS_API_KEY=xxxxx
GEMINI_API_KEY=xxxxx
```

### 2. Claude Code Setup

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Configure Claude Code
mkdir -p ~/.claude
cp claude-hooks/* ~/.claude/hooks/
cp -r claude-skills/* ~/.claude/skills/

# Create settings.json
cat > ~/.claude/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_key_here",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  },
  "skipDangerousModePermissionPrompt": true
}
EOF
```

### 3. Telegram Relay Setup

```bash
cd telegram-relay
bun install
cp .env.example .env
# Edit .env with your tokens
bun run start
```

### 4. Voice Server Setup

```bash
cd voice-server
bun install
bun server.ts  # Runs on port 8888
```

### 5. Autoimprove Loops Setup

```bash
cd autoimprove-101-loops
bun install

# Run the self-improvement loop
bun autonomous/self-improvement-loop.ts

# Or install as systemd service
sudo cp ../setup/fr3k-daemon.service /etc/systemd/system/
sudo systemctl enable fr3k-daemon
sudo systemctl start fr3k-daemon
```

---

## 🧠 Component Details

### Autoimprove 101 Loops

The core self-improvement system that iteratively enhances itself.

- **Entry Point**: `autoimprove-101-loops/autonomous/self-improvement-loop.ts`
- **Loop Counter**: 100+ completed iterations
- **Key Files**:
  - `self-improvement-loop.ts` - Main loop orchestrator
  - `fr3k-supercharged.ts` - Enhanced FR3K system
  - `unified-fr3k-system.ts` - Unified architecture
  - `LOOP-*.md` - Individual loop documentation

### PAI/FR3K System

Personal AI Infrastructure - core framework for autonomous operation.

- **Skills**: Located in `claude-skills/`
  - `CORE/` - System identity and configuration
  - `FR3K/` - Main FR3K skill
  - `MEMU/` - Memory system
  - `PAIUpgrade/` - Auto-upgrade system
  - `Agents/` - Agent composition system
  - `Evals/` - Evaluation framework

### Telegram Relay

Bridge between Telegram and Claude Code.

- **Features**:
  - Bidirectional message relay
  - Voice message support (transcription + TTS)
  - Session management
  - Memory persistence

### Voice Server

TTS notification server for voice feedback.

- **Port**: 8888 (default)
- **Features**:
  - ElevenLabs integration
  - Phase notifications
  - System overview voice

### Claude Hooks

Event-driven hooks for Claude Code lifecycle.

- **Events**:
  - `SessionStart` - Initialization
  - `UserPromptSubmit` - Format injection
  - `PreToolUse` - Security validation
  - `Stop` - Response capture
  - `SessionEnd` - Summary generation

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Main environment variables |
| `~/.claude/settings.json` | Claude Code configuration |
| `telegram-relay/.env` | Relay-specific config |
| `fr3k-telegram-bot/.env` | Bot-specific config |
| `voice-server/server.ts` | Voice server config |

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FR3K COMPLETE SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐     ┌───────────────┐                    │
│  │   TELEGRAM    │◄────┤   RELAY       │                     │
│  │     BOTS      │────►│   SYSTEM      │                     │
│  └───────▲───────┘     └───────▲───────┘                    │
│          │                      │                            │
│          │                      ▼                            │
│          │              ┌───────────────┐                    │
│          │              │  CLAUDE CODE  │                     │
│          │              │     + HOOKS   │                     │
│          │              └───────▲───────┘                    │
│          │                      │                            │
│          │              ┌───────┴───────┐                    │
│          │              │               │                    │
│          │        ┌─────┴─────┐   ┌────┴────┐               │
│          │        │   SKILLS  │   │  VOICE  │               │
│          │        │           │   │  SERVER │                │
│          │        └─────▲─────┘   └─────────┘               │
│          │              │                                      │
│          │        ┌─────┴─────┐                              │
│          └────────┤  AUTOIMPROVE │◄──── 101 LOOPS            │
│                   │     101      │                            │
│                   └─────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

- **Autonomous Self-Improvement**: 100+ iteration enhancement loops
- **Multi-Modal Communication**: Telegram, Voice, CLI interfaces
- **Memory System**: Persistent context and learning storage
- **Security**: Command validation, prompt injection defense
- **Observability**: Rating capture, sentiment analysis, metrics
- **Extensibility**: Modular skills, hooks, and agents

---

## 📝 API Keys Required

### Required
- **Anthropic API Key**: For Claude Code
- **Telegram Bot Token**: From @BotFather
- **Telegram User ID**: Your numeric Telegram ID

### Optional
- **ElevenLabs API Key**: For voice responses
- **Gemini API Key**: For voice transcription
- **Supabase**: For memory persistence

---

## 🚦 Running the System

### Start Everything

```bash
# Terminal 1: Voice Server
cd voice-server && bun server.ts

# Terminal 2: Telegram Relay
cd telegram-relay && bun run start

# Terminal 3: Autoimprove Loops
cd autoimprove-101-loops && bun autonomous/self-improvement-loop.ts

# Terminal 4: Claude Code (normal usage)
claude
```

### Systemd Service

```bash
# Install autoimprove as daemon
sudo cp setup/fr3k-daemon.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable fr3k-daemon
sudo systemctl start fr3k-daemon
```

---

## 📚 Documentation

- `docs/INSTALL.md` - Installation guide
- `autoimprove-101-loops/100-LOOPS-COMPLETE.md` - Loop documentation
- `claude-hooks/README.md` - Hook system reference
- `telegram-relay/README.md` - Relay documentation
- `fr3k-telegram-bot/README.md` - Bot documentation

---

## ⚠️ Security Notes

1. **Never commit `.env` files** - Use `.env.example` templates
2. **Review hook permissions** - Hooks can execute commands
3. **Validate Telegram users** - Only allow your user ID
4. **Monitor autonomous operations** - Review autoimprove logs
5. **Secure API keys** - Use environment variables, not hardcoded

---

## 🐛 Troubleshooting

### Port 8888 Already in Use
```bash
# Kill existing voice server
lsof -ti:8888 | xargs kill -9
```

### Claude Code Not Found
```bash
# Reinstall globally
npm install -g @anthropic-ai/claude-code
```

### Telegram Bot Not Responding
```bash
# Check bot token and user ID in .env
# Verify webhook is set (if using webhook mode)
```

### Permission Denied on Hooks
```bash
# Make hooks executable
chmod +x ~/.claude/hooks/*.ts
```

---

## 🔄 Updates

The system includes PAIUpgrade skill for automatic updates:

```bash
# In Claude Code, run:
/upgrade system

# Or manually:
git pull origin main
bun install
```

---

## 📞 Support

For issues and questions:
- Review documentation in component directories
- Check logs in `~/.fr3k/logs/`
- Review Claude Code transcripts in `~/.claude/transcripts/`

---

## 📜 License

This is a personal AI infrastructure system. Use responsibly and in accordance with API terms of service.

---

**System Version**: FR3K Complete 2026-02-28
**Loops Completed**: 101+
**Skills Included**: 20+
**Hooks Active**: 14
