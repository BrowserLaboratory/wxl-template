## ADDED Requirements

### Requirement: Provides a deterministic fork:init CLI

The project SHALL provide a `pnpm fork:init` command backed by `scripts/fork-init.ts` that performs the deterministic edits needed to fork the template repo into a new project. The CLI SHALL accept the flags `--name`, `--author`, `--repo <owner/repo>`, `--base <path>` (or `--base none`), `--rebrand <newname>`, and `--dry-run`. Supplying `--rebrand <newname>` selects the rebrand (B) mode; omitting it selects the minimal-fork (A) mode. The CLI SHALL NOT perform any GitHub remote operation (repo creation, push, or ruleset changes).

#### Scenario: Missing required flag fails loudly

- **WHEN** `pnpm fork:init` is invoked without a required flag (e.g. `--repo`) or with a `--repo` value that is not in `owner/repo` form
- **THEN** the CLI SHALL exit with a non-zero code and print a human-readable message naming the missing or malformed flag, and SHALL NOT write any file

#### Scenario: Mode selection by --rebrand

- **WHEN** `pnpm fork:init` is invoked with `--rebrand acme`
- **THEN** the CLI SHALL run the minimal-fork (A) edits and then the rebrand (B) rename pass; when `--rebrand` is omitted, only the A edits SHALL run

### Requirement: A-mode rewrites identity fields, base, URLs, and deploy workflow

In both modes, the CLI SHALL deterministically rewrite the project identity so no upstream identity remains in active files. It SHALL update `package.json` via structured edits (`version` reset to `0.1.0`, `author`, `repository.url`, `bugs.url`, `homepage`, `license`; in rebrand mode also `name` from `--rebrand` or `--name`; and `description` only when `--description` is provided), set or clear the VitePress `base` in `.vitepress/config.mts` per `--base`, and copy `.agent/skills/wxl-fork-init/deploy.yml.template` to `.github/workflows/deploy.yml`. It SHALL replace the upstream repository slug `BrowserLaboratory/wxl-template` with the new `--repo` as a single atomic unit across **every** active text file discovered by scanning — not a hand-maintained file list — so that `.vitepress/config.mts` (its `socialLinks` link), `README.md`, `CONTRIBUTE.md`, `CHANGELOG.md`, and any future slug-bearing file are all covered; because the whole slug is rewritten atomically, the `wxl` inside `wxl-template` is never mangled into a dead `<brand>-template` link. Free-form product copy — the VitePress `title` and the `package.json` `description` — is NOT invented by the CLI, and `--description` MAY set the description explicitly.

#### Scenario: Identity fields rewritten

- **WHEN** `pnpm fork:init --author me --repo me/myfork --base /myfork/` completes in A mode
- **THEN** `package.json` `version` SHALL be `0.1.0`, `author` SHALL be `me`, and `repository.url` / `bugs.url` / `homepage` SHALL point at `me/myfork`; `.vitepress/config.mts` SHALL set `base: '/myfork/'` and its `socialLinks` GitHub links SHALL point at `me/myfork`; and `README.md` / `CONTRIBUTE.md` SHALL contain no `BrowserLaboratory/wxl-template` URL

#### Scenario: Upstream slug swap is scan-driven and covers every active file

- **WHEN** the CLI runs against a tree where `CHANGELOG.md` (a file not in any hardcoded edit list) contains `https://github.com/BrowserLaboratory/wxl-template/...` links
- **THEN** the CLI SHALL rewrite those links to the new `--repo` and SHALL leave no `BrowserLaboratory/wxl-template` slug in `CHANGELOG.md`, and in rebrand mode SHALL NOT produce a `BrowserLaboratory/<brand>-template` dead link

#### Scenario: An active archive-prefixed sibling is not skipped

