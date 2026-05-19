## MODIFIED Requirements

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

The `meta.systemPrompt` SHALL be a module-level constant string hardcoded in `useAttackSession.ts` that instructs an AI to generate a structured CTF writeup from the attack session data.

The `meta.timezone` SHALL be obtained via `Intl.DateTimeFormat().resolvedOptions().timeZone` at export time.

The `meta.exportedAt` SHALL be an ISO 8601 string including the timezone offset (e.g., `2026-03-23T14:30:00+08:00`).

#### Scenario: Challenger downloads enriched attack session after solving

- **WHEN** `exportSession(challengeInfo)` is called with challenge metadata
- **THEN** the browser SHALL initiate a file download with a filename matching `attack-session-<slug>-*.json`
- **AND** the downloaded JSON SHALL contain `meta.systemPrompt` as a non-empty string
- **AND** the downloaded JSON SHALL contain `meta.timezone` matching the browser's IANA timezone
- **AND** the downloaded JSON SHALL contain `meta.exportedAt` as a valid ISO 8601 string
- **AND** `challenge.slug` and `challenge.title` SHALL be populated from the session
- **AND** `challenge.difficulty`, `challenge.category`, `challenge.backend`, `challenge.description`, and `challenge.fullDescription` SHALL be populated from the `challengeInfo` parameter
- **AND** `session.events` SHALL contain the complete event list from the `AttackSession`

#### Scenario: Export works when optional challenge fields are absent

- **WHEN** `exportSession(challengeInfo)` is called with a `ChallengeExportInfo` where optional fields are `undefined`
- **THEN** the exported JSON SHALL omit those fields from the `challenge` object
- **AND** the export SHALL complete without error
