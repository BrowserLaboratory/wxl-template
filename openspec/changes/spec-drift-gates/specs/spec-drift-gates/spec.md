## ADDED Requirements

### Requirement: Mechanical spec-drift gates run on every pull request

The repository SHALL provide a deterministic gate script at `scripts/spec-gates/run.py` that detects statements falsified by a change without being edited by it. The script SHALL be wired into `.github/workflows/quality-gates.yml` as a job that runs on `pull_request` events.

The script SHALL classify each gate's outcome as exactly one of `PASS`, `REVIEW`, or `FAIL`. When the gates are evaluated it SHALL exit `1` if and only if at least one gate reports `FAIL`, and `0` otherwise. A `REVIEW` outcome SHALL appear in the output with every hit enumerated by file and line, and SHALL NOT affect the exit code.

Exit code `2` SHALL mean the gates could not be evaluated at all — an unknown change id, an unusable `git`, or contradictory options — and SHALL be reported as a message rather than a traceback. A subprocess that fails SHALL NOT be reported as one that produced no output: `git grep` exiting `1` for "no match" is a result, and any other non-zero exit is an error that SHALL propagate. Treating the two alike would let `G3` report `PASS` because its search failed.

The script SHALL NOT create or modify any file in the working tree. The snapshot that `G7` compares against SHALL be written outside the working tree, so that taking one cannot alter the result of a subsequent gate run.

Snapshot and verify are separate modes. Supplying both SHALL be rejected with exit code 2 rather than resolved silently in favour of either.

#### Scenario: A pull request with no drift passes the gate job

- **WHEN** a pull request changes code and every affected statement elsewhere has been updated
- **THEN** the gate job SHALL exit zero
- **AND** the CI check SHALL report success

#### Scenario: A surviving deleted literal fails the build

- **WHEN** a change removes a prose-shaped string literal and an occurrence of that literal survives elsewhere in the repository
- **THEN** the G3 gate SHALL report `FAIL`
- **AND** the script SHALL exit non-zero
- **AND** the output SHALL name the surviving occurrence with its file and line

#### Scenario: A failed search is not mistaken for a clean result

- **WHEN** a gate's underlying `git` invocation exits with a code that is neither success nor a documented "no match"
- **THEN** the script SHALL exit 2 with a message naming the command and its output
- **AND** no gate SHALL report `PASS` on the strength of the empty output that failure produced

#### Scenario: Taking a snapshot leaves the working tree untouched

- **WHEN** the snapshot mode runs for a change
- **THEN** `git status --porcelain -uall` SHALL report exactly what it reported before
- **AND** a subsequent gate run SHALL produce the same verdicts as if no snapshot had been taken

#### Scenario: The two archive modes cannot be combined

- **WHEN** both a snapshot mode and a verify mode are requested in one invocation
- **THEN** the script SHALL exit 2
- **AND** the message SHALL name the option that supplies a snapshot to the verify mode

#### Scenario: Review-level hits do not block

- **WHEN** the only non-passing outcomes are `REVIEW`
- **THEN** the script SHALL exit zero
- **AND** each hit SHALL be listed with file, line, and the matched text

### Requirement: Gates cover claim parity, scope parity, and delta completeness

The gate script SHALL implement seven checks.

`G1 claim-parity` SHALL, for each phrase declared by the change, enumerate every occurrence in the repository and report those that are neither hedged, nor inside a section carrying a stated premise, nor recorded as unaffected. G1 SHALL NOT report `FAIL`.

`G2 invariance` SHALL scan the change's proposal and design for claims that a named artifact is unchanged, and SHALL report `FAIL` when such a claim is unqualified and names a file present in the diff. A file reference SHALL resolve to a changed file only when it equals that path or is a suffix of it at a path boundary; a shared filename SHALL NOT make a claim about one file answer for another. A claim SHALL be treated as qualified, and reported as `REVIEW`, when a bold span follows the file reference on the same line. The gate SHALL NOT attempt to verify that the marked aspect is in fact unchanged: `REVIEW` routes the claim to a human, and that is the whole of its guarantee.

`G3 deleted-literal` SHALL collect prose-shaped string literals removed by the diff and not reintroduced by it, and SHALL report `FAIL` when any of them still occurs in the repository. A literal SHALL be treated as prose-shaped when it is at most 80 characters, contains none of `<`, `>`, `{`, `}`, `;`, `=`, and satisfies either script's rule. The Latin rule: at least 12 characters, containing whitespace and at least three consecutive lowercase letters. The CJK rule: at least six CJK characters, and not a delimiter-separated run of three or more tokens of at most four characters each. Both rules SHALL be in force, because a message written in Chinese fails every clause of the Latin rule on principle rather than by accident, and this repository writes its user-facing strings in Chinese. Parentheses SHALL NOT disqualify a literal: user-facing messages routinely contain them.

