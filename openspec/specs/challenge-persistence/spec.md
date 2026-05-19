# challenge-persistence Specification

## Purpose

Manages an IndexedDB database (`challenge-tools`) that persists user tool data across page reloads, including saved code scripts, terminal command history, attack sessions, and pentest notes, with versioned schema migrations.

## Requirements

### Requirement: useChallengePersistence manages an IndexedDB database for user tool data

The `useChallengePersistence` composable SHALL open (or create) an IndexedDB database named `challenge-tools` using the `idb` npm package. The database SHALL contain four object stores: `code-scripts` (keyPath: `id`, uuid string), `terminal-history` (keyPath: `id`, autoIncrement), `attack-sessions` (keyPath: `challengeSlug`, string), and `pentest-notes` (keyPath: `id`, uuid string). The `pentest-notes` store SHALL have a non-unique index named `by-slug` on the `challengeSlug` field. The database version SHALL be `3`. The composable SHALL be importable from `.vitepress/theme/composables/useChallengePersistence.ts`.

The `upgrade` callback SHALL handle fresh installs (version 0 → 3), migrations from v1 (version 1 → 3), migrations from v2 (version 2 → 3), without destroying any existing data. For v2 → v3, only the `pentest-notes` store SHALL be added.

The `upgrade` callback SHALL use `db.objectStoreNames.contains('pentest-notes')` guard before creating the new store, so that re-running the upgrade on a partially upgraded database is safe.

#### Scenario: Database is created on first use

- **WHEN** the composable is first used on a browser that has no prior IndexedDB data
- **THEN** the `challenge-tools` database SHALL be created at version 3 with all four object stores
- **AND** the `pentest-notes` store SHALL have the `by-slug` index on `challengeSlug`

#### Scenario: Existing v2 database is upgraded without data loss

- **WHEN** the composable is used on a browser that already has the `challenge-tools` v2 database
- **THEN** the database SHALL be upgraded to version 3
- **AND** the existing `code-scripts`, `terminal-history`, and `attack-sessions` stores SHALL be preserved with their data intact
- **AND** the new `pentest-notes` store SHALL be added

#### Scenario: Existing v1 database is migrated without data loss

- **WHEN** the composable is used on a browser that already has the `challenge-tools` v1 database
- **THEN** the database SHALL be upgraded to version 3
- **AND** the existing `code-scripts` and `terminal-history` stores SHALL be preserved with their data intact
- **AND** the `attack-sessions` and `pentest-notes` stores SHALL be added


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: Pentest notes can be saved, loaded by slug, and deleted

The `useChallengePersistence` composable SHALL expose:
- `saveNote(note: NoteEntry): Promise<void>` — upsert a note into the `pentest-notes` store
- `loadNotesBySlug(slug: string): Promise<NoteEntry[]>` — return all notes for the given challenge slug, ordered by `createdAt` ascending
- `deleteNote(id: string): Promise<void>` — remove a single note by its `id`

The `NoteEntry` interface SHALL be:
```typescript
interface NoteEntry {
  id: string            // uuid, keyPath
  challengeSlug: string // indexed field
  content: string
  createdAt: number     // Unix ms
  updatedAt: number | null
}
```

#### Scenario: Saving a note persists it to IndexedDB

- **WHEN** `saveNote(note)` is called with a valid `NoteEntry`
- **THEN** the entry SHALL be stored in the `pentest-notes` store under `note.id`

#### Scenario: Loading notes by slug returns only that challenge's notes

- **WHEN** `loadNotesBySlug("sqli-demo")` is called and notes for both `sqli-demo` and `php-demo` exist
- **THEN** only the notes with `challengeSlug === "sqli-demo"` SHALL be returned

#### Scenario: Loading notes returns empty array when none exist

- **WHEN** `loadNotesBySlug("new-challenge")` is called and no notes exist for that slug
- **THEN** an empty array SHALL be returned without throwing

