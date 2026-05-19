## MODIFIED Requirements

### Requirement: useChallengePersistence manages an IndexedDB database for user tool data

The `useChallengePersistence` composable SHALL open (or create) an IndexedDB database named `challenge-tools` using the `idb` npm package. The database SHALL contain three object stores: `code-scripts` (keyPath: `id`, uuid string), `terminal-history` (keyPath: `id`, autoIncrement), and `attack-sessions` (keyPath: `challengeSlug`, string). The database version SHALL be `2`. The composable SHALL be importable from `.vitepress/theme/composables/useChallengePersistence.ts`.

The `upgrade` callback SHALL handle both fresh installs (version 0 → 2) and migrations from existing v1 installations (version 1 → 2) without destroying existing `code-scripts` or `terminal-history` data.

#### Scenario: Database is created on first use

- **WHEN** the composable is first used on a browser that has no prior IndexedDB data
- **THEN** the `challenge-tools` database SHALL be created at version 2 with all three object stores

#### Scenario: Existing v1 database is migrated without data loss

- **WHEN** the composable is used on a browser that already has the `challenge-tools` v1 database
- **THEN** the database SHALL be upgraded to version 2
- **AND** the existing `code-scripts` and `terminal-history` stores SHALL be preserved with their data intact
- **AND** the new `attack-sessions` store SHALL be added

## ADDED Requirements

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
