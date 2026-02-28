<div align="center">

# 🤖 FR3K COMPLETE SYSTEM

### **Autonomous AI Infrastructure • Self-Improving Loops • Multi-Modal Interface**

![Version](https://img.shields.io/badge/version-2026.02.28-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-production_ready-success?style=for-the-badge)
![Loops](https://img.shields.io/badge/loops-101+-purple?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-linux-orange?style=for-the-badge)

**Complete portable distribution of the FR3K autonomous AI system**

</div>

---

## 🌟 Overview

**FR3K** is a comprehensive Personal AI Infrastructure system featuring:

- 🧠 **Autoimprove 101+ Loops** - Self-improving autonomous system
- 💬 **Telegram Integration** - Dual-bot interface (FR3K + PAI)
- 🎙️ **Voice Server** - TTS notifications and voice feedback
- 🔌 **Claude Hooks** - 14+ lifecycle event handlers
- 🧩 **20+ Skills** - Modular capabilities including Agents, Evals, Fabric
- 🔒 **Security** - Command validation and prompt injection defense

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🔄 Self-Improvement** | 100+ iteration enhancement loops with autonomous optimization |
| **📡 Multi-Modal** | Telegram, Voice, CLI interfaces with bidirectional communication |
| **🧠 Memory System** | Persistent context, learning storage, and session management |
| **🛡️ Security** | Command validation, prompt injection defense, user verification |
| **📊 Observability** | Rating capture, sentiment analysis, comprehensive metrics |
| **🔧 Extensibility** | Modular skills, hooks, agents, and runtime capabilities |

---

## 📦 What's Included

```
fr3k-system/
├── 🤖 autoimprove-101-loops/     # Self-improvement system (100+ loops)
├── 🎣 claude-hooks/               # 14+ lifecycle event handlers
├── 📚 claude-skills/              # 20+ Claude Code skills
│   ├── CORE/                      # System identity & config
│   ├── FR3K/                      # Main FR3K skill
│   ├── MEMU/                      # Memory system
│   ├── PAIUpgrade/                # Auto-upgrade system
│   ├── Agents/                    # Agent composition
│   ├── Evals/                     # Evaluation framework
│   ├── Fabric/                    # 240+ prompt patterns
│   ├── Browser/                   # Browser automation
│   └── BMAD/                      # Agile AI framework
├── 📡 telegram-relay/             # Bidirectional Telegram bridge
├── 🤖 fr3k-telegram-bot/          # Main Telegram interface
├── 🧮 pai-telegram-bot/           # Algorithm-focused bot
├── 🎙️ voice-server/               # TTS notification system
├── 📄 docs/                       # Documentation
└── ⚙️ setup/                      # Installation scripts
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# OS: Linux (Debian 11+, Ubuntu 20.04+)
# RAM: 2GB minimum, 4GB+ recommended
# Storage: 10GB minimum, 20GB+ recommended
```

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/fr3kstyle/fr3k/master/setup/install.sh | bash
```

### Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/fr3kstyle/fr3k.git
cd fr3k

# 2. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 3. Run installation script
./setup/install.sh

# 4. Start the system
fr3k-start
```

---

## 🔑 Required API Keys

| Service | Purpose | Get From |
|---------|---------|----------|
| **Anthropic** | Claude Code | [console.anthropic.com](https://console.anthropic.com/) |
| **Telegram Bot** | Bot communication | [@BotFather](https://t.me/botfather) |
| **Telegram User ID** | User verification | [@userinfobot](https://t.me/userinfobot) |

### Optional APIs

- **ElevenLabs** - Voice responses ([elevenlabs.io](https://elevenlabs.io))
- **Google Gemini** - Voice transcription ([ai.google.dev](https://ai.google.dev))
- **Supabase** - Memory persistence ([supabase.com](https://supabase.com))

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FR3K COMPLETE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │   TELEGRAM   │◄────►│   RELAY      │◄────►│  CLAUDE CODE │          │
│  │    BOTS      │      │   SYSTEM     │      │     + HOOKS  │          │
│  └──────────────┘      └──────┬───────┘      └──────┬───────┘          │
│                                │                      │                  │
│                                │                      ▼                  │
│                                │              ┌──────────────┐          │
│                                │              │   SKILLS     │          │
│                                │              │  + AGENTS    │          │
│                                │              └──────┬───────┘          │
│                                │                     │                  │
│                                │              ┌──────┴───────┐          │
│                                │              │              │          │
│                                ▼              ▼              ▼          │
│                         ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│                         │  VOICE   │   │  MEMORY  │   │AUTOIMPROVE│     │
│                         │  SERVER  │   │  SYSTEM  │   │  101 LOOPS│     │
│                         └──────────┘   └──────────┘   └──────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 Usage

### Starting the System

```bash
# Start all components
fr3k-start

# Or start individually:
cd voice-server && bun server.ts          # Terminal 1
cd telegram-relay && bun run start         # Terminal 2
cd autoimprove-101-loops && bun autonomous/self-improvement-loop.ts  # Terminal 3
claude                                     # Terminal 4
```

### Using Claude Code

```bash
# Start a Claude Code session
claude

# Use skills
/agents create custom-agent
/evals run capability-test
/fabric extract wisdom

# Check system status
/status
/memories
/upgrade system
```

### Telegram Interface

Send commands to your Telegram bot:

- `/status` - System status overview
- `/ask <question>` - Ask Claude anything
- `/voice <message>` - Get voice response
- `/memory <key> <value>` - Store memory
- `/recall <key>` - Retrieve memory

---

## 🧠 Autoimprove 101 Loops

The heart of FR3K - a self-improving system that has completed 100+ iterations:

- **Entry Point**: `autoimprove-101-loops/autonomous/self-improvement-loop.ts`
- **Documentation**: `autoimprove-101-loops/100-LOOPS-COMPLETE.md`
- **Key Systems**:
  - Consciousness engineering
  - Hierarchical intelligence
  - Multi-agent orchestration
  - Quantum-level optimization
  - Dimensional transcendence

### Running the Loops

```bash
# Interactive
cd autoimprove-101-loops
bun autonomous/self-improvement-loop.ts

# As daemon
sudo systemctl start fr3k-daemon
sudo systemctl enable fr3k-daemon
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | This file |
| [REQUIREMENTS.md](setup/REQUIREMENTS.md) | System requirements |
| [100-LOOPS-COMPLETE.md](autoimprove-101-loops/autonomous/100-LOOPS-COMPLETE.md) | Loop documentation |
| [hooks/README.md](claude-hooks/README.md) | Hook system reference |
| [telegram-relay/README.md](telegram-relay/README.md) | Relay documentation |

---

## 🛠️ Configuration

### Environment Variables

```bash
# .env file structure
ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx          # Required
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...       # Required
TELEGRAM_USER_ID=123456789                 # Required
ELEVENLABS_API_KEY=xxxxx                   # Optional
GEMINI_API_KEY=xxxxx                       # Optional
```

### Claude Code Settings

Located at `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_key",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  },
  "skipDangerousModePermissionPrompt": true
}
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 8888 in use | `lsof -ti:8888 \| xargs kill -9` |
| Claude Code not found | `npm install -g @anthropic-ai/claude-code` |
| Bot not responding | Check `.env` token and user ID |
| Hooks permission denied | `chmod +x ~/.claude/hooks/*.ts` |

### Logs Location

- System logs: `~/.fr3k/logs/`
- Claude transcripts: `~/.claude/transcripts/`
- Autoimprove logs: `autoimprove-101-loops/logs/`

---

## 🔒 Security

- ✅ **No hardcoded secrets** - All credentials via environment variables
- ✅ **User validation** - Telegram user ID verification
- ✅ **Command filtering** - Security validator hooks
- ✅ **Prompt injection defense** - Built-in protection
- ✅ **Secure storage** - Sensitive files have 600 permissions

---

## 🤝 Contributing

This is a personal AI infrastructure system. Feel free to:
- Fork and customize for your needs
- Submit issues and bug reports
- Suggest improvements via pull requests

---

## 📜 License

Use responsibly and in accordance with API terms of service.

---

## 📊 Stats

| Metric | Value |
|--------|-------|
| Version | 2026.02.28 |
| Loops Completed | 101+ |
| Skills Included | 20+ |
| Hooks Active | 14 |
| TypeScript Files | 1200+ |
| Total Lines | 224K+ |

---

<div align="center">

### **[⭐ Star this repo](https://github.com/fr3kstyle/fr3k)** • **[🐛 Report Issues](https://github.com/fr3kstyle/fr3k/issues)** • **[📖 Documentation](https://github.com/fr3kstyle/fr3k/wiki)**

**Built with ❤️ by FR3K • 2026**

</div>
