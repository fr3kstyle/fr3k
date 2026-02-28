#!/usr/bin/env bun
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { writeFile } from 'fs/promises';

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
const code = process.argv[2];

if (!code) {
  console.error('❌ Usage: bun google-auth-callback.ts <AUTH_CODE>');
  process.exit(1);
}

const oauth2Client = new OAuth2Client(
  clientId,
  clientSecret,
  'urn:ietf:wg:oauth:2.0:oob'
);

try {
  console.log('🔄 Exchanging authorization code for tokens...');

  const { tokens } = await oauth2Client.getAccessToken(code);

  if (!tokens.refresh_token) {
    console.error('❌ No refresh token received. Make sure you selected all scopes.');
    process.exit(1);
  }

  // Save tokens
  const tokenPath = '/home/fr3k/.config/pai-gmail-tokens.json';
  await writeFile(tokenPath, JSON.stringify(tokens, null, 2));

  console.log('✅ Tokens saved successfully!');
  console.log(`📁 Location: ${tokenPath}`);
  console.log('\n🧪 Testing access...');

  // Test access
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  console.log(`\n✅ Gmail access verified!`);
  console.log(`📧 Email: ${profile.data.emailAddress}`);
  console.log(`📬 Total messages: ${profile.data.messagesTotal}`);

  // Test Drive
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const files = await drive.files.list({ pageSize: 5 });
  console.log(`📁 Drive files accessible: ${files.data.files?.length || 0}`);

  // Test Calendar
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const calList = await calendar.calendarList.list();
  console.log(`📅 Calendars accessible: ${calList.data.items?.length || 0}`);

  console.log('\n✅ Full Google Workspace access configured!');

} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
