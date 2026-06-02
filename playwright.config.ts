import { defineConfig, devices } from '@playwright/test';

const websiteUrl = process.env.E2E_WEBSITE_URL || 'http://localhost:3000';
const adminUrl = process.env.E2E_ADMIN_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'website',
      use: { baseURL: websiteUrl, ...devices['Desktop Chrome'] },
      testMatch: /website\..*\.spec\.ts/,
    },
    {
      name: 'admin',
      use: { baseURL: adminUrl, ...devices['Desktop Chrome'] },
      testMatch: /admin\..*\.spec\.ts/,
    },
  ],
});
