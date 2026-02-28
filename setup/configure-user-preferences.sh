#!/bin/bash
# ===========================================
# FR3K USER PREFERENCES CONFIGURATION
# ===========================================
# Interactive setup for FR3K autonomous behavior preferences
# Usage: ./configure-user-preferences.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         FR3K USER PREFERENCES CONFIGURATION                       ║"
echo "║   Customize autonomous behavior to your preferences             ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${SCRIPT_DIR}/.."
ENV_USER_FILE="${INSTALL_DIR}/.env.user"

# Check if .env.user already exists
if [ -f "$ENV_USER_FILE" ]; then
    echo -e "${YELLOW}Existing .env.user file found${NC}"
    echo ""
    read -p "Do you want to overwrite existing preferences? [y/N]: " overwrite
    overwrite=${overwrite:-n}

    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Keeping existing preferences. Exiting."
        exit 0
    fi

    # Backup existing file
    cp "$ENV_USER_FILE" "${ENV_USER_FILE}.backup.$(date +%Y%m%d%H%M%S)"
    echo -e "${CYAN}Backed up existing preferences to .env.user.backup.$(date +%Y%m%d%H%M%S)${NC}"
    echo ""
fi

echo -e "${BLUE}[AUTONOMY LEVEL]${NC}"
echo ""
echo "How autonomous should FR3K be?"
echo ""
echo "  ${CYAN}1${NC} - Manual      : Requires approval for most actions"
echo "  ${CYAN}2${NC} - Cautious    : Can make minor changes, asks for significant ones"
echo "  ${CYAN}3${NC} - ${GREEN}Balanced${NC}   : Can make moderate changes, asks for major ones"
echo "  ${CYAN}4${NC} - Aggressive  : Makes most changes autonomously"
echo "  ${CYAN}5${NC} - Full Auto   : Makes all decisions autonomously"
echo ""
read -p "Select autonomy level [1-5] (default: 3): " autonomy_level
autonomy_level=${autonomy_level:-3}

if [[ ! "$autonomy_level" =~ ^[1-5]$ ]]; then
    echo -e "${RED}Invalid choice, using default (3)${NC}"
    autonomy_level=3
fi

echo ""
echo -e "${BLUE}[NOTIFICATIONS]${NC}"
echo ""
read -p "Enable voice notifications? [Y/n]: " voice_notif
voice_notif=${voice_notif:-Y}
[[ "$voice_notif" =~ ^[Yy]$ ]] && voice_notif=true || voice_notif=false

read -p "Enable Telegram notifications? [Y/n]: " telegram_notif
telegram_notif=${telegram_notif:-Y}
[[ "$telegram_notif" =~ ^[Yy]$ ]] && telegram_notif=true || telegram_notif=false

echo ""
echo "Notification frequency:"
echo "  ${CYAN}1${NC} - All events (can be noisy)"
echo "  ${CYAN}2${NC} - ${GREEN}Phases only${NC} (recommended)"
echo "  ${CYAN}3${NC} - Errors only"
echo ""
read -p "Select frequency [1-3] (default: 2): " notif_freq
notif_freq=${notif_freq:-2}

case $notif_freq in
    1) notif_freq="all" ;;
    2) notif_freq="phases_only" ;;
    3) notif_freq="errors_only" ;;
    *) notif_freq="phases_only" ;;
esac

echo ""
echo -e "${BLUE}[RISK TOLERANCE]${NC}"
echo ""
echo "What autonomous actions should FR3K be allowed to take?"
echo ""

read -p "Automatically edit files? [Y/n]: " auto_edit
auto_edit=${auto_edit:-Y}
[[ "$auto_edit" =~ ^[Yy]$ ]] && auto_edit=true || auto_edit=false

read -p "Automatically commit to git? [y/N]: " auto_commit
auto_commit=${auto_commit:-N}
[[ "$auto_commit" =~ ^[Yy]$ ]] && auto_commit=true || auto_commit=false

