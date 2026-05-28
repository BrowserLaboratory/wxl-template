# challenge-author-scripts Specification

## Purpose

Provides CLI scripts for challenge authors to validate challenge structure and frontmatter correctness (`challenge:validate`), analyze challenges for common issues (`challenge:analyze`), scaffold new challenges (`create:challenge`), and generate encryption keys (`challenge:keygen`).

## Requirements

### Requirement: Challenge validate script

The system SHALL provide a `pnpm challenge:validate [slug]` CLI command that validates challenge structure and frontmatter correctness.

#### Scenario: Validate single challenge passes

- **WHEN** user runs `pnpm challenge:validate fastapi-demo` on a correctly structured challenge
- **THEN** the script outputs per-item ✓/✗ results for: frontmatter required fields, backend-app type match, app file existence, flag file existence, tools field validity, commands field validity, .fsignore syntax
- **AND** the final output is "All checks passed."

#### Scenario: Validate all challenges

- **WHEN** user runs `pnpm challenge:validate` without a slug argument
- **THEN** the script validates all challenges under `docs/challenge/*/index.md`

#### Scenario: Validate detects missing app file

- **WHEN** the challenge frontmatter references `app: app.py` but `src/app.py` does not exist
- **THEN** the script outputs ✗ for the app file check with a message indicating the file is missing

#### Scenario: Validate detects invalid tools value

- **WHEN** frontmatter contains `tools: [browser, invalid_tab]`
- **THEN** the script outputs ✗ indicating `invalid_tab` is not a valid tab ID


<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - scripts/challenge-analyze.ts
  - scripts/challenge-utils.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - .vitepress/theme/components/BrowserChrome.vue
  - .vitepress/theme/components/MergedNav.vue
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - scripts/create-challenge.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: Challenge analyze script

The system SHALL provide a `pnpm challenge:analyze [slug]` CLI command that performs validation plus content analysis.

#### Scenario: Analyze includes validation

- **WHEN** user runs `pnpm challenge:analyze fastapi-demo`
- **THEN** the script first runs all validation checks (same as validate)
- **AND** if validation fails, analysis is skipped with an error message

#### Scenario: Analyze outputs file statistics

- **WHEN** validation passes
- **THEN** the script outputs: file count and sizes in `src/`, estimated encrypted WASM payload size, flag format check (FLAG{...} or CTF{...}), tools/commands enablement summary

#### Scenario: Analyze detects potential issues

- **WHEN** the app source contains hardcoded host/port references or imports of unsupported Python modules
- **THEN** the script outputs warnings for each detected issue

#### Scenario: Analyze all challenges produces overview

- **WHEN** user runs `pnpm challenge:analyze` without a slug
- **THEN** the script analyzes all challenges and outputs a summary table with: slug, backend, difficulty, file count, estimated payload size, and any warnings

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - scripts/challenge-analyze.ts
  - scripts/challenge-utils.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - .vitepress/theme/components/BrowserChrome.vue
  - .vitepress/theme/components/MergedNav.vue
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - scripts/create-challenge.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: Challenge retype script

The system SHALL provide a `pnpm challenge:retype <slug>` CLI command that modifies an existing challenge's metadata or backend. The command SHALL accept at least one of the following flags: `--backend <flask|fastapi|php>`, `--difficulty <easy|medium|hard>`, `--tags <comma-separated-list>`, `--category <string>`. Multiple flags MAY be combined in a single invocation.

When `--backend` is given, the script SHALL:

1. Read the challenge's existing `index.md` frontmatter to determine the current backend.
2. If the new backend and the current backend are in the same language family (i.e., both are in the set {flask, fastapi}), the script SHALL keep the app file at `docs/challenge/<slug>/src/app.py`, rewrite only the framework imports and the application bootstrap header, and preserve the vulnerability body (route handlers, SQL strings, templates) verbatim.
3. If the new backend and the current backend are in different language families (i.e., one is in {flask, fastapi} and the other is `php`), the script SHALL attempt a best-effort cross-language rewrite of the skeleton scaffold but SHALL exit with code 2 if the vulnerability body cannot be expressed cleanly in the new language. On exit code 2 the script SHALL emit a "manual retype required" message naming the reason, and SHALL NOT mutate any file under `docs/challenge/<slug>/`.
4. Rename the app file from `src/app.py` to `src/index.php` (or the reverse) when crossing language families.
5. Update the frontmatter `backend` and `app` fields to match the new backend.
6. Update the frontmatter `packages` field if the new backend requires different Python packages.
7. Re-run `pnpm challenge:keygen <slug>` to regenerate the encrypted WASM payload.
8. Adjust `tests/challenges/<slug>.spec.ts` `EXPLOIT_PATH` placeholder substitution if the framework change shifts the exploit endpoint; if the shift cannot be inferred, leave the existing path and emit a warning.

