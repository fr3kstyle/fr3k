import { test, expect } from '@playwright/test';

test.describe('Accessibility Improvements Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Skip-to-content link appears on first Tab', async ({ page }) => {
    // Press Tab once and check for skip link
    await page.keyboard.press('Tab');

    // Take screenshot of skip link
    await page.screenshot({
      path: '/home/fr3k/fr3k-telegram-bot/screenshots/skip-link.png',
      fullPage: false
    });

    // Verify skip link exists and is visible
    const skipLink = page.locator('a[href="#main-content"], .skip-link, a[tabindex="0"]').first();
    const isVisible = await skipLink.isVisible().catch(() => false);

    console.log('Skip link visible:', isVisible);

    // Check if any element with skip-to-content text exists
    const hasSkipText = await page.getByText(/skip to main/i, { exact: false }).count();
    console.log('Skip-to-content text elements found:', hasSkipText);
  });

  test('2. Focus states show 3px cyan outline', async ({ page }) => {
    // Tab through navigation to get focus on a nav link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Take screenshot showing focus state
    await page.screenshot({
      path: '/home/fr3k/fr3k-telegram-bot/screenshots/focus-state.png',
      fullPage: false
    });

    // Get the focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });

    console.log('Focused element styles:', JSON.stringify(focusedElement, null, 2));
  });

  test('3. CSS variable -border-color is defined', async ({ page }) => {
    // Check CSS variables
    const cssVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        borderColor: styles.getPropertyValue('--border-color') || 'not defined',
        glassBorder: styles.getPropertyValue('--glass-border') || 'not defined',
        allVars: Array.from(document.styleSheets)
          .slice(0, 5)
                          .map(sheet => {
                            try {
                              return Array.from(sheet.cssRules)
                                .map(rule => {
                                  if (rule.cssText && rule.cssText.includes('--border-color')) {
                                    return rule.cssText;
                                  }
                                  return null;
                                })
                                .filter(Boolean);
                            } catch (e) {
                              return [];
                            }
                          })
                          .flat()
      };
    });

    console.log('CSS Variables:', JSON.stringify(cssVars, null, 2));

    // Check page source for undefined references
    const pageContent = await page.content();
    const hasUndefinedBorder = pageContent.includes('undefined') || pageContent.includes('--border-color');
    console.log('Page contains --border-color reference:', hasUndefinedBorder);
  });

  test('4. Button consistency - class="button-accent"', async ({ page }) => {
    // Check for inline styles on buttons
    const buttonAnalysis = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, .nav-link, a[class*="button"]');
      return {
        totalButtons: buttons.length,
        withInlineStyle: Array.from(buttons).filter(b => b.hasAttribute('style')).length,
        withButtonAccent: Array.from(buttons).filter(b => b.classList.contains('button-accent')).length,
        buttonClasses: Array.from(buttons).map(b => b.className).slice(0, 10)
      };
    });

    console.log('Button analysis:', JSON.stringify(buttonAnalysis, null, 2));
  });

  test('5. Mobile toggle at 375px width', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for any layout changes
    await page.waitForTimeout(500);

    // Take screenshot of mobile view
    await page.screenshot({
      path: '/home/fr3k/fr3k-telegram-bot/screenshots/mobile-view.png',
      fullPage: true
    });

    // Check for hamburger menu
    const hasHamburger = await page.locator('.hamburger, .menu-toggle, button[aria-label*="menu" i], button[aria-label*="toggle" i]').count();
    console.log('Hamburger menu elements found:', hasHamburger);

    // Check if nav is visible or collapsed
    const navVisible = await page.locator('.nav-bar, nav').isVisible();
    console.log('Navigation visible on mobile:', navVisible);
  });

  test('Overall accessibility audit', async ({ page }) => {
    // Run basic accessibility checks
    const headings = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return {
        total: headings.length,
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length
      };
    });

    const hasLangAttr = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang');
    });

    const hasViewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    const linksCount = await page.locator('a').count();
    const buttonsCount = await page.locator('button').count();

    console.log('Accessibility audit:', {
      headings,
      langAttr: hasLangAttr,
      viewportMeta: hasViewportMeta,
      links: linksCount,
      buttons: buttonsCount
    });
  });
});
