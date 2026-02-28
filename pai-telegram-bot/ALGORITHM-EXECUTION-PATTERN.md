# CRITICAL: Algorithm Execution Pattern for Telegram

**Problem:** If all phase notifications arrive at once at the end, the Algorithm is batching them instead of sending during execution.

**Solution:** Call `telegram-phase-notify` IMMEDIATELY at start of each phase.

---

## CORRECT Pattern (Send during execution)

```bash
# Phase 1 START - Send notification FIRST
telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "Analyzing request..."

# Then continue with phase content
━━━ 👁️ OBSERVE ━━━ 1/7
[Phase 1 content here...]

# Phase 2 START - Send notification FIRST
telegram-phase-notify 2 "THINK" "Capability Selection" "Using Engineer..."

# Then continue with phase content
━━━ 🧠 SuSS ━━━ 2/7
[Phase 2 content here...]

# Phase 3 START - Send notification FIRST + Voice
telegram-phase-notify 3 "PLAN" "Implementation Strategy" "Creating HTTP system..."
curl -s -X POST http://localhost:8888/notify -H "Content-Type: application/json" -d '{"message":"Time to come up with the sikkest fucking plan...","voice_id":"21m00Tcm4TlvDq8ikWAM"}'

# Then continue with phase content
━━━ 📋 PLAN ━━━ 3/7
[Phase 3 content here...]

# Continue for all 7 phases...
```

---

## INCORRECT Pattern (Batch at end)

```bash
# ❌ WRONG - Doing all phases first, then sending all notifications

━━━ 👁️ OBSERVE ━━━ 1/7
[Phase 1 content...]

━━━ 🧠 SuSS ━━━ 2/7
[Phase 2 content...]

... [All phases] ...

# ❌ WRONG - Sending all notifications at the end
for phase in 1 2 3 4 5 6 7; do
  telegram-phase-notify $phase "..." "..." "..."
done
```

---

## Key Rule

**🚨 MUST SEND NOTIFICATION AT PHASE START, NOT AT END**

Each phase transition must:
1. Call `telegram-phase-notify` FIRST
2. Wait for it to complete
3. Then display phase header
4. Then continue with phase content

This ensures notifications arrive progressively as the Algorithm executes, not all at once at the end.

---

## Verification

**Correct behavior:**
- User receives Phase 1 notification immediately after phase starts
- User receives Phase 2 notification after Phase 1 completes
- ... progressive delivery ...
- User receives Phase 7 notification at end

**Incorrect behavior:**
- User waits through all 7 phases
- Then receives all 7 notifications at once

---

## Testing

When testing, verify notifications arrive progressively:

```bash
# Test: Send 3 notifications with delay
cd ~/fr3k-telegram-bot
bun phase-notify.ts 1 "TEST" "Test 1" "First"
sleep 2
bun phase-notify.ts 2 "TEST" "Test 2" "Second"
sleep 2
bun phase-notify.ts 3 "TEST" "Test 3" "Third"
```

You should see 3 separate messages arriving over 6 seconds, not all at once at the end.
