# skill-agent-usability Specification

## Purpose

TBD - created by archiving change 'skill-agent-usability-audit'. Update Purpose after archive.

## Requirements

### Requirement: Authoring skill reference resolvability

Every file path, script path, or package script command that an authoring skill's canonical prose under `.agent/skills/<skill-name>/` instructs a host agent to read or execute SHALL resolve to an existing target in the repository. Repository-relative file and script paths SHALL point to files that exist. Package script commands invoked as `pnpm <script>` SHALL correspond to keys defined under `scripts` in `package.json`.

#### Scenario: Referenced file resolves

- **WHEN** a maintainer extracts every repository-relative file or script path referenced by `.agent/skills/<skill-name>/SKILL.md` and its reference documents
- **THEN** every extracted path SHALL point to a file that exists in the repository

#### Scenario: Referenced package script is defined

- **WHEN** an authoring skill instructs the agent to run a command of the form `pnpm <script>`
- **THEN** `<script>` SHALL exist as a key under `scripts` in `package.json`

---
### Requirement: Valid and discoverable skill frontmatter

Every entry-point file of an authoring skill — the canonical `.agent/skills/<skill-name>/SKILL.md` and each thin pointer under the official host agent paths — SHALL begin with a YAML frontmatter block that parses successfully and declares a non-empty `name` and a non-empty `description`. The `name` SHALL be kebab-case and SHALL equal `<skill-name>`. The `description` SHALL state the conditions under which the skill is used.

#### Scenario: Frontmatter parses and name matches directory

- **WHEN** a maintainer parses the frontmatter of `.agent/skills/<skill-name>/SKILL.md`
- **THEN** the block SHALL parse as valid YAML AND the `name` value SHALL equal `<skill-name>` in kebab-case

#### Scenario: Description states when to use

- **WHEN** a maintainer reads the `description` field of any authoring skill entry-point file
- **THEN** the `description` SHALL describe the triggering conditions for the skill AND SHALL NOT be empty

---
### Requirement: Canonical and pointer name consistency

For every authoring skill, the `name` declared in each thin pointer under `.claude/skills/<skill-name>/`, `.codex/skills/<skill-name>/`, and `.gemini/skills/<skill-name>/` SHALL equal the `name` declared in the canonical `.agent/skills/<skill-name>/SKILL.md`, and each pointer body SHALL direct the host agent to read that canonical file.

#### Scenario: Name parity across host pointers

- **WHEN** a maintainer compares the `name` field of the canonical `SKILL.md` with the `name` field of each of the three thin pointers
- **THEN** all four `name` values SHALL be identical

#### Scenario: Pointer directs to canonical path

- **WHEN** a maintainer reads the body of any thin pointer for the skill
- **THEN** the body SHALL reference `.agent/skills/<skill-name>/SKILL.md` as the canonical source
