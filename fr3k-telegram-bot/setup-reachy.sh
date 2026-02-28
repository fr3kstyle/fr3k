#!/bin/bash
# Quick setup script for Reachy Mini integration

set -e

echo "🤖 Reachy Mini Integration Setup"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << 'EOF'
# PAI Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_USER_ID=8188688460

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
EOF
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  Please edit .env and add:"
    echo "   1. Your ElevenLabs API key"
    echo "   2. Your ElevenLabs Agent ID (from Hugging Face Space)"
    echo ""
    echo "Get your agent ID from:"
    echo "https://huggingface.co/spaces/mindmodelai/reachy-mini-elevenlabs"
    echo ""
    exit 1
fi

# Source .env
echo "📋 Loading configuration..."
source .env

# Validate required variables
if [ -z "$ELEVENLABS_API_KEY" ] || [ "$ELEVENLABS_API_KEY" = "your_elevenlabs_api_key_here" ]; then
    echo "❌ ELEVENLABS_API_KEY not set in .env"
    echo "   Get your API key from: https://elevenlabs.io/app/settings/api-keys"
    exit 1
fi

if [ -z "$ELEVENLABS_AGENT_ID" ] || [ "$ELEVENLABS_AGENT_ID" = "your_agent_id_here" ]; then
    echo "❌ ELEVENLABS_AGENT_ID not set in .env"
    echo "   Create agent at: https://huggingface.co/spaces/mindmodelai/reachy-mini-elevenlabs"
    exit 1
fi

echo "✅ Configuration loaded"
echo ""
echo "Configuration:"
echo "  Telegram User ID: $TELEGRAM_USER_ID"
echo "  ElevenLabs Agent: $ELEVENLABS_AGENT_ID"
echo "  API Key: ${ELEVENLABS_API_KEY:0:10}..."
echo ""

# Check if Reachy integration agent exists
if [ ! -f "agents/reachy-integration.ts" ]; then
    echo "❌ Reachy integration agent not found"
    exit 1
fi

echo "✅ Integration agent found"
echo ""

# Test agent syntax
echo "🔍 Checking agent syntax..."
bun --check agents/reachy-integration.ts

if [ $? -eq 0 ]; then
    echo "✅ Agent syntax valid"
else
    echo "❌ Agent has syntax errors"
    exit 1
fi

echo ""
echo "🎯 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start integration: bun agents/reachy-integration.ts"
echo "  2. In Telegram, send: /reachy start"
echo "  3. Test with: /reachy status"
echo ""
echo "📚 Full documentation: REACHY_INTEGRATION.md"
echo ""
echo "🚀 Ready to integrate Reachy Mini with PAI!"
