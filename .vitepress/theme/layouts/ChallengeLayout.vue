<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import { useData, withBase } from 'vitepress'
import { Content } from 'vitepress/client'
import BrowserPanel from '../components/BrowserPanel.vue'
import WxlshPanel from '../components/WxlshPanel.vue'
import RepeatPanel from '../components/RepeatPanel.vue'
import NetworkPanel from '../components/NetworkPanel.vue'
import CodeEditorPanel from '../components/CodeEditorPanel.vue'
import FlagSubmit from '../components/FlagSubmit.vue'
import MergedNav from '../components/MergedNav.vue'
import NotesModal from '../components/NotesModal.vue'
import { PythonRuntime, installRequestsPatch, type LoadPyodideFn } from '../composables/usePythonRuntime'
import { PhpRuntime } from '../composables/usePhpRuntime'
import { useTrafficLog } from '../composables/useTrafficLog'
import { useAttackSession } from '../composables/useAttackSession'
import { usePentestNotes } from '../composables/usePentestNotes'
import { extractCustomSection } from '../composables/useWasmLoader'

// Module-level executionId for linking code_execution ↔ http_request events
let currentExecutionId: string | null = null

const { frontmatter, page } = useData()

// Derive slug from per-folder relativePath: "challenge/door-is-open/index.md" → "door-is-open"
const slug = computed(() => {
  const rel: string = page.value.relativePath ?? ''
  const parts = rel.replace(/\.md$/, '').split('/')
  // Per-folder: take parent dir name; flat fallback: take filename
  return parts.length >= 2 ? parts[parts.length - 2] : parts[parts.length - 1]
})

const fm = computed(() => frontmatter.value)

// ─── Runtime state ───────────────────────────────────────────────────────────
const runtimeReady = ref(false)
const runtimeError = ref<string | null>(null)

// Pyodide instance — set after Python runtime init; passed to WxlshPanel + CodeEditorPanel
type PyodidePublicAPI = { runPythonAsync(code: string): Promise<unknown>; globals: { get(k: string): unknown; set(k: string, v: unknown): void } }
// shallowRef: Pyodide instance must NOT be wrapped in Vue's reactive proxy.
// reactive() double-proxies the Pyodide PyProxy, breaking globals.set() with
// "TypeError: unhashable type: 'pyodide.ffi.JsProxy'".
const pyodideInstance = shallowRef<PyodidePublicAPI | null>(null)

// ─── SW readiness gate ───────────────────────────────────────────────────────
// swReady is true only when navigator.serviceWorker.controller is non-null.
// Without this, tools appear enabled before SW can intercept requests.
const swReady = ref(
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    ? navigator.serviceWorker.controller != null
    : false,
)

const toolsDisabled = computed(() => !runtimeReady.value || !swReady.value)

let runtime: PythonRuntime | PhpRuntime | null = null
let challengePort: MessagePort | null = null  // port1 — page listens here

// ─── Collapsible description panel ───────────────────────────────────────────
const descriptionCollapsed = ref(false)
function toggleDescription() {
  descriptionCollapsed.value = !descriptionCollapsed.value
}

// ─── Tab switching ────────────────────────────────────────────────────────────
type Tab = 'browser' | 'terminal' | 'repeater' | 'code' | 'network'
const ALL_TABS: { id: Tab; label: string }[] = [
  { id: 'browser', label: 'Browser' },
  { id: 'network', label: 'Network' },
  { id: 'repeater', label: 'Repeater' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'code', label: 'Code' },
]
// Terminal is opt-in: a challenge only gets a shell when its author asks for one.
const DEFAULT_TABS: Tab[] = ['browser', 'network', 'repeater', 'code']
const tabs = computed(() => {
  // Raw frontmatter, so config.ts's array check has not run. A bare `tools:`
  // line parses as null; anything malformed falls back rather than throwing.
  const allowedTools: unknown = fm.value.tools
  if (!Array.isArray(allowedTools)) return ALL_TABS.filter(t => DEFAULT_TABS.includes(t.id))
  // An explicit allowlist always keeps Browser — every challenge here is web
  // exploitation, so a page with no browser is never what the author meant.
  return ALL_TABS.filter(t => t.id === 'browser' || allowedTools.includes(t.id))
})
const hasTab = (id: Tab) => tabs.value.some(t => t.id === id)
const activeTab = ref<Tab>('browser')

