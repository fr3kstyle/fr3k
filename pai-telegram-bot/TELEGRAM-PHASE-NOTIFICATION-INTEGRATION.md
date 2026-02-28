# Telegram Phase Notification Integration Guide

**Last Updated:** 2026-02-23
**Status:** ✅ Infrastructure Complete, AI Integration Required

---

## Overview

This document explains how FR3K Algorithm automatically sends phase updates to Telegram when processing Telegram-originated requests.

**Key Principle:** The Algorithm (FR3K) checks if the request originated from Telegram and automatically calls `phase-notify.ts` during phase transitions.

---

## How It Works

### 1. Message Flow

```
User sends Telegram message
    ↓
Communication Agent receives message
    ↓
Communication Agent queues message with telegramRequest=true flag
    ↓
Main Bot processes message
    ↓
Main Bot calls FR3K Algorithm
    ↓
FR3K Algorithm checks telegramRequest flag
    ↓
If true: Call phase-notify.ts at each phase transition
    ↓
User receives phase updates in Telegram
```

### 2. Detection Mechanism

**In `communication-agent.ts` (line 272):**
```typescript
const queuedMessage: QueuedMessage = {
  id: messageId,
  text,
  userId,
  timestamp: Date.now(),
  traceContext,
  username,
  chatId,
  messageId: messageIdNum,
  telegramRequest: true,  // ← Flag enables phase notifications
};
```

**In FR3K Algorithm execution:**
- Check if current request originated from Telegram
- If `telegramRequest=true`, automatically call phase-notify.ts
- If `telegramRequest=false` or undefined, skip phase notifications

---

## FR3K Algorithm Integration

### During Algorithm Execution

When processing a Telegram message, include this pattern in each phase:

```bash
# At start of each phase (1-7)
cd ~/fr3k-telegram-bot
bun phase-notify.ts <phase> "<phaseName>" "<title>" "<content>"
```

### Phase Notification Helper

Use the helper script for convenience:

```bash
telegram-phase-notify <phase> "<phaseName>" "<title>" "<content>"
```

This helper automatically checks if `TELEGRAM_REQUEST=true` and skips if not a Telegram request.

### Example: Full Algorithm with Phase Notifications

```bash
# Phase 1: OBSERVE
telegram-phase-notify 1 "OBSERVE" "Reverse Engineering" "Analyzing user request..."
# [Observe phase content]

# Phase 2: THINK
telegram-phase-notify 2 "THINK" "Capability Selection" "Using FirstPrinciples..."
# [Think phase content]

# Phase 3: PLAN
telegram-phase-notify 3 "PLAN" "Implementation Strategy" "Designing approach..."
# [Plan phase content]

# Phase 4: BUILD
telegram-phase-notify 4 "BUILD" "Creating Solution" "Building integration..."
# [Build phase content]

# Phase 5: EXECUTE
telegram-phase-notify 5 "EXECUTE" "Running Implementation" "Testing system..."
# [Execute phase content]

# Phase 6: VERIFY
telegram-phase-notify 6 "VERIFY" "Validation Results" "Testing complete..."
# [Verify phase content]

# Phase 7: LEARN
telegram-phase-notify 7 "LEARN" "Key Insights" "Learned that..."
# [Learn phase content]
```

---

## Detection: How to Know If Request Is From Telegram

### Method 1: Check Message Queue

```bash
cat /tmp/pai-message-queue.json | grep telegramRequest
```

If `"telegramRequest": true` appears, the current message is from Telegram.

### Method 2: Check Recent Communication Agent Logs

```bash
tail -50 ~/fr3k-telegram-bot/logs/communication-agent.log | grep "telegramRequest"
```

### Method 3: Session Context

When the conversation starts with a Telegram message, the entire session should treat it as Telegram-originated. Check the conversation history:

```bash
cat /tmp/pai-conversation-history.json | jq '.recentMessages[-1]'
```

---

## Phase Notification Content Guidelines

Each phase should include pertinent information:

### Phase 1: OBSERVE
- What the user asked for
- What they implied
- What they DON'T want
- ISC criteria being created