When only metadata flags (`--difficulty`, `--tags`, `--category`) are given without `--backend`, the script SHALL Edit `docs/challenge/<slug>/index.md` frontmatter only and SHALL NOT touch application code or re-run keygen.

The script SHALL exit with code 0 on success, code 1 on invalid CLI arguments or missing challenge, code 2 when manual handling is required, and code 3 on internal IO or keygen failure. On any non-zero exit, the script SHALL emit a clear error message identifying the failure cause.

#### Scenario: Retype changes difficulty only

- **WHEN** user runs `pnpm challenge:retype door-is-open --difficulty hard`
- **THEN** the script SHALL update only `docs/challenge/door-is-open/index.md` frontmatter `difficulty` to `hard`, leave all other files untouched, exit with code 0, and emit "✓ Mutated door-is-open: difficulty=hard"

#### Scenario: Retype changes backend within same language family

- **WHEN** user runs `pnpm challenge:retype door-is-open --backend flask` (current backend is `fastapi`)
- **THEN** the script SHALL rewrite `src/app.py` to use Flask imports and bootstrap, preserve the route handler logic, update frontmatter `backend: flask`, re-run keygen, and exit with code 0

#### Scenario: Retype across language families exits with code 2

- **WHEN** user runs `pnpm challenge:retype door-is-open --backend php` and the IDOR vulnerability cannot be cleanly expressed in PHP without rewriting the SQLite access layer
- **THEN** the script SHALL exit with code 2, emit "manual retype required: sqlite3 IDOR pattern needs PDO rewrite", and SHALL leave all files under `docs/challenge/door-is-open/` untouched

#### Scenario: Retype with invalid backend value

- **WHEN** user runs `pnpm challenge:retype door-is-open --backend django`
- **THEN** the script SHALL exit with code 1 and emit "invalid --backend value; accepted: flask, fastapi, php"

#### Scenario: Retype combines multiple flags

- **WHEN** user runs `pnpm challenge:retype door-is-open --difficulty medium --tags 'idor,access-control'`
- **THEN** the script SHALL apply both frontmatter changes in a single pass, exit with code 0, and emit "✓ Mutated door-is-open: difficulty=medium, tags=[idor,access-control]"


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Challenge verify script with layered gates

The system SHALL provide a `pnpm challenge:verify <slug>` CLI command that orchestrates a layered verification pipeline. The command SHALL accept the optional flags `--blind` (enable L4) and `--layers <comma-separated-list>` (restrict to a subset of layers). The default invocation `pnpm challenge:verify <slug>` SHALL run layers L1, L2, and L3 in order. The invocation `pnpm challenge:verify <slug> --blind` SHALL additionally run layer L4 after L3.

Layer definitions:

- **L1**: invoke the existing `validateChallenge()` export from `scripts/challenge-validate.ts` against `docs/challenge/<slug>/index.md`. Pass if every check returns OK.
- **L2**: invoke the existing analyze logic from `scripts/challenge-analyze.ts`, then invoke `pnpm challenge:keygen <slug>`, then invoke `wasm-tools validate docs/challenge/<slug>/runtime.wasm`. Pass if all three steps return exit code 0.
- **L3**: invoke `pnpm exec playwright test tests/challenges/<slug>.spec.ts`. Pass if Playwright exits with code 0.
- **L4**: delegate to `scripts/challenge-verify-blind.ts` (governed by the `wxl-blind-solve-verification` capability). Pass if the blind solve produces a `final_flag` that byte-matches `docs/challenge/<slug>/src/flag.txt`.

