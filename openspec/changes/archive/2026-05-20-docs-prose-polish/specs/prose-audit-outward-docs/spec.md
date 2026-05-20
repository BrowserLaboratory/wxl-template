## ADDED Requirements

### Requirement: Medium findings SHALL be remediated in dedicated polish changes

When a `humane-prose-audit` run on the outward-facing surface reports any `Medium` severity finding, the finding SHALL be carried forward as a candidate for a follow-up polish change. The polish change SHALL target only the affected files and SHALL re-run `humane-prose-audit` on those files after the prose edits to confirm that the Medium count for the original finding rule has been reduced to zero AND that the file's overall verdict remains `PASS`.

The polish change SHALL NOT modify wxlsh command names, syntax blocks, example blocks, or any other Markdown content that carries a technical contract with end users; remediation SHALL be restricted to descriptive prose. The polish change SHALL NOT introduce regressions in any other finding rule on the same file (no rule SHALL increase in count compared to the pre-polish audit report).

Locale-mirror files (e.g., files under `docs/zh-TW/`) SHALL NOT be modified as part of a polish change targeting an English-source finding when the locale-mirror file itself reports zero findings for that rule; locale-specific findings SHALL be remediated only when the locale-mirror audit reports the same rule.

#### Scenario: Polish change closes a pronoun-voice Medium finding

- **WHEN** a prior audit reports a `<pronoun-voice>` finding with severity `Medium` on a file in the outward-facing surface
- **AND** a maintainer opens a polish change targeting that file
- **THEN** the polish change SHALL edit only the prose passages that the finding's `sequence` field flagged as voice-inconsistent
- **AND** re-running `humane-prose-audit` on that file SHALL report zero `<pronoun-voice>` findings of severity `Medium` or higher
- **AND** the file's `verdict` SHALL remain `PASS`

##### Example: pronoun-voice remediation on a guide page

- **GIVEN** an audit report where `docs/guide/index.md` has `sequence=['second', 'second', 'second', 'second', 'first_singular', 'second', 'first_singular', 'second', 'first_singular']` flagged as Medium `<pronoun-voice>`
- **WHEN** the polish change rewrites the three `first_singular` Q-line sentences into voice-neutral question forms
- **THEN** the post-polish audit report for `docs/guide/index.md` SHALL show zero `<pronoun-voice>` Medium findings
- **AND** the file's `verdict` SHALL be `PASS`
- **AND** the file's `humane_score` SHALL be greater than or equal to the pre-polish score

#### Scenario: Polish change closes a lexical-diversity Medium finding

- **WHEN** a prior audit reports a `<lexical-diversity>` finding with severity `Medium` (MTLD below the configured threshold) on a file in the outward-facing surface
- **AND** a maintainer opens a polish change targeting that file
- **THEN** the polish change SHALL introduce synonym variants only within descriptive prose passages, leaving wxlsh command names, syntax blocks, example blocks, and code fences byte-identical to their pre-polish form
- **AND** re-running `humane-prose-audit` on that file SHALL report zero `<lexical-diversity>` findings of severity `Medium` or higher
- **AND** the file's `verdict` SHALL remain `PASS`

#### Scenario: Polish change is bounded to source-locale findings

- **WHEN** a Medium finding is reported on an English-source file in the outward-facing surface
- **AND** the corresponding locale-mirror file (e.g., the `docs/zh-TW/` counterpart) reports zero findings for the same rule
- **THEN** the polish change SHALL NOT modify the locale-mirror file
- **AND** the polish change's `tasks.md` SHALL declare the locale-mirror file as out-of-scope

#### Scenario: Polish change does not regress other findings

- **WHEN** a polish change re-runs `humane-prose-audit` on the affected files after prose edits
- **THEN** for every finding rule, the post-polish count SHALL NOT exceed the pre-polish count
- **AND** if any rule's count increases, the polish change SHALL NOT be merged until the prose edit is revised to remove the regression
