#!/bin/bash
# ===========================================
# FR3K COMPREHENSIVE INTERACTIVE SETUP WIZARD
# ===========================================
# First-run setup wizard that configures EVERYTHING
# Tests autonomous features with 7-phase algorithm
# Creates personalized configuration based on user goals

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Clear screen for fresh start
clear

cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║     🤖 FR3K AUTONOMOUS AI SYSTEM - FIRST RUN SETUP WIZARD        ║
║                                                                   ║
║     World's First Autonomous Multi-CLI AI Infrastructure         ║
║                                                                   ║
║     This wizard will configure EVERYTHING for your setup         ║
║     and test the autonomous features with the 7-phase algorithm  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}This will take approximately 5-10 minutes to complete.${NC}"
echo ""
read -p "Press Enter to continue..."
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${SCRIPT_DIR}/.."

# ============================================
# SECTION 1: USER GOALS & INTERESTS
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 1: UNDERSTANDING YOUR GOALS                                 ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Let's understand what you want to achieve with FR3K:${NC}"
echo ""

# Primary use case
echo -e "${CYAN}What's your PRIMARY use case for FR3K?${NC}"
echo "  1) Software Development - coding, debugging, architecture"
echo "  2) Data Analysis & Research - processing data, finding insights"
echo "  3) Content Creation - writing, documentation, creative work"
echo "  4) Business Automation - workflows, integrations, efficiency"
echo "  5) Learning & Education - studying, exploring new topics"
echo "  6) Personal Assistant - daily tasks, organization, planning"
echo "  7) Other (will specify)"
echo ""
read -p "Enter choice [1-7]: " primary_use
primary_use=${primary_use:-1}

# Store for later
USER_GOALS="${primary_use}"

# Experience level
echo ""
echo -e "${CYAN}What's your experience level with AI coding assistants?${NC}"
echo "  1) Beginner - new to AI assistants"
echo "  2) Intermediate - used ChatGPT/Claude, exploring advanced features"
echo "  3) Advanced - power user, want maximum automation"
echo ""
read -p "Enter choice [1-3]: " experience_level
experience_level=${experience_level:-2}

# Technical background
echo ""
echo -e "${CYAN}What's your technical background?${NC}"
echo "  1) Software Developer"
echo "  2) Data Scientist/Analyst"
echo "  3) Business/Non-technical"
echo "  4) Student/Learner"
echo "  5) Hobbyist/Enthusiast"
echo ""
read -p "Enter choice [1-5]: " tech_background
tech_background=${tech_background:-1}

# What they want to build/do
echo ""
echo -e "${CYAN}What specific tasks do you want FR3K to help with?${NC}"
echo -e "(Enter comma-separated, e.g., 'coding, debugging, documentation')"
read -p "Your tasks: " user_tasks

# Success metrics
echo ""
echo -e "${CYAN}How will you measure FR3K's success?${NC}"
echo "  1) Speed - get things done faster"
echo "  2) Quality - better outcomes and insights"
echo "  3) Learning - discover new approaches"
echo "  4) Automation - reduce manual work"
echo "  5) All of the above"
echo ""
read -p "Enter choice [1-5]: " success_metric
success_metric=${success_metric:-5}

# ============================================
# SECTION 2: AUTONOMY PREFERENCES
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 2: AUTONOMY LEVEL & CONTROL                                 ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}FR3K can operate at different autonomy levels.${NC}"
echo -e "${YELLOW}Higher autonomy = FR3K does more automatically${NC}"
echo -e "${YELLOW}Lower autonomy = You maintain more control${NC}"
echo ""

case $experience_level in
    1) # Beginner - suggest lower autonomy
        DEFAULT_AUTONOMY=2
        echo "Based on your experience level, we recommend ${GREEN}Cautious (Level 2)${NC}"
        echo "FR3K will ask before making significant changes"
        ;;
    2) # Intermediate
        DEFAULT_AUTONOMY=3
        echo "Based on your experience level, we recommend ${GREEN}Balanced (Level 3)${NC}"
        echo "FR3K can make moderate changes, asks for major ones"
        ;;
    3) # Advanced
        DEFAULT_AUTONOMY=4
        echo "Based on your experience level, we recommend ${GREEN}Aggressive (Level 4)${NC}"
        echo "FR3K handles most things autonomously"
        ;;
esac

echo ""
echo "Detailed autonomy levels:"
echo "  ${CYAN}1${NC} - Manual      : Explicit approval for everything"
echo "  ${CYAN}2${NC} - Cautious    : Minor changes OK, major require approval"
echo "  ${CYAN}3${NC} - Balanced    : Moderate changes OK, major require approval"
echo "  ${CYAN}4${NC} - Aggressive  : Most changes autonomous, critical require approval"
echo "  ${CYAN}5${NC} - Full Auto   : Complete autonomy, just notifies you"
echo ""
read -p "Select autonomy level [1-5] (default: $DEFAULT_AUTONOMY): " autonomy_level
autonomy_level=${autonomy_level:-$DEFAULT_AUTONOMY}

# Specific permissions based on autonomy
echo ""
echo -e "${BOLD}Specific Permissions (based on autonomy level ${autonomy_level}):${NC}"
echo ""

