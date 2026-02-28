# FR3K System Requirements

## System Requirements

### Minimum
- **OS**: Linux (Debian 11+, Ubuntu 20.04+, or compatible)
- **RAM**: 2GB
- **Storage**: 10GB free space
- **CPU**: 2 cores

### Recommended
- **OS**: Debian 12+ or Ubuntu 22.04+
- **RAM**: 4GB+
- **Storage**: 20GB+ SSD
- **CPU**: 4+ cores

## Software Dependencies

### Core
- **Node.js**: v18+ (for npm and Claude Code CLI)
- **Bun**: v1.0+ (for TypeScript execution)
- **Python**: v3.8+ (for various utilities)
- **Git**: v2.0+ (for version control)

### Installation Commands

```bash
# Debian/Ubuntu
sudo apt update
sudo apt install -y git curl python3 python3-pip nodejs npm

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

## API Requirements

### Required APIs
1. **Anthropic Claude API**
   - Purpose: Core Claude Code functionality
   - Get from: https://console.anthropic.com/
   - Cost: Pay-per-use

2. **Telegram Bot API**
   - Purpose: Telegram bot communication
   - Get from: @BotFather on Telegram
   - Cost: Free

### Optional APIs
1. **ElevenLabs**
   - Purpose: Voice synthesis
   - Get from: https://elevenlabs.io/
   - Cost: Free tier available

2. **Google Gemini**
   - Purpose: Voice transcription
   - Get from: https://ai.google.dev/
   - Cost: Free tier available

3. **Supabase**
   - Purpose: Memory persistence
   - Get from: https://supabase.com/
   - Cost: Free tier available

## Network Requirements

### Outbound Connections
- `api.anthropic.com` - Anthropic API
- `api.telegram.org` - Telegram Bot API
- `api.elevenlabs.io` - ElevenLabs API (optional)
- `generativelanguage.googleapis.com` - Google API (optional)

### Ports Used
- **8888**: Voice Server (default)
- **Variable**: Telegram Relay (configurable)

## Directory Structure

The system will create the following directories:

```
~/.claude/              # Claude Code configuration
  ├── skills/           # Claude skills
  ├── hooks/            # Event hooks
  ├── projects/         # Project workspace
  └── settings.json     # Configuration

~/.fr3k/                # FR3K data directory
  ├── logs/             # System logs
  ├── memory/           # Memory storage
  ├── state/            # Runtime state
  └── sessions/         # Session data

~/.local/bin/           # Convenience scripts
  ├── fr3k-start        # Start all components
  ├── fr3k-stop         # Stop all components
  └── fr3k-status       # Check system status
```

## Permission Requirements

### Standard User
- Most components run as standard user
- No special privileges required

### Systemd Service (Optional)
- Requires sudo for installation
- Service runs as your user (not root)

## Security Considerations

1. **API Keys**: Never commit `.env` files
2. **File Permissions**: Sensitive files should be `600`
3. **Network**: Use HTTPS for all API calls
4. **Telegram**: Validate user IDs to prevent unauthorized access

## Troubleshooting Requirements

### Logging
- All logs stored in `~/.fr3k/logs/`
- Claude Code transcripts in `~/.claude/transcripts/`

### Monitoring
- Use `fr3k-status` to check component status
- Check logs for errors and warnings

### Debug Mode
- Set `DEBUG=1` in `.env` for verbose logging
