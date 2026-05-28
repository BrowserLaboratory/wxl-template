## ADDED Requirements

### Requirement: The pipeline SHALL run Phase-1 deterministic prose audit on changed markdown files

The `quality-gates.yml` workflow SHALL define a third top-level job whose ID is `prose-audit`. This job SHALL run in parallel with the `test` and `build` jobs — it SHALL NOT declare a `needs:` dependency on either of them.

The `prose-audit` job SHALL execute the following sequence:

1. Check out the repository using the same pinned `actions/checkout` action and version used elsewhere in the workflow, with `fetch-depth: 0` so that the base-vs-head diff can be computed locally.
2. Set up Python 3.12 via `actions/setup-python@v6` (or a later major version whose `runs.using` is `node24` or later) with `cache: pip`.
3. Install the audit dependencies from `scripts/prose-audit/requirements.txt` (which SHALL declare concrete pinned versions of exactly `pyyaml`, `textstat`, and `jsonschema` — the only third-party packages imported by the vendored checkers; `tiktoken` and `py-readability-metrics` SHALL NOT be declared, because no vendored module imports them).
4. Compute the set of Added / Modified / Renamed `*.md` files between the pull-request base and head using `git diff --name-only --diff-filter=AMR -M origin/<base>...HEAD -- '*.md'`. Rename detection (`-M`) SHALL be enabled so that renamed-with-edit files are not split into a delete-plus-add pair that escapes scanning.
5. Intersect that diff set with the outward-facing surface defined by the `prose-audit-outward-docs` capability (the five root developer documents `README.md` / `CONTRIBUTE.md` / `CLAUDE.md` / `AGENTS.md` / `GEMINI.md`, plus every `*.md` file under `docs/`). Files outside the outward-facing surface — including everything under `openspec/`, `AUDIT.md`, `.claude/`, `.agents/`, `.spectra/`, and any other internal-tooling directory — SHALL NOT be audited.
6. Invoke `python scripts/prose-audit/run.py <files> --out audit-runs/prose-phase1-ci/ --json-summary audit-runs/prose-phase1-ci/summary.json`. The intersection from step 5 is the positional argument list; if the intersection is empty the wrapper SHALL exit 0 with a skip message and the job SHALL be green.
7. Upload the entire `audit-runs/prose-phase1-ci/` directory as a GitHub Actions artifact named `prose-audit-phase1-reports` with `retention-days: 14`. The upload step SHALL use `if: always()` so that the artifact is preserved even when the audit step reports failure (so contributors can inspect Critical findings).

The job SHALL fail if and only if the `run.py` wrapper exits with a non-zero status. The wrapper SHALL exit non-zero if and only if at least one checker in the **blocking set** — `mainland_vocab`, `placeholder_grep`, and `citation_format` — reports one or more findings on any audited file, regardless of the finding's `severity` label. Findings reported by the other eleven **advisory** checkers SHALL NOT, by themselves, cause the wrapper or the job to fail; they SHALL be recorded in the run output for human review only. Rationale: the vendored deterministic checkers never emit `severity: "critical"` (the maximum they emit is `high`), so a severity threshold such as `--fail-on critical` could never gate; the blocking set instead names the rules that detect objective, unambiguous errors (mainland-Chinese vocabulary, unfinished placeholders, and malformed citations), while stylistic checkers remain advisory to avoid false-positive merge blocks. A non-zero exit due to an internal error (a checker crash or `ImportError`) SHALL be distinguishable from a blocking finding (the wrapper SHALL use exit code 2 for internal error versus exit code 1 for a blocking finding).