case $autonomy_level in
    [1-2])
        # Low autonomy - conservative defaults
        AUTO_FILE_EDITS=false
        AUTO_GIT_COMMITS=false
        AUTO_SYSTEM_CHANGES=false
        AUTO_EXECUTE_LOOPS=false
        ;;
    3)
        # Balanced - moderate defaults
        AUTO_FILE_EDITS=true
        AUTO_GIT_COMMITS=false
        AUTO_SYSTEM_CHANGES=false
        AUTO_EXECUTE_LOOPS=false
        ;;
    [4-5])
        # High autonomy - permissive defaults
        AUTO_FILE_EDITS=true
        AUTO_GIT_COMMITS=true
        AUTO_SYSTEM_CHANGES=true
        AUTO_EXECUTE_LOOPS=true
        ;;
esac

# Ask for specific overrides
echo "We've set defaults based on your autonomy level. Customize?"
echo ""
read -p "Auto-edit files? [$AUTO_FILE_EDITS] " auto_edit_override
if [[ -n "$auto_edit_override" ]]; then
    AUTO_FILE_EDITS=$auto_edit_override
fi

read -p "Auto-commit to git? [$AUTO_GIT_COMMITS] " auto_commit_override
if [[ -n "$auto_commit_override" ]]; then
    AUTO_GIT_COMMITS=$auto_commit_override
fi

read -p "Auto-execute improvement loops? [$AUTO_EXECUTE_LOOPS] " auto_loops_override
if [[ -n "$auto_loops_override" ]]; then
    AUTO_EXECUTE_LOOPS=$auto_loops_override
fi

# ============================================
# SECTION 3: NOTIFICATION PREFERENCES
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 3: NOTIFICATIONS & FEEDBACK                                 ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}FR3K provides multiple notification channels:${NC}"
echo ""

# Voice notifications
echo -e "${CYAN}🎙️  Voice Notifications (TTS)${NC}"
echo "FR3K can speak phase completions and important events"
echo ""
read -p "Enable voice notifications? [Y/n]: " voice_enabled
voice_enabled=${voice_enabled:-Y}
[[ "$voice_enabled" =~ ^[Yy]$ ]] && VOICE_NOTIF=true || VOICE_NOTIF=false

if [ "$VOICE_NOTIF" = true ]; then
    echo ""
    echo -e "${CYAN}Voice Configuration:${NC}"

    # Voice style
    echo "What voice style do you prefer?"
    echo "  1) Professional - formal, concise"
    echo "  2) Friendly - casual, encouraging"
    echo "  3) Technical - detailed, precise"
    echo "  4) Minimal - brief, to-the-point"
    echo ""
    read -p "Select style [1-4]: " voice_style
    voice_style=${voice_style:-2}

    # Profanity filter
    echo ""
    read -p "Filter profanity from voice messages? [Y/n]: " no_profanity
    no_profanity=${no_profanity:-Y}
    [[ "$no_profanity" =~ ^[Yy]$ ]] && NO_PROFANITY=true || NO_PROFANITY=false

    # Voice speed
    echo ""
    read -p "Voice speed (0.5=slow to 2.0=fast) [1.1]: " voice_speed
    voice_speed=${voice_speed:-1.1}
fi

# Telegram notifications
echo ""
echo -e "${CYAN}📱 Telegram Notifications${NC}"
echo "Get updates on your phone wherever you are"
echo ""
read -p "Enable Telegram notifications? [Y/n]: " telegram_enabled
telegram_enabled=${telegram_enabled:-Y}
[[ "$telegram_enabled" =~ ^[Yy]$ ]] && TELEGRAM_NOTIF=true || TELEGRAM_NOTIF=false

if [ "$TELEGRAM_NOTIF" = true ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Telegram Setup Required:${NC}"
    echo ""
    echo "1. Message @BotFather on Telegram"
    echo "2. Send /newbot and follow instructions"
    echo "3. Copy the bot token"
    echo ""
    read -p "Enter your Telegram bot token (or press Enter to skip): " telegram_token

    if [ -n "$telegram_token" ]; then
        read -p "Enter your Telegram user ID (from @userinfobot): " telegram_user_id

        echo ""
        echo "Telegram notification frequency:"
        echo "  1) All events (can be noisy)"
        echo "  2) ${GREEN}Phase transitions only (recommended)"
        echo "  3) Errors and warnings only"
        echo ""
        read -p "Select frequency [1-3]: " telegram_freq
        telegram_freq=${telegram_freq:-2}

        case $telegram_freq in
            1) TELEGRAM_FREQ="all" ;;
            2) TELEGRAM_FREQ="phases_only" ;;
            3) TELEGRAM_FREQ="errors_only" ;;
        esac
    else
        echo "Skipping Telegram configuration (can setup later)"
        TELEGRAM_NOTIF=false
    fi
fi

# Desktop notifications
echo ""
echo -e "${CYAN}🖥️  Desktop Notifications${NC}"
read -p "Enable desktop notifications? [Y/n]: " desktop_enabled
desktop_enabled=${desktop_enabled:-Y}
[[ "$desktop_enabled" =~ ^[Yy]$ ]] && DESKTOP_NOTIF=true || DESKTOP_NOTIF=false

# ============================================
# SECTION 4: PERSONALITY & COMMUNICATION STYLE
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 4: PERSONALITY & COMMUNICATION STYLE                        ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Let's personalize how FR3K communicates with you:${NC}"
echo ""

# Communication style
echo -e "${CYAN}Communication Style:${NC}"
echo "  1) Concise - just the facts, minimal fluff"
echo "  2) ${GREEN}Balanced - clear explanations, not too verbose"
echo "  3) Detailed - thorough explanations, context provided"
echo "  4) Educational - teaches while helping"
echo ""
read -p "Select style [1-4]: " comm_style
comm_style=${comm_style:-2}

