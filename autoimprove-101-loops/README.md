# FR3K Self-Improvement System

**Automated daily research, analysis, and integration of Claude Code ecosystem improvements.**

## Overview

The FR3K Self-Improvement System automatically:
1. **Researches** latest updates to MCP servers, SDK, skills, and Claude Code
2. **Analyzes** findings and creates prioritized action plans
3. **Integrates** improvements safely (with backups, dry-run mode, manual review)
4. **Verifies** system health after any changes

**Runs daily at 2:00 AM via cron job.**

---

## Quick Start

### Installation

```bash
# 1. Install cron job
~/fr3k-self-improvement/install-cron.sh

# 2. Test manually (optional)
~/fr3k-self-improvement/daily-self-improvement.sh

# 3. View logs
cat ~/fr3k-self-improvement/logs/latest-research.json
cat ~/fr3k-self-improvement/logs/action-plan.json
```

### Manual Execution

```bash
# Full pipeline
~/fr3k-self-improvement/daily-self-improvement.sh

# Individual phases
~/fr3k-self-improvement/scripts/research.sh     # Find updates
~/fr3k-self-improvement/scripts/analyze.sh      # Create action plan
~/fr3k-self-improvement/scripts/integrate.sh    # Apply changes
~/fr3k-self-improvement/scripts/verify.sh       # Test system health
```

---

## Architecture

### Phase 1: Research

**What it checks:**
- MCP servers (hey-fr3k, fr3k-think, md-mcp, unified-pantheon-mcp)
- @modelcontextprotocol/sdk dependency
- Claude Code skills on GitHub
- New MCP servers on npm
- Claude Code releases

**Output:** `~/fr3k-self-improvement/logs/latest-research.json`

**Example finding:**
```json
{
  "type": "dependency",
  "name": "@modelcontextprotocol/sdk",
  "current_version": "^0.5.0",
  "latest_version": "1.26.0",
  "description": "SDK update available, used by MCP servers",
  "url": "https://www.npmjs.com/package/@modelcontextprotocol/sdk",
  "impact": "high"
}
```

---

### Phase 2: Analysis

**What it does:**
- Reads research findings
- Categorizes by type and impact
- Determines action (update/review/notify)
- Flags for auto-integration or manual review

**Output:** `~/fr3k-self-improvement/logs/action-plan.json`

**Action types:**
- `update` — Safe to apply automatically (low-risk)
- `review` — Requires manual assessment
- `notify` — Informational only

---

### Phase 3: Integration

**Safety mechanisms:**
- ✅ **Timestamped backups** before any changes
- ✅ **Dry-run mode** shows what would change
- ✅ **Manual approval** for high-impact changes
- ✅ **Rollback capability** via backup restoration

**Options:**
```bash
# Dry-run (default)
~/fr3k-self-improvement/scripts/integrate.sh --dry-run

# Auto-apply low-risk updates
~/fr3k-self-improvement/scripts/integrate.sh --auto-apply
```

**Backup location:** `~/fr3k-self-improvement/backups/YYYYMMDD-HHMMSS/`

---

### Phase 4: Verification

**Tests performed:**
1. MCP server startup (all 4 servers)
2. Voice server health
3. npm package integrity
4. MCP config validity
5. Critical directories existence
6. Voice notification functionality
7. Algorithm integrity (CORE skill check)

**Exit codes:**
- `0` — All tests passed, system healthy
- `1` — Some warnings detected
- `2` — Critical failures, manual intervention required

---

## Cron Schedule

**Default:** Daily at 2:00 AM

```cron
0 2 * * * $HOME/fr3k-self-improvement/daily-self-improvement.sh >> $HOME/fr3k-self-improvement/logs/cron.log 2>&1
```

### Managing Cron Job

```bash
# View current cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove FR3K self-improvement cron
crontab -e
# Delete the line containing "daily-self-improvement.sh"
```

---

## Log Files

### Location

```
~/fr3k-self-improvement/logs/
├── research-YYYYMMDD-HHMMSS.log     # Research phase logs
├── analysis-YYYYMMDD-HHMMSS.log      # Analysis phase logs
├── integration-YYYYMMDD-HHMMSS.log   # Integration phase logs
├── verification-YYYYMMDD-HHMMSS.log  # Verification phase logs
├── daily-run-YYYYMMDD-HHMMSS.log    # Full pipeline logs
├── cron.log                          # Cron job output
├── latest-research.json              # Latest research results
└── action-plan.json                  # Latest action plan
```

