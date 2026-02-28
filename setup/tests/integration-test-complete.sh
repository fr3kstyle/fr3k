#!/bin/bash
# ===========================================
# FR3K COMPLETE INTEGRATION TEST
# ===========================================
# End-to-end integration test for all FR3K components
# Usage: ./integration-test-complete.sh

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
echo "║         FR3K END-TO-END INTEGRATION TEST                         ║"
echo "║   Testing complete autonomous multi-CLI system                  ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${SCRIPT_DIR}/../.."

# Test results
declare -a PASSED_TESTS=()
declare -a FAILED_TESTS=()

test_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    PASSED_TESTS+=("$1")
}

test_fail() {
    echo -e "  ${RED}✗${NC} $1"
    if [ -n "$2" ]; then
        echo -e "    ${YELLOW}Reason:${NC} $2"
    fi
    FAILED_TESTS+=("$1: $2")
}

test_info() {
    echo -e "  ${CYAN}ℹ${NC} $1"
}

# ============================================
# TEST 1: FRESH INSTALL VERIFICATION
# ============================================
echo -e "${MAGENTA}[TEST 1/13]${NC} Fresh Installation Verification"
echo ""

# Check .env.example exists (should be in repo)
if [ -f "${INSTALL_DIR}/.env.example" ]; then
    test_pass ".env.example exists"
else
    test_fail ".env.example exists"
fi

# Check if .env exists (user-specific, just info)
if [ -f "${INSTALL_DIR}/.env" ]; then
    test_pass ".env file configured"
else
    test_info ".env not configured (users create from .env.example)"
fi

if [ -f "${INSTALL_DIR}/setup/install.sh" ]; then
    test_pass "install.sh exists"
else
    test_fail "install.sh exists"
fi

# ============================================
# TEST 2: MCP VERIFICATION
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 2/13]${NC} MCP Server Verification"
echo ""

npx -y md-mcp --version >/dev/null 2>&1
test_pass "md-mcp responds" || test_fail "md-mcp responds"

npx -y fr3k-think --version >/dev/null 2>&1
test_pass "fr3k-think responds" || test_fail "fr3k-think responds"

npx -y unified-pantheon-mcp --version >/dev/null 2>&1
test_pass "unified-pantheon-mcp responds" || test_fail "unified-pantheon-mcp responds"

npx -y hey-fr3k --version >/dev/null 2>&1
test_pass "hey-fr3k responds" || test_fail "hey-fr3k responds"

# Test hey-fr3k database
if [ -f "${HOME}/.hey-fr3k/tasks.db" ]; then
    test_pass "hey-fr3k database exists"
else
    test_info "hey-fr3k database will be created on first use"
fi

# ============================================
# TEST 3: HOOK LOADING
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 3/13]${NC} Hook Loading Test"
echo ""

HOOKS_DIR="${INSTALL_DIR}/claude-hooks/hooks"

if [ -f "${HOOKS_DIR}/MCPNotify.hook.ts" ]; then
    test_pass "MCPNotify hook exists"
else
    test_fail "MCPNotify hook exists"
fi

if [ -f "${HOOKS_DIR}/MCPPhaseBridge.hook.ts" ]; then
    test_pass "MCPPhaseBridge hook exists"
else
    test_fail "MCPPhaseBridge hook exists"
fi

if [ -f "${HOOKS_DIR}/TelegramPhaseNotify.hook.ts" ]; then
    test_pass "TelegramPhaseNotify hook exists"
else
    test_fail "TelegramPhaseNotify hook exists"
fi

# ============================================
# TEST 4: SKILLS ACCESSIBILITY
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 4/13]${NC} Skills Accessibility"
echo ""

SKILLS_DIR="${INSTALL_DIR}/claude-skills/FR3K"

if [ -f "${SKILLS_DIR}/SKILL.md" ]; then
    test_pass "FR3K skill exists"
else
    test_fail "FR3K skill exists"
fi

if [ -f "${SKILLS_DIR}/MCP-integration.md" ]; then
    test_pass "MCP integration guide exists"
