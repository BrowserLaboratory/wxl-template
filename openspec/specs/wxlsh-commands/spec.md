# wxlsh-commands Specification

## Purpose

Defines the five-tier command system for the wxlsh terminal, covering core shell commands, text processing utilities, encoding/hashing tools, network commands (curl/wget), and challenge-author-gated security tools, all with behavior aligned to their real Linux counterparts.

## Requirements

### Requirement: Five-tier command system

The wxlsh terminal SHALL implement a five-tier command system where Tier 1–4 commands are always available and Tier 5 commands are controlled by the challenge author via frontmatter.

#### Scenario: Tier 1 core shell commands available

- **WHEN** user types any Tier 1 command (help, clear, echo, pwd, cd, whoami, id, env, export, history, date, which)
- **THEN** the command executes with behavior aligned to the real Linux equivalent

#### Scenario: Filesystem commands not available

- **WHEN** user types any filesystem command (ls, cat, mkdir, touch, cp, mv, rm, head, tail, wc, file)
- **THEN** the terminal SHALL display `wxlsh: command not found: <cmd>` followed by `Type 'help' for available commands.`
- **AND** the `which` command SHALL report `<cmd> not found` for these commands

#### Scenario: Tier 2 text processing commands available

- **WHEN** user types any Tier 2 command (grep, sed, awk, sort, uniq, cut, tr, tee, xargs, diff)
- **THEN** the command executes with flag syntax and output format matching the real Linux tool

#### Scenario: Tier 3 encoding and hashing commands available

- **WHEN** user types any Tier 3 command (base64, xxd, md5sum, sha256sum, urlencode, urldecode)
- **THEN** the command executes correctly

#### Scenario: Tier 4 network commands available

- **WHEN** user types curl or wget
- **THEN** the command executes, routing HTTP requests through the async JS dispatch bridge via `await`

#### Scenario: Tier 5 commands controlled by challenge author

- **WHEN** user types a Tier 5 command (dirb, dirsearch, sqlmap, jwt, hydra, nmap) and the challenge frontmatter includes that command in the `commands` field
- **THEN** the command executes

#### Scenario: Tier 5 command blocked when not enabled

- **WHEN** user types a Tier 5 command that is not listed in the challenge `commands` field
- **THEN** the terminal displays a message indicating the command is not available for this challenge


<!-- @trace
source: wxlsh-help-cleanup
updated: 2026-03-26
code:
  - .vitepress/theme/composables/useWxlsh.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
-->

---
### Requirement: Command behavior aligned to real Linux tools

All implemented commands SHALL use flag syntax, argument parsing, and output formatting that match their real Linux counterparts.

#### Scenario: grep with standard flags

- **WHEN** user types `grep -i -r "password" .`
- **THEN** the command uses case-insensitive recursive search matching real grep behavior

#### Scenario: curl with standard flags

- **WHEN** user types `curl -X POST -d '{"user":"admin"}' -H "Content-Type: application/json" <url>`
- **THEN** the command sends a POST request with the specified body and headers via the async dispatch bridge
- **AND** the response body is displayed in the terminal

#### Scenario: date uses Linux format

- **WHEN** user types `date`
- **THEN** the output SHALL match Linux date format: `Tue Mar 25 22:40:36 CST 2026` (locale-appropriate abbreviated day, month, time, timezone, year)

#### Scenario: cd supports parent directory navigation

- **WHEN** user types `cd ..`
- **THEN** the current working directory SHALL navigate to the parent directory
- **AND** `pwd` SHALL reflect the updated path

#### Scenario: cd supports home shorthand

- **WHEN** user types `cd` or `cd ~`
- **THEN** the current working directory SHALL change to `/home/hacker`

#### Scenario: help with no arguments lists available commands with descriptions

- **WHEN** user types `help`
- **THEN** the output SHALL list all available Tier 1–4 commands organized by category
- **AND** each command SHALL have a short description of its function (e.g., `echo — display text`)
- **AND** the listing SHALL NOT include filesystem commands (ls, cat, mkdir, touch, cp, mv, rm, head, tail, wc, file)

#### Scenario: help with command argument shows per-command usage

- **WHEN** user types `help <command>` where `<command>` is a known available command
- **THEN** the output SHALL display the command's usage synopsis, description, and available options/flags

#### Scenario: help with unknown command argument

- **WHEN** user types `help <command>` where `<command>` is not a known available command
- **THEN** the output SHALL display `help: no help for '<command>'`

#### Scenario: which recognizes Python-backed commands

- **WHEN** user types `which curl`
- **THEN** the output SHALL be `/usr/bin/curl`
- **AND** SHALL NOT display "not found"


<!-- @trace
source: wxlsh-help-cleanup
updated: 2026-03-26
code:
  - .vitepress/theme/composables/useWxlsh.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
-->

---
### Requirement: Unsupported real parameters reported explicitly

For Tier 5 tools implemented as simplified rewrites, any real parameter that is recognized but not implemented SHALL produce an explicit message indicating the parameter exists in the real tool but is not supported in this environment, with a link to the official documentation.

> **Future work:** Parameter-level allow/deny checking for Tier 5 commands is not yet implemented. Currently, Tier 5 commands only check command-name-level allow/deny via the challenge frontmatter `commands` field. Unsupported parameters within an allowed Tier 5 command are not individually detected or reported.

#### Scenario: Tier 5 commands use name-level gating only

- **WHEN** a user types a Tier 5 command (e.g., `sqlmap`) that is listed in the challenge `commands` field
- **THEN** the command SHALL execute regardless of which parameters are passed
- **AND** no per-parameter validation or "unsupported parameter" messages SHALL be displayed

#### Scenario: Unknown option falls through to command handler

- **WHEN** a user types a Tier 5 command with an unknown flag (e.g., `sqlmap --nonexistent-flag`)
- **THEN** the behavior SHALL be determined by the command's own handler, not by a parameter-level checker


<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - scripts/challenge-analyze.ts
  - scripts/challenge-utils.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - .vitepress/theme/components/BrowserChrome.vue
  - .vitepress/theme/components/MergedNav.vue
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - scripts/create-challenge.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: Pipe support

The terminal SHALL support the `|` (pipe) operator to chain commands, passing stdout of the preceding command as stdin to the following command.

#### Scenario: Pipe two commands

- **WHEN** user types `echo "hello world" | grep "hello"`
- **THEN** the output of `echo` is passed as input to `grep`, and only matching lines are displayed

#### Scenario: Multi-pipe chain

- **WHEN** user types `echo -e "cherry\napple\nbanana" | sort | head -2`
- **THEN** the commands execute in sequence with output piped through each stage

<!-- @trace
source: wxlsh-help-cleanup
updated: 2026-03-26
code:
  - .vitepress/theme/composables/useWxlsh.ts
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
-->