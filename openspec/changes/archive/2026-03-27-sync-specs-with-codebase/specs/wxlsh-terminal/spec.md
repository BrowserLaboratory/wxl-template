## MODIFIED Requirements

### Requirement: User VFS integration

The terminal SHALL integrate with the User Virtual FS for all file-related commands in a future iteration. Currently, filesystem commands (`ls`, `cat`, `mkdir`, `touch`, `cp`, `mv`, `rm`) are NOT implemented and SHALL produce `wxlsh: command not found: <cmd>` output. The `UserVfs` class exists in `useUserVfs.ts` but is not imported by `useWxlsh.ts`.

> **Future work:** Connect the `UserVfs` API to the wxlsh command dispatcher so that filesystem commands operate on the IndexedDB-backed user filesystem at `/home/hacker/`.

#### Scenario: Filesystem commands are not yet available

- **WHEN** user types a filesystem command such as `cat`, `ls`, `mkdir`, `touch`, `cp`, `mv`, or `rm`
- **THEN** the terminal SHALL display `wxlsh: command not found: <cmd>` followed by `Type 'help' for available commands.`

#### Scenario: UserVfs class is not connected to terminal

- **WHEN** the wxlsh terminal initializes via `useWxlsh.ts`
- **THEN** the composable SHALL NOT import or reference `useUserVfs.ts`
- **AND** no VFS-backed file operations SHALL be available in the terminal