#### Scenario: Deleting a note removes it from the store

- **WHEN** `deleteNote(id)` is called for an existing note
- **THEN** subsequent `loadNotesBySlug` SHALL NOT include that note

#### Scenario: Saving the same id twice performs an upsert

- **WHEN** `saveNote` is called twice with the same `id` but different `content`
- **THEN** only the most recently saved content SHALL be stored


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/useChallengePersistence.ts
tests:
  - tests/unit/composables/useChallengePersistence.test.ts
-->


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: Code scripts can be saved, listed, loaded, and deleted

The composable SHALL expose: `saveScript(name: string, content: string): Promise<string>` (returns the generated uuid), `listScripts(): Promise<ScriptEntry[]>` (returns all scripts sorted by `updatedAt` descending), `loadScript(id: string): Promise<string | null>`, and `deleteScript(id: string): Promise<void>`. Each script entry SHALL store `{ id, name, content, createdAt, updatedAt }`.

#### Scenario: Saving a script generates a unique id

- **WHEN** `saveScript("my-exploit", "print('hello')")` is called
- **THEN** the script SHALL be stored in IndexedDB with a unique uuid as id and the current timestamp in `createdAt` and `updatedAt`

#### Scenario: Listing scripts returns most recently updated first

- **WHEN** multiple scripts exist and `listScripts()` is called
- **THEN** the returned array SHALL be sorted by `updatedAt` descending

#### Scenario: Loading a non-existent script returns null

- **WHEN** `loadScript("unknown-id")` is called
- **THEN** the composable SHALL return `null` without throwing

#### Scenario: Deleting a script removes it from the store

- **WHEN** `deleteScript(id)` is called for an existing script
- **THEN** subsequent `listScripts()` SHALL NOT include that script


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
### Requirement: Terminal history is persisted to IndexedDB

The composable SHALL expose: `appendHistory(command: string): Promise<void>` and `loadHistory(limit?: number): Promise<string[]>` (defaults to last 200 entries, ordered oldest-first). Duplicate consecutive commands SHALL be deduplicated (i.e., if the last stored command equals the new one, it SHALL NOT be appended again).

#### Scenario: Commands are stored in order

- **WHEN** the user runs commands `curl /a`, `curl /b`, `curl /c` in sequence
- **THEN** `loadHistory()` SHALL return them in that order

#### Scenario: Duplicate consecutive commands are not stored twice

- **WHEN** the user runs the same command twice in a row
- **THEN** only one entry SHALL be appended to the history store

#### Scenario: History is truncated to the most recent entries

- **WHEN** `loadHistory(50)` is called
- **THEN** only the 50 most recent commands SHALL be returned

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
### Requirement: Attack sessions can be saved and loaded per challenge slug

The `useChallengePersistence` composable SHALL expose `saveAttackSession(session: AttackSession): Promise<void>` and `loadAttackSession(slug: string): Promise<AttackSession | null>`. These operate on the `attack-sessions` object store keyed by `challengeSlug`. Saving a session SHALL overwrite any existing session for that slug (upsert semantics).

#### Scenario: Saving a session persists it to IndexedDB

- **WHEN** `saveAttackSession(session)` is called
- **THEN** the session SHALL be stored in the `attack-sessions` store under `session.challengeSlug`

#### Scenario: Loading a non-existent session returns null

- **WHEN** `loadAttackSession("unknown-slug")` is called
- **THEN** the composable SHALL return `null` without throwing

#### Scenario: Saving overwrites a prior session for the same slug

- **WHEN** `saveAttackSession` is called twice for the same `challengeSlug`
- **THEN** only the most recently saved session SHALL be retained in IndexedDB

<!-- @trace
source: challenge-ux-and-attack-session
updated: 2026-03-23
code:
  - CONTRIBUTE.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/FlagSubmit.vue
  - README.md
  - Usage.md
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->