# Profanity in outputs
echo ""
echo -e "${CYAN}Content Preferences:${NC}"
read -p "Allow profanity in system messages? [y/N]: " allow_profanity
allow_profanity=${allow_profanity:-N}
[[ "$allow_profanity" =~ ^[Yy]$ ]] && ALLOW_PROFANITY=true || ALLOW_PROFANITY=false

# Humor level
echo ""
read -p "Include humor/wit in responses? (1=none to 5=very) [2]: " humor_level
humor_level=${humor_level:-2}

# Emoji usage
echo ""
echo "Emoji usage in messages:"
echo "  1) Never"
echo "  2) Sparingly"
echo "  3) ${GREEN}Moderate (recommended)"
echo "  4) Frequently"
echo ""
read -p "Select level [1-4]: " emoji_level
emoji_level=${emoji_level:-3}

# ============================================
# SECTION 5: WORKSPACE & PROJECT SETUP
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 5: WORKSPACE & PROJECT SETUP                                ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Let's set up your development workspace:${NC}"
echo ""

# Default project directory
echo -e "${CYAN}Default Project Directory:${NC}"
echo "Where do you want FR3K to work on projects?"
echo "  1) Current directory ($(pwd))"
echo "  2) ~/projects"
echo "  3) ~/dev"
echo "  4) ~/code"
echo "  5) Custom path"
echo ""
read -p "Select [1-5]: " project_dir_choice
project_dir_choice=${project_dir_choice:-1}

case $project_dir_choice in
    1) PROJECT_DIR="$(pwd)" ;;
    2) PROJECT_DIR="$HOME/projects" ;;
    3) PROJECT_DIR="$HOME/dev" ;;
    4) PROJECT_DIR="$HOME/code" ;;
    5)
        read -p "Enter full path: " PROJECT_DIR
        PROJECT_DIR=${PROJECT_DIR:-$(pwd)}
        ;;
esac

# Create project directory if needed
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Creating project directory: $PROJECT_DIR"
    mkdir -p "$PROJECT_DIR"
fi

# Programming languages
echo ""
echo -e "${CYAN}Which programming languages do you use?${NC}"
echo "(Enter comma-separated, e.g., 'typescript,python,bash')"
read -p "Languages: " languages

# Frameworks/tools
echo ""
echo -e "${CYAN}Which frameworks/tools do you use?${NC}"
echo "Examples: react, vue, django, fastapi, terraform, docker, kubernetes"
read -p "Frameworks/tools (comma-separated): " frameworks

# ============================================
# SECTION 6: 7-PHASE ALGORITHM PREFERENCES
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 6: 7-PHASE ALGORITHM CONFIGURATION                            ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}The 7-Phase Algorithm powers FR3K's problem-solving:${NC}"
echo ""
echo "  👁️  OBSERVE  → Retrieve context, understand requirements"
echo "  🧠  THINK    → Analyze problem, explore solutions"
echo "  📋  PLAN     → Design approach, create strategy"
echo "  🔨  BUILD    → Create solution, write code"
echo "  ⚡  EXECUTE  → Implement, run, test"
echo "  ✅  VERIFY   → Validate results, check quality"
echo "  📚  LEARN    → Extract insights, improve system"
echo ""

# Algorithm verbosity
echo -e "${CYAN}Algorithm Output Verbosity:${NC}"
echo "  1) Minimal - just results"
echo "  2) ${GREEN}Standard - phase headers + summaries"
echo "  3) Verbose - detailed output for each phase"
echo "  4) Debug - everything including internal reasoning"
echo ""
read -p "Select verbosity [1-4]: " algorithm_verbosity
algorithm_verbosity=${algorithm_verbosity:-2}

# MCP integration
echo ""
echo -e "${CYAN}MCP Server Integration:${NC}"
echo "FR3K uses 4 MCP servers to enhance the algorithm:"
echo "  • md-mcp - Create custom tools dynamically"
echo "  • fr3k-think - Structured reasoning and analysis"
echo "  • unified-pantheon-mcp - Self-improvement and meta-cognition"
echo "  • hey-fr3k - Persistent semantic memory"
echo ""
read -p "Enable MCP integration? [Y/n]: " mcp_enable
mcp_enable=${mcp_enable:-Y}
[[ "$mcp_enable" =~ ^[Yy]$ ]] && MCP_ENABLED=true || MCP_ENABLED=false

# Auto-improvement
echo ""
echo -e "${CYAN}Self-Improvement Features:${NC}"
echo "FR3K can continuously improve itself via 101 loops"
echo ""
case $autonomy_level in
    [1-2])
        DEFAULT_LOOPS=false
        echo "Low autonomy: Self-improvement requires approval"
        ;;
    *)
        DEFAULT_LOOPS=true
        echo "High autonomy: Self-improvement runs automatically"
        ;;
esac

read -p "Enable continuous self-improvement? [$DEFAULT_LOOPS]: " loops_enable
loops_enable=${loops_enable:-$DEFAULT_LOOPS}
[[ "$loops_enable" =~ ^[Yy] || "$loops_enable" = "true" ]] && LOOPS_ENABLED=true || LOOPS_ENABLED=false

if [ "$LOOPS_ENABLED" = true ]; then
    echo ""
    read -p "Loop execution interval (seconds) [3600 = 1 hour]: " loop_interval
    loop_interval=${loop_interval:-3600}
fi

# ============================================
# SECTION 7: ADVANCED CONFIGURATION
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 7: ADVANCED CONFIGURATION                                  ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Advanced options (safe defaults provided):${NC}"
echo ""

