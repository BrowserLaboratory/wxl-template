## ADDED Requirements

<!-- ChallengeLayout provides requirement moved to canonical location in Requirements section below -->


<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->


<!-- @trace
source: vitepress-platform-refactor
updated: 2026-03-15
code:
  - env.d.ts
  - vitest.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - tsconfig.json
  - docs/challenges/sqli-demo.md
  - package.json
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/composables/usePhpRuntime.ts
  - chall-wasm/python-bridge/python-runtime.ts
  - docs/challenges/php-demo.md
  - .vitepress/theme/index.ts
  - .vitepress/config.mts
  - docs/challenges/challenges.data.ts
  - chall-wasm/php-bridge/php-runtime.ts
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - docs/challenges/index.md
tests:
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - tests/e2e/flask-sqli.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
-->


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->


<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->


<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

<!-- Browser Panel simulates requirement moved to canonical location in Requirements section below -->


<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

<!-- Terminal Panel accepts curl and HTTPie-style commands — moved to canonical location below -->

<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

<!-- Repeater Panel provides raw HTTP request editing — moved to canonical location below -->

<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

<!-- White-box mode displays app source code viewer — moved to canonical location below -->

<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->

<!-- Challenge page displays flag submission form — moved to canonical location below -->

<!-- @trace
source: challenge-ux-and-attack-session
updated: 2026-03-23
code:
  - CONTRIBUTE.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/FlagSubmit.vue
  - README.md
  - Usage.md
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->

---

### Requirement: Challenge UI components use UnoCSS utility classes for styling

The Vue components `BrowserPanel.vue`, `TerminalPanel.vue`, `RepeatPanel.vue`, `FlagSubmit.vue`, and `ChallengeLayout.vue` SHALL have their `<style scoped>` blocks replaced with UnoCSS utility classes applied directly in their templates. Components SHALL reference design tokens via UnoCSS shortcuts or utility classes that resolve to `--ch-*` CSS custom properties. A minimal `<style scoped>` block is permitted only for CSS transitions or pseudo-element rules not expressible as UnoCSS utilities.

#### Scenario: Components render without scoped style blocks

- **WHEN** a challenge page loads
- **THEN** the Browser Panel, Terminal Panel, Repeater Panel, Flag Submit, and ChallengeLayout SHALL be correctly styled using only UnoCSS-generated CSS classes (with the exception of any transition or pseudo-element rules)

#### Scenario: Dark mode applies via CSS var change, not class toggle

- **WHEN** the user switches between dark and light mode
- **THEN** all challenge UI components SHALL update their visual appearance through CSS custom property resolution without requiring Vue component re-renders or class changes


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---

### Requirement: Challenge UI applies the platform color palette

The challenge UI components SHALL visually reflect the platform's dual-theme palette: Midnight Indigo in dark mode (background `#0f0f23`, accent `#6366f1`) and Enterprise Indigo in light mode (background `#eef2ff`, accent `#4338ca`). The right-column interaction area background SHALL be visually distinct from the left-column description area by using the `--ch-bg-panel` token.

#### Scenario: Dark mode renders Midnight Indigo palette

- **WHEN** the `.dark` class is active
- **THEN** the challenge page background SHALL resolve to `#0f0f23` and interactive elements SHALL use `#6366f1` as the accent color

#### Scenario: Light mode renders Enterprise Indigo palette

- **WHEN** the `.dark` class is absent
- **THEN** the challenge page background SHALL resolve to `#eef2ff` and interactive elements SHALL use `#4338ca` as the accent color

## Requirements

<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL expose a shared challenge workspace with five default tabs in canonical order: Browser, Network, Repeater, Terminal, and Code. If challenge frontmatter defines a `tools` allowlist, the tab bar SHALL render only the listed tools while preserving that canonical order. All request-emitting panels SHALL call source-specific wrappers over a shared `trackedDispatch` pipeline, and the Network panel SHALL render the traffic log recorded by that pipeline.

#### Scenario: Default challenge shows the full tool set

