# FR3K Algorithm Phase Notifications

**Last Updated:** 2026-02-23
**System:** FR3K Telegram Bot Phase Notification System

---

## Overview

The FR3K Algorithm now sends real-time progress updates to Telegram at each of the 7 phases:
1. **OBSERVE** - Reverse engineering and ISC criteria creation
2. **THINK** - Thinking tools assessment, skill check, capability selection
3. **PLAN** - Implementation approach and strategy
4. **BUILD** - Artifact creation and development
5. **EXECUTE** - Running the implementation
6. **VERIFY** - Testing and validation
7. **LEARN** - Key insights and improvements

---

## How It Works

### Architecture

```
Claude Code (FR3K Algorithm)
    ↓
phase-notify.ts script
    ↓
HTTP POST to localhost:8898
    ↓
index.ts (Phase Notification Server)
    ↓
Telegram Bot API
    ↓
Your Telegram App
```

### Components

1. **Phase Notification Server** (index.ts)
   - HTTP server on port 8898
   - Endpoint: `POST /api/phase-update`
   - Formats and sends messages to Telegram

2. **Helper Script** (phase-notify.ts)
   - Command-line tool for sending notifications
   - Used by Claude Code during Algorithm execution

3. **Telegram Bot**
   - Receives phase updates via internal server
   - Forwards to user via bot.api.sendMessage()

---

## Usage

### Basic Usage

```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts <phase> <phaseName> <title> <content>
```

**Parameters:**
- `phase` - Phase number (1-7)
- `phaseName` - Phase name (OBSERVE, THINK, PLAN, etc.)
- `title` - Brief title for the update
- `content` - Detailed content of the phase

### Examples

#### Phase 1: OBSERVE
```bash
bun phase-notify.ts 1 "OBSERVE" "Reverse Engineering" \
  "Analyzing user request for telegram bot modifications. Creating ISC criteria."
```

#### Phase 2: THINK
```bash
bun phase-notify.ts 2 "THINK" "Capability Selection" \
  "🔍 THINKING TOOLS ASSESSMENT:
│ Council: EXCLUDE — Clear technical approach
│ FirstPrinciples: INCLUDE — Need architectural analysis

🎯 The fR3k t3aM:
│ Primary: Engineer — HTTP endpoint implementation
│ Pattern: Specialist
│ Rationale: Single feature addition"
```

#### Phase 3: PLAN
```bash
bun phase-notify.ts 3 "PLAN" "Implementation Strategy" \
  "Creating HTTP-based notification system on port 8898. Helper script for Claude Code integration."
```

#### Phase 4: BUILD
```bash
bun phase-notify.ts 4 "BUILD" "Creating Server Endpoint" \
  "Added phase notification server to index.ts. Listening on port 8898 for POST /api/phase-update"
```

#### Phase 5: EXECUTE
```bash
bun phase-notify.ts 5 "EXECUTE" "Testing System" \
  "Restarted telegram bot. Phase notification server confirmed running on port 8898."
```

#### Phase 6: VERIFY
```bash
bun phase-notify.ts 6 "VERIFY" "Validation Results" \
  "All 7 phases tested successfully. Notifications arriving in Telegram within 1-2 seconds."
```

#### Phase 7: LEARN
```bash
bun phase-notify.ts 7 "LEARN" "Key Insights" \
  "Phase notification system working perfectly. Real-time visibility into Algorithm execution achieved."
```

---

## Integration with FR3K Algorithm

### When to Send Notifications

Send a phase notification at the start of each Algorithm phase:

1. **After entering the phase** (after voice notification)
2. **Include pertinent info** for that specific phase
3. **Keep it concise** but informative

### Phase-Specific Content Guidelines

#### Phase 1: OBSERVE
Include:
- What the user asked for
- What they implied
- What they DON'T want
- ISC criteria being created

#### Phase 2: THINK
Include:
- Thinking tools assessment (justify exclusions)
- Skill check results
- Capability selection with rationale

#### Phase 3: PLAN
Include:
- Approach type
- Primary goal
- Implementation strategy

#### Phase 4: BUILD
Include:
- Artifact type being created
- Specific component names
- Progress indicators

