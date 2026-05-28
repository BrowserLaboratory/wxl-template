## Context

CI 的 `build` job 目前只跑 `pnpm build`（`wasm:build` + `challenge:keygen` + `docs:build`），驗證 VitePress 能成功產出靜態網站，但**不開瀏覽器驗證產物實際渲染**。建置成功與頁面可用是兩件事：service-worker router、challenge 註冊、layout 元件掛載、首頁 hero/feature 區塊都可能在 `docs:build` 通過後仍於瀏覽器中失效。

專案已有 Playwright（`@playwright/test@1.60.0`）與 `playwright.config.ts`，但該 config 註解明文「Scope is intentionally narrow: only `tests/challenges/<slug>.spec.ts`」，且 `baseURL` 指向 **dev server 5173**，是給 challenge-verify L3（驗題目解法）用的。site-smoke 是不同關注點：驗**建置後網站**，需指向 **preview server 4173**。兩者不可混用同一 config。

現存可用素材：首頁在 `/`（`docs/index.md`）、reference challenge `door-is-open` 在 `/challenge/door-is-open/`（`docs/challenge/door-is-open/index.md`），皆已存在且穩定。

使用者已拍板兩項政策決策：site-smoke 先 **advisory**（不入 live ruleset 16637478）、CI 用**獨立 job**。

## Goals / Non-Goals

**Goals:**

- 對 production-like（已 build + preview）的網站，於真實 Chromium 中斷言首頁與至少一條 reference challenge 頁面可正常載入並渲染關鍵區塊。
- 與現有 challenge-verify L3（`playwright.config.ts` / `tests/challenges/`）完全隔離，互不污染。
- 提供作者本機一致重現的入口（`pnpm test:smoke`）。
- CI 新增獨立 `site-smoke` job，advisory 回報、不擋合併。

**Non-Goals:**

- **不**把 site-smoke 加進 live ruleset 16637478、**不**成為 required status check（升 required 留作後續獨立 change，待穩定度驗證）。
- **不**做完整 e2e 互動測試（表單提交、解題流程）——那是 challenge-verify L3 的範疇。
- **不**改動現有 `playwright.config.ts` 的 scope 或 `tests/challenges/` 既有測試。
- **不**對所有 challenge 頁面逐一 smoke——只取 `door-is-open` 一條代表頁，避免測試時間隨題庫線性成長。

## Decisions

### 跑在 build + preview（4173）而非 dev server（5173）

site-smoke 的價值在於攔截「build 通過但產物壞掉」，dev server 不經過 production bundle，無法暴露這類問題。因此測試目標固定為 `pnpm docs:preview`（VitePress preview，預設 port 4173）所服務的已建置產物。challenge 頁面需 WASM 模組與 keys 才能渲染，故 smoke 前必須跑完整 `pnpm build`（含 `wasm:build` + `challenge:keygen`），不可只 `docs:build`。

替代方案（駁回）：指向 dev server 5173——快但不經 build，違背 site-smoke 初衷。

### 獨立 Playwright config 與 testDir `tests/site-smoke/`

新增 `playwright.site.config.ts`（`testDir: 'tests/site-smoke'`、`baseURL: 'http://localhost:4173'`），與現有 `playwright.config.ts`（`testDir: 'tests/challenges'`、5173）並存互不干擾。現有 config 註解刻意鎖定 narrow scope，沿用其精神而非破壞它。

替代方案（駁回）：在單一 config 內加第二個 `projects[]` 條目——會讓 baseURL/testDir 混雜，且 `pnpm challenge:verify` 與 `pnpm test:smoke` 可能誤跑到對方的 spec，違反現有 narrow-scope 約束。

### 用 Playwright webServer 啟動 preview 以消弭啟動 race

`playwright.site.config.ts` 設 `webServer: { command: 'pnpm docs:preview', url: 'http://localhost:4173', timeout, reuseExistingServer: !process.env.CI }`。Playwright 會啟動 preview 並**等到 4173 可連線才開跑測試**，這是對 e2e flakiness（server startup race）的主要緩解，也是「先 advisory」的技術前提。`webServer.command` 只負責 preview，不含 build——build 由 CI 的明確步驟或本機 `test:smoke` 鏈前置處理，避免在 webServer 內重複 build。

### 獨立 advisory `site-smoke` CI job（不入 ruleset）

在 `quality-gates.yml` 新增獨立 job `site-smoke`：checkout → setup pnpm/Node（pin 同現有 jobs）→ `pnpm install --frozen-lockfile` → `pnpm wasm:build` → `pnpm challenge:keygen` → `pnpm docs:build` → 安裝 Playwright Chromium → `pnpm test:smoke`。獨立 job 讓 status check 名稱穩定（未來升 required 時直接 pin `site-smoke`），且不拉長現有 `build` job。此 change **不**動 `ci-quality-gates` 既有 Branch-protection Requirement 的 required check 清單（test/build/prose-audit 維持不變）。

