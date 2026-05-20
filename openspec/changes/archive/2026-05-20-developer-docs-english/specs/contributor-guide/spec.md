## ADDED Requirements

### Requirement: CONTRIBUTE guide is authored in English as source of truth

The `CONTRIBUTE.md` file SHALL be authored entirely in English. English is the source-of-truth language for the contributor onboarding document; any localized rendition SHALL derive from the English source and not the reverse.

All Markdown structural elements — relative links, image references, heading anchors, code fences and their language tags, and YAML frontmatter (if any) — SHALL be preserved exactly when the source is updated; translation MUST NOT introduce dead links, missing assets, or anchor drift.

Illustrative example strings that document the project's own conventions in another language MAY appear verbatim inside example blocks (e.g., showing what a `/tw-emoji-commit` Traditional Chinese commit subject looks like), because their value is to demonstrate the convention rather than to convey prose. Such examples SHALL be quoted or fenced so they read as data, not as document prose.

Technical identifiers that the broader project keeps in English (`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, `branch`, `merge`, `rebase`, `fork`) SHALL appear in English in `CONTRIBUTE.md` regardless of surrounding prose translation choices.

#### Scenario: CONTRIBUTE prose contains no Chinese characters outside example blocks

- **WHEN** a maintainer runs `rg '[一-鿿]' CONTRIBUTE.md`
- **THEN** every match SHALL fall inside a fenced code block or a quoted example string demonstrating a Traditional Chinese commit / PR convention
- **AND** no match SHALL appear in prose paragraphs, headings, list items, or table cells outside such examples

#### Scenario: All relative links in CONTRIBUTE resolve after translation

- **WHEN** any link target referenced from `CONTRIBUTE.md` is followed
- **THEN** the target SHALL exist in the repository at the referenced path
