## MODIFIED Requirements

### Requirement: Command dispatch routing

The command dispatch system SHALL route commands through a five-tier system: Tier 1 core shell (TypeScript), Tier 2 text processing (Python), Tier 3 encoding/hashing (TypeScript/Rust), Tier 4 network (Python), Tier 5 penetration tools (Python, controlled by challenge frontmatter). The previous three-command system (curl, decode, encode) is replaced by this tiered architecture.

#### Scenario: Tier 1 command dispatched via TypeScript

- **WHEN** user types a Tier 1 command (e.g., `ls`, `cat`, `help`)
- **THEN** the command is executed via the TypeScript implementation without requiring Pyodide

#### Scenario: Tier 5 command dispatched with access control

- **WHEN** user types a Tier 5 command
- **THEN** the dispatcher checks the challenge `commands` frontmatter field before executing

### Requirement: Help command lists available commands

The `help` command SHALL list all available commands grouped by tier, indicating which Tier 5 tools are enabled for the current challenge.

#### Scenario: Help output with Tier 5 commands enabled

- **WHEN** user types `help` on a challenge with `commands: [sqlmap, dirb]`
- **THEN** the output lists all Tier 1–4 commands and shows sqlmap and dirb as available under Tier 5, with other Tier 5 tools marked as disabled

## ADDED Requirements

### Requirement: User VFS integration

The terminal SHALL integrate with the User Virtual FS for all file-related commands. Commands like `cat`, `ls`, `mkdir`, `touch`, `cp`, `mv`, `rm` SHALL operate on the IndexedDB-backed user filesystem at `/home/hacker/`.

#### Scenario: File created in terminal persists

- **WHEN** user types `echo "data" > test.txt` in the terminal
- **THEN** the file is written to the user VFS
- **AND** `cat test.txt` returns "data" in subsequent commands and sessions
