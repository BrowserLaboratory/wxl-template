# spec-drift-gates Specification

## Purpose

TBD - created by archiving change 'spec-drift-gates'. Update Purpose after archive.

## Requirements

### Requirement: Mechanical spec-drift gates run on every pull request

The repository SHALL provide a deterministic gate script at `scripts/spec-gates/run.py` that detects statements falsified by a change without being edited by it. The script SHALL be wired into `.github/workflows/quality-gates.yml` as a job that runs on `pull_request` events.

The CI job SHALL derive the set of change ids from the pull request's own diff — the directories touched under `openspec/changes/`, excluding `archive` — and SHALL run the id-scoped gates once per id. The job SHALL NOT resolve a change id from directories that merely exist in the checked-out tree, because that subjects unrelated pull requests to another change's gates.

Each derived id SHALL be checked against the whitelist `^[a-z0-9-]+$` before it is used for anything, and an id that does not match SHALL fail the job with exit code `2`, in a message naming the rejected id. The id set is derived from file paths that a fork's pull request controls, so an unrecognised name SHALL abort the job rather than be executed or quietly skipped. The whitelist is consequently also a naming contract on change directories: a live directory under `openspec/changes/` SHALL be named using lowercase letters, digits, and hyphens only, and one named otherwise will not be gated but will stop the job.

When the job evaluates the id-scoped gates over more than one id, it SHALL exit with the most severe code any id produced, where `2` outranks `1`, which outranks `0`. Flattening `2` into `1` would present "the gates could not be evaluated" as "a gate reported `FAIL`" to whoever triages the red job, which are different problems with different remedies.

`G1 claim-parity` and `G2 invariance` are per-change judgements and SHALL run only for the ids the pull request touches; when the diff touches no live change directory, the id-scoped step SHALL be skipped. `G7 archive trace-parity` SHALL NOT be scoped to that id set: the job SHALL evaluate it on every pull request, through a step that carries no condition and needs no change id. Scoping G7 to the id set leaves open the two cases it exists to close. First, a pull request that never touches `openspec/changes/` resolves no id and so skips the id-scoped step, yet such a pull request can delete `@trace` blocks from `openspec/specs/**/spec.md` directly. Second, an archive pull request moves `openspec/changes/<id>/` under `openspec/changes/archive/`; git records the move as a rename whose `--name-only` output names only the archive-side path, the archive prefix is excluded from id resolution, and the id set comes out empty — so G7 would never run on the archival operation it was written to guard. Every archival recorded in this repository's history is a rename, and none is a pure deletion.

The script SHALL provide a trace-parity-only invocation — the `--trace-parity-only` flag — that evaluates `G7 archive trace-parity` alone against the base ref and accepts no change id. Supplying a change id together with that flag SHALL exit `2` with a message, because the two forms disagree about what is to be evaluated.

The script SHALL classify each gate's outcome as exactly one of `PASS`, `REVIEW`, or `FAIL`. When the gates are evaluated it SHALL exit `1` if and only if at least one gate reports `FAIL`, and `0` otherwise.

A `REVIEW` or `FAIL` outcome SHALL enumerate every hit in the output, one hit per line, and SHALL NOT truncate the list. Each hit SHALL carry identifying information sufficient to locate what the hit is about. That identification follows from what the gate examines and SHALL NOT be assumed uniform across the three gates: G1 searches repository text, so its hits SHALL carry the file path, the line number, and the matched text; G2 reads the change's own proposal and design, so its hits SHALL carry the artifact the claim is written in, the line number within that artifact, the matched text, and — separately — the changed file the claim names, because those last two are different files and each artifact is numbered from its own first line; G7 aligns capability specs requirement by requirement and has no line number to report, so its hits SHALL instead carry the capability and the requirement title, together with the `@trace` sources at issue.