`G4 scope parity` SHALL compare the proposal's enumerated file list and delta-spec list against the actual diff and the change's `specs/` directory, and SHALL report `FAIL` on any mismatch in either direction. Delta-spec identifiers SHALL be recognised in every spelling the repository's proposals use, resolved against the set of capability names that exist rather than by pattern alone, and a clause declaring a capability *unaffected* SHALL exclude it rather than name it. When a proposal carries no `Affected specs` entry at all, G4 SHALL report `REVIEW` for the delta-spec comparison and enumerate the undeclared capabilities: an absent declaration asserts nothing and cannot have drifted. The file-list comparison SHALL remain in force regardless.

`G5 delta scenario parity` SHALL compare each MODIFIED requirement's scenario set in the delta against the baseline, and SHALL report `FAIL` when a baseline scenario is absent from the delta and its title does not appear in the change's tasks file. When the title does appear, the outcome SHALL be `REVIEW`. Requirements declared under `## ADDED`, `## REMOVED` or `## RENAMED` SHALL be excluded from the comparison: an added requirement has no baseline counterpart, and a removed one declares its departure rather than losing scenarios by accident.

`G6 added-lines trace` SHALL list mechanism assertions among the prose lines the change adds, each with the file and line the diff places it at. Its scope SHALL be every markdown file the change touches outside the archive, including the change's own proposal, design, tasks and delta specs — those carry the change's normative sentences and are the densest source of assertions a reader must trace. G6 SHALL NOT report `FAIL`.

`G7 archive trace-parity` SHALL compare per-capability requirement and `@trace` block counts against a snapshot taken before archiving, and SHALL report `FAIL` when either count decreases.

#### Scenario: An identifier moved by a refactor is not treated as a deleted message

- **WHEN** a diff removes a quoted token that is an identifier or a template fragment rather than a human-readable message
- **THEN** G3 SHALL NOT report it
- **AND** G3's outcome SHALL be unaffected by that token

#### Scenario: A deliberately removed baseline scenario is recorded rather than failed

- **WHEN** a delta omits a baseline scenario and that scenario's title appears in the change's tasks file
- **THEN** G5 SHALL report `REVIEW` rather than `FAIL`

#### Scenario: A properly declared removal is not read as a scenario loss

- **WHEN** a delta declares a requirement under `## REMOVED Requirements` and the baseline carries scenarios for it
- **THEN** G5 SHALL NOT report those scenarios as dropped
- **AND** the requirement SHALL NOT contribute to G5's outcome

#### Scenario: Scope enumerations that drifted from the diff fail

- **WHEN** the change's proposal lists three delta specs and the change directory contains four
- **THEN** G4 SHALL report `FAIL`
- **AND** the output SHALL name the spec that is present on disk but unlisted

#### Scenario: A proposal that declares no affected specs is reviewed, not failed

- **WHEN** the change's proposal carries no `Affected specs` entry and the change directory contains delta specs
- **THEN** G4 SHALL report `REVIEW` for the delta-spec comparison
- **AND** the output SHALL enumerate the undeclared capabilities
- **AND** the exit code SHALL be unaffected

#### Scenario: A capability declared unaffected is not counted as declared in scope

- **WHEN** the proposal's `Affected specs` entry names a capability in a clause stating it is unchanged
- **THEN** G4 SHALL treat that capability as absent from the declaration
- **AND** a delta spec present on disk for it SHALL be reported as unlisted

#### Scenario: No declared phrases is visible rather than silent

- **WHEN** the change declares no claim phrases
- **THEN** G1 SHALL report `PASS`
- **AND** the output SHALL state that no phrases were declared

### Requirement: Archive metadata loss is detected

Archiving a change replaces each MODIFIED requirement block in the baseline spec wholesale, which discards any `@trace` metadata attached to that requirement when the delta does not carry it. The gate script SHALL provide a two-stage check for this.

The script SHALL support a snapshot mode that records, per capability spec affected by the change, the number of requirements and the number of `@trace` blocks. It SHALL support a verify mode that compares the current counts against such a snapshot.

The contributor guide SHALL document both stages as steps of the archive procedure.

#### Scenario: Trace blocks dropped by archiving are caught

- **WHEN** a snapshot records two `@trace` blocks for a capability and the same capability holds zero after archiving
- **THEN** G7 SHALL report `FAIL`
- **AND** the output SHALL name the capability and both counts

#### Scenario: An archive that preserves metadata verifies clean

- **WHEN** requirement and `@trace` counts are unchanged from the snapshot for every affected capability
- **THEN** G7 SHALL report `PASS`
