#!/usr/bin/env bun
/**
 * Test Playwright browser launch
 */

import { chromium } from 'playwright'

async function testBrowser() {
  console.log('Launching browser...')

  const browser = await chromium.launch({
    headless: true
  })

  console.log('Browser launched successfully!')

  const page = await browser.newPage()

  console.log('Navigating to example.com...')
  await page.goto('https://example.com')

  const title = await page.title()
  console.log('Page title:', title)

  const screenshotPath = '/tmp/test-screenshot.png'
  await page.screenshot({ path: screenshotPath })
  console.log('Screenshot saved to:', screenshotPath)

  await browser.close()
  console.log('Test completed successfully!')
}

testBrowser().catch(console.error)