The deterministic checker set SHALL comprise exactly these 14 checkers, vendored into `scripts/prose-audit/checks/`: `mainland_vocab`, `placeholder_grep`, `duplicate_sentences`, `citation_format`, `readability_metrics`, `lazy_writer_check`, `ai_tells`, `burstiness`, `hedge_density`, `imperative_fog`, `lexical_diversity`, `pronoun_consistency`, `discourse_marker_density`, `repetition_fingerprint`. `run.py` SHALL invoke these modules directly — one subprocess per `scripts/prose-audit/checks/<rule>.py` — and parse each checker's stdout JSON. The vendored tree SHALL additionally include `scripts/prose-audit/config.yaml` (the wordlist/pattern config read by `mainland_vocab`, `placeholder_grep`, `duplicate_sentences`, `lazy_writer_check`, and `readability_metrics`) and the minimal `_common` modules the checkers import (`locale_detect` for `burstiness`, `config_resolver` for `citation_format`). The change SHALL NOT vendor or invoke the `humane-prose-audit` orchestrator (`audit_orchestrator.py`) or any of its LLM sub-agent dispatch, fuzz-mutator, humane-signal-scoring, or consolidated-findings logic — those remain the responsibility of the maintainer's release-time manual run governed by the `prose-audit-outward-docs` capability. Each per-file run SHALL write `<file-slug>/findings.json`; the wrapper SHALL also write a merged `summary.json`.

The `prose-audit` job SHALL declare permissions equivalent to or narrower than `contents: read`. It SHALL NOT request `pull-requests: write`, `issues: write`, or any other elevated scope, since artifact upload alone is the chosen reporting mechanism.

#### Scenario: PR-time deterministic audit is triggered on changed outward markdown

- **WHEN** a contributor opens a pull request whose base branch is `main` or `staging` and the diff modifies at least one `*.md` file inside the outward-facing surface
- **THEN** the `Quality Gates` workflow SHALL queue a `prose-audit` job alongside the existing `test` and `build` jobs within 60 seconds
- **AND** the job SHALL execute the Phase-1 deterministic checker pipeline against exactly the intersection of the PR diff and the outward-facing surface (no other files SHALL be scanned)
- **AND** the job's conclusion SHALL appear as a third check on the pull request named `Quality Gates / prose-audit`

#### Scenario: Blocking-rule finding blocks merge

- **WHEN** the `prose-audit` job runs and at least one blocking-set checker (`mainland_vocab`, `placeholder_grep`, or `citation_format`) reports one or more findings on any audited file
- **THEN** `scripts/prose-audit/run.py` SHALL exit with a non-zero status regardless of the findings' severity labels
- **AND** the `prose-audit` job's conclusion SHALL be `failure`
- **AND** the `audit-runs/prose-phase1-ci/` artifact SHALL nonetheless be uploaded (per the `if: always()` policy) so contributors can inspect the offending finding
- **AND** the pull request SHALL be blocked from merging by the `required_status_checks` rule (provided the branch-protection ruleset has been updated to include `prose-audit` in its required-checks list, per the MODIFIED requirement in this same spec delta)

#### Scenario: Advisory-only findings do not block merge

- **WHEN** the `prose-audit` job runs and every finding reported comes from an advisory checker (any of the eleven that are not in the blocking set — for example `burstiness`, `lexical_diversity`, or `hedge_density`)
- **THEN** `scripts/prose-audit/run.py` SHALL exit 0
- **AND** the `prose-audit` job's conclusion SHALL be `success`
- **AND** those advisory findings SHALL still be recorded in `summary.json` so a reviewer can read them without the job blocking the merge

#### Scenario: Non-outward markdown change does not consume audit budget

- **WHEN** a contributor opens a pull request whose only `*.md` modifications are under `openspec/`, `.claude/`, `.agents/`, `.spectra/`, or any other internal-tooling directory excluded from the outward-facing surface
- **THEN** the intersection of the PR diff and the outward-facing surface SHALL be empty
- **AND** `scripts/prose-audit/run.py` SHALL exit 0 with a "no markdown files to audit; skipping" message logged to stdout
- **AND** the `prose-audit` job's conclusion SHALL be `success`
- **AND** the workflow SHALL NOT invoke any of the 14 checker modules for this run

#### Scenario: Rename-with-edit on an outward file is still scanned

- **WHEN** a contributor renames an outward-facing file (e.g. `docs/guide/old-name.md` → `docs/guide/new-name.md`) and modifies its contents in the same pull request
- **THEN** `git diff --name-only --diff-filter=AMR -M origin/<base>...HEAD -- '*.md'` SHALL report `docs/guide/new-name.md` as the renamed target (because the `-M` rename-detection flag is mandated)
- **AND** the `prose-audit` job SHALL include `docs/guide/new-name.md` in the audit set
- **AND** the file SHALL NOT escape scanning by being split into a delete-plus-add pair

