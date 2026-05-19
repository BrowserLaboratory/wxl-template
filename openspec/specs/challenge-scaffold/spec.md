# Spec: challenge-scaffold

## Purpose

Define the behaviour of the `create:challenge` CLI script, which scaffolds a new challenge directory structure, generates backend app skeletons, writes a frontmatter stub, and auto-runs keygen so the challenge is immediately usable in the dev server.

---

## Requirements

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


<!-- @trace
source: create-challenge-script
updated: 2026-03-16
code:
  - docs/challenge/sqli-demo/flag.txt
  - scripts/challenge-keygen.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - vitest.config.ts
  - docs/challenge/php-demo/index.php
  - scripts/create-challenge.ts
  - docs/challenge/fastapi-demo/app.py
  - tests/__mocks__/virtual-fs.ts
  - docs/challenge/sqli-demo/app.py
  - docs/challenge/php-demo.md
  - docs/challenge/php-demo/flag.txt
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - package.json
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
-->

---
### Requirement: Script creates challenge directory structure

The script SHALL create the following files under `docs/challenge/`:

```
docs/challenge/<slug>/
  src/
    app.py        (flask or fastapi backend)
    index.php     (php backend)
    flag.txt      (plaintext flag)
docs/challenge/<slug>/index.md  (frontmatter + description stub)
```

The script SHALL refuse to create files if `docs/challenge/<slug>/index.md` or `docs/challenge/<slug>.md` (legacy path) already exists, and SHALL exit with code 1 with an informative error.

#### Scenario: Fresh scaffold for flask backend

- **WHEN** the script is run with `--name my-challenge --backend flask` and no existing files
- **THEN** `docs/challenge/my-challenge/src/app.py`, `docs/challenge/my-challenge/src/flag.txt`, and `docs/challenge/my-challenge/index.md` SHALL be created

#### Scenario: Collision detection with index.md

- **WHEN** `docs/challenge/my-challenge/index.md` already exists
- **THEN** the script SHALL exit with code 1 without modifying any files

#### Scenario: Collision detection with legacy .md path

- **WHEN** `docs/challenge/my-challenge.md` already exists
- **THEN** the script SHALL exit with code 1 without modifying any files


<!-- @trace
source: create-challenge-script
updated: 2026-03-16
code:
  - docs/challenge/sqli-demo/flag.txt
  - scripts/challenge-keygen.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - vitest.config.ts
  - docs/challenge/php-demo/index.php
  - scripts/create-challenge.ts
  - docs/challenge/fastapi-demo/app.py
  - tests/__mocks__/virtual-fs.ts
  - docs/challenge/sqli-demo/app.py
  - docs/challenge/php-demo.md
  - docs/challenge/php-demo/flag.txt
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - package.json
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
-->

---
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


<!-- @trace
source: create-challenge-script
updated: 2026-03-16
code:
  - docs/challenge/sqli-demo/flag.txt
  - scripts/challenge-keygen.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - vitest.config.ts
  - docs/challenge/php-demo/index.php
  - scripts/create-challenge.ts
  - docs/challenge/fastapi-demo/app.py
  - tests/__mocks__/virtual-fs.ts
  - docs/challenge/sqli-demo/app.py
  - docs/challenge/php-demo.md
  - docs/challenge/php-demo/flag.txt
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - package.json
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
-->

---
### Requirement: Frontmatter stub uses correct PLACEHOLDER values

The generated `<slug>/index.md` SHALL contain a valid frontmatter block with:
- `layout: challenge`
- `backend` set to the chosen value
- `app: app.py` (or `index.php` for php), relative to the `src/` directory
- `date` set to the current timestamp in ISO 8601 format (e.g., `2025-03-01T10:30:00.000Z`)
- `tags: []` as an empty array placeholder

The frontmatter SHALL NOT contain a `flag_verifier` placeholder field, a `fs_key` placeholder field, or an `fs` field.

#### Scenario: Generated frontmatter is parseable by VitePress

- **WHEN** the scaffold creates `<slug>/index.md`
- **THEN** the frontmatter MUST be valid YAML and include all required fields accepted by `validateChallengeConfig`

#### Scenario: Generated frontmatter includes date and tags fields

- **WHEN** the scaffold creates `<slug>/index.md`
- **THEN** the frontmatter SHALL contain a `date` field with an ISO 8601 timestamp reflecting the current system time
- **AND** the frontmatter SHALL contain a `tags` field set to an empty array `[]`

#### Scenario: Generated frontmatter app field is relative to src directory

- **WHEN** the scaffold creates `<slug>/index.md` with `--backend flask`
- **THEN** the frontmatter `app` field SHALL be `app.py` (relative to `src/`), NOT `./<slug>/app.py`


<!-- @trace
source: extend-challenge-data-model
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
  - docs/challenge/php-demo.md
  - docs/challenge/sqli-demo.md
  - docs/public/icons/browser.svg
  - scripts/create-challenge.ts
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/guide/terminal.md
  - docs/index.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/guide/index.md
  - .vitepress/theme/components/HomeContent.vue
  - docs/challenge/fastapi-demo.md
  - docs/shared/challenges.data.ts
  - docs/guide/python.md
  - .vitepress/theme/Layout.vue
  - uno.config.ts
  - .vitepress/theme/components/ChallengeList.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/code.svg
  - .vitepress/theme/style.css
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/guide/network.md
  - docs/public/icons/terminal.svg
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Script auto-runs keygen after scaffold

After all files are created, the script SHALL invoke `challenge:keygen <slug>` automatically so the challenge is immediately usable in the dev server.

#### Scenario: Keygen runs on success

- **WHEN** all scaffold files are created without error
- **THEN** the script SHALL execute `pnpm challenge:keygen <slug>` and report the result

#### Scenario: Keygen failure is surfaced

- **WHEN** keygen fails (e.g., due to an unexpected error)
- **THEN** the script SHALL exit with a non-zero code and display the keygen error output

<!-- @trace
source: create-challenge-script
updated: 2026-03-16
code:
  - docs/challenge/sqli-demo/flag.txt
  - scripts/challenge-keygen.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - vitest.config.ts
  - docs/challenge/php-demo/index.php
  - scripts/create-challenge.ts
  - docs/challenge/fastapi-demo/app.py
  - tests/__mocks__/virtual-fs.ts
  - docs/challenge/sqli-demo/app.py
  - docs/challenge/php-demo.md
  - docs/challenge/php-demo/flag.txt
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - package.json
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
-->