read -p "Automatically make system changes (install packages)? [y/N]: " auto_system
auto_system=${auto_system:-N}
[[ "$auto_system" =~ ^[Yy]$ ]] && auto_system=true || auto_system=false

echo ""
echo -e "${BLUE}[SELF-IMPROVEMENT LOOPS]${NC}"
echo ""
echo "Configure the 101 self-improvement loops:"
echo ""

read -p "Loop execution interval (seconds) [default: 3600 = 1 hour]: " loop_interval
loop_interval=${loop_interval:-3600}

# Validate loop interval
if [[ ! "$loop_interval" =~ ^[0-9]+$ ]] || [ "$loop_interval" -lt 300 ]; then
    echo -e "${YELLOW}Invalid interval, using default (3600)${NC}"
    loop_interval=3600
fi

read -p "Automatically execute loop suggestions? [y/N]: " loop_auto
loop_auto=${loop_auto:-N}
[[ "$loop_auto" =~ ^[Yy]$ ]] && loop_auto=true || loop_auto=false

echo ""
echo -e "${BLUE}[MCP SERVERS]${NC}"
echo ""
echo "MCP servers provide enhanced capabilities:"
echo "  • md-mcp - Dynamic tool creation"
echo "  • fr3k-think - Structured thinking"
echo "  • unified-pantheon-mcp - Meta-cognitive analysis"
echo "  • hey-fr3k - Persistent memory"
echo ""

read -p "Enable MCP servers? [Y/n]: " mcp_enabled
mcp_enabled=${mcp_enabled:-Y}
[[ "$mcp_enabled" =~ ^[Yy]$ ]] && mcp_enabled=true || mcp_enabled=false

echo ""
echo -e "${BLUE}[LEARNING & MEMORY]${NC}"
echo ""
read -p "Automatically store learnings from each session? [Y/n]: " auto_learn
auto_learn=${auto_learn:-Y}
[[ "$auto_learn" =~ ^[Yy]$ ]] && auto_learn=true || auto_learn=false

read -p "Memory retention days [default: 180]: " memory_days
memory_days=${memory_days:-180}

echo ""
echo -e "${BLUE}[VOICE SETTINGS]${NC}"
echo ""
read -p "Voice volume (0.0-1.0) [default: 0.8]: " voice_volume
voice_volume=${voice_volume:-0.8}

read -p "Voice speed (0.5-2.0) [default: 1.1]: " voice_speed
voice_speed=${voice_speed:-1.1}

echo ""
echo -e "${GREEN}[CREATING CONFIGURATION]${NC}"
echo ""

# Create .env.user file
cat > "$ENV_USER_FILE" << EOF
# FR3K User Preferences
# Generated: $(date)
# Autonomy Level: $autonomy_level

# Autonomy
FR3K_AUTONOMY_LEVEL=$autonomy_level

# Notifications
FR3K_VOICE_NOTIFICATIONS=$voice_notif
FR3K_TELEGRAM_NOTIFICATIONS=$telegram_notif
FR3K_NOTIFICATION_FREQUENCY=$notif_freq
FR3K_NOTIFICATION_MIN_INTERVAL=5

# Risk Tolerance
FR3K_AUTO_FILE_EDITS=$auto_edit
FR3K_AUTO_GIT_COMMITS=$auto_commit
FR3K_AUTO_SYSTEM_CHANGES=$auto_system
FR3K_AUTO_FILE_DELETION=false

# Loop Behavior
FR3K_LOOP_INTERVAL=$loop_interval
FR3K_LOOP_AUTO_EXECUTE=$loop_auto
FR3K_LOOP_MAX_EXECUTION_TIME=300

# MCP Servers
FR3K_MCP_ENABLED=$mcp_enabled
FR3K_MCP_SERVERS_ENABLED=md-mcp,fr3k-think,unified-pantheon-mcp,hey-fr3k
FR3K_MCP_TIMEOUT=30000

