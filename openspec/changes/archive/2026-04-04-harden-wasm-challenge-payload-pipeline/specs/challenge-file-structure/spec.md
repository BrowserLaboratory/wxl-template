## MODIFIED Requirements

### Requirement: Automatic src scanning

The build pipeline SHALL recursively scan the `src/` directory and include every non-excluded file in the encrypted virtual FS payload as raw bytes. The file referenced by `app` SHALL be stored separately as `__app__`; every other scanned file SHALL retain its exact byte content and its virtual path relative to `src/`, prefixed with `/`.

#### Scenario: Auto-scan preserves nested virtual paths

- **WHEN** `src/` contains `app.py`, `flag.txt`, `templates/index.html`, and `lib/db.py`
- **THEN** the build pipeline SHALL create `__app__`, `/flag.txt`, `/templates/index.html`, and `/lib/db.py` entries with their original directory structure preserved

#### Scenario: Binary asset survives auto-scan unchanged

- **WHEN** `src/static/logo.png` is included by auto-scan
- **THEN** the encrypted payload SHALL preserve the exact bytes of `logo.png` without any UTF-8 transcoding step
