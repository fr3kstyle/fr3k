# Automated Browser Testing with vibium

**When to use:** Automated UI testing, form filling, screenshot verification, end-to-end testing

## Overview

This workflow uses vibium MCP tools for browser automation without manual setup. vibium automatically downloads Chrome for Testing and provides 21 MCP tools for browser control.

## Tools Available

- `browser_launch`: Start browser (headless or visible)
- `browser_navigate`: Go to URL
- `browser_click`: Click elements by CSS selector
- `browser_type`: Type text into inputs
- `browser_screenshot`: Capture viewport
- `browser_find`: Find element info
- `browser_get_text`: Extract page text
- `browser_evaluate`: Execute JavaScript
- `browser_quit`: Close browser
- And 12 more tools for tabs, waiting, scrolling, etc.

## MCP Configuration

Already configured in `~/.claude/settings.json`:

```json
"vibium": {
  "command": "npx",
  "args": ["-y", "vibium"],
  "type": "command"
}
```

## Example Workflow

### 1. Launch Browser

```
Use browser_launch with headless=false for visible browser or headless=true for background testing
```

### 2. Navigate to Page

```
Use browser_navigate with URL="https://example.com"
```

### 3. Interact with Elements

```
Use browser_click with selector="button.submit"
Use browser_type with selector="input[name=email]" and text="user@example.com"
```

### 4. Verify Results

```
Use browser_screenshot to capture page state
Use browser_get_text to extract content for validation
Use browser_evaluate with expression="document.querySelector('.status').textContent" to check values
```

### 5. Cleanup

```
Use browser_quit to close browser when done
```

## Best Practices

- **Wait for elements**: Use browser_wait before interacting (attached, visible, hidden states)
- **Screenshots for debugging**: Capture after each major step
- **CSS selectors**: Prefer specific selectors over generic ones
- **Error handling**: Check element exists before clicking

## Integration with QATester

This workflow integrates with QATester capability for automated verification:
1. QATester invokes vibium MCP tools
2. Captures screenshots and page state
3. Validates against acceptance criteria
4. Reports results with evidence

## Resource Usage

- RAM: ~80MB when browser active
- Disk: Chrome for Testing cached in ~/.cache/vibium/
- On-demand: Only runs when invoked via MCP

## See Also

- FR3K CORE SKILL.md: Tool Integration section
- vibium GitHub: https://github.com/VibiumDev/vibium
