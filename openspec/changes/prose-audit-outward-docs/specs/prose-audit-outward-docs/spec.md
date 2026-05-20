## ADDED Requirements

### Requirement: Outward-facing Markdown SHALL pass humane-prose-audit before release

Every outward-facing Markdown document in this repository SHALL pass the `humane-prose-audit` pipeline at the `technical-doc` profile with verdict `PASS` (0 Critical AND 0 High findings) before a release tag is cut. Medium / Low / Suggestion findings are advisory and SHALL NOT block release.

The outward-facing surface is enumerated as: the five repository-root developer documents (`README.md`, `CONTRIBUTE.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) and every `*.md` file under `docs/` (including the `docs/zh-TW/` locale tree). Internal documents — anything under `openspec/`, `AUDIT.md`, `.claude/`, `.agents/`, `.spectra/`, and hidden dotfiles — are excluded from this requirement.

The `humane-prose-audit` profile SHALL be `technical-doc` for this repository; the configuration SHALL live at `.humane-prose-audit.yaml` at the repository root. Per-target audit run output SHALL be written under `audit-runs/` and SHALL be gitignored so the repository does not bloat; only the aggregated summary SHALL be committed.

#### Scenario: All outward docs PASS at PR time

- **WHEN** a maintainer is preparing a release commit on `main`
- **THEN** for every file in the outward-facing surface, `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py <file> --out audit-runs/prose/<slug>/` SHALL produce an `audit-report.json` whose top-level `verdict` field is `PASS`

#### Scenario: Critical and High findings are remediation-blocking

- **WHEN** the audit reports any finding with severity `Critical` or `High` on a file in the outward-facing surface
- **THEN** the change introducing or surfacing that finding SHALL NOT be merged until the file is patched and re-audited to PASS
- **AND** the remediation patch SHALL preserve the file's Markdown structural integrity (links, anchors, code fences, frontmatter)

#### Scenario: Audit run output is not committed

- **WHEN** a maintainer runs the audit and inspects `git status`
- **THEN** `audit-runs/` SHALL appear in `.gitignore` and SHALL NOT be staged
- **AND** only the aggregated summary at `openspec/changes/<name>/audit-summary.md` SHALL be added to the commit

#### Scenario: Internal docs are out of scope

- **WHEN** the audit pipeline is invoked
- **THEN** files under `openspec/`, `AUDIT.md`, and the hidden tooling directories (`.claude/`, `.agents/`, `.spectra/`) SHALL NOT be enumerated as audit targets
- **AND** the spec SHALL NOT impose a PASS requirement on those files
