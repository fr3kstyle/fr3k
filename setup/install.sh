#!/bin/bash
# ===========================================
# FR3K MULTI-CLI SYSTEM - INSTALLATION SCRIPT
# ===========================================
# Supports: Claude Code, OpenCode, Gemini CLI
# Installs: MCP servers, hooks, skills, all components

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║     FR3K MULTI-CLI SYSTEM - COMPLETE INSTALLATION                 ║"
echo "║   Claude Code • OpenCode • Gemini CLI • MCP Servers               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${SCRIPT_DIR}/.."

# Check if .env exists
if [ ! -f "${INSTALL_DIR}/.env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Please copy .env.example to .env and fill in your API keys:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Source .env
echo -e "${GREEN}[1/13]${NC} Loading environment configuration..."
source "${INSTALL_DIR}/.env"

# Check required environment variables
echo -e "${GREEN}[2/13]${NC} Validating required configuration..."
if [ -z "$ANTHROPIC_AUTH_TOKEN" ] || [ "$ANTHROPIC_AUTH_TOKEN" = "your_anthropic_api_key_here" ]; then
    echo -e "${RED}ERROR: ANTHROPIC_AUTH_TOKEN not set in .env${NC}"
    exit 1
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ "$TELEGRAM_BOT_TOKEN" = "your_bot_token_from_botfather" ]; then
    echo -e "${YELLOW}WARNING: TELEGRAM_BOT_TOKEN not set${NC}"
    echo "Telegram features will not work without it"
fi

# Ask which CLIs to install
echo ""
echo -e "${CYAN}Which AI coding CLIs would you like to install?${NC}"
echo "  1) Claude Code (official Anthropic, paid)"
echo "  2) OpenCode (open-source, 75+ models, free tier available)"
echo "  3) Gemini CLI (Google, 100M context, 1000/day free)"
echo "  4) All three"
echo ""
read -p "Enter choice [1-4] (default: 2): " cli_choice
cli_choice=${cli_choice:-2}

INSTALL_CLAUDE=false
INSTALL_OPENCODE=false
INSTALL_GEMINI=false

case $cli_choice in
    1) INSTALL_CLAUDE=true ;;
    2) INSTALL_OPENCODE=true ;;
    3) INSTALL_GEMINI=true ;;
    4) INSTALL_CLAUDE=true; INSTALL_OPENCODE=true; INSTALL_GEMINI=true ;;
    *) echo "Invalid choice, installing OpenCode only"; INSTALL_OPENCODE=true ;;
esac

# Check dependencies
echo -e "${GREEN}[3/13]${NC} Checking system dependencies..."

# Check for bun
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}  Installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi
echo -e "  ${GREEN}✓${NC} Bun: $(bun --version)"

# Check for npm/node
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}  Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "  ${GREEN}✓${NC} Node.js: $(node --version)"
echo -e "  ${GREEN}✓${NC} npm: $(npm --version)"

# Install selected CLIs
echo -e "${GREEN}[4/13]${NC} Installing AI coding CLIs..."

if [ "$INSTALL_CLAUDE" = true ]; then
    if ! command -v claude &> /dev/null; then
        echo -e "${YELLOW}  Installing Claude Code CLI...${NC}"
        npm install -g @anthropic-ai/claude-code
    fi
    echo -e "  ${GREEN}✓${NC} Claude Code: $(claude --version 2>/dev/null || echo 'installed')"
fi

if [ "$INSTALL_OPENCODE" = true ]; then
    if ! command -v opencode &> /dev/null; then
        echo -e "${YELLOW}  Installing OpenCode CLI...${NC}"
        npm install -g opencode-ai 2>/dev/null || curl -fsSL https://opencode.ai/install | bash
    fi
    echo -e "  ${GREEN}✓${NC} OpenCode: $(opencode --version 2>/dev/null || echo 'installed')"

    # Install oh-my-opencode for Claude Code compatibility
    if command -v bun &> /dev/null; then
        echo -e "${YELLOW}  Installing oh-my-opencode (Claude compatibility layer)...${NC}"
        bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} oh-my-opencode installed"
    fi
fi

if [ "$INSTALL_GEMINI" = true ]; then
    if ! command -v gemini &> /dev/null; then
        echo -e "${YELLOW}  Installing Gemini CLI...${NC}"
        npm install -g @google/gemini-cli
    fi
    echo -e "  ${GREEN}✓${NC} Gemini CLI: installed"
fi

