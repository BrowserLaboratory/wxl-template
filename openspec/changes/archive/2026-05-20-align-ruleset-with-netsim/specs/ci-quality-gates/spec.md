## MODIFIED Requirements

### Requirement: Branch protection ruleset guards main with required status checks

The default branch SHALL be guarded by a GitHub repository ruleset whose `conditions.ref_name.include` is `["~DEFAULT_BRANCH"]` so that the ruleset follows the repository's default branch even if its name changes (for example, `main` renamed to `trunk`, or a derived repository using `master`). The ruleset SHALL be `enforcement: "active"` and `target: "branch"`.

The ruleset SHALL include the following `rules`, in addition to any rules introduced by other capabilities:

- A `pull_request` rule that requires every change to land via a pull request rather than a direct push. The rule's `parameters` SHALL set `dismiss_stale_reviews_on_push` to `true` (a new commit on the pull request invalidates prior approving reviews) and `required_review_thread_resolution` to `true` (every review-conversation thread MUST be resolved before merge). `required_approving_review_count` is NOT required to be non-zero by this requirement; teams that want a stricter approval policy SHALL follow the upgrade snippet documented in `CONTRIBUTE.md`.
- A `required_status_checks` rule listing both `test` and `build` as required status checks, each pinned to `integration_id: 15368` (the GitHub Actions App). Pinning `integration_id` prevents a third-party GitHub App from reporting a same-named check and bypassing the gate. Both checks MUST report a success conclusion before a pull request becomes mergeable. The `test` and `build` contexts refer to the job IDs defined in `.github/workflows/quality-gates.yml`, which are pinned by other requirements in this capability and SHALL NOT be renamed without also updating the ruleset.
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

- **WHEN** a contributor opens a pull request targeting the default branch whose `quality-gates` workflow run has either `test` or `build` reporting a failure conclusion
- **THEN** the GitHub merge button SHALL be disabled with a message indicating one or more required status checks have not passed
- **AND** the pull request SHALL only become mergeable once both `test` and `build`, each reported by the GitHub Actions App (`integration_id: 15368`), report success on the head commit
- **AND** any unresolved review-conversation thread SHALL also block merge, per `required_review_thread_resolution: true`

#### Scenario: Third-party app reporting a same-named check does not satisfy the gate

- **GIVEN** the required-status-checks rule pins each check entry to `integration_id: 15368`
- **WHEN** a non-GitHub-Actions GitHub App installed on the repository publishes a status check with the same `context` name (`test` or `build`) and a `success` conclusion
- **THEN** the pull request SHALL NOT become mergeable on the strength of that third-party report
- **AND** mergeability SHALL require a `success` conclusion from the GitHub Actions App specifically

#### Scenario: New required check appears only after spec update

- **WHEN** a maintainer wishes to add another mandatory status check (for example, a future `site-smoke` job)
- **THEN** the maintainer SHALL first update this requirement to include the new check name (and the appropriate `integration_id`) as a required status check, ensuring spec and ruleset converge
- **AND** the maintainer SHALL update the ruleset on GitHub via the procedure documented in `CONTRIBUTE.md` so that the new check becomes enforceable

##### Example: required status checks contract

| Check ID       | Source workflow                          | `integration_id` | Required by ruleset | Notes                                                 |
| -------------- | ---------------------------------------- | ---------------- | ------------------- | ----------------------------------------------------- |
| `test`         | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Vitest + Rust/WASM tests; pinned by other Requirement |
| `build`        | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Challenge validate + VitePress build                  |
| `release`      | `.github/workflows/release.yml`          | `15368`          | No                  | Tag-driven only; not part of PR gate                  |
| Future checks  | (not yet defined)                        | (set when the check is added) | No     | Adding one requires updating this Requirement first   |
