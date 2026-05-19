<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWxlsh, type PyodidePublicAPI } from '../composables/useWxlsh'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
  /** Pyodide instance passed down from ChallengeLayout (already unwrapped by Vue). */
  pyodide?: PyodidePublicAPI | null
  /** Called after each command execution with the command, output, and error flag. */
  onCommandExecuted?: (event: { command: string; output: string; error: boolean }) => void
}>()

// ─── xterm.js lazy references ─────────────────────────────────────────────────

let terminal: import('@xterm/xterm').Terminal | null = null
let fitAddon: import('@xterm/addon-fit').FitAddon | null = null
const containerRef = ref<HTMLDivElement | null>(null)
// Guard against concurrent initTerminal() calls (e.g. onMounted + ResizeObserver race)
let initTerminalPromise: Promise<void> | null = null

// ─── wxlsh composable ─────────────────────────────────────────────────────────

// computed() stays in sync with the prop as Pyodide loads (useWxlsh expects a Ref)
const pyodideRef = computed(() => props.pyodide ?? null)

const wxlsh = useWxlsh({
  slug: props.slug,
  dispatch: props.dispatch,
  pyodide: pyodideRef,
})

// ─── Terminal state ───────────────────────────────────────────────────────────

let promptLen = 0
let inputBuffer = ''
let cursorPos = 0   // position within inputBuffer

// ─── xterm init ───────────────────────────────────────────────────────────────

const BANNER = [
  '\x1b[1;32mwxlsh 1.0\x1b[0m — web exploit shell',
  "type '\x1b[1mhelp\x1b[0m' for available commands",
  '',
].join('\r\n')

function writePrompt() {
  const p = wxlsh.getPrompt()
  promptLen = p.length
  terminal?.write('\r\n' + p.text)
}

function clearLine() {
  // Move cursor to start of input, erase to end of line
  if (!terminal) return
  terminal.write(`\r\x1b[${promptLen}C\x1b[0K`)
  inputBuffer = ''
  cursorPos = 0
}

function redrawInput(newBuf: string, newPos: number) {
  if (!terminal) return
  // Move to start of input area and rewrite
  terminal.write(`\r\x1b[${promptLen}C\x1b[0K` + newBuf)
  // Reposition cursor
  if (newPos < newBuf.length) {
    terminal.write(`\x1b[${newBuf.length - newPos}D`)
  }
  inputBuffer = newBuf
  cursorPos = newPos
}

async function handleEnter() {
  if (!terminal) return
  const line = inputBuffer
  terminal.write('\r\n')
  inputBuffer = ''
  cursorPos = 0

  if (!line.trim()) {
    writePrompt()
    return
  }

  const result = await wxlsh.execute(line)

  props.onCommandExecuted?.({ command: line, output: result.output, error: result.error ?? false })

  if (result.clear) {
    terminal.clear()
  } else if (result.output) {
    // Convert \n to \r\n for correct terminal display
    terminal.write(result.output.replace(/\n/g, '\r\n'))
  }

  writePrompt()
}

function handleKeyData(data: string) {
  if (!terminal) return
  const code = data.charCodeAt(0)

  if (data === '\r') {
    // Enter
    handleEnter()
  } else if (data === '\x7f' || data === '\x08') {
    // Backspace
    if (cursorPos > 0) {
      const newBuf = inputBuffer.slice(0, cursorPos - 1) + inputBuffer.slice(cursorPos)
      redrawInput(newBuf, cursorPos - 1)
    }
  } else if (data === '\x1b[A') {
    // Up arrow — history prev
    const prev = wxlsh.historyPrev(inputBuffer)
    redrawInput(prev, prev.length)
  } else if (data === '\x1b[B') {
    // Down arrow — history next
    const next = wxlsh.historyNext()
    redrawInput(next, next.length)
  } else if (data === '\x1b[C') {
    // Right arrow
    if (cursorPos < inputBuffer.length) {
      terminal.write('\x1b[C')
      cursorPos++
    }
  } else if (data === '\x1b[D') {
    // Left arrow
    if (cursorPos > 0) {
      terminal.write('\x1b[D')
      cursorPos--
    }
  } else if (data === '\x1b[3~') {
    // Delete key
    if (cursorPos < inputBuffer.length) {
      const newBuf = inputBuffer.slice(0, cursorPos) + inputBuffer.slice(cursorPos + 1)
      redrawInput(newBuf, cursorPos)
    }
  } else if (data === '\x01') {
    // Ctrl+A — move to start
    if (cursorPos > 0) {
      terminal.write(`\x1b[${cursorPos}D`)
      cursorPos = 0
    }
  } else if (data === '\x05') {
    // Ctrl+E — move to end
    if (cursorPos < inputBuffer.length) {
      terminal.write(`\x1b[${inputBuffer.length - cursorPos}C`)
      cursorPos = inputBuffer.length
    }
  } else if (data === '\x0c') {
    // Ctrl+L — clear screen
    terminal.clear()
    terminal.write(wxlsh.getPrompt().text + inputBuffer)
  } else if (data === '\x03') {
    // Ctrl+C — cancel current input
    terminal.write('^C')
    inputBuffer = ''
    cursorPos = 0
    writePrompt()
  } else if (code >= 0x20) {
    // Printable character — insert at cursor
    const newBuf = inputBuffer.slice(0, cursorPos) + data + inputBuffer.slice(cursorPos)
    redrawInput(newBuf, cursorPos + data.length)
  }
}

