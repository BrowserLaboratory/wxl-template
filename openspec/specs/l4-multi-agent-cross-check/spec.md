# l4-multi-agent-cross-check Specification

## Purpose

Extend the L4 blind-solve verification gate so a single `pnpm challenge:verify --blind` invocation can run the same challenge against multiple agent runtimes (claude / codex / gemini) in one go, isolate each in its own ephemeral workdir, aggregate verdicts under a fail-over-pass-over-inconclusive precedence, and always emit a cross-agent divergence report. Cross-agent divergence is the key maintainer signal for challenge difficulty calibration, `wxl-creator` skill cross-agent neutrality, and suspected-non-intended-solution detection — none of which are observable under the single-runtime L4 path defined by `wxl-blind-solve-verification`. This capability layers strictly on top of that one (per-runtime build / spawn / extract / byte-compare reuse the same pipeline) and stays back-compat: when the resolved runtime list contains exactly one entry, the legacy single-runtime path is taken byte-for-byte.

## Requirements

### Requirement: Multi-runtime orchestration spawns each selected runtime in isolation

The L4 blind-solve subsystem SHALL support running more than one agent runtime against the same challenge in a single invocation. When the resolved runtime list contains N runtimes, the subsystem SHALL, for each runtime, build a player package and spawn that runtime in its own ephemeral working directory at `tmp/wxl-verify/<slug>/<runtime>/`, so that no runtime's `player-package/` or `run.log` overwrites another's. Each runtime SHALL be driven through the same build → spawn → extract → byte-compare pipeline defined by the `wxl-blind-solve-verification` capability, producing one per-runtime outcome consisting of its runtime name, verdict (`pass` / `fail` / `inconclusive`), reason, and the extracted flag (or null when no flag was extracted).

When the resolved runtime list contains exactly one runtime, the subsystem SHALL preserve the prior single-runtime behavior byte-for-byte: it SHALL use the working directory `tmp/wxl-verify/<slug>/` (without a `<runtime>` sub-directory), and SHALL emit the same single-line verdict output and the same exit codes as before this change. After all runtimes complete (regardless of verdicts), the subsystem SHALL best-effort delete the entire `tmp/wxl-verify/<slug>/` directory.

#### Scenario: Each runtime runs in its own working directory

- **WHEN** the subsystem is invoked for slug `door-is-open` with the resolved runtime list `[claude, codex, gemini]`
- **THEN** the subsystem SHALL create `tmp/wxl-verify/door-is-open/claude/`, `tmp/wxl-verify/door-is-open/codex/`, and `tmp/wxl-verify/door-is-open/gemini/`, each containing its own `player-package/` and `run.log`, and SHALL spawn each runtime exactly once

#### Scenario: Single-runtime list preserves legacy working directory and output

- **WHEN** the subsystem is invoked for slug `door-is-open` with the resolved runtime list `[claude]`
- **THEN** the subsystem SHALL use `tmp/wxl-verify/door-is-open/` (with no `<runtime>` sub-directory), and SHALL emit the same single-runtime verdict line and exit code as it did before multi-runtime support was added

#### Scenario: Cleanup removes the whole challenge temp tree

- **WHEN** the subsystem completes a multi-runtime run for slug `door-is-open`
- **THEN** the directory `tmp/wxl-verify/door-is-open/` SHALL NOT exist after the subsystem exits


<!-- @trace
source: l4-multi-agent-cross-check
updated: 2026-06-01
code:
  - CONTRIBUTE.md
  - README.md
  - scripts/challenge-verify.ts
  - scripts/challenge-verify-blind.ts
  - scripts/wxl-solver/spawn-runtime.ts
  - package.json
  - scripts/wxl-solver/aggregate-cross-agent.ts
tests:
  - tests/unit/scripts/wxl-solver/aggregate-cross-agent.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Aggregate verdict follows fail-over-pass-over-inconclusive precedence

The subsystem SHALL compute a single aggregate verdict from the per-runtime outcomes using a fixed precedence, evaluated in order:

1. If ANY per-runtime verdict is `fail`, the aggregate verdict SHALL be `fail`.
2. Otherwise, if AT LEAST ONE per-runtime verdict is `pass`, the aggregate verdict SHALL be `pass`.
3. Otherwise (every per-runtime verdict is `inconclusive`), the aggregate verdict SHALL be `inconclusive`.

A per-runtime `fail` SHALL include both the case where a runtime emitted a flag that matches `flag_regex` but differs from the canonical flag, and the case where a runtime emitted a flag that does not match `flag_regex`. The subsystem SHALL exit with code 0 when the aggregate verdict is `pass`, code 1 when it is `fail`, and code 2 when it is `inconclusive`.

#### Scenario: One pass and the rest inconclusive yields pass

- **WHEN** the per-runtime outcomes are `claude: pass`, `codex: inconclusive`, `gemini: inconclusive`
- **THEN** the aggregate verdict SHALL be `pass` and the subsystem SHALL exit with code 0

#### Scenario: A single fail overrides any pass

- **WHEN** the per-runtime outcomes are `claude: pass`, `codex: fail`, `gemini: inconclusive`
- **THEN** the aggregate verdict SHALL be `fail` and the subsystem SHALL exit with code 1

