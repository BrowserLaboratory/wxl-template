## 1. Spec 路徑與結構修正

- [x] 1.1 更新 `openspec/specs/platform-documentation/spec.md`：修正 "Getting Started page provides platform introduction and quick start guide"、"Python Guide page documents Code Editor and Pyodide environment"、"Terminal Guide page documents built-in terminal commands"、"Network Guide page documents Traffic Log and Repeater workflow" 四個 requirement 的檔案路徑從 `docs/docs/*.md` 改為 `docs/guide/*.md`
- [x] 1.2 更新 `openspec/specs/challenge-scaffold/spec.md`：修正 "Script creates challenge directory structure" requirement 改為 per-folder `src/` 結構、markdown 為 `index.md`；修正 "Frontmatter stub uses correct PLACEHOLDER values" requirement 移除 `fs`/`flag_verifier`/`fs_key` 欄位，`app` 改為相對 `src/` 路徑

## 2. Runtime 與 Service Worker 修正

- [x] 2.1 更新 `openspec/specs/python-asgi-runtime/spec.md`：修正 "ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app" 改為 Python-in-Pyodide 描述；修正 "ASGI bridge collects response events and returns HTTP response"；修正 "Python ASGI runtime module resides in .vitepress/composables" 的 `initialize()` 簽名；修正 "Python ASGI runtime installs micropip packages before app execution" 的 packages 參數
- [x] 2.2 更新 `openspec/specs/php-runtime/spec.md`：修正 "PHP Runtime handles HTTP request method and body" 的 raw body 改為 `$GLOBALS['_RAW_INPUT']`；修正 "PHP runtime module resides in .vitepress/composables" 的 `initialize()` 簽名
- [x] 2.3 更新 `openspec/specs/service-worker-router/spec.md`：修正 "Router dispatches to correct runtime based on challenge type" 的 PHP dispatch 改為 port-based relay
- [x] 2.4 更新 `openspec/specs/challenge-runtime-init/spec.md`：修正 "Challenge page initializes WASM runtime on mount" 移除 `wasm_fs_reset(slug)` SPA 導航需求
- [x] 2.5 更新 `openspec/specs/fastapi-challenge/spec.md`：修正 "FastAPI demo challenge is available as a working example" 的 `packages` frontmatter 改為 optional，記錄 BASE_PACKAGES fallback

## 3. Challenge UI 行為修正

- [x] 3.1 更新 `openspec/specs/challenge-ui/spec.md`：修正 "ChallengeLayout provides three switchable interaction panels" 和 "Browser Panel simulates a web browser address bar and viewport" 的 URL protocol 改為 `https://`；移除 "Browser Panel HTTP method selector" 和 "Browser Panel request body editor for non-GET methods" 需求
- [x] 3.2 更新 `openspec/specs/challenge-layout/spec.md`：修正 "Challenge pages use a custom VitePress layout registered as 'challenge'" 的 VPNav 改為 hidden；修正 "VitePress default content areas are hidden on challenge pages" 加入 VPNav；修正 "ChallengeLayout height accounts for VitePress navbar" 的 nav height 為 0px；移除 "ChallengeLayout applies mt-[var(--vp-nav-height)] margin" 需求
- [x] 3.3 更新 `openspec/specs/challenge-browser-chrome/spec.md`：修正 "Auto-navigation on runtime ready" 的 watch transition 行為；移除 "BrowserPanel navigates once on mount when disabled is already false" 需求
- [x] 3.4 更新 `openspec/specs/challenge-description-modal/spec.md`：移除 "Mobile description defaults to collapsed" 和 "Mobile description opens as fullscreen modal" 需求；修正 "Flag submission always accessible" 改為 persistent flag bar
- [x] 3.5 更新 `openspec/specs/challenge-rwd/spec.md`：修正 "Three-breakpoint responsive layout" 的 mobile description 改為 visible by default, collapsible via toggle
- [x] 3.6 更新 `openspec/specs/challenge-list/spec.md`：修正 "Challenge list page uses a globally registered Vue component embedded in markdown" 的檔案位置改為 `docs/challenges.md`
- [x] 3.7 更新 `openspec/specs/challenge-tools-control/spec.md`：修正 "Tier 5 command allowlist via commands field" 記錄 commands pipeline 未接線現狀，標記為 future

## 4. WASM 與 VFS 修正

- [x] 4.1 更新 `openspec/specs/encrypted-virtual-fs/spec.md`：修正 "Rust WASM module encrypts and stores FS content in IndexedDB" 改為 in-memory HashMap；修正 "FS content is decrypted on read and mounted into runtime memory"；修正 "FS is initialized from build-time encrypted blob" 每次 page load 重新初始化；移除 "~~Subsequent visit skips re-initialization~~"
- [x] 4.2 更新 `openspec/specs/wxlsh-terminal/spec.md`：修正 "User VFS integration" 標記為 future
- [x] 4.3 更新 `openspec/specs/user-virtual-fs/spec.md`：修正 "User writable virtual filesystem" terminal 整合標記為 future
- [x] 4.4 更新 `openspec/specs/wxlsh-commands/spec.md`：修正 "Unsupported real parameters reported explicitly" 標記為 future

## 5. 細節修正

- [x] 5.1 更新 `openspec/specs/pentest-notes/spec.md`：移除 "~~usePentestNotes auto-saves draft to localStorage~~" 需求；修正 "NotesModal presents notes with three size states" 移除 `prefers-reduced-motion` 需求
- [x] 5.2 更新 `openspec/specs/challenge-design-tokens/spec.md`：修正 "Feature card icons use rounded-square container" 的 dark mode icon bg 改為 `0.15`、icon stroke 改為 CSS filter