Exit code `2` SHALL mean the gates could not be evaluated at all. The causes SHALL be: an invocation that names no change id and selects no mode that runs without one, which SHALL print the usage help; an unknown change id; a change id that is not a bare single directory name — it is empty, contains a path separator, or is a bare `.` or `..`; an unusable `git`; a declaration file that is not parseable YAML; a declaration key whose value has the wrong type; and a trace-parity-only invocation given a change id. Every one of them SHALL be reported as a message or as the usage help, and never as a traceback. The change id SHALL be rejected before anything reads the filesystem or invokes `git` on it, because it is joined onto `openspec/changes/` and a traversing id would reach files outside that directory. A subprocess that fails SHALL NOT be reported as one that produced no output: `git grep` exiting `1` for "no match" is a result, and any other non-zero exit is an error that SHALL propagate.

The script SHALL NOT create or modify any file in the working tree.

#### Scenario: A pull request with no drift passes the gate job

- **WHEN** a pull request changes code and every affected statement elsewhere has been updated
- **THEN** the gate job SHALL exit zero
- **AND** the CI check SHALL report success

#### Scenario: A pull request touching no change directory still runs G7

- **WHEN** a pull request's diff contains no path under `openspec/changes/` outside `archive`
- **THEN** the id-scoped step that runs G1 and G2 SHALL be skipped
- **AND** the pull request SHALL NOT be evaluated against any other change's declarations
- **AND** `G7 archive trace-parity` SHALL still be evaluated across every capability spec under `openspec/specs/`

#### Scenario: An archive pull request is still covered by G7

- **WHEN** a pull request archives a change by moving `openspec/changes/<id>/` under `openspec/changes/archive/`, and git records the move as a rename so that no live change id is resolved from the diff
- **THEN** the job SHALL still evaluate `G7 archive trace-parity` against the base ref
- **AND** a requirement from which the archival dropped an `@trace` `source:` SHALL be reported as `FAIL`

#### Scenario: The trace-parity-only invocation refuses a change id

- **WHEN** the trace-parity-only invocation is given a change id as well
- **THEN** the script SHALL exit `2` with a message
- **AND** no gate SHALL be evaluated

#### Scenario: A change id that is not a bare directory name is refused

- **WHEN** the script is asked to gate a change id containing a `/` or a `..` segment
- **THEN** the script SHALL exit `2` with a message naming the offending id
- **AND** no gate SHALL be evaluated
- **AND** no file outside `openspec/changes/` SHALL be read on that id's behalf

#### Scenario: A change id outside the whitelist stops the CI job

- **WHEN** an id derived from the pull request's diff contains any character outside `a-z`, `0-9`, and `-`
- **THEN** the job SHALL fail with exit code `2` without running the gates for that id
- **AND** the message SHALL name the rejected id

#### Scenario: The most severe outcome across several ids is the job's outcome

- **WHEN** a pull request touches two live change directories, and the gates exit `1` for one id and `2` for the other, in either order
- **THEN** the job SHALL exit `2`
- **AND** a run in which one id exits `1` and the rest exit `0` SHALL make the job exit `1`

#### Scenario: A failed search is not mistaken for a clean result

- **WHEN** a gate's underlying `git` invocation exits with a code that is neither success nor a documented "no match"
- **THEN** the script SHALL exit 2 with a message naming the command and its output
- **AND** no gate SHALL report `PASS` on the strength of the empty output that failure produced

#### Scenario: Review-level hits do not block

- **WHEN** the only non-passing outcomes are `REVIEW`
- **THEN** the script SHALL exit zero
- **AND** each hit SHALL be listed with file, line, and the matched text

---
### Requirement: Gates cover claim parity, invariance claims, and archive trace parity

The gate script SHALL implement exactly three checks. `FAIL` SHALL originate only from exact judgements — an absent or keyless declaration file, or an `@trace` `source:` that the base ref carries and the compared side does not — never from a heuristic classification.

`G1 claim-parity` SHALL require the per-change declaration file `openspec/changes/<id>/gates.yaml` to exist and to carry a `claim_phrases` key. G1 SHALL report `FAIL` in both of these cases: the file is absent, and the file is present but its parsed content supplies no `claim_phrases` value — whether the key is missing outright or written with no value after it. Neither can be told apart from a declaration the author never thought about — an empty or keyless file declares nothing, and reporting it as a deliberate "no phrases apply" would put words in the author's mouth. The `FAIL` detail SHALL distinguish the two causes, naming the expected path when the file is absent and naming the missing key when the file exists, because the remedy differs. When the file is present with an empty `claim_phrases` list, G1 SHALL report `PASS` and the output SHALL state that the change deliberately declares no phrases. For each declared phrase, G1 SHALL enumerate every occurrence in the repository and report those that are neither hedged nor recorded as unaffected as `REVIEW` hits; declared-phrase coverage SHALL NOT produce `FAIL`.