// ─── Challenge dispatch: directly call runtime (bypasses SW round-trip) ──────
async function dispatch(request: Request): Promise<Response> {
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'runtime not ready' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return (runtime as PythonRuntime | PhpRuntime).handleRequest(request)
}

// ─── Traffic log ──────────────────────────────────────────────────────────────
const { trafficLog, wrap: wrapDispatch, clear: clearTrafficLog } = useTrafficLog()
const trackedDispatch = wrapDispatch(dispatch)

// ─── Forbidden header transport ──────────────────────────────────────────────
// Cookie is a forbidden request-header and Set-Cookie is a forbidden
// response-header in the Fetch API. new Request() and new Response() silently
// drop them. We transport via X-Wxlsh-Cookie / X-Wxlsh-Set-Cookie and convert
// back at the runtime boundary (usePythonRuntime.handleRequest).

/** Move Cookie → X-Wxlsh-Cookie before creating a Request (forbidden header workaround). */
function transportCookie(headers: Record<string, string>): Record<string, string> {
  const cookie = headers['Cookie'] ?? headers['cookie']
  if (cookie) {
    headers['X-Wxlsh-Cookie'] = cookie
    delete headers['Cookie']
    delete headers['cookie']
  }
  return headers
}

/** Convert X-Wxlsh-Set-Cookie back to set-cookie in response headers for callers. */
function restoreSetCookie(res: Response): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === 'x-wxlsh-set-cookie') {
      out['set-cookie'] = v.split('\n').join(', ')
    } else {
      out[k] = v
    }
  }
  return out
}

// Create dispatch bridge for Python → JS HTTP routing
const dispatchBridge = async (method: string, url: string, headersJson: string, body: string): Promise<string> => {
  const headers: Record<string, string> = headersJson ? JSON.parse(headersJson) : {}
  transportCookie(headers)
  const req = new Request(url, {
    method,
    headers,
    body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
  })
  const res = await trackedDispatch(req)
  const resHeaders = restoreSetCookie(res)
  const text = await res.text()
  return JSON.stringify({ status: res.status, headers: resHeaders, body: text })
}

// ─── Attack session ──────────────────────────────────────────────────────────
const attackSession = useAttackSession(slug.value, fm.value.title ?? '')

// ─── Pentest notes ────────────────────────────────────────────────────────────
const pentestNotes = usePentestNotes(attackSession, slug.value)
const notesModalVisible = ref(false)

function makeSourceDispatch(source: 'browser' | 'repeater' | 'terminal' | 'code') {
  return async (request: Request): Promise<Response> => {
    const response = await trackedDispatch(request)
    // After trackedDispatch, the last trafficLog entry is the one just recorded
    const entry = trafficLog.value[trafficLog.value.length - 1]
    if (entry) {
      attackSession.addHttpEvent(entry, source, source === 'code' ? currentExecutionId : null)
    }
    return response
  }
}

const browserDispatch = makeSourceDispatch('browser')
const repeaterDispatch = makeSourceDispatch('repeater')
const terminalDispatch = makeSourceDispatch('terminal')
const codeDispatch = makeSourceDispatch('code')

// ─── Recording callbacks for Terminal and Code panels ────────────────────────
function onCommandExecuted(event: { command: string; output: string; error: boolean }) {
  attackSession.addTerminalCommand(event.command, event.output, event.error)
}

function onCodeExecuted(event: { code: string; output: string; error: boolean; duration: number }) {
  const execId = crypto.randomUUID()
  currentExecutionId = execId
  attackSession.addCodeExecution(event.code, event.output, event.error, event.duration, execId)
  currentExecutionId = null
}

