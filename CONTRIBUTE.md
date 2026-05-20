# Contributing to Web eXploitation Laboratory

Thanks for your interest in this project! Please read this guide before submitting a PR.

## Table of contents

- [Branch model](#branch-model)
- [Development workflow](#development-workflow)
- [PR submission workflow](#pr-submission-workflow)
- [Adding a new challenge](#adding-a-new-challenge)
- [Commit conventions](#commit-conventions)
- [Reporting issues](#reporting-issues)

## Branch model

This project follows the **Git Flow** branching strategy:

| Branch | Purpose | Stability | Based on |
|------|------|--------|------|
| `main` | Production release; always deployable | Highest | — |
| `staging` | Integration branch; merge target for every PR | Medium | `main` |
| `feature/*` | New feature development | Low | `staging` |
| `bugfix/*` | Non-urgent bug fixes | Low | `staging` |
| `hotfix/*` | Urgent production fixes | Medium | `main` |

### Branch naming convention

```
feat/<short-description>      # e.g. feature/add-php-upload-challenge
bugfix/<short-description>    # e.g. bugfix/fix-flag-verifier-timing
hotfix/<short-description>    # e.g. hotfix/patch-wasm-memory-leak
```

### Hotfix rules

A `hotfix/*` branch is cut from `main` and, once complete, must merge back into **both** `main` and `staging` so the fix is not lost in the next release:

```
main ──────────●──────────────────●── (merge hotfix)
               │                  ↑
               └─── hotfix/* ─────┤
                                  ↓
staging ──────────────────────────●── (merge hotfix)
```

## Development workflow

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/wxl.git
   cd wxl
   pnpm install
   ```

2. Add the upstream remote:

   ```bash
   git remote add upstream https://github.com/CXPhoenix/wxl.git
   ```

3. Cut your working branch from `staging`:

   ```bash
   git checkout staging
   git pull upstream staging
   git checkout -b feature/<your-feature>
   ```

4. Develop locally and confirm the tests pass:

   ```bash
   pnpm dev          # Start the dev server
   pnpm test         # TypeScript / JavaScript unit tests
   pnpm wasm:test    # Rust unit tests
   ```

5. Commit your changes (see [Commit conventions](#commit-conventions)) and push to your fork.

6. Open a Pull Request (see [PR submission workflow](#pr-submission-workflow)).

## PR submission workflow

### Target branch

| Scenario | PR target branch |
|------|------------|
| New feature, general bugfix | `staging` |
| Urgent production fix | `main` (open a second PR against `staging` at the same time) |

> **Do not open feature-style PRs directly against `main`.**

### Required PR description sections

The PR description must contain the following three sections:

```markdown
## Summary

<!-- Briefly describe the change (1–3 bullet points). -->

## Motivation

<!-- Explain why this change is needed. -->

## Test Plan

<!-- Describe how to verify the change (test commands, manual steps, etc.). -->
```

### PR checklist

Before submitting, confirm:

- [ ] Local tests pass (`pnpm test` & `pnpm wasm:test`).
- [ ] Commit messages follow the conventions below.
- [ ] PR target branch is correct (`staging`; for a hotfix, both `main` and `staging`).
- [ ] PR description contains Summary / Motivation / Test Plan.

## Adding a new challenge

Use `scripts/create-challenge.ts` to scaffold a new challenge:

```bash
pnpm create:challenge --name <slug> [--title <title>] \
  [--backend flask|fastapi|php] [--difficulty easy|medium|hard] \
  [--flag <flag>]
```

The script automatically:
1. Creates the challenge directory and Markdown file under `docs/challenge/`.
2. Generates the matching backend app skeleton (`app.py` or `index.php`).
3. Creates `flag.txt` with the supplied flag.
4. Runs `pnpm challenge:keygen` to produce the encrypted WASM module.

### Example

```bash
# Create a Flask SQLi challenge
pnpm create:challenge --name sqli-login --title "SQL Injection Login Bypass" \
  --backend flask --difficulty medium --flag "CTF{sqli_bypassed}"
```

## Challenge Keygen

Use the `challenge-keygen` script to produce the encrypted WASM payload for a challenge:

```bash
pnpm challenge:keygen                 # Process every challenge
pnpm challenge:keygen <slug>          # Process the named challenge only
pnpm challenge:keygen --force <slug>  # Force a regeneration
```

The script runs this pipeline:
1. Read the challenge frontmatter and the files under `src/`.
2. Generate a random AES-256 key and encrypt every FS entry.
3. Derive the flag verifier (PBKDF2-HMAC-SHA256).
4. Pack the result as a WASM custom section and inject it into the template WASM binary.
5. Update the `wasmModule` path in the frontmatter.

> **Skip behavior**: if the frontmatter already has `wasmModule` and the corresponding `runtime.wasm` file exists, the script skips that challenge. In CI environments — where `.wasm` files are not under version control — the script regenerates automatically. Use `--force` to force a regeneration.

## Commit conventions

This project follows the **[Conventional Commits](https://www.conventionalcommits.org/)** format with a **gitmoji** prefix.

### Format

```
<emoji> <type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Common types and emoji

| Emoji | Type | Description |
|-------|------|------|
| ✨ | `feat` | New feature |
| 🐛 | `fix` | Bug fix |
| ♻️ | `refactor` | Refactor with no external behavior change |
| 📝 | `docs` | Documentation change |
| ✅ | `test` | Add or modify tests |
| 🏗️ | `build` | Build system or dependency change |
| 🔧 | `chore` | Other maintenance work |
| 🚑️ | `hotfix` | Urgent fix |

### Examples

The project uses `/tw-emoji-commit` to compose Traditional Chinese commit subjects; these examples illustrate that convention:

```bash
# New feature
✨ feat(challenge): 新增 SQL injection 進階練習題

# Bug fix
🐛 fix(flag-verifier): 修正 PBKDF2 timing 比較邏輯

# Refactor
♻️ refactor(service-worker): 將路由邏輯提取為獨立模組

# Build system
🏗️ build: 升級 VitePress 至 2.0.0-alpha.16
```

### Breaking changes

If a change includes a breaking change, append a `BREAKING CHANGE:` footer to the commit:

```
♻️ refactor(challenge-api): 修改 frontmatter schema

移除舊版 `backend_url` 欄位，改用 `backend` 指定執行環境。

BREAKING CHANGE: `backend_url` 欄位不再支援，請改用 `backend: flask|fastapi|php`。
```

## Reporting issues

File an issue at [GitHub Issues](https://github.com/CXPhoenix/wxl/issues).

### Bug reports

Please include the following in the issue:

```markdown
**Environment**
- OS: macOS / Windows / Linux
- Browser and version: Chrome 120 / Firefox 121 / ...
- Node.js version:
- pnpm version:

**Steps to reproduce**
1. Go to ...
2. Click ...
3. See the error ...

**Expected behavior**
<!-- Describe what you expected to happen. -->

**Actual behavior**
<!-- Describe what actually happened; attach error messages or screenshots. -->
```

### Feature requests

Prefix the issue title with `[Feature]` and describe:

- **Context**: what were you doing when you hit the limitation?
- **Desired functionality**: what would you like added?
- **Alternatives considered**: what other approaches did you weigh?
