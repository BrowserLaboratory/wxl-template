## ADDED Requirements

### Requirement: README is authored in English as source of truth

The `README.md` file SHALL be authored entirely in English. English is the source-of-truth language for this top-level document; any localized rendition (e.g., a future `README.zh-TW.md`) SHALL derive from the English source and not the reverse.

All Markdown structural elements — relative links, image references, heading anchors, code fences and their language tags, and YAML frontmatter (if any) — SHALL be preserved exactly when the source is updated; translation MUST NOT introduce dead links, missing assets, or anchor drift.

Technical identifiers that the broader project keeps in English (`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, `Service Worker`, `WebAssembly`, `Pyodide`, `VitePress`) SHALL appear in English in `README.md` regardless of surrounding prose translation choices.

#### Scenario: README contains no Chinese characters in source prose

- **WHEN** a maintainer runs `rg '[一-鿿]' README.md`
- **THEN** zero matches SHALL be reported (i.e., the file contains no CJK Unified Ideograph characters in its source)

#### Scenario: All relative links in README resolve after translation

- **WHEN** any link target referenced from `README.md` is followed (`./CONTRIBUTE.md`, `./docs/*`, image assets, etc.)
- **THEN** the target SHALL exist in the repository at the referenced path
- **AND** no link SHALL 404 in `pnpm docs:build` output for any path that VitePress also renders