- **GIVEN** an active file `openspec/changes/archive-notes.md` and the historical directory `openspec/changes/archive/`
- **WHEN** the CLI runs
- **THEN** exclusions SHALL match at a path-segment boundary: the file under `openspec/changes/archive/` SHALL remain untouched while `openspec/changes/archive-notes.md` SHALL be processed like any other active file

#### Scenario: Base cleared for root deployment

- **WHEN** the CLI is invoked with `--base none`
- **THEN** `.vitepress/config.mts` SHALL NOT declare a `base` (equivalent to the default `/`)

#### Scenario: Deploy workflow copied

- **GIVEN** no `.github/workflows/deploy.yml` exists
- **WHEN** the CLI completes
- **THEN** `.github/workflows/deploy.yml` SHALL exist as a copy of `.agent/skills/wxl-fork-init/deploy.yml.template`

#### Scenario: Existing deploy.yml is not clobbered

- **WHEN** `.github/workflows/deploy.yml` already exists with content different from the template
- **THEN** the CLI SHALL leave it untouched and SHALL emit a warning naming `deploy.yml`, rather than overwriting a customized workflow

### Requirement: Rebrand mode renames only provable tokens and inventories the rest honestly

The substring `wxl` in this repo spans several semantically distinct identifier families a deterministic text tool cannot tell apart (the brand short-name, the `wxlsh` subsystem / `X-Wxlsh-*` wire headers, the four runtime-sensitive keys, the upstream repo slug, and path-referenced skill/spec directory names). Therefore, in rebrand (B) mode, the CLI SHALL rename ONLY the tokens it can prove are complete and self-contained — the upstream slug (handled by the A-mode atomic swap) and the four runtime-sensitive keys — using exact full-token, structure-aware replacements, and SHALL NOT perform a blind whole-file `wxl`→`<newname>` substitution. The four keys are the localStorage key `wxl-locale`, the environment variable `WXL_VERIFY_RUNTIME`, the temp working directory `tmp/wxl-verify`, and the release asset prefix `wxl-` in `release.yml`; each SHALL be renamed to its `<newname>` equivalent and reported. The sensitive-key rename SHALL run against the original content BEFORE the slug swap writes user identity, so a `--repo`/`--author` that happens to contain a key token is never corrupted. The rename SHALL exclude `pnpm-lock.yaml`, `node_modules`, `.git`, `openspec/changes/archive/**`, regenerated build output (`.vitepress/dist/**`, `.vitepress/cache/**`), Spectra internal state (`.spectra/**`), the structural skill directories `.agent`/`.claude`/`.codex`/`.gemini`, and the tool's own source and test, and SHALL be idempotent. Because the tool renames only provable tokens, it SHALL surface an HONEST residual inventory — computed from the bytes actually written (never a pre-edit snapshot), listing every remaining case-insensitive `wxl` as `file:line` — and SHALL NOT report the rebrand as complete or "clean" while any `wxl` remains. Occurrences that are solely the user's own `--repo` slug SHALL NOT be flagged (they are intentional identity); the `--author` value SHALL NOT be stripped from the residual check, so a bare `--author wxl` can never mask a real residual.

#### Scenario: Sensitive keys renamed and reported

- **WHEN** `pnpm fork:init --rebrand acme ...` completes
- **THEN** the four runtime-sensitive keys SHALL be renamed to the `acme` equivalents (`acme-locale`, `ACME_VERIFY_RUNTIME`, `tmp/acme-verify`, `acme-` release prefix) and SHALL each appear in the CLI's end-of-run "sensitive keys" report, and a file whose only `wxl` was an actually-renamed key SHALL NOT appear in the residual inventory

#### Scenario: The wxlsh subsystem token is not blind-renamed

- **WHEN** rebrand mode runs against an active file containing `useWxlsh` / `wxlsh`
- **THEN** the CLI SHALL leave that token byte-for-byte unchanged (it is not a provable brand-only full token) and SHALL instead list the file in the residual inventory for manual, namespace-aware handling