# Install MCP Servers (CRITICAL - works with all CLIs)
echo -e "${GREEN}[5/13]${NC} Installing MCP Servers (universal backend)..."

echo "  Testing MCP servers via npx..."
if npx -y md-mcp --version &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} md-mcp: Available via npx"
else
    echo -e "  ${YELLOW}⚠${NC}  md-mcp: Will be installed on first use"
fi

if npx -y fr3k-think --version &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} fr3k-think: Available via npx"
else
    echo -e "  ${YELLOW}⚠${NC}  fr3k-think: Will be installed on first use"
fi

if npx -y unified-pantheon-mcp --version &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} unified-pantheon-mcp: Available via npx"
else
    echo -e "  ${YELLOW}⚠${NC}  unified-pantheon-mcp: Will be installed on first use"
fi

if npx -y hey-fr3k --version &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} hey-fr3k: Available via npx"
else
    echo -e "  ${YELLOW}⚠${NC}  hey-fr3k: Will be installed on first use"
fi

# Install dependencies for each component
echo -e "${GREEN}[6/13]${NC} Installing component dependencies..."

cd "${INSTALL_DIR}/telegram-relay" 2>/dev/null && bun install 2>/dev/null && echo -e "  ${GREEN}✓${NC} telegram-relay"
cd "${INSTALL_DIR}/fr3k-telegram-bot" 2>/dev/null && bun install 2>/dev/null && echo -e "  ${GREEN}✓${NC} fr3k-telegram-bot"
cd "${INSTALL_DIR}/voice-server" 2>/dev/null && bun install 2>/dev/null && echo -e "  ${GREEN}✓${NC} voice-server"
cd "${INSTALL_DIR}/autoimprove-101-loops" 2>/dev/null && bun install 2>/dev/null && echo -e "  ${GREEN}✓${NC} autoimprove-101-loops"
cd "${INSTALL_DIR}/claude-hooks" 2>/dev/null && bun install 2>/dev/null && echo -e "  ${GREEN}✓${NC} claude-hooks"

# Setup Claude Code configuration
echo -e "${GREEN}[7/13]${NC} Configuring Claude Code..."

CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR/skills"
mkdir -p "$CLAUDE_DIR/hooks"
mkdir -p "$CLAUDE_DIR/projects"

# Copy skills
echo "  Copying skills..."
cp -r "${INSTALL_DIR}/claude-skills/"* "$CLAUDE_DIR/skills/" 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Skills copied to $CLAUDE_DIR/skills/"

# Copy hooks
echo "  Copying hooks..."
cp -r "${INSTALL_DIR}/claude-hooks/hooks/"* "$CLAUDE_DIR/hooks/" 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Hooks copied to $CLAUDE_DIR/hooks/"

# Create settings.json with MCP servers (Claude Code format)
if [ "$INSTALL_CLAUDE" = true ]; then
    echo "  Creating Claude Code settings with MCP server configuration..."
    cat > "$CLAUDE_DIR/settings.json" << EOF
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "${ANTHROPIC_AUTH_TOKEN}",
    "ANTHROPIC_BASE_URL": "${ANTHROPIC_BASE_URL:-https://api.anthropic.com}",
    "API_TIMEOUT_MS": "${API_TIMEOUT_MS:-3000000}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "${CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:-1}"
  },
  "mcpServers": {
    "md-mcp": {
      "command": "npx",
      "args": ["-y", "md-mcp"],
      "type": "command"
    },
    "fr3k-think": {
      "command": "npx",
      "args": ["-y", "fr3k-think"],
      "type": "command"
    },
    "unified-pantheon-mcp": {
      "command": "npx",
      "args": ["-y", "unified-pantheon-mcp"],
      "type": "command"
    },
    "hey-fr3k": {
      "command": "npx",
      "args": ["-y", "hey-fr3k"],
      "type": "command"
    }
  },
  "skipDangerousModePermissionPrompt": ${SKIP_DANGEROUS_MODE_PROMPT:-true}
}
EOF
    echo -e "  ${GREEN}✓${NC} Claude Code configured"
fi

# Setup OpenCode configuration
if [ "$INSTALL_OPENCODE" = true ]; then
    echo -e "${GREEN}[8/13]${NC} Configuring OpenCode..."

    OPENCODE_DIR="$HOME/.config/opencode"
    mkdir -p "$OPENCODE_DIR"

    # OpenCode reads ~/.claude/settings.json automatically when oh-my-opencode is installed
    echo -e "  ${GREEN}✓${NC} OpenCode will use Claude Code config (hooks, skills, MCP)"
