## MODIFIED Requirements

### Requirement: CONTRIBUTE documents maintainer setup for branch protection ruleset

The `CONTRIBUTE.md` file SHALL contain a top-level "Maintainer Setup" section, placed after the contributor-facing sections, that documents how a repository maintainer provisions the GitHub repository ruleset described in the `ci-quality-gates` capability. The section SHALL include a "Branch protection ruleset" subsection with (a) a brief explanation of why the ruleset is required and which capability it implements, (b) a copy-paste-ready `gh api` command that creates the ruleset using GitHub's REST API for repository rulesets, (c) a verification command that inspects the active ruleset and prints the context of every required status check that ruleset enforces, together with a stated expected output of that command for a correctly provisioned repository, and (d) guidance on how to opt into a stricter approval policy if the team scales beyond a solo maintainer.

This requirement SHALL NOT fix the membership of the required status check set. That set is owned by the `ci-quality-gates` capability and materialized in the ruleset payload documented in `CONTRIBUTE.md`; this requirement constrains only that `CONTRIBUTE.md` remain internally consistent with it. Every status-check context named in the ruleset payload in `CONTRIBUTE.md` SHALL name a job defined in a workflow under `.github/workflows/`. Every passage in the "Maintainer Setup" section that describes the complete required status check set — a ruleset payload, the stated expected output of the verification command, or a prose sentence characterizing the status-check gate as a whole — SHALL name the same set of contexts. A sentence that names an individual context for a diagnostic or explanatory purpose, rather than to describe the complete gate, SHALL NOT be required to name that whole set. Prose in that section SHALL NOT present a proper subset of the status-check gate as though it were the entire gate.

The maintainer setup section SHALL be clearly marked as out-of-scope for ordinary contributors, with an explicit note that contributors can skip it. The section SHALL avoid using the deprecated legacy "Branch protection rules" UI as the primary instruction path; rulesets are the documented mechanism.

#### Scenario: Maintainer of use-template fork reproduces the ruleset

- **WHEN** a maintainer creates a new repository from this template and opens `CONTRIBUTE.md`
- **THEN** the maintainer SHALL find a "Maintainer Setup → Branch protection ruleset" section
- **AND** the section SHALL include a `gh api` command that the maintainer can copy, substitute their own `{owner}/{repo}`, and execute to create the ruleset in a single step
- **AND** the section SHALL include a verification command that prints the context of every required status check in the active ruleset, together with a stated expected output of that command, so that the maintainer can compare the two without consulting any list outside `CONTRIBUTE.md`

#### Scenario: Documented payload agrees with the documented expected output

- **WHEN** a reviewer reads the "Maintainer Setup → Branch protection ruleset" subsection of `CONTRIBUTE.md` without contacting GitHub
- **THEN** the set of status-check contexts named in the ruleset payload documented in that subsection SHALL equal the set of contexts named in the stated expected output of the documented verification command
- **AND** every context named in that payload SHALL name a job defined in a workflow under `.github/workflows/`

#### Scenario: Provisioned ruleset agrees with the documented expected output

- **GIVEN** a repository whose ruleset has been provisioned using the commands documented in "Maintainer Setup → Branch protection ruleset"
- **WHEN** a maintainer runs the documented verification command against that repository
- **THEN** the command SHALL print the context of every required status check the active ruleset enforces
- **AND** the printed set of contexts SHALL equal the set of contexts named in the stated expected output for that command

#### Scenario: No stale subset of the gate survives in Maintainer Setup prose

- **WHEN** a reviewer collects every passage in the "Maintainer Setup" section that describes the complete required status check set, including sentences that characterize the gate as a whole in prose rather than inside a JSON payload or a command-output block
- **THEN** every collected passage SHALL name the same set of contexts
- **AND** no collected passage SHALL omit a context that the stated expected output of the verification command names
- **AND** a sentence naming a single context to diagnose a specific defect SHALL NOT be collected as such a passage

#### Scenario: Contributor skipping maintainer section

- **WHEN** a first-time contributor reads `CONTRIBUTE.md` from top to bottom
- **THEN** the contributor SHALL encounter contributor-facing sections (branch model, development workflow, PR submission, commit conventions, issue reporting) before any maintainer-only content
- **AND** the "Maintainer Setup" section SHALL begin with a one-line note indicating it is for repository maintainers and can be skipped by contributors

#### Scenario: Team scaling to multiple reviewers

- **WHEN** a maintainer wants to require pull-request approvals in addition to status checks
- **THEN** `CONTRIBUTE.md` SHALL provide a clearly labeled command snippet or note that shows how to add `required_approving_review_count` (for example, set to `1`) to the ruleset payload
- **AND** the snippet SHALL preserve the existing required status checks rather than replacing them
