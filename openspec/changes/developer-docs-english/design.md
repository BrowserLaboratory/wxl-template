## Context

i18n Master Plan Stage 4. Changes 1–3 are archived. Discovery confirmed that the original scope assumption (translate every `openspec/specs/**/spec.md`) was outdated: all 41 spec files are already English. The actual translation surface is just `README.md` (178 lines, ~100% Traditional Chinese) and `CONTRIBUTE.md` (251 lines, ~95% Traditional Chinese). Three smaller files — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` (28 lines each, ~95% English) — carry only a single Chinese parenthetical `（暫存）` that needs cleanup. One leftover from Change 2 — `docs/zh-TW/challenges.md:2` `title: Challenges` — is folded in here to close the i18n plan cleanly.

Constraints:

- Source convention: technical identifiers (`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, `Service Worker`, `WebAssembly`, `Pyodide`, `VitePress`) stay in English regardless of locale; this convention is already followed in the existing English content of CLAUDE/AGENTS/GEMINI.md.
- Markdown structural elements (relative links, image refs, heading anchors, code fences, frontmatter) MUST survive translation unchanged — they are independently testable contracts.
- `CONTRIBUTE.md` documents the project's own `/tw-emoji-commit` Traditional Chinese commit convention; example strings inside that section must remain Chinese to faithfully illustrate the convention.

Stakeholders: project maintainer (claude@fhsh.tp.edu.tw), future international contributors, the `oss-readme` and `contributor-guide` capability specs.

## Goals / Non-Goals

**Goals:**

- Make `README.md` and `CONTRIBUTE.md` fully English source-of-truth documents.
- Eliminate the `（暫存）` Chinese fragment from `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`.
- Fix the residual English `title: Challenges` frontmatter in `docs/zh-TW/challenges.md`.
- Confirm via scan that all 41 spec files remain English-only.
- Verify the VitePress build is clean and root-doc links still resolve.

**Non-Goals:**

- No structural restructuring of README / CONTRIBUTE (no section reorganization, no new sections, no auto-TOC).
- No content translation under `docs/zh-TW/**` beyond the one-line `title:` fix (that locale is the user-facing Chinese source-of-truth).
- No bilingual keep-files (`README.zh-TW.md`, etc.). If the user later wants them, separate change.
- No edits to `.spectra.yaml`, CI, build scripts, or any source code.
- No edits to any `openspec/specs/**/spec.md` file (except via the two spec deltas this change ships).

## Decisions

### Translation policy: paragraph-aligned, structure-preserved

Translate paragraph-by-paragraph; do not collapse, split, or reorder paragraphs. This makes diff review tractable and preserves the original information density. Rationale: a structural rewrite would conflate "translate" and "improve" into one diff and make it impossible to review either independently.

### Technical-identifier whitelist preserved verbatim

`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, `branch`, `merge`, `rebase`, `fork`, `Service Worker`, `WebAssembly`, `Pyodide`, `VitePress`, `Vite`, `Rust`, `WASM`, `Tailwind`, `pnpm`, `vitest`, `happy-dom`, `IndexedDB`, `Pinia`, `gitmoji`, `Conventional Commits` stay verbatim. Rationale: these are identifiers in the surrounding code and tooling — a translation would break grep-affinity and onboarding cross-reference.

### CONTRIBUTE example strings stay in Traditional Chinese

The commit-example region in `CONTRIBUTE.md` exists to show what a `/tw-emoji-commit` Traditional Chinese commit subject looks like in practice. Translating those examples to English would defeat their purpose. Rationale: documentation of a Chinese-language convention requires Chinese-language examples; the surrounding explanatory prose is what gets translated. The `contributor-guide` spec delta explicitly carves this out.

### Specs scan is read-only

Run `rg '[一-鿿]' openspec/specs/` once. If matches surface beyond the known `年` / `月` calendar examples in `challenge-list/spec.md` (informational, not prose), pause and ask the user before editing. Rationale: specs are normative and shouldn't be silently mutated; the discovery report said they're clean and this scan is verification, not work.

### `（暫存）` cleanup wording

Replace `Changes can be parked（暫存）— temporarily moved out of` with `Changes can be parked (temporarily moved out of the active set) —` (English parenthetical, em-dash retained). Rationale: minimum diff, retains structure, removes the only Chinese token without rewriting the surrounding sentence.

## Implementation Contract

**Behavior delivered:**

- After this change, `rg '[一-鿿]' README.md CLAUDE.md AGENTS.md GEMINI.md` returns zero matches.
- `rg '[一-鿿]' CONTRIBUTE.md` returns only matches inside fenced code blocks or quoted commit-example strings (the explicit carve-out in the `contributor-guide` spec delta).
- `docs/zh-TW/challenges.md:2` reads `title: 挑戰`.
- `openspec/specs/**/spec.md` remains a 100%-English corpus (modulo the pre-existing `年` / `月` calendar examples in `challenge-list/spec.md`).
- `pnpm docs:build` exits 0 with no new VitePress dead-link or missing-asset warnings introduced by this change.

**Interfaces / data shapes preserved:**

- Every Markdown link, image, code fence (with language tag), heading text (so heading anchors don't drift), and frontmatter key/value is byte-equivalent post-translation, except where the value itself is the translation target (e.g., heading prose, paragraph prose, the `title:` value in `docs/zh-TW/challenges.md`).
- No new files. No file removals.

**Acceptance criteria:**

- All 5 spec scenarios across the two spec deltas pass (verifiable via the listed `rg` and build commands).
- `spectra validate developer-docs-english` exits 0.
- `/spectra-audit` returns no Critical / Warning findings on the resulting `git diff HEAD`.
- The three Stage 2 sub-agents (S2-A translation fidelity / S2-B Markdown structure / S2-C language compliance) each return no blocking findings.

**Scope boundaries (in / out):**

- IN: README.md, CONTRIBUTE.md, CLAUDE.md, AGENTS.md, GEMINI.md, docs/zh-TW/challenges.md frontmatter line 2, two spec deltas (oss-readme, contributor-guide).
- OUT: every other file in the repository.

## Risks / Trade-offs

- [Translation introduces dead links via heading-text drift] → S2-B Markdown structure sub-agent specifically audits this; spec scenarios make link integrity a normative requirement.
- [Translation strips voice or intent the maintainer cared about] → Paragraph-aligned policy lets the maintainer review diff hunks one-to-one; reviewer can flag any drift.
- [`（暫存）` cleanup wording mismatches the existing English voice of the surrounding sentence] → Reuse the existing English phrasing from project docs where possible; the chosen English parenthetical preserves the em-dash and sentence shape.
- [Specs scan surfaces unexpected Chinese] → Halt and ask the user before editing any spec file; the change's design pre-commits to read-only scan.
