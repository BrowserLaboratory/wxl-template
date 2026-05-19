## MODIFIED Requirements

### Requirement: Challenge scaffolding creates per-folder structure

The `create-challenge.ts` script SHALL scaffold challenges using the per-folder structure: `docs/challenge/<slug>/index.md` + `docs/challenge/<slug>/src/` containing the app file and `flag.txt`.

#### Scenario: Scaffold new Flask challenge

- **WHEN** user runs the create-challenge script with backend=flask and slug=my-challenge
- **THEN** the script creates `docs/challenge/my-challenge/index.md` with correct frontmatter (app: app.py, no fs field) and `docs/challenge/my-challenge/src/app.py` with Flask skeleton and `docs/challenge/my-challenge/src/flag.txt` with generated flag

### Requirement: Scaffold generates simplified frontmatter

The scaffolded `index.md` SHALL use the simplified frontmatter format with `app` as a src-relative path and no `fs` field.

#### Scenario: Scaffolded frontmatter format

- **WHEN** a challenge is scaffolded
- **THEN** the frontmatter contains `app: app.py` (not `./my-challenge/app.py`) and does NOT contain an `fs` field
