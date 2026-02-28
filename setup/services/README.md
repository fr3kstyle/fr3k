# FR3K System Services

## Overview

FR3K provides three optional systemd services for autonomous operation:

1. **fr3k-voice-server** - TTS notification server (port 8888)
2. **fr3k-telegram-relay** - Telegram bot integration
3. **fr3k-daemon** - 101 self-improvement loops background service

---

## Quick Start

### Installation

```bash
cd /mnt/sdcard/fr3k-export/setup
./install-services.sh
```

This will:
- Install service files to `/etc/systemd/system/`
- Enable services to start on boot
- Create convenience aliases in `~/.bashrc`

### Starting Services

```bash
# Start all services
sudo systemctl start fr3k-*

# Or use alias (after source ~/.bashrc)
fr3k-start
```

### Checking Status

```bash
# Check all services
sudo systemctl status fr3k-*

# Or use alias
fr3k-status
```

---

## Service Details

### 1. fr3k-voice-server

**Purpose:** Provides TTS notifications via HTTP endpoint

**Port:** 8888

**Endpoint:** `POST http://localhost:8888/notify`

**Request:**
```json
{
  "message": "Task completed",
  "title": "Notification",
  "voice_enabled": true
}
```

**Status Check:**
```bash
curl http://localhost:8888/health
```

**Logs:**
```bash
sudo journalctl -u fr3k-voice-server -f
```

---

### 2. fr3k-telegram-relay

**Purpose:** Integrates with Telegram bot for remote interaction

**Requires:** `TELEGRAM_BOT_TOKEN` in `.env`

**Features:**
- Remote command execution via Telegram
- Phase notifications during 7-phase algorithm
- Status queries

**Status Check:**
```bash
sudo systemctl status fr3k-telegram-relay
```

**Logs:**
```bash
sudo journalctl -u fr3k-telegram-relay -f
```

---

### 3. fr3k-daemon

**Purpose:** Runs 101 self-improvement loops continuously

**Behavior:**
- Monitors system for improvement opportunities
- Executes autonomous optimization loops
- Stores results in hey-fr3k database

**Status Check:**
```bash
sudo systemctl status fr3k-daemon
```

**Logs:**
```bash
sudo journalctl -u fr3k-daemon -f
```

---

## Aliases

After installation, these aliases are available:

### Service Control

```bash
fr3k-status    # Check all service status
fr3k-start     # Start all services
fr3k-stop      # Stop all services
fr3k-restart   # Restart all services
fr3k-logs      # View all service logs
```

### Individual Services

```bash
# Voice server
fr3k-voice          # Status
fr3k-voice-start    # Start
fr3k-voice-stop     # Stop
fr3k-voice-restart  # Restart
fr3k-voice-logs     # Logs

# Telegram relay
fr3k-telegram          # Status
fr3k-telegram-start    # Start
fr3k-telegram-stop     # Stop
fr3k-telegram-restart  # Restart
fr3k-telegram-logs     # Logs

# Daemon
fr3k-daemon          # Status
fr3k-daemon-start    # Start
fr3k-daemon-stop     # Stop
fr3k-daemon-restart  # Restart
fr3k-daemon-logs     # Logs
```

---

## Manual Installation

If you prefer to install services manually:

### 1. Install Service File

```bash
# Replace placeholders
sed -e "s|YOUR_USERNAME|$USER|g" \
    -e "s|INSTALL_DIR|/mnt/sdcard/fr3k-export|g" \
    /mnt/sdcard/fr3k-export/setup/voice-server.service | \
    sudo tee /etc/systemd/system/fr3k-voice-server.service
```

### 2. Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable fr3k-voice-server
sudo systemctl start fr3k-voice-server
```

### 3. Verify

```bash
sudo systemctl status fr3k-voice-server
```

---

## Removal

```bash
cd /mnt/sdcard/fr3k-export/setup
./uninstall-services.sh
```

This will:
- Stop all running services
- Disable services from boot
- Remove service files
- Remove aliases from `.bashrc`

---

## Troubleshooting

### Service Won't Start

1. Check status for error details:
```bash
sudo systemctl status fr3k-voice-server
```

2. Check logs:
```bash
sudo journalctl -u fr3k-voice-server -n 50
```

3. Common issues:
   - Port 8888 already in use (voice server)
   - TELEGRAM_BOT_TOKEN not set (telegram relay)
   - Missing dependencies (bun, node)

### Permission Errors

Services run as your user, but with systemd. Ensure:
- Files are readable by your user
- `.env` file has correct permissions
- Working directory exists

### Auto-Start Issues

If services don't start on boot:
1. Check if enabled: `sudo systemctl is-enabled fr3k-voice-server`
2. Enable: `sudo systemctl enable fr3k-voice-server`
3. Check logs for boot failures

---

## Integration with 7-Phase Algorithm

When services are running:

1. **Voice notifications** trigger at phase completions
2. **Telegram notifications** sent during algorithm execution
3. **101 loops** run continuously, storing improvements in hey-fr3k
4. **OBSERVE phase** retrieves loop results via hey-fr3k

---

**Status:** Ready for use
**Last Updated:** 2026-02-28
**Version:** 1.0.0