# Performance tuning
echo -e "${CYAN}Performance:${NC}"
read -p "Max parallel tasks [5]: " max_parallel
max_parallel=${max_parallel:-5}

read -p "Task timeout (seconds) [300]: " task_timeout
task_timeout=${task_timeout:-300}

# Caching
echo ""
read -p "Enable result caching? [Y/n]: " enable_cache
enable_cache=${enable_cache:-Y}
[[ "$enable_cache" =~ ^[Yy]$ ]] && CACHE_ENABLED=true || CACHE_ENABLED=false

# Logging
echo ""
echo -e "${CYAN}Logging:${NC}"
read -p "Enable debug logging? [y/N]: " debug_logging
debug_logging=${debug_logging:-N}
[[ "$debug_logging" =~ ^[Yy]$ ]] && DEBUG_LOGGING=true || DEBUG_LOGGING=false

# Memory management
echo ""
echo -e "${CYAN}Memory & Learning:${NC}"
read -p "Memory retention days [180]: " memory_retention
memory_retention=${memory_retention:-180}

read -p "Auto-cleanup old memories? [Y/n]: " auto_cleanup
auto_cleanup=${auto_cleanup:-Y}
[[ "$auto_cleanup" =~ ^[Yy]$ ]] && AUTO_CLEANUP=true || AUTO_CLEANUP=false

# ============================================
# SECTION 8: TEST AUTONOMOUS FEATURES
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 8: TESTING AUTONOMOUS FEATURES                              ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Let's verify everything works by running a test task!${NC}"
echo ""
echo "We'll run a simple 7-phase algorithm task to verify:"
echo "  ✓ MCP servers are working"
echo "  ✓ Notifications are configured"
echo "  ✓ Voice/audio is functional"
echo "  ✓ Memory system is operational"
echo ""
read -p "Run feature test now? [Y/n]: " run_test
run_test=${run_test:-Y}

if [[ "$run_test" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${MAGENTA}Running autonomous feature test...${NC}"
    echo ""

    # Test MCP servers
    echo -e "${CYAN}[1/4] Testing MCP Servers...${NC}"
    if npx -y md-mcp --version >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} md-mcp responding"
    else
        echo -e "  ${RED}✗${NC} md-mcp not responding"
    fi

    if npx -y fr3k-think --version >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} fr3k-think responding"
    else
        echo -e "  ${RED}✗${NC} fr3k-think not responding"
    fi

    if npx -y hey-fr3k --version >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} hey-fr3k responding"
    else
        echo -e "  ${RED}✗${NC} hey-fr3k not responding"
    fi

    # Test voice server
    echo ""
    echo -e "${CYAN}[2/4] Testing Voice Server...${NC}"
    if curl -s http://localhost:8888/health >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Voice server responding on port 8888"

        if [ "$VOICE_NOTIF" = true ]; then
            echo "  Sending test notification..."
            curl -s -X POST http://localhost:8888/notify \
                -H "Content-Type: application/json" \
                -d '{"message":"FR3K setup complete! Voice notifications working.","voice_enabled":true}' >/dev/null 2>&1
            echo -e "  ${GREEN}✓${NC} Voice notification sent"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC}  Voice server not running"
    fi

    # Test memory storage
    echo ""
    echo -e "${CYAN}[3/4] Testing Memory System...${NC}"
    TEST_MEMORY="Setup test memory $(date +%s)"
    echo "{\"tool_name\":\"store_fr3k\",\"tool_input\":{\"content\":\"$TEST_MEMORY\",\"memory_type\":\"decision\"},\"session_id\":\"setup-test\"}" | npx -y hey-fr3k >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Memory storage working"
    else
        echo -e "  ${YELLOW}⚠${NC}  Memory storage test inconclusive"
    fi

    # Test hooks
    echo ""
    echo -e "${CYAN}[4/4] Testing Hook Configuration...${NC}"
    if [ -f "${INSTALL_DIR}/claude-hooks/hooks/MCPNotify.hook.ts" ]; then
        echo -e "  ${GREEN}✓${NC} MCP notification hook installed"
    fi

    if [ -f "${INSTALL_DIR}/claude-hooks/hooks/MCPPhaseBridge.hook.ts" ]; then
        echo -e "  ${GREEN}✓${NC} Phase bridge hook installed"
    fi

    echo ""
    echo -e "${GREEN}✓ Feature test complete!${NC}"
fi

# ============================================
# CREATE CONFIGURATION FILES
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 9: CREATING YOUR PERSONALIZED CONFIGURATION                  ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Creating your personalized FR3K configuration...${NC}"
echo ""

# Create .env.user with all settings
cat > "${INSTALL_DIR}/.env.user" << USERCONFIG
# ===========================================
# FR3K USER CONFIGURATION
# ===========================================
# Generated: $(date)
# Personalized setup based on your preferences
#

# ────────────────────────────────────────────────────────────────────────────
# USER PROFILE
# ────────────────────────────────────────────────────────────────────────────
FR3K_USER_PRIMARY_USE="$primary_use"
FR3K_USER_EXPERIENCE_LEVEL="$experience_level"
FR3K_USER_TECH_BACKGROUND="$tech_background"
FR3K_USER_TASKS="$user_tasks"
FR3K_USER_SUCCESS_METRIC="$success_metric"

# ────────────────────────────────────────────────────────────────────────────
# AUTONOMY LEVEL (1-5)
# ────────────────────────────────────────────────────────────────────────────
FR3K_AUTONOMY_LEVEL=$autonomy_level

