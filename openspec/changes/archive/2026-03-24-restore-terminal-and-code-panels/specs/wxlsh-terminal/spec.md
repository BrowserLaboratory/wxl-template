## ADDED Requirements

### Requirement: WxlshPanel reports command execution via callback prop

The `WxlshPanel.vue` component SHALL accept an optional `onCommandExecuted` callback prop with the signature:
```typescript
onCommandExecuted?: (event: { command: string; output: string; error: boolean }) => void
```

After each command execution completes (i.e., after `wxlsh.execute(line)` resolves), WxlshPanel SHALL invoke `onCommandExecuted` with the command string, the output text, and the error flag from the `CommandResult`. The callback SHALL be invoked before the output is written to the xterm.js display. If the callback prop is not provided, execution SHALL proceed without error (optional chaining).

The callback SHALL NOT be invoked when the user presses Enter on an empty input line.

#### Scenario: Successful command triggers callback

- **WHEN** a user executes `help` in the terminal and the command returns output with `error: false`
- **THEN** `onCommandExecuted` SHALL be called with `{ command: 'help', output: <help text>, error: false }`
- **AND** the output SHALL then be written to the terminal display

#### Scenario: Error command triggers callback with error flag

- **WHEN** a user executes an unknown command `foo` and the terminal returns an error message with `error: true`
- **THEN** `onCommandExecuted` SHALL be called with `{ command: 'foo', output: <error message>, error: true }`

#### Scenario: Empty input does not trigger callback

- **WHEN** a user presses Enter without typing any command
- **THEN** `onCommandExecuted` SHALL NOT be invoked

#### Scenario: Callback is optional

- **WHEN** `WxlshPanel` is mounted without an `onCommandExecuted` prop
- **THEN** command execution SHALL proceed normally without error
