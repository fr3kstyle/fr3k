import { chromium } from 'playwright';

async function checkConsole() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleMessages.push(`[${type.toUpperCase()}] ${msg.text()}`);
    }
  });
  
  // Collect network errors
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    failedRequests.push(`[FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  await page.goto('https://2vibeornot2vibe.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('\n=== CONSOLE MESSAGES ===');
  if (consoleMessages.length === 0) {
    console.log('No errors or warnings detected');
  } else {
    consoleMessages.forEach(msg => console.log(msg));
  }
  
  console.log('\n=== FAILED REQUESTS ===');
  if (failedRequests.length === 0) {
    console.log('No failed requests detected');
  } else {
    failedRequests.forEach(req => console.log(req));
  }
  
  // Check page title and meta tags
  console.log('\n=== PAGE METADATA ===');
  const title = await page.title();
  console.log(`Title: ${title}`);
  
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  console.log(`Description: ${description || 'Missing'}`);
  
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  console.log(`Viewport: ${viewport || 'Missing'}`);
  
  await browser.close();
}

checkConsole().catch(console.error);
