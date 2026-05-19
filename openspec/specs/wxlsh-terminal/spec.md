# wxlsh-terminal Specification

## Purpose

Provides an in-browser Linux-style terminal (wxlsh) rendered via xterm.js, with command parsing powered by a Rust WASM crate, Python-backed command execution via Pyodide, persistent command history, and extensible Rust-native command support.

## Requirements

### Requirement: wxlsh terminal renders using xterm.js

The `WxlshPanel.vue` component SHALL use xterm.js (`xterm` + `@xterm/addon-fit`) as its display layer. The terminal SHALL display the prompt in Linux-style format `hacker@wxlsh:<cwd>$ ` where `<cwd>` is the current working directory with `~` shorthand for `/home/hacker`. The xterm.js instance SHALL be initialized lazily inside `onMounted` and SHALL be destroyed in `onUnmounted`. On first render, the terminal SHALL display a startup banner: "wxlsh 1.0 — web exploit shell" followed by "type 'help' for available commands".

#### Scenario: Terminal displays Linux-style prompt

- **WHEN** the wxlsh tab is first rendered
- **THEN** the terminal SHALL show the brand banner containing "wxlsh"
- **AND** the prompt SHALL display as `hacker@wxlsh:~$ ` (with green username@host and blue path)

#### Scenario: Prompt reflects current directory

- **WHEN** the user runs `cd /tmp`
- **THEN** the next prompt SHALL display as `hacker@wxlsh:/tmp$ `

#### Scenario: Prompt uses tilde for home directory

- **WHEN** the current working directory is `/home/hacker/scripts`
- **THEN** the prompt SHALL display as `hacker@wxlsh:~/scripts$ `

#### Scenario: Terminal is lazy-loaded

- **WHEN** the user has not yet opened the Terminal tab
- **THEN** the xterm.js library SHALL NOT be loaded (dynamic import deferred until tab activation)

#### Scenario: Terminal is cleaned up on unmount

- **WHEN** the challenge page is navigated away from
- **THEN** the xterm.js instance SHALL be disposed and all event listeners SHALL be removed


<!-- @trace
source: fix-terminal-and-http-dispatch
updated: 2026-03-25
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useWxlsh.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
-->

---
### Requirement: wxlsh uses Rust WASM for command parsing

A Rust WASM crate `chall-wasm/wxlsh-parser` SHALL implement a `parse_command(input: &str) -> ParsedCommand` function, compiled to WASM and exposed as a TypeScript module. `ParsedCommand` SHALL contain: `command: String`, `args: Vec<String>`, `flags: HashMap<String, String>`. The parser SHALL handle quoted string tokens (single and double quotes) and `--flag=value` / `-f value` syntax.

#### Scenario: Parser tokenizes quoted arguments

- **WHEN** input is `curl "http://example.com/path?a=1" -H "Content-Type: application/json"`
- **THEN** the parser SHALL return `command: "curl"`, `args: ["http://example.com/path?a=1"]`, `flags: { "H": "Content-Type: application/json" }`

#### Scenario: Parser handles flag shorthands

- **WHEN** input is `curl -X POST -d body`
- **THEN** the parser SHALL return `flags: { "X": "POST", "d": "body" }`

#### Scenario: Empty input returns null command

- **WHEN** input is an empty string or whitespace only
- **THEN** the parser SHALL return a result with `command: ""`


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: wxlsh dispatches commands via Python (Pyodide) by default

The `useWxlsh` composable SHALL maintain a command registry. Built-in platform commands (curl-like HTTP, decode, encode) SHALL be implemented as Python functions loaded into Pyodide at runtime initialization. When a command is entered, `useWxlsh` SHALL first check for a Rust-native command handler; if none matches, it SHALL execute the corresponding Python function via Pyodide's `runPythonAsync`. The HTTP commands SHALL call the `dispatch()` prop function to route requests through the Service Worker.

#### Scenario: curl command sends HTTP request via dispatch

- **WHEN** the user types `curl https://challenge-sqli.localhost/users` and presses Enter
- **THEN** wxlsh SHALL construct a Request object and call `dispatch()`, then display the response in the terminal

#### Scenario: Unknown command shows error

- **WHEN** the user types an unrecognized command
- **THEN** wxlsh SHALL display "wxlsh: <command>: command not found" and list available commands via `help`

#### Scenario: help command lists all registered commands

- **WHEN** the user types `help`
- **THEN** wxlsh SHALL display a list of all available commands with brief descriptions


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: wxlsh supports Rust-native command extension

Challenge authors and platform developers SHALL be able to add Rust-native commands to the `wxlsh-parser` crate. A Rust-native command SHALL be a function in the `commands` module of `chall-wasm/wxlsh-parser` that receives `ParsedCommand` and returns `WxlshOutput`. Rust-native commands SHALL take priority over Python-backed commands with the same name. Recompiling the WASM crate SHALL be required to add new Rust-native commands.

#### Scenario: Rust-native command executes without Pyodide

- **WHEN** a command with a Rust-native handler (e.g., `help`, `clear`, `base64`) is entered
- **THEN** wxlsh SHALL execute the Rust-native handler directly, without invoking Pyodide

