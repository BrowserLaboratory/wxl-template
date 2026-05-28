import { test, expect } from '@playwright/test'

// Site-smoke runs against the built site served by `vitepress preview` (4173,
// configured in playwright.site.config.ts). It asserts the production bundle
// renders — it is NOT a challenge-solve test (that is challenge-verify L3 under
// tests/challenges). Selectors target stable rendered content (hero action
// labels, feature titles, the challenge description panel) rather than
// VitePress-internal class names, so they survive VitePress version bumps.

test('homepage renders', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')

  // Hero action + a feature card prove the home layout and HomeContent mounted.
  await expect(page.getByRole('link', { name: 'Start Challenge' })).toBeVisible()
  await expect(page.getByText('Browser Emulator')).toBeVisible()

  expect(pageErrors, `uncaught page errors on homepage: ${pageErrors.join(' | ')}`).toEqual([])
})

test('reference challenge page mounts', async ({ page }) => {
  await page.goto('/challenge/door-is-open/')

  // The ChallengeLayout shell renders the description panel and markdown body
  // immediately, independent of the WASM runtime boot (which is out of scope
  // for a smoke check).
  const descriptionPanel = page.locator('[data-description-panel]')
  await expect(descriptionPanel).toBeVisible()
  await expect(descriptionPanel.getByText('FileHub')).toBeVisible()
})
