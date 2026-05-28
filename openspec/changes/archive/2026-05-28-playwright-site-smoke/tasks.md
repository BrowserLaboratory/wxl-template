## 1. 建立 site-smoke 套件設定（獨立 Playwright config 與 testDir `tests/site-smoke/`）

- [x] 1.1 [P] 新增 `playwright.site.config.ts`：`testDir: tests/site-smoke`、`use.baseURL: http://localhost:4173`、單一 chromium project，並設 `webServer.command: pnpm docs:preview` / `webServer.url: http://localhost:4173` / `reuseExistingServer: !process.env.CI`（用 Playwright webServer 啟動 preview 以消弭啟動 race；跑在 build + preview（4173）而非 dev server（5173））。涵蓋 Requirement: Site-smoke suite SHALL run against the built and previewed site；Requirement: Site-smoke configuration SHALL be isolated from the challenge-verify suite。驗證：`pnpm exec playwright test --config playwright.site.config.ts --list` 只列出 `tests/site-smoke/` 下的 spec，且**不**列出任何 `tests/challenges/` 的 spec（證明與 challenge-verify 隔離）。
- [x] 1.2 [P] 在 `package.json` 新增 `test:smoke` script，值為 `playwright test --config playwright.site.config.ts`（作者本機單一指令入口；documented 用法為 `pnpm build && pnpm test:smoke`）。涵蓋 Requirement: Authors SHALL be able to run site-smoke locally via a single command。驗證：`pnpm run` 列出 `test:smoke`，且 `pnpm test:smoke --list` 解析到 site config。

## 2. 撰寫 site-smoke 斷言（首頁 + 一條 reference challenge）

- [x] 2.1 在 `tests/site-smoke/site-smoke.spec.ts` 新增 `homepage renders` test：navigate `/`，斷言首頁 hero 標題與 feature 卡片可見、且載入期間無 uncaught page error（smoke 斷言範圍：首頁 + 一條 reference challenge 之首頁部分）。涵蓋 Requirement: Site-smoke SHALL assert the homepage and a reference challenge page render。驗證：`pnpm build && pnpm test:smoke` 中該 test 綠。
- [x] 2.2 在同一 spec 檔新增 `reference challenge page mounts` test：navigate `/challenge/door-is-open/`，斷言 challenge layout 外殼掛載、穩定錨點元素可見（smoke 斷言範圍：一條 reference challenge）。驗證：`pnpm test:smoke` 中該 test 綠。
- [x] 2.3 反向驗證斷言確實咬住內容：暫時破壞首頁 hero 區塊（或改壞其 selector）跑 `pnpm test:smoke` 應 exit 非零，還原後恢復綠。驗證：手動執行兩次，記錄非零 → 還原 → 0 的轉換。

## 3. CI 加入 advisory `site-smoke` job（不入 ruleset）

- [x] 3.1 在 `.github/workflows/quality-gates.yml` 新增 top-level job `site-smoke`：trigger 同現有 jobs、無 `needs:`、permissions `contents: read`，步驟為 checkout（SHA-pinned）→ setup pnpm/Node 24（沿用現有 pinned action 與版本）→ `pnpm install --frozen-lockfile` → `pnpm wasm:build` → `pnpm challenge:keygen` → `pnpm docs:build` → `playwright install --with-deps chromium` → `pnpm test:smoke`（獨立 advisory `site-smoke` CI job（不入 ruleset））。涵蓋 Requirement: The pipeline SHALL run an advisory site-smoke browser gate。驗證：在測試 PR 上出現名為 `Quality Gates / site-smoke` 的 check 並實際執行、與 `test`/`build`/`prose-audit` 並行。
- [x] 3.2 確認 advisory 性質：**不**修改 live ruleset 16637478、**不**動既有 required checks（`test`/`build`/`prose-audit`）。驗證：`gh api repos/:owner/:repo/rulesets/16637478` 的 required status checks 仍恰為 `test`/`build`/`prose-audit`、不含 `site-smoke`；並在測試 PR 上確認 `site-smoke` 失敗時 PR 仍可合併。

## 4. 端到端驗收

- [x] 4.1 本機端到端綠燈：clean checkout 跑 `pnpm build && pnpm test:smoke` exit 0；同時 `pnpm challenge:verify`（現有 L3）仍只跑 `tests/challenges/`、不受本 change 影響。驗證：兩條指令分別執行，記錄 site-smoke exit 0 且 challenge-verify 行為不變。
