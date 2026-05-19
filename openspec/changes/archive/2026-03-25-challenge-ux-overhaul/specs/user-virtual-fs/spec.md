## ADDED Requirements

### Requirement: User writable virtual filesystem

The system SHALL provide a user-writable virtual filesystem mounted at `/home/hacker/`, backed by IndexedDB, where users can create, read, update, and delete files and directories.

#### Scenario: Create and read a file

- **WHEN** user types `echo "test payload" > /home/hacker/payload.txt`
- **THEN** the file is persisted to IndexedDB
- **AND** `cat /home/hacker/payload.txt` returns "test payload"

#### Scenario: Directory operations

- **WHEN** user types `mkdir /home/hacker/scripts && touch /home/hacker/scripts/exploit.py`
- **THEN** the directory and file are created in the virtual FS
- **AND** `ls /home/hacker/scripts/` lists `exploit.py`

### Requirement: Per-challenge isolated storage

Each challenge slug SHALL have its own independent IndexedDB store. Files created in one challenge SHALL NOT be visible in another challenge.

#### Scenario: Cross-challenge isolation

- **WHEN** user creates `/home/hacker/notes.txt` in challenge "sqli-demo"
- **AND** then navigates to challenge "fastapi-demo"
- **THEN** `/home/hacker/notes.txt` does not exist in the fastapi-demo context

### Requirement: Default username hacker with customization

The default username SHALL be `hacker`. Users SHALL be able to customize it via `export USER=<name>`, which updates the `whoami` output and the home directory display name.

#### Scenario: Default whoami

- **WHEN** user types `whoami` without prior customization
- **THEN** the output is `hacker`

#### Scenario: Custom username

- **WHEN** user types `export USER=alice` then `whoami`
- **THEN** the output is `alice`

### Requirement: Challenge files not exposed in user FS

Challenge application files (decrypted from WASM payload) SHALL NOT be visible in the user virtual filesystem. They SHALL only exist within the Pyodide/PHP runtime internal filesystem.

#### Scenario: ls does not show challenge files

- **WHEN** user types `ls /`
- **THEN** the output shows `/home/` but does NOT show challenge application files like `app.py` or `flag.txt`

### Requirement: Default working directory

The terminal SHALL start with the working directory set to `/home/hacker/`.

#### Scenario: Initial pwd

- **WHEN** user opens the terminal for the first time on a challenge
- **THEN** `pwd` returns `/home/hacker`
