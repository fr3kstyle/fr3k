import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially for better error tracking
  reporter: [
    ['html', { outputFolder: '/home/fr3k/pai-telegram-bot/tests/test-report' }],
    ['list'],
    ['json', { outputFile: '/home/fr3k/pai-telegram-bot/tests/test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Don't start a server - metrics-server should already be running
    command: '',
    port: 3000,
    reuseExistingServer: true,
  },
});
