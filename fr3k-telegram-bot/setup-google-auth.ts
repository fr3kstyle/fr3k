#!/usr/bin/env bun
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createServer } from 'http';

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

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

console.log('═══════════════════════════════════════════════════════════');
console.log('🔑 Google Workspace OAuth Setup');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('1. Visit this URL in your browser:');
console.log(`\n${authUrl}\n`);
console.log('2. Accept the permissions');
console.log('3. Google will redirect to http://localhost:8080');
console.log('4. Script will automatically capture the code and complete setup\n');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('🔄 Waiting for authorization callback on http://localhost:8080...\n');

// Create local server to handle OAuth callback
const server = createServer((req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  if (url.pathname === '/') {
    const code = url.searchParams.get('code');

    if (code) {
      console.log('✅ Authorization code received!');

      oauth2Client.getAccessToken(code).then(({ tokens }) => {
        if (!tokens.refresh_token) {
          console.error('❌ No refresh token received');
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Error: No refresh token. Try again.</h1>');
          server.close();
          return;
        }

        // Save tokens
        import('fs/promises').then(({ writeFile }) => {
          const tokenPath = '/home/fr3k/.config/pai-gmail-tokens.json';
          writeFile(tokenPath, JSON.stringify(tokens, null, 2)).then(() => {
            console.log('✅ Tokens saved successfully!');
            console.log(`📁 Location: ${tokenPath}\n`);

            // Test access
            import('googleapis').then(({ google }) => {
              oauth2Client.setCredentials(tokens);

              const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
              gmail.users.getProfile({ userId: 'me' }).then(profile => {
                console.log(`✅ Gmail access verified!`);
                console.log(`📧 Email: ${profile.data.emailAddress}`);
                console.log(`📬 Total messages: ${profile.data.messagesTotal}`);

                const drive = google.drive({ version: 'v3', auth: oauth2Client });
                drive.files.list({ pageSize: 5 }).then(files => {
                  console.log(`📁 Drive files accessible: ${files.data.files?.length || 0}`);

                  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
                  calendar.calendarList.list().then(calList => {
                    console.log(`📅 Calendars accessible: ${calList.data.items?.length || 0}`);
                    console.log('\n✅ Full Google Workspace access configured!');

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<h1>✅ Success! Google Workspace access configured.</h1><p>You can close this window.</p>');
                    server.close();
                  });
                });
              });
            });
          });
        });
      }).catch(err => {
        console.error('❌ Error exchanging code:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error: ${err.message}</h1>`);
        server.close();
      });
    } else {
      console.error('❌ No authorization code in request');
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error: No authorization code received</h1>');
    }
  }
});

server.listen(8080, () => {
  console.log('🎯 OAuth server running on http://localhost:8080');
  console.log('💡 Open the auth URL above in your browser\n');
});
