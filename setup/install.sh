#!/bin/bash
# ===========================================
# FR3K SYSTEM INSTALLATION SCRIPT
# ===========================================
# This script installs all FR3K components

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     FR3K COMPLETE SYSTEM - INSTALLATION SCRIPT           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
echo -e "${GREEN}[1/8]${NC} Loading environment configuration..."
source "${INSTALL_DIR}/.env"

# Check required environment variables
echo -e "${GREEN}[2/8]${NC} Validating required configuration..."
if [ -z "$ANTHROPIC_AUTH_TOKEN" ] || [ "$ANTHROPIC_AUTH_TOKEN" = "your_anthropic_api_key_here" ]; then
    echo -e "${RED}ERROR: ANTHROPIC_AUTH_TOKEN not set in .env${NC}"
    exit 1
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ "$TELEGRAM_BOT_TOKEN" = "your_bot_token_from_botfather" ]; then
    echo -e "${YELLOW}WARNING: TELEGRAM_BOT_TOKEN not set${NC}"
    echo "Telegram features will not work without it"
fi

# Check dependencies
echo -e "${GREEN}[3/8]${NC} Checking system dependencies..."

# Check for bun
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Check for npm/node
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check for claude-code
if ! command -v claude &> /dev/null; then
    echo -e "${YELLOW}Installing Claude Code CLI...${NC}"
    npm install -g @anthropic-ai/claude-code
fi

# Install dependencies for each component
echo -e "${GREEN}[4/8]${NC} Installing component dependencies..."

cd "${INSTALL_DIR}/telegram-relay" && bun install 2>/dev/null || echo "telegram-relay: No package.json"
cd "${INSTALL_DIR}/fr3k-telegram-bot" && bun install 2>/dev/null || echo "fr3k-telegram-bot: No package.json"
cd "${INSTALL_DIR}/pai-telegram-bot" && bun install 2>/dev/null || echo "pai-telegram-bot: No package.json"
cd "${INSTALL_DIR}/voice-server" && bun install 2>/dev/null || echo "voice-server: No package.json"
cd "${INSTALL_DIR}/autoimprove-101-loops" && bun install 2>/dev/null || echo "autoimprove-101-loops: No package.json"
cd "${INSTALL_DIR}/claude-hooks" && bun install 2>/dev/null || echo "claude-hooks: No package.json"

# Setup Claude Code configuration
echo -e "${GREEN}[5/8]${NC} Configuring Claude Code..."

CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR/skills"
mkdir -p "$CLAUDE_DIR/hooks"
mkdir -p "$CLAUDE_DIR/projects"

# Copy skills
echo "  Copying skills..."
cp -r "${INSTALL_DIR}/claude-skills/"* "$CLAUDE_DIR/skills/" 2>/dev/null || true

# Copy hooks
echo "  Copying hooks..."
cp -r "${INSTALL_DIR}/claude-hooks/hooks/"* "$CLAUDE_DIR/hooks/" 2>/dev/null || true

# Create settings.json
echo "  Creating Claude Code settings..."
cat > "$CLAUDE_DIR/settings.json" << EOF
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "${ANTHROPIC_AUTH_TOKEN}",
    "ANTHROPIC_BASE_URL": "${ANTHROPIC_BASE_URL:-https://api.anthropic.com}",
    "API_TIMEOUT_MS": "${API_TIMEOUT_MS:-3000000}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "${CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:-1}"
  },
  "skipDangerousModePermissionPrompt": ${SKIP_DANGEROUS_MODE_PROMPT:-true}
}
EOF