- **WHEN** challenge frontmatter omits the `tools` field
- **THEN** the tab bar SHALL display Browser, Network, Repeater, Terminal, and Code

#### Scenario: Frontmatter filters visible tabs

- **WHEN** challenge frontmatter sets `tools: ['browser', 'network', 'repeater']`
- **THEN** the tab bar SHALL hide Terminal and Code while keeping the remaining tabs in canonical order

#### Scenario: Network panel sends a request to Repeater

- **WHEN** the Network panel emits a Send to Repeater action
- **THEN** ChallengeLayout SHALL inject the raw request into Repeater and switch the active tab to Repeater


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide a URL bar pre-populated with `https://challenge-<slug>.localhost/` and a Go action that issues a GET request through the injected dispatch function. HTML responses SHALL render inside a sandboxed `iframe` using `sandbox="allow-scripts allow-forms"`. The Browser Panel SHALL inject its own interceptor script into HTML responses so that link clicks and form submissions can be relayed to the parent without requiring `allow-same-origin`.

#### Scenario: HTML response renders in a sandboxed iframe

- **WHEN** the challenge runtime returns `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the response in an iframe with `allow-scripts allow-forms` and no `allow-same-origin`

#### Scenario: Link navigation stays inside the panel

- **WHEN** a user clicks a link inside the rendered HTML
- **THEN** the injected interceptor SHALL post the navigation to the parent, the URL bar SHALL update, and the Browser Panel SHALL dispatch a new GET request without leaving the page


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Browser Panel intercepts HTML form submissions inside the iframe

The Browser Panel SHALL handle form submissions by injecting a postMessage-based interceptor into rendered HTML. The interceptor SHALL prevent native iframe navigation, resolve the form `action` against `https://challenge-<slug>.localhost/`, preserve the declared HTTP method, and serialize fields as query parameters for `GET`, `application/x-www-form-urlencoded` for standard `POST`, or `FormData` for `multipart/form-data`.

#### Scenario: GET form appends fields to the query string

- **WHEN** a user submits a form with `method="GET"` inside the rendered iframe
- **THEN** the Browser Panel SHALL dispatch a GET request whose URL contains the serialized form fields and whose body is empty

#### Scenario: Multipart form keeps FormData transport

- **WHEN** a user submits a form with `method="POST"` and `enctype="multipart/form-data"`
- **THEN** the Browser Panel SHALL dispatch a POST request whose body is a `FormData` object and SHALL NOT set the multipart boundary header manually


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Terminal Panel accepts curl and HTTPie-style commands

The Terminal Panel SHALL be implemented as `WxlshPanel.vue` using xterm.js as the display layer and the `wxlsh` command dispatcher. It SHALL display the brand name "wxlsh" (not "bash") and a startup banner on first render. The previous `<div>`-based terminal UI and TypeScript CLI parser SHALL be removed. All terminal functionality SHALL be provided by `WxlshPanel` as specified in the `wxlsh-terminal` capability spec.

#### Scenario: Terminal tab renders xterm.js terminal

- **WHEN** the user clicks the "Terminal" tab
- **THEN** the panel SHALL render an xterm.js canvas with the wxlsh banner

#### Scenario: curl command sends HTTP request via dispatch

- **WHEN** the user types `curl https://challenge-sqli.localhost/users` and presses Enter
- **THEN** the Terminal Panel SHALL send a GET request and display the response headers and body in the terminal output

#### Scenario: Invalid command shows usage hint

- **WHEN** a user types an unrecognized command
- **THEN** the Terminal Panel SHALL display "wxlsh: <command>: command not found" and suggest using `help`

---
### Requirement: Repeater Panel provides raw HTTP request editing

The Repeater Panel SHALL retain its core functionality (raw HTTP/1.1 request editing, send, response display, named snapshots). The visual presentation SHALL be upgraded: snapshot list SHALL be displayed as a named sidebar list rather than bottom inline chips, the "Save" button SHALL prompt the user for a snapshot name, and the textarea and response area SHALL use consistent monospace typography with improved line-height and border treatment.

