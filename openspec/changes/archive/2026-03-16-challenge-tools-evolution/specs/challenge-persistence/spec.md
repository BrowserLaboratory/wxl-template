## ADDED Requirements

### Requirement: useChallengePersistence manages an IndexedDB database for user tool data

The `useChallengePersistence` composable SHALL open (or create) an IndexedDB database named `challenge-tools` using the `idb` npm package. The database SHALL contain two object stores: `code-scripts` (keyPath: `id`, uuid string) and `terminal-history` (keyPath: `id`, autoIncrement). The database version SHALL start at `1`. The composable SHALL be importable from `.vitepress/theme/composables/useChallengePersistence.ts`.

#### Scenario: Database is created on first use

- **WHEN** the composable is first used on a browser that has no prior IndexedDB data
- **THEN** the `challenge-tools` database SHALL be created with both object stores

#### Scenario: Existing database is opened without upgrade

- **WHEN** the composable is used on a browser that already has the `challenge-tools` v1 database
- **THEN** the database SHALL be opened without triggering the upgrade callback

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
