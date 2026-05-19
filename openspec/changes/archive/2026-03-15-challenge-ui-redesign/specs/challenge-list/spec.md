## MODIFIED Requirements

### Requirement: Challenge list displays each challenge as a card with metadata and a link

The challenge list layout SHALL render each challenge as a card showing: the challenge `id` as a zero-padded three-digit number (e.g., `#001`), the challenge title, a difficulty badge with semantic color coding, a category badge, and a link to the challenge page. Clicking the card SHALL navigate to the individual challenge page. Difficulty badges SHALL use the following semantic colors: `easy` = green tones, `medium` = yellow/amber tones, `hard` = red tones, `mystery` = purple tones. The card SHALL display a top-edge accent line using the `--ch-accent` color on hover.

#### Scenario: Challenge card displays correct metadata with id number

- **WHEN** the list page renders a challenge with `id: 1`, `title: "SQL Injection 入門"`, `difficulty: "easy"`, `category: "web"`
- **THEN** the card SHALL display `#001`, the title, a green-toned easy badge, and a blue-toned web badge

#### Scenario: Difficulty badge uses semantic color coding

- **WHEN** a challenge has `difficulty: "hard"`
- **THEN** its badge SHALL use red tones (dark: red-transparent bg, red fg; light: red-light bg, dark-red fg)

#### Scenario: Card hover shows accent top-edge line

- **WHEN** the user hovers over a challenge card
- **THEN** a top-edge line using the `--ch-accent` color SHALL become visible and the card border SHALL change to `--ch-border-hover`

#### Scenario: Clicking a challenge card navigates to the challenge

- **WHEN** the user clicks a challenge card
- **THEN** the browser SHALL navigate to the corresponding challenge page
