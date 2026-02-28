#!/bin/bash
# FR3K Telegram Bot - Installation Script
# Sets up dependencies, configuration, and systemd service

set -e

BOT_DIR="$HOME/pai-telegram-bot"
SERVICE_FILE="$HOME/.config/systemd/user/pai-telegram-bot.service"

echo "🔧 FR3K Telegram Bot - Installation"
echo ""

# Check required tools
echo "🔍 Checking dependencies..."
if ! command -v bun &> /dev/null; then
  echo "❌ bun not found. Install from: https://bun.sh"
  exit 1
fi

if ! command -v systemctl &> /dev/null; then
  echo "⚠️  systemctl not found. Auto-start on boot won't work."
fi

echo "✅ All dependencies found"
echo ""

# Install npm dependencies
echo "📦 Installing npm packages..."
cd "$BOT_DIR"
bun install
echo "✅ Dependencies installed"
echo ""

# Create environment file template
if [ ! -f "$BOT_DIR/.env" ]; then
  echo "📝 Creating .env file..."
  cat > "$BOT_DIR/.env" << 'EOF'
# Telegram Bot Configuration
# Get your bot token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Your Telegram User ID (numeric, not username)
# Find it by messaging @userinfobot on Telegram
TELEGRAM_USER_ID=your_user_id_here

# Voice Server URL (if using voice notifications)
VOICE_SERVER_URL=http://localhost:8888

# FR3K API URL (if using external API)
FR3K_API_URL=http://localhost:3000/api
EOF
  echo "✅ .env file created"
  echo ""
  echo "⚠️  EDIT .env FILE BEFORE RUNNING:"
  echo "   1. Get bot token from @BotFather"
  echo "   2. Get user ID from @userinfobot"
  echo "   3. Update TELEGRAM_BOT_TOKEN and TELEGRAM_USER_ID"
  echo ""
fi

# Create systemd service
if command -v systemctl &> /dev/null; then
  echo "🔧 Setting up systemd service..."
  mkdir -p "$(dirname "$SERVICE_FILE")"

  cat > "$SERVICE_FILE" << EOF
[Unit]
Description=FR3K Telegram Bot - 3 Agent System
After=network.target

[Service]
Type=forking
WorkingDirectory=$BOT_DIR
ExecStart=$BOT_DIR/start-system.sh
ExecStop=$BOT_DIR/stop-system.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
EOF

  # Reload systemd
  systemctl --user daemon-reload 2>/dev/null || true

  echo "✅ Systemd service created"
  echo ""
  echo "🚀 Enable auto-start on boot:"
  echo "   systemctl --user enable pai-telegram-bot.service"
  echo ""
fi

# Make scripts executable
chmod +x "$BOT_DIR/start-system.sh"
chmod +x "$BOT_DIR/stop-system.sh"
chmod +x "$BOT_DIR/agents/"*.ts

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit $BOT_DIR/.env with your credentials"
echo "   2. Test: $BOT_DIR/start-system.sh"
echo "   3. Check logs: tail -f $BOT_DIR/logs/communication-agent.log"
echo ""
echo "📚 Documentation: See README.md for full setup guide"