async function initTerminal() {
  if (!containerRef.value || terminal) return

  // xterm.js must open into a container with real dimensions.
  // When the Terminal tab is not active, v-show hides the container (0×0).
  // Skip init in that case; the ResizeObserver will retry when it becomes visible.
  const { clientWidth, clientHeight } = containerRef.value
  if (clientWidth === 0 || clientHeight === 0) return

  // Prevent concurrent calls (e.g. onMounted + ResizeObserver racing during lazy import)
  if (initTerminalPromise) return initTerminalPromise
  initTerminalPromise = _doInitTerminal()
  await initTerminalPromise
}

async function _doInitTerminal() {
  if (!containerRef.value) return

  const [{ Terminal }, { FitAddon }] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit'),
  ])
  // Load xterm CSS (hides helper textarea, styles the viewport correctly)
  await import('@xterm/xterm/css/xterm.css')

  // Match VitePress CSS variables as closely as possible
  const term = new Terminal({
    fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Menlo", monospace',
    fontSize: 13,
    lineHeight: 1.4,
    theme: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#58a6ff',
      selectionBackground: '#264f78',
      black: '#0d1117',
      brightBlack: '#6e7681',
      red: '#ff7b72',
      brightRed: '#ffa198',
      green: '#3fb950',
      brightGreen: '#56d364',
      yellow: '#d29922',
      brightYellow: '#e3b341',
      blue: '#58a6ff',
      brightBlue: '#79c0ff',
      magenta: '#bc8cff',
      brightMagenta: '#d2a8ff',
      cyan: '#39c5cf',
      brightCyan: '#56d4dd',
      white: '#b1bac4',
      brightWhite: '#f0f6fc',
    },
    cursorBlink: true,
    scrollback: 1000,
    allowProposedApi: true,
  })

  const fit = new FitAddon()
  term.loadAddon(fit)
  term.open(containerRef.value)
  fit.fit()

  terminal = term
  fitAddon = fit

  // Initialise history and WASM
  await wxlsh.init()

  // Welcome banner
  term.write(BANNER)
  writePrompt()

  // Key input handler
  term.onData(handleKeyData)
}

// ─── Resize observer ─────────────────────────────────────────────────────────

let resizeObserver: ResizeObserver | null = null

function setupResizeObserver() {
  if (!containerRef.value) return
  resizeObserver = new ResizeObserver(() => {
    if (!terminal) {
      // Container just gained dimensions (tab became visible) — initialize now
      initTerminal()
      return
    }
    fitAddon?.fit()
  })
  resizeObserver.observe(containerRef.value)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await initTerminal()
  setupResizeObserver()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  terminal?.dispose()
  terminal = null
  fitAddon = null
})

// Refocus terminal when tab becomes active
watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) terminal?.focus()
  },
)
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Disabled overlay -->
    <div
      v-if="props.disabled"
      class="absolute inset-0 z-10 flex items-center justify-center bg-[var(--ch-bg-soft)] bg-opacity-80 color-[var(--ch-text-2)] text-sm"
    >
      Loading runtime…
    </div>
    <!-- xterm.js mount point — must be full-size for FitAddon to work -->
    <div
      ref="containerRef"
      class="w-full h-full overflow-hidden"
      style="background: #0d1117;"
    />
  </div>
</template>
