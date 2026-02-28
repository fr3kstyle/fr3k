# Minimal FR3K Algorithm for Telegram Conversations

**Last Updated:** 2026-02-23
**Purpose:** Streamlined Algorithm format for Telegram-initiated conversations

---

## Overview

When a request comes through Telegram, use a **minimal version of the 7-phase Algorithm** to avoid slowing down the system too much. Regular CLI conversations still use the full detailed format.

**Key principle:** Telegram = Fast & Focused, CLI = Detailed & Comprehensive

---

## Minimal Algorithm Format with Telegram Notifications

### Structure

```
🤖 FR3K ALGORITHM (TELEGRAM) ═════════════

telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "{brief summary}"

━━━ 1. OBSERVE ━━━
[Brief 1-2 sentence summary of request]

telegram-phase-notify 2 "THINK" "Capability Selection" "{quick selection}"

━━━ 2. THINK ━━━
[Quick capability selection - skip verbose tool assessments]

telegram-phase-notify 3 "PLAN" "Implementation Strategy" "{detailed plan}"

━━━ 3. PLAN ━━━
[DETAILED - keep full plan with steps and approach]

telegram-phase-notify 4 "BUILD" "Creating Solution" "{brief status}"

━━━ 4. BUILD ━━━
[Brief progress update - what's being created]

telegram-phase-notify 5 "EXECUTE" "Running Implementation" "{action update}"

━━━ 5. EXECUTE ━━━
[Brief action update - current progress]

telegram-phase-notify 6 "VERIFY" "Validation Results" "{detailed results}"

━━━ 6. VERIFY ━━━
[DETAILED - full verification with evidence and findings]

telegram-phase-notify 7 "LEARN" "Key Insights" "{insights}"

━━━ 7. LEARN ━━━
[Quick key insights and next steps]

🗣️ FR3K: [Concise summary]
```

---

## Key Requirements

1. **Phase notifications:** Use `telegram-phase-notify` at START of each phase (1-7)
2. **Detailed phases:** 3 (PLAN) and 6 (VERIFY) get detailed text to Telegram
3. **Brief phases:** 1, 2, 4, 5, 7 get concise text to Telegram
4. **No audio voice:** Skip curl voice notifications for Telegram requests

---

## Helper Script

`telegram-phase-notify` automatically detects Telegram origin and skips if not from Telegram:

```bash
telegram-phase-notify <phase> "<phaseName>" "<title>" "<content>"
```

**Detection:** Checks `/tmp/pai-message-queue.json` for `telegramRequest: true` flag

---

## Example: Full Algorithm Flow

```bash
# Phase 1
telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "User wants to integrate phase notifications"
━━━ 1. OBSERVE ━━━
User wants phase notifications integrated into Algorithm for Telegram messages only.

# Phase 2
telegram-phase-notify 2 "THINK" "Capability Selection" "Using Engineer for implementation"
━━━ 2. THINK ━━━
Using Engineer for implementation. Pattern: Specialist.

# Phase 3 (DETAILED)
telegram-phase-notify 3 "PLAN" "Implementation Strategy" "Creating HTTP-based notification system on port 8898"
━━━ 3. PLAN ━━━
Approach: Environment variable flag detection.
1. Add telegramRequest field to QueuedMessage interface
2. Modify communication-agent.ts to set flag
3. Create check-telegram-origin helper
4. Test with actual Telegram message

# Phase 4
telegram-phase-notify 4 "BUILD" "Creating Solution" "Added telegramRequest flag in message queue"
━━━ 4. BUILD ━━━
Created telegramRequest flag in message queue and detection helpers.

# Phase 5
telegram-phase-notify 5 "EXECUTE" "Testing System" "Testing phase-notify.ts with Telegram detection"
━━━ 5. EXECUTE ━━━
Testing simplified phase-notify.ts with Telegram detection.

# Phase 6 (DETAILED)
telegram-phase-notify 6 "VERIFY" "Validation Results" "All 7 phases tested successfully"
━━━ 6. VERIFY ━━━
✅ Phase 1 notification sent successfully
✅ Telegram detection working
✅ All phases arriving in Telegram app
✅ No false positives for CLI requests

# Phase 7
telegram-phase-notify 7 "LEARN" "Key Insights" "Phase notification system working perfectly"
━━━ 7. LEARN ━━━
Phase notification system working perfectly. Real-time visibility achieved.
```

---

## Testing

### Test Phase Notification

```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts 1 "TEST" "Test" "Testing phase notifications"
```

You should receive a Telegram message within 1-2 seconds.

---

## Summary

**✅ Telegram = Minimal Algorithm:**
- All 7 phases send notifications to Telegram app
- Phases 1, 2, 4, 5, 7: Brief and concise
- Phases 3, 6: Full details (critical for planning and verification)
- No audio voice notifications
- Total length: 500-1000 tokens vs 2000-4000 for full format

**Detection:** Check `telegramRequest` flag in message queue
- True → Minimal format with Telegram notifications
- False/absent → Full format without Telegram notifications
