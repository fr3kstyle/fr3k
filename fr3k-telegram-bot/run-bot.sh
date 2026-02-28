#!/bin/bash
# Wrapper script for PAI Telegram Bot
# Handles systemd GROUP permission issues

cd /home/fr3k/pai-telegram-bot
exec /home/fr3k/.bun/bin/bun run index.ts
