## ADDED Requirements

### Requirement: CONTRIBUTE documents maintainer setup for branch protection ruleset

The `CONTRIBUTE.md` file SHALL contain a top-level "Maintainer Setup" section, placed after the contributor-facing sections, that documents how a repository maintainer provisions the GitHub repository ruleset described in the `ci-quality-gates` capability. The section SHALL include a "Branch protection ruleset" subsection with (a) a brief explanation of why the ruleset is required and which capability it implements, (b) a copy-paste-ready `gh api` command that creates the ruleset using GitHub's REST API for repository rulesets, (c) a verification command that lists or inspects the active ruleset to confirm the required status checks are `test` and `build`, and (d) guidance on how to opt into a stricter approval policy if the team scales beyond a solo maintainer.

The maintainer setup section SHALL be clearly marked as out-of-scope for ordinary contributors, with an explicit note that contributors can skip it. The section SHALL avoid using the deprecated legacy "Branch protection rules" UI as the primary instruction path; rulesets are the documented mechanism.

#### Scenario: Maintainer of use-template fork reproduces the ruleset

- **WHEN** a maintainer creates a new repository from this template and opens `CONTRIBUTE.md`
- **THEN** the maintainer SHALL find a "Maintainer Setup → Branch protection ruleset" section
- **AND** the section SHALL include a `gh api` command that the maintainer can copy, substitute their own `{owner}/{repo}`, and execute to create the ruleset in a single step
- **AND** the section SHALL include a verification command that prints the active ruleset, allowing the maintainer to confirm `test` and `build` are listed as required status checks

#### Scenario: Contributor skipping maintainer section

- **WHEN** a first-time contributor reads `CONTRIBUTE.md` from top to bottom
- **THEN** the contributor SHALL encounter contributor-facing sections (branch model, development workflow, PR submission, commit conventions, issue reporting) before any maintainer-only content
- **AND** the "Maintainer Setup" section SHALL begin with a one-line note indicating it is for repository maintainers and can be skipped by contributors

#### Scenario: Team scaling to multiple reviewers

- **WHEN** a maintainer wants to require pull-request approvals in addition to status checks
- **THEN** `CONTRIBUTE.md` SHALL provide a clearly labeled command snippet or note that shows how to add `required_approving_review_count` (for example, set to `1`) to the ruleset payload
- **AND** the snippet SHALL preserve the existing required status checks rather than replacing them
