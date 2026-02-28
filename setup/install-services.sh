#!/bin/bash
# ===========================================
# FR3K SYSTEMD SERVICES INSTALLATION SCRIPT
# ===========================================
# Installs voice-server, telegram-relay, and fr3k-daemon as systemd services
# Usage: ./install-services.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         FR3K SYSTEMD SERVICES - INSTALLATION                      ║"
echo "║   Voice Server • Telegram Relay • Self-Improvement Daemon        ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${SCRIPT_DIR}/.."

# Get current username
USERNAME=$(whoami)
echo -e "${CYAN}Detected username:${NC} ${USERNAME}"

# Confirm installation directory
echo ""
echo -e "${CYAN}Installation directory:${NC} ${INSTALL_DIR}"
read -p "Is this correct? [Y/n]: " confirm_dir
confirm_dir=${confirm_dir:-Y}

if [[ ! "$confirm_dir" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Installation cancelled${NC}"
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}ERROR: Do not run this script as root${NC}"
    echo "Run as your normal user, the script will use sudo where needed"
    exit 1
fi

# Check if .env exists
if [ ! -f "${INSTALL_DIR}/.env" ]; then
    echo -e "${RED}ERROR: .env file not found at ${INSTALL_DIR}/.env${NC}"
    echo "Please create .env file first"
    exit 1
fi

echo ""
echo -e "${BLUE}[PREREQUISITES]${NC} Checking prerequisites..."

# Check for sudo access
if ! sudo -v &> /dev/null; then
    echo -e "${RED}ERROR: sudo access required${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Sudo access available"

# Check for systemctl
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}ERROR: systemctl not found${NC}"
    echo "This system may not use systemd"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} systemd available"

# Check for bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}ERROR: bun not found${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} bun available"

# Ask which services to install
echo ""
echo -e "${CYAN}Which services would you like to install?${NC}"
echo "  1) Voice Server (port 8888) - TTS notifications"
echo "  2) Telegram Relay - Telegram bot integration"
echo "  3) Self-Improvement Daemon - 101 loops background service"
echo "  4) All three"
echo ""
read -p "Enter choice [1-4] (default: 4): " service_choice
service_choice=${service_choice:-4}

INSTALL_VOICE=false
INSTALL_TELEGRAM=false
INSTALL_DAEMON=false

case $service_choice in
    1) INSTALL_VOICE=true ;;
    2) INSTALL_TELEGRAM=true ;;
    3) INSTALL_DAEMON=true ;;
    4) INSTALL_VOICE=true; INSTALL_TELEGRAM=true; INSTALL_DAEMON=true ;;
    *) echo "Invalid choice, installing all"; INSTALL_VOICE=true; INSTALL_TELEGRAM=true; INSTALL_DAEMON=true ;;
esac

echo ""
echo -e "${BLUE}[INSTALLING SERVICES]${NC}"

# Function to install service
install_service() {
    local service_file=$1
    local service_name=$2

    echo ""
    echo -e "${CYAN}Installing ${service_name}...${NC}"

    # Create temp file with replacements
    local temp_file="/tmp/${service_name}.service"
    sed -e "s|YOUR_USERNAME|${USERNAME}|g" \
        -e "s|INSTALL_DIR|${INSTALL_DIR}|g" \
        "${service_file}" > "${temp_file}"

    # Copy to systemd directory
    sudo cp "${temp_file}" "/etc/systemd/system/${service_name}.service"
    rm "${temp_file}"

    echo -e "  ${GREEN}✓${NC} Service file installed"

    # Reload systemd
    sudo systemctl daemon-reload

    # Enable service
    sudo systemctl enable "${service_name}" 2>/dev/null || true

    echo -e "  ${GREEN}✓${NC} ${service_name} enabled (will start on boot)"
}

# Install selected services
if [ "$INSTALL_VOICE" = true ]; then
    install_service "${SCRIPT_DIR}/voice-server.service" "fr3k-voice-server"
fi

if [ "$INSTALL_TELEGRAM" = true ]; then
    # Check if TELEGRAM_BOT_TOKEN is set
    if grep -q "TELEGRAM_BOT_TOKEN=" "${INSTALL_DIR}/.env" && \
       ! grep -q "TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather" "${INSTALL_DIR}/.env"; then
        install_service "${SCRIPT_DIR}/telegram-relay.service" "fr3k-telegram-relay"
    else
        echo -e "${YELLOW}WARNING: TELEGRAM_BOT_TOKEN not configured${NC}"
        echo "Skipping telegram-relay service"
        echo "Configure TELEGRAM_BOT_TOKEN in .env and run this script again"
    fi
