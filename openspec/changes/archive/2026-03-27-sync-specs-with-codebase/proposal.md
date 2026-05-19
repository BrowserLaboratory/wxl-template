## Why

全面審計後發現 16 個 spec 的需求文字與現有 codebase 不一致。多數是因為後續重構（per-folder challenge 結構、merged nav 取代 VPNav、ASGI bridge 改用 Python 實作等）後未同步更新 spec。需要統一修正，讓 spec 成為可信的 source of truth。

## What Changes

### Spec 路徑與結構過時
- `platform-documentation`: 檔案路徑從 `docs/docs/*.md` 改為 `docs/guide/*.md`
- `challenge-scaffold`: 目錄結構從 flat 改為 per-folder `src/` 結構；frontmatter 移除 `fs`、`flag_verifier`、`fs_key` 欄位，`app` 改為相對於 `src/` 的路徑

### 實作方式與 spec 描述不符（code 是正確的）
- `python-asgi-runtime`: ASGI bridge 實際是 Python-in-Pyodide，非 Rust WASM module；`initialize()` 簽名更新為 `Record<string, Uint8Array>` + `packages` 參數
- `php-runtime`: raw body 存於 `$GLOBALS['_RAW_INPUT']` 而非 `php://input`；`initialize()` 簽名同上
- `service-worker-router`: PHP 走 port-based relay 與 Python 相同（非獨立 dispatch path）

### UI/UX 行為與 spec 不符（code 是正確的）
- `challenge-ui`: BrowserPanel 使用 `https://` 而非 `http://`；移除 HTTP method selector 和 request body editor 的需求（這些功能由 Repeater 和 Terminal 提供）
- `challenge-layout`: VPNav 被 merged nav 取代（hidden），而非 spec 說的「remain visible」；移除 `mt-[var(--vp-nav-height)]` 需求
- `challenge-browser-chrome`: 移除 mount 時 disabled 已為 false 時自動 navigate 的需求（watch transition 已足夠）
- `challenge-description-modal`: 移除 mobile 預設 collapsed 和 fullscreen modal 需求（目前 UX 設計不需要）
- `challenge-rwd`: 同步 mobile description 行為與 challenge-description-modal 一致
- `challenge-list`: 檔案位置從 `docs/challenges/index.md` 改為 `docs/challenges.md`

### 功能性 spec 修正
- `challenge-tools-control`: 記錄 `commands` frontmatter 欄位目前未接線的現狀，將完整實作標記為 future
- `fastapi-challenge`: `packages` 欄位改為 optional（`BASE_PACKAGES` 提供 fallback）
- `challenge-runtime-init`: 移除 `wasm_fs_reset(slug)` SPA 導航需求（重新 mount 已足夠）

### Future 標記
- `encrypted-virtual-fs`: IndexedDB 持久化標記為 future work，當前 in-memory 實作是有意的設計
- `wxlsh-terminal` + `user-virtual-fs`: VFS terminal 整合標記為 future work
- `wxlsh-commands`: Tier 5 參數級別報告標記為 future work

### 低優先移除
- `pentest-notes`: 移除 500ms debounce auto-save 需求（目前行為已足夠）；移除 `prefers-reduced-motion` 需求（幾乎無 transition）
- `challenge-design-tokens`: 修正 dark mode icon bg 為 `0.15`（而非 `0.12`）；icon stroke 改為 CSS filter 描述

## Non-Goals

- 不修改任何程式碼，僅修改 spec 文件
- 不實作任何標記為 future 的功能
- 不更動 archived changes

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `platform-documentation`: 修正檔案路徑引用
- `challenge-scaffold`: 更新為 per-folder 結構和新 frontmatter schema
- `python-asgi-runtime`: 更新 ASGI bridge 實作描述和 API 簽名
- `php-runtime`: 更新 raw body 存取方式和 API 簽名
- `service-worker-router`: 更新 PHP dispatch 描述
- `challenge-ui`: 移除 BrowserPanel method selector/body editor 需求，修正 protocol
- `challenge-layout`: 更新 VPNav 行為描述（被 merged nav 取代）
- `challenge-browser-chrome`: 移除 mount 自動 navigate 需求
- `challenge-description-modal`: 移除 mobile modal 相關需求
- `challenge-rwd`: 同步 mobile description 行為
- `challenge-list`: 修正檔案路徑
- `challenge-tools-control`: 記錄 commands pipeline 現狀
- `fastapi-challenge`: packages 改為 optional
- `challenge-runtime-init`: 移除 wasm_fs_reset 需求
- `encrypted-virtual-fs`: IndexedDB 標記為 future
- `wxlsh-terminal`: VFS 整合標記為 future
- `user-virtual-fs`: terminal 整合標記為 future
- `wxlsh-commands`: Tier 5 參數報告標記為 future
- `pentest-notes`: 移除 debounce 和 reduced-motion 需求
- `challenge-design-tokens`: 修正 dark mode 數值

## Impact

- 受影響 specs：20 個 spec 檔案
- 不影響任何程式碼
- 不影響任何 runtime 行為