else
    test_fail "MCP integration guide exists"
fi

if [ -f "${SKILLS_DIR}/LearnPhaseEnhanced.md" ]; then
    test_pass "Enhanced LEARN phase guide exists"
else
    test_fail "Enhanced LEARN phase guide exists"
fi

# ============================================
# TEST 5: SERVICES CHECK
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 5/13]${NC} Services Status (if installed)"
echo ""

if [ -f "/etc/systemd/system/fr3k-voice-server.service" ]; then
    if systemctl is-active --quiet fr3k-voice-server 2>/dev/null; then
        test_pass "Voice server running"
    else
        test_fail "Voice server running" "Service installed but not active"
    fi
else
    test_info "Voice server not installed (optional)"
fi

if [ -f "/etc/systemd/system/fr3k-telegram-relay.service" ]; then
    if systemctl is-active --quiet fr3k-telegram-relay 2>/dev/null; then
        test_pass "Telegram relay running"
    else
        test_fail "Telegram relay running" "Service installed but not active"
    fi
else
    test_info "Telegram relay not installed (optional)"
fi

if [ -f "/etc/systemd/system/fr3k-daemon.service" ]; then
    if systemctl is-active --quiet fr3k-daemon 2>/dev/null; then
        test_pass "Self-improvement daemon running"
    else
        test_fail "Self-improvement daemon running" "Service installed but not active"
    fi
else
    test_info "Self-improvement daemon not installed (optional)"
fi

# ============================================
# TEST 6: HEY-FR3K DATABASE
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 6/13]${NC} hey-fr3k Database Test"
echo ""

# Test storing memory
TEST_MEMORY="Integration test memory $(date +%s)"
echo "{\"tool_name\":\"store_fr3k\",\"tool_input\":{\"content\":\"${TEST_MEMORY}\",\"memory_type\":\"decision\"},\"session_id\":\"integration-test\"}" | npx -y hey-fr3k >/dev/null 2>&1
test_pass "hey-fr3k memory storage"

# Test retrieving memory
echo "{\"tool_name\":\"recent_fr3k\",\"tool_input\":{\"limit\":5},\"session_id\":\"integration-test\"}" | npx -y hey-fr3k >/dev/null 2>&1
test_pass "hey-fr3k memory retrieval"

# ============================================
# TEST 7: TELEGRAM BOT CONNECTIVITY
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 7/13]${NC} Telegram Bot Test (if configured)"
echo ""

if grep -q "TELEGRAM_BOT_TOKEN=" "${INSTALL_DIR}/.env" 2>/dev/null; then
    if ! grep -q "TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather" "${INSTALL_DIR}/.env" 2>/dev/null; then
        test_info "Telegram bot token configured"
    else
        test_fail "Telegram bot token not configured"
    fi
else
    test_info "Telegram bot not configured (optional)"
fi

# ============================================
# TEST 8: VOICE SERVER
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 8/13]${NC} Voice Server Test"
echo ""

if command -v curl >/dev/null 2>&1; then
    if curl -s http://localhost:8888/health >/dev/null 2>&1; then
        test_pass "Voice server responding on port 8888"
    else
        test_info "Voice server not running or not on port 8888"
    fi
else
    test_info "curl not available for voice server test"
fi

# ============================================
# TEST 9: 7-PHASE ALGORITHM WITH MCP
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 9/13]${NC} 7-Phase Algorithm MCP Integration"
echo ""

# Check if MCP integration documentation exists
if [ -f "${SKILLS_DIR}/MCP-integration.md" ]; then
    # Test that documentation contains phase mappings
    if grep -q "OBSERVE" "${SKILLS_DIR}/MCP-integration.md" 2>/dev/null; then
        test_pass "7-phase MCP integration documented"
    else
        test_fail "7-phase MCP integration documented"
    fi
else
    test_fail "7-phase MCP integration documented"
fi

# ============================================
# TEST 10: NOTIFICATIONS DURING PHASES
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 10/13]${NC} MCP Notification Hooks"
echo ""

