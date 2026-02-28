# Telegram Algorithm - Final Requirements

**Date:** 2026-02-23
**Status:** ✅ Requirements Clarified

## Phase Notifications

### All Phases (1-7)
- ✅ Send text notification to Telegram app
- ✅ Include good overview of phase content
- ✅ Use `telegram-phase-notify` helper

**Example:**
```bash
telegram-phase-notify 2 "THINK" "Capability Selection" "Using FirstPrinciples to assess requirements, selected Engineer for implementation with Specialist pattern"
```

### Phase 3 (PLAN) - Text + Voice
- ✅ Send text notification to Telegram
- ✅ Send voice audio message to Telegram
- ✅ Use `send-phase-voice.ts` helper

**Example:**
```bash
# Text
telegram-phase-notify 3 "PLAN" "Implementation Strategy" "Creating HTTP-based notification system on port 8898"

# Voice audio
bun send-phase-voice.ts 3 "PLAN" "Implementation Strategy" "Creating HTTP-based notification system on port 8898"
```

### Phase 6 (VERIFY) - Text + Voice
- ✅ Send text notification to Telegram
- ✅ Send voice audio message to Telegram
- ✅ Use `send-phase-voice.ts` helper

**Example:**
```bash
# Text
telegram-phase-notify 6 "VERIFY" "Validation Results" "All 7 phases tested successfully. Phase notifications arriving in Telegram app."

# Voice audio
bun send-phase-voice.ts 6 "VERIFY" "Validation Results" "All 7 phases tested successfully. Phase notifications arriving in Telegram app."
```

## No Local Voice Playback

**For Telegram-originated messages:**
- ❌ NO `curl` to localhost:8888 for voice playback
- ✅ Voice sent as audio files to Telegram (phases 3 & 6 only)
- ✅ Text notifications for all phases

**Detection:**
- Check for `telegramRequest: true` flag in message queue
- If present: Use Telegram notification pattern (no local voice)
- If absent: Use CLI pattern (local voice for all phases)

## Implementation Pattern

```bash
# For Telegram-originated messages:

# Phase 1 - Text only
telegram-phase-notify 1 "OBSERVE" "Title" "Good overview text"
━━━ 👁️ OBSERVE ━━━ 1/7
[Content...]

# Phase 2 - Text only
telegram-phase-notify 2 "THINK" "Title" "Good overview text"
━━━ 🧠 SuSS ━━━ 2/7
[Content...]

# Phase 3 - Text + Voice
telegram-phase-notify 3 "PLAN" "Title" "Good overview text"
bun send-phase-voice.ts 3 "PLAN" "Title" "Good overview text"
━━━ 📋 PLAN ━━━ 3/7
[Content...]

# Phase 4 - Text only
telegram-phase-notify 4 "BUILD" "Title" "Good overview text"
━━━ 🔨 BUILD ━━━ 4/7
[Content...]

# Phase 5 - Text only
telegram-phase-notify 5 "EXECUTE" "Title" "Good overview text"
━━━ ⚡ EXECUTE ━━━ 5/7
[Content...]

# Phase 6 - Text + Voice
telegram-phase-notify 6 "VERIFY" "Title" "Good overview text"
bun send-phase-voice.ts 6 "VERIFY" "Title" "Good overview text"
━━━ ✅ VERIFICATION STATION ━━━ 6/7
[Content...]

# Phase 7 - Text only
telegram-phase-notify 7 "LEARN" "Title" "Good overview text"
━━━ 📚 LEARN ━━━ 7/7
[Content...]
```

## Key Points

1. **Progressive delivery:** Call telegram-phase-notify at START of each phase
2. **Good overviews:** Each notification should include substantive content
3. **Voice phases:** Only 3 (PLAN) and 6 (VERIFY) get voice audio to Telegram
4. **No local voice:** Telegram messages don't trigger localhost:8888 voice playback
5. **Auto-detection:** Helpers check telegramRequest flag and skip for CLI requests

## Helpers

- `telegram-phase-notify` → Sends text to Telegram
- `send-phase-voice.ts` → Generates EdgeTTS audio and sends voice to Telegram
- `is-telegram-request` → Checks if request originated from Telegram

## Status

✅ **Requirements clarified and documented.**

Implementation needed: Update CORE Algorithm format to include these patterns.
