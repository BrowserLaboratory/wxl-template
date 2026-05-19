## ADDED Requirements

### Requirement: Per-folder challenge structure

Each challenge SHALL be organized as a self-contained directory under `docs/challenge/<slug>/` containing an `index.md` file and a `src/` subdirectory with all application files.

#### Scenario: Valid challenge directory

- **WHEN** a challenge directory `docs/challenge/fastapi-demo/` exists
- **THEN** it SHALL contain `index.md` (challenge description + frontmatter) and `src/` (application source files)

### Requirement: Automatic src scanning

The build pipeline SHALL automatically recursively scan the `src/` directory and include all files in the encrypted virtual FS payload, with paths relative to `src/` mapped as virtual FS paths.

#### Scenario: Auto-scan maps files to virtual paths

- **WHEN** `src/` contains `app.py`, `flag.txt`, `templates/index.html`, and `lib/db.py`
- **THEN** the build pipeline creates FS entries: `__app__` (from app.py), `/flag.txt`, `/templates/index.html`, `/lib/db.py`

### Requirement: Built-in default exclusions

The build pipeline SHALL apply a built-in exclusion list when scanning `src/`, excluding: `__pycache__/`, `*.pyc`, `*.pyo`, `*.egg-info/`, `.venv/`, `venv/`, `.DS_Store`, `Thumbs.db`, `*.swp`, `*.swo`, `*~`, `.git/`, `.fsignore`.

#### Scenario: Python cache excluded

- **WHEN** `src/__pycache__/module.cpython-311.pyc` exists
- **THEN** it is not included in the WASM payload

### Requirement: Custom .fsignore support

The build pipeline SHALL read `src/.fsignore` (if present) and apply its patterns (gitignore syntax) as additional exclusions beyond the built-in defaults.

#### Scenario: fsignore excludes test data

- **WHEN** `src/.fsignore` contains `test_data/` and `src/test_data/sample.json` exists
- **THEN** `sample.json` is not included in the WASM payload

### Requirement: Simplified frontmatter app field

The `app` frontmatter field SHALL specify the application entry point as a path relative to `src/` (e.g., `app: app.py`).

#### Scenario: Relative app path resolution

- **WHEN** frontmatter contains `app: app.py`
- **THEN** the build pipeline reads `docs/challenge/<slug>/src/app.py` as the application entry point

### Requirement: Configurable flag file location

The `flag` frontmatter field (optional, default `flag.txt`) SHALL specify the flag file location relative to `src/`.

#### Scenario: Default flag location

- **WHEN** frontmatter does not contain a `flag` field
- **THEN** the build pipeline reads `src/flag.txt` as the flag source for PBKDF2 verifier derivation

#### Scenario: Custom flag location

- **WHEN** frontmatter contains `flag: secret/flag.txt`
- **THEN** the build pipeline reads `src/secret/flag.txt` as the flag source

### Requirement: fs frontmatter field removed

The `fs` frontmatter field SHALL be removed. The build pipeline SHALL NOT read or process an `fs` mapping. All files are discovered via automatic src scanning.

#### Scenario: fs field ignored

- **WHEN** frontmatter contains an `fs` field (legacy)
- **THEN** the build pipeline logs a deprecation warning and ignores it

### Requirement: Slug derived from directory name

The challenge slug SHALL be derived from the directory name (e.g., `docs/challenge/fastapi-demo/` → slug `fastapi-demo`), not from the markdown filename.

#### Scenario: Slug from directory

- **WHEN** the build pipeline processes `docs/challenge/my-challenge/index.md`
- **THEN** the derived slug is `my-challenge`