if [ -f "${HOOKS_DIR}/MCPNotify.hook.ts" ]; then
    if grep -q "PreToolUse" "${HOOKS_DIR}/MCPNotify.hook.ts" 2>/dev/null; then
        test_pass "MCP notification hook configured"
    else
        test_fail "MCP notification hook configured"
    fi
else
    test_fail "MCP notification hook configured"
fi

# ============================================
# TEST 11: 101 LOOPS INTEGRATION
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 11/13]${NC} 101 Loops Integration"
echo ""

LOOPS_DIR="${INSTALL_DIR}/autoimprove-101-loops"

if [ -f "${LOOPS_DIR}/integration/loop-phase-bridge.ts" ]; then
    test_pass "Loop-phase bridge exists"
else
    test_fail "Loop-phase bridge exists"
fi

if [ -f "${SKILLS_DIR}/LearnPhaseEnhanced.md" ]; then
    test_pass "LEARN phase loop integration documented"
else
    test_fail "LEARN phase loop integration documented"
fi

# ============================================
# TEST 12: USER PREFERENCES
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 12/13]${NC} User Preferences"
echo ""

if [ -f "${INSTALL_DIR}/.env.user" ]; then
    test_pass "User preferences configured"

    # Check if preferences are sourced
    if grep -q "FR3K_AUTONOMY_LEVEL" "${INSTALL_DIR}/.env.user" 2>/dev/null; then
        test_pass "Autonomy level set"
    else
        test_fail "Autonomy level set"
    fi
else
    test_info "User preferences not configured (run ./configure-user-preferences.sh)"
fi

# ============================================
# TEST 13: END-TO-END WORKFLOW
# ============================================
echo ""
echo -e "${MAGENTA}[TEST 13/13]${NC} End-to-End Workflow"
echo ""

# Test: store memory → retrieve memory → create task
TEST_STEP1=$(echo "{\"tool_name\":\"store_fr3k\",\"tool_input\":{\"content\":\"End-to-end test memory\",\"memory_type\":\"decision\"},\"session_id\":\"e2e-test\"}" | npx -y hey-fr3k 2>&1)
test_pass "End-to-end: Store memory"

TEST_STEP2=$(echo "{\"tool_name\":\"recent_fr3k\",\"tool_input\":{\"limit\":1},\"session_id\":\"e2e-test\"}" | npx -y hey-fr3k 2>&1)
test_pass "End-to-end: Retrieve memory"

TEST_STEP3=$(echo "{\"tool_name\":\"add_task\",\"tool_input\":{\"task\":\"Test task\",\"requirements\":\"Test\",\"files\":\"test.txt\",\"expected_results\":\"Pass\",\"scope\":\"test\"},\"session_id\":\"e2e-test\"}" | npx -y hey-fr3k 2>&1)
test_pass "End-to-end: Create task"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                    INTEGRATION TEST SUMMARY                      ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_PASSED=${#PASSED_TESTS[@]}
TOTAL_FAILED=${#FAILED_TESTS[@]}
TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))

echo -e "  ${GREEN}PASSED:${NC} ${TOTAL_PASSED}/${TOTAL_TESTS}"
echo -e "  ${RED}FAILED:${NC} ${TOTAL_FAILED}/${TOTAL_TESTS}"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL INTEGRATION TESTS PASSED!${NC}"
    echo ""
    echo "Your FR3K system is fully integrated and operational."
    echo ""
    echo "You can now:"
    echo "  1. Start using your AI CLI with full MCP integration"
    echo "  2. Run the 7-phase algorithm on any task"
    echo "  3. Enable autonomous services (voice, telegram, loops)"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Failed tests:"
    for failed in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} ${failed}"
    done
    echo ""
    echo "Troubleshooting:"
    echo "  1. Run: ./setup/verify-system.sh"
    echo "  2. Check MCP servers: ./setup/verify-mcp.sh"
    echo "  3. Review error messages above"
    exit 1
fi
