## Summary

Run the `humane-prose-audit` five-phase pipeline against every outward-facing Markdown document in the repository (root developer docs + every page under `docs/`, both `en` and `zh-TW` locales) as the final quality gate of the i18n master plan. Remediate any Critical / High finding inline. Install the per-project `.humane-prose-audit.yaml` config with the `technical-doc` profile and add `audit-runs/` to `.gitignore` so per-run output stays out of version control.

## Motivation

i18n master plan terminus. Stages 1–3 (archived) plus Stage 1–2 of this session collectively replaced the test regression, translated developer docs to English, and aligned zh-TW user content. The remaining quality risk is prose-level: any of the translated pages (and the previously-untouched outward Chinese pages) may contain fact errors, logical holes, AI-flavored slop, depth gaps, or weak-language smells that a structural audit catches but a translation audit does not. `humane-prose-audit` provides exactly that: 14 deterministic Python checks, 4 adversarial sub-agent personas (SLP / ILL / SHL / HUM), and a humane-signal scoring layer.

Running this pass before declaring the i18n plan complete prevents the project from shipping subtle prose defects that compound over time.

## Proposed Solution

- Bootstrap `.humane-prose-audit.yaml` at repo root with profile `technical-doc` (already exists post-`init-config` in this branch).
- Add `audit-runs/` to `.gitignore` so per-target audit run directories do not bloat the repo.
- Enumerate outward docs deterministically: 5 root developer docs (README.md, CONTRIBUTE.md, CLAUDE.md, AGENTS.md, GEMINI.md) + every `*.md` under `docs/` (both `docs/**` and `docs/zh-TW/**`).
- For each target, run `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py <target.md> --out audit-runs/prose/<slug>/ --seed 0`. The skill internally dispatches 4 persona sub-agents and produces an `audit-report.json` with `verdict` and `findings` per file.
- Aggregate findings into `openspec/changes/prose-audit-outward-docs/audit-summary.md` (committed). Bucket by severity: Critical + High = blocking; Medium + Low + Suggestion = informational, not patched in this change.
- Remediate every Critical / High finding inline; re-run the audit on the affected file until its verdict is PASS. If a single file accumulates more than 10 Critical / High findings, pause and ask the user before bulk-editing.
- Verify `pnpm docs:build` is clean after any remediation.

## Non-Goals

- Patching Medium / Low / Suggestion-level findings. They are recorded in the summary but left for a future polish change to keep this one's scope bounded.
- Auditing internal prose (`openspec/specs/**`, `openspec/changes/**`, `AUDIT.md`, `.claude/**`, `.agents/**`). Specs are normative SHALL/MUST text — different style rules apply. Spectra change docs and AUDIT are internal accounting.
- Modifying the `humane-prose-audit` skill, its profiles, or its configuration. Use it as-is.
- Reorganizing or rewriting any outward doc beyond what a Critical / High finding strictly requires.
- Translating any further content between locales.

## Impact

- Affected specs: new capability `prose-audit-outward-docs` codifies the audit policy.
- Affected code:
  - New: `.humane-prose-audit.yaml`, `openspec/changes/prose-audit-outward-docs/audit-summary.md`
  - Modified: `.gitignore`, potentially any of the 19 outward Markdown files if a Critical / High finding is raised
  - Removed: none