#### Scenario: Phase-1 job permissions are read-only

- **WHEN** a reviewer inspects the `prose-audit` job definition in `.github/workflows/quality-gates.yml`
- **THEN** either the workflow-level `permissions:` block (read-only) SHALL apply unmodified
- **OR** the job-level `permissions:` block SHALL declare `contents: read` and nothing else
- **AND** the job SHALL NOT request `pull-requests: write`, `issues: write`, or any other elevated scope

#### Scenario: Orchestrator and LLM phases are neither vendored nor invoked

- **WHEN** a maintainer inspects the post-run contents of the `audit-runs/prose-phase1-ci/` artifact uploaded by the `prose-audit` job
- **THEN** each per-file subdirectory SHALL contain `findings.json`, the run root SHALL contain `summary.json`, and the artifact SHALL NOT contain `preflight/`, `agents/_inputs.json`, `mutators/`, `fuzz/`, `humane_score.json`, or any artifact produced by the `humane-prose-audit` orchestrator or its LLM / fuzz / humane-signal / consolidated-findings phases
- **AND** `scripts/prose-audit/` SHALL NOT contain `audit_orchestrator.py`
- **AND** the workflow SHALL NOT define any `ANTHROPIC_API_KEY` (or equivalent LLM credential) secret reference for the `prose-audit` job, because the vendored deterministic checkers SHALL NOT invoke any LLM

## MODIFIED Requirements

### Requirement: Branch protection ruleset guards main with required status checks

The default branch SHALL be guarded by a GitHub repository ruleset whose `conditions.ref_name.include` is `["~DEFAULT_BRANCH"]` so that the ruleset follows the repository's default branch even if its name changes (for example, `main` renamed to `trunk`, or a derived repository using `master`). The ruleset SHALL be `enforcement: "active"` and `target: "branch"`.

The ruleset SHALL include the following `rules`, in addition to any rules introduced by other capabilities:

- A `pull_request` rule that requires every change to land via a pull request rather than a direct push. The rule's `parameters` SHALL set `dismiss_stale_reviews_on_push` to `true` (a new commit on the pull request invalidates prior approving reviews) and `required_review_thread_resolution` to `true` (every review-conversation thread MUST be resolved before merge). `required_approving_review_count` is NOT required to be non-zero by this requirement; teams that want a stricter approval policy SHALL follow the upgrade snippet documented in `CONTRIBUTE.md`.
- A `required_status_checks` rule listing `test`, `build`, and `prose-audit` as required status checks, each pinned to `integration_id: 15368` (the GitHub Actions App). Pinning `integration_id` prevents a third-party GitHub App from reporting a same-named check and bypassing the gate. All three checks MUST report a success conclusion before a pull request becomes mergeable. The `test`, `build`, and `prose-audit` contexts refer to the job IDs defined in `.github/workflows/quality-gates.yml`, which are pinned by other requirements in this capability and SHALL NOT be renamed without also updating the ruleset.
- A `deletion` rule that prevents the default branch from being deleted, even by accounts that would otherwise have administrative permission. Deletion MUST go through explicit `bypass_actors` invocation and SHALL be recorded in the GitHub audit log.
- A `non_fast_forward` rule that prevents force-push to the default branch (`git push --force`, `git push --force-with-lease`, and equivalent rewrites). Force-push MUST go through explicit `bypass_actors` invocation and SHALL be recorded in the GitHub audit log.

