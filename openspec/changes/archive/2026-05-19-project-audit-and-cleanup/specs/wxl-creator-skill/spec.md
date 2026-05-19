## ADDED Requirements

### Requirement: Skill uses canonical reference example for code generation style

The `wxl-creator` skill SHALL use exactly one canonical challenge directory as the reference example when generating vulnerable application code for a new challenge. The canonical reference SHALL be `docs/challenge/door-is-open/`.

The skill SHALL read the canonical reference's `src/app.py` (or backend-equivalent entry point) and `index.md` before generating new code, and the generated code SHALL follow the same conventions as the canonical reference for:

- Entry point structure (route definitions, imports, framework initialisation)
- Flag file reading pattern (`/flag.txt` location and access)
- Frontmatter shape (`description`, `tags`, `tools`, `packages`, `source_visible`, `difficulty`, `date`)
- Markdown body layout (challenge narrative, hints, source visibility note)

When the canonical reference is changed in the future, both this requirement and the corresponding skill prose in `.claude/skills/wxl-creator/SKILL.md` MUST be updated together in a single change.

#### Scenario: Canonical reference is door-is-open after Change 1

- **WHEN** a maintainer invokes `/wxl-creator` to scaffold a new challenge
- **THEN** the skill SHALL read `docs/challenge/door-is-open/src/app.py` and `docs/challenge/door-is-open/index.md` as the reference for code style and frontmatter shape, and SHALL NOT read any other archived demo challenge as a reference

#### Scenario: Canonical reference becomes unavailable

- **WHEN** the canonical reference directory (`docs/challenge/door-is-open/`) is missing or its `src/app.py` or `index.md` cannot be read
- **THEN** the skill SHALL halt the scaffold operation, leave no partially-generated files on disk, emit an error message containing the literal path `docs/challenge/door-is-open/`, and SHALL NOT read code-style reference content from any other location — specifically forbidden fallback sources include any directory under `.archive/`, any other directory under `docs/challenge/`, any user-supplied path, and any directory auto-discovered by globbing the filesystem

#### Scenario: Canonical reference and SKILL.md drift detection

- **WHEN** the skill prose in `.claude/skills/wxl-creator/SKILL.md` references a directory that does not match the canonical reference declared in this requirement
- **THEN** a maintainer running `/spectra-audit` against the wxl-creator-skill capability SHALL receive at least one finding flagging the drift

##### Example: drift detection

| SKILL.md mentions | This requirement says | Audit finding |
| --- | --- | --- |
| `docs/challenge/door-is-open/` | `docs/challenge/door-is-open/` | none |
| `docs/challenge/sqli-demo/` | `docs/challenge/door-is-open/` | drift flagged |
| `docs/challenge/some-future-demo/` | `docs/challenge/door-is-open/` | drift flagged |
