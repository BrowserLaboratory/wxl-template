# wxl-crosscheck-skill Specification

## Purpose

TBD - created by archiving change 'split-wxl-creator-skills'. Update Purpose after archive.

## Requirements

### Requirement: Skill invokes the L4 blind multi-agent cross-check

The `wxl-crosscheck` skill SHALL be a maintainer-only wrapper that invokes the L4 blind-solve cross-check via `pnpm challenge:verify <slug> --blind` (optionally with `--agents <list>`), delegating all orchestration, verdict aggregation, and divergence reporting to the `l4-multi-agent-cross-check` capability's CLI contract. The skill SHALL NOT reimplement the multi-runtime orchestration, and SHALL surface the CLI's cross-agent divergence report to the user. The skill SHALL document that L4 is not run in CI and requires the target runtimes' CLIs installed locally.

#### Scenario: Single-runtime blind invocation

- **WHEN** a maintainer invokes the skill for slug `door-is-open` without specifying agents
- **THEN** the skill SHALL run `pnpm challenge:verify door-is-open --blind` and display the resulting verdict and divergence report

#### Scenario: Multi-runtime cross-check invocation

- **WHEN** a maintainer invokes the skill for slug `door-is-open` requesting the claude, codex, and gemini runtimes
- **THEN** the skill SHALL run `pnpm challenge:verify door-is-open --blind --agents claude,codex,gemini` (or the equivalent `pnpm challenge:verify:cross door-is-open`) and surface the per-agent outcomes and aggregate verdict

#### Scenario: Runtime CLI unavailable degrades gracefully

- **WHEN** one or more requested runtime CLIs are not installed locally and the L4 run cannot complete for them
- **THEN** the skill SHALL surface the CLI error, explain that L4 requires the runtimes installed locally and is not run in CI, and SHALL NOT fabricate a passing verdict

#### Scenario: Host-agent-neutral primitive check

- **WHEN** a maintainer greps the skill prose for `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `subagent_type`
- **THEN** no matches SHALL be found under `.agent/skills/wxl-crosscheck/`
