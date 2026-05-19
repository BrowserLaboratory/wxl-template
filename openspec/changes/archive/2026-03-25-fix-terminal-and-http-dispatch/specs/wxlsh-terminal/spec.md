## MODIFIED Requirements

### Requirement: wxlsh terminal renders using xterm.js

The `WxlshPanel.vue` component SHALL use xterm.js (`xterm` + `@xterm/addon-fit`) as its display layer. The terminal SHALL display the prompt in Linux-style format `hacker@wxlsh:<cwd>$ ` where `<cwd>` is the current working directory with `~` shorthand for `/home/hacker`. The xterm.js instance SHALL be initialized lazily inside `onMounted` and SHALL be destroyed in `onUnmounted`. On first render, the terminal SHALL display a startup banner: "wxlsh 1.0 — web exploit shell" followed by "type 'help' for available commands".

#### Scenario: Terminal displays Linux-style prompt

- **WHEN** the wxlsh tab is first rendered
- **THEN** the terminal SHALL show the brand banner containing "wxlsh"
- **AND** the prompt SHALL display as `hacker@wxlsh:~$ ` (with green username@host and blue path)

#### Scenario: Prompt reflects current directory

- **WHEN** the user runs `cd /tmp`
- **THEN** the next prompt SHALL display as `hacker@wxlsh:/tmp$ `

#### Scenario: Prompt uses tilde for home directory

- **WHEN** the current working directory is `/home/hacker/scripts`
- **THEN** the prompt SHALL display as `hacker@wxlsh:~/scripts$ `

#### Scenario: Terminal is lazy-loaded

- **WHEN** the user has not yet opened the Terminal tab
- **THEN** the xterm.js library SHALL NOT be loaded (dynamic import deferred until tab activation)

#### Scenario: Terminal is cleaned up on unmount

- **WHEN** the challenge page is navigated away from
- **THEN** the xterm.js instance SHALL be disposed and all event listeners SHALL be removed
