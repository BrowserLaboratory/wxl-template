import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for the site-smoke gate.
 *
 * Distinct from `playwright.config.ts` (challenge-verify L3 — `tests/challenges`,
 * dev server 5173). This config drives smoke checks against the *built* site
 * served by `vitepress preview` (4173), so it exercises the production bundle
 * rather than the dev server. The two configs MUST stay isolated: site-smoke
 * scans only `tests/site-smoke`, challenge-verify scans only `tests/challenges`.
 */
export default defineConfig({
  testDir: 'tests/site-smoke',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },
  // Boot `vitepress preview` and wait until 4173 answers before any test runs.
  // This is the primary mitigation for preview-server startup races. The site
  // must already be built (`pnpm build`); this command only serves the artifact.
  webServer: {
    command: 'pnpm docs:preview',
    url: 'http://localhost:4173',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