### Retention

- Logs automatically deleted after 30 days
- Manual cleanup: `rm ~/fr3k-self-improvement/logs/*.log`

---

## Troubleshooting

### Research Phase Hangs

**Symptom:** Script stops at "Searching GitHub..."

**Cause:** GitHub API timeout or rate limit

**Fix:** Script has 10s timeout, will skip and continue

---

### Integration Skips Everything

**Symptom:** All actions show "SKIPPED (requires manual review)"

**Cause:** Default behavior requires manual approval

**Fix:** Review findings in `action-plan.json`, use `--auto-apply` for low-risk updates

---

### Verification Fails

**Symptom:** MCP server tests fail

**Cause:** Server startup time > timeout

**Fix:** Verify servers work manually:
```bash
npx -y hey-fr3k --version
npx -y fr3k-think --version
```

---

### Cron Job Not Running

**Symptom:** No logs generated

**Cause:** Cron not installed or not running

**Fix:**
```bash
# Check cron service
systemctl status cron

# Check cron job is installed
crontab -l | grep self-improvement

# Test cron syntax
crontab -l | grep -v "^#" | crontab -
```

---

## Dependencies

**Required:**
- `bash` — Script execution
- `jq` — JSON parsing
- `npm` — Package version checks
- `curl` — HTTP requests (GitHub API, voice notifications)

**Install:**
```bash
sudo apt-get install jq curl
npm comes with Node.js
```

---

## Voice Notifications

The system uses the voice server for status updates:

**Events announced:**
- Research completes with findings
- Analysis creates action plan
- Integration completes
- Verification finds critical issues

**Voice server:** `http://localhost:8888`

**Disable notifications:** Comment out `curl` calls in scripts

---

## Customization

### Change Research Targets

Edit `~/fr3k-self-improvement/scripts/research.sh`:

```bash
# Add more MCP servers
MCP_SERVERS=(
    "hey-fr3k"
    "fr3k-think"
    "md-mcp"
    "unified-pantheon-mcp"
    "your-new-server"  # Add here
)
```

### Change Schedule

Edit `~/fr3k-self-improvement/cron-entry.txt`:

```cron
# Example: Run at 6:00 AM every Monday
0 6 * * 1 $HOME/fr3k-self-improvement/daily-self-improvement.sh
```

Then reinstall:
```bash
~/fr3k-self-improvement/install-cron.sh
```

### Change Auto-Integration Rules

Edit `~/fr3k-self-improvement/scripts/analyze.sh`:

```bash
# Example: Auto-integrate high-impact MCP updates
if [ "$impact" = "high" ] && [ "$type" = "mcp-server" ]; then
    action="update"
    auto="true"  # Changed from false
fi
```

---

## Real-World Example

### Run 1: Initial Discovery

```
=== Research ===
✅ Found 1 finding:
   - @modelcontextprotocol/sdk: ^0.5.0 → 1.26.0 (high impact)

=== Analysis ===
✅ Action plan created:
   - Update SDK (requires manual review)

=== Integration (Dry-Run) ===
⏭️  Skipped: SDK update requires manual review
   Review action-plan.json for details

=== Verification ===
✅ System healthy: All 4 MCP servers operational
```

### Run 2: After Manual Update

```
=== Research ===
✅ Found 0 findings
   System is up to date!
```

---

## System Status

**Current state:**
- ✅ Research phase: Working
- ✅ Analysis phase: Working
- ✅ Integration phase: Working (dry-run tested)
- ⚠️  Verification phase: Working (needs timeout improvements)

**Known issues:**
1. GitHub API calls timeout occasionally (handled gracefully)
2. Verification script needs timeout tuning for slow servers
3. npm package checks can be slow on first run

**Future improvements:**
1. Add web dashboard for viewing findings
2. Implement one-click update approval
3. Add changelog extraction and display
4. Create rollback automation
5. Add email/Telegram notifications for critical findings

---

**Version:** 1.0.0
**Last Updated:** 2026-02-24
**Maintained by:** FR3K Self-Improvement System
