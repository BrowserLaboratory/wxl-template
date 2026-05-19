## ADDED Requirements

### Requirement: Challenge UI components use UnoCSS utility classes for styling

The Vue components `BrowserPanel.vue`, `TerminalPanel.vue`, `RepeatPanel.vue`, `FlagSubmit.vue`, and `ChallengeLayout.vue` SHALL have their `<style scoped>` blocks replaced with UnoCSS utility classes applied directly in their templates. Components SHALL reference design tokens via UnoCSS shortcuts or utility classes that resolve to `--ch-*` CSS custom properties. A minimal `<style scoped>` block is permitted only for CSS transitions or pseudo-element rules not expressible as UnoCSS utilities.

#### Scenario: Components render without scoped style blocks

- **WHEN** a challenge page loads
- **THEN** the Browser Panel, Terminal Panel, Repeater Panel, Flag Submit, and ChallengeLayout SHALL be correctly styled using only UnoCSS-generated CSS classes (with the exception of any transition or pseudo-element rules)

#### Scenario: Dark mode applies via CSS var change, not class toggle

- **WHEN** the user switches between dark and light mode
- **THEN** all challenge UI components SHALL update their visual appearance through CSS custom property resolution without requiring Vue component re-renders or class changes

---

### Requirement: Challenge UI applies the platform color palette

The challenge UI components SHALL visually reflect the platform's dual-theme palette: Midnight Indigo in dark mode (background `#0f0f23`, accent `#6366f1`) and Enterprise Indigo in light mode (background `#eef2ff`, accent `#4338ca`). The right-column interaction area background SHALL be visually distinct from the left-column description area by using the `--ch-bg-panel` token.

#### Scenario: Dark mode renders Midnight Indigo palette

- **WHEN** the `.dark` class is active
- **THEN** the challenge page background SHALL resolve to `#0f0f23` and interactive elements SHALL use `#6366f1` as the accent color

#### Scenario: Light mode renders Enterprise Indigo palette

- **WHEN** the `.dark` class is absent
- **THEN** the challenge page background SHALL resolve to `#eef2ff` and interactive elements SHALL use `#4338ca` as the accent color
