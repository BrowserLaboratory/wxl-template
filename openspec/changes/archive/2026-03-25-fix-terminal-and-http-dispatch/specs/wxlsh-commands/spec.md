## MODIFIED Requirements

### Requirement: Five-tier command system

The wxlsh terminal SHALL implement a five-tier command system where Tier 1–4 commands are always available and Tier 5 commands are controlled by the challenge author via frontmatter.

#### Scenario: Tier 1 core shell commands available

- **WHEN** user types any Tier 1 command (help, clear, echo, cat, ls, pwd, cd, mkdir, touch, cp, mv, rm, head, tail, wc, whoami, id, env, export, history, file, date, which)
- **THEN** the command executes with behavior aligned to the real Linux equivalent

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

#### Scenario: help lists all available commands by tier

- **WHEN** user types `help`
- **THEN** the output SHALL list all Tier 1–4 commands organized by category
- **AND** SHALL include Python-backed commands (curl, wget, decode, encode, base64, xxd, md5sum, sha256sum, urlencode, urldecode, grep, sed, awk, sort, uniq, cut, tr, tee, xargs, diff)

#### Scenario: which recognizes Python-backed commands

- **WHEN** user types `which curl`
- **THEN** the output SHALL be `/usr/bin/curl`
- **AND** SHALL NOT display "not found"
