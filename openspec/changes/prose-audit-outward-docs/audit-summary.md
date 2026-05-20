# Audit Summary — prose-audit-outward-docs

**Date:** 2026-05-20
**Profile:** `technical-doc`
**Skill:** `humane-prose-audit` (5-phase pipeline; Phase 2 dispatches 4 personas SLP / ILL / SHL / HUM per file)
**Seed:** 0 (reproducible per file)
**Scope:** 19 outward-facing Markdown files (5 root + 7 `docs/` + 7 `docs/zh-TW/`)

## Overall verdict

**ALL 19 files PASS** the gate (0 Critical AND 0 High on every file).

Mean `humane_score` = 92.5 / 100 (range 78–100); every file's `humane_band` = `high`.

## Per-file table

| File | Verdict | humane_score | C | H | M | L |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `README.md` | PASS | 95 | 0 | 0 | 0 | 2 |
| `CONTRIBUTE.md` | PASS | 98 | 0 | 0 | 0 | 2 |
| `CLAUDE.md` | PASS | 100 | 0 | 0 | 0 | 1 |
| `AGENTS.md` | PASS | 100 | 0 | 0 | 0 | 1 |
| `GEMINI.md` | PASS | 100 | 0 | 0 | 0 | 1 |
| `docs/index.md` | PASS | 85 | 0 | 0 | 0 | 0 |
| `docs/challenges.md` | PASS | 78 | 0 | 0 | 0 | 0 |
| `docs/guide/index.md` | PASS | 99 | 0 | 0 | **1** | 0 |
| `docs/guide/python.md` | PASS | 100 | 0 | 0 | 0 | 0 |
| `docs/guide/terminal.md` | PASS | 93 | 0 | 0 | **1** | 0 |
| `docs/guide/network.md` | PASS | 100 | 0 | 0 | 0 | 2 |
| `docs/challenge/door-is-open/index.md` | PASS | 85 | 0 | 0 | 0 | 0 |
| `docs/zh-TW/index.md` | PASS | 81 | 0 | 0 | 0 | 1 |
| `docs/zh-TW/challenges.md` | PASS | 78 | 0 | 0 | 0 | 0 |
| `docs/zh-TW/guide/index.md` | PASS | 99 | 0 | 0 | 0 | 0 |
| `docs/zh-TW/guide/python.md` | PASS | 100 | 0 | 0 | 0 | 0 |
| `docs/zh-TW/guide/terminal.md` | PASS | 96 | 0 | 0 | 0 | 1 |
| `docs/zh-TW/guide/network.md` | PASS | 100 | 0 | 0 | 0 | 0 |
| `docs/zh-TW/challenge/door-is-open/index.md` | PASS | 85 | 0 | 0 | 0 | 0 |

Totals: 0 Critical, 0 High, **2 Medium**, **12 Low**.

## Medium findings (informational; non-blocking)

Per the change design's "Remediation strategy: blocking on Critical / High only" decision, these are recorded but **not** patched in this change. They are candidates for a future polish change.

### `docs/guide/index.md` — `<pronoun-switches>`

> 5 adjacent pronoun-voice switches indicate inconsistent narrator
>
> `sequence=['second', 'second', 'second', 'second', 'first_singular', 'second', 'first_singular', 'second', 'first_singular']`

The guide alternates between "you" (second person) and "I / we / let's" (first person). Style polish would unify on second-person throughout.

### `docs/guide/terminal.md` — `<lexical-diversity>`

> Lexical diversity (MTLD=34) below 40; vocabulary is repetitive
>
> `mtld=33.89, word_count=434, type_count=172`

The terminal guide repeats the same nouns (terminal / command / shell) tightly. Acceptable for reference material but flagged as a style nudge.

## Low findings (informational; non-blocking)

12 Low findings total, dominated by two harmless patterns:

- **`<lexical-diversity>`** below 60 — common for short reference pages and badge-heavy READMEs (`README.md`, `CONTRIBUTE.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `docs/guide/network.md`, `docs/zh-TW/index.md`, `docs/zh-TW/guide/terminal.md`).
- **`<repetition-fingerprint>`** — repeated n-grams such as `"https img shields io badge"` (README badge URLs) and `"flask | fastapi | php"` (canonical backend enum). Both are correct repetitions of canonical strings, not prose redundancy.

Full per-file detail lives in `audit-runs/prose/<slug>/audit-report.json` (gitignored). To reproduce any specific report: `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py <file> --out audit-runs/prose/<slug>/ --seed 0`.

## Acceptance

This audit run satisfies the spec scenario **All outward docs PASS at PR time** for `prose-audit-outward-docs`. The change ships with `.humane-prose-audit.yaml` (profile `technical-doc`) and the `audit-runs/` gitignore entry, so future contributors and CI can reproduce this audit identically.