#### Phase 5: EXECUTE
Include:
- Current action being performed
- Target being acted upon
- Progress percentage (if applicable)

#### Phase 6: VERIFY
Include:
- Verification target
- Key findings
- Test results

#### Phase 7: LEARN
Include:
- Key insights
- Actionable takeaways
- What to improve next time

---

## Testing

### Verify Server is Running

```bash
# Check if port 8898 is listening
curl http://localhost:8898/

# Should return: "Phase Notification Server - Use POST /api/phase-update"
```

### Test Notification

```bash
cd ~/fr3k-telegram-bot
bun phase-notify.ts 1 "TEST" "Test Notification" "This is a test message"
```

You should receive a Telegram message within 1-2 seconds.

---

## Troubleshooting

### No Telegram Messages Received

**Check server status:**
```bash
ps aux | grep "index.ts" | grep -v grep
```

**Check logs:**
```bash
tail -50 ~/fr3k-telegram-bot/logs/main-bot.log | grep -i "phase"
```

**Test endpoint directly:**
```bash
curl -X POST http://localhost:8898/api/phase-update \
  -H "Content-Type: application/json" \
  -d '{
    "phase": 1,
    "phaseName": "TEST",
    "title": "Direct Test",
    "content": "Testing endpoint directly"
  }'
```

### Port 8898 Already in Use

If port 8898 is already in use, edit `index.ts` and change the port:
```typescript
const phaseNotificationServer = Bun.serve({
  port: 8899,  // Change to available port
  // ...
});
```

### Notifications Not Formatting Correctly

The server uses Markdown formatting. Ensure content doesn't contain invalid Markdown characters. If needed, escape special characters:
- `_` → `\_`
- `*` → `\*`
- `[` → `\[`
- `]` → `\]`

---

## Advanced Usage

### Programmatic Usage (from code)

```typescript
import { sendPhaseNotification } from "./phase-notify";

await sendPhaseNotification({
  phase: 2,
  phaseName: "THINK",
  title: "Capability Selection",
  content: "Using FirstPrinciples to analyze requirements..."
});
```

### Batch Notifications

Send multiple updates in sequence:

```bash
for phase in 1 2 3 4 5 6 7; do
  bun phase-notify.ts $phase "Phase $phase" "Testing" "Batch test message $phase"
  sleep 1
done
```

---

## Configuration

### Change Port

Edit `index.ts` and modify the port number:

```typescript
const phaseNotificationServer = Bun.serve({
  port: 8898,  // Change this
  fetch: async (req) => { /* ... */ }
});
```

### Disable Phase Notifications

To disable phase notifications temporarily:

```bash
# Stop the bot
systemctl --user stop pai-telegram-bot.service

# Comment out the phase notification server in index.ts
# Then restart
systemctl --user start pai-telegram-bot.service
```

---

## API Reference

### POST /api/phase-update

**Request Body:**
```json
{
  "phase": 1,
  "phaseName": "OBSERVE",
  "title": "Reverse Engineering",
  "content": "Analyzing user request...",
  "timestamp": "2026-02-23T18:20:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phase update sent"
}
```

**Required Fields:**
- `phase` (number) - Phase number 1-7
- `phaseName` (string) - Phase name
- `content` (string) - Phase content

**Optional Fields:**
- `title` (string) - Brief title
- `timestamp` (string) - ISO 8601 timestamp

---

## Summary

**✅ What Was Built:**
- Phase notification HTTP server on port 8898
- Helper script for sending notifications
- Integration with Telegram Bot API
- Support for all 7 Algorithm phases

**✅ Current Status:**
- All 7 phases tested and working
- Notifications arrive in 1-2 seconds
- Markdown formatting supported
- Production ready

**📖 Documentation:**
- ~/pai-telegram-bot/PHASE-NOTIFICATIONS.md (this file)
- ~/pai-telegram-bot/DISABLE-CRYPTO-TRADING.md (crypto management)

**🔧 Next Steps:**
- Integrate phase-notify.ts calls into Algorithm execution
- Customize phase-specific content formats
- Add filtering/throttling if notifications become too frequent

---

**Questions?** Check the logs: `tail -f ~/fr3k-telegram-bot/logs/main-bot.log`
