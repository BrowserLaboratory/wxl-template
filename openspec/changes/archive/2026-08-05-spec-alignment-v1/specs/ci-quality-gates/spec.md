## MODIFIED Requirements

### Requirement: The workflow SHALL define two parallel jobs named `test` and `build`

The `quality-gates.yml` workflow SHALL define, among its top-level jobs, one whose ID is `test` and one whose ID is `build`. The two jobs SHALL run in parallel — neither job SHALL declare a `needs:` dependency on the other. This requirement SHALL NOT be read as an upper bound on the number of top-level jobs in `quality-gates.yml`; conformance SHALL be judged only on the presence, parallelism, and IDs of `test` and `build`.

The `test` and `build` job IDs SHALL remain stable across workflow revisions, because the branch-protection requirement in this capability lists `test` and `build` among the required status checks and identifies those checks by these job IDs.

#### Scenario: Both jobs run in parallel

- **WHEN** the workflow is triggered by any qualifying event
- **THEN** the GitHub Actions UI SHALL show `test` and `build` jobs scheduled and running concurrently (subject to runner availability)
- **AND** neither job SHALL block the other from starting

#### Scenario: One job failing does not abort the other

- **WHEN** the `test` job exits with a non-zero status while the `build` job is still running
- **THEN** the `build` job SHALL run to completion (success or its own failure)
- **AND** the workflow's overall conclusion SHALL be `failure` because at least one job failed

#### Scenario: Additional top-level jobs are not a violation of this requirement

- **WHEN** an auditor enumerates the keys under `jobs:` in `.github/workflows/quality-gates.yml` and finds job IDs other than `test` and `build`
- **THEN** those additional job IDs SHALL NOT be reported as a violation of this requirement
- **AND** the audit SHALL confirm only that `test` and `build` are both present as top-level jobs and that neither declares a `needs:` dependency on the other
