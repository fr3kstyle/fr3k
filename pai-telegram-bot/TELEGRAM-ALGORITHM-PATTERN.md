# FR3K Telegram Algorithm Pattern (CORRECTED)

**Voice Pattern:** Phase 3 (PLAN) and Phase 6 (VERIFY) only

**Last Updated:** 2026-02-23

## Phase Notifications

### All Phases (1-7): Text to Telegram
```bash
telegram-phase-notify <phase> "<phaseName>" "<title>" "<content>"
```

### Phase 3 (PLAN): Text + Voice to Telegram
```bash
# Send text notification
telegram-phase-notify 3 "PLAN" "<title>" "<content>"

# Send voice audio overview
bun send-phase-voice.ts 3 "PLAN" "<title>" "<content>"
```

### Phase 6 (VERIFY): Text + Voice to Telegram
```bash
# Send text notification
telegram-phase-notify 6 "VERIFY" "<title>" "<content>"

# Send voice audio overview
bun send-phase-voice.ts 6 "VERIFY" "<title>" "<content>"
```

## No Local Voice Playback

**For Telegram-originated messages:**
- ❌ NO local voice playback via localhost:8888
- ✅ Voice sent as audio files to Telegram app (phases 3 & 6)
- ✅ Text notifications for all phases (1-7)

## Complete Algorithm Pattern

```bash
# Phase 1 (OBSERVE) - Text only
telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "Analyzing..."
━━━ 👁️ OBSERVE ━━━ 1/7
[Phase content...]

# Phase 2 (THINK) - Text only
telegram-phase-notify 2 "THINK" "Capability Selection" "Using..."
━━━ 🧠 SuSS ━━━ 2/7
[Phase content...]

# Phase 3 (PLAN) - Text + Voice to Telegram
telegram-phase-notify 3 "PLAN" "Implementation Strategy" "Creating..."
bun send-phase-voice.ts 3 "PLAN" "Implementation Strategy" "Creating..."
━━━ 📋 PLAN ━━━ 3/7
[Phase content...]

# Phase 4 (BUILD) - Text only
telegram-phase-notify 4 "BUILD" "Creating Solution" "Building..."
━━━ 🔨 BUILD ━━━ 4/7
[Phase content...]

# Phase 5 (EXECUTE) - Text only
telegram-phase-notify 5 "EXECUTE" "Running Implementation" "Testing..."
━━━ ⚡ EXECUTE ━━━ 5/7
[Phase content...]

# Phase 6 (VERIFY) - Text + Voice to Telegram
telegram-phase-notify 6 "VERIFY" "Validation Results" "Testing complete..."
bun send-phase-voice.ts 6 "VERIFY" "Validation Results" "Testing complete..."
━━━ ✅ VERIFICATION STATION ━━━ 6/7
[Phase content...]

# Phase 7 (LEARN) - Text only
telegram-phase-notify 7 "LEARN" "Key Insights" "Learned that..."
━━━ 📚 LEARN ━━━ 7/7
[Phase content...]
```

## Helper Scripts

- `telegram-phase-notify` - Sends text notification to Telegram
- `send-phase-voice.ts` - Generates EdgeTTS audio and sends voice message to Telegram

Both helpers auto-detect Telegram origin and skip if not from Telegram.
