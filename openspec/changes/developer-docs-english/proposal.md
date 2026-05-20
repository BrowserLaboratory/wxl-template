## Summary

Translate the two large Traditional Chinese developer-facing root documents (`README.md`, `CONTRIBUTE.md`) into English to make them the single source of truth, clean up the remaining `（暫存）` Chinese fragment in the three Spectra-instruction docs (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`), and fix the residual English `title: Challenges` frontmatter in `docs/zh-TW/challenges.md` (a Change 2 leftover).

## Motivation

Stage 4 of the i18n master plan. Changes 1–3 (archived) established the i18n runtime, migrated user-facing content, and built the dual-locale data loaders. Developer documentation in the repo root was deferred to Stage 4. Discovery shows the scope is narrower than originally assumed: all 41 files under `openspec/specs/**/spec.md` are already English (normative SHALL/MUST), and CLAUDE/AGENTS/GEMINI.md are already ~95% English — only `README.md` (178 lines, ~100% Traditional Chinese) and `CONTRIBUTE.md` (251 lines, ~95% Traditional Chinese) need full translation. The zh-TW title leftover is a one-line frontmatter fix bundled here to close the i18n master plan in a single final change.

Translating the developer entry points to English lowers the barrier for international contributors, aligns with the source-code identifier language (English), and removes an unstated requirement that contributors read Traditional Chinese to onboard.

## Proposed Solution

- Per-paragraph English translation of `README.md` and `CONTRIBUTE.md`, preserving every Markdown link, image, code fence, heading anchor, and frontmatter. Technical nouns (`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, etc.) stay in English per existing project convention. Commit-example sections in `CONTRIBUTE.md` keep their illustrative Chinese strings as quoted-example text — they document the project's `/tw-emoji-commit` convention and rewriting them would lose meaning.
- Replace the inline `（暫存）` parenthetical in `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` with the equivalent English phrasing.
- Change `docs/zh-TW/challenges.md:2` frontmatter from `title: Challenges` to `title: 挑戰` to match the other zh-TW pages.
- Run a ripgrep `[一-鿿]` scan over `openspec/specs/**/spec.md` to confirm no Chinese has crept in; report-only (no edits expected based on Stage 2 discovery).
- Verify `pnpm docs:build` is clean and all anchor / relative-link references in the translated root docs still resolve.

## Non-Goals

- Structural restructuring of `README.md` or `CONTRIBUTE.md` (no section reorganization, no new sections, no TOC injection). Pure translation only.
- Translating any other Traditional Chinese content under `docs/zh-TW/` (that locale is the user-facing Chinese source-of-truth; only the leftover `title:` is in scope).
- Producing parallel `README.zh-TW.md` / `CONTRIBUTE.zh-TW.md` Chinese keep-files. If the user later wants bilingual root docs, that is a separate change.
- Modifying `.spectra.yaml`, CI, build pipeline, or any source code.
- Touching any `openspec/specs/**/spec.md` file unless the ripgrep scan surfaces an unexpected Chinese residue.

## Impact

- Affected specs: none. This change is documentation-only; no capability requirements move.
- Affected code:
  - Modified: README.md, CONTRIBUTE.md, CLAUDE.md, AGENTS.md, GEMINI.md, docs/zh-TW/challenges.md
  - New: none
  - Removed: none
