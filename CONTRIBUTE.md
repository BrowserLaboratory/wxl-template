# Contributing to Web eXploitation Laboratory

Thanks for your interest in this project! Please read this guide before submitting a PR.

## Table of contents

- [Branch model](#branch-model)
- [Development workflow](#development-workflow)
- [PR submission workflow](#pr-submission-workflow)
- [Adding a new challenge](#adding-a-new-challenge)
- [Challenge Keygen](#challenge-keygen)
- [Commit conventions](#commit-conventions)
- [Reporting issues](#reporting-issues)
- [Maintainer Setup](#maintainer-setup)

## Branch model

This project uses a simple **`main`-based** branching strategy — there is no long-lived integration branch:

| Branch | Purpose | Stability | Based on |
|------|------|--------|------|
| `main` | Production release; always deployable | Highest | — |
| `feature/*` | New feature development | Low | `main` |
| `bugfix/*` | Non-urgent bug fixes | Low | `main` |
| `hotfix/*` | Urgent production fixes | Medium | `main` |

### Branch naming convention

```
feature/<short-description>   # e.g. feature/add-php-upload-challenge
bugfix/<short-description>    # e.g. bugfix/fix-flag-verifier-timing
hotfix/<short-description>    # e.g. hotfix/patch-wasm-memory-leak
```

### Hotfix rules

A `hotfix/*` branch is cut from `main` and, once complete, merges back into `main` via a pull request:

```
main ──────────●──────────────────●── (merge hotfix)
               │                  ↑
               └─── hotfix/* ─────┘
```

## Development workflow

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/wxl-template.git
   cd wxl-template
   pnpm install
   ```

2. Add the upstream remote:

   ```bash
   git remote add upstream https://github.com/BrowserLaboratory/wxl-template.git
   ```

3. Cut your working branch from `main`:

   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/<your-feature>
   ```

4. Develop locally and confirm the tests pass:

   ```bash
   pnpm dev          # Start the dev server
   pnpm test --run   # TypeScript / JavaScript unit tests (bare `pnpm test` stays in Vitest watch mode)
   pnpm wasm:test    # Rust unit tests
   ```

   If you changed outward-facing Markdown (`README.md`, `CONTRIBUTE.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, or anything under `docs/`), run the same Phase-1 prose audit that CI runs. It blocks on mainland-Chinese vocabulary, unfinished placeholders, and malformed citations; other (stylistic) findings are advisory only:

   ```bash
   pip install -r scripts/prose-audit/requirements.txt
   python scripts/prose-audit/run.py $(git diff --name-only --diff-filter=AMR -M origin/main...HEAD -- '*.md')
   ```

5. Commit your changes (see [Commit conventions](#commit-conventions)) and push to your fork.

6. Open a Pull Request (see [PR submission workflow](#pr-submission-workflow)).

## PR submission workflow

### Target branch

All pull requests — new features, bugfixes, and hotfixes — target `main`. There is no long-lived integration branch.

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

- [ ] Local tests pass (`pnpm test --run` & `pnpm wasm:test`).
- [ ] Commit messages follow the conventions below.
- [ ] PR target branch is `main`.
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

### Mutate gate (`pnpm challenge:retype`)

Once a challenge exists, change its backend / difficulty / tags / category with `challenge:retype` — do **not** edit `index.md` frontmatter or rename `src/app.py` / `src/index.php` by hand. The script keeps the vulnerability body intact, re-runs `pnpm challenge:keygen`, and (when the backend changes) rewrites `EXPLOIT_PATH` in `tests/challenges/<slug>.spec.ts` to match the new backend's entry path. The rest of the spec file is left to you.

```bash
# Metadata-only mutations
pnpm challenge:retype <slug> --difficulty hard
pnpm challenge:retype <slug> --tags 'sqli,injection,flask,sqlite'
pnpm challenge:retype <slug> --category web

# Backend mutation within the same language family (e.g., fastapi ↔ flask)
pnpm challenge:retype <slug> --backend flask

# Cross-language mutations exit with code 2 ("manual retype required");
# perform those rewrites by hand.
```

### Verify gate (`pnpm challenge:verify`)

`pnpm challenge:verify <slug>` is the **release-blocking gate** for a challenge. It runs four layers; the first three are default, L4 is opt-in.

| Layer | Gate | Default? |
|-------|------|----------|
| L1 | Frontmatter + structure validation (delegates to `challenge:validate`) | yes |
| L2 | Content analysis + keygen + `wasm-tools validate runtime.wasm` (delegates to `challenge:analyze`) | yes |
| L3 | Playwright e2e exploit spec at `tests/challenges/<slug>.spec.ts` | yes |
| L4 | Spawn a fresh agent CLI session and require it to solve the challenge blind | only with `--blind` |

```bash
# Default: L1 + L2 + L3
pnpm challenge:verify <slug>

# Add L4 blind-solve gate (requires `pnpm docs:dev` already running on localhost:5173)
pnpm challenge:verify <slug> --blind

# Filter layers (debugging)
pnpm challenge:verify <slug> --layers L1,L3
```

L4 picks the host agent CLI via the `WXL_VERIFY_RUNTIME` environment variable (`claude` / `codex` / `gemini`; defaults to `claude`). The variable also accepts a comma-separated list (`claude,codex,gemini`) which triggers multi-agent cross-check — see below. All ephemeral artefacts live under `tmp/wxl-verify/<slug>/` and are deleted when verify exits — they are never committed.

#### L4 multi-agent cross-check (maintainer-only)

Maintainers preparing a release can run the same challenge against multiple runtimes in one invocation to surface cross-agent divergence:

```bash
# Explicit list (requires --blind)
pnpm challenge:verify <slug> --blind --agents claude,codex,gemini

# Shortcut bundling the three-runtime sweep
pnpm challenge:verify:cross <slug>

# Or via list-form env (no flag)
WXL_VERIFY_RUNTIME=claude,codex pnpm challenge:verify <slug> --blind
```

Precedence is `--agents` > list-form `WXL_VERIFY_RUNTIME` > default `[claude]`. The aggregate verdict follows fail > pass > inconclusive (exit 1 / 0 / 2). Each runtime gets its own ephemeral workdir at `tmp/wxl-verify/<slug>/<runtime>/`; a single-runtime list keeps the legacy `tmp/wxl-verify/<slug>/` layout byte-for-byte. The cross-agent divergence report is always emitted; add `--json` to get `perAgent[]` and an `aggregate { verdict, divergent }` object. Multi-agent L4 is not run in CI — it requires all three CLIs installed locally.

Run `pnpm challenge:verify <slug>` before opening any PR that touches a challenge. Treat a non-zero exit code as a blocker; do not merge until every gate reports green.

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

File an issue at [GitHub Issues](https://github.com/BrowserLaboratory/wxl-template/issues).

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

## Maintainer Setup

> This section is for repository maintainers only; contributors can skip it. It documents one-time GitHub configuration that lives outside the repo (server-side state) and that derived repositories must reproduce after `use-template`.

### Branch protection ruleset

This subsection implements the `ci-quality-gates` capability's **"Branch protection ruleset guards main with required status checks"** Requirement. Without the ruleset, anyone with write access can push directly to `main` or merge a pull request while `test` / `build` / `prose-audit` are red — both of which negate the hardening landed in `harden-ci-workflows`.

GitHub offers two mechanisms: legacy **Branch protection rules** and the newer **Repository rulesets**. We document rulesets only — GitHub now recommends rulesets, the `gh api` REST surface is stable, and bypass actors are first-class.

> Reference: [GitHub REST API — Repository rules](https://docs.github.com/en/rest/repos/rules).

#### Create the ruleset

Substitute `{owner}` and `{repo}` with your fork's slug, then run:

```bash
gh api -X POST /repos/{owner}/{repo}/rulesets \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "bypass_actors": [
    { "actor_type": "OrganizationAdmin", "actor_id": 1, "bypass_mode": "pull_request" },
    { "actor_type": "RepositoryRole",    "actor_id": 5, "bypass_mode": "pull_request" }
  ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "test",        "integration_id": 15368 },
          { "context": "build",       "integration_id": 15368 },
          { "context": "prose-audit", "integration_id": 15368 }
        ]
      }
    }
  ]
}
JSON
```

Notes:

- `name=Protect main` / `target=branch` / `enforcement=active` keep the ruleset active immediately.
- `conditions.ref_name.include=["~DEFAULT_BRANCH"]` scopes the ruleset to the repository's *default* branch, following GitHub's built-in `~DEFAULT_BRANCH` selector. This keeps the ruleset working when the default branch is renamed (e.g., `main` → `trunk`) and lets derived repositories whose default branch is not `main` (`master`, `develop`, etc.) reuse the same payload unchanged. Branches other than the default are not covered by this ruleset.
- The `deletion` rule prevents the default branch from being deleted at all (`git push --delete origin <default>` is rejected). The `non_fast_forward` rule prevents any history-rewriting push (`git push --force`, `git push --force-with-lease`, force-push from `gh`/IDE, etc.). Both rules apply even to repository administrators, so destructive operations always go through explicit `bypass_actors` invocation and are recorded in the audit log.
- `bypass_actors` permits the organization admin (`OrganizationAdmin`, `actor_id=1`) and the repository's Admin role (`RepositoryRole`, `actor_id=5`) to bypass via `bypass_mode=pull_request`. This mode allows administrators to self-merge a pull request without waiting for required status checks (an emergency lever), but does **not** permit direct pushes to the default branch — administrators must still open a pull request. The legacy `bypass_mode=always` (which would permit direct push) is intentionally avoided. `RepositoryRole` `actor_id` follows GitHub's built-in role IDs: `1`=Read, `2`=Triage, `3`=Write, `4`=Maintain, `5`=Admin. Every bypass invocation appears in the GitHub audit log.
- The `pull_request` rule sets `dismiss_stale_reviews_on_push=true` (a new commit invalidates earlier approving reviews — defends against the "approve-then-add-malicious-commit" pattern) and `required_review_thread_resolution=true` (every review-conversation thread must be resolved before merge, even on otherwise-passing PRs). The other three flags — `required_approving_review_count: 0`, `require_code_owner_review: false`, `require_last_push_approval: false` — are written explicitly with their defaults because GitHub's API requires the `pull_request.parameters` block to be all-or-nothing: omitting any of the five flags yields `HTTP 422 — Invalid property /rules/<N>: data matches no possible input`. Both hardening flags are no-ops for solo maintainers and net positive for multi-reviewer teams; they ship in the default payload so use-template forks inherit them automatically.
- The three `required_status_checks` contexts (`test`, `build`, `prose-audit`) are the job IDs pinned by `ci-quality-gates` — do not rename without updating the spec and ruleset together. Each check entry pins `integration_id: 15368`, the App id of GitHub Actions; without pinning, any GitHub App with `Checks: write` could report a same-named `success` check and bypass the gate. (Setting `integration_id` to `null` is rejected by the API; either pin to an integer or omit the key entirely.)
- The `required_linear_history` rule forbids any merge that would create a merge commit on the default branch, so `git log --oneline <default>` stays a single linear chain. This keeps history readable and stops `git bisect` from stepping through interleaved merge-commit paths. Feature branches with several commits are flattened at squash time, so a contributor who wants to preserve commit-level intent should record it in the commit message body or the pull-request description. For a solo or AI-pair workflow the cost is near zero; a derived repository whose team prefers to keep granular feature-branch history may drop this rule.
- `allowed_merge_methods: ["squash", "rebase"]` removes `merge` from GitHub's default `["merge", "squash", "rebase"]`, so the "Create a merge commit" button is grayed out in the pull-request UI. This is the UI-level counterpart to `required_linear_history`: the server-side rule rejects a non-linear merge even if the button were clickable, while this parameter makes the restriction visible at PR time instead of failing at merge time. The two together are deliberate belt-and-suspenders. A maintainer used to merge commits must switch to squash or rebase. Because `pull_request.parameters` is all-or-nothing, `allowed_merge_methods` is also present in the multi-reviewer snippet below.
- `strict_required_status_checks_policy: true` requires a pull request's head to be up to date with the latest base before it can merge, so the `test` / `build` / `prose-audit` result reflects the real base-with-this-PR combination rather than a stale base. The trade-off is the "green then bounced" chain: when PR A merges, an already-green PR B is flagged "out of date with the base branch", its merge button is disabled, and the contributor must click "Update branch" (or rebase) to re-run all three checks on the new head before B is mergeable again. For a solo maintainer merging one PR at a time this never fires; during a burst of three to five concurrent PRs it adds roughly five to ten minutes per base merge. A derived repository with high PR throughput should weigh this cost before adopting the rule, and can revert this single flag to `false` while keeping the other two hardening settings.

#### Upgrade an existing ruleset

If the repository already has a `Protect main` ruleset created with an earlier version of this section, replace `<id>` with the numeric ruleset id (look it up via `gh ruleset list -R {owner}/{repo}`) and run a `PUT` with the same payload shape as the `POST` above:

```bash
# Look up the id first if you don't know it:
gh ruleset list -R {owner}/{repo}

# Then upgrade the existing ruleset in place:
gh api -X PUT /repos/{owner}/{repo}/rulesets/<id> \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "bypass_actors": [
    { "actor_type": "OrganizationAdmin", "actor_id": 1, "bypass_mode": "pull_request" },
    { "actor_type": "RepositoryRole",    "actor_id": 5, "bypass_mode": "pull_request" }
  ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "test",        "integration_id": 15368 },
          { "context": "build",       "integration_id": 15368 },
          { "context": "prose-audit", "integration_id": 15368 }
        ]
      }
    }
  ]
}
JSON
```

`PUT` overwrites the ruleset in place (rather than creating a duplicate), so re-running the same command is safe.

#### Optional: require pull-request approvals (multi-reviewer teams)

The default payload above does **not** require any approving review — solo maintainers can self-merge once `test` / `build` are green. If the team has multiple reviewers and you want to require at least one approval **in addition to** the existing required status checks, replace the `pull_request` rule entry above with:

```json
{
  "type": "pull_request",
  "parameters": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews_on_push": true,
    "require_code_owner_review": false,
    "require_last_push_approval": false,
    "required_review_thread_resolution": true,
    "allowed_merge_methods": ["squash", "rebase"]
  }
}
```

The `required_status_checks` rule entry stays untouched — approvals are layered **on top of** the existing `test` / `build` gate, not as a replacement.

#### Verify the ruleset

After running either the `POST` (initial create) or the `PUT` (upgrade) above, inspect the live ruleset to confirm every rule and every required check is in place:

```bash
gh ruleset list -R {owner}/{repo}
# Note the numeric id of "Protect main" and run:
gh api -X GET /repos/{owner}/{repo}/rulesets/<id> \
  | python3 -c "import sys, json; d=json.load(sys.stdin); \
      print('rule types:', sorted(r['type'] for r in d['rules'])); \
      checks=[(c['context'], c.get('integration_id')) \
              for r in d['rules'] if r['type']=='required_status_checks' \
              for c in r['parameters']['required_status_checks']]; \
      print('required checks:', checks); \
      print('strict_required_status_checks_policy:', [r['parameters']['strict_required_status_checks_policy'] \
              for r in d['rules'] if r['type']=='required_status_checks']); \
      print('allowed_merge_methods:', [r['parameters'].get('allowed_merge_methods') \
              for r in d['rules'] if r['type']=='pull_request']); \
      print('bypass:', [(a['actor_type'], a.get('actor_id'), a['bypass_mode']) \
                        for a in d['bypass_actors']])"
```

Expected output after a correct upgrade:

- `rule types: ['deletion', 'non_fast_forward', 'pull_request', 'required_linear_history', 'required_status_checks']` — all five rules present, including `required_linear_history`.
- `required checks: [('test', 15368), ('build', 15368), ('prose-audit', 15368)]` — all three check entries pinned to the GitHub Actions App.
- `strict_required_status_checks_policy: [True]` — a pull-request head must be up to date with the base before it can merge.
- `allowed_merge_methods: [['squash', 'rebase']]` — the merge-commit method is not offered in the UI.
- `bypass: [('OrganizationAdmin', ..., 'pull_request'), ('RepositoryRole', 5, 'pull_request')]` — every bypass actor uses `pull_request` mode (no `always`).

If `deletion`, `non_fast_forward`, or `required_linear_history` is missing, if `strict_required_status_checks_policy` is `False`, if `prose-audit` is absent from the required checks, or if any bypass entry still says `'always'`, re-run the `PUT` upgrade — the ruleset has not been advanced to the current spec.
