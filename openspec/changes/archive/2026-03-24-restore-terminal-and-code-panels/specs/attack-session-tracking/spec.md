## ADDED Requirements

### Requirement: useAttackSession records terminal command events

The `useAttackSession` composable SHALL expose an `addTerminalCommand(command, output, error)` method. It SHALL append a `terminal_command` event to the current session and persist the updated session to IndexedDB.

The `terminal_command` event SHALL have the following shape:
```typescript
{ type: 'terminal_command'; timestamp: number; command: string; output: string; error: boolean }
```

#### Scenario: Terminal command is recorded with output

- **WHEN** a user executes a command in the wxlsh terminal (e.g., `curl /login`) and the command produces output
- **THEN** `addTerminalCommand` SHALL append a `terminal_command` event with the command string, the output text, and `error: false`
- **AND** the session SHALL be persisted to IndexedDB

#### Scenario: Terminal command error is recorded

- **WHEN** a user executes an unknown command (e.g., `foo`) and the terminal shows an error message
- **THEN** `addTerminalCommand` SHALL append a `terminal_command` event with `error: true` and the error output text

---

### Requirement: useAttackSession records code execution events

The `useAttackSession` composable SHALL expose an `addCodeExecution(code, output, error, duration)` method. It SHALL append a `code_execution` event to the current session and persist the updated session to IndexedDB.

The `code_execution` event SHALL have the following shape:
```typescript
{ type: 'code_execution'; timestamp: number; code: string; output: string; error: boolean; duration: number }
```

The `duration` field SHALL represent the wall-clock milliseconds elapsed from the start of code execution to completion (including any HTTP requests made via the `requests` stub).

#### Scenario: Successful code execution is recorded

- **WHEN** a user runs Python code in the Code Editor and the execution completes without error
- **THEN** `addCodeExecution` SHALL append a `code_execution` event with `error: false`, the source code, the captured stdout output, and the execution duration in milliseconds

#### Scenario: Failed code execution is recorded

- **WHEN** a user runs Python code that raises an unhandled exception
- **THEN** `addCodeExecution` SHALL append a `code_execution` event with `error: true`, the source code, the error message as output, and the execution duration

---

## MODIFIED Requirements

### Requirement: useAttackSession records HTTP request events with source attribution

The composable SHALL expose an `addHttpEvent(entry, source)` method that accepts a `TrafficEntry`-compatible object and a `source: 'browser' | 'repeater' | 'terminal' | 'code'` string. It SHALL append an `http_request` event to the current session and persist the updated session to IndexedDB.

The `http_request` event SHALL embed the full request and response data (method, URL, headers, body, status, duration) directly — not a reference to an in-memory `TrafficEntry` — to ensure cross-page-reload persistence.

#### Scenario: Browser request is recorded with source=browser

- **WHEN** a BrowserPanel request completes and `addHttpEvent` is called with `source: 'browser'`
- **THEN** an `http_request` event with `source: 'browser'` and the full request/response data SHALL be appended to the session

#### Scenario: Repeater request is recorded with source=repeater

- **WHEN** a RepeatPanel request completes and `addHttpEvent` is called with `source: 'repeater'`
- **THEN** an `http_request` event with `source: 'repeater'` SHALL be appended to the session

#### Scenario: Terminal HTTP request is recorded with source=terminal

- **WHEN** a wxlsh curl command triggers an HTTP request and `addHttpEvent` is called with `source: 'terminal'`
- **THEN** an `http_request` event with `source: 'terminal'` SHALL be appended to the session

#### Scenario: Code Editor HTTP request is recorded with source=code

- **WHEN** Python code in the Code Editor makes an HTTP request via the `requests` stub and `addHttpEvent` is called with `source: 'code'`
- **THEN** an `http_request` event with `source: 'code'` SHALL be appended to the session

---

### Requirement: useAttackSession provides session export as JSON

The composable SHALL expose an `exportSession(challengeInfo)` method that accepts a `ChallengeExportInfo` object and triggers a browser file download. The download filename SHALL follow the pattern `attack-session-<slug>-<yyyymmdd-hhmmss>.json`.

The `ChallengeExportInfo` parameter SHALL have the following shape:
```typescript
interface ChallengeExportInfo {
  difficulty?: string
  category?: string
  backend?: string
  description?: string
  fullDescription?: string   // raw Markdown body from transformPageData
}
```

The exported JSON SHALL use a layered structure with three top-level keys:

```typescript
interface SessionExportPayload {
  meta: {
    systemPrompt: string       // hardcoded AI writeup prompt
    timezone: string           // from Intl.DateTimeFormat
    exportedAt: string         // ISO 8601 with timezone offset
  }
  challenge: {
    slug: string
    title: string
    difficulty?: string
    category?: string
    backend?: string
    description?: string
    fullDescription?: string
  }
  session: {
    startedAt: number
    solvedAt: number | null
    events: AttackEvent[]
  }
}
```

The `meta.systemPrompt` SHALL be a module-level constant string hardcoded in `useAttackSession.ts` that instructs an AI to generate a structured CTF writeup from the attack session data. The system prompt SHALL reference all six event types (`challenge_start`, `http_request`, `terminal_command`, `code_execution`, `flag_attempt`, `challenge_solved`) so the AI can interpret the complete attack timeline.

The `meta.timezone` SHALL be obtained via `Intl.DateTimeFormat().resolvedOptions().timeZone` at export time.

The `meta.exportedAt` SHALL be an ISO 8601 string including the timezone offset (e.g., `2026-03-23T14:30:00+08:00`).

#### Scenario: Challenger downloads enriched attack session after solving

- **WHEN** `exportSession(challengeInfo)` is called with challenge metadata
- **THEN** the browser SHALL initiate a file download with a filename matching `attack-session-<slug>-*.json`
- **AND** the downloaded JSON SHALL contain `meta.systemPrompt` as a non-empty string that references `terminal_command` and `code_execution` event types
- **AND** the downloaded JSON SHALL contain `meta.timezone` matching the browser's IANA timezone
- **AND** the downloaded JSON SHALL contain `meta.exportedAt` as a valid ISO 8601 string
- **AND** `challenge.slug` and `challenge.title` SHALL be populated from the session
- **AND** `challenge.difficulty`, `challenge.category`, `challenge.backend`, `challenge.description`, and `challenge.fullDescription` SHALL be populated from the `challengeInfo` parameter
- **AND** `session.events` SHALL contain the complete event list from the `AttackSession`

#### Scenario: Export works when optional challenge fields are absent

- **WHEN** `exportSession(challengeInfo)` is called with a `ChallengeExportInfo` where optional fields are `undefined`
- **THEN** the exported JSON SHALL omit those fields from the `challenge` object
- **AND** the export SHALL complete without error
