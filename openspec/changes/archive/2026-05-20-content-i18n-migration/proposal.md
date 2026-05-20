## Why

WXL（Web eXploitation Laboratory）作為對外發佈的純前端 WASM CTF 靶場 template，前兩個 changes（`project-audit-and-cleanup`、`i18n-runtime-foundation`，皆已 archive）完成了示範題目精簡與 vue-i18n runtime / `docs/zh-TW/` 平行樹的基礎建設。Change 2 在四個英文側 markdown（`docs/guide/{index,python,terminal,network}.md`）刻意留下 placeholder（含 `<!-- TODO: full content migration in change content-i18n-migration -->`），並在其 Non-Goals 明示「`docs/shared/challenges.data.ts` 的資料模型仍維持 single-string，內容多語化是 `content-i18n-migration` 的工作」。本 change 完成這條 TODO 並補齊 challenge 雙語資料載入，使 i18n「runtime + content」兩層皆齊備。

## What Changes

- **建立** `docs/zh-TW/challenge/door-is-open/index.md`（frontmatter 與英文版逐字一致，除 `title` / `description` 改為繁中；body 為現有繁中描述；不複製 `src/` 子樹、不複製 `runtime.wasm`，因 ChallengeLayout 不讀 `fm.value.app` 且 `wasmModule` 為絕對路徑）。
- **改寫** `docs/challenge/door-is-open/index.md` 之 body 為英文（frontmatter 不動）。
- **新增** `docs/shared/challenges.zh-TW.data.ts`，從 `./challenges.data.ts` `import type { ChallengeData }`（不重複定義型別），glob 改為 `zh-TW/challenge/*/index.md`，fallback 保持繁中。
- **修改** `docs/shared/challenges.data.ts` 的 fallback 字串：`'網站攻防挑戰'` → `'Web exploitation challenge'`、`'綜合'` → `'General'`；型別與 shape 不動。
- **修改** `docs/zh-TW/index.md` 與 `docs/zh-TW/challenges.md` 之 `<script setup>` 中 challenges data import path：`'../shared/challenges.data.ts'` → `'../shared/challenges.zh-TW.data.ts'`。`docs/index.md` 與 `docs/challenges.md` 保持指向英文 loader。
- **修補** `.vitepress/theme/components/HomeContent.vue:38` 與 `.vitepress/theme/components/ChallengeList.vue:102` 之 `formatDate`：將 `toLocaleDateString('zh-TW', ...)` 改為依 `useI18n()` 之 `locale.value` 動態選用 `'zh-TW'` 或 `'en-US'`，使日期顯示與當前語系一致。元件 props / emits / template 結構不動。
- **撰寫** `docs/guide/index.md` 真實英文 Getting Started 內容，結構（標題層級、code block、列表、表格）與 `docs/zh-TW/guide/index.md`（76 行）1:1 對應；刪除原 placeholder 之 TODO 註解。
- **撰寫** `docs/guide/python.md`、`docs/guide/terminal.md`、`docs/guide/network.md` 真實英文內容，分別對應 zh-TW 來源 197、223、143 行；code block 與註解逐字搬遷，技術術語英文原文（VitePress、WebAssembly、Pyodide、FastAPI、IDOR、wxlsh subcommand 名稱等）保留。
- **建立** 五階段 commit + 雙層稽核機制：stage 1–4 每結束執行 `/spectra-audit` + `/tw-emoji-commit`；stage 5 額外加上「artifact 層稽核（`spectra analyze` Critical+High = 0、`spectra validate` exit 0）」與「code 層稽核（對累計 diff 跑 `/spectra-audit` Critical+High = 0）」雙重 gate 才能 archive。

## Non-Goals