// ─── Send to Repeater ─────────────────────────────────────────────────────────
const repeaterInjectedRequest = ref<string | null>(null)
function onSendToRepeater(rawRequest: string) {
  // Honour the allowlist: without a Repeater tab there is no way back out of
  // the panel, so a challenge that withheld it must not be navigated into it.
  if (!hasTab('repeater')) return
  repeaterInjectedRequest.value = rawRequest
  activeTab.value = 'repeater'
}

// ─── Flag verification (via WASM) ────────────────────────────────────────────
// wasm_verify_flag is set after WASM init; holds a reference to the export
let wasmVerifyFlag: ((flagBytes: Uint8Array) => boolean) | null = null

async function verify(submitted: string): Promise<boolean> {
  if (!wasmVerifyFlag) return false
  const flagBytes = new TextEncoder().encode(submitted)
  const correct = wasmVerifyFlag(flagBytes)
  attackSession.addFlagAttempt(submitted, correct)
  return correct
}

function onExport() {
  attackSession.exportSession({
    difficulty: fm.value.difficulty,
    category: fm.value.category,
    backend: fm.value.backend,
    description: fm.value.description,
    fullDescription: fm.value.markdownBody,
  })
}

/** Map backend type to its required base micropip packages */
const BASE_PACKAGES: Record<string, string[]> = {
  flask:   ['flask', 'sqlite3'],
  fastapi: ['fastapi', 'anyio', 'sqlite3'],
}

// ─── Runtime initialization ───────────────────────────────────────────────────