替代方案（駁回）：接在現有 `build` job 後——可重用 build 產物省一次 build，但 status check 名稱會是 `build`、無法單獨把 smoke 升 required，且與 build 職責耦合。

### smoke 斷言範圍：首頁 + 一條 reference challenge

最小但有意義的覆蓋：（1）導航至 `/`，斷言頁面標題與首頁關鍵區塊（hero 標題文字、feature 卡片）可見、且無導致渲染中止的 page error；（2）導航至 `/challenge/door-is-open/`，斷言 challenge layout 外殼（題目標題等穩定錨點元素）成功掛載。選 `door-is-open` 因其為現存 reference challenge 且 `tests/challenges/door-is-open.spec.ts` 已存在、是專案的代表題。

## Implementation Contract

**Behavior（可觀察結果）：**

- 執行 `pnpm test:smoke`：自動啟動 preview（4173）、開 Chromium、跑 `tests/site-smoke/` 下的 spec，全綠時 exit 0、任一斷言失敗 exit 非零。
- CI `site-smoke` job 在每個 PR 與 push to `main` 觸發、執行 smoke 並回報通過/失敗狀態；advisory（不在 ruleset required 清單內）故失敗**不阻擋合併**。

**Interface / 檔案契約：**

- `playwright.site.config.ts`：`testDir: 'tests/site-smoke'`、`testMatch: /.*\.spec\.ts$/`、`use.baseURL: 'http://localhost:4173'`、`webServer.command: 'pnpm docs:preview'`、`webServer.url: 'http://localhost:4173'`、`webServer.reuseExistingServer: !process.env.CI`、單一 chromium project。
- `package.json` 新增 script：`"test:smoke": "playwright test --config playwright.site.config.ts"`。
- `tests/site-smoke/site-smoke.spec.ts`：至少兩個 test——`homepage renders`（goto `/`）與 `reference challenge page mounts`（goto `/challenge/door-is-open/`）。
- `.github/workflows/quality-gates.yml`：新增 top-level job `site-smoke`，trigger 同現有 jobs（PR + push main），action pin 沿用現有 SHA-pinned 版本（`pnpm/action-setup`、`actions/setup-node`、checkout），Node 24 pin 一致。

**Failure modes：**

- preview 在 `webServer.timeout` 內未起來 → Playwright 報啟動失敗、job fail（advisory，不擋合併）。
- 頁面斷言失敗（元素缺失、page error）→ 對應 test fail，list reporter 印出失敗 spec。

**Acceptance criteria：**

- 本機 `pnpm build && pnpm test:smoke` exit 0。
- 故意破壞首頁（暫時移除 hero 區塊或改壞 selector）→ `pnpm test:smoke` exit 非零，證明斷言確實咬住內容。
- PR 上 `site-smoke` job 出現在 checks 列表、會跑、回報狀態；但因未列入 ruleset required，PR 仍可在 site-smoke 失敗時被合併（驗證 advisory 性質）。
- `pnpm challenge:verify`（現有 L3）不受影響、仍只跑 `tests/challenges/`。

**Scope boundaries：**

- In scope：上列 4 個檔案（新增 config + spec、修改 `package.json` + workflow）、`site-smoke-tests` 新 spec、`ci-quality-gates` 新增一條 Requirement。
- Out of scope：ruleset PUT、`CONTRIBUTE.md` required-check 文件、互動式解題 e2e、多題覆蓋。

## Risks / Trade-offs

- [e2e flakiness：preview startup race 或 Chromium 偶發逾時] → 用 Playwright `webServer.url` 等待機制 + advisory 不擋合併；穩定度先以 advisory 觀察，故意不一步到位 required。
- [CI 時間增加：site-smoke job 需重跑一次 build] → 接受此成本以換取獨立、可單獨升 required 的 status check；pnpm/cargo cache 可攤平大部分。
- [只測一條 challenge 頁，覆蓋有限] → 刻意取捨，避免測試時間隨題庫成長；首頁 + 一條代表題已能攔截 layout/router/註冊類 regression。
- [Playwright browser 下載拉長 CI] → job 內 `playwright install --with-deps chromium` 僅裝 chromium，不裝全部瀏覽器。

## Migration Plan

純新增，無資料遷移。Rollback：移除 `site-smoke` job + `playwright.site.config.ts` + `tests/site-smoke/` + `package.json` 的 `test:smoke` script 即可，現有 challenge-verify L3 與其他 jobs 不受任何影響。

## Open Questions

無——兩項政策決策（advisory、獨立 job）已由使用者拍板，技術決策（preview/獨立 config/webServer/斷言範圍）已於 Decisions 段定案。
