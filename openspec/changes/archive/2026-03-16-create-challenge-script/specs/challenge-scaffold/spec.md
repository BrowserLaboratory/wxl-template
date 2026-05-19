## ADDED Requirements

### Requirement: CLI accepts required and optional arguments

The `create:challenge` script SHALL accept the following CLI arguments:
- `--name <slug>` (required): kebab-case challenge identifier
- `--title <string>` (optional): human-readable title; defaults to slug converted to Title Case
- `--backend <flask|fastapi|php>` (optional): defaults to `flask`
- `--difficulty <easy|medium|hard>` (optional): defaults to `easy`
- `--flag <string>` (optional): plaintext flag; if omitted, generates `FLAG{<slug>_<random8hex>}`

The script SHALL exit with a non-zero code and a descriptive error message if `--name` is missing or if `--backend` is not one of `flask`, `fastapi`, `php`.

#### Scenario: Minimal invocation with only --name

- **WHEN** the script is run with `--name xss-basic` and no other arguments
- **THEN** it SHALL create all files using `flask` backend, `easy` difficulty, and an auto-generated flag

#### Scenario: All arguments provided

- **WHEN** the script is run with `--name sqli-advanced --backend flask --difficulty hard --flag "FLAG{test}" --title "Advanced SQLi"`
- **THEN** it SHALL use all provided values without auto-generation

#### Scenario: Invalid backend value

- **WHEN** the script is run with `--backend django`
- **THEN** it SHALL exit with code 1 and print an error listing valid backends

#### Scenario: Missing --name argument

- **WHEN** the script is run without `--name`
- **THEN** it SHALL exit with code 1 and instruct the user to provide `--name`

### Requirement: Script creates challenge directory structure

The script SHALL create the following files under `docs/challenge/`:

```
docs/challenge/<slug>/
  app.py        (flask or fastapi backend)
  index.php     (php backend)
  flag.txt      (plaintext flag)
docs/challenge/<slug>.md  (frontmatter + description stub)
```

The script SHALL refuse to create files if `docs/challenge/<slug>/` or `docs/challenge/<slug>.md` already exists, and SHALL exit with code 1 with an informative error.

#### Scenario: Fresh scaffold for flask backend

- **WHEN** the script is run with `--name my-challenge --backend flask` and no existing files
- **THEN** `docs/challenge/my-challenge/app.py`, `docs/challenge/my-challenge/flag.txt`, and `docs/challenge/my-challenge.md` SHALL be created

#### Scenario: Collision detection

- **WHEN** `docs/challenge/my-challenge.md` already exists
- **THEN** the script SHALL exit with code 1 without modifying any files

### Requirement: App skeleton is runnable and reads the flag

Each generated app skeleton SHALL be a minimal but functional application that:
- For `flask`: a Flask app with a `GET /` route returning an HTML page that reads from `/flag.txt`
- For `fastapi`: a FastAPI app with a `GET /` route returning an HTML page that reads from `/flag.txt`
- For `php`: a PHP script with a default page that demonstrates reading from `/flag.txt`

The skeleton SHALL include a comment indicating it is a scaffold and where the vulnerability SHALL be added.

#### Scenario: Flask skeleton imports Flask and defines a route

- **WHEN** the flask skeleton is generated
- **THEN** `app.py` SHALL contain `from flask import Flask` and a `@app.route('/')` decorated function

#### Scenario: FastAPI skeleton imports FastAPI and defines a route

- **WHEN** the fastapi skeleton is generated
- **THEN** `app.py` SHALL contain `from fastapi import FastAPI` and an `@app.get('/')` decorated function

#### Scenario: PHP skeleton contains PHP opening tag and flag read

- **WHEN** the php skeleton is generated
- **THEN** `index.php` SHALL start with `<?php` and contain a reference to `/flag.txt`

### Requirement: Frontmatter stub uses correct PLACEHOLDER values

The generated `<slug>.md` SHALL contain a valid frontmatter block with:
- `layout: challenge`
- `backend` set to the chosen value
- `flag_verifier: "PLACEHOLDER_RUN_pnpm_challenge_keygen"`
- `fs_key: "PLACEHOLDER_RUN_pnpm_challenge_keygen"`
- `app: ./<slug>/app.py` (or `index.php` for php)
- `fs: { /flag.txt: ./<slug>/flag.txt }`

#### Scenario: Generated frontmatter is parseable by VitePress

- **WHEN** the scaffold creates `<slug>.md`
- **THEN** the frontmatter MUST be valid YAML and include all required fields accepted by `validateChallengeConfig`

### Requirement: Script auto-runs keygen after scaffold

After all files are created, the script SHALL invoke `challenge:keygen <slug>` automatically so the challenge is immediately usable in the dev server.

#### Scenario: Keygen runs on success

- **WHEN** all scaffold files are created without error
- **THEN** the script SHALL execute `pnpm challenge:keygen <slug>` and report the result

#### Scenario: Keygen failure is surfaced

- **WHEN** keygen fails (e.g., due to an unexpected error)
- **THEN** the script SHALL exit with a non-zero code and display the keygen error output