# Phase Preferences
FR3K_PHASE_VERBOSE=true
FR3K_PHASE_MEMORY_ENABLED=true
FR3K_PHASE_MAX_TIME=600

# Voice Settings
FR3K_VOICE_VOLUME=$voice_volume
FR3K_VOICE_SPEED=$voice_speed

# Learning & Memory
FR3K_AUTO_STORE_LEARNINGS=$auto_learn
FR3K_MEMORY_RETENTION_DAYS=$memory_days
FR3K_AUTO_CLEANUP_MEMORY=true

# Debugging
FR3K_DEBUG=false
FR3K_LOG_DIR=logs
FR3K_MAX_LOG_SIZE=100
FR3K_LOG_RETENTION_COUNT=5

# Performance
FR3K_MAX_PARALLEL_TASKS=5
FR3K_TASK_TIMEOUT=300
FR3K_CACHE_ENABLED=true
FR3K_CACHE_TTL=3600
EOF

echo -e "${GREEN}✓${NC} Configuration saved to ${ENV_USER_FILE}"
echo ""

# Show summary
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                    CONFIGURATION SUMMARY                          ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Autonomy Level:${NC} ${GREEN}$autonomy_level${NC} $(get_autonomy_label $autonomy_level)"
echo -e "${CYAN}Voice Notifications:${NC} $([ "$voice_notif" = true ] && echo "${GREEN}Enabled${NC}" || echo "${RED}Disabled${NC}")"
echo -e "${CYAN}Telegram Notifications:${NC} $([ "$telegram_notif" = true ] && echo "${GREEN}Enabled${NC}" || echo "${RED}Disabled${NC}")"
echo -e "${CYAN}Notification Frequency:${NC} ${GREEN}$notif_freq${NC}"
echo -e "${CYAN}Auto File Edits:${NC} $([ "$auto_edit" = true ] && echo "${GREEN}Yes${NC}" || echo "${RED}No${NC}")"
echo -e "${CYAN}Auto Git Commits:${NC} $([ "$auto_commit" = true ] && echo "${GREEN}Yes${NC}" || echo "${RED}No${NC}")"
echo -e "${CYAN}Loop Interval:${NC} ${GREEN}$loop_interval${NC} seconds ($(($loop_interval / 60)) minutes)"
echo -e "${CYAN}Auto Execute Loops:${NC} $([ "$loop_auto" = true ] && echo "${GREEN}Yes${NC}" || echo "${RED}No${NC}")"
echo -e "${CYAN}MCP Servers:${NC} $([ "$mcp_enabled" = true ] && echo "${GREEN}Enabled${NC}" || echo "${RED}Disabled${NC}")"
echo -e "${CYAN}Auto Store Learnings:${NC} $([ "$auto_learn" = true ] && echo "${GREEN}Yes${NC}" || echo "${RED}No${NC}")"
echo ""

# Instructions
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Review your preferences:"
echo "   cat $ENV_USER_FILE"
echo ""
echo "2. To change preferences, re-run this script:"
echo "   ./setup/configure-user-preferences.sh"
echo ""
echo "3. Preferences are automatically sourced by:"
echo "   • FR3K services (voice, telegram, daemon)"
echo "   • 101 loops"
echo "   • MCP notification hooks"
echo ""

function get_autonomy_label() {
    case $1 in
        1) echo "(Manual)" ;;
        2) echo "(Cautious)" ;;
        3) echo "(Balanced)" ;;
        4) echo "(Aggressive)" ;;
        5) echo "(Full Auto)" ;;
    esac
}

# Offer to update running services
if systemctl is-active --quiet fr3k-* 2>/dev/null; then
    echo -e "${YELLOW}Note: FR3K services are currently running${NC}"
    echo "Restart services to apply new preferences:"
    echo "  sudo systemctl restart fr3k-*"
    echo ""
fi
