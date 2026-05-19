## ADDED Requirements

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
- **THEN** the command executes, routing HTTP requests through the dispatch bridge

#### Scenario: Tier 5 commands controlled by challenge author

- **WHEN** user types a Tier 5 command (dirb, dirsearch, sqlmap, jwt, hydra, nmap) and the challenge frontmatter includes that command in the `commands` field
- **THEN** the command executes

#### Scenario: Tier 5 command blocked when not enabled

- **WHEN** user types a Tier 5 command that is not listed in the challenge `commands` field
- **THEN** the terminal displays a message indicating the command is not available for this challenge

### Requirement: Command behavior aligned to real Linux tools

All implemented commands SHALL use flag syntax, argument parsing, and output formatting that match their real Linux counterparts.

#### Scenario: grep with standard flags

- **WHEN** user types `grep -i -r "password" .`
- **THEN** the command uses case-insensitive recursive search matching real grep behavior

#### Scenario: curl with standard flags

- **WHEN** user types `curl -X POST -d '{"user":"admin"}' -H "Content-Type: application/json" <url>`
- **THEN** the command sends a POST request with the specified body and headers

### Requirement: Unsupported real parameters reported explicitly

For Tier 5 tools implemented as simplified rewrites, any real parameter that is recognized but not implemented SHALL produce an explicit message indicating the parameter exists in the real tool but is not supported in this environment, with a link to the official documentation.

#### Scenario: sqlmap unsupported option

- **WHEN** user types `sqlmap -u "http://target/?id=1" --os-shell`
- **THEN** the terminal displays: option '--os-shell' is available in the real sqlmap but is not supported in this environment, lists supported options, and provides a link to sqlmap.org

#### Scenario: Unknown option

- **WHEN** user types a command with a completely unknown flag (not a real flag of the tool)
- **THEN** the terminal displays: `unknown option: --xxx`

### Requirement: Pipe support

The terminal SHALL support the `|` (pipe) operator to chain commands, passing stdout of the preceding command as stdin to the following command.

#### Scenario: Pipe two commands

- **WHEN** user types `cat /home/hacker/notes.txt | grep "flag"`
- **THEN** the output of `cat` is passed as input to `grep`, and only matching lines are displayed

#### Scenario: Multi-pipe chain

- **WHEN** user types `ls | sort | head -5`
- **THEN** the commands execute in sequence with output piped through each stage
