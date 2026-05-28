## Why

目前 CI（`.github/workflows/quality-gates.yml`）的 `build` job 只驗證 VitePress `docs:build` 能成功產出產物，但**不檢查產出後的網站實際能否在瀏覽器中正常渲染**。建置成功不代表頁面沒壞：路由失效、challenge 註冊 race、layout 元件未掛載、首頁 hero／feature card 破版等問題都能通過 `docs:build` 卻在實際瀏覽時爆炸。本 change 加入對「建置後網站」的 Playwright smoke 測試，補上這道 production-like 的瀏覽器層防線。

## What Changes

- 新增獨立的 site-smoke Playwright 套件（獨立 config + 獨立 testDir `tests/site-smoke/`），跑在 `docs:build` + `docs:preview`（port 4173）的 production-like 網站上，**不污染**現有刻意鎖定 `tests/challenges/` 的 challenge-verify L3 設定（見 `playwright.config.ts` 註解）。
- smoke 範圍：至少斷言（1）首頁成功載入並渲染 hero／feature 區塊、（2）至少一條 reference challenge 頁面成功載入並掛載 challenge layout。
- 新增 `pnpm test:smoke` script 供作者本機執行（build → preview → playwright site config）。
- 在 `quality-gates.yml` 新增**獨立的 `site-smoke` job**（checkout → install → build → preview → playwright site config）。
- site-smoke **先採 advisory**：CI 會跑並回報，但**不**加進 live ruleset 16637478、**不**擋合併。升為 required status check 留作後續獨立 change（待 e2e 穩定度驗證後）。

## Non-Goals

<!-- design.md 會建立，Non-Goals 移至 design.md 的 Goals/Non-Goals 段 -->

## Capabilities

### New Capabilities

- `site-smoke-tests`: 定義對「建置後 VitePress 網站」的 Playwright smoke 測試套件——獨立 config／testDir、跑在 preview server（4173）、斷言首頁與至少一條 reference challenge 頁面可正常渲染、以及供作者本機執行的 `test:smoke` 契約。

### Modified Capabilities

- `ci-quality-gates`: 新增一條 Requirement 描述獨立的 advisory `site-smoke` CI job；不變更既有 Branch-protection Requirement 的 required check 清單（site-smoke 此階段不入 ruleset）。

## Impact

- Affected specs: 新增 `site-smoke-tests`、修改 `ci-quality-gates`
- Affected code:
  - New: `playwright.site.config.ts`, `tests/site-smoke/site-smoke.spec.ts`
  - Modified: `.github/workflows/quality-gates.yml`, `package.json`
  - Removed: (none)
- Affected dependencies: 無新增（`@playwright/test@1.60.0` 已是 devDependency）
