export interface PhpInstance {
  run(code: string): Promise<{ output: string; headers: string[]; exitCode: number }>
  writeFile(path: string, data: Uint8Array): void
}

export type LoadPhpFn = () => Promise<PhpInstance>

/**
 * Wraps php-wasm to execute PHP challenge code.
 * Initialized once per session; superglobals are set per-request.
 */
export class PhpRuntime {
  private php: PhpInstance | null = null
  private initPromise: Promise<void> | null = null
  private appCode = ''
  private readonly loadPhp: LoadPhpFn

  constructor(loadPhp: LoadPhpFn) {
    this.loadPhp = loadPhp
  }

  async initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this._init(appCode, fsEntries)
    return this.initPromise
  }

  private async _init(appCode: string, fsEntries: Record<string, Uint8Array>): Promise<void> {
    this.php = await this.loadPhp()
    this.appCode = appCode
    for (const [path, data] of Object.entries(fsEntries)) {
      this.php.writeFile(path, data)
    }
  }

  async handleRequest(request: Request): Promise<Response> {
    if (!this.php) throw new Error('PhpRuntime not initialized')

    const url = new URL(request.url)
    const method = request.method.toUpperCase()
    const getParams = Object.fromEntries(url.searchParams)

    const rawBody = request.body ? await request.text() : ''
    const contentType = request.headers.get('content-type') ?? ''

    let postParams: Record<string, string> = {}
    if (method === 'POST' && contentType.includes('application/x-www-form-urlencoded')) {
      postParams = Object.fromEntries(new URLSearchParams(rawBody))
    }

    const cookieHeader = request.headers.get('cookie') ?? request.headers.get('x-wxlsh-cookie') ?? ''
    const cookieParams = parseCookieHeader(cookieHeader)

    const serverSetup = buildServerSetup(method, url)
    const getSetup = buildArraySetup('$_GET', getParams)
    const postSetup = buildArraySetup('$_POST', postParams)
    const cookieSetup = buildArraySetup('$_COOKIE', cookieParams)

    const code = [
      '<?php',
      serverSetup,
      getSetup,
      postSetup,
      cookieSetup,
      `$GLOBALS['_RAW_INPUT'] = '${escapePhpString(rawBody)}';`,
      '?>',
      this.appCode,
    ].join('\n')

    const { output, headers } = await this.php.run(code)

    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'text/html')
    for (const h of headers) {
      const idx = h.indexOf(':')
      if (idx !== -1) {
        responseHeaders.set(h.slice(0, idx).trim(), h.slice(idx + 1).trim())
      }
    }

    return new Response(output, { status: 200, headers: responseHeaders })
  }

  get isReady(): boolean {
    return this.php !== null
  }
}

function buildServerSetup(method: string, url: URL): string {
  return `$_SERVER = array_merge($_SERVER ?? [], [
  'REQUEST_METHOD' => '${method}',
  'REQUEST_URI' => '${escapePhpString(url.pathname + (url.search || ''))}',
  'HTTP_HOST' => '${escapePhpString(url.hostname)}',
]);`
}

function buildArraySetup(varName: string, params: Record<string, string>): string {
  const entries = Object.entries(params)
    .map(([k, v]) => `  '${escapePhpString(k)}' => '${escapePhpString(v)}'`)
    .join(',\n')
  return `${varName} = [\n${entries}\n];`
}

function escapePhpString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function parseCookieHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const pair of header.split(';')) {
    const trimmed = pair.trim()
    if (!trimmed) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) {
      // name-only cookie with no value
      cookies[trimmed] = ''
    } else {
      const name = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      // Last-value-wins for duplicate names
      cookies[name] = value
    }
  }
  return cookies
}
