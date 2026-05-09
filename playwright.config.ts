import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Foto Segundo
 * Port 3000 (Frontend) | Port 3001 (Backend)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Orquestração de Servidores */
  webServer: [
    {
      command: 'npm run dev:frontend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev:backend',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe',
    }
  ],
});
