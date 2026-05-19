## ADDED Requirements

### Requirement: Slug derivation from per-folder challenge path

ChallengeLayout SHALL derive the challenge slug from the parent directory name of the current page's `relativePath`. For a path like `challenge/<slug>/index.md`, the slug SHALL be extracted as the second-to-last path segment (i.e., `<slug>`).

If the path has fewer than two segments, the system SHALL fall back to extracting the filename without the `.md` extension.

#### Scenario: Per-folder challenge path yields correct slug

- **WHEN** `page.relativePath` is `"challenge/sqli-demo/index.md"`
- **THEN** the computed slug SHALL be `"sqli-demo"`

#### Scenario: Per-folder FastAPI challenge path yields correct slug

- **WHEN** `page.relativePath` is `"challenge/fastapi-demo/index.md"`
- **THEN** the computed slug SHALL be `"fastapi-demo"`

#### Scenario: Fallback for flat file path

- **WHEN** `page.relativePath` is `"challenge/legacy-demo.md"` (single-level path)
- **THEN** the computed slug SHALL be `"legacy-demo"`
