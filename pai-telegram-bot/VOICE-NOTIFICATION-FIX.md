# Voice Notification Fix & Phase Notification System

**Date:** 2026-02-23
**Status:** ✅ Complete

---

## What Was Fixed

### 1. EdgeTTS Not Installed
**Problem:** Voice server was configured to use EdgeTTS but it wasn't installed, causing silent failures.

**Solution:**
```bash
pip install --break-system-packages edge-tts
```

**Result:** ✅ Voice notifications now play through speakers

### 2. PipeWire Audio Sink Suspension
**Problem:** PipeWire suspends audio sinks when idle, causing silent playback even when audio files are generated.

**Solution:** Created `/home/fr3k/.local/bin/wake-audio-sinks.sh` to wake sinks before playback.

**Result:** ✅ Audio plays reliably after sinks wake up

### 3. Auto-Start on Boot
**Problem:** Telegram bot didn't start automatically on reboot.

**Solution:**
```bash
systemctl --user enable pai-telegram-bot.service
```

**Result:** ✅ Bot starts on boot with crash recovery (`Restart=always`)

---

## Phase Notification System

### How It Works

The phase notification system sends Algorithm progress updates to Telegram during execution:

**Components:**
1. **Phase Notification Server** (port 8898) - Part of index.ts
2. **Helper Script** - `/home/fr3k/fr3k-telegram-bot/phase-notify.ts`
3. **Voice Integration** - Phases 3 & 6 include voice notifications

**Usage:**
```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts <phase> <phaseName> <title> <content>
```

**Example:**
```bash
bun phase-notify.ts 3 "PLAN" "Implementation Strategy" "Creating HTTP-based notification system"
```

### Phase-Specific Features

| Phase | Telegram Message | Voice Notification | Audio Overview |
|-------|-----------------|-------------------|----------------|
| 1: OBSERVE | ✅ Yes | ❌ No | ❌ No |
| 2: THINK | ✅ Yes | ❌ No | ❌ No |
| 3: PLAN | ✅ Yes | ✅ Yes | ✅ Yes |
| 4: BUILD | ✅ Yes | ❌ No | ❌ No |
| 5: EXECUTE | ✅ Yes | ❌ No | ❌ No |
| 6: VERIFY | ✅ Yes | ✅ Yes | ❌ No |
| 7: LEARN | ✅ Yes | ❌ No | ❌ No |

### Integration into Algorithm

**CRITICAL:** The phase notification system only works if **called during Algorithm execution**.

**Current State:**
- ✅ System built and tested manually
- ❌ NOT automatically called during Algorithm phases

**Required Action:**
During each Algorithm phase, call:
```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts <phase> "<phaseName>" "<title>" "<content>"
```

**Example Phase 3:**
```bash
bun phase-notify.ts 3 "PLAN" "HTTP-based approach" "Creating notification system on port 8898"
```

---

## Current System Status

### ✅ Working
- Voice notifications (EdgeTTS installed and working)
- Telegram message delivery
- Phase notification endpoint (port 8898)
- Auto-start on boot enabled
- Crash recovery configured (`Restart=always`)
- Phase 3 audio overview (when called manually)
- Phase 6 voice notification (when called manually)

### ❌ Not Working
- **Automatic phase notifications during Algorithm execution**
  - The system exists but isn't being called
  - Requires manual invocation during each phase
  - AI assistant needs to remember to call `phase-notify.ts`

### 🔧 Crypto Agents
- **Status:** Disabled per user request
- **Location:** `~/fr3k-telegram-bot/start-system.sh` (commented out)
- **To re-enable:** Uncomment autonomous-monitor and enhanced-notification-agent lines

---

## Troubleshooting

### No Voice Notifications

**Check 1: EdgeTTS installed?**
```bash
which edge-tts
# Should return: /home/fr3k/.local/bin/edge-tts
```

**Check 2: Audio sinks suspended?**
```bash
pactl list short sinks
# Should NOT show "SUSPENDED" on all sinks
```

**Fix:**
```bash
for sink in $(pactl list short sinks | awk '{print $1}'); do
  pactl suspend-sink $sink 0
done
```

**Check 3: Voice server running?**
```bash
ps aux | grep "server.ts" | grep -v grep
# Should show: /home/fr3k/.bun/bin/bun run server.ts
```

### No Phase Updates in Telegram

**The system works but must be called manually!**

During Algorithm execution, explicitly call:
```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts <phase> "<phaseName>" "<title>" "<content>"
```

**Test:**
```bash
bun phase-notify.ts 1 "OBSERVE" "Test" "Testing phase notifications"
```

### Bot Doesn't Start on Boot

**Check status:**
```bash
systemctl --user is-enabled pai-telegram-bot.service
# Should return: "enabled"
```

**Enable:**
```bash
systemctl --user enable pai-telegram-bot.service
```

**Check logs:**
```bash
journalctl --user -u pai-telegram-bot.service -n 50
```

---

## Summary

**✅ Accomplished:**
1. Fixed voice notifications (installed EdgeTTS)
2. Fixed PipeWire sink suspension
3. Enabled auto-start on boot
4. Configured crash recovery (Restart=always)
5. Built phase notification system
6. Added phase 3 audio overview feature
7. Added phase 6 voice notification feature

**⚠️ Known Issue:**
- Phase notifications are NOT sent automatically during Algorithm execution
- The system exists and works when tested manually
- Requires explicit calls to `phase-notify.ts` during each phase

**📝 Next Steps:**
- AI assistant must remember to call `phase-notify.ts` during Algorithm phases
- Consider automating this via a hook or wrapper script
- Document in AI steering rules

---

**Documentation:**
- Phase notifications: `~/pai-telegram-bot/PHASE-NOTIFICATIONS.md`
- Crypto disable guide: `~/pai-telegram-bot/DISABLE-CRYPTO-TRADING.md`
- Crypto start guide: `~/pai-telegram-bot/START-CRYPTO-AGENTS.md`
- Main README: `~/pai-telegram-bot/README.md`
