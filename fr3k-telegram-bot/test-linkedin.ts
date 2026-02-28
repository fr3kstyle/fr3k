#!/usr/bin/env bun
/**
 * Test LinkedIn automation - basic browser operations
 */

import { LinkedInAutomation } from '/home/fr3k/.claude/skills/LinkedIn/index.ts'

async function testLinkedIn() {
  console.log('Testing LinkedIn automation...')

  const linkedin = new LinkedInAutomation({
    headless: true,
    screenshotDir: '/tmp/linkedin-screenshots/'
  })

  try {
    await linkedin.init()

    console.log('Navigating to example.com (simple test)...')
    await linkedin.navigate('https://example.com')

    console.log('Taking screenshot...')
    const screenshotPath = await linkedin.screenshot('test.png')
    console.log('Screenshot saved to:', screenshotPath)

    console.log('Checking authentication status...')
    const isAuthenticated = await linkedin.isAuthenticated()
    console.log('Authenticated:', isAuthenticated)

    console.log('Test completed successfully!')
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await linkedin.close()
  }
}

testLinkedIn()
