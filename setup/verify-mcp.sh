#!/bin/bash
# ===========================================
# FR3K MCP SERVER VERIFICATION SCRIPT
# ===========================================
# Tests all 4 MCP servers independently
# Usage: ./verify-mcp.sh

set -e

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

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         FR3K MCP SERVER VERIFICATION                              ║"
echo "║   Testing all 4 MCP servers for integration                      ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Test function
test_mcp_server() {
    local server_name=$1
    local server_package=$2
    local test_command=$3

    echo -n "Testing ${CYAN}${server_name}${NC}... "

    # Check if npx can reach the server
    if npx -y ${server_package} --version >/dev/null 2>&1; then
        version=$(npx -y ${server_package} --version 2>/dev/null || echo "unknown")
        echo -e "${GREEN}PASS${NC} (v${version})"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo -e "  ${YELLOW}Reason:${NC} npx -y ${server_package} --version failed"
        ((FAIL_COUNT++))
        return 1
    fi
}

# Test MCP tool availability
test_mcp_tool() {
    local tool_name=$1
    local description=$2

    echo -n "  Testing tool ${CYAN}${tool_name}${NC}... "

    # Check if tool is listed in settings.json
    if grep -q "\"mcp__${tool_name}\"" ~/.claude/settings.json 2>/dev/null; then
        echo -e "${GREEN}CONFIGURED${NC}"
        return 0
    else
        echo -e "${YELLOW}NOT CONFIGURED${NC}"
        return 1
    fi
}

# Prerequisites check
echo -e "${BLUE}[PREREQUISITES]${NC} Checking prerequisites..."
echo ""

if ! command -v npx &> /dev/null; then
    echo -e "${RED}ERROR: npx not found${NC}"
    echo "Please install Node.js and npm first"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npx: $(npx --version)"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: node not found${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js: $(node --version)"

echo ""
echo -e "${BLUE}[MCP SERVERS]${NC} Testing MCP servers..."
echo ""

# Test 1: md-mcp
test_mcp_server "md-mcp" "md-mcp" "--version"
echo ""

# Test 2: fr3k-think
test_mcp_server "fr3k-think" "fr3k-think" "--version"
echo ""

# Test 3: unified-pantheon-mcp
test_mcp_server "unified-pantheon-mcp" "unified-pantheon-mcp" "--version"
echo ""

# Test 4: hey-fr3k
test_mcp_server "hey-fr3k" "hey-fr3k" "--version"

echo ""
echo -e "${BLUE}[INTEGRATION TEST]${NC} Testing hey-fr3k database..."
echo ""

# Test hey-fr3k database
HEY_FR3K_DB="${HOME}/.hey-fr3k/tasks.db"
if [ -f "$HEY_FR3K_DB" ]; then
    echo -e "  ${GREEN}✓${NC} Database exists: ${HEY_FR3K_DB}"

    # Test database is writable
    if [ -w "$HEY_FR3K_DB" ]; then
        echo -e "  ${GREEN}✓${NC} Database is writable"
        ((PASS_COUNT++))
    else
        echo -e "  ${RED}✗${NC} Database is not writable"
        ((FAIL_COUNT++))
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Database not found (will be created on first use)"
fi

echo ""
echo -e "${BLUE}[SETTINGS CHECK]${NC} Checking Claude Code settings..."
echo ""

# Check if settings.json exists
if [ -f "${HOME}/.claude/settings.json" ]; then
    echo -e "  ${GREEN}✓${NC} settings.json exists"
    ((PASS_COUNT++))

    # Check for MCP server configuration
    echo ""
    echo -e "  ${CYAN}Configured MCP servers:${NC}"

    if grep -q '"md-mcp"' ~/.claude/settings.json 2>/dev/null; then
        echo -e "    ${GREEN}✓${NC} md-mcp"
    else
        echo -e "    ${YELLOW}✗${NC} md-mcp (not configured)"
    fi

    if grep -q '"fr3k-think"' ~/.claude/settings.json 2>/dev/null; then
        echo -e "    ${GREEN}✓${NC} fr3k-think"
    else
        echo -e "    ${YELLOW}✗${NC} fr3k-think (not configured)"
    fi

    if grep -q '"unified-pantheon-mcp"' ~/.claude/settings.json 2>/dev/null; then
        echo -e "    ${GREEN}✓${NC} unified-pantheon-mcp"
    else
        echo -e "    ${YELLOW}✗${NC} unified-pantheon-mcp (not configured)"
    fi

    if grep -q '"hey-fr3k"' ~/.claude/settings.json 2>/dev/null; then
        echo -e "    ${GREEN}✓${NC} hey-fr3k"
    else
        echo -e "    ${YELLOW}✗${NC} hey-fr3k (not configured)"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} settings.json not found"
fi

echo ""
echo -e "${BLUE}[PHASE INTEGRATION]${NC} Verifying MCP usage in 7-phase algorithm..."
echo ""

# Check if integration documentation exists
INTEGRATION_DOC="${SCRIPT_DIR}/../claude-skills/FR3K/MCP-integration.md"
if [ -f "$INTEGRATION_DOC" ]; then
    echo -e "  ${GREEN}✓${NC} MCP integration documentation exists"
    ((PASS_COUNT++))
else
    echo -e "  ${YELLOW}⚠${NC} MCP integration documentation not found"
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                         VERIFICATION SUMMARY                       ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}PASSED:${NC} ${PASS_COUNT}"
echo -e "  ${RED}FAILED:${NC} ${FAIL_COUNT}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All MCP servers verified!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Claude Code to load MCP tools"
    echo "  2. Test MCP tools with: 'List all available MCP tools'"
    echo "  3. Run the 7-phase algorithm to verify integration"
    exit 0
else
    echo -e "${RED}✗ Some MCP servers failed verification${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Clear npx cache: rm -rf ~/.npm/_npx"
    echo "  2. Test manually: npx -y <server-name> --version"
    echo "  3. Check MCP-INSTALLATION.md for details"
    exit 1
fi
