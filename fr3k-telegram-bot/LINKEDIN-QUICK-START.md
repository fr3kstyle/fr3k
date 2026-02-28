# LinkedIn Automation - Quick Start

## Installation Complete

- Playwright installed
- Chromium browser installed
- LinkedIn skill created
- All tests passing

## Quick Test

```bash
# Test basic browser automation
bun run test-browser.ts

# Test LinkedIn automation
bun run test-linkedin.ts
```

## LinkedIn CLI Commands

```bash
# Navigate to URL
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts navigate https://www.linkedin.com

# Take screenshot
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts screenshot

# Get profile info
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts profile https://linkedin.com/in/username

# Send connection request
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts connect https://linkedin.com/in/username "Hi!"

# Send message
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts message https://linkedin.com/in/username "Hello!"

# Search for people
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts search people "software engineer"

# Check authentication status
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts status

# Enable debug mode (headed browser)
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug on

# Disable debug mode (headless)
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug off

# Clear session (logout)
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts logout
```

## First-Time Setup

1. Enable debug mode: `bun run LinkedIn.ts debug on`
2. Navigate to LinkedIn: `bun run LinkedIn.ts navigate https://www.linkedin.com`
3. Complete login in the visible browser
4. Session auto-saves
5. Disable debug mode: `bun run LinkedIn.ts debug off`

## Telegram Commands

```
/linkedin navigate <url>
/linkedin screenshot
/linkedin profile <url>
/linkedin connect <url>
/linkedin message <url> <text>
/linkedin search people <query>
/linkedin status
/linkedin debug on|off
```

## Files

- Session: `/tmp/linkedin-session.json`
- Screenshots: `/tmp/linkedin-screenshots/`
- Tests: `test-browser.ts`, `test-linkedin.ts`
- Docs: `BROWSER-AUTOMATION.md`

## Troubleshooting

**Session expired?**
```bash
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts logout
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug on
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts navigate https://www.linkedin.com
```

**Browser not launching?**
```bash
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug on
```

**Screenshots failing?**
```bash
ls -la /tmp/linkedin-screenshots/
chmod 777 /tmp/linkedin-screenshots/
```

## Status: Ready for Production

All systems tested and working. Ready for Telegram integration.
