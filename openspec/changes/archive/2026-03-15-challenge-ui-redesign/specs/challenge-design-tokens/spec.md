## ADDED Requirements

### Requirement: Platform defines a CSS custom property token system as single source of truth

The platform SHALL define all visual design tokens as CSS custom properties with the `--ch-` prefix in `.vitepress/theme/style.css`. The `:root` selector SHALL define light mode tokens and the `.dark` selector SHALL define dark mode tokens. VitePress brand variables (`--vp-c-brand-1`, `--vp-c-brand-2`, `--vp-c-brand-3`, `--vp-c-brand-soft`) SHALL be overridden to reference the corresponding `--ch-accent-*` tokens.

#### Scenario: Dark mode tokens activate under .dark class

- **WHEN** VitePress applies the `.dark` class to the document root
- **THEN** all `--ch-*` CSS custom properties SHALL resolve to the Midnight Indigo dark palette values

#### Scenario: Light mode tokens are active by default

- **WHEN** the `.dark` class is absent from the document root
- **THEN** all `--ch-*` CSS custom properties SHALL resolve to the Enterprise Indigo light palette values

#### Scenario: VitePress brand variables delegate to ch-accent tokens

- **WHEN** any VitePress default component references `--vp-c-brand-1`
- **THEN** the resolved color SHALL match `--ch-accent-1` for the current mode

---

### Requirement: UnoCSS config references CSS vars for color tokens

The `uno.config.ts` SHALL configure `theme.colors` entries that reference `--ch-*` CSS custom properties using `var()` syntax. The config SHALL also define shortcuts for commonly used component patterns (e.g., `ch-card`, `ch-badge-easy`, `ch-badge-medium`, `ch-badge-hard`, `ch-badge-mystery`, `ch-tab-btn`, `ch-tab-btn-active`). The `content.filesystem` SHALL include `**/*.{vue,md,ts}` to ensure all utility classes used in component templates are scanned.

#### Scenario: UnoCSS color utilities resolve via CSS vars

- **WHEN** a Vue component applies a UnoCSS color utility that references a `--ch-*` var
- **THEN** the rendered CSS SHALL use `var(--ch-*)` and respond to dark/light mode switching without additional class changes

#### Scenario: ch-badge-easy shortcut applies correct semantic color

- **WHEN** the `ch-badge-easy` shortcut is applied to an element
- **THEN** the element SHALL display with the easy difficulty color (green tones in both modes)
