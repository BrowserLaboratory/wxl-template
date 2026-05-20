# contributor-guide Specification

## Purpose

Defines the content and structure of `CONTRIBUTE.md`, documenting the git flow branching strategy, pull request submission process, commit message format (Conventional Commits with gitmoji), and contributor workflow for the project.

## Requirements

### Requirement: CONTRIBUTE describes git flow branch model

The `CONTRIBUTE.md` file SHALL describe the git flow branching strategy used in this project, including the purpose and lifetime of `main`, `staging`, `feature/*`, `bugfix/*`, and `hotfix/*` branches.

#### Scenario: Contributor knows which branch to branch from

- **WHEN** a contributor reads the branch model section
- **THEN** it SHALL be unambiguous which branch to base a feature branch on and which branch to target for a PR

#### Scenario: Hotfix branch rules are documented

- **WHEN** a contributor needs to patch a production bug
- **THEN** the guide SHALL specify that `hotfix/*` branches from `main` and merges into both `main` and `staging`


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: CONTRIBUTE describes PR submission process

The `CONTRIBUTE.md` SHALL describe the end-to-end process for submitting a pull request, from forking the repository to having the PR merged.

#### Scenario: PR targets the correct base branch

- **WHEN** a contributor submits a feature PR
- **THEN** the guide SHALL require that the PR targets `staging`, not `main`

#### Scenario: PR description requirements are stated

- **WHEN** a contributor opens a PR
- **THEN** the guide SHALL specify that the PR description MUST include: a summary of changes, the motivation, and a test plan


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: CONTRIBUTE describes commit message format

The `CONTRIBUTE.md` SHALL specify the required commit message format, using Conventional Commits with gitmoji prefix (e.g., `✨ feat: add login page`).

#### Scenario: Commit message format is shown with examples

- **WHEN** a contributor reads the commit message section
- **THEN** it SHALL show the format pattern and at least three concrete examples covering feat, fix, and refactor types

#### Scenario: Breaking change notation is documented

- **WHEN** a commit introduces a breaking change
- **THEN** the guide SHALL specify that `BREAKING CHANGE:` MUST appear in the commit footer


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: CONTRIBUTE describes issue reporting process

The `CONTRIBUTE.md` SHALL describe how to report bugs and request features via GitHub Issues.

#### Scenario: Bug report requirements are stated

- **WHEN** a contributor wants to report a bug
- **THEN** the guide SHALL specify the required information: reproduction steps, expected behavior, actual behavior, and environment details

<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: CONTRIBUTE guide is authored in English as source of truth

The `CONTRIBUTE.md` file SHALL be authored entirely in English. English is the source-of-truth language for the contributor onboarding document; any localized rendition SHALL derive from the English source and not the reverse.

All Markdown structural elements — relative links, image references, heading anchors, code fences and their language tags, and YAML frontmatter (if any) — SHALL be preserved exactly when the source is updated; translation MUST NOT introduce dead links, missing assets, or anchor drift.

Illustrative example strings that document the project's own conventions in another language MAY appear verbatim inside example blocks (e.g., showing what a `/tw-emoji-commit` Traditional Chinese commit subject looks like), because their value is to demonstrate the convention rather than to convey prose. Such examples SHALL be quoted or fenced so they read as data, not as document prose.

Technical identifiers that the broader project keeps in English (`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, `branch`, `merge`, `rebase`, `fork`) SHALL appear in English in `CONTRIBUTE.md` regardless of surrounding prose translation choices.

#### Scenario: CONTRIBUTE prose contains no Chinese characters outside example blocks

- **WHEN** a maintainer runs `rg '[一-鿿]' CONTRIBUTE.md`
- **THEN** every match SHALL fall inside a fenced code block or a quoted example string demonstrating a Traditional Chinese commit / PR convention
- **AND** no match SHALL appear in prose paragraphs, headings, list items, or table cells outside such examples

#### Scenario: All relative links in CONTRIBUTE resolve after translation

- **WHEN** any link target referenced from `CONTRIBUTE.md` is followed
- **THEN** the target SHALL exist in the repository at the referenced path
