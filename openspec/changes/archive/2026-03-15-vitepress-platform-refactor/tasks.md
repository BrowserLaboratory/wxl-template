## 1. Build 管線修正（wasm-pack output 與 build script）

- [x] 1.1 更新 `package.json` 中的 `wasm:build` script，加入 `--out-dir ../../docs/public/wasm/virtual-fs --target web` 與 `--out-dir ../../docs/public/wasm/asgi-bridge --target web`，實作 wasm-pack output：`docs/public/wasm/<crate>/` 決策
- [x] 1.2 新增 `"build": "pnpm wasm:build && pnpm docs:build"` 到 `package.json`，實作 build script：`wasm:build` 先於 `docs:build` 決策
- [x] 1.3 更新 `.gitignore`，新增 `docs/public/wasm/` 排除生成的 WASM binary
- [x] 1.4 執行 `pnpm wasm:build` 確認 WASM artifact 正確輸出至 `docs/public/wasm/virtual-fs/` 與 `docs/public/wasm/asgi-bridge/`

## 2. Runtime Bridge 遷移至 `.vitepress/theme/composables/`

- [x] 2.1 建立 `.vitepress/theme/composables/` 目錄；將 `chall-wasm/python-bridge/python-runtime.ts` 複製並重命名為 `.vitepress/theme/composables/usePythonRuntime.ts`，實作 Python ASGI runtime module resides in .vitepress/composables 需求
- [x] 2.2 將 `chall-wasm/php-bridge/php-runtime.ts` 複製並重命名為 `.vitepress/theme/composables/usePhpRuntime.ts`，實作 PHP runtime module resides in .vitepress/composables 需求
- [x] 2.3 更新 `.vitepress/sw/router.ts` 的 import 路徑，從 `chall-wasm/python-bridge/python-runtime` 改為 `.vitepress/theme/composables/usePythonRuntime`，以及 php-runtime 同理
- [x] 2.4 更新所有測試檔案（`python-runtime.test.ts`, `python-runtime-request.test.ts`, `python-runtime-fs.test.ts`, `php-runtime.test.ts` 等）的 import 路徑至新位置，實作 runtime bridge 位置：`.vitepress/theme/composables/` 決策
- [x] 2.5 刪除 `chall-wasm/python-bridge/` 與 `chall-wasm/php-bridge/` 中的 TypeScript 原始檔（保留 Rust crate 本身）
- [x] 2.6 執行 `pnpm test` 確認所有現有測試通過，驗證 existing runtime behavior is preserved after migration

## 3. 自訂 VitePress Layout：Challenge 頁面

- [x] 3.1 建立 `.vitepress/theme/layouts/` 目錄；新增 `ChallengeLayout.vue`，實作 challenge pages use a custom VitePress layout registered as "challenge" 與 VitePress 自訂 layout：`theme/layouts/ChallengeLayout.vue` 決策
- [x] 3.2 在 `ChallengeLayout.vue` 中實作左右分割結構（左欄 40%、右欄 60%），實作 challenge layout renders a left-right split view 需求
- [x] 3.3 在左欄加入可收縮 description panel：使用 `<Content />` 渲染 markdown，加入 CSS transition 收縮動畫與切換按鈕，實作 description panel renders markdown via Content component and is collapsible 需求及 description 渲染：`<Content />` via VitePress pipeline 決策
- [x] 3.4 在左欄底部加入固定定位的 `FlagSubmit` 元件，實作 flag submit form is fixed at the bottom of the left column 需求
- [x] 3.5 新增頂部導覽列，包含「← Challenges」返回連結（連結至 `/challenges/`）、title、difficulty badge、category badge，實作 challenge layout includes a navigation bar with a back link to the challenge list 需求
- [x] 3.6 在右欄保留 Browser/Terminal/Repeater tab 切換，從 frontmatter 的 `slug` 欄位（透過 `useData()`）取得 slug，實作 ChallengeLayout provides three switchable interaction panels 修改需求及 layout 結構：左右分割，左欄可收縮 決策
- [x] 3.7 在 `theme/index.ts` 的 `layouts` 選項中註冊 `challenge: ChallengeLayout`
- [x] 3.8 更新 `docs/challenges/sqli-demo.md` 與 `docs/challenges/php-demo.md` 的 frontmatter，加入 `layout: challenge`，移除 `.md` 內容中的 `<ChallengeLayout>` 或 `<ChallengeUI>` 標籤
- [x] 3.9 為 `ChallengeLayout.vue` 新增單元測試，覆蓋 layout 啟用、description 收縮、back link 三個情境

## 4. Challenge List 頁面

- [x] 4.1 新增 `docs/challenges/challenges.data.ts`，使用 `createContentLoader('challenges/*.md', { excerpt: true })` 實作 challenge list page collects all challenge frontmatter at build time using createContentLoader 需求及 challenge list 資料：`createContentLoader` 決策
- [x] 4.2 新增 `.vitepress/theme/layouts/ChallengeListLayout.vue`，消費 `challenges.data.ts` 的資料，以 card 形式顯示每個 challenge（title、difficulty badge、category badge、連結），實作 challenge list displays each challenge as a card with metadata and a link 需求
- [x] 4.3 在 `theme/index.ts` 中註冊 `challenge-list: ChallengeListLayout`，實作 challenge list page uses a custom "challenge-list" layout 需求
- [x] 4.4 新增 `docs/challenges/index.md`，frontmatter 設定 `layout: challenge-list`，作為 Challenge list 頁面入口
- [x] 4.5 為 `ChallengeListLayout.vue` 新增單元測試，覆蓋 card 渲染與連結正確性

## 5. PWA 支援（已決定放棄）

> **決策（2026-03-15）**：目標使用者為桌機環境，無離線需求。`@vite-pwa/vitepress@1.1.0` 僅支援 VitePress 1.x，與 VitePress 2.0.0-alpha.16（Vite 7）不相容，SW 無法生成。維護成本大於收益，故放棄 PWA 功能。

- [x] 5.1 移除 `package.json` 中的 `@vite-pwa/vitepress`、`vite-plugin-pwa`、`workbox-window` devDependencies（`pnpm remove @vite-pwa/vitepress vite-plugin-pwa workbox-window`）。確認 platform is installable as a PWA with a web app manifest、PWA service worker caches WASM runtimes with a CacheFirst strategy、PWA service worker applies NetworkFirst to HTML and StaleWhileRevalidate to other assets、PWA service worker does not conflict with the challenge routing service worker 等需求已標記為放棄，不再追蹤
- [x] 5.2 還原 `.vitepress/config.mts`：移除 `withPwa()` 包裝，改回純 `defineConfig()`；移除與 pwa 策略：`@vite-pwa/vitepress` + workbox generateSW 相關的設定
- [x] 5.3 還原 `.vitepress/theme/index.ts`：移除 `import { registerSW } from 'virtual:pwa-register'` 與 `registerSW()` 呼叫

## 6. 端對端驗證

- [x] 6.1 執行 `pnpm docs:build` 確認整個建構流程成功（docs:build）
- [x] 6.2 執行 `pnpm test` 確認所有測試通過（包含遷移後的 runtime bridge 測試）