A declaration file that is not parseable YAML, and a `claim_phrases` or `hedge_markers` key whose value is present but is not a list, SHALL abort the run with exit `2` and a message naming the file and the offending key. Neither SHALL be reported as a gate `FAIL`, and neither value SHALL be silently coerced: a scalar is not a working configuration but silent sabotage — a string hedge marker is iterated character by character, so almost every line counts as hedged and G1's uncovered list is permanently empty, and a string claim phrase greps the repository once per character.

The fallback for `hedge_markers` SHALL be decided by the presence of the key, not by the truth of its value. When the per-change file carries the key, its value SHALL be used as given, so `hedge_markers: []` SHALL mean that no wording counts as hedged — a deliberate tightening, not an invitation to substitute defaults. Only an absent key SHALL fall back to the global `scripts/spec-gates/config.yaml`, and then to the script's built-in defaults. `claim_phrases` SHALL have no such fallback: it SHALL come from the per-change file alone.

`G2 invariance` SHALL scan the change's proposal and design for claims that a named artifact is unchanged, and SHALL report `REVIEW` when such a claim names a file present in the diff, listing every such claim with file, line, and matched text. A file reference SHALL resolve to a changed file only when it equals that path or is a suffix of it at a path boundary; a shared filename SHALL NOT make a claim about one file answer for another. G2 SHALL NOT report `FAIL`: distinguishing a qualified claim from a bare one is a heuristic judgement, and the gate's guarantee is routing the claim to a human, not adjudicating it.

`G7 archive trace-parity` SHALL run as part of the default gate evaluation. It SHALL compare the base ref against the **working tree**, not against `HEAD`: the base side SHALL be read from the capability specs as committed at the base ref, and the other side SHALL be read from `openspec/specs/*/spec.md` as they stand on disk, uncommitted edits included. The working tree is the specified side because the gate judges what the pull request will merge, and the consequence is asymmetric between the two places the gate runs. Locally it catches an `@trace` deletion before the deletion is ever committed, which is the earlier signal a contributor wants. In CI the two readings coincide — the job evaluates a fresh checkout whose working tree equals `HEAD` — so the wider reach changes no CI verdict.

For every capability spec under `openspec/specs/` present on both sides, G7 SHALL align requirements by title, and SHALL identify a requirement's trace metadata as the **set of `source:` values** carried by the `@trace` blocks beneath it, not as the number of those blocks. A block carrying no `source:` SHALL still contribute an identity, under a synthetic name numbering the source-less blocks within that requirement, so that an unlabelled trace is not free to delete. Two blocks naming the same source SHALL collapse to one identity; the consequence — deleting one of a duplicated pair is not reported — is accepted as the same equivalence that lets a legitimate consolidation pass.

A requirement present on both sides SHALL be reported as `REVIEW` when the set of `source:` values it carries at the base ref is not a subset of the set it carries in the working tree. The report SHALL name the capability, the requirement, every `source:` that went missing, and the sizes of the two sets. Identifying traces by source rather than by count is what makes the report actionable and what stops a swap — one source dropped while an unrelated one is added — from passing as an unchanged total.

G7 SHALL NOT report `FAIL` under any input. A blocking verdict has to be adjudicable, and this one is not: neither `@trace` nor its `source:` field carries a normative definition anywhere in `openspec/specs`, and `spectra archive`, which writes those blocks, is a closed binary whose behaviour cannot be established from this repository. Three candidate identities were measured against the same 60 archive commits here and produced hit sets that do not intersect, so whether a given hit is a false positive is a function of the definition the reader supplied rather than a property of the artifact. G7 therefore reports and a human adjudicates. Restoring a `FAIL` tier SHALL require first stating what counts as a lost trace as a requirement in `openspec/specs`, and that statement SHALL be able to adjudicate every hit in the two replay lists recorded in the change's design document.

