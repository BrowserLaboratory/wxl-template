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

In both modes, the CLI SHALL deterministically rewrite the project identity so no upstream identity remains in active files. It SHALL update `package.json` (`version` reset to `0.1.0`, `author`, `repository.url`, `bugs.url`, `homepage`, `license`; in rebrand mode also `name` from `--rebrand` or `--name`; and `description` only when `--description` is provided), set or clear the VitePress `base` in `.vitepress/config.mts` per `--base`, rewrite the GitHub URLs in `.vitepress/config.mts`, `README.md`, and `CONTRIBUTE.md` to the new `--repo` (this covers the VitePress `socialLinks` links), and copy `.agent/skills/wxl-fork-init/deploy.yml.template` to `.github/workflows/deploy.yml`. Free-form product copy — the VitePress `title` and the `package.json` `description` — is NOT invented by the CLI; any literal `wxl` short-name inside it is handled by the rebrand rename pass, and `--description` MAY set the description explicitly.

#### Scenario: Identity fields rewritten

- **WHEN** `pnpm fork:init --author me --repo me/myfork --base /myfork/` completes in A mode
- **THEN** `package.json` `version` SHALL be `0.1.0`, `author` SHALL be `me`, and `repository.url` / `bugs.url` / `homepage` SHALL point at `me/myfork`; `.vitepress/config.mts` SHALL set `base: '/myfork/'` and its `socialLinks` GitHub links SHALL point at `me/myfork`; and `README.md` / `CONTRIBUTE.md` SHALL contain no `BrowserLaboratory/wxl-template` URL

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

### Requirement: Rebrand mode renames the wxl short-name with classified runtime-sensitive-key handling

In rebrand (B) mode, the CLI SHALL rename the exact-case `wxl` and `WXL` short-name to `<newname>` across active files, and SHALL treat the four runtime-sensitive keys as a distinct class that is renamed explicitly and reported separately: the localStorage key `wxl-locale`, the environment variable `WXL_VERIFY_RUNTIME`, the temp working directory `tmp/wxl-verify`, and the release asset prefix `wxl-` in `release.yml`. The rename SHALL exclude `pnpm-lock.yaml`, `node_modules`, `.git`, `openspec/changes/archive/**`, the structural skill directories `.agent`/`.claude`/`.codex`/`.gemini`, and the tool's own source `scripts/fork-init.ts`, and SHALL be idempotent (re-running SHALL NOT double-rename). The CLI SHALL protect the user-supplied `--repo` and `--author` values (which MAY legitimately contain `wxl`) from the rename so identity strings are never corrupted. Because only exact-case `wxl`/`WXL` are renamed, the CLI SHALL surface a residual report listing every active file that still contains a case-insensitive `wxl` (Title-case identifiers such as `Wxlsh`, path-referencing directory names such as `chall-wasm/wxlsh-parser`) so the maintainer can finish the rebrand and any directory renames manually.

#### Scenario: Sensitive keys renamed and reported

- **WHEN** `pnpm fork:init --rebrand acme ...` completes
- **THEN** the four runtime-sensitive keys SHALL be renamed to the `acme` equivalents (`acme-locale`, `ACME_VERIFY_RUNTIME`, `tmp/acme-verify`, `acme-` release prefix) and SHALL each appear in the CLI's end-of-run "sensitive keys" report

#### Scenario: Excluded paths untouched

- **WHEN** rebrand mode runs
- **THEN** `pnpm-lock.yaml`, any file under `openspec/changes/archive/`, any file under `.agent`/`.claude`/`.codex`/`.gemini`, and `scripts/fork-init.ts` SHALL NOT be modified

#### Scenario: User identity containing "wxl" is protected

- **WHEN** the CLI runs with `--repo myorg/wxl-ctf --author wxlfan --rebrand acme`
- **THEN** `package.json` `repository.url` SHALL remain `git+https://github.com/myorg/wxl-ctf.git`, `author` SHALL remain `wxlfan`, and the README clone URL SHALL still reference `myorg/wxl-ctf` — the rename SHALL NOT corrupt the fork's own identity

#### Scenario: Residual case-insensitive matches are reported

- **WHEN** an active file contains a Title-case brand token such as `useWxlsh` that the exact-case rename does not cover
- **THEN** the CLI SHALL leave that token unchanged and SHALL list the file in its residual report, and SHALL warn that directory names (e.g. `chall-wasm/wxlsh-parser`) are not auto-renamed and the build will not run until they are renamed manually

#### Scenario: Re-running rebrand is idempotent

- **WHEN** `pnpm fork:init --rebrand acme ...` is run twice in succession
- **THEN** the second run SHALL NOT produce a double-renamed token (e.g. `acme` SHALL NOT become `acacmeme`) and SHALL report no further `wxl` occurrences to change

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
