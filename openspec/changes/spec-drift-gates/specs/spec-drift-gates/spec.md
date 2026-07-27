## ADDED Requirements

### Requirement: Mechanical spec-drift gates run on every pull request

The repository SHALL provide a deterministic gate script at `scripts/spec-gates/run.py` that detects statements falsified by a change without being edited by it. The script SHALL be wired into `.github/workflows/quality-gates.yml` as a job that runs on `pull_request` events.

The script SHALL classify each gate's outcome as exactly one of `PASS`, `REVIEW`, or `FAIL`. It SHALL exit non-zero if and only if at least one gate reports `FAIL`. A `REVIEW` outcome SHALL appear in the output with every hit enumerated by file and line, and SHALL NOT affect the exit code.

The script SHALL NOT modify any file in the repository.

#### Scenario: A pull request with no drift passes the gate job

- **WHEN** a pull request changes code and every affected statement elsewhere has been updated
- **THEN** the gate job SHALL exit zero
- **AND** the CI check SHALL report success

#### Scenario: A surviving deleted literal fails the build

- **WHEN** a change removes a prose-shaped string literal and an occurrence of that literal survives elsewhere in the repository
- **THEN** the G3 gate SHALL report `FAIL`
- **AND** the script SHALL exit non-zero
- **AND** the output SHALL name the surviving occurrence with its file and line

#### Scenario: Review-level hits do not block

- **WHEN** the only non-passing outcomes are `REVIEW`
- **THEN** the script SHALL exit zero
- **AND** each hit SHALL be listed with file, line, and the matched text

### Requirement: Gates cover claim parity, scope parity, and delta completeness

The gate script SHALL implement seven checks.

`G1 claim-parity` SHALL, for each phrase declared by the change, enumerate every occurrence in the repository and report those that are neither hedged, nor inside a section carrying a stated premise, nor recorded as unaffected. G1 SHALL NOT report `FAIL`.

`G2 invariance` SHALL scan the change's proposal and design for claims that a named artifact is unchanged, and SHALL report `FAIL` when such a claim is unqualified and names a file present in the diff. A claim that names which specific aspect is unchanged SHALL be treated as qualified and reported as `REVIEW`.

`G3 deleted-literal` SHALL collect prose-shaped string literals removed by the diff and not reintroduced by it, and SHALL report `FAIL` when any of them still occurs in the repository. A literal SHALL be treated as prose-shaped only when it is between 12 and 80 characters, contains whitespace and at least three consecutive lowercase letters, and contains none of `<`, `>`, `{`, `}`, `(`, `)`, `;`, `=`.

`G4 scope parity` SHALL compare the proposal's enumerated file list and delta-spec list against the actual diff and the change's `specs/` directory, and SHALL report `FAIL` on any mismatch in either direction.

`G5 delta scenario parity` SHALL compare each MODIFIED requirement's scenario set in the delta against the baseline, and SHALL report `FAIL` when a baseline scenario is absent from the delta and its title does not appear in the change's tasks file. When the title does appear, the outcome SHALL be `REVIEW`.

`G6 added-lines trace` SHALL list mechanism assertions among the prose lines the change adds. G6 SHALL NOT report `FAIL`.

`G7 archive trace-parity` SHALL compare per-capability requirement and `@trace` block counts against a snapshot taken before archiving, and SHALL report `FAIL` when either count decreases.

#### Scenario: An identifier moved by a refactor is not treated as a deleted message

- **WHEN** a diff removes a quoted token that is an identifier or a template fragment rather than a human-readable message
- **THEN** G3 SHALL NOT report it
- **AND** G3's outcome SHALL be unaffected by that token

#### Scenario: A deliberately removed baseline scenario is recorded rather than failed

- **WHEN** a delta omits a baseline scenario and that scenario's title appears in the change's tasks file
- **THEN** G5 SHALL report `REVIEW` rather than `FAIL`

#### Scenario: Scope enumerations that drifted from the diff fail

- **WHEN** the change's proposal lists three delta specs and the change directory contains four
- **THEN** G4 SHALL report `FAIL`
- **AND** the output SHALL name the spec that is present on disk but unlisted

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