#### Scenario: Raw request is parsed and sent

- **WHEN** a user edits a raw HTTP request in the Repeater Panel and clicks "Send"
- **THEN** the panel SHALL parse the raw text into method, path, headers, and body, then dispatch via `dispatch`

#### Scenario: Raw response is displayed

- **WHEN** the response is received
- **THEN** the Repeater Panel SHALL display the status line, all response headers, and the raw body

#### Scenario: Named snapshot can be saved and restored

- **WHEN** a user clicks "Save", enters a name, and confirms
- **THEN** the snapshot SHALL appear in the sidebar list and selecting it SHALL restore the request content

---
### Requirement: White-box mode displays app source code viewer

When `source_visible: true`, the challenge page SHALL display a read-only source code viewer panel showing the app's source code with syntax highlighting. When `source_visible: false` or omitted, the source viewer SHALL NOT be rendered and no source code SHALL be accessible via the DOM.

#### Scenario: White-box source viewer is shown

- **WHEN** a challenge page loads with `source_visible: true`
- **THEN** the page SHALL render a syntax-highlighted, read-only code block containing the full app source (Python or PHP)

#### Scenario: Black-box source viewer is absent

- **WHEN** a challenge page loads with `source_visible: false` or the field is omitted
- **THEN** no source viewer element SHALL exist in the DOM and no readable app source SHALL be accessible via `document.querySelector` or JavaScript

---
### Requirement: Challenge page displays flag submission form

The challenge page SHALL include a persistent flag submission form below the interaction panels. The form SHALL have a text input and a submit button. On submission, it SHALL call the flag verification function and display a success or failure indicator.

When the flag is correct, the success state SHALL additionally display a "下載攻擊紀錄" (Download Attack Log) button. Clicking this button SHALL invoke an `onExport` callback prop provided by the parent layout, which triggers the JSON file download of the current attack session.

`FlagSubmit.vue` SHALL accept an optional `onExportNotes?: () => void` prop alongside the existing `onExport` prop. When `onExportNotes` is provided and the challenge is in the `success` state, a `下載滲透筆記` button SHALL be rendered after the existing `下載攻擊紀錄` button. Clicking the `下載滲透筆記` button SHALL invoke `onExportNotes()`.

#### Scenario: Correct flag shows success message and export button

- **WHEN** a user submits the correct flag
- **THEN** the UI SHALL display a success indicator
- **AND** a "下載攻擊紀錄" button SHALL appear in the success state

#### Scenario: Export button triggers attack session download

- **WHEN** a user clicks "下載攻擊紀錄" after solving the challenge
- **THEN** the `onExport` prop callback SHALL be invoked
- **AND** the browser SHALL initiate a JSON file download of the attack session

#### Scenario: Notes download button appears after solving when prop is provided

- **WHEN** the challenge is solved and `onExportNotes` prop is set
- **THEN** the `下載滲透筆記` button SHALL be visible in the success state UI

#### Scenario: Notes download button is absent when prop is not provided

- **WHEN** `onExportNotes` is `undefined`
- **THEN** no notes download button SHALL be rendered

#### Scenario: Clicking the notes download button invokes the callback

- **WHEN** the user clicks `下載滲透筆記`
- **THEN** `onExportNotes()` SHALL be called, triggering `pentestNotes.downloadMarkdown(title, slug)` in `ChallengeLayout`

#### Scenario: Incorrect flag shows failure message without revealing answer

- **WHEN** a user submits an incorrect flag
- **THEN** the UI SHALL display a failure indicator with no hint about the correct flag
- **AND** no export button SHALL be displayed

---
### Requirement: BrowserPanel sends realistic browser-like HTTP requests

Every request dispatched from `BrowserPanel.vue` SHALL include a complete set of simulated browser headers for display in the Network Traffic panel. `BrowserPanel` SHALL attach request-context metadata via `X-Wxlsh-Context` and `X-Wxlsh-Referer` headers; `useTrafficLog.wrap()` SHALL consume these metadata headers (stripping them before dispatch to the runtime), then synthesize the full simulated header set — including static browser identity headers and context-specific dynamic headers — for the recorded `TrafficEntry`. The synthesized headers SHALL follow HTTP/1.1 Title-Case convention and Chrome's conventional header ordering (Host first, Connection second, Accept-Encoding and Accept-Language last).

