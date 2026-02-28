#!/bin/bash
# Main orchestrator for FR3K Self-Improvement System
# Runs research → analysis → integration → verification pipeline

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
MAIN_LOG="$LOG_DIR/daily-run-$(date +%Y%m%d-%H%M%S).log"
VOICE_SERVER_URL="http://localhost:8888"

# Create log directory
mkdir -p "$LOG_DIR"

echo "=== FR3K Daily Self-Improvement Run ===" | tee "$MAIN_LOG"
echo "Started: $(date)" | tee -a "$MAIN_LOG"
echo "" | tee -a "$MAIN_LOG"

# Voice notification: Starting
if command -v curl &> /dev/null; then
    curl -s -X POST "$VOICE_SERVER_URL/notify" \
        -H "Content-Type: application/json" \
        -d '{"message":"Starting daily self-improvement research and analysis","voice_id":"21m00Tcm4TlvDq8ikWAM"}' \
        2>/dev/null || true
fi

# Phase 1: Research
echo "" | tee -a "$MAIN_LOG"
echo "━━━ Phase 1: Research ━━━" | tee -a "$MAIN_LOG"
if bash "$SCRIPT_DIR/scripts/research.sh" >> "$MAIN_LOG" 2>&1; then
    RESEARCH_EXIT=$?
    echo "✅ Research complete: $RESEARCH_EXIT findings" | tee -a "$MAIN_LOG"
else
    echo "⚠️  Research encountered errors" | tee -a "$MAIN_LOG"
fi

# Phase 2: Analysis
echo "" | tee -a "$MAIN_LOG"
echo "━━━ Phase 2: Analysis ━━━" | tee -a "$MAIN_LOG"
if bash "$SCRIPT_DIR/scripts/analyze.sh" >> "$MAIN_LOG" 2>&1; then
    echo "✅ Analysis complete" | tee -a "$MAIN_LOG"
else
    echo "⚠️  Analysis encountered errors" | tee -a "$MAIN_LOG"
fi

# Check if there are actions to take
ACTIONS_FILE="$LOG_DIR/action-plan.json"
if [ -f "$ACTIONS_FILE" ]; then
    ACTIONS_COUNT=$(jq -r '.total_actions' "$ACTIONS_FILE" 2>/dev/null || echo "0")

    if [ "$ACTIONS_COUNT" -gt 0 ]; then
        echo "" | tee -a "$MAIN_LOG"
        echo "Found $ACTIONS_COUNT improvement opportunities" | tee -a "$MAIN_LOG"

        # Phase 3: Integration (dry-run first, then notify)
        echo "" | tee -a "$MAIN_LOG"
        echo "━━━ Phase 3: Integration (Dry-Run) ━━━" | tee -a "$MAIN_LOG"
        bash "$SCRIPT_DIR/scripts/integrate.sh" --dry-run >> "$MAIN_LOG" 2>&1 || true

        # Voice notification: Actions found
        if command -v curl &> /dev/null; then
            curl -s -X POST "$VOICE_SERVER_URL/notify" \
                -H "Content-Type: application/json" \
                -d "{\"message\":\"Daily self-improvement found $ACTIONS_COUNT potential improvements. Check the logs for details.\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}" \
                2>/dev/null || true
        fi
    else
        echo "" | tee -a "$MAIN_LOG"
        echo "No new improvements found. System is up to date!" | tee -a "$MAIN_LOG"
    fi
else
    echo "⚠️  Could not determine action count" | tee -a "$MAIN_LOG"
fi

# Phase 4: Verification
echo "" | tee -a "$MAIN_LOG"
echo "━━━ Phase 4: Verification ━━━" | tee -a "$MAIN_LOG"
if bash "$SCRIPT_DIR/scripts/verify.sh" >> "$MAIN_LOG" 2>&1; then
    VERIFY_RESULT="✅ System healthy"
    echo "✅ Verification passed" | tee -a "$MAIN_LOG"
else
    VERIFY_RESULT="⚠️  System has warnings or errors"
    echo "⚠️  Verification found issues" | tee -a "$MAIN_LOG"
fi

# Summary
echo "" | tee -a "$MAIN_LOG"
echo "=== Run Complete ===" | tee -a "$MAIN_LOG"
echo "Finished: $(date)" | tee -a "$MAIN_LOG"
echo "Log: $MAIN_LOG" | tee -a "$MAIN_LOG"
echo "" | tee -a "$MAIN_LOG"

# Voice notification: Complete
if command -v curl &> /dev/null; then
    curl -s -X POST "$VOICE_SERVER_URL/notify" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"Daily self-improvement complete. $VERIFY_RESULT\",\"voice_id\":\"21m00Tcm4TlvDq8ikWAM\"}" \
        2>/dev/null || true
fi

# Cleanup old logs (keep last 30 days)
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.json" -mtime +30 -delete 2>/dev/null || true

exit 0