A requirement present at base and absent from the working tree SHALL be reported as `REVIEW`, naming the capability, the requirement, how many `@trace` sources it carried at base, and which sources those were: a legitimate removal is visible in the same pull request's delta and is a human's call. Added capabilities, added requirements, and added `source:` values SHALL NOT be reported.

#### Scenario: A change without a gates.yaml fails claim parity

- **WHEN** the change directory carries no `gates.yaml`
- **THEN** G1 SHALL report `FAIL`
- **AND** the script SHALL exit non-zero
- **AND** the output SHALL name the expected path of the missing file

#### Scenario: A gates.yaml carrying no claim_phrases key fails as well

- **WHEN** the change's `gates.yaml` exists but supplies no `claim_phrases` value, whether the key is absent, the file is empty, or the key is written with nothing after it
- **THEN** G1 SHALL report `FAIL`
- **AND** the script SHALL exit non-zero
- **AND** the output SHALL name the file and the missing key, distinguishing this cause from an absent file

#### Scenario: An empty claim declaration is a deliberate one

- **WHEN** the change's `gates.yaml` exists and its `claim_phrases` list is empty
- **THEN** G1 SHALL report `PASS`
- **AND** the output SHALL state that no phrases were declared deliberately

#### Scenario: A malformed declaration stops the run rather than failing a gate

- **WHEN** the change's `gates.yaml` is not parseable YAML, or its `claim_phrases` or `hedge_markers` value is a scalar rather than a list
- **THEN** the script SHALL exit `2` with a message naming the file and the offending key
- **AND** no gate SHALL report `FAIL` on that basis
- **AND** no traceback SHALL be printed

#### Scenario: An empty hedge_markers list is honoured, not replaced

- **WHEN** the change's `gates.yaml` carries `hedge_markers` as an empty list
- **THEN** no wording SHALL count as hedged for that change
- **AND** neither the global `scripts/spec-gates/config.yaml` nor the built-in defaults SHALL be substituted
- **AND** those defaults SHALL apply only when the key is absent from the per-change file entirely

#### Scenario: An invariance claim about a changed file is routed to review

- **WHEN** the change's proposal or design claims a file is unchanged and that file appears in the diff
- **THEN** G2 SHALL report `REVIEW`
- **AND** the hit SHALL be listed with file, line, and the matched text
- **AND** the exit code SHALL be unaffected

#### Scenario: Trace blocks dropped by archiving are surfaced in CI

- **WHEN** a requirement present both at the base ref and in the working tree no longer carries an `@trace` `source:` that the base ref carried, whether it lost one of several or its last one
- **THEN** G7 SHALL report `REVIEW`
- **AND** the output SHALL name the capability, the requirement, each missing `source:`, and the size of the source set on each side
- **AND** the exit code SHALL be unaffected

#### Scenario: A source swap is not hidden by an unchanged total

- **WHEN** a requirement loses one `@trace` `source:` and gains a different one, leaving the number of `@trace` blocks equal on both sides
- **THEN** G7 SHALL report the `source:` that went missing

#### Scenario: An uncommitted trace deletion is caught before the commit

- **WHEN** an `@trace` block is deleted from a capability spec in the working tree and the deletion has not been committed
- **THEN** a local run of G7 SHALL report it
- **AND** the same pull request in CI SHALL reach the same verdict once the deletion is committed, because the checkout's working tree equals `HEAD` there

#### Scenario: A requirement no longer present is reviewed, not failed

- **WHEN** a requirement present at the base ref is absent from the same capability spec in the working tree
- **THEN** G7 SHALL report `REVIEW`, naming the capability, the requirement, the number of `@trace` sources it carried at base, and those sources themselves
- **AND** the exit code SHALL be unaffected

#### Scenario: Growth is not drift

- **WHEN** the working tree adds a capability spec, adds a requirement, or adds an `@trace` `source:` relative to the base ref
- **THEN** G7 SHALL NOT report a hit for it