The ruleset SHALL permit bypass for the `OrganizationAdmin` actor type (which represents organization-level administrators; the GitHub API accepts this `actor_type` with `actor_id: 1`) and for the `RepositoryRole` actor type with `actor_id: 5` (which represents the repository's built-in Admin role). Both bypass entries SHALL use `bypass_mode: "pull_request"` so that bypass is permitted only through the pull-request flow (for example, a maintainer self-merging without waiting for required status checks): the `bypass_mode: "always"` setting that would permit direct push to the default branch SHALL NOT be used. The legacy actor-type name `RepositoryAdmin` is not a valid GitHub API value and SHALL NOT appear in the payload. Bypass invocation SHALL be discoverable in the GitHub audit log, providing an after-the-fact accountability trail.

The ruleset itself is GitHub server-side state and SHALL NOT be expected to live in this repository; the maintainer SHALL create and maintain it out-of-band using the procedure documented under `CONTRIBUTE.md` "Maintainer Setup", which provides both an initial-create (`gh api -X POST .../rulesets`) command and an upgrade (`gh api -X PUT .../rulesets/<id>`) command. This requirement constrains the shape the ruleset takes; the act of provisioning or upgrading the ruleset on a given GitHub repository is a maintainer responsibility, not an automated step in any workflow.

#### Scenario: Direct push to the default branch is rejected once the ruleset is provisioned

- **WHEN** a maintainer with a personal access token attempts `git push origin <default-branch>` after the ruleset is provisioned
- **THEN** the push SHALL be rejected by GitHub with a message indicating the branch is protected by a ruleset
- **AND** because every bypass actor uses `bypass_mode: "pull_request"`, no direct-push variant SHALL succeed — the maintainer MUST open a pull request and use the pull-request bypass flow even when bypassing required status checks

#### Scenario: Force-push or deletion of the default branch is rejected

- **WHEN** any account, including organization or repository administrators, attempts `git push --force origin <default-branch>` or `git push origin --delete <default-branch>`
- **THEN** the push SHALL be rejected by the `non_fast_forward` and `deletion` rules respectively
- **AND** the operation SHALL succeed only when the actor is in the bypass list and explicitly opts to bypass, which SHALL be recorded in the GitHub audit log

#### Scenario: Pull request to the default branch cannot merge while a required check is failing

- **WHEN** a contributor opens a pull request targeting the default branch whose `quality-gates` workflow run has any of `test`, `build`, or `prose-audit` reporting a failure conclusion
- **THEN** the GitHub merge button SHALL be disabled with a message indicating one or more required status checks have not passed
- **AND** the pull request SHALL only become mergeable once all three of `test`, `build`, and `prose-audit`, each reported by the GitHub Actions App (`integration_id: 15368`), report success on the head commit
- **AND** any unresolved review-conversation thread SHALL also block merge, per `required_review_thread_resolution: true`

#### Scenario: Third-party app reporting a same-named check does not satisfy the gate

- **GIVEN** the required-status-checks rule pins each check entry to `integration_id: 15368`
- **WHEN** a non-GitHub-Actions GitHub App installed on the repository publishes a status check with the same `context` name (`test`, `build`, or `prose-audit`) and a `success` conclusion
- **THEN** the pull request SHALL NOT become mergeable on the strength of that third-party report
- **AND** mergeability SHALL require a `success` conclusion from the GitHub Actions App specifically

#### Scenario: New required check appears only after spec update

- **WHEN** a maintainer wishes to add another mandatory status check (for example, a future `site-smoke` job)
- **THEN** the maintainer SHALL first update this requirement to include the new check name (and the appropriate `integration_id`) as a required status check, ensuring spec and ruleset converge
- **AND** the maintainer SHALL update the ruleset on GitHub via the procedure documented in `CONTRIBUTE.md` so that the new check becomes enforceable

##### Example: required status checks contract

| Check ID       | Source workflow                          | `integration_id` | Required by ruleset | Notes                                                          |
| -------------- | ---------------------------------------- | ---------------- | ------------------- | -------------------------------------------------------------- |
| `test`         | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Vitest + Rust/WASM tests; pinned by other Requirement          |
| `build`        | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Challenge validate + VitePress build                           |
| `prose-audit`  | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Phase-1 deterministic prose audit on outward markdown          |
| `release`      | `.github/workflows/release.yml`          | `15368`          | No                  | Tag-driven only; not part of PR gate                           |
| Future checks  | (not yet defined)                        | (set when the check is added) | No     | Adding one requires updating this Requirement first            |
