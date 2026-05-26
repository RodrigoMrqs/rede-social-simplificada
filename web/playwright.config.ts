import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../server && npm run dev',
      port: 3001,
      timeout: 30000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev -- --port 3000',
      port: 3000,
      timeout: 60000,
      reuseExistingServer: true,
    },
  ],
});
