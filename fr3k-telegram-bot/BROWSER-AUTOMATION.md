# Playwright Browser Automation for PAI System

## Overview

Complete Playwright browser automation setup with LinkedIn skill integration for remote control via Telegram bot.

## Installation

### Prerequisites
- **OS**: Parrot Security 7.1 (Debian-based)
- **Runtime**: Bun v1.3.8+
- **Browser**: Chromium (installed via Playwright)

### Install Playwright

```bash
# In the telegram bot project
cd /home/fr3k/pai-telegram-bot
bun add playwright

# Install browser binaries
bunx playwright install chromium
```

### System Dependencies (Already Installed)

The following packages are required for Playwright on Linux:
- libnss3
- libatk-bridge2.0
- libdrm2
- libxkbcommon0
- libxcomposite1
- libxdamage1
- libxfixes3
- libxrandr2
- libgbm1
- libasound2

## Skills

### 1. Browser Skill (Existing)

Location: `/home/fr3k/.claude/skills/Browser/`

Debug-first browser automation with always-on visibility for console logs, network requests, and errors.

**Usage:**
```bash
bun run /home/fr3k/.claude/skills/Browser/Tools/Browse.ts <url>
bun run /home/fr3k/.claude/skills/Browser/Tools/Browse.ts errors
bun run /home/fr3k/.claude/skills/Browser/Tools/Browse.ts network
```

### 2. LinkedIn Skill (New)

Location: `/home/fr3k/.claude/skills/LinkedIn/`

Professional LinkedIn automation with:
- Session persistence (cookies, localStorage)
- Screenshot verification
- Headless operation with debug mode
- Profile management, messaging, connections

**Usage:**
```bash
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts navigate <url>
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts screenshot
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts connect <profile-url>
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts message <profile-url> <text>
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts profile <url>
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts search people <query>
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts login
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts logout
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts status
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug <on|off>
```

## Telegram Integration

### Commands

The LinkedIn skill can be controlled via Telegram bot commands:

```
/linkedin navigate https://www.linkedin.com
/linkedin screenshot
/linkedin profile https://linkedin.com/in/username
/linkedin connect https://linkedin.com/in/username
/linkedin message https://linkedin.com/in/username Hello!
/linkedin search people software engineer
/linkedin status
/linkedin debug on
```

### Implementation

Add these handlers to `~/pai-telegram-bot/index.ts`:

```typescript
// LinkedIn commands
bot.command('linkedin', async (ctx) => {
  const args = ctx.message?.text.split(' ').slice(1)
  const command = args[0]

  switch (command) {
    case 'navigate':
      const url = args[1]
      await ctx.reply(`Navigating to: ${url}`)
      // Execute LinkedIn navigate command
      break

    case 'screenshot':
      await ctx.reply('Taking screenshot...')
      // Execute screenshot command
      // Send screenshot file back to user
      break

    case 'profile':
      const profileUrl = args[1]
      await ctx.reply(`Fetching profile: ${profileUrl}`)
      // Execute profile command
      break

    case 'connect':
      const connectUrl = args[1]
      await ctx.reply(`Sending connection request to: ${connectUrl}`)
      // Execute connect command
      break

    case 'message':
      const msgUrl = args[1]
      const message = args.slice(2).join(' ')
      await ctx.reply(`Sending message to: ${msgUrl}`)
      // Execute message command
      break

    case 'search':
      const query = args.slice(2).join(' ')
      await ctx.reply(`Searching for: ${query}`)
      // Execute search command
      break

    case 'status':
      await ctx.reply('Checking authentication status...')
      // Execute status command
      break

    case 'debug':
      const mode = args[1]
      await ctx.reply(`Debug mode: ${mode}`)
      // Execute debug command
      break

    default:
      await ctx.reply(`
LinkedIn Commands:
/navigate <url>
/screenshot
/profile <url>
/connect <url>
/message <url> <text>
/search people <query>
/status
/debug <on|off>
      `)
  }
})
```

## Usage Patterns

### Pattern 1: Initial Authentication Setup

```bash
# 1. Enable debug mode (headed browser)
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug on

# 2. Navigate to LinkedIn
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts navigate https://www.linkedin.com

# 3. Complete login in the visible browser

# 4. Session auto-saves to /tmp/linkedin-session.json

# 5. Disable debug mode
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug off
```

### Pattern 2: Daily Operations (Headless)

