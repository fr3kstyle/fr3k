#!/usr/bin/env bun
/**
 * Automated Google OAuth Setup via Playwright
 *
 * Runs headless, captures console output, and handles the full OAuth flow
 * automatically using the Google Cloud Console interface.
 */

import { chromium, ConsoleMessage } from 'playwright';
import { writeFile } from 'fs/promises';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createServer } from 'http';

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

async function setupGoogleOAuth() {
  console.log('🔑 Starting automated Google OAuth setup...\n');

  // OAuth client
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    'http://localhost:8080'
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  // Start callback server FIRST to catch the redirect
  const callbackPromise = new Promise<{ code: string }>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);

      if (url.pathname === '/') {
        const code = url.searchParams.get('code');

        if (code) {
          console.log('✅ OAuth callback received!');
          resolve({ code });
        } else {
          reject(new Error('No authorization code in request'));
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>✅ Authorization received! You can close this window.</h1>');
        server.close();
      }
    });

    server.listen(8080, () => {
      console.log('🎯 Callback server listening on http://localhost:8080');
    });
  });

  // Now launch browser and navigate to OAuth
  await new Promise(resolve => setTimeout(resolve, 1000)); // Let server start

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', async (msg: ConsoleMessage) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      console.error(`  [Browser Console ERROR] ${text}`);
    } else if (type === 'warning') {
      console.warn(`  [Browser Console WARN] ${text}`);
    } else if (type === 'log') {
      console.log(`  [Browser Console LOG] ${text}`);
    }
  });

  // Capture network errors
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.error(`  [Network Error] ${response.url()} → ${response.status()}`);
    }
  });

  console.log(`📝 Navigating to Google OAuth...`);

  try {
    // Navigate to OAuth URL
    await page.goto(authUrl, { waitUntil: 'networkidle' });

    console.log('✅ Page loaded');

    // Check if we need to sign in
    const signInForm = await page.locator('form[data-signin="true"]').count();
    if (signInForm > 0) {
      console.log('\n❌ Google Sign-In required');
      console.log('Please sign in to your Google account in the browser.');
      console.log('Waiting for authentication...\n');

      // Wait for redirect (user needs to sign in manually)
      await page.waitForURL(/\/o\/oauth2\/v2\/auth/, { timeout: 120000 });
    }

    // Check for consent screen
    const consentButton = page.locator('button:has-text("Allow")').first();
    const consentCount = await consentButton.count();

    if (consentCount > 0) {
      console.log('📋 Found consent screen - clicking Allow...');

      // Click all consent buttons if multiple
      const consentButtons = page.locator('button:has-text("Allow")');
      const buttonCount = await consentButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        console.log(`  Clicking Allow button ${i + 1}/${buttonCount}...`);
        await consentButtons.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    console.log('✅ Permissions granted');

    // Wait for callback server to receive the code
    console.log('⏳ Waiting for OAuth callback...');

    const { code } = await callbackPromise;

    console.log(`✅ Authorization code captured: ${code.substring(0, 10)}...`);

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');

    const { tokens } = await oauth2Client.getAccessToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received');
    }

    console.log('✅ Tokens received');

    // Save tokens
    const tokenPath = '/home/fr3k/.config/pai-gmail-tokens.json';
    await writeFile(tokenPath, JSON.stringify(tokens, null, 2));

    console.log(`✅ Tokens saved to: ${tokenPath}\n`);

    // Test access
    console.log('🧪 Testing Google Workspace access...');

    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    console.log(`✅ Gmail: ${profile.data.emailAddress}`);
    console.log(`📬 Total messages: ${profile.data.messagesTotal}`);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const files = await drive.files.list({ pageSize: 5 });

    console.log(`📁 Drive files: ${files.data.files?.length || 0}`);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calList = await calendar.calendarList.list();

    console.log(`📅 Calendars: ${calList.data.items?.length || 0}\n`);

    console.log('✅ Full Google Workspace access configured!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run
setupGoogleOAuth().catch(console.error);