async function initRuntime(): Promise<void> {
  const backend: string = fm.value.backend ?? 'flask'
  const wasmModule: string | undefined = fm.value.wasmModule
  const extraPackages: string[] = fm.value.packages ?? []



  // Guard: skip if frontmatter doesn't have wasmModule (not yet processed)
  if (!wasmModule) {
    runtimeError.value = 'Challenge WASM not available (run pnpm challenge:keygen first)'
    return
  }

  // 1. Fetch per-challenge WASM binary and extract custom section payload.
  //    wasmModule is a base-agnostic root path (e.g. /challenge/<slug>/runtime.wasm);
  //    withBase() prepends the VitePress base so it resolves under a project-site
  //    deployment (/wxl-template/...) as well as at root locally.
  const wasmResponse = await fetch(withBase(wasmModule))
  const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer())
  const payloadBytes = extractCustomSection(wasmBytes, 'chall-data')

  if (!payloadBytes) {
    runtimeError.value = 'No chall-data section found in WASM binary'
    return
  }

  // 2. Instantiate the per-challenge WASM module
  const { default: initWasm, wasm_fs_init, wasm_fs_read, wasm_fs_list, wasm_verify_flag } = await import(
    '../../wasm/virtual-fs/virtual_fs.js'
  )
  await initWasm()

  // 3. Initialize FS from the custom section payload (key derivation happens inside WASM)
  wasm_fs_init(slug.value, payloadBytes)

  // 4. Store flag verifier reference for later use
  wasmVerifyFlag = wasm_verify_flag

  // 5. Decrypt all FS entries; separate __app__ from the rest
  //    wasm_fs_read no longer needs an external key — it uses the internally-derived key
  const fsEntries: Record<string, Uint8Array> = {}
  let appCode = ''

  // Read __app__ entry
  const appBytes: Uint8Array = wasm_fs_read('__app__')
  appCode = new TextDecoder().decode(appBytes)

  // Read other FS entries: use wasm_fs_list() to auto-discover all encrypted paths,
  // falling back to frontmatter fs field for legacy WASM binaries without wasm_fs_list.
  const fsPaths: string[] = typeof wasm_fs_list === 'function'
    ? (JSON.parse(wasm_fs_list()) as string[]).filter((p: string) => p !== '__app__')
    : Object.keys(fm.value.fs ?? {})
  for (const path of fsPaths) {
    fsEntries[path] = wasm_fs_read(path)
  }

  if (!appCode) {
    runtimeError.value = 'App code not found in encrypted FS'
    return
  }

  // 5. Determine packages: backend defaults + extra from frontmatter
  const packages = [...(BASE_PACKAGES[backend] ?? []), ...extraPackages]

  // 6. Initialize the appropriate runtime (only once — idempotency via initPromise)
  if (backend === 'flask' || backend === 'fastapi') {
    await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js')
    const loadPyodide = (globalThis as any).loadPyodide as LoadPyodideFn
    if (typeof loadPyodide !== 'function') {
      throw new Error('loadPyodide not available after loading pyodide.js')
    }
    runtime = new PythonRuntime(loadPyodide)
    await (runtime as PythonRuntime).initialize(appCode, fsEntries, packages)
  } else if (backend === 'php') {
    runtime = new PhpRuntime(async () => {
      const { PhpWeb } = await import('php-wasm/PhpWeb.mjs')
      const php = new PhpWeb()
      const phpBinary = await (php as any).binary

      return {
        async run(code: string) {
          let output = ''
          const handler = (e: Event) => {
            output += (e as CustomEvent).detail[0]
          }
          php.addEventListener('output', handler)
          const exitCode = await (php as any).run(code) as number
          php.removeEventListener('output', handler)
          return { output, headers: [] as string[], exitCode }
        },
        writeFile(path: string, data: Uint8Array) {
          phpBinary.FS.writeFile(path, data)
        },
      }
    })
    await (runtime as PhpRuntime).initialize(appCode, fsEntries)
  }

  runtimeReady.value = true

  // Expose Pyodide instance for wxlsh and code editor panels
  if (runtime instanceof PythonRuntime) {
    pyodideInstance.value = runtime.getPyodide() as PyodidePublicAPI | null
    if (pyodideInstance.value) {
      pyodideInstance.value.globals.set('_wxlsh_dispatch_bridge', dispatchBridge)
    }
  }

  // For non-Python backends (e.g., PHP), load a standalone Pyodide as a tool layer
  // so Code Editor and Terminal panels can still run Python attack scripts.
  if (!pyodideInstance.value) {
    await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js')
    const loadPyodide = (globalThis as any).loadPyodide as LoadPyodideFn
    if (typeof loadPyodide === 'function') {
      const toolsPyodide = await loadPyodide()
      // Install and patch requests on the tool-layer Pyodide too
      await installRequestsPatch(toolsPyodide as any, dispatchBridge)
      pyodideInstance.value = toolsPyodide as unknown as PyodidePublicAPI
      pyodideInstance.value.globals.set('_wxlsh_dispatch_bridge', dispatchBridge)
    }
  }
}

// ─── HANDLE_REQUEST listener ──────────────────────────────────────────────────

async function handleRequest(event: MessageEvent): Promise<void> {
  if (event.data?.type !== 'HANDLE_REQUEST') return
  const { method, url, headers, body, responsePort } = event.data

  try {
    // Transport Cookie past the Fetch API forbidden-header filter
    const reqHeaders: Record<string, string> = {}
    for (const [k, v] of (headers ?? [])) reqHeaders[k] = v
    transportCookie(reqHeaders)

    const request = new Request(url, {
      method,
      headers: reqHeaders,
      body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
    })

    const response = await (runtime as PythonRuntime | PhpRuntime).handleRequest(request)
    const resBodyBuffer = await response.arrayBuffer()

    // Restore X-Wxlsh-Set-Cookie → set-cookie for the Service Worker
    const resHeaders: [string, string][] = []
    for (const [k, v] of response.headers.entries()) {
      if (k.toLowerCase() === 'x-wxlsh-set-cookie') {
        for (const c of v.split('\n')) resHeaders.push(['set-cookie', c])
      } else {
        resHeaders.push([k, v])
      }
    }

    responsePort.postMessage(
      { status: response.status, headers: resHeaders, body: resBodyBuffer },
      [resBodyBuffer],
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    responsePort.postMessage({ status: 500, headers: [], body: new TextEncoder().encode(JSON.stringify({ error: message })).buffer })
  }
}

// ─── Register challenge and set up MessageChannel ─────────────────────────────

function registerWithSW(mc: MessageChannel): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage(
      { type: 'REGISTER_CHALLENGE', slug: slug.value, backend: fm.value.backend ?? 'flask', port: mc.port2 },
      [mc.port2],
    )
  })
}

