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

---
### Requirement: CONTRIBUTE documents maintainer setup for branch protection ruleset

The `CONTRIBUTE.md` file SHALL contain a top-level "Maintainer Setup" section, placed after the contributor-facing sections, that documents how a repository maintainer provisions the GitHub repository ruleset described in the `ci-quality-gates` capability. The section SHALL include a "Branch protection ruleset" subsection with (a) a brief explanation of why the ruleset is required and which capability it implements, (b) a copy-paste-ready `gh api` command that creates the ruleset using GitHub's REST API for repository rulesets, (c) a verification command that lists or inspects the active ruleset to confirm the required status checks are `test` and `build`, and (d) guidance on how to opt into a stricter approval policy if the team scales beyond a solo maintainer.

The maintainer setup section SHALL be clearly marked as out-of-scope for ordinary contributors, with an explicit note that contributors can skip it. The section SHALL avoid using the deprecated legacy "Branch protection rules" UI as the primary instruction path; rulesets are the documented mechanism.

#### Scenario: Maintainer of use-template fork reproduces the ruleset

- **WHEN** a maintainer creates a new repository from this template and opens `CONTRIBUTE.md`
- **THEN** the maintainer SHALL find a "Maintainer Setup → Branch protection ruleset" section
- **AND** the section SHALL include a `gh api` command that the maintainer can copy, substitute their own `{owner}/{repo}`, and execute to create the ruleset in a single step
- **AND** the section SHALL include a verification command that prints the active ruleset, allowing the maintainer to confirm `test` and `build` are listed as required status checks

#### Scenario: Contributor skipping maintainer section

- **WHEN** a first-time contributor reads `CONTRIBUTE.md` from top to bottom
- **THEN** the contributor SHALL encounter contributor-facing sections (branch model, development workflow, PR submission, commit conventions, issue reporting) before any maintainer-only content
- **AND** the "Maintainer Setup" section SHALL begin with a one-line note indicating it is for repository maintainers and can be skipped by contributors

#### Scenario: Team scaling to multiple reviewers

- **WHEN** a maintainer wants to require pull-request approvals in addition to status checks
- **THEN** `CONTRIBUTE.md` SHALL provide a clearly labeled command snippet or note that shows how to add `required_approving_review_count` (for example, set to `1`) to the ruleset payload
- **AND** the snippet SHALL preserve the existing required status checks rather than replacing them