fi

if [ "$INSTALL_DAEMON" = true ]; then
    install_service "${SCRIPT_DIR}/fr3k-daemon.service" "fr3k-daemon"
fi

echo ""
echo -e "${BLUE}[CREATING ALIASES]${NC}"

# Create convenience aliases
ALIAS_FILE="${HOME}/.fr3k-aliases"
cat > "${ALIAS_FILE}" << 'EOF'
#!/bin/bash
# FR3K Service Aliases

alias fr3k-status='systemctl --user status fr3k-* 2>/dev/null || sudo systemctl status fr3k-*'
alias fr3k-start='sudo systemctl start fr3k-*'
alias fr3k-stop='sudo systemctl stop fr3k-*'
alias fr3k-restart='sudo systemctl restart fr3k-*'
alias fr3k-logs='sudo journalctl -u fr3k-* -f'
alias fr3k-voice='sudo systemctl status fr3k-voice-server'
alias fr3k-telegram='sudo systemctl status fr3k-telegram-relay'
alias fr3k-daemon='sudo systemctl status fr3k-daemon'

# Individual service controls
alias fr3k-voice-start='sudo systemctl start fr3k-voice-server'
alias fr3k-voice-stop='sudo systemctl stop fr3k-voice-server'
alias fr3k-voice-restart='sudo systemctl restart fr3k-voice-server'
alias fr3k-voice-logs='sudo journalctl -u fr3k-voice-server -f'

alias fr3k-telegram-start='sudo systemctl start fr3k-telegram-relay'
alias fr3k-telegram-stop='sudo systemctl stop fr3k-telegram-relay'
alias fr3k-telegram-restart='sudo systemctl restart fr3k-telegram-relay'
alias fr3k-telegram-logs='sudo journalctl -u fr3k-telegram-relay -f'

alias fr3k-daemon-start='sudo systemctl start fr3k-daemon'
alias fr3k-daemon-stop='sudo systemctl stop fr3k-daemon'
alias fr3k-daemon-restart='sudo systemctl restart fr3k-daemon'
alias fr3k-daemon-logs='sudo journalctl -u fr3k-daemon -f'
EOF

# Source aliases in .bashrc if not already there
if ! grep -q "source ${ALIAS_FILE}" "${HOME}/.bashrc" 2>/dev/null; then
    echo "" >> "${HOME}/.bashrc"
    echo "# FR3K service aliases" >> "${HOME}/.bashrc"
    echo "source ${ALIAS_FILE}" >> "${HOME}/.bashrc"
    echo -e "  ${GREEN}✓${NC} Aliases added to ~/.bashrc"
else
    echo -e "  ${YELLOW}⚠${NC} Aliases already in ~/.bashrc"
fi

echo ""
echo -e "${GREEN}[INSTALLATION COMPLETE]${NC}"
echo ""
echo "Services installed and enabled to start on boot:"
echo ""

if [ "$INSTALL_VOICE" = true ]; then
    echo "  ✓ fr3k-voice-server (port 8888)"
fi

if [ "$INSTALL_TELEGRAM" = true ]; then
    echo "  ✓ fr3k-telegram-relay"
fi

if [ "$INSTALL_DAEMON" = true ]; then
    echo "  ✓ fr3k-daemon (101 loops)"
fi

echo ""
echo "To start services now:"
echo "  sudo systemctl start fr3k-*"
echo ""
echo "Or use the aliases:"
echo "  fr3k-start    # Start all services"
echo "  fr3k-status   # Check all service status"
echo "  fr3k-logs     # View all service logs"
echo ""
echo "To apply aliases to current session:"
echo "  source ~/.bashrc"
echo ""
echo "Individual service control:"
echo "  fr3k-voice-start   fr3k-voice-stop   fr3k-voice-logs"
echo "  fr3k-telegram-start fr3k-telegram-stop fr3k-telegram-logs"
echo "  fr3k-daemon-start  fr3k-daemon-stop  fr3k-daemon-logs"
echo ""
