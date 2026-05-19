## ADDED Requirements

### Requirement: wxlsh terminal renders using xterm.js

The `WxlshPanel.vue` component SHALL use xterm.js (`xterm` + `@xterm/addon-fit`) as its display layer. The terminal SHALL display the prompt brand name `wxlsh` (not `bash`). The xterm.js instance SHALL be initialized lazily inside `onMounted` and SHALL be destroyed in `onUnmounted`. On first render, the terminal SHALL display a startup banner: "wxlsh 1.0 — web exploit shell" followed by "type 'help' for available commands".

#### Scenario: Terminal displays wxlsh brand

- **WHEN** the wxlsh tab is first rendered
- **THEN** the terminal SHALL show the brand banner containing "wxlsh" and the xterm.js canvas SHALL be visible

#### Scenario: Terminal is lazy-loaded

- **WHEN** the user has not yet opened the Terminal tab
- **THEN** the xterm.js library SHALL NOT be loaded (dynamic import deferred until tab activation)

#### Scenario: Terminal is cleaned up on unmount

- **WHEN** the challenge page is navigated away from
- **THEN** the xterm.js instance SHALL be disposed and all event listeners SHALL be removed

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

---

### Requirement: wxlsh supports Rust-native command extension

Challenge authors and platform developers SHALL be able to add Rust-native commands to the `wxlsh-parser` crate. A Rust-native command SHALL be a function in the `commands` module of `chall-wasm/wxlsh-parser` that receives `ParsedCommand` and returns `WxlshOutput`. Rust-native commands SHALL take priority over Python-backed commands with the same name. Recompiling the WASM crate SHALL be required to add new Rust-native commands.

#### Scenario: Rust-native command executes without Pyodide

- **WHEN** a command with a Rust-native handler (e.g., `help`, `clear`, `base64`) is entered
- **THEN** wxlsh SHALL execute the Rust-native handler directly, without invoking Pyodide

#### Scenario: Rust-native command overrides Python command of same name

- **WHEN** both a Rust-native handler and a Python handler are registered for the same command name
- **THEN** the Rust-native handler SHALL be used

---

### Requirement: wxlsh terminal history navigable with arrow keys

The terminal SHALL maintain an in-memory command history for the current session. Pressing the Up arrow key SHALL recall the previous command; pressing the Down arrow key SHALL advance toward the most recent command. History SHALL also be persisted to IndexedDB via `useChallengePersistence` and restored on next page load.

#### Scenario: Up arrow recalls previous command

- **WHEN** the user presses the Up arrow key in the wxlsh input
- **THEN** the input line SHALL show the previous command from history

#### Scenario: History persists across page reloads

- **WHEN** the user reloads the challenge page
- **THEN** the terminal history from the previous session SHALL be available via Up arrow
