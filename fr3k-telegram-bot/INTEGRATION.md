# FR3K Algorithm Telegram Integration

## Overview

The FR3K Algorithm automatically sends progress updates to Telegram during execution. This integration provides real-time visibility into Algorithm phase transitions.

## Architecture

```
FR3K Algorithm → CORE Format → telegram-phase-notify → Telegram Bot API
                                    ↓
                           send-phase-voice.ts (phases 3 & 6 only)
                                    ↓
                           EdgeTTS → Voice Message → Telegram
```

## Phase Notifications

**All Phases (1-7):**
- Text notification with phase name, title, and content
- Automatic detection of Telegram origin
- Sent via `telegram-phase-notify` wrapper

**Phases 3 & 6 (PLAN + VERIFY):**
- Text notification (same as above)
- **PLUS** voice audio overview generated via EdgeTTS
- Voice sent as separate Telegram voice message

## Usage

The CORE format template automatically calls these scripts at each phase transition:

```bash
# Phase 1-7 (text only)
telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "Analyzing requirements"

# Phase 3 (text + voice)
telegram-phase-notify 3 "PLAN" "Strategy" "Designing approach"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 3 "PLAN" "Strategy" "Designing approach"

# Phase 6 (text + voice)
telegram-phase-notify 6 "VERIFY" "Results" "Verifying implementation"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 6 "VERIFY" "Results" "Verifying implementation"
```

## Installation

### 1. Wrapper Script
Already installed at `~/.local/bin/telegram-phase-notify`:
```bash
#!/bin/bash
PHASE="$1"
PHASE_NAME="$2"
TITLE="$3"
CONTENT="$4"
bun ~/fr3k-telegram-bot/phase-notify.ts "$PHASE" "$PHASE_NAME" "$TITLE" "$CONTENT"
```

### 2. PATH Configuration
Added to `~/.bashrc`:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

## API Endpoints

### Phase Notification API
- **Endpoint:** `http://localhost:8898/api/phase-update`
- **Method:** POST
- **Managed by:** Main Telegram bot (`index.ts`)
- **Health check:** `http://localhost:8898/health`

### Telegram Bot API
- **Base URL:** `https://api.telegram.org/bot{TOKEN}/`
- **Methods:**
  - `/sendMessage` - Text messages (all phases)
  - `/sendVoice` - Voice messages (phases 3 & 6)

## Scripts

| Script | Purpose | Called By |
|--------|---------|-----------|
| `phase-notify.ts` | Send text updates to Telegram | CORE format (all phases) |
| `send-phase-voice.ts` | Generate + send voice overviews | CORE format (phases 3 & 6) |
| `telegram-phase-notify` | System wrapper for phase-notify.ts | CORE format |

## CORE Format Integration

The CORE template (`~/.claude/skills/FR3K/SKILL.md`) includes these calls at each phase:

```
telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "Analyzing: {task_summary}"
telegram-phase-notify 2 "THINK" "Analysis" "Using {thinking_tools} to assess {analysis_focus}"
telegram-phase-notify 3 "PLAN" "Strategy" "Designing {approach_type} approach"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 3 "PLAN" "{approach_type} Strategy" "Designing {approach_type} approach"
telegram-phase-notify 4 "BUILD" "Implementation" "Creating {artifact_type}"
telegram-phase-notify 5 "EXECUTE" "Running" "Executing {action} on {target}"
telegram-phase-notify 6 "VERIFY" "Results" "Verifying {verification_target}"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 6 "VERIFY" "Verification Results" "Verifying {verification_target}"
telegram-phase-notify 7 "LEARN" "Insights" "Learned: {key_insight}"
```

## Testing

### Test All Phases
```bash
bun ~/fr3k-telegram-bot/phase-notify.ts 1 "OBSERVE" "Test" "Testing phase 1"
bun ~/fr3k-telegram-bot/phase-notify.ts 2 "THINK" "Test" "Testing phase 2"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 3 "PLAN" "Test" "Testing phase 3"
bun ~/fr3k-telegram-bot/phase-notify.ts 4 "BUILD" "Test" "Testing phase 4"
bun ~/fr3k-telegram-bot/phase-notify.ts 5 "EXECUTE" "Test" "Testing phase 5"
bun ~/fr3k-telegram-bot/send-phase-voice.ts 6 "VERIFY" "Test" "Testing phase 6"
bun ~/fr3k-telegram-bot/phase-notify.ts 7 "LEARN" "Test" "Testing phase 7"
```

### Test Wrapper
```bash
telegram-phase-notify 1 "OBSERVE" "Wrapper Test" "Testing system-wide integration"
```

## Troubleshooting

### Command Not Found
If `telegram-phase-notify` is not found:
```bash
export PATH="$HOME/.local/bin:$PATH"
# Or reload shell: source ~/.bashrc
```

### API Not Running
If you get connection errors:
```bash
# Check if Telegram bot is running
systemctl --user status pai-telegram-bot.service

# Check API health
curl http://localhost:8898/health
```

### Voice Not Generated
If EdgeTTS fails:
```bash
# Check if edge-tts is installed
which edge-tls
# Should be: /home/fr3k/.local/bin/edge-tts

# Test EdgeTTS manually
edge-tts --text "Testing" --voice en-US-AvaNeural --write-media /tmp/test.mp3
```

## Verification Status

✅ **All components verified and operational:**
- Phase notification API running (port 8898)
- Telegram bot API integration working
- Text messages sent for all 7 phases
- Voice messages generated and sent for phases 3 & 6
- System wrapper installed and functional
- PATH configured for persistence
- CORE format template includes all calls

## Summary

Every time FR3K runs the Algorithm, you'll receive:
- **7 text updates** (one per phase) on Telegram
- **2 voice messages** (phases 3 & 6) with audio overviews
- **Total: 9 messages** per Algorithm execution

The system is fully automatic and requires no manual intervention.
