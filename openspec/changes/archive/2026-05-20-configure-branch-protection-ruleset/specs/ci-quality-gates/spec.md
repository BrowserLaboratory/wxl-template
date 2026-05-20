## ADDED Requirements

### Requirement: Branch protection ruleset guards main with required status checks

The `main` branch SHALL be guarded by a GitHub repository ruleset that (a) requires every change to land via a pull request rather than a direct push, and (b) lists `test` and `build` as required status checks that MUST report a success conclusion before a pull request becomes mergeable. The ruleset SHALL apply to the `refs/heads/main` ref. The `test` and `build` contexts refer to the job IDs defined in `.github/workflows/quality-gates.yml`, which are pinned by other requirements in this capability and SHALL NOT be renamed without also updating the ruleset.

The ruleset SHALL permit bypass for the `OrganizationAdmin` and `RepositoryAdmin` actor types so that maintainers can resolve incident-grade failures without being locked out of `main`. Bypass invocation SHALL be discoverable in the GitHub audit log, providing an after-the-fact accountability trail.

The ruleset itself is GitHub server-side state and SHALL NOT be expected to live in this repository; the maintainer SHALL create and maintain it out-of-band using the procedure documented under `CONTRIBUTE.md` "Maintainer Setup". This requirement constrains the shape the ruleset takes; the act of provisioning the ruleset on a given GitHub repository is a maintainer responsibility, not an automated step in any workflow.

#### Scenario: Direct push to main is rejected once ruleset is provisioned

- **WHEN** a maintainer with a personal access token attempts `git push origin main` after the ruleset is provisioned
- **THEN** the push SHALL be rejected by GitHub with a message indicating the branch is protected by a ruleset
- **AND** the push SHALL succeed only if the maintainer is in the bypass actor list and explicitly opts to bypass (which SHALL be recorded in the audit log)

#### Scenario: Pull request to main cannot merge while a required check is failing

- **WHEN** a contributor opens a pull request targeting `main` whose `quality-gates` workflow run has either `test` or `build` reporting a failure conclusion
- **THEN** the GitHub merge button SHALL be disabled with a message indicating one or more required status checks have not passed
- **AND** the pull request SHALL only become mergeable once both `test` and `build` report success on the head commit

#### Scenario: New required check appears only after spec update

- **WHEN** a maintainer wishes to add another mandatory status check (for example, a future `site-smoke` job)
- **THEN** the maintainer SHALL first update this requirement to include the new check name as a required status check, ensuring spec and ruleset converge
- **AND** the maintainer SHALL update the ruleset on GitHub via the procedure documented in `CONTRIBUTE.md` so that the new check becomes enforceable

##### Example: required status checks contract

| Check ID       | Source workflow                          | Required by ruleset | Notes                                                 |
| -------------- | ---------------------------------------- | ------------------- | ----------------------------------------------------- |
| `test`         | `.github/workflows/quality-gates.yml`    | Yes                 | Vitest + Rust/WASM tests; pinned by other Requirement |
| `build`        | `.github/workflows/quality-gates.yml`    | Yes                 | Challenge validate + VitePress build                  |
| `release`      | `.github/workflows/release.yml`          | No                  | Tag-driven only; not part of PR gate                  |
| Future checks  | (not yet defined)                        | No                  | Adding one requires updating this Requirement first   |
