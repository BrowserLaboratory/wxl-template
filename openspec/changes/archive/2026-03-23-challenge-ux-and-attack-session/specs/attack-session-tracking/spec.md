## ADDED Requirements

### Requirement: useAttackSession tracks a persistent attack session per challenge

The `useAttackSession` composable SHALL manage a single `AttackSession` object per challenge slug, persisted in IndexedDB. On initialization, it SHALL check for an existing unsolved session for the given slug; if found, it SHALL resume it by appending new events to the existing event list. If no session exists, it SHALL create a new one with a `challenge_start` event and `startedAt` timestamp. The composable SHALL be importable from `.vitepress/theme/composables/useAttackSession.ts`.

The `AttackSession` schema SHALL be:
```typescript
interface AttackSession {
  challengeSlug: string      // IndexedDB keyPath
  challengeTitle: string
  startedAt: number          // Unix ms
  solvedAt: number | null
  events: AttackEvent[]
}
```

#### Scenario: New session is created on first visit

- **WHEN** a challenger opens a challenge page for the first time (no prior session in IndexedDB)
- **THEN** a new `AttackSession` SHALL be created with `startedAt` set to the current timestamp
- **AND** a `challenge_start` event SHALL be appended as the first event
- **AND** `solvedAt` SHALL be `null`

#### Scenario: Existing unsolved session is resumed on return visit

- **WHEN** a challenger opens a challenge page and an unsolved session already exists in IndexedDB for that slug
- **THEN** the existing session SHALL be loaded and subsequent events SHALL be appended to it
- **AND** no new `challenge_start` event SHALL be added (the original `startedAt` is preserved)

#### Scenario: Solved session is archived and a new session is created on re-visit

- **WHEN** a challenger re-opens a challenge page after a session with `solvedAt` set already exists
- **THEN** a new session SHALL be created, overwriting the previous solved session in IndexedDB

### Requirement: useAttackSession records HTTP request events with source attribution

The composable SHALL expose an `addHttpEvent(entry, source)` method that accepts a `TrafficEntry`-compatible object and a `source: 'browser' | 'repeater'` string. It SHALL append an `http_request` event to the current session and persist the updated session to IndexedDB.

The `http_request` event SHALL embed the full request and response data (method, URL, headers, body, status, duration) directly — not a reference to an in-memory `TrafficEntry` — to ensure cross-page-reload persistence.

#### Scenario: Browser request is recorded with source=browser

- **WHEN** a BrowserPanel request completes and `addHttpEvent` is called with `source: 'browser'`
- **THEN** an `http_request` event with `source: 'browser'` and the full request/response data SHALL be appended to the session

#### Scenario: Repeater request is recorded with source=repeater

- **WHEN** a RepeatPanel request completes and `addHttpEvent` is called with `source: 'repeater'`
- **THEN** an `http_request` event with `source: 'repeater'` SHALL be appended to the session

### Requirement: useAttackSession records flag attempt events

The composable SHALL expose an `addFlagAttempt(submitted, correct)` method. It SHALL append a `flag_attempt` event containing the submitted flag text (plain text) and the boolean result.

If `correct` is `true`, the composable SHALL additionally append a `challenge_solved` event, set `solvedAt` to the current timestamp, and persist the finalized session to IndexedDB.

#### Scenario: Incorrect flag attempt is recorded

- **WHEN** a challenger submits an incorrect flag
- **THEN** a `flag_attempt` event with `correct: false` and the submitted text SHALL be appended
- **AND** `solvedAt` SHALL remain `null`

#### Scenario: Correct flag attempt finalizes the session

- **WHEN** a challenger submits the correct flag
- **THEN** a `flag_attempt` event with `correct: true` SHALL be appended
- **AND** a `challenge_solved` event SHALL be appended immediately after
- **AND** `solvedAt` SHALL be set to the current timestamp
- **AND** the session SHALL be persisted to IndexedDB with `solvedAt` set

### Requirement: useAttackSession provides session export as JSON

The composable SHALL expose a `exportSession()` method that serializes the current `AttackSession` to a JSON string and triggers a browser file download. The download filename SHALL follow the pattern `attack-session-<slug>-<yyyymmdd-hhmmss>.json`.

#### Scenario: Challenger downloads attack session after solving

- **WHEN** `exportSession()` is called after the challenge is solved
- **THEN** the browser SHALL initiate a file download with a filename matching `attack-session-<slug>-*.json`
- **AND** the downloaded file SHALL be valid JSON containing the complete `AttackSession` object including all events