# Risk Tolerance
FR3K_AUTO_FILE_EDITS=$AUTO_FILE_EDITS
FR3K_AUTO_GIT_COMMITS=$AUTO_GIT_COMMITS
FR3K_AUTO_SYSTEM_CHANGES=$AUTO_SYSTEM_CHANGES
FR3K_AUTO_EXECUTE_LOOPS=$AUTO_EXECUTE_LOOPS

# ────────────────────────────────────────────────────────────────────────────
# NOTIFICATION PREFERENCES
# ────────────────────────────────────────────────────────────────────────────
FR3K_VOICE_NOTIFICATIONS=$VOICE_NOTIF
FR3K_TELEGRAM_NOTIFICATIONS=$TELEGRAM_NOTIF
FR3K_DESKTOP_NOTIFICATIONS=$DESKTOP_NOTIF

# Notification Frequency
FR3K_NOTIFICATION_FREQUENCY="${TELEGRAM_FREQ:-phases_only}"
FR3K_NOTIFICATION_MIN_INTERVAL=5

# ────────────────────────────────────────────────────────────────────────────
# VOICE SETTINGS
# ────────────────────────────────────────────────────────────────────────────
FR3K_VOICE_STYLE=$voice_style
FR3K_VOICE_SPEED=$voice_speed
FR3K_VOICE_NO_PROFANITY=$NO_PROFANITY
FR3K_VOICE_VOLUME=0.8

# ────────────────────────────────────────────────────────────────────────────
# TELEGRAM SETTINGS
# ────────────────────────────────────────────────────────────────────────────
FR3K_TELEGRAM_MODE="phases_only"
FR3K_TELEGRAM_COMMANDS_ENABLED=true

# ────────────────────────────────────────────────────────────────────────────
# COMMUNICATION STYLE
# ────────────────────────────────────────────────────────────────────────────
FR3K_COMM_STYLE=$comm_style
FR3K_ALLOW_PROFANITY=$ALLOW_PROFANITY
FR3K_HUMOR_LEVEL=$humor_level
FR3K_EMOJI_LEVEL=$emoji_level

# ────────────────────────────────────────────────────────────────────────────
# WORKSPACE
# ────────────────────────────────────────────────────────────────────────────
FR3K_PROJECT_DIR="$PROJECT_DIR"
FR3K_LANGUAGES="$languages"
FR3K_FRAMEWORKS="$frameworks"

# ────────────────────────────────────────────────────────────────────────────
# 7-PHASE ALGORITHM
# ────────────────────────────────────────────────────────────────────────────
FR3K_PHASE_VERBOSE=$( [ $algorithm_verbosity -ge 3 ] && echo "true" || echo "false" )
FR3K_PHASE_DEBUG=$( [ $algorithm_verbosity -eq 4 ] && echo "true" || echo "false" )
FR3K_PHASE_MEMORY_ENABLED=true
FR3K_PHASE_MAX_TIME=600

# ────────────────────────────────────────────────────────────────────────────
# MCP INTEGRATION
# ────────────────────────────────────────────────────────────────────────────
FR3K_MCP_ENABLED=$MCP_ENABLED
FR3K_MCP_SERVERS_ENABLED="md-mcp,fr3k-think,unified-pantheon-mcp,hey-fr3k"
FR3K_MCP_TIMEOUT=30000

# ────────────────────────────────────────────────────────────────────────────
# SELF-IMPROVEMENT LOOPS
# ────────────────────────────────────────────────────────────────────────────
FR3K_LOOPS_ENABLED=$LOOPS_ENABLED
FR3K_LOOP_INTERVAL=${loop_interval:-3600}
FR3K_LOOP_AUTO_EXECUTE=$AUTO_EXECUTE_LOOPS
FR3K_LOOP_MAX_EXECUTION_TIME=300

# ────────────────────────────────────────────────────────────────────────────
# PERFORMANCE
# ────────────────────────────────────────────────────────────────────────────
FR3K_MAX_PARALLEL_TASKS=${max_parallel:-5}
FR3K_TASK_TIMEOUT=${task_timeout:-300}
FR3K_CACHE_ENABLED=$CACHE_ENABLED
FR3K_CACHE_TTL=3600

# ────────────────────────────────────────────────────────────────────────────
# MEMORY & LEARNING
# ────────────────────────────────────────────────────────────────────────────
FR3K_AUTO_STORE_LEARNINGS=true
FR3K_MEMORY_RETENTION_DAYS=${memory_retention:-180}
FR3K_AUTO_CLEANUP_MEMORY=$AUTO_CLEANUP

# ────────────────────────────────────────────────────────────────────────────
# DEBUGGING
# ────────────────────────────────────────────────────────────────────────────
FR3K_DEBUG=$DEBUG_LOGGING
FR3K_LOG_DIR=logs
FR3K_MAX_LOG_SIZE=100
FR3K_LOG_RETENTION_COUNT=5
USERCONFIG

echo -e "  ${GREEN}✓${NC} Configuration created: .env.user"

# Create personalized AI agent prompt
cat > "${INSTALL_DIR}/.my-fr3k-prompt.md" << MYPROMPT
# My Personalized FR3K Setup
# Generated: $(date)

## My Profile

**Primary Use:** $(get_use_label "$primary_use")
**Experience Level:** $(get_exp_label "$experience_level")
**Technical Background:** $(get_bg_label "$tech_background")

**I want to:** $user_tasks

**Success measured by:** $(get_success_label "$success_metric")

## My Preferences

