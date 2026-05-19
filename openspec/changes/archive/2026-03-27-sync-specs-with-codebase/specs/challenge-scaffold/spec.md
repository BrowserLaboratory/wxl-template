## MODIFIED Requirements

### Requirement: Script creates challenge directory structure

The script SHALL create the following files under `docs/challenge/`:

```
docs/challenge/<slug>/
  src/
    app.py        (flask or fastapi backend)
    index.php     (php backend)
    flag.txt      (plaintext flag)
docs/challenge/<slug>/index.md  (frontmatter + description stub)
```

The script SHALL refuse to create files if `docs/challenge/<slug>/index.md` or `docs/challenge/<slug>.md` (legacy path) already exists, and SHALL exit with code 1 with an informative error.

#### Scenario: Fresh scaffold for flask backend

- **WHEN** the script is run with `--name my-challenge --backend flask` and no existing files
- **THEN** `docs/challenge/my-challenge/src/app.py`, `docs/challenge/my-challenge/src/flag.txt`, and `docs/challenge/my-challenge/index.md` SHALL be created

#### Scenario: Collision detection with index.md

- **WHEN** `docs/challenge/my-challenge/index.md` already exists
- **THEN** the script SHALL exit with code 1 without modifying any files

#### Scenario: Collision detection with legacy .md path

- **WHEN** `docs/challenge/my-challenge.md` already exists
- **THEN** the script SHALL exit with code 1 without modifying any files

---
### Requirement: Frontmatter stub uses correct PLACEHOLDER values

The generated `<slug>/index.md` SHALL contain a valid frontmatter block with:
- `layout: challenge`
- `backend` set to the chosen value
- `app: app.py` (or `index.php` for php), relative to the `src/` directory
- `date` set to the current timestamp in ISO 8601 format (e.g., `2025-03-01T10:30:00.000Z`)
- `tags: []` as an empty array placeholder

The frontmatter SHALL NOT contain a `flag_verifier` placeholder field, a `fs_key` placeholder field, or an `fs` field.

#### Scenario: Generated frontmatter is parseable by VitePress

- **WHEN** the scaffold creates `<slug>/index.md`
- **THEN** the frontmatter MUST be valid YAML and include all required fields accepted by `validateChallengeConfig`

#### Scenario: Generated frontmatter includes date and tags fields

- **WHEN** the scaffold creates `<slug>/index.md`
- **THEN** the frontmatter SHALL contain a `date` field with an ISO 8601 timestamp reflecting the current system time
- **AND** the frontmatter SHALL contain a `tags` field set to an empty array `[]`

#### Scenario: Generated frontmatter app field is relative to src directory

- **WHEN** the scaffold creates `<slug>/index.md` with `--backend flask`
- **THEN** the frontmatter `app` field SHALL be `app.py` (relative to `src/`), NOT `./<slug>/app.py`
