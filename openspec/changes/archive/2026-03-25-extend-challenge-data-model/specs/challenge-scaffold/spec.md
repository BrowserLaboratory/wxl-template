## MODIFIED Requirements

### Requirement: Frontmatter stub uses correct PLACEHOLDER values

The generated `<slug>.md` SHALL contain a valid frontmatter block with:
- `layout: challenge`
- `backend` set to the chosen value
- `flag_verifier: "PLACEHOLDER_RUN_pnpm_challenge_keygen"`
- `fs_key: "PLACEHOLDER_RUN_pnpm_challenge_keygen"`
- `app: ./<slug>/app.py` (or `index.php` for php)
- `fs: { /flag.txt: ./<slug>/flag.txt }`
- `date` set to the current timestamp in ISO 8601 format (e.g., `2025-03-01T10:30:00.000Z`)
- `tags: []` as an empty array placeholder

#### Scenario: Generated frontmatter is parseable by VitePress

- **WHEN** the scaffold creates `<slug>.md`
- **THEN** the frontmatter MUST be valid YAML and include all required fields accepted by `validateChallengeConfig`

#### Scenario: Generated frontmatter includes date and tags fields

- **WHEN** the scaffold creates `<slug>.md`
- **THEN** the frontmatter SHALL contain a `date` field with an ISO 8601 timestamp reflecting the current system time
- **AND** the frontmatter SHALL contain a `tags` field set to an empty array `[]`