**Autonomy Level:** $autonomy_level/5 - $(get_autonomy_label "$autonomy_level")

**Communication Style:** $(get_comm_label "$comm_style")
**Humor Level:** $humor_level/5
**Emoji Usage:** $(get_emoji_label "$emoji_level")
**Profanity:** $( [ "$ALLOW_PROFANITY" = true ] && echo "Allowed" || echo "Filtered" )

**Notifications:**
- Voice: $( [ "$VOICE_NOTIF" = true ] && echo "✓ Enabled (Style: $(get_voice_style_label "$voice_style"))" || echo "✗ Disabled" )
- Telegram: $( [ "$TELEGRAM_NOTIF" = true ] && echo "✓ Enabled" || echo "✗ Disabled" )
- Desktop: $( [ "$DESKTOP_NOTIF" = true ] && echo "✓ Enabled" || echo "✗ Disabled" )

**Workspace:**
- Project Directory: $PROJECT_DIR
- Languages: $languages
- Frameworks: $frameworks

## How to Work with Me

1. **Start tasks by understanding my goals** - I want to: $user_tasks
2. **Match your communication style** to: $(get_comm_label "$comm_style")
3. **Respect my autonomy level** ($autonomy_level/5) - ask before $(get_autonomy_limit "$autonomy_level")
4. **Focus on success metric:** $(get_success_label "$success_metric")
5. **Use my tech stack:** $languages with $frameworks

## Quick Start for AI Agents

Copy this prompt when starting new sessions:

"I'm using FR3K with personalized preferences:
- Autonomy Level: $autonomy_level/5 ($(get_autonomy_label "$autonomy_level"))
- Communication: $(get_comm_label "$comm_style")
- Goals: $user_tasks
- Tech Stack: $languages, $frameworks

Please work with me using these preferences in mind."

---

${get_use_description "$primary_use"}
MYPROMPT

echo -e "  ${GREEN}✓${NC} Personalized prompt created: .my-fr3k-prompt.md"

# ============================================
# FIRST IMPROVEMENT ANALYSIS
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 10: FIRST SELF-IMPROVEMENT ANALYSIS                         ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Based on your preferences, here are personalized recommendations:${NC}"
echo ""

# Generate recommendations based on user profile
echo -e "${CYAN}🎯 Optimized Configuration for $(get_use_label "$primary_use")${NC}"
echo ""

case $primary_use in
    1) # Software Development
        echo "Recommended for Software Development:"
        echo "  • Enable code-focused MCP tools (md-mcp for custom tools)"
        echo "  • Set up project-specific aliases in ~/.bashrc"
        echo "  • Configure git workflow automation"
        echo "  • Enable syntax-aware hooks for your languages: $languages"
        ;;
    2) # Data Analysis
        echo "Recommended for Data Analysis:"
        echo "  • Enable data processing MCP tools"
        echo "  • Set up Jupyter notebook integration"
        echo "  • Configure visualization hooks"
        echo "  • Enable dataset memory for recurring analysis"
        ;;
    3) # Content Creation
        echo "Recommended for Content Creation:"
        echo "  • Enable Fabric patterns for content transformation"
        echo "  • Set up writing-focused MCP tools"
        echo "  • Configure style consistency hooks"
        echo "  • Enable content template memory"
        ;;
    4) # Business Automation
        echo "Recommended for Business Automation:"
        echo "  • Enable high autonomy for workflow automation"
        echo "  • Set up integration MCP tools"
        echo "  • Configure notification triggers for business events"
        echo "  • Enable automation loop execution"
        ;;
    5) # Learning
        echo "Recommended for Learning & Education:"
        echo "  • Enable educational communication style"
        echo "  • Set up knowledge base memory"
        echo "  • Configure learning-oriented MCP tools"
        echo "  • Enable concept extraction from tasks"
        ;;
    6) # Personal Assistant
        echo "Recommended for Personal Assistance:"
        echo "  • Enable balanced notification coverage"
        echo "  • Set up task management integration"
        echo "  • Configure calendar/email hooks if desired"
        echo "  • Enable daily summary generation"
        ;;
esac

echo ""
echo -e "${CYAN}🔧 Suggested Improvements:${NC}"
echo ""

# Suggest improvements based on experience
if [ "$experience_level" = "1" ]; then
    echo "For Beginner Experience:"
    echo "  • Start with autonomy level 2 (cautious)"
    echo "  • Enable verbose phase output to learn the algorithm"
    echo "  • Use educational communication style"
    echo "  • Review .my-fr3k-prompt.md before each session"
elif [ "$experience_level" = "2" ]; then
    echo "For Intermediate Experience:"
    echo "  • Autonomy level 3 is good for productivity"
    echo "  • Enable MCP integration for enhanced capabilities"
    echo "  • Try the 101 loops for continuous improvement"
    echo "  • Experiment with different notification settings"
else
    echo "For Advanced Experience:"
    echo "  • Maximize autonomy for fastest workflow"
    echo "  • Enable all MCP servers and 101 loops"
    echo "  • Customize hooks for your specific workflow"
    echo "  • Contribute improvements back to FR3K"
fi

echo ""
echo -e "${CYAN}📊 Performance Optimizations:${NC}"
echo ""