fi

# Setup Gemini CLI configuration
if [ "$INSTALL_GEMINI" = true ]; then
    echo -e "${GREEN}[9/13]${NC} Configuring Gemini CLI..."

    GEMINI_DIR="$HOME/.gemini"
    mkdir -p "$GEMINI_DIR"

    # Gemini uses different config format
    cat > "$GEMINI_DIR/settings.json" << EOF
{
  "mcpServers": {
    "md-mcp": {
      "command": "npx",
      "args": ["-y", "md-mcp"]
    },
    "fr3k-think": {
      "command": "npx",
      "args": ["-y", "fr3k-think"]
    },
    "unified-pantheon-mcp": {
      "command": "npx",
      "args": ["-y", "unified-pantheon-mcp"]
    },
    "hey-fr3k": {
      "command": "npx",
      "args": ["-y", "hey-fr3k"]
    }
  }
}
EOF
    echo -e "  ${GREEN}✓${NC} Gemini CLI configured with MCP servers"
fi

# Create CLAUDE.md if not exists
if [ ! -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    cp "${INSTALL_DIR}/docs/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null || true
fi

# Setup FR3K data directory
echo -e "${GREEN}[10/13]${NC} Setting up FR3K data directory..."

FR3K_DIR="${FR3K_DATA_DIR:-$HOME/.fr3k}"
mkdir -p "$FR3K_DIR/logs"
mkdir -p "$FR3K_DIR/memory"
mkdir -p "$FR3K_DIR/state"
mkdir -p "$FR3K_DIR/sessions"
echo -e "  ${GREEN}✓${NC} Data directory: $FR3K_DIR"

# Setup hey-fr3k database
echo "  Initializing hey-fr3k database..."
mkdir -p "$HOME/.hey-fr3k"
echo -e "  ${GREEN}✓${NC} hey-fr3k directory: $HOME/.hey-fr3k"

# Setup systemd service (optional)
echo -e "${GREEN}[11/13]${NC} Setting up systemd service..."

if command -v systemctl &> /dev/null; then
    sed "s|YOUR_USERNAME|$USER|g" "${INSTALL_DIR}/setup/fr3k-daemon.service" | \
    sed "s|INSTALL_DIR|$INSTALL_DIR|g" \
    > /tmp/fr3k-daemon.service

    echo "  systemd service file created: /tmp/fr3k-daemon.service"
    echo "  To install: sudo cp /tmp/fr3k-daemon.service /etc/systemd/system/"
fi

# Create convenience scripts
echo -e "${GREEN}[12/13]${NC} Creating convenience scripts..."

BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# Determine default CLI
DEFAULT_CLI="claude"
if [ "$INSTALL_OPENCODE" = true ]; then
    DEFAULT_CLI="opencode"
elif [ "$INSTALL_GEMINI" = true ]; then
    DEFAULT_CLI="gemini"
fi

# Start script
cat > "$BIN_DIR/fr3k-start" << EOFR3KSTART
#!/bin/bash
# Start FR3K system components

echo "Starting FR3K Unified System..."
echo ""

# Start Voice Server
echo "▶ Starting Voice Server..."
cd "\$(dirname "\$0")/../fr3k-export/voice-server" 2>/dev/null || cd ~/fr3k-export/voice-server
bun server.ts &
VOICE_PID=\$!
echo "  Voice Server PID: \$VOICE_PID"

# Start Telegram Relay
echo "▶ Starting Telegram Relay..."
cd "\$(dirname "\$0")/../fr3k-export/telegram-relay" 2>/dev/null || cd ~/fr3k-export/telegram-relay
bun run start &
RELAY_PID=\$!
echo "  Relay PID: \$RELAY_PID"

# Start Autoimprove Loops
echo "▶ Starting Autoimprove Loops..."
cd "\$(dirname "\$0")/../fr3k-export/autoimprove-101-loops" 2>/dev/null || cd ~/fr3k-export/autoimprove-101-loops
bun autonomous/self-improvement-loop.ts &
LOOP_PID=\$!
echo "  Loops PID: \$LOOP_PID"

echo ""
echo "✓ FR3K Unified System Started!"
echo ""
echo "Components running:"
echo "  • Voice Server (port 8888)"
echo "  • Telegram Relay"
echo "  • Autoimprove 101 Loops"
echo ""
echo "To use your AI CLI with FR3K:"
echo "  $DEFAULT_CLI"
echo ""
echo "Available CLIs:"
EOF

if [ "$INSTALL_CLAUDE" = true ]; then
    echo "  • claude (Claude Code)" >> "$BIN_DIR/fr3k-start"
fi
if [ "$INSTALL_OPENCODE" = true ]; then
    echo "  • opencode (OpenCode)" >> "$BIN_DIR/fr3k-start"
fi
if [ "$INSTALL_GEMINI" = true ]; then
    echo "  • gemini (Gemini CLI)" >> "$BIN_DIR/fr3k-start"
fi

cat >> "$BIN_DIR/fr3k-start" << 'EOFR3KSTART2'

echo ""
echo "To stop: fr3k-stop"

# Save PIDs
echo "$VOICE_PID $RELAY_PID $LOOP_PID" > /tmp/fr3k-pids

trap "kill $VOICE_PID $RELAY_PID $LOOP_PID 2>/dev/null; rm /tmp/fr3k-pids" EXIT
wait
EOFR3KSTART2

chmod +x "$BIN_DIR/fr3k-start"

# Stop script
cat > "$BIN_DIR/fr3k-stop" << 'EOFR3KSTOP'
#!/bin/bash
# Stop FR3K system components

if [ -f /tmp/fr3k-pids ]; then
    read -r VOICE_PID RELAY_PID LOOP_PID < /tmp/fr3k-pids
    kill $VOICE_PID $RELAY_PID $LOOP_PID 2>/dev/null
    rm /tmp/fr3k-pids
    echo "✓ FR3K System Stopped"
else
    echo "No running FR3K processes found"
fi
EOFR3KSTOP

chmod +x "$BIN_DIR/fr3k-stop"

# Status script
cat > "$BIN_DIR/fr3k-status" << EOFR3KSTATUS
#!/bin/bash
# Check FR3K system status

echo "FR3K Multi-CLI System Status:"
echo ""

if pgrep -f "server.ts" > /dev/null; then
    echo "  Voice Server: ${GREEN}RUNNING${NC}"
else
    echo "  Voice Server: ${RED}STOPPED${NC}"
fi

if pgrep -f "telegram-relay" > /dev/null; then
    echo "  Telegram Relay: ${GREEN}RUNNING${NC}"
else
    echo "  Telegram Relay: ${RED}STOPPED${NC}"
fi

if pgrep -f "self-improvement-loop" > /dev/null; then
    echo "  Autoimprove Loops: ${GREEN}RUNNING${NC}"
else
    echo "  Autoimprove Loops: ${RED}STOPPED${NC}"
fi

echo ""
echo "Installed CLIs:"
EOFR3KSTATUS

if [ "$INSTALL_CLAUDE" = true ]; then
    echo '  Claude Code: $(command -v claude > /dev/null && echo "${GREEN}installed${NC}" || echo "${RED}not found${NC}")' >> "$BIN_DIR/fr3k-status"
fi
if [ "$INSTALL_OPENCODE" = true ]; then
    echo '  OpenCode: $(command -v opencode > /dev/null && echo "${GREEN}installed${NC}" || echo "${RED}not found${NC}")' >> "$BIN_DIR/fr3k-status"
fi
if [ "$INSTALL_GEMINI" = true ]; then
    echo '  Gemini CLI: $(command -v gemini > /dev/null && echo "${GREEN}installed${NC}" || echo "${RED}not found${NC}")' >> "$BIN_DIR/fr3k-status"
fi

cat >> "$BIN_DIR/fr3k-status" << 'EOFR3KSTATUS2'

echo ""
echo "MCP Servers (npx):"
npx -y md-mcp --version &> /dev/null && echo "  md-mcp: ${GREEN}AVAILABLE${NC}" || echo "  md-mcp: ${YELLOW}WILL INSTALL ON USE${NC}"
npx -y fr3k-think --version &> /dev/null && echo "  fr3k-think: ${GREEN}AVAILABLE${NC}" || echo "  fr3k-think: ${YELLOW}WILL INSTALL ON USE${NC}"
npx -y unified-pantheon-mcp --version &> /dev/null && echo "  unified-pantheon-mcp: ${GREEN}AVAILABLE${NC}" || echo "  unified-pantheon-mcp: ${YELLOW}WILL INSTALL ON USE${NC}"
npx -y hey-fr3k --version &> /dev/null && echo "  hey-fr3k: ${GREEN}AVAILABLE${NC}" || echo "  hey-fr3k: ${YELLOW}WILL INSTALL ON USE${NC}"
EOFR3KSTATUS2

chmod +x "$BIN_DIR/fr3k-status"

echo -e "  ${GREEN}✓${NC} Convenience scripts created"

# Ask about systemd services
echo ""
echo -e "${GREEN}[14/14]${NC} Systemd Services (Optional)"
echo ""
echo "Would you like to install FR3K services to start on boot?"
echo "This will allow:"
echo "  • Voice Server (TTS notifications) - auto-start on boot"
echo "  • Telegram Relay - always available"
echo "  • Self-Improvement Daemon - continuous 101 loops"
echo ""
echo "Requires sudo access."
echo ""
read -p "Install systemd services? [y/N]: " install_services
install_services=${install_services:-n}

if [[ "$install_services" =~ ^[Yy]$ ]]; then
    if "${SCRIPT_DIR}/install-services.sh"; then
        echo -e "  ${GREEN}✓${NC} Services installed"
    else
        echo -e "  ${YELLOW}⚠${NC} Service installation failed (optional)"
    fi
else
    echo "  Skipped (you can run later: cd setup && ./install-services.sh)"
fi

# Done!
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║          MULTI-CLI INSTALLATION COMPLETE!                         ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Installed CLIs:${NC}"
EOFINSTALLED_CLAUDE=""
EOFINSTALLED_OPENCODE=""
EOFINSTALLED_GEMINI=""

if [ "$INSTALL_CLAUDE" = true ]; then
    echo "  ✓ Claude Code (official Anthropic CLI)"
    EOFINSTALLED_CLAUUDE="  • claude - Start Claude Code\\n"
fi
if [ "$INSTALL_OPENCODE" = true ]; then
    echo "  ✓ OpenCode (open-source, 75+ models)"
    echo "    ✓ oh-my-opencode (Claude compatibility layer)"
    EOFINSTALLED_OPENCODE="  • opencode - Start OpenCode\\n"
fi
if [ "$INSTALL_GEMINI" = true ]; then
    echo "  ✓ Gemini CLI (Google, 100M context)"
    EOFINSTALLED_GEMINI="  • gemini - Start Gemini CLI\\n"
fi

echo ""
echo -e "${BLUE}Universal Backend:${NC}"
echo "  ✓ 4 MCP Servers configured"
echo "    • md-mcp - Dynamic tool creation"
echo "    • fr3k-think - Structured thinking"
echo "    • unified-pantheon-mcp - Meta-cognitive system"
echo "    • hey-fr3k - Persistent memory"
echo "  ✓ Claude Hooks installed"
echo "  ✓ Claude Skills installed"
echo ""
echo -e "${BLUE}System Components:${NC}"
echo "  ✓ Voice Server ready"
echo "  ✓ Telegram Relay ready"
echo "  ✓ Autoimprove 101 Loops ready"
echo ""
echo -e "${BLUE}To start the system:${NC}"
echo "  fr3k-start"
echo ""
echo -e "${BLUE}To use your AI CLI:${NC}"
echo -e "${EOFINSTALLED_CLAUUDE}${EOFINSTALLED_OPENCODE}${EOFINSTALLED_GEMINI}"
echo "  Then ask: List all available MCP tools"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  MCP Installation: setup/MCP-INSTALLATION.md"
echo "  Integration Guide: docs/INTEGRATION-GUIDE.md"
echo "  Multi-CLI Support: docs/MULTI-CLI-SUPPORT.md"
echo "  Requirements: setup/REQUIREMENTS.md"
echo ""

# ============================================
# FIRST RUN SETUP WIZARD
# ============================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                 ║"
echo "║     🎯 PERSONALIZED SETUP - FIRST RUN WIZARD                    ║"
echo "║                                                                 ║"
echo "║     We'll now configure FR3K specifically for YOU               ║"
echo "║     • Understand your goals and preferences                     ║"
echo "║     • Test autonomous features with 7-phase algorithm            ║"
echo "║     • Setup notifications (voice, Telegram)                      ║"
echo "║     • Configure background services                              ║"
echo "║     • Create your personalized AI prompt                         ║"
echo "║                                                                 ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

read -p "Launch personalized setup wizard now? [Y/n]: " run_wizard
run_wizard=${run_wizard:-Y}

if [[ "$run_wizard" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Launching First Run Setup Wizard..."
    echo ""
    exec "${SCRIPT_DIR}/first-run-setup.sh"
else
    echo ""
    echo -e "${YELLOW}Skipped first-run setup${NC}"
    echo "You can run it later with: ./setup/first-run-setup.sh"
    echo ""
fi
