#!/bin/bash
# ===========================================
# FR3K SYSTEMD SERVICES REMOVAL SCRIPT
# ===========================================
# Removes voice-server, telegram-relay, and fr3k-daemon systemd services
# Usage: ./uninstall-services.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         FR3K SYSTEMD SERVICES - REMOVAL                           ║"
echo "║   Voice Server • Telegram Relay • Self-Improvement Daemon        ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}ERROR: Do not run this script as root${NC}"
    echo "Run as your normal user, the script will use sudo where needed"
    exit 1
fi

# Check for sudo access
if ! sudo -v &> /dev/null; then
    echo -e "${RED}ERROR: sudo access required${NC}"
    exit 1
fi

# Function to stop and disable service
remove_service() {
    local service_name=$1

    if systemctl is-active "${service_name}" &> /dev/null; then
        echo -e "  Stopping ${service_name}..."
        sudo systemctl stop "${service_name}"
        echo -e "    ${GREEN}✓${NC} Stopped"
    fi

    if systemctl is-enabled "${service_name}" &> /dev/null; then
        echo -e "  Disabling ${service_name}..."
        sudo systemctl disable "${service_name}"
        echo -e "    ${GREEN}✓${NC} Disabled"
    fi

    if [ -f "/etc/systemd/system/${service_name}.service" ]; then
        echo -e "  Removing service file..."
        sudo rm "/etc/systemd/system/${service_name}.service"
        echo -e "    ${GREEN}✓${NC} Removed"
    fi
}

echo -e "${YELLOW}[WARNING]${NC} This will remove FR3K systemd services"
echo ""
echo "Services that will be removed:"
echo "  - fr3k-voice-server (if installed)"
echo "  - fr3k-telegram-relay (if installed)"
echo "  - fr3k-daemon (if installed)"
echo ""
read -p "Continue? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

echo ""
echo -e "${BLUE}[REMOVING SERVICES]${NC}"

# Remove voice server
if [ -f "/etc/systemd/system/fr3k-voice-server.service" ]; then
    echo ""
    echo -e "${CYAN}Removing fr3k-voice-server...${NC}"
    remove_service "fr3k-voice-server"
else
    echo ""
    echo -e "${YELLOW}fr3k-voice-server not installed${NC}"
fi

# Remove telegram relay
if [ -f "/etc/systemd/system/fr3k-telegram-relay.service" ]; then
    echo ""
    echo -e "${CYAN}Removing fr3k-telegram-relay...${NC}"
    remove_service "fr3k-telegram-relay"
else
    echo ""
    echo -e "${YELLOW}fr3k-telegram-relay not installed${NC}"
fi

# Remove daemon
if [ -f "/etc/systemd/system/fr3k-daemon.service" ]; then
    echo ""
    echo -e "${CYAN}Removing fr3k-daemon...${NC}"
    remove_service "fr3k-daemon"
else
    echo ""
    echo -e "${YELLOW}fr3k-daemon not installed${NC}"
fi

# Reload systemd
echo ""
echo -e "${CYAN}Reloading systemd...${NC}"
sudo systemctl daemon-reload
sudo systemctl reset-failed
echo -e "  ${GREEN}✓${NC} Reloaded"

# Remove aliases
echo ""
echo -e "${CYAN}Removing aliases...${NC}"

ALIAS_FILE="${HOME}/.fr3k-aliases"
if [ -f "${ALIAS_FILE}" ]; then
    rm "${ALIAS_FILE}"
    echo -e "  ${GREEN}✓${NC} Removed ${ALIAS_FILE}"

    # Remove from .bashrc
    if grep -q "source ${ALIAS_FILE}" "${HOME}/.bashrc" 2>/dev/null; then
        sed -i "/# FR3K service aliases/,+1d" "${HOME}/.bashrc" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Removed from ~/.bashrc"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Aliases not found"
fi

echo ""
echo -e "${GREEN}[REMOVAL COMPLETE]${NC}"
echo ""
echo "All FR3K systemd services have been removed."
echo ""
echo "Note: Services that were running at removal time have been stopped."
echo "You can still run components manually:"
echo "  - Voice server: cd voice-server/VoiceServer && bun server.ts"
echo "  - Telegram relay: cd telegram-relay && bun run src/relay.ts"
echo "  - 101 loops: cd autoimprove-101-loops && bun autonomous/self-improvement-loop.ts"
echo ""