#### Scenario: All inconclusive yields inconclusive

- **WHEN** every per-runtime outcome is `inconclusive`
- **THEN** the aggregate verdict SHALL be `inconclusive` and the subsystem SHALL exit with code 2


<!-- @trace
source: l4-multi-agent-cross-check
updated: 2026-06-01
code:
  - CONTRIBUTE.md
  - README.md
  - scripts/challenge-verify.ts
  - scripts/challenge-verify-blind.ts
  - scripts/wxl-solver/spawn-runtime.ts
  - package.json
  - scripts/wxl-solver/aggregate-cross-agent.ts
tests:
  - tests/unit/scripts/wxl-solver/aggregate-cross-agent.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Cross-agent divergence report is always emitted

Regardless of the aggregate verdict, the subsystem SHALL emit a cross-agent report listing, for every runtime that was run, its runtime name, its verdict, and the flag it extracted (or an explicit indication that no flag was extracted). The report SHALL indicate whether the run was divergent, where divergent SHALL be defined as the per-runtime verdicts not all being equal. The subsystem SHALL support a machine-readable form of this report when JSON output is requested, containing a `perAgent` array (one entry per runtime with `runtime`, `verdict`, `reason`, `flag`) and an `aggregate` object exposing at least `verdict` and `divergent`.

#### Scenario: Report lists every runtime and its outcome

- **WHEN** a multi-runtime run completes with outcomes `claude: pass (FLAG{...})`, `codex: inconclusive (no flag)`, `gemini: fail (FLAG{wrong})`
- **THEN** the emitted report SHALL contain one entry per runtime showing its verdict and extracted flag (or no-flag indication), and SHALL mark the run as divergent

#### Scenario: Non-divergent run is marked not divergent

- **WHEN** every per-runtime verdict is `pass`
- **THEN** the report SHALL mark the run as not divergent

#### Scenario: JSON report shape

- **WHEN** JSON output is requested for a multi-runtime run
- **THEN** the JSON SHALL contain a `perAgent` array with one object per runtime (keys `runtime`, `verdict`, `reason`, `flag`) and an `aggregate` object exposing at least `verdict` and `divergent`


<!-- @trace
source: l4-multi-agent-cross-check
updated: 2026-06-01
code:
  - CONTRIBUTE.md
  - README.md
  - scripts/challenge-verify.ts
  - scripts/challenge-verify-blind.ts
  - scripts/wxl-solver/spawn-runtime.ts
  - package.json
  - scripts/wxl-solver/aggregate-cross-agent.ts
tests:
  - tests/unit/scripts/wxl-solver/aggregate-cross-agent.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: The --agents flag selects runtimes and requires --blind

The `challenge:verify` CLI and the blind-solve driver SHALL accept an `--agents <list>` flag whose value is a comma-separated list of runtime names. The flag SHALL be parsed by splitting on commas, trimming whitespace, and removing duplicates while preserving first-occurrence order. Runtime selection precedence SHALL be, from highest to lowest: the `--agents` flag, then a list-form `WXL_VERIFY_RUNTIME` environment variable, then the default `claude`. Because multi-runtime cross-check only applies to L4, the subsystem SHALL require `--agents` to be accompanied by `--blind`; if `--agents` is supplied without `--blind`, the subsystem SHALL exit with a non-zero code and emit an error stating that `--agents` requires `--blind`. Any unknown runtime supplied to `--agents` SHALL be rejected with the same error and exit code used for an unknown `WXL_VERIFY_RUNTIME` value.

#### Scenario: --agents selects multiple runtimes under --blind

- **WHEN** the CLI is invoked as `challenge:verify door-is-open --blind --agents claude,codex,gemini`
- **THEN** the L4 subsystem SHALL run all three runtimes against `door-is-open`

#### Scenario: --agents without --blind is rejected

- **WHEN** the CLI is invoked as `challenge:verify door-is-open --agents claude,codex`
- **THEN** the CLI SHALL exit with a non-zero code and emit an error stating that `--agents` requires `--blind`

#### Scenario: --agents overrides the environment variable

- **WHEN** the CLI is invoked as `challenge:verify door-is-open --blind --agents claude` while `WXL_VERIFY_RUNTIME=codex,gemini` is set
- **THEN** the subsystem SHALL run only `claude`

#### Scenario: Unknown runtime in --agents is rejected

- **WHEN** the CLI is invoked as `challenge:verify door-is-open --blind --agents claude,copilot`
- **THEN** the CLI SHALL exit with code 1 and emit an error listing the accepted runtimes `claude, codex, gemini`

<!-- @trace
source: l4-multi-agent-cross-check
updated: 2026-06-01
code:
  - CONTRIBUTE.md
  - README.md
  - scripts/challenge-verify.ts
  - scripts/challenge-verify-blind.ts
  - scripts/wxl-solver/spawn-runtime.ts
  - package.json
  - scripts/wxl-solver/aggregate-cross-agent.ts
tests:
  - tests/unit/scripts/wxl-solver/aggregate-cross-agent.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->