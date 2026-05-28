## ADDED Requirements

### Requirement: The pipeline SHALL run an advisory site-smoke browser gate

The `quality-gates.yml` workflow SHALL define a top-level job whose ID is `site-smoke`. This job SHALL run in parallel with the `test`, `build`, and `prose-audit` jobs — it SHALL NOT declare a `needs:` dependency on any of them. The job ID SHALL remain stable across workflow revisions so that a future change can bind a required-status-check rule to it.

The `site-smoke` job SHALL execute the following sequence:

1. Check out the repository using the same pinned `actions/checkout` action and version used elsewhere in the workflow.
2. Set up pnpm and Node.js 24 LTS using the same pinned `pnpm/action-setup` and `actions/setup-node` actions and the same Node version as the `test` and `build` jobs.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Build the production site by running `pnpm wasm:build`, `pnpm challenge:keygen`, and `pnpm docs:build` (challenge pages require the WASM modules and generated keys to render).
5. Install the Playwright Chromium browser — and only Chromium — together with its OS dependencies.
6. Run `pnpm test:smoke`, which executes the site-smoke suite (defined by the `site-smoke-tests` capability) against the previewed production site.

The `site-smoke` job SHALL declare permissions equivalent to or narrower than `contents: read`.

This requirement SHALL NOT add `site-smoke` to the branch-protection ruleset's required-status-checks list and SHALL NOT modify the existing required checks (`test`, `build`, `prose-audit`). The `site-smoke` job is advisory at this stage: a failing `site-smoke` job SHALL NOT block a pull request from merging. Promotion of `site-smoke` to a required status check is deferred to a separate future change once its stability has been demonstrated.

#### Scenario: site-smoke runs as a parallel advisory job

- **WHEN** the workflow is triggered by a pull request to `main`/`staging` or a push to `main`
- **THEN** GitHub Actions SHALL queue a `site-smoke` job alongside the `test`, `build`, and `prose-audit` jobs without a `needs:` dependency
- **AND** the job's conclusion SHALL appear as a check named `Quality Gates / site-smoke`

#### Scenario: site-smoke failure does not block merge

- **WHEN** the `site-smoke` job concludes with `failure`
- **THEN** the pull request SHALL remain mergeable because `site-smoke` is not in the required-status-checks list
- **AND** the existing required checks (`test`, `build`, `prose-audit`) SHALL continue to gate merge unchanged

#### Scenario: site-smoke passes on a healthy site

- **WHEN** the previewed site renders the homepage and the `door-is-open` challenge page correctly
- **THEN** `pnpm test:smoke` SHALL exit 0
- **AND** the `site-smoke` job conclusion SHALL be `success`
