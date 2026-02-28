# MCP Integration Testing Guide

## Test Overview

This guide defines how to test MCP server integration with FR3K Algorithm.

## Pre-Test Checklist

### 1. Verify MCP Servers Installed
```bash
# Test hey-fr3k
npx -y hey-fr3k --help
# Expected: "HeyFr3k MCP server running on stdio"

# Test fr3k-think
npx -y fr3k-think --help
# Expected: "FR3K-Think MCP server running"

# Test md-mcp
npx -y md-mcp --help
# Expected: "md-mcp MCP server running on stdio"
```

### 2. Verify Claude Desktop Config
```bash
# Check config exists
cat ~/.claude/claude_desktop_config.json
# Expected: JSON with 3 mcpServers entries
```

### 3. Verify memU Still Running
```bash
# Check memU bridge
systemctl --user status pai-memu-bridge.service
# Expected: Active (running)
```

## Integration Tests

### Test 1: OBSERVE Phase - hey-fr3k Context

**Manual Test (requires Claude Desktop with MCP):**
1. Start Claude Desktop with MCP config loaded
2. Send: "Get my context from last 7 days tagged with 'work'"
3. Verify: hey-fr3k.get_context() returns relevant items

**Expected Result:**
- Context retrieved from hey-fr3k KB
- No errors or timeouts
- Results usable for reverse-engineering

**Fallback Test:**
```bash
# If hey-fr3k unavailable, Algorithm continues without context
# Should NOT break or hang
```

### Test 2: THINK Phase - fr3k-think Reasoning

**Manual Test (requires Claude Desktop with MCP):**
1. Start Claude Desktop with MCP config loaded
2. Send: "Use first principles to analyze 'trading bot latency optimization'"
3. Verify: fr3k-think.first_principles() returns deconstructed analysis

**Expected Result:**
- Analysis depth 3 applied
- Fundamental truths identified
- Assumptions challenged

**Red Team Test:**
1. Send: "Red team analyze 'implement parallel processing' with 32 agents"
2. Verify: fr3k-think.red_team_analysis() returns critique

**Expected Result:**
- 32 adversarial perspectives
- Vulnerabilities identified
- Mitigations suggested

### Test 3: EXECUTE Phase - md-mcp Dynamic Tools

**Manual Test (requires Claude Desktop with MCP):**
1. Start Claude Desktop with MCP config loaded
2. Send: "Create a tool called 'trade_analyzer' that analyzes trade patterns"
3. Verify: md-mcp.forge_reality() creates tool
4. Send: "Use trade_analyzer to analyze these trades: [...]"
5. Verify: Tool executes successfully

**Expected Result:**
- Tool created dynamically
- Tool immediately available
- Tool produces results

### Test 4: LEARN Phase - hey-fr3k Storage

**Manual Test (requires Claude Desktop with MCP):**
1. Start Claude Desktop with MCP config loaded
2. Send: "Store note: 'Parallel processing improved latency 3.8x'"
3. Send: "Create task: 'Profile parallel executor under load'"
4. Verify: hey-fr3k.add_note() and create_task() succeed

**Expected Result:**
- Note stored in persistent KB
- Task created with priority and tags
- Both retrievable in future sessions

### Test 5: Enhanced Notifications

**Automated Test:**
```bash
# Test phase notification script
bun ~/fr3k-telegram-bot/phase-notify.ts 1 "TEST" "Testing enhanced notifications" "Full details in each message"

# Expected: Telegram message received with:
# - Phase number and name
# - Title
# - Full content
# - Proper formatting
```

**Voice Message Test (Phases 3 & 6):**
```bash
# Test voice overview
bun ~/fr3k-telegram-bot/send-phase-voice.ts 3 "PLAN" "Test Voice" "Testing voice overview with detailed summary"

# Expected:
# - Text message sent to Telegram
# - Audio generated via EdgeTTS
# - Voice message sent to Telegram
# - Voice is SUMMARY of text, not repetition
```

## Compatibility Tests

### Test 6: memU Compatibility

**Verify No Conflicts:**
```bash
# memU should still work
curl -X POST http://127.0.0.1:8899/api/v1/memorize \
  -H "Content-Type: application/json" \
  -d '{"content":"test compatibility","modality":"conversation","user_id":"fr3k"}'

# Expected: Success response
```

**Verify Fallback:**
- If MCP servers unavailable → Algorithm continues
- If hey-fr3k fails → memU still accessible
- No breaking changes to existing system

### Test 7: Algorithm Format Unchanged

**Verify Backward Compatibility:**
- Algorithm format still uses 7 phases
- Phase notifications still work
- Voice announcements still work
- No changes to ISC criteria system

## Success Criteria

### All Tests Pass When:
✅ MCP servers respond to npx commands
✅ Claude Desktop config has all 3 servers
✅ memU still running and accessible
✅ Enhanced Telegram notifications deliver full details
✅ Voice messages are summaries, not repetitions
✅ Algorithm format unchanged
✅ No conflicts with existing system
✅ Fallbacks work when MCP unavailable

### Integration Complete When:
✅ OBSERVE: hey-fr3k context retrieval works
✅ THINK: fr3k-think reasoning tools work
✅ EXECUTE: md-mcp dynamic tool creation works
✅ LEARN: hey-fr3k storage works
✅ All enhanced notifications working
✅ memU compatibility verified
✅ Documentation complete

## Troubleshooting

### MCP Server Not Responding
```bash
# Verify package installed
npm list -g hey-fr3k fr3k-think md-mcp

# Reinstall if needed
npx -y hey-fr3k
npx -y fr3k-think
npx -y md-mcp
```

### Claude Desktop Not Loading MCP
```bash
# Verify config path
ls -la ~/.claude/claude_desktop_config.json

# Check config syntax
cat ~/.claude/claude_desktop_config.json | jq .
```

### Enhanced Notifications Not Working
```bash
# Test notification script
bun ~/fr3k-telegram-bot/phase-notify.ts 1 "TEST" "Title" "Content"

# Check Telegram bot status
systemctl --user status pai-telegram-bot.service
```

### memU Conflicts
```bash
# memU should continue working
curl http://127.0.0.1:8899/health

# If failing, restart
systemctl --user restart pai-memu-bridge.service
```

---

**Status:** Test guide complete
**Next:** Manual testing via Claude Desktop required
**Note:** MCP integration requires Claude Desktop MCP protocol support
