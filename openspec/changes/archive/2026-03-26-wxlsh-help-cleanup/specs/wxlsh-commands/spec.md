## MODIFIED Requirements

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

---

### Requirement: Pipe support

The terminal SHALL support the `|` (pipe) operator to chain commands, passing stdout of the preceding command as stdin to the following command.

#### Scenario: Pipe two commands

- **WHEN** user types `echo "hello world" | grep "hello"`
- **THEN** the output of `echo` is passed as input to `grep`, and only matching lines are displayed

#### Scenario: Multi-pipe chain

- **WHEN** user types `echo -e "cherry\napple\nbanana" | sort | head -2`
- **THEN** the commands execute in sequence with output piped through each stage