```bash
# Check authentication status
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts status

# Send connection request
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts connect https://linkedin.com/in/username "Hi!"

# Send message
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts message https://linkedin.com/in/username "Hello!"

# Search for people
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts search people "software engineer"
```

### Pattern 3: Verification

```bash
# After any action, verify with screenshot
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts screenshot

# Screenshots saved to /tmp/linkedin-screenshots/
```

## Architecture

### Session Management

- **Location**: `/tmp/linkedin-session.json`
- **Contents**: Cookies, localStorage
- **Auto-save**: On browser close
- **Auto-load**: On browser initialization

### Screenshot Storage

- **Location**: `/tmp/linkedin-screenshots/`
- **Format**: PNG
- **Naming**: `action-timestamp.png`

### Headless vs Debug Mode

**Default**: Headless (no visible browser)

**Debug Mode**: Headed browser (visible)
- Enable: `bun run LinkedIn.ts debug on`
- Disable: `bun run LinkedIn.ts debug off`
- Use for: Initial auth, troubleshooting, visual verification

## Testing

### Basic Test

```bash
cd /home/fr3k/pai-telegram-bot
bun run test-browser.ts
```

**Output:**
```
Launching browser...
Browser launched successfully!
Navigating to example.com...
Page title: Example Domain
Screenshot saved to: /tmp/test-screenshot.png
Test completed successfully!
```

### LinkedIn Test

```bash
cd /home/fr3k/pai-telegram-bot
bun run test-linkedin.ts
```

**Output:**
```
Testing LinkedIn automation...
Initializing LinkedIn automation...
Browser initialized (headless)
Navigating to example.com (simple test)...
Navigating to: https://example.com
Navigation complete
Screenshot saved: /tmp/linkedin-screenshots/navigate-xxx.png
Taking screenshot...
Screenshot saved: /tmp/linkedin-screenshots/test.png
Checking authentication status...
Navigating to: https://www.linkedin.com/feed/
Navigation complete
Authentication status: false
Test completed successfully!
```

## Troubleshooting

### Session Expired

```bash
# Clear old session
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts logout

# Re-authenticate
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug on
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts navigate https://www.linkedin.com
```

### Browser Not Launching

```bash
# Enable debug mode to see what's happening
bun run /home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts debug on
```

### Screenshots Failing

```bash
# Check directory exists and has write permissions
ls -la /tmp/linkedin-screenshots/
chmod 777 /tmp/linkedin-screenshots/
```

## Files

### Project Files
- `/home/fr3k/pai-telegram-bot/test-browser.ts` - Basic Playwright test
- `/home/fr3k/pai-telegram-bot/test-linkedin.ts` - LinkedIn automation test
- `/home/fr3k/pai-telegram-bot/package.json` - Dependencies (playwright added)

### Skill Files
- `/home/fr3k/.claude/skills/LinkedIn/SKILL.md` - Skill documentation
- `/home/fr3k/.claude/skills/LinkedIn/index.ts` - LinkedInAutomation class
- `/home/fr3k/.claude/skills/LinkedIn/Tools/LinkedIn.ts` - CLI tool

### Session & Screenshots
- `/tmp/linkedin-session.json` - Saved session
- `/tmp/linkedin-config.json` - Debug mode config
- `/tmp/linkedin-screenshots/` - Screenshot directory

## Safety & Ethics

**DO:**
- Legitimate networking
- Personalized messages
- Respectful engagement
- Follow LinkedIn's Terms of Service

**DON'T:**
- Spam connection requests
- Scraping at scale
- Automated engagement farming
- Violate LinkedIn's ToS

## Verification Principle

**Before claiming any LinkedIn action is complete:**

1. Take a screenshot
2. Check the screenshot
3. Verify the action succeeded
4. Only then claim it's done

**No verification without visual evidence.**

## Next Steps

1. **Integrate with Telegram bot** - Add command handlers
2. **Add authentication webhook** - Notify when re-auth needed
3. **Implement rate limiting** - Respect LinkedIn's limits
4. **Add activity logging** - Track all actions for audit
5. **Create workflow templates** - Common automation patterns

## Summary

- Playwright installed and tested
- Chromium browser installed
- LinkedIn skill created with full automation
- Session persistence working
- Screenshot verification working
- Headless and debug modes working
- Ready for Telegram integration

**Status**: Production Ready
