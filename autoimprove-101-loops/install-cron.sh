#!/bin/bash
# Install the FR3K Self-Improvement cron job

set -euo pipefail

echo "=== FR3K Self-Improvement Cron Installation ==="
echo ""

# Check if already installed
if crontab -l 2>/dev/null | grep -q "daily-self-improvement.sh"; then
    echo "⚠️  Cron job already installed!"
    echo "To reinstall, first remove with: crontab -e"
    echo ""
    echo "Current entry:"
    crontab -l 2>/dev/null | grep "daily-self-improvement.sh"
    exit 0
fi

# Add to crontab
echo "Adding cron job (runs daily at 2:00 AM)..."

# Get current crontab (or empty if none)
(crontab -l 2>/dev/null; cat "$HOME/fr3k-self-improvement/cron-entry.txt") | crontab -

echo "✅ Cron job installed!"
echo ""
echo "To view: crontab -l"
echo "To edit: crontab -e"
echo "To remove: crontab -e (and delete the FR3K lines)"
echo ""
echo "Next run: $(date -d 'tomorrow 02:00' '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Test now? Run: $HOME/fr3k-self-improvement/daily-self-improvement.sh"
