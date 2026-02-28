#!/bin/bash
# ===========================================
# FR3K COMPLETE SYSTEM VERIFICATION
# ===========================================
# Comprehensive test suite for all FR3K components
# Usage: ./verify-system.sh

# Don't exit on errors - we want to run all tests
# set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         FR3K COMPLETE SYSTEM VERIFICATION                         ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${SCRIPT_DIR}/.."

# Test functions
test_result() {
    local test_name=$1
    local result=$2
    local message=$3

    if [ "$result" = "PASS" ]; then
        echo -e "  ${GREEN}✓${NC} ${test_name}"
        ((PASS_COUNT++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "  ${RED}✗${NC} ${test_name}"
        if [ -n "$message" ]; then
            echo -e "    ${YELLOW}Reason:${NC} ${message}"
        fi
        ((FAIL_COUNT++))
    elif [ "$result" = "WARN" ]; then
        echo -e "  ${YELLOW}⚠${NC} ${test_name}"
        if [ -n "$message" ]; then
            echo -e "    ${YELLOW}Note:${NC} ${message}"
        fi
        ((WARN_COUNT++))
    fi
}

# ============================================
# PREREQUISITES CHECK
# ============================================
echo -e "${BLUE}[1/8] PREREQUISITES${NC}"
echo ""

command -v node >/dev/null 2>&1
test_result "Node.js installed" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

command -v npm >/dev/null 2>&1
test_result "npm installed" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

command -v npx >/dev/null 2>&1
test_result "npx available" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

command -v bun >/dev/null 2>&1
test_result "Bun installed" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

command -v systemctl >/dev/null 2>&1
test_result "systemd available" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

# ============================================
# MCP SERVERS TEST
# ============================================
echo ""
echo -e "${BLUE}[2/8] MCP SERVERS${NC}"
echo ""

npx -y md-mcp --version >/dev/null 2>&1
test_result "md-mcp available" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

npx -y fr3k-think --version >/dev/null 2>&1
test_result "fr3k-think available" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

npx -y unified-pantheon-mcp --version >/dev/null 2>&1
test_result "unified-pantheon-mcp available" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

npx -y hey-fr3k --version >/dev/null 2>&1
test_result "hey-fr3k available" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

# Test hey-fr3k database
if [ -f "${HOME}/.hey-fr3k/tasks.db" ]; then
    test_result "hey-fr3k database exists" "PASS"
else
    test_result "hey-fr3k database exists" "WARN" "Will be created on first use"
fi

# ============================================
# CLAUDE CODE CONFIGURATION TEST
# ============================================
echo ""
echo -e "${BLUE}[3/8] CLAUDE CODE CONFIGURATION${NC}"
echo ""

if [ -f "${HOME}/.claude/settings.json" ]; then
    test_result "settings.json exists" "PASS"

    # Check for MCP configuration
    if grep -q '"mcpServers"' ~/.claude/settings.json 2>/dev/null; then
        test_result "MCP servers configured" "PASS"
    else
        test_result "MCP servers configured" "WARN" "MCP servers not in settings.json"
    fi

    # Check for allowedTools
    if grep -q '"allowedTools"' ~/.claude/settings.json 2>/dev/null; then
        test_result "allowedTools configured" "PASS"
    else
        test_result "allowedTools configured" "WARN" "MCP tools may require permission"
    fi
else
    test_result "settings.json exists" "FAIL" "Claude Code not configured"
fi

# ============================================
# HOOKS TEST
# ============================================
echo ""
echo -e "${BLUE}[4/8] CLAUDE HOOKS${NC}"
echo ""

HOOKS_DIR="${INSTALL_DIR}/claude-hooks/hooks"
if [ -d "$HOOKS_DIR" ]; then
    test_result "Hooks directory exists" "PASS"

    # Check for critical hooks
    [ -f "${HOOKS_DIR}/MCPNotify.hook.ts" ]
    test_result "MCPNotify hook exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

    [ -f "${HOOKS_DIR}/MCPPhaseBridge.hook.ts" ]
    test_result "MCPPhaseBridge hook exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

    [ -f "${HOOKS_DIR}/TelegramPhaseNotify.hook.ts" ]
    test_result "TelegramPhaseNotify hook exists" $([ $? -eq 0 ] && echo "PASS" || echo "WARN" "Optional")
else
    test_result "Hooks directory exists" "FAIL"
fi

# ============================================
# SKILLS TEST
# ============================================
echo ""
echo -e "${BLUE}[5/8] CLAUDE SKILLS${NC}"
echo ""

SKILLS_DIR="${INSTALL_DIR}/claude-skills/FR3K"
if [ -d "$SKILLS_DIR" ]; then
    test_result "FR3K skills directory exists" "PASS"

    [ -f "${SKILLS_DIR}/SKILL.md" ]
    test_result "FR3K SKILL.md exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

    [ -f "${SKILLS_DIR}/MCP-integration.md" ]
    test_result "MCP integration guide exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

    [ -f "${SKILLS_DIR}/LearnPhaseEnhanced.md" ]
    test_result "Enhanced LEARN phase guide exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")
else
    test_result "FR3K skills directory exists" "FAIL"
fi

# ============================================
# 101 LOOPS TEST
# ============================================
echo ""
echo -e "${BLUE}[6/8] 101 SELF-IMPROVEMENT LOOPS${NC}"
echo ""

LOOPS_DIR="${INSTALL_DIR}/autoimprove-101-loops"
if [ -d "$LOOPS_DIR" ]; then
    test_result "101 loops directory exists" "PASS"

    [ -d "${LOOPS_DIR}/autonomous" ]
    test_result "Autonomous loops directory exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

    [ -f "${LOOPS_DIR}/integration/loop-phase-bridge.ts" ]
    test_result "Loop-phase bridge exists" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

    # Count loops
    loop_count=$(ls "${LOOPS_DIR}/autonomous"/*.ts 2>/dev/null | wc -l)
    if [ "$loop_count" -gt 0 ]; then
        test_result "Self-improvement loops found" "PASS" "Found ${loop_count} loops"
    else
        test_result "Self-improvement loops found" "WARN" "No loops found"
    fi
else
    test_result "101 loops directory exists" "FAIL"
fi

# ============================================
# SERVICES TEST
# ============================================
echo ""
echo -e "${BLUE}[7/8] SYSTEMD SERVICES${NC}"
echo ""

# Check if services are installed
if [ -f "/etc/systemd/system/fr3k-voice-server.service" ]; then
    test_result "Voice server service installed" "PASS"

    if systemctl is-active --quiet fr3k-voice-server 2>/dev/null; then
        test_result "Voice server running" "PASS"
    else
        test_result "Voice server running" "WARN" "Service installed but not running"
    fi
else
    test_result "Voice server service installed" "WARN" "Service not installed (optional)"
fi

if [ -f "/etc/systemd/system/fr3k-telegram-relay.service" ]; then
    test_result "Telegram relay service installed" "PASS"

    if systemctl is-active --quiet fr3k-telegram-relay 2>/dev/null; then
        test_result "Telegram relay running" "PASS"
    else
        test_result "Telegram relay running" "WARN" "Service installed but not running"
    fi
else
    test_result "Telegram relay service installed" "WARN" "Service not installed (optional)"
fi

if [ -f "/etc/systemd/system/fr3k-daemon.service" ]; then
    test_result "Self-improvement daemon service installed" "PASS"

    if systemctl is-active --quiet fr3k-daemon 2>/dev/null; then
        test_result "Self-improvement daemon running" "PASS"
    else
        test_result "Self-improvement daemon running" "WARN" "Service installed but not running"
    fi
else
    test_result "Self-improvement daemon service installed" "WARN" "Service not installed (optional)"
fi

# ============================================
# INTEGRATION TEST
# ============================================
echo ""
echo -e "${BLUE}[8/8] INTEGRATION TEST${NC}"
echo ""

# Test voice server endpoint
if command -v curl >/dev/null 2>&1; then
    if curl -s http://localhost:8888/health >/dev/null 2>&1; then
        test_result "Voice server responding" "PASS"
    else
        test_result "Voice server responding" "WARN" "Voice server not running or not on port 8888"
    fi
else
    test_result "Voice server responding" "WARN" "curl not available for testing"
fi

# Test hey-fr3k memory storage (end-to-end)
TEST_MEMORY_ID=$(uuidgen 2>/dev/null || echo "test-$(date +%s)")
echo '{"tool_name":"store_fr3k","tool_input":{"content":"Test verification memory","memory_type":"decision"},"session_id":"'"$TEST_MEMORY_ID"'"}' | npx -y hey-fr3k >/dev/null 2>&1
test_result "hey-fr3k memory storage" $([ $? -eq 0 ] && echo "PASS" || echo "FAIL")

# Test user preferences
if [ -f "${INSTALL_DIR}/.env.user" ]; then
    test_result "User preferences configured" "PASS"
else
    test_result "User preferences configured" "WARN" "Run ./configure-user-preferences.sh"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                       VERIFICATION SUMMARY                        ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}PASSED:${NC} ${PASS_COUNT}"
echo -e "  ${YELLOW}WARNINGS:${NC} ${WARN_COUNT}"
echo -e "  ${RED}FAILED:${NC} ${FAIL_COUNT}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "Your FR3K system is ready to use."

    if [ $WARN_COUNT -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Note:${NC} Some optional components are not configured."
        echo "These are not required for basic operation."
    fi

    echo ""
    echo "Next steps:"
    echo "  1. Start your AI CLI (claude, opencode, or gemini)"
    echo "  2. Ask: 'List all available MCP tools'"
    echo "  3. Run the 7-phase algorithm on a task"

    exit 0
else
    echo -e "${RED}✗ Some critical tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Ensure all prerequisites are installed (Node.js, npm, bun)"
    echo "  2. Run the main install script: cd setup && ./install.sh"
    echo "  3. Check MCP servers: ./verify-mcp.sh"
    echo "  4. Review error messages above for specific issues"

    exit 1
fi