#### Scenario: Address bar navigation includes full browser headers

- **WHEN** a user navigates to a URL via the BrowserPanel address bar
- **THEN** the dispatched request SHALL include `User-Agent`, `Accept`, `Accept-Language`, `Accept-Encoding`, `Connection`, `Host`, `Sec-Ch-Ua`, `Sec-Ch-Ua-Mobile`, `Sec-Ch-Ua-Platform`, `Upgrade-Insecure-Requests`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: none`, and `Sec-Fetch-User: ?1`

#### Scenario: Link click includes Referer and same-origin Sec-Fetch headers

- **WHEN** a user clicks a link inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the current page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Site: same-origin`

#### Scenario: Form GET submission includes Referer and navigation headers

- **WHEN** a user submits a GET form inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the form page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: Form POST submission includes Origin, Referer, and Content-Length

- **WHEN** a user submits a POST form with `application/x-www-form-urlencoded` encoding inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Origin` set to the challenge origin, `Referer` set to the form page URL, `Content-Type: application/x-www-form-urlencoded`, `Content-Length` reflecting the byte length of the encoded body, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: NetworkPanel records complete headers from BrowserPanel requests

- **WHEN** BrowserPanel dispatches any request through `trackedDispatch`
- **THEN** the NetworkPanel traffic log SHALL display a header list matching the full set of browser-simulated headers defined by `buildBrowserRequest()`

<!-- @trace
source: simulate-browser-request-headers
updated: 2026-03-23
code:
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
-->

---
### Requirement: ChallengeLayout renders a NotesButton in the header

`ChallengeLayout.vue` SHALL render a `NotesButton` component in the right side of the challenge header, positioned to be visually symmetric with the `← Challenges` back link on the left. The button SHALL be absolutely positioned within the header's flex container.

The `NotesButton` SHALL receive `noteCount` from `pentestNotes.noteCount`. Clicking the button SHALL set `notesModalVisible.value = true`.

#### Scenario: NotesButton is visible on challenge page load

- **WHEN** a user opens a challenge page
- **THEN** the `NotesButton` SHALL be visible in the header area to the right of the challenge title

#### Scenario: Clicking NotesButton opens the modal

- **WHEN** the user clicks the `NotesButton`
- **THEN** `notesModalVisible` SHALL be set to `true` and the `NotesModal` SHALL become visible


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: ChallengeLayout integrates usePentestNotes and NotesModal

`ChallengeLayout.vue` SHALL instantiate `usePentestNotes(attackSession, slug)` and call `pentestNotes.init(slug.value)` after `attackSession.init()` during `onMounted`. It SHALL render `<NotesModal>` (conditionally with `v-if="notesModalVisible"`) just before the root closing `</div>`. The modal SHALL receive `pentestNotes` as a prop and emit a `close` event that sets `notesModalVisible.value = false`.

#### Scenario: Pentest notes are initialized with attack session

- **WHEN** the challenge page mounts
- **THEN** `pentestNotes.init(slug)` SHALL be called after `attackSession.init()` so notes are loaded from IndexedDB before the modal is first opened

#### Scenario: NotesModal is not rendered when closed

- **WHEN** `notesModalVisible` is `false`
- **THEN** the `NotesModal` component SHALL NOT be present in the DOM


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: ChallengeLayout threads executionId through code execution dispatch

`ChallengeLayout.vue` SHALL maintain a module-level variable `let currentExecutionId: string | null = null`. Before invoking the code execution callback (`onCodeExecuted`), it SHALL generate `currentExecutionId = crypto.randomUUID()`. After the execution completes, it SHALL reset `currentExecutionId = null`.

The `makeSourceDispatch('code')` function SHALL read `currentExecutionId` and pass it as the `executionId` parameter when calling `attackSession.addHttpEvent(entry, 'code', currentExecutionId)`.

#### Scenario: HTTP requests made during code execution share the executionId

- **WHEN** Python code executes and makes an HTTP request via the `requests` stub
- **THEN** both the `code_execution` event and all `http_request` events generated during that execution SHALL share the same non-null `executionId`

#### Scenario: HTTP requests outside code execution have no executionId

- **WHEN** an HTTP request is made from the Browser panel, Repeater panel, or terminal (not from code execution)
- **THEN** the resulting `http_request` event SHALL have no `executionId` field


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/NotesButton.test.ts
  - tests/unit/components/NotesModal.test.ts
  - tests/unit/components/FlagSubmit.test.ts
-->


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: FlagSubmit supports a notes export download action

`FlagSubmit.vue` SHALL accept an optional `onExportNotes?: () => void` prop alongside the existing `onExport` prop. When `onExportNotes` is provided and the challenge is in the `success` state, a `下載滲透筆記` button SHALL be rendered after the existing `下載攻擊紀錄` button. Clicking the `下載滲透筆記` button SHALL invoke `onExportNotes()`.

#### Scenario: Notes download button appears after solving when prop is provided

- **WHEN** the challenge is solved and `onExportNotes` prop is set
- **THEN** the `下載滲透筆記` button SHALL be visible in the success state UI

#### Scenario: Notes download button is absent when prop is not provided

- **WHEN** `onExportNotes` is `undefined`
- **THEN** no notes download button SHALL be rendered

#### Scenario: Clicking the notes download button invokes the callback

- **WHEN** the user clicks `下載滲透筆記`
- **THEN** `onExportNotes()` SHALL be called, triggering `pentestNotes.downloadMarkdown(title, slug)` in `ChallengeLayout`

<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: MergedNav component

The system SHALL provide a MergedNav component that renders the unified navigation bar on challenge pages, containing brand, navigation links, challenge metadata, and utility controls.

#### Scenario: MergedNav renders on challenge page

- **WHEN** a challenge page is loaded
- **THEN** the MergedNav component renders with all required elements based on the current viewport breakpoint


<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: DescriptionModal component

The system SHALL provide a DescriptionModal component for Mobile viewports that renders the challenge description as a fullscreen overlay.

#### Scenario: DescriptionModal opens and closes

- **WHEN** user opens the description modal on Mobile
- **THEN** a fullscreen overlay appears with scrollable challenge content and a close button
- **AND** clicking close dismisses the modal


<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: BrowserChrome component

The system SHALL provide a BrowserChrome component that renders the browser-like URL bar, adapting its layout between Desktop (capsule with nav buttons) and Mobile (minimal input + go button).

#### Scenario: BrowserChrome adapts to viewport

- **WHEN** viewport changes from Desktop to Mobile
- **THEN** the BrowserChrome switches from capsule layout (← → ↻ + capsule URL + Go) to minimal layout (URL input + → button)

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: BrowserPanel dispatches HTTP requests to the challenge runtime

The BrowserPanel SHALL call the injected `dispatch` prop directly instead of issuing browser `fetch()` requests that depend on Service Worker interception. The panel SHALL wrap dispatches in `browserFetch()` so that `X-Wxlsh-Cookie` is attached before the request, `X-Wxlsh-Set-Cookie` is harvested after the response, and up to five redirects are followed with the stored cookie jar.

#### Scenario: Browser request succeeds without a Service Worker fetch round-trip

- **WHEN** the user presses Go in the Browser Panel
- **THEN** the panel SHALL construct a `Request` object and pass it to the injected `dispatch` function directly

#### Scenario: Redirect reuses the cookie jar

- **WHEN** a response returns `302`, `Location: /files`, and `X-Wxlsh-Set-Cookie: session_user=guest; Path=/`
- **THEN** the BrowserPanel SHALL store the cookie, follow the redirect as a GET request, and include `X-Wxlsh-Cookie: session_user=guest` on the next dispatch

<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->