onMounted(async () => {
  // Set up MessageChannel — port1 stays in page, port2 goes to SW
  const mc = new MessageChannel()
  challengePort = mc.port1
  challengePort.addEventListener('message', handleRequest)
  challengePort.start()

  // Register with SW (transfers port2)
  registerWithSW(mc)

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Re-register on SW update with a fresh MessageChannel
      const mc2 = new MessageChannel()
      challengePort?.removeEventListener('message', handleRequest)
      challengePort?.close()
      challengePort = mc2.port1
      challengePort.addEventListener('message', handleRequest)
      challengePort.start()
      registerWithSW(mc2)
      // SW now controls the page — unlock the readiness gate
      swReady.value = true
    })

    // Fallback: if controllerchange fired between setup() and onMounted
    // (race when SW installs/activates before the listener is attached),
    // the event was missed. Check the controller directly.
    if (navigator.serviceWorker.controller) {
      swReady.value = true
    } else {
      // First visit or hard refresh: SW may be active but not controlling.
      // dispatch() bypasses the SW (calls runtime directly), and
      // registerWithSW() uses reg.active.postMessage() — neither requires
      // the SW to "control" the page. So active is sufficient.
      navigator.serviceWorker.ready.then((reg) => {
        if (navigator.serviceWorker.controller || reg.active) {
          swReady.value = true
        }
      })
    }
  }

  // Initialize runtime (lazy, idempotent)
  try {
    await initRuntime()
  } catch (err) {
    runtimeError.value = err instanceof Error ? err.message : String(err)
  }

  // L3 Playwright spec hook: expose the in-page dispatcher so Playwright e2e
  // tests can drive the runtime without the SW round-trip. Dev/test builds only.
  if (import.meta.env.DEV) {
    ;(globalThis as unknown as { __wxlDispatch?: (req: Request) => Promise<Response> }).__wxlDispatch = trackedDispatch
  }

  // Initialize attack session (non-blocking), then pentest notes
  attackSession.init()
    .then(() => pentestNotes.init(slug.value))
    .catch(() => {})
})

onUnmounted(() => {
  challengePort?.removeEventListener('message', handleRequest)
  challengePort?.close()
  challengePort = null
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'UNREGISTER_CHALLENGE', slug: slug.value })
    })
  }
})

</script>