- 不英化 `docs/challenge/door-is-open/src/app.py` 內 HTML 字串（FileHub Login / My Files / File not found 等）— 攻擊目標應用程式自身 UI 故意保持單語，現實世界的 IDOR 目標亦如此。
- 不英化 `README.md`、`CONTRIBUTE.md`、`CLAUDE.md`、`AGENTS.md`、`GEMINI.md`（屬於 Change 4 `developer-docs-english` 範圍）。
- 不英化 `openspec/specs/**/spec.md`（屬於 Change 4 範圍；本 change 之 spec delta 仍以英文撰寫，遵循 normative SHALL/MUST 慣例）。
- 不修改 `.vitepress/config.mts` 的 locales 結構（Change 2 已建立完整 root / zh-TW 兩 locale 配置，本 change 不動 nav / sidebar）。
- 不新增任何 vue-i18n message key 或修改 `.vitepress/theme/i18n/messages/*.json`（本 change 為 markdown 內容遷移，元件硬編碼字串已在 Change 2 抽完）。
- 不修改 Vue 元件之 props / emits / template 結構（僅 `formatDate` 內部實作改 locale-aware）；不新增測試（既有 `tests/unit/i18n/*.test.ts` 之 messages-shape 與 locale-switcher 測試自然通過即可）。
- 不修改 Rust / WASM 模組（`chall-wasm/*`）、`scripts/challenge-keygen.ts`、`docs/challenge/door-is-open/runtime.wasm`。
- 不擴大 `ChallengeData` 介面（不新增 `titleEn` / `titleZh` 雙欄位；保留 single-string + per-locale loader 架構）。
- 不處理 `tests/unit/components/CodeEditorPanel.test.ts` 之 5 個 known regression（已 parked 為 `fix-codeeditorpanel-vitest-regression`，本 change 容忍此基準失敗數但不增加新失敗）。
- 不修改 `docs/challenge/door-is-open/index.md` 的 frontmatter（`title` / `description` 維持英文，因英文是 root locale）。

## Capabilities

### New Capabilities

（無新增 capability。本 change 為內容遷移與 data loader 雙語化，行為改變屬於既有 `challenge-list` capability 的擴充。）

### Modified Capabilities

- `challenge-list`：新增 requirement「challenge data loader is locale-aware via a per-locale data file sharing the same `ChallengeData` type」。Scenarios 涵蓋：英文 loader 掃 `challenge/*/index.md`；zh-TW loader 掃 `zh-TW/challenge/*/index.md`；`ChallengeData` 型別在 `challenges.data.ts` 唯一定義並由 `challenges.zh-TW.data.ts` re-import（不重複）；既有 closed difficulty union `'easy' | 'medium' | 'hard' | 'mystery'` 在兩 loader 皆生效（保留 archive 之 `fix-project-config` 不變式）。

## Impact

- **Affected specs**：`challenge-list`（modified delta）。
- **Affected code**：
  - 新增：`docs/zh-TW/challenge/door-is-open/index.md`、`docs/shared/challenges.zh-TW.data.ts`。
  - 修改：`docs/challenge/door-is-open/index.md`（body 英化）、`docs/shared/challenges.data.ts`（fallback 英化）、`docs/zh-TW/index.md`（line 50 import path 切換）、`docs/zh-TW/challenges.md`（line 7 import path 切換）、`docs/guide/index.md`、`docs/guide/python.md`、`docs/guide/terminal.md`、`docs/guide/network.md`、`.vitepress/theme/components/HomeContent.vue`、`.vitepress/theme/components/ChallengeList.vue`。
- **Affected dependencies**：無套件層異動（不安裝、不升級、不移除 dependency）。
- **Affected pipeline**：
  - `pnpm docs:build` 須能同時 build root 與 `/zh-TW/` 兩棵樹（含 challenge 子樹）；Change 2 已驗證 dual-locale build 可運作，本 change 不退化此能力。
  - `pnpm test --run` 失敗數維持 = 5（AUDIT.md §A.3 既知 CodeEditorPanel regression），不得新增失敗。
  - `pnpm challenge:validate`、`cargo test --workspace` 不受影響（不動 challenge frontmatter schema、不動 Rust）。
- **Affected workflows**：
  - 後續以 `/spectra-propose` 啟動的 Change 4 `developer-docs-english` 與本 change 無檔案重疊，可立即在本 change archive 後啟動。
  - i18n 完整鏈路（vue-i18n runtime + locale 切換器 + zh-TW 平行樹 + 雙語 challenge data + 全英文 markdown）達成，使用者可從任一頁面點 LocaleSwitcher 雙向切換 14 個路由並見內容語言隨之變化。
- **Risk / Rollback**：每 stage 結束有獨立 commit 與稽核紀錄，任一 stage 失敗可 `git revert <stage-commit>` 回到上一檢查點；Stage 5 雙層稽核（artifact 層 `spectra analyze` + code 層 `/spectra-audit`）作為 archive 前的最終 gate，Critical+High = 0 為必要條件。
