## ADDED Requirements

### Requirement: Site-smoke suite SHALL run against the built and previewed site

The site-smoke Playwright suite SHALL execute against the VitePress preview server (port 4173) that serves the output of the full build pipeline (`pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm docs:build`). It SHALL NOT run against the VitePress dev server (port 5173), because the dev server bypasses the production bundle and cannot surface build-time rendering failures (broken routing, unmounted layouts, missing challenge registration).

#### Scenario: Suite targets the preview server and waits for readiness

- **WHEN** the site-smoke suite is invoked
- **THEN** Playwright SHALL start `pnpm docs:preview` via its `webServer` configuration and SHALL wait until `http://localhost:4173` accepts connections before executing any test
- **AND** every navigation in the suite SHALL resolve against the `http://localhost:4173` base URL

### Requirement: Site-smoke configuration SHALL be isolated from the challenge-verify suite

A dedicated `playwright.site.config.ts` SHALL define the site-smoke suite with `testDir: tests/site-smoke` and `use.baseURL: http://localhost:4173`. It SHALL NOT reuse or modify `playwright.config.ts`, which is intentionally scoped to `tests/challenges` against port 5173 for the challenge-verify L3 flow. Running the site-smoke suite SHALL NOT execute any spec under `tests/challenges`, and running challenge-verify SHALL NOT execute any spec under `tests/site-smoke`.

#### Scenario: Suites do not cross-contaminate

- **WHEN** the site-smoke suite runs
- **THEN** only specs under `tests/site-smoke/` SHALL execute
- **AND** no spec under `tests/challenges/` SHALL execute

#### Scenario: Challenge-verify configuration is unaffected

- **WHEN** the existing challenge-verify L3 flow runs against `playwright.config.ts`
- **THEN** it SHALL continue to execute only `tests/challenges/` specs against port 5173
- **AND** the narrow scope declared in `playwright.config.ts` SHALL remain unchanged

### Requirement: Site-smoke SHALL assert the homepage and a reference challenge page render

The suite SHALL include at least two checks: (a) a homepage check that navigates to `/` and asserts that the home hero region and feature cards are visible without an uncaught page error; (b) a reference-challenge check that navigates to `/challenge/door-is-open/` and asserts that the challenge layout shell mounts and a stable challenge-page anchor element is visible. The reference challenge SHALL be `door-is-open` because it is an existing, stable reference challenge in the platform.

#### Scenario: Homepage renders

- **WHEN** the suite navigates to `/`
- **THEN** the home hero heading and feature cards SHALL be visible
- **AND** no uncaught page error SHALL occur during page load

#### Scenario: Reference challenge page mounts

- **WHEN** the suite navigates to `/challenge/door-is-open/`
- **THEN** the challenge layout shell SHALL mount
- **AND** a stable challenge-page anchor element SHALL be visible

#### Scenario: Broken homepage fails the suite

- **WHEN** the home hero region is removed or its matching selector no longer resolves
- **THEN** the homepage check SHALL fail
- **AND** the site-smoke suite SHALL exit with a non-zero status

### Requirement: Authors SHALL be able to run site-smoke locally via a single command

`package.json` SHALL define a `test:smoke` script equal to `playwright test --config playwright.site.config.ts`. The script SHALL assume the production site has already been built; the documented local invocation SHALL be `pnpm build && pnpm test:smoke`.

#### Scenario: Local single-command run

- **WHEN** an author runs `pnpm build && pnpm test:smoke` on a clean checkout
- **THEN** the suite SHALL start the preview server, run the homepage and reference-challenge checks, and exit 0 when all assertions pass
