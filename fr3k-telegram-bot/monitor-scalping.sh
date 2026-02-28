#!/bin/bash
# Continuous scalping trade monitor

cd /home/fr3k/pai-telegram-bot

while true; do
  clear
  echo "🤖 PAI SCALPING MONITOR - $(date '+%Y-%m-%d %H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  bun scalping-tracker.ts 2>&1 | head -80

  echo ""
  echo "🔄 Next update in 60 seconds... (Ctrl+C to stop)"
  sleep 60
done