The script SHALL fail fast: if any layer fails, subsequent layers SHALL NOT run. The script SHALL emit one status line per layer (e.g., `✓ L1 passed`, `✗ L3 failed: <reason>`) and SHALL emit a final summary line of the form `verified: <slug> (L1 L2 L3)` on full success or `failed: <slug> at L<n>` on failure or `inconclusive: <slug> at L4` when L4 cannot reach a verdict. The script SHALL accept a `--json` flag that replaces line-oriented stdout with a single JSON object summarizing every layer's status.

The script SHALL exit with code 0 when all requested layers pass, code 1 when any layer fails, and code 2 when L4 is inconclusive (insufficient information to declare pass or fail).

#### Scenario: Default verify passes all layers

- **WHEN** user runs `pnpm challenge:verify door-is-open` and L1, L2, L3 all pass
- **THEN** the script SHALL emit `✓ L1 passed`, `✓ L2 passed`, `✓ L3 passed`, then `verified: door-is-open (L1 L2 L3)`, and SHALL exit with code 0

#### Scenario: Verify fails at L3

- **WHEN** L1 passes, L2 passes, but the Playwright spec assertion fails
- **THEN** the script SHALL emit `✓ L1 passed`, `✓ L2 passed`, `✗ L3 failed: <playwright reason>`, then `failed: door-is-open at L3`, SHALL NOT attempt any further layer, and SHALL exit with code 1

#### Scenario: Blind verify produces matching flag

- **WHEN** user runs `pnpm challenge:verify door-is-open --blind` and the spawned agent's `final_flag` byte-matches `docs/challenge/door-is-open/src/flag.txt`
- **THEN** the script SHALL emit `✓ L4 passed`, then `verified: door-is-open (L1 L2 L3 L4)`, and SHALL exit with code 0

#### Scenario: Blind verify inconclusive

- **WHEN** the spawned agent does not emit a `FINAL_FLAG=` line within the turn budget
- **THEN** the script SHALL emit `? L4 inconclusive: no FINAL_FLAG emitted within budget`, then `inconclusive: door-is-open at L4`, and SHALL exit with code 2

#### Scenario: Verify with --layers restricts execution

- **WHEN** user runs `pnpm challenge:verify door-is-open --layers L1,L3`
- **THEN** the script SHALL run only L1 and L3, skip L2, and emit a summary listing only the layers it ran

#### Scenario: Verify outputs JSON

- **WHEN** user runs `pnpm challenge:verify door-is-open --json` and all three default layers pass
- **THEN** stdout SHALL contain exactly one parseable JSON object with keys `slug`, `layers_run`, `results`, `summary`, and `failed_at`, where `summary` is `verified` and `failed_at` is `null`


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Playwright is a devDependency

The repository's `package.json` SHALL declare `@playwright/test` as a `devDependency` to support the L3 e2e verification layer. The repository SHALL document in `README.md` Prerequisites and in `CONTRIBUTE.md` that a first-time clone requires running `pnpm exec playwright install chromium` after `pnpm install` to fetch the browser binary used by the verify pipeline. The browser binary SHALL NOT be required for `pnpm build`, `pnpm docs:build`, `pnpm test`, or `pnpm wasm:test` — only for `pnpm challenge:verify`.

#### Scenario: Fresh install with verify

- **WHEN** a contributor clones the repository and runs `pnpm install`
- **THEN** `@playwright/test` SHALL be installed to `node_modules/@playwright/test/` without invoking the browser binary fetch

#### Scenario: First verify invocation

- **WHEN** a contributor runs `pnpm challenge:verify door-is-open` immediately after `pnpm install` without having run `pnpm exec playwright install chromium`
- **THEN** L3 SHALL fail with a Playwright error indicating the browser is not installed, and `pnpm challenge:verify`'s stderr SHALL include a hint to run `pnpm exec playwright install chromium`

#### Scenario: Documentation references browser install step

- **WHEN** a maintainer reads `README.md` Prerequisites or the "Adding a new challenge" section of `CONTRIBUTE.md`
- **THEN** the document SHALL mention that `pnpm exec playwright install chromium` is required prior to first `pnpm challenge:verify`

<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->