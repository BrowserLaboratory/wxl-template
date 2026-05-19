/**
 * Challenge Service Worker
 * Intercepts https://challenge-<slug>.localhost/* and routes to the
 * appropriate runtime via MessageChannel relay (Python) or PHP dispatch.
 *
 * Protocol:
 *   Page → SW: { type: 'REGISTER_CHALLENGE', slug, backend, port: MessagePort }
 *   SW  → Page (via port): { type: 'HANDLE_REQUEST', method, url, headers, body, responsePort }
 *   Page → SW (via responsePort): { status, headers, body: ArrayBuffer }
 */

const CHALLENGE_HOST_RE = /^challenge-[^.]+\.localhost$/

/** slug → { backend: string, port: MessagePort } */
const registry = new Map()

/** slug → Array of resolve callbacks waiting for registration */
const pendingRegistrations = new Map()

const production = self.location.hostname !== 'localhost'

// ─── Message handling ─────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const msg = event.data
  if (!msg?.type) return

  if (msg.type === 'REGISTER_CHALLENGE') {
    const entry = { backend: msg.backend ?? 'flask', port: msg.port ?? null }
    registry.set(msg.slug, entry)
    event.source?.postMessage({ type: 'REGISTERED' })

    // Resolve any fetches that arrived before registration
    const resolvers = pendingRegistrations.get(msg.slug)
    if (resolvers) {
      resolvers.forEach(r => r(entry))
      pendingRegistrations.delete(msg.slug)
    }
  } else if (msg.type === 'UNREGISTER_CHALLENGE') {
    registry.delete(msg.slug)
  }
})

// ─── Wait for registration (safety net for SW-intercepted sub-resource loads) ─

function waitForRegistration(slug, timeoutMs) {
  return new Promise((resolve) => {
    const resolvers = pendingRegistrations.get(slug) ?? []

    function onRegistered(entry) {
      clearTimeout(timer)
      resolve(entry)
    }

    const timer = setTimeout(() => {
      const current = pendingRegistrations.get(slug)
      if (current) {
        const idx = current.indexOf(onRegistered)
        if (idx !== -1) current.splice(idx, 1)
        if (current.length === 0) pendingRegistrations.delete(slug)
      }
      resolve(undefined)
    }, timeoutMs)

    resolvers.push(onRegistered)
    pendingRegistrations.set(slug, resolvers)
  })
}

// ─── Fetch interception ───────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (!CHALLENGE_HOST_RE.test(url.hostname)) return  // pass through

  // Intercepts both regular fetch and navigation requests (request.mode === 'navigate'),
  // e.g. when BrowserPanel iframe link clicks are handled via dispatch().
  event.respondWith(handleChallengeRequest(event.request, url))
})

async function handleChallengeRequest(request, url) {
  const slug = url.hostname.replace(/^challenge-/, '').replace(/\.localhost$/, '')
  let entry = registry.get(slug)

  if (!entry) {
    entry = await waitForRegistration(slug, 3000)
  }

  if (!entry) {
    return jsonResponse({ error: 'challenge not registered' }, 503)
  }

  try {
    const { backend, port } = entry

    if (backend === 'flask' || backend === 'fastapi' || backend === 'php') {
      if (!port) {
        return jsonResponse({ error: 'runtime not ready (no port registered)' }, 503)
      }
      return await relayRequest(port, request)
    }

    return jsonResponse({ error: `unknown backend: ${backend}` }, 501)
  } catch (err) {
    if (production) {
      return jsonResponse({ error: 'Internal Server Error' }, 500)
    }
    return jsonResponse({ error: err.message, stack: err.stack }, 500)
  }
}

/**
 * Relay an HTTP request to the challenge page via MessageChannel.
 * Creates a per-request channel, sends request data to the page, waits for response.
 */
async function relayRequest(challengePort, request) {
  // Serialize request
  const method = request.method
  const url = request.url
  const headers = [...request.headers.entries()]
  const bodyBuffer = request.body
    ? (await request.arrayBuffer())
    : null

  // Per-request channel: SW listens on port1, page gets port2 as responsePort
  const rc = new MessageChannel()

  const responsePromise = new Promise((resolve, reject) => {
    rc.port1.onmessage = (event) => {
      rc.port1.close()
      resolve(event.data)
    }
    rc.port1.onmessageerror = (event) => {
      rc.port1.close()
      reject(new Error('MessageChannel error: ' + String(event)))
    }
  })

  // Send request to page; transfer body buffer and responsePort
  const transferables = [rc.port2]
  if (bodyBuffer) transferables.push(bodyBuffer)

  challengePort.postMessage(
    { type: 'HANDLE_REQUEST', method, url, headers, body: bodyBuffer, responsePort: rc.port2 },
    transferables,
  )

  // Await the serialized response from the page
  const { status, headers: resHeaders, body: resBody } = await responsePromise

  const responseHeaders = new Headers()
  for (const [k, v] of (resHeaders ?? [])) {
    responseHeaders.set(k, v)
  }

  return new Response(resBody ?? null, { status, headers: responseHeaders })
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
