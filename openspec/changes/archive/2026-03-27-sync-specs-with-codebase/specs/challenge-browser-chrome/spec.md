## MODIFIED Requirements

### Requirement: Auto-navigation on runtime ready

BrowserPanel SHALL automatically navigate to the initial challenge URL when the `disabled` prop transitions from `true` to `false`. This ensures the challenge content loads without requiring the user to manually click the "Go" button.

The auto-navigation SHALL call the same `navigate()` function used by manual URL navigation, dispatching a GET request to the current URL value.

#### Scenario: Browser auto-loads challenge on runtime ready

- **WHEN** BrowserPanel is mounted with `disabled: true`
- **AND** the `disabled` prop subsequently changes to `false`
- **THEN** BrowserPanel SHALL automatically dispatch a GET request to the initial URL (`https://challenge-<slug>.localhost/`)
- **AND** the response content SHALL be rendered in the browser viewport

#### Scenario: No duplicate navigation on re-render

- **WHEN** the `disabled` prop is already `false` at mount time
- **THEN** BrowserPanel SHALL NOT automatically navigate on mount
- **AND** navigation SHALL only occur when the user explicitly triggers it or when `disabled` transitions from `true` to `false`

## REMOVED Requirements

### Requirement: BrowserPanel navigates once on mount when disabled is already false

**Reason:** The existing `watch` on the `disabled` prop that triggers navigation on a `true` to `false` transition is sufficient. Navigating on mount when `disabled` is already `false` is unnecessary and could cause unexpected duplicate requests.

#### Scenario: Removal confirmed

- **WHEN** BrowserPanel mounts with `disabled` already set to `false`
- **THEN** BrowserPanel SHALL NOT automatically dispatch a navigation request