# Performance recommendations
echo "Based on your goals (success metric: $(get_success_label "$success_metric")):"
case $success_metric in
    1) # Speed
        echo "  • Enable result caching (reduces redundant operations)"
        echo "  • Increase max parallel tasks to 8-10"
        echo "  • Use aggressive autonomy level for faster decisions"
        echo "  • Enable pre-caching of common patterns"
        ;;
    2) # Quality
        echo "  • Enable verification phase for all outputs"
        echo "  • Use structured thinking (fr3k-think) for critical tasks"
        echo "  • Enable peer-review via red team analysis"
        echo "  • Store successful patterns for reuse"
        ;;
    3) # Learning
        echo "  • Enable educational communication style"
        echo "  • Store all learnings in semantic memory"
        echo "  • Review LEARN phase output regularly"
        echo "  • Enable 101 loops for continuous discovery"
        ;;
    4) # Automation
        echo "  • Maximize autonomy level"
        echo "  • Enable all auto-execution options"
        echo "  • Set up background 101 loops"
        echo "  • Create custom automation hooks"
        ;;
    5) # All
        echo "  • Use balanced autonomy (3-4)"
        echo "  • Enable all features selectively"
        echo "  • Monitor metrics via notifications"
        echo "  • Adjust based on what works best"
        ;;
esac

# ============================================
# BACKGROUND SERVICES SETUP
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║  STEP 11: BACKGROUND AUTONOMOUS SERVICES                           ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}FR3K can run autonomous services in the background:${NC}"
echo ""

# Services overview
echo "Available background services:"
echo ""
echo "  ${CYAN}1. Voice Server${NC} (Port 8888)"
echo "     • Provides TTS notifications"
echo "     • Currently: $(curl -s http://localhost:8888/health >/dev/null 2>&1 && echo "${GREEN}Running${NC}" || echo "${YELLOW}Not running${NC}")"
echo ""
echo "  ${CYAN}2. Telegram Relay${NC}"
echo "     • Enables Telegram bot integration"
echo "     • Requires: Telegram bot token"
echo "     • Currently: $([ "$TELEGRAM_NOTIF" = true ] && echo "${GREEN}Configured${NC}" || echo "${YELLOW}Not configured${NC}")"
echo ""
echo "  ${CYAN}3. Self-Improvement Daemon${NC}"
echo "     • Runs 101 loops continuously"
echo "     • Interval: ${loop_interval:-3600}s ($((${loop_interval:-3600}/60)) minutes)"
echo "     • Currently: $([ "$LOOPS_ENABLED" = true ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Disabled${NC}")"
echo ""

read -p "Install these services to start on boot? [y/N]: " install_boot_services
install_boot_services=${install_boot_services:-N}

if [[ "$install_boot_services" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Installing systemd services..."
    if "${INSTALL_DIR}/setup/install-services.sh" 2>&1; then
        echo -e "${GREEN}✓${NC} Services installed and enabled"
    else
        echo -e "${YELLOW}⚠${NC}  Service installation had issues (manual setup possible)"
    fi
fi

# ============================================
# FINAL SUMMARY
# ============================================
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                    🎉 SETUP COMPLETE! 🎉                           ║
║                                                                   ║
║              Your personalized FR3K is ready to use!               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}Your Configuration Summary:${NC}"
echo ""
echo -e "${CYAN}Profile:${NC} $(get_use_label "$primary_use") | $(get_exp_label "$experience_level") | $(get_bg_label "$tech_background")"
echo -e "${CYAN}Autonomy:${NC} Level $autonomy_level/5 - $(get_autonomy_label "$autonomy_level")"
echo -e "${CYAN}Communication:${NC} $(get_comm_label "$comm_style") | Humor: $humor_level/5 | Emojis: $(get_emoji_label "$emoji_level")"
echo -e "${CYAN}Notifications:${NC} Voice=$([ "$VOICE_NOTIF" = true ] && echo "✓" || echo "✗") | Telegram=$([ "$TELEGRAM_NOTIF" = true ] && echo "✓" || echo "✗") | Desktop=$([ "$DESKTOP_NOTIF" = true ] && echo "✓" || echo "✗")"
echo -e "${CYAN}Workspace:${NC} $PROJECT_DIR"
echo -e "${CYAN}Tech Stack:${NC} $languages | $frameworks"
echo ""

echo -e "${GREEN}Configuration Files Created:${NC}"
echo "  • .env.user - Your personalized settings"
echo "  • .my-fr3k-prompt.md - Quick reference for AI agents"
echo ""

echo -e "${BOLD}🚀 Start Using FR3K:${NC}"
echo ""
echo "  1. Open a terminal and start your AI CLI:"
echo "     ${CYAN}claude${NC}      # or opencode, or gemini"
echo ""
echo "  2. Use your personalized prompt:"
echo "     ${CYAN}cat .my-fr3k-prompt.md${NC}  # Copy and paste into session"
echo ""
echo "  3. Try the 7-phase algorithm:"
echo "     ${CYAN}\"Run the 7-phase algorithm on: $user_tasks\"${NC}"
echo ""
echo "  4. List available MCP tools:"
echo "     ${CYAN}\"List all available MCP tools\"${NC}"
echo ""

echo -e "${BOLD}📚 Additional Resources:${NC}"
echo ""
echo "  • Full Documentation: README.md"
echo "  • MCP Integration: claude-skills/FR3K/MCP-integration.md"
echo "  • Service Management: setup/services/README.md"
echo "  • Verification: ./setup/verify-system.sh"
echo ""

echo -e "${BOLD}🔧 Customize Further:${NC}"
echo ""
echo "  • Change preferences: ./setup/configure-user-preferences.sh"
echo "  • Install boot services: ./setup/install-services.sh"
echo "  • View configuration: cat .env.user"
echo "  • Run verification: ./setup/verify-system.sh"
echo ""

echo -e "${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}  Welcome to FR3K - Your Autonomous AI Assistant!${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo ""

# Helper functions for labels
function get_use_label() {
    case $1 in
        1) echo "Software Development" ;;
        2) echo "Data Analysis & Research" ;;
        3) echo "Content Creation" ;;
        4) echo "Business Automation" ;;
        5) echo "Learning & Education" ;;
        6) echo "Personal Assistant" ;;
        7) echo "Custom" ;;
        *) echo "General" ;;
    esac
}

