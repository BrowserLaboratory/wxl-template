## MODIFIED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL render four panels accessible via tab navigation: Browser Panel, wxlsh Terminal Panel, Repeater Panel, and Code Editor Panel. All four panels SHALL share a single `dispatch` function for issuing requests. The tab bar SHALL display labels: "Browser", "Terminal", "Repeater", "Code". The layout SHALL receive the challenge `slug` from the page's frontmatter via VitePress's `useData()` composable.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Terminal Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, response history, editor content)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `https://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: Layout is activated via frontmatter, not component embedding

- **WHEN** a challenge `.md` file declares `layout: challenge` in its frontmatter
- **THEN** VitePress SHALL render the `ChallengeLayout.vue` layout without any `<ChallengeLayout>` tag in the `.md` content body

---

### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide: a URL input field pre-populated with `https://challenge-<slug>.localhost/` and a "Go" button. The HTTP method selector SHALL NOT be present. Pressing Enter in the URL field SHALL trigger a GET fetch identical to clicking the "Go" button. The iframe SHALL use `sandbox="allow-scripts allow-forms allow-same-origin"`. Link clicks within the iframe SHALL be intercepted, the URL bar SHALL be updated to the link's href, and a new GET fetch SHALL be dispatched automatically.

#### Scenario: Enter key in URL bar triggers navigation

- **WHEN** the user types a URL in the address bar and presses Enter
- **THEN** the Browser Panel SHALL dispatch a GET request to that URL and render the response

#### Scenario: Link click in iframe triggers in-panel navigation

- **WHEN** the user clicks a link inside the rendered HTML iframe
- **THEN** the Browser Panel SHALL intercept the click, update the URL bar to the link's href, and dispatch a new GET request without leaving the page

#### Scenario: HTML response is rendered in sandboxed iframe

- **WHEN** the challenge app returns a response with `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the HTML in the sandboxed iframe

#### Scenario: Non-HTML response is shown as formatted text

- **WHEN** the challenge app returns `Content-Type: application/json`
- **THEN** the Browser Panel SHALL display the JSON as formatted text, not rendered HTML

---

### Requirement: Terminal Panel accepts curl and HTTPie-style commands

The Terminal Panel SHALL be implemented as `WxlshPanel.vue` using xterm.js as the display layer and the `wxlsh` command dispatcher. It SHALL display the brand name "wxlsh" (not "bash") and a startup banner on first render. The previous `<div>`-based terminal UI and TypeScript CLI parser SHALL be removed. All terminal functionality SHALL be provided by `WxlshPanel` as specified in the `wxlsh-terminal` capability spec.

#### Scenario: Terminal tab renders xterm.js terminal

- **WHEN** the user clicks the "Terminal" tab
- **THEN** the panel SHALL render an xterm.js canvas with the wxlsh banner

#### Scenario: curl command sends HTTP request via dispatch

- **WHEN** the user types `curl https://challenge-sqli.localhost/users` and presses Enter
- **THEN** the Terminal Panel SHALL send a GET request and display the response headers and body in the terminal output

#### Scenario: Invalid command shows usage hint

- **WHEN** a user types an unrecognized command
- **THEN** the Terminal Panel SHALL display "wxlsh: <command>: command not found" and suggest using `help`

---

### Requirement: Repeater Panel provides raw HTTP request editing

The Repeater Panel SHALL retain its core functionality (raw HTTP/1.1 request editing, send, response display, named snapshots). The visual presentation SHALL be upgraded: snapshot list SHALL be displayed as a named sidebar list rather than bottom inline chips, the "Save" button SHALL prompt the user for a snapshot name, and the textarea and response area SHALL use consistent monospace typography with improved line-height and border treatment.

#### Scenario: Raw request is parsed and sent

- **WHEN** a user edits a raw HTTP request in the Repeater Panel and clicks "Send"
- **THEN** the panel SHALL parse the raw text into method, path, headers, and body, then dispatch via `dispatch`

#### Scenario: Raw response is displayed

- **WHEN** the response is received
- **THEN** the Repeater Panel SHALL display the status line, all response headers, and the raw body

#### Scenario: Named snapshot can be saved and restored

- **WHEN** a user clicks "Save", enters a name, and confirms
- **THEN** the snapshot SHALL appear in the sidebar list and selecting it SHALL restore the request content

---

### Requirement: Challenge UI components use UnoCSS utility classes for styling

The Vue components `BrowserPanel.vue`, `WxlshPanel.vue`, `RepeatPanel.vue`, `CodeEditorPanel.vue`, `FlagSubmit.vue`, and `ChallengeLayout.vue` SHALL use UnoCSS utility classes in their templates. Components SHALL reference design tokens via `--ch-*` CSS custom properties. A minimal `<style scoped>` block is permitted only for CSS transitions or pseudo-element rules not expressible as UnoCSS utilities.

#### Scenario: New components render with UnoCSS styling

- **WHEN** a challenge page loads with the new WxlshPanel and CodeEditorPanel
- **THEN** both components SHALL be styled using UnoCSS-generated CSS classes without custom scoped style blocks (except transitions)

#### Scenario: Dark mode applies via CSS var change, not class toggle

- **WHEN** the user switches between dark and light mode
- **THEN** all challenge UI components SHALL update their visual appearance through CSS custom property resolution

---

### Requirement: Challenge UI applies the platform color palette

The challenge UI components SHALL visually reflect the platform's dual-theme palette: Midnight Indigo in dark mode (background `#0f0f23`, accent `#6366f1`) and Enterprise Indigo in light mode (background `#eef2ff`, accent `#4338ca`).

#### Scenario: Dark mode renders Midnight Indigo palette

- **WHEN** the `.dark` class is active
- **THEN** the challenge page background SHALL resolve to `#0f0f23` and interactive elements SHALL use `#6366f1` as the accent color

#### Scenario: Light mode renders Enterprise Indigo palette

- **WHEN** the `.dark` class is absent
- **THEN** the challenge page background SHALL resolve to `#eef2ff` and interactive elements SHALL use `#4338ca` as the accent color