#### Scenario: Rust-native command overrides Python command of same name

- **WHEN** both a Rust-native handler and a Python handler are registered for the same command name
- **THEN** the Rust-native handler SHALL be used


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: wxlsh terminal history navigable with arrow keys

The terminal SHALL maintain an in-memory command history for the current session. Pressing the Up arrow key SHALL recall the previous command; pressing the Down arrow key SHALL advance toward the most recent command. History SHALL also be persisted to IndexedDB via `useChallengePersistence` and restored on next page load.

#### Scenario: Up arrow recalls previous command

- **WHEN** the user presses the Up arrow key in the wxlsh input
- **THEN** the input line SHALL show the previous command from history

#### Scenario: History persists across page reloads

- **WHEN** the user reloads the challenge page
- **THEN** the terminal history from the previous session SHALL be available via Up arrow

<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: WxlshPanel reports command execution via callback prop

The `WxlshPanel.vue` component SHALL accept an optional `onCommandExecuted` callback prop with the signature:
```typescript
onCommandExecuted?: (event: { command: string; output: string; error: boolean }) => void
```

After each command execution completes (i.e., after `wxlsh.execute(line)` resolves), WxlshPanel SHALL invoke `onCommandExecuted` with the command string, the output text, and the error flag from the `CommandResult`. The callback SHALL be invoked before the output is written to the xterm.js display. If the callback prop is not provided, execution SHALL proceed without error (optional chaining).

The callback SHALL NOT be invoked when the user presses Enter on an empty input line.

#### Scenario: Successful command triggers callback

- **WHEN** a user executes `help` in the terminal and the command returns output with `error: false`
- **THEN** `onCommandExecuted` SHALL be called with `{ command: 'help', output: <help text>, error: false }`
- **AND** the output SHALL then be written to the terminal display

#### Scenario: Error command triggers callback with error flag

- **WHEN** a user executes an unknown command `foo` and the terminal returns an error message with `error: true`
- **THEN** `onCommandExecuted` SHALL be called with `{ command: 'foo', output: <error message>, error: true }`

#### Scenario: Empty input does not trigger callback

- **WHEN** a user presses Enter without typing any command
- **THEN** `onCommandExecuted` SHALL NOT be invoked

#### Scenario: Callback is optional

- **WHEN** `WxlshPanel` is mounted without an `onCommandExecuted` prop
- **THEN** command execution SHALL proceed normally without error

<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

---
### Requirement: User VFS integration

The terminal SHALL integrate with the User Virtual FS for all file-related commands in a future iteration. Currently, filesystem commands (`ls`, `cat`, `mkdir`, `touch`, `cp`, `mv`, `rm`) are NOT implemented and SHALL produce `wxlsh: command not found: <cmd>` output. The `UserVfs` class exists in `useUserVfs.ts` but is not imported by `useWxlsh.ts`.

> **Future work:** Connect the `UserVfs` API to the wxlsh command dispatcher so that filesystem commands operate on the IndexedDB-backed user filesystem at `/home/hacker/`.

#### Scenario: Filesystem commands are not yet available

- **WHEN** user types a filesystem command such as `cat`, `ls`, `mkdir`, `touch`, `cp`, `mv`, or `rm`
- **THEN** the terminal SHALL display `wxlsh: command not found: <cmd>` followed by `Type 'help' for available commands.`

#### Scenario: UserVfs class is not connected to terminal

- **WHEN** the wxlsh terminal initializes via `useWxlsh.ts`
- **THEN** the composable SHALL NOT import or reference `useUserVfs.ts`
- **AND** no VFS-backed file operations SHALL be available in the terminal

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - scripts/challenge-analyze.ts
  - scripts/challenge-utils.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - .vitepress/theme/components/BrowserChrome.vue
  - .vitepress/theme/components/MergedNav.vue
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - scripts/create-challenge.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: Python-backed commands receive parsed flags

When invoking Python-backed commands, the wxlsh executor SHALL convert the `flags` object to a plain JavaScript object before JSON-serializing it for Python. If `flags` is a JS `Map` (as produced by `serde_wasm_bindgen` for Rust `HashMap`), it SHALL be converted via `Object.fromEntries()`. This ensures `JSON.stringify(flags)` produces a populated object rather than `'{}'`.

#### Scenario: curl command with -H flag receives header value

- **WHEN** user runs `curl https://example.com -H "Cookie: session_user=guest"`
- **THEN** the Python `_cmd_curl` function SHALL receive `flags = {"H": "Cookie: session_user=guest"}` (not an empty dict)

#### Scenario: WASM parser Map flags are converted to plain object

- **WHEN** the WASM parser returns `flags` as a JS Map with entries `[["X", "POST"], ["H", "Content-Type: application/json"]]`
- **THEN** the executor SHALL convert it to `{"X": "POST", "H": "Content-Type: application/json"}` before passing to Python

<!-- @trace
source: browser-cookie-and-redirect
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/door-is-open/index.md
  - docs/challenge/door-is-open/src/flag.txt
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
-->