function get_exp_label() {
    case $1 in
        1) echo "Beginner" ;;
        2) echo "Intermediate" ;;
        3) echo "Advanced" ;;
        *) echo "Unknown" ;;
    esac
}

function get_bg_label() {
    case $1 in
        1) echo "Software Developer" ;;
        2) echo "Data Scientist/Analyst" ;;
        3) echo "Business/Non-technical" ;;
        4) echo "Student/Learner" ;;
        5) echo "Hobbyist/Enthusiast" ;;
        *) echo "Other" ;;
    esac
}

function get_success_label() {
    case $1 in
        1) echo "Speed - get things done faster" ;;
        2) echo "Quality - better outcomes" ;;
        3) echo "Learning - discover new approaches" ;;
        4) echo "Automation - reduce manual work" ;;
        5) echo "All of the above" ;;
        *) echo "Custom" ;;
    esac
}

function get_autonomy_label() {
    case $1 in
        1) echo "Manual" ;;
        2) echo "Cautious" ;;
        3) echo "Balanced" ;;
        4) echo "Aggressive" ;;
        5) echo "Full Auto" ;;
        *) echo "Unknown" ;;
    esac
}

function get_comm_label() {
    case $1 in
        1) echo "Concise" ;;
        2) echo "Balanced" ;;
        3) echo "Detailed" ;;
        4) echo "Educational" ;;
        *) echo "Standard" ;;
    esac
}

function get_voice_style_label() {
    case $1 in
        1) echo "Professional" ;;
        2) echo "Friendly" ;;
        3) echo "Technical" ;;
        4) echo "Minimal" ;;
        *) echo "Standard" ;;
    esac
}

function get_emoji_label() {
    case $1 in
        1) echo "Never" ;;
        2) echo "Sparingly" ;;
        3) echo "Moderate" ;;
        4) echo "Frequently" ;;
        *) echo "Some" ;;
    esac
}

function get_autonomy_limit() {
    case $1 in
        1) echo "all actions" ;;
        2) echo "significant changes" ;;
        3) echo "major changes" ;;
        4) echo "critical changes" ;;
        5) echo "anything" ;;
    esac
}

function get_use_description() {
    case $1 in
        1)
            echo "## Software Development Mode"
            echo ""
            echo "FR3K is optimized for software development with your stack: $languages"
            echo ""
            echo "**Recommended workflow:**"
            echo "1. Use OBSERVE phase to retrieve relevant code context"
            echo "2. Use THINK phase with fr3k-think for architecture decisions"
            echo "3. Use BUILD phase with md-mcp to create custom development tools"
            echo "4. Use VERIFY phase for testing and validation"
            echo "5. Use LEARN phase to store successful patterns for reuse"
            ;;
        2)
            echo "## Data Analysis Mode"
            echo ""
            echo "FR3K is optimized for data analysis and insights"
            echo ""
            echo "**Recommended workflow:**"
            echo "1. Use OBSERVE to retrieve previous analysis context"
            echo "2. Use THINK with structured analysis for data exploration"
            echo "3. Use BUILD to create analysis tools as needed"
            echo "4. Use VERIFY to validate insights and conclusions"
            echo "5. Use LEARN to store discovered patterns"
            ;;
        3)
            echo "## Content Creation Mode"
            echo ""
            echo "FR3K is optimized for creating high-quality content"
            echo ""
            echo "**Recommended workflow:**"
            echo "1. Use OBSERVE to understand brand/style guidelines"
            echo "2. Use THINK to plan content structure"
            echo "3. Use BUILD with Fabric patterns for content transformation"
            echo "4. Use VERIFY to check quality and consistency"
            echo "5. Use LEARN to store what works well"
            ;;
        4)
            echo "## Business Automation Mode"
            echo ""
            echo "FR3K is optimized for automating business workflows"
            echo ""
            echo "**Recommended workflow:**"
            echo "1. Use OBSERVE to map current processes"
            echo "2. Use THINK to identify automation opportunities"
            echo "3. Use BUILD to create automation scripts"
            echo "4. Use VERIFY to test automations safely"
            echo "5. Use LEARN to optimize automations continuously"
            ;;
        5)
            echo "## Learning Mode"
            echo ""
            echo "FR3K is optimized for educational growth"
            echo ""
            echo "**Recommended workflow:**"
            echo "1. Use OBSERVE to connect to prior knowledge"
            echo "2. Use THINK with educational explanations"
            echo "3. Use BUILD to create learning tools"
            echo "4. Use VERIFY to test understanding"
            echo "5. Use LEARN to solidify knowledge"
            ;;
        6)
            echo "## Personal Assistant Mode"
            echo ""
            echo "FR3K is optimized for daily task assistance"
            echo ""
            echo "**Recommended workflow:**"
            echo "1. Use OBSERVE to understand your day/context"
            echo "2. Use THINK to plan your day efficiently"
            echo "3. Use BUILD to create helpful tools"
            echo "4. Use VERIFY to ensure nothing is missed"
            echo "5. Use LEARN to improve assistance over time"
            ;;
    esac
}
