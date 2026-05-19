## MODIFIED Requirements

### Requirement: User writable virtual filesystem

The system SHALL provide a user-writable virtual filesystem mounted at `/home/hacker/`, backed by IndexedDB, where users can create, read, update, and delete files and directories. The `UserVfs` class SHALL expose a full CRUD API including `writeFile`, `readFile`, `deleteFile`, `mkdir`, `listDir`, and `exists` methods.

> **Future work:** Terminal integration is not yet implemented. The `UserVfs` class provides the full CRUD API backed by IndexedDB but is not yet connected to the wxlsh terminal. Users cannot currently interact with the user VFS through shell commands.

#### Scenario: UserVfs API provides file operations

- **WHEN** the `UserVfs` class is instantiated with a challenge slug
- **THEN** it SHALL expose `writeFile`, `readFile`, `deleteFile`, `mkdir`, `listDir`, and `exists` methods backed by IndexedDB

#### Scenario: UserVfs is not connected to terminal

- **WHEN** a user types filesystem commands in the wxlsh terminal
- **THEN** the commands SHALL NOT be routed to the `UserVfs` API
- **AND** the terminal SHALL report `command not found` for filesystem commands

#### Scenario: Directory operations via API

- **WHEN** `mkdir('/home/hacker/scripts')` and `writeFile('/home/hacker/scripts/exploit.py', content)` are called via the API
- **THEN** the directory and file SHALL be created in IndexedDB
- **AND** `listDir('/home/hacker/scripts/')` SHALL include `exploit.py`