<template>
  <div class="flex flex-col h-[calc(100vh-var(--vp-nav-height))] overflow-hidden bg-[var(--ch-bg)] color-[var(--ch-text-1)]">
    <!-- Merged navigation bar (replaces VitePress nav + old challenge header) -->
    <MergedNav
      :title="fm.title ?? ''"
      :difficulty="fm.difficulty ?? ''"
      :category="fm.category ?? ''"
      :runtimeReady="runtimeReady"
      :runtimeError="runtimeError"
      :noteCount="pentestNotes.noteCount.value"
      :descriptionCollapsed="descriptionCollapsed"
      @open-notes="notesModalVisible = true"
      @toggle-description="toggleDescription"
    />

    <!-- Main content: left + right columns -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left column: description + flag submit -->
      <aside
        data-description-panel
        class="description-column flex flex-col border-r border-[var(--ch-border)] relative overflow-hidden"
        :class="{ collapsed: descriptionCollapsed }"
      >
        <button
          data-description-toggle
          class="absolute top-2 right-2 z-1 bg-[var(--ch-bg-soft)] border border-[var(--ch-border)] rounded px-[6px] py-[2px] cursor-pointer text-[0.75em] color-[var(--ch-text-2)] hover:border-[var(--ch-accent)]"
          :title="descriptionCollapsed ? 'Expand description' : 'Collapse description'"
          @click="toggleDescription"
        >
          {{ descriptionCollapsed ? '▶' : '◀' }}
        </button>

        <div v-show="!descriptionCollapsed" class="vp-doc description-content flex-1 overflow-y-auto p-4 pr-10">
          <Content />
        </div>

        <div v-show="!descriptionCollapsed" class="flex-shrink-0 p-3 border-t border-[var(--ch-border)] bg-[var(--ch-bg)]">
          <FlagSubmit
            :verify="verify"
            :onExport="onExport"
            :onExportNotes="() => pentestNotes.downloadMarkdown(fm.title, slug)"
          />
        </div>
      </aside>

      <!-- Right column: interaction panels -->
      <main class="vp-raw flex flex-col flex-1 overflow-hidden bg-[var(--ch-bg-panel)]">
        <nav class="flex gap-1 px-3 py-2 border-b border-[var(--ch-border)] flex-shrink-0 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :data-tab="tab.id"
            :class="['ch-tab-btn', { 'ch-tab-btn-active': activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div v-show="activeTab === 'browser'" data-panel="browser" class="flex-1 overflow-auto p-3">
          <BrowserPanel :slug="slug" :dispatch="browserDispatch" :disabled="toolsDisabled" />
        </div>
        <div v-show="activeTab === 'terminal'" data-panel="terminal" class="flex-1 overflow-hidden">
          <WxlshPanel :slug="slug" :dispatch="terminalDispatch" :disabled="toolsDisabled" :pyodide="pyodideInstance" :onCommandExecuted="onCommandExecuted" />
        </div>
        <div v-show="activeTab === 'repeater'" data-panel="repeater" class="flex-1 overflow-hidden">
          <RepeatPanel :slug="slug" :dispatch="repeaterDispatch" :disabled="toolsDisabled" :injectedRequest="repeaterInjectedRequest" />
        </div>
        <div v-show="activeTab === 'code'" data-panel="code" class="flex-1 overflow-hidden">
          <CodeEditorPanel :slug="slug" :dispatch="codeDispatch" :disabled="toolsDisabled" :pyodide="pyodideInstance" :onCodeExecuted="onCodeExecuted" />
        </div>
        <div v-show="activeTab === 'network'" data-panel="network" class="flex-1 overflow-hidden">
          <NetworkPanel :trafficLog="trafficLog" @clear="clearTrafficLog" @sendToRepeater="onSendToRepeater" />
        </div>
      </main>
    </div>

    <!-- Persistent flag submit bar (visible when description is collapsed) -->
    <div
      v-if="descriptionCollapsed"
      data-flag-bar
      class="shrink-0 px-3 py-2 border-t border-[var(--ch-border)] bg-[var(--ch-bg)]"
    >
      <FlagSubmit
        :verify="verify"
        :onExport="onExport"
        :onExportNotes="() => pentestNotes.downloadMarkdown(fm.title, slug)"
      />
    </div>

    <!-- Pentest Notes Modal -->
    <NotesModal
      v-if="notesModalVisible"
      :pentestNotes="pentestNotes"
      :challengeTitle="fm.title ?? ''"
      @close="notesModalVisible = false"
    />
  </div>
</template>

<style scoped>
/* Minimal scoped block: only transition rules not expressible as UnoCSS utilities */
.description-column {
  width: 38%;
  min-width: 280px;
  max-width: 480px;
  transition: width 0.25s ease, min-width 0.25s ease, opacity 0.2s ease;
}
.description-column.collapsed {
  width: 0;
  min-width: 0;
  max-width: 0;
  opacity: 0;
  border-right: none;
  overflow: hidden;
  pointer-events: none;
}
</style>
