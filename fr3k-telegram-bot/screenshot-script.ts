import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch();
  
  // Desktop - 1920x1080
  const contextDesktop = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto('https://2vibeornot2vibe.vercel.app', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(2000);
  await pageDesktop.screenshot({ 
    path: '/home/fr3k/fr3k-telegram-bot/screenshots/desktop-full.png',
    fullPage: true 
  });
  await contextDesktop.close();
  
  // Tablet - 768x1024
  const contextTablet = await browser.newContext({
    viewport: { width: 768, height: 1024 }
  });
  const pageTablet = await contextTablet.newPage();
  await pageTablet.goto('https://2vibeornot2vibe.vercel.app', { waitUntil: 'networkidle' });
  await pageTablet.waitForTimeout(2000);
  await pageTablet.screenshot({ 
    path: '/home/fr3k/fr3k-telegram-bot/screenshots/tablet-full.png',
    fullPage: true 
  });
  await contextTablet.close();
  
  // Mobile - 375x812
  const contextMobile = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('https://2vibeornot2vibe.vercel.app', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(2000);
  await pageMobile.screenshot({ 
    path: '/home/fr3k/fr3k-telegram-bot/screenshots/mobile-full.png',
    fullPage: true 
  });
  await contextMobile.close();
  
  await browser.close();
  console.log('All screenshots captured successfully');
}

captureScreenshots().catch(console.error);
