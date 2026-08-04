# wxl-mutate-skill Specification

## Purpose

Covers the `wxl-mutate` skill, which changes an already-created challenge's `backend`, `difficulty`, `tags`, or `category` exclusively through `pnpm challenge:retype` instead of hand-editing `index.md` frontmatter or renaming application files, then hands off to `wxl-verify` by running `pnpm challenge:verify <slug>`. Cross-language backend swaps that `challenge:retype` rejects as requiring manual work (exit code 2) are surfaced and aborted, not retried.

## Requirements

### Requirement: Skill supports the mutate stage via challenge:retype

The `wxl-mutate` skill SHALL expose a Mutate stage for changing an existing challenge's `backend`, `difficulty`, `tags`, or `category` after Create. The Mutate stage SHALL invoke `pnpm challenge:retype <slug>` (with appropriate `--backend`, `--difficulty`, `--tags`, or `--category` flags) and SHALL NOT directly Edit `index.md` frontmatter or rename application files in skill prose. After `pnpm challenge:retype` exits, the skill SHALL hand off to the `wxl-verify` skill by running `pnpm challenge:verify <slug>` to confirm the mutation did not break the challenge.

#### Scenario: Mutate backend within the same language family

- **WHEN** the user invokes the Mutate stage with `slug=door-is-open, backend=flask` (currently fastapi)
- **THEN** the skill SHALL invoke `pnpm challenge:retype door-is-open --backend flask`, observe exit code 0, and follow with `pnpm challenge:verify door-is-open`

#### Scenario: Mutate backend across language families requires manual handling

- **WHEN** the user invokes the Mutate stage with `slug=door-is-open, backend=php` and `pnpm challenge:retype` exits with code 2 ("manual retype required")
- **THEN** the skill SHALL surface the `pnpm challenge:retype` stderr to the user, explain that PHP retype requires manual work, and abort the Mutate stage without retrying

#### Scenario: Mutate metadata only

- **WHEN** the user invokes the Mutate stage with `slug=door-is-open, difficulty=hard, tags=[idor,access-control,fastapi,sqlite,advanced]`
- **THEN** the skill SHALL invoke `pnpm challenge:retype door-is-open --difficulty hard --tags 'idor,access-control,fastapi,sqlite,advanced'` and follow with `pnpm challenge:verify door-is-open`

#### Scenario: Host-agent-neutral primitive check

- **WHEN** a maintainer greps the skill prose for `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `subagent_type`
- **THEN** no matches SHALL be found under `.agent/skills/wxl-mutate/`