### Phase 2: THINK
- Thinking tools assessment
- Skill check results
- Capability selection with rationale

### Phase 3: PLAN
- Approach type
- Primary goal
- Implementation strategy

### Phase 4: BUILD
- Artifact type being created
- Specific component names
- Progress indicators

### Phase 5: EXECUTE
- Current action being performed
- Target being acted upon
- Progress percentage

### Phase 6: VERIFY
- Verification target
- Key findings
- Test results

### Phase 7: LEARN
- Key insights
- Actionable takeaways
- What to improve next time

---

## Testing the Integration

### Manual Test

1. Send a Telegram message to yourself
2. Check the message queue: `cat /tmp/pai-message-queue.json`
3. Verify `telegramRequest: true` is set
4. Process the message through FR3K
5. Verify phase updates appear in Telegram

### Automated Test

```bash
# Add test message to queue
echo '[{"id":"test-123","text":"Test message","userId":"8188688460","timestamp":'$(date +%s)000',"telegramRequest":true}]' > /tmp/pai-message-queue.json

# Trigger processing
touch /tmp/pai-new-message.flag

# Watch for phase notifications in Telegram
```

---

## Troubleshooting

### No Phase Notifications in Telegram

**Check 1: Is telegramRequest flag set?**
```bash
cat /tmp/pai-message-queue.json | grep telegramRequest
```

**Check 2: Is phase-notify.ts working?**
```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts 1 "TEST" "Test" "Testing phase notifications"
```

**Check 3: Is phase notification server running?**
```bash
curl http://localhost:8898/health
# Should return: Phase Notification Server - Use POST /api/phase-update
```

**Check 4: Did Algorithm call phase-notify?**
Check logs for phase notification calls:
```bash
tail -100 ~/fr3k-telegram-bot/logs/main-bot.log | grep "Phase.*sent to Telegram"
```

### Phase Notifications Not Arriving

**Check Telegram bot token:**
```bash
printenv | grep TELEGRAM_BOT_TOKEN
```

**Check user ID:**
```bash
printenv | grep TELEGRAM_USER_ID
```

**Check bot is running:**
```bash
systemctl --user status pai-telegram-bot.service
```

---

## Implementation Status

### ✅ Completed

1. **Flag in message queue** - `telegramRequest` field added to QueuedMessage interface
2. **Communication Agent sets flag** - All Telegram messages have `telegramRequest: true`
3. **Phase notification system** - Working endpoint on port 8898
4. **Helper script** - `telegram-phase-notify` for convenient calling
5. **Documentation** - This file

### ⚠️ AI Integration Required

**CRITICAL:** The Algorithm (FR3K) must check for `telegramRequest` flag and automatically call `phase-notify.ts` during phase transitions.

**Pattern to follow:**
```bash
# At start of each phase
if [ "$TELEGRAM_REQUEST" = "true" ]; then
  cd ~/fr3k-telegram-bot
  bun phase-notify.ts <phase> "<phaseName>" "<title>" "<content>"
fi
```

**Or use helper:**
```bash
telegram-phase-notify <phase> "<phaseName>" "<title>" "<content>"
```

---

## Summary

**Infrastructure:** ✅ Complete and tested
**AI Behavior:** ⚠️ Requires consistent integration into Algorithm execution

The system is ready. FR3K Algorithm must consistently call `phase-notify.ts` (or use `telegram-phase-notify` helper) during each phase when processing Telegram-originated requests.

**Key files:**
- `~/fr3k-telegram-bot/agents/communication-agent.ts` - Sets telegramRequest flag
- `~/fr3k-telegram-bot/index.ts` - Processes queued messages
- `~/fr3k-telegram-bot/phase-notify.ts` - Sends phase notifications to Telegram
- `~/.local/bin/telegram-phase-notify` - Helper script (checks flag automatically)

**Next steps:**
1. FR3K Algorithm consistently uses phase notifications for Telegram requests
2. End-to-end testing with real Telegram messages
3. Monitor for reliability and user feedback
