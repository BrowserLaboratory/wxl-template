## Context

i18n Master Plan terminal stage. Stage 1 (test regression) and Stage 2 (developer docs English) are committed and archived. The remaining quality risk is prose-level: fact errors, logic holes, AI-flavored slop, depth gaps, weak-language smells. None of the previous stages exercised the `humane-prose-audit` skill, so this is the first time the outward documentation surface is being measured by it.

Constraints:
- `humane-prose-audit` reads one Markdown file per invocation; full-repo coverage means N orchestrator runs.
- The skill's PASS gate is `0 Critical AND 0 High` (Phase 5 verdict). Medium / Low / Suggestion findings are advisory.
- Phase 1 deterministic checks short-circuit further phases if any check escalates to Critical — saves token budget on broken files.
- The skill ships profiles `academic / blog / technical-doc / marketing / general`. This repository's docs are technical: API reference, deployment guides, challenge walkthroughs. Profile `technical-doc` is the right fit.
- Audit run output is per-file and verbose. Committing it would bloat the repo; only the aggregated summary survives.

Stakeholders: maintainer (claude@fhsh.tp.edu.tw); the `prose-audit-outward-docs` capability spec this change ships.

## Goals / Non-Goals

**Goals:**

- Run `humane-prose-audit` once against every outward Markdown file (5 root + 14 under `docs/` = 19 targets).
- Aggregate per-file `audit-report.json` into a single committed summary at `openspec/changes/prose-audit-outward-docs/audit-summary.md`.
- Patch every Critical / High finding inline. Re-audit affected files until each PASS.
- Confirm `pnpm docs:build` remains clean after any remediation.
- Land `.humane-prose-audit.yaml` + `.gitignore` entry so future contributors inherit the setup.

**Non-Goals:**

- Medium / Low / Suggestion remediation. Out of scope for this change; left for a future polish change.
- Auditing internal docs (`openspec/**`, `AUDIT.md`, `.claude/**`, `.agents/**`, `.spectra/**`).
- Tweaking the `humane-prose-audit` profile defaults (config stays minimal: just `profile: technical-doc`).
- Reorganizing or rewriting outward docs beyond what a Critical / High finding strictly requires.

## Decisions

### Profile choice: technical-doc

The 5 profiles available are `academic / blog / technical-doc / marketing / general`. README, CONTRIBUTE, guide pages, challenge walkthroughs, and Spectra-instruction docs all share the property "explain a system to a reader who wants to use it" — that is technical-doc territory. `academic` is too citation-heavy, `blog` weights voice and burstiness rules higher than reference accuracy, `marketing` over-rewards persuasion, `general` is the fallback when nothing fits. `technical-doc` it is. The config file is intentionally minimal (one key, `profile: technical-doc`) so future re-tunes happen by editing one line.

### Target enumeration: deterministic and recorded

Targets are computed once and listed verbatim in `tasks.md` under group 4. Rationale: a `find` discovery at apply time risks miscount under filesystem races or new files added between propose and apply. Listing them in tasks gives the implementer an explicit checklist and gives any reviewer a stable reference for what was audited.

### Per-file audit, not glob audit

The orchestrator takes one file per invocation. We run N times rather than chaining or wrapping. Rationale: keeping the orchestrator interaction shape exactly as the skill documents it means we inherit its `--seed 0` reproducibility guarantee per file; aggregation happens off the side.

### Remediation strategy: blocking on Critical / High only

PASS gate is `0 Critical AND 0 High`. Medium / Low / Suggestion are recorded but not patched in this change. Rationale: prose audits routinely surface dozens of Suggestion-level items per file (style nudges, optional clarifications); chasing them all turns this change into an open-ended rewrite. Critical / High are the floor for "do not ship this prose as-is"; everything else is improvement headroom.

### Halt-on-overflow rule for any single file

If one file accumulates more than 10 Critical / High findings, pause and ask the user before bulk-editing. Rationale: that signal pattern usually means the document needs to be rewritten rather than patched, and that decision is the maintainer's, not the implementer's.