# Create CLAUDE.md if not exists
if [ ! -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    cp "${INSTALL_DIR}/docs/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null || true
fi

# Setup FR3K data directory
echo -e "${GREEN}[6/8]${NC} Setting up FR3K data directory..."

FR3K_DIR="${FR3K_DATA_DIR:-$HOME/.fr3k}"
mkdir -p "$FR3K_DIR/logs"
mkdir -p "$FR3K_DIR/memory"
mkdir -p "$FR3K_DIR/state"
mkdir -p "$FR3K_DIR/sessions"

# Setup systemd service (optional)
echo -e "${GREEN}[7/8]${NC} Setting up systemd service..."

if command -v systemctl &> /dev/null; then
    # Update service file with current user and paths
    sed "s|User=fr3k|User=$USER|g" "${INSTALL_DIR}/setup/fr3k-daemon.service" | \
    sed "s|WorkingDirectory=/mnt/sdcard/claude-integrations|WorkingDirectory=${INSTALL_DIR}/autoimprove-101-loops|g" | \
    sed "s|ExecStart=/usr/bin/bun autonomous/self-improvement-loop.ts|ExecStart=$(which bun) autonomous/self-improvement-loop.ts|g" \
    > /tmp/fr3k-daemon.service

    echo "  systemd service file created: /tmp/fr3k-daemon.service"
    echo "  To install: sudo cp /tmp/fr3k-daemon.service /etc/systemd/system/"
    echo "  To enable: sudo systemctl enable fr3k-daemon"
    echo "  To start: sudo systemctl start fr3k-daemon"
else
    echo "  systemctl not found - skipping systemd setup"
fi

# Create convenience scripts
echo -e "${GREEN}[8/8]${NC} Creating convenience scripts..."

BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# Start script
cat > "$BIN_DIR/fr3k-start" << 'EOF'
#!/bin/bash
# Start FR3K system components

echo "Starting FR3K Voice Server..."
cd "$(dirname "$0")/../fr3k-export/voice-server" && bun server.ts &
VOICE_PID=$!

echo "Starting Telegram Relay..."
cd "$(dirname "$0")/../fr3k-export/telegram-relay" && bun run start &
RELAY_PID=$!

echo "Starting Autoimprove Loops..."
cd "$(dirname "$0")/../fr3k-export/autoimprove-101-loops" && bun autonomous/self-improvement-loop.ts &
LOOP_PID=$!

echo "FR3K System Started!"
echo "  Voice Server PID: $VOICE_PID"
echo "  Relay PID: $RELAY_PID"
echo "  Loops PID: $LOOP_PID"

# Save PIDs
echo "$VOICE_PID $RELAY_PID $LOOP_PID" > /tmp/fr3k-pids

trap "kill $VOICE_PID $RELAY_PID $LOOP_PID 2>/dev/null; rm /tmp/fr3k-pids" EXIT
wait
EOF

chmod +x "$BIN_DIR/fr3k-start"

# Stop script
cat > "$BIN_DIR/fr3k-stop" << 'EOF'
#!/bin/bash
# Stop FR3K system components

if [ -f /tmp/fr3k-pids ]; then
    read -r VOICE_PID RELAY_PID LOOP_PID < /tmp/fr3k-pids
    kill $VOICE_PID $RELAY_PID $LOOP_PID 2>/dev/null
    rm /tmp/fr3k-pids
    echo "FR3K System Stopped"
else
    echo "No running FR3K processes found"
fi
EOF

chmod +x "$BIN_DIR/fr3k-stop"

# Status script
cat > "$BIN_DIR/fr3k-status" << 'EOF'
#!/bin/bash
# Check FR3K system status

echo "FR3K System Status:"
echo ""

if pgrep -f "server.ts" > /dev/null; then
    echo "  Voice Server: RUNNING"
else
    echo "  Voice Server: STOPPED"
fi

if pgrep -f "telegram-relay" > /dev/null; then
    echo "  Telegram Relay: RUNNING"
else
    echo "  Telegram Relay: STOPPED"
fi

if pgrep -f "self-improvement-loop" > /dev/null; then
    echo "  Autoimprove Loops: RUNNING"
else
    echo "  Autoimprove Loops: STOPPED"
fi
EOF

chmod +x "$BIN_DIR/fr3k-status"

# Done!
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              INSTALLATION COMPLETE!                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "To start the system:"
echo "  fr3k-start"
echo ""
echo "Or start components individually:"
echo "  cd voice-server && bun server.ts"
echo "  cd telegram-relay && bun run start"
echo "  cd autoimprove-101-loops && bun autonomous/self-improvement-loop.ts"
echo ""
echo "To use Claude Code:"
echo "  claude"
echo ""
echo "For systemd service:"
echo "  sudo cp /tmp/fr3k-daemon.service /etc/systemd/system/"
echo "  sudo systemctl enable fr3k-daemon"
echo "  sudo systemctl start fr3k-daemon"