#### Scenario: Excluded paths untouched

- **WHEN** rebrand mode runs
- **THEN** `pnpm-lock.yaml`, any file under `openspec/changes/archive/`, `.vitepress/dist/`, `.vitepress/cache/`, `.spectra/`, `.agent`/`.claude`/`.codex`/`.gemini`, and the tool's own `scripts/fork-init.ts` / `tests/unit/scripts/fork-init.test.ts` SHALL NOT be modified

#### Scenario: User identity containing "wxl" is protected and not mis-flagged

- **WHEN** the CLI runs with `--repo myorg/wxl-ctf --author wxlfan --rebrand acme`
- **THEN** `package.json` `repository.url` SHALL remain `git+https://github.com/myorg/wxl-ctf.git`, `author` SHALL remain `wxlfan`, and the README clone URL SHALL still reference `myorg/wxl-ctf`; the README SHALL NOT be listed in the residual inventory on account of the user's own slug

#### Scenario: A bare-token --author does not collapse the rename

- **WHEN** the CLI runs with `--author wxl --repo me/myfork --rebrand acme`
- **THEN** the four sensitive keys SHALL still be renamed to their `acme` equivalents (the rename is NOT masked or collapsed), the `author` SHALL be written as `wxl`, and the residual inventory SHALL still surface the remaining brand tokens (no false "clean")

#### Scenario: Residual inventory is honest and the run is not called complete

- **WHEN** rebrand mode leaves any case-insensitive `wxl` in an active file (e.g. a Title-case `useWxlsh`)
- **THEN** the CLI SHALL list that file (with `file:line`) in the residual inventory computed from the final content, SHALL emit a message stating the rebrand is NOT complete, and SHALL warn that directory names (e.g. `chall-wasm/wxlsh-parser`) are not auto-renamed and the build will not run until they are renamed manually

#### Scenario: Re-running rebrand is idempotent

- **WHEN** `pnpm fork:init --rebrand acme ...` is run twice in succession
- **THEN** the second run SHALL NOT produce a double-renamed token (e.g. `acme` SHALL NOT become `acacmeme`) and SHALL report zero changed files

### Requirement: Dry-run previews all edits without writing

The CLI SHALL support `--dry-run`, which computes and prints every planned edit (including the runtime-sensitive-key classification) but SHALL NOT write, create, or delete any file. A normal (non-dry-run) invocation SHALL print an end-of-run summary listing each modified file and the sensitive-key handling.

#### Scenario: Dry-run writes nothing

- **WHEN** `pnpm fork:init --rebrand acme --repo me/myfork --dry-run` runs against a working tree
- **THEN** the CLI SHALL print the planned edits and SHALL leave every file byte-for-byte unchanged (no writes, no `.github/workflows/deploy.yml` created)

### Requirement: The wxl-fork-init skill drives the CLI

The `wxl-fork-init` skill SHALL be a script-driven wrapper: it SHALL detect the minimal-fork (A) vs rebrand (B) intent, collect the parameters via plain-text question blocks, invoke `pnpm fork:init` with the corresponding flags (using `--dry-run` to preview before the real run when appropriate), and then run the Verification greps confirming no upstream identity remains. The skill SHALL NOT re-implement the deterministic edits in prose, and SHALL remain host-agent-neutral per the authoring-skill-pattern capability.

#### Scenario: Skill invokes the CLI rather than hand-editing

- **WHEN** a user runs the `wxl-fork-init` skill for a minimal fork
- **THEN** the skill SHALL collect the parameters and invoke `pnpm fork:init` (not Edit `package.json` / `.vitepress/config.mts` by hand), then run the residual-identity grep as verification

#### Scenario: Skill prose stays host-agent-neutral

- **WHEN** a maintainer greps the skill prose for `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `subagent_type`
- **THEN** no matches SHALL be found under `.agent/skills/wxl-fork-init/`
