import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for wxl challenge verify gate (L3).
 *
 * Scope is intentionally narrow: only `tests/challenges/<slug>.spec.ts` files
 * count as Playwright suites. The Vitest unit tests in `tests/` and
 * `tests/unit/` are not Playwright tests and must not be scanned.
 */
export default defineConfig({
  testDir: 'tests/challenges',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? 'list' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