### Audit-runs is gitignored; summary is committed

`audit-runs/prose/<slug>/audit-report.json` is verbose JSON plus per-phase intermediate outputs. Committing N of them is repo-bloating noise. The aggregated `audit-summary.md` is the durable record. Rationale: keep the diff lean; rerunnable artifacts don't need to live in git.

### `humane-prose-audit` 4 personas count toward the "≥3 sub-agents" requirement

The user's Stage 3 instruction is "dispatch at least 3 independent sub-agents." The `humane-prose-audit` skill internally dispatches 4 persona agents (SLP / ILL / SHL / HUM) per file as part of Phase 2; this exceeds the floor on its own. The change additionally dispatches 3 Explore-type sub-agents (S3-A cross-doc terminology, S3-B link/anchor integrity, S3-C VitePress build/render) covering dimensions the prose-audit personas do not — so the overall agent count and angle coverage exceeds the brief.

## Implementation Contract

**Behavior delivered:**

- `.humane-prose-audit.yaml` exists at repo root with `profile: technical-doc`.
- `.gitignore` contains `audit-runs/` (under a comment block titled `# Humane Prose Audit`).
- Every outward Markdown file's `audit-report.json` (in its `audit-runs/prose/<slug>/` run directory at the time of commit) has top-level `verdict: PASS` (i.e., 0 Critical AND 0 High).
- `openspec/changes/prose-audit-outward-docs/audit-summary.md` exists, committed, and lists per-file verdict + Medium/Low/Suggestion findings as informational.
- `pnpm docs:build` exits 0 after any remediation; warning count is unchanged from the Stage 2 baseline.

**Interfaces / data shapes preserved:**

- The `humane-prose-audit` CLI invocation contract: `python3 .../audit_orchestrator.py <target> --out <run-dir> --seed 0`. No flags beyond these are used.
- Markdown link / anchor / image / code-fence / frontmatter structure of every outward file remains intact post-remediation (sub-agent S3-B verifies).

**Acceptance criteria:**

- Spec scenario "All outward docs PASS at PR time" returns true for all 19 targets.
- `spectra validate prose-audit-outward-docs` exits 0.
- `/spectra-audit` returns 0 Critical / 0 Warning on the diff.
- S3-A / S3-B / S3-C all return non-blocking verdicts.
- `pnpm docs:build` clean.

**Scope boundaries (in / out):**

- IN: 19 enumerated outward Markdown files (potential remediation only), `.humane-prose-audit.yaml` (new), `.gitignore` (one entry added), `audit-summary.md` (new), one spec capability addition.
- OUT: every internal doc; every Medium / Low / Suggestion finding; any profile / config tuning beyond the bootstrap; any unrelated repo state.

## Risks / Trade-offs

- [Audit raises >10 Critical/High on a single file] → Halt and consult maintainer; the change pre-commits to not bulk-editing unprompted.
- [Remediation introduces dead links or breaks anchors] → S3-B link/anchor integrity sub-agent specifically audits this; spec scenarios make structural integrity a contract.
- [Audit results vary between local environments] → `--seed 0` plus the skill's reproducibility test bound the variance; differences across Python / dep versions would be raised by the maintainer.
- [Spec gate is over-restrictive] → PASS gate is Critical AND High only; Medium/Low/Suggestion remain advisory. Stage 3 is explicit that those are out of scope.
- [`humane-prose-audit` skill is missing or broken on the host] → Halt and report; the user-globals instruction model requires user authorization to install / configure tooling.

## Migration Plan

No migration needed. `.humane-prose-audit.yaml` is new, `.gitignore` only gains a benign entry, the summary file is new. No data is mutated; no schema changes.

If a future contributor needs to unwind this gate, they can: (a) delete `.humane-prose-audit.yaml` to disable per-project config (the skill falls back to defaults), (b) remove the `audit-runs/` entry from `.gitignore`, (c) propose a new spec change to relax the requirement. All three are reversible.

## Open Questions

None at this time. The skill, the profile, the enumeration, and the PASS gate are all decided in this design.
