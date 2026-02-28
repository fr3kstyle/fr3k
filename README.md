<div align="center">

# 🤖 FR3K AUTONOMOUS AI SYSTEM

### **World's First Autonomous Multi-CLI Infrastructure with Self-Improvement**

![Version](https://img.shields.io/badge/version-2026.02.28-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-autonomous-success?style=for-the-badge)
![CLIs](https://img.shields.io/badge/CLIs-3-purple?style=for-the-badge)
![MCP](https://img.shields.io/badge/MCP-4_integrated-orange?style=for-the-badge)
![Loops](https://img.shields.io/badge/loops-101_autonomous-green?style=for-the-badge)

**Fully autonomous AI system that continuously improves itself via 101 self-improvement loops**

</div>

---

## 🌟 What is FR3K?

**FR3K** is the world's first autonomous multi-CLI AI infrastructure. Unlike traditional AI assistants that wait for commands, FR3K:

- 🔄 **Continuously improves itself** via 101 autonomous self-improvement loops
- 🧠 **Learns from every interaction** and stores insights in semantic memory
- 🔧 **Creates its own tools** dynamically based on your needs
- 📱 **Adapts to your preferences** through interactive setup wizard
- 🎯 **Optimizes for your goals** whether you want speed, quality, learning, or automation

---

## ⚡ Key Features

| Feature | Description |
|---------|-------------|
| **101 Self-Improvement Loops** | Continuous autonomous optimization of the system |
| **7-Phase Algorithm** | Structured problem-solving with full MCP integration |
| **4 MCP Servers** | Universal backend for tool creation, thinking, memory, and meta-cognition |
| **Multi-CLI Support** | Works with Claude Code, OpenCode, and Gemini CLI |
| **Real-Time Notifications** | Voice (TTS) and Telegram updates during autonomous operations |
| **Semantic Memory** | hey-fr3k provides persistent context across sessions |
| **Dynamic Tool Creation** | md-mcp creates custom tools on-the-fly |
| **Personalized Setup** | Interactive wizard configures EVERYTHING to your preferences |

---

## 🚀 Quick Start

### One-Line Installation (Recommended)

The interactive setup wizard will **automatically configure everything** for you:

```bash
curl -fsSL https://raw.githubusercontent.com/fr3kstyle/fr3k/master/setup/install.sh | bash
```

**The setup wizard will:**
- 🎯 Understand your goals and customize the system for your use case
- 🔧 Configure autonomy level (1-5) based on your experience
- 📱 Setup voice & Telegram notifications with your preferred style
- 🗣️ Configure communication (concise, friendly, detailed, or educational)
- 🎨 Set preferences for profanity filter, humor level, emoji usage
- 💾 Create personalized workspace configuration
- 🧪 Test autonomous features with the 7-phase algorithm
- 📊 Run first self-improvement analysis with personalized recommendations
- 🚀 Offer to install background autonomous services (boot-time startup)
- 📝 Generate your personalized AI agent quick-start prompt

**Takes 5-10 minutes to complete.**

### Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/fr3kstyle/fr3k.git
cd fr3k

# 2. Run installation
./setup/install.sh

# 3. Run the personalized setup wizard (highly recommended)
./setup/first-run-setup.sh

# Or skip wizard and manually configure
cp .env.example .env
nano .env  # Add your API keys
```

---

## 🎯 After Installation

### Start Your AI CLI

```bash
# Choose the CLI you installed:
claude      # Claude Code (official, paid)
opencode    # OpenCode (open-source, free tier)
gemini      # Gemini CLI (Google, 100M context)
```

### Verify Everything Works

```bash
# Run comprehensive verification
./setup/verify-system.sh

# Run integration tests
./setup/tests/integration-test-complete.sh
```

### Try the 7-Phase Algorithm

```bash
# In your AI CLI, run:
"Run the 7-phase algorithm on: Create a simple REST API server"
```

You'll see FR3K:
1. **OBSERVE** - Retrieve context about APIs via hey-fr3k
2. **THINK** - Analyze requirements via fr3k-think
3. **PLAN** - Design architecture and store decisions
4. **BUILD** - Create the server (using md-mcp if needed)
5. **EXECUTE** - Implement the solution
6. **VERIFY** - Test and validate
7. **LEARN** - Store learnings and trigger self-improvement

---

## 🧩 MCP Servers (The Brain)

FR3K uses 4 MCP servers that work with **all three CLIs**:

| Server | Purpose | Key Capabilities |
|--------|---------|------------------|
| **hey-fr3k** | Semantic Memory | `store_fr3k`, `recall_fr3k`, `add_task` - Persistent context across sessions |
| **fr3k-think** | Structured Analysis | `think`, `reset_thinking` - Advanced reasoning with investigation mode |
| **md-mcp** | Tool Creation | `forge_reality` - Dynamically create custom tools from markdown |
| **unified-pantheon-mcp** | Meta-Cognition | `self_evolve`, `analyze_with_demon_angel`, `detect_emergence` - Self-improvement |

### MCP Integration in 7-Phase Algorithm

```
┌─────────────────────────────────────────────────────────────────────┐
│                    7-PHASE ALGORITHM FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OBSERVE → hey-fr3k.recall_fr3k()      # Retrieve relevant context  │
│  THINK   → fr3k-think.think()           # Deep analysis            │
│  PLAN    → hey-fr3k.store_fr3k()        # Store decisions          │
│  BUILD   → md-mcp.forge_reality()       # Create tools if needed   │
│  EXECUTE → hey-fr3k.store_fr3k()        # Track progress           │
│  VERIFY  → pantheon.detect_emergence()  # Check for improvements  │
│  LEARN   → pantheon.self_evolve()       # Improve the system      │
│             + hey-fr3k.store_fr3k()      # Store learnings         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 101 Self-Improvement Loops

FR3K continuously improves itself through 101 autonomous loops:

### Loop Categories

- **Adaptive Learning** - Learn optimal thresholds from history
- **Performance Optimization** - Detect and fix bottlenecks
- **Code Quality** - Refactor and improve code patterns
- **Security Hardening** - Identify and fix vulnerabilities
- **Capability Evolution** - Generate new capabilities automatically
- **Resource Management** - Optimize memory and CPU usage
- **Error Recovery** - Self-heal when errors occur

### Integration with 7-Phase

- **OBSERVE phase** retrieves improvements made by loops
- **LEARN phase** triggers new improvement loops
- **Results** stored in hey-fr3k for persistent learning

---

## 📱 Notifications & Feedback

### Voice Notifications (TTS)

- Phase completion announcements
- MCP operation alerts
- Real-time feedback on long tasks

### Telegram Integration

- Remote command execution
- Phase transition updates
- Status queries and monitoring

### Configuration

All notification settings are configurable via the setup wizard:
- Enable/disable per channel
- Adjust frequency (all events, phases only, errors only)
- Customize style and content

---

## 🎛️ Configuration

### User Preferences (.env.user)

After running the setup wizard, your `.env.user` file contains:

```bash
# Autonomy (1-5)
FR3K_AUTONOMY_LEVEL=3

# Notifications
FR3K_VOICE_NOTIFICATIONS=true
FR3K_TELEGRAM_NOTIFICATIONS=true
FR3K_NOTIFICATION_FREQUENCY=phases_only

# Communication Style
FR3K_COMM_STYLE=balanced
FR3K_HUMOR_LEVEL=2
FR3K_EMOJI_LEVEL=3

# Performance
FR3K_MAX_PARALLEL_TASKS=5
FR3K_CACHE_ENABLED=true

# Self-Improvement
FR3K_LOOPS_ENABLED=true
FR3K_LOOP_INTERVAL=3600
```

### Reconfigure Anytime

```bash
./setup/configure-user-preferences.sh
```

---

## 🔧 Services (Boot-Time Autonomy)

Enable autonomous services to start on boot:

```bash
./setup/install-services.sh
```

This installs:
- **fr3k-voice-server** - TTS notifications (port 8888)
- **fr3k-telegram-relay** - Telegram bot integration
- **fr3k-daemon** - 101 self-improvement loops

### Service Management

```bash
# Check status
fr3k-status

# Start all services
fr3k-start

# Stop all services
fr3k-stop

# View logs
fr3k-logs
```

---

## 🧪 Testing & Verification

### System Verification

```bash
./setup/verify-system.sh
```

Tests:
- ✅ All prerequisites (Node.js, npm, bun, systemd)
- ✅ All 4 MCP servers responding
- ✅ Claude Code configuration
- ✅ Hooks installed and functional
- ✅ Skills accessible
- ✅ 101 loops integrated
- ✅ Voice server operational
- ✅ Memory system working

### Integration Tests

```bash
./setup/tests/integration-test-complete.sh
```

22 comprehensive tests covering:
- MCP server verification
- Hook loading tests
- Skills accessibility
- End-to-end workflow (store/retrieve/create)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **README.md** | This file - overview and quick start |
| **MCP-integration.md** | Exact MCP tool invocations for each phase |
| **LearnPhaseEnhanced.md** | 101 loops integration guide |
| **setup/services/README.md** | Service management guide |
| **ENHANCEMENT-SUMMARY.md** | Complete implementation details |

---

## 🤖 For AI Agents

### Quick-Start Prompt

Copy this to any AI agent to immediately utilize the full FR3K system:

---

**FR3K System Activation Prompt:**

You are operating within the FR3K Unified Autonomous AI System with:

**Available Capabilities:**
- **4 MCP Servers:** md-mcp (tool creation), fr3k-think (structured analysis), unified-pantheon-mcp (self-improvement), hey-fr3k (semantic memory)
- **101 Self-Improvement Loops:** Continuous autonomous optimization
- **7-Phase Algorithm:** OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
- **Multi-Modal Notifications:** Voice + Telegram real-time updates
- **20+ Skills:** Agents, Evals, Fabric (240+ patterns), Browser automation, BMAD framework

**How to Use:**
1. **Context:** `Recall context about [topic]` (uses hey-fr3k)
2. **Analysis:** `Think through [problem] step by step` (uses fr3k-think)
3. **Self-Improve:** `How can I improve my workflow?` (uses pantheon-mcp)
4. **Create Tools:** `Create a tool called [name] that does [X]` (uses md-mcp)
5. **Store Memory:** `Remember this pattern: [pattern]` (persists to hey-fr3k)

**7-Phase Algorithm Usage:**
Say: `Run the 7-phase algorithm on: [task]`

Each phase will use MCP servers automatically and trigger self-improvement in LEARN phase.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FR3K AUTONOMOUS ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Claude Code  │    │  OpenCode    │    │ Gemini CLI   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └───────────────────┼───────────────────┘                          │
│                             ▼                                              │
│                    ┌──────────────┐                                       │
│                    │ MCP SERVERS  │◄──── Universal Backend                │
│                    │  ─────────── │                                        │
│                    │ • md-mcp     │                                       │
│                    │ • fr3k-think │                                       │
│                    │ • pantheon   │                                       │
│                    │ • hey-fr3k   │                                       │
│                    └──────┬───────┘                                       │
│                           │                                                │
│                    ┌──────┴────────┐                                     │
│                    │ 7-PHASE      │                                     │
│                    │ ALGORITHM    │                                     │
│                    └──────┬────────┘                                     │
│                           │                                                │
│         ┌─────────────────┼─────────────────┐                        │
│         ▼                 ▼                 ▼                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  101 LOOPS  │  │ NOTIFICATIONS│  │MEMORY SYSTEM│                │
│  └─────────────┘  │ (Voice+TG)   │  │  (hey-fr3k) │                │
│                  └─────────────┘  └─────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Use Cases

### Software Development
- Context-aware code generation
- Architecture decision documentation
- Automated refactoring suggestions
- Bug detection and fixing

### Data Analysis
- Persistent analysis patterns
- Reusable data transformations
- Automated insight generation
- Dataset memory for recurring work

### Content Creation
- Style consistency tracking
- Template generation via md-mcp
- Quality improvement loops
- Audience-specific adaptation

### Business Automation
- Workflow optimization
- Integration automation
- Process documentation
- Efficiency monitoring

### Learning & Education
- Knowledge base building
- Concept linking across sessions
- Personalized learning paths
- Adaptive explanations

---

## 🛠️ Advanced Configuration

### Autonomy Levels

| Level | Behavior |
|-------|----------|
| **1** | Manual - Explicit approval for everything |
| **2** | Cautious - Minor changes OK, major require approval |
| **3** | Balanced - Moderate changes OK, major require approval |
| **4** | Aggressive - Most changes autonomous, critical require approval |
| **5** | Full Auto - Complete autonomy, just notifies you |

### Communication Styles

- **Concise** - Just the facts, minimal fluff
- **Balanced** - Clear explanations, not too verbose
- **Detailed** - Thorough explanations with context
- **Educational** - Teaches while helping

### Notification Channels

Configure independently:
- **Voice** (TTS) - Spoken announcements
- **Telegram** - Mobile updates
- **Desktop** - System notifications

---

## 🔍 Troubleshooting

### MCP Servers Not Working

```bash
# Test individually
npx -y md-mcp --version
npx -y fr3k-think --version
npx -y unified-pantheon-mcp --version
npx -y hey-fr3k --version

# Clear npx cache if needed
rm -rf ~/.npm/_npx
```

### Services Not Starting

```bash
# Check service status
sudo systemctl status fr3k-voice-server
sudo systemctl status fr3k-telegram-relay
sudo systemctl status fr3k-daemon

# View logs
sudo journalctl -u fr3k-voice-server -f
```

### Verification Fails

```bash
# Run diagnostics
./setup/verify-system.sh

# Fix common issues
sudo apt-get install nodejs npm bun  # Missing dependencies
```

---

## 🤝 Contributing

FR3K is designed to be extended and improved. The 101 self-improvement loops will automatically suggest enhancements based on your usage patterns.

To contribute manually:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built as part of the FR3K autonomous AI infrastructure project.

---

**Status:** Production Ready ✅
**Version:** 2026.02.28
**Repository:** https://github.com/fr3kstyle/fr3k
