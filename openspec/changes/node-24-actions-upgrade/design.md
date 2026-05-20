## Context

GitHub 公告兩個 Node runtime 廢棄里程碑：

- **2026-06-02**：所有以 `node20` 為 `runs.using` 的 JavaScript-based action 將自動 fallback 至 Node 24 runtime，部分舊版 action 之原生模組會在新 ABI 下失敗
- **2026-09-16**：Node 20 runtime 從 GitHub Hosted Runner 完全移除，仍 pin 在 node20 的 action 直接無法執行

本 repo 兩支 workflow（`.github/workflows/quality-gates.yml`、`.github/workflows/release.yml`）共引用 4 個 Node-runtime JavaScript action（`actions/checkout`、`actions/setup-node`、`pnpm/action-setup`、`jetli/wasm-pack-action`），目前 SHA pin 對應之版本與 `runs.using` 為：

| Action                      | 現用 tag | 現 runs.using | 狀態      |
| --------------------------- | -------- | ------------- | --------- |
| `actions/checkout`          | v4.2.2   | node20        | 受影響    |
| `actions/setup-node`        | v4.4.0   | node20        | 受影響    |
| `pnpm/action-setup`         | v4.1.0   | node20        | 受影響    |
| `jetli/wasm-pack-action`    | v0.4.0   | node16        | 受影響 + upstream 停更 |

`AUDIT.md` §A.2.1（移除 wasm-pack npm devDep）與 §A.2.2（Vite build target = esnext）兩個 Node 24 阻擋已於先前 stage 修復；`pnpm test --run` 之 5 個 vitest 失敗已由 parked change `fix-codeeditorpanel-vitest-regression` 收容，非本 change 範圍。`ci-quality-gates` spec 之第 4、5、9、10 條 Requirement 與 example 表格皆對 Node 22 pin 或舊版 action 有顯式 reference，需同步 MODIFIED。

## Goals / Non-Goals

**Goals:**

- 兩支 workflow 之 4 個 Node-runtime action 全部升級至 `runs.using: node24`（含 composite 替代品）之版本，pin 完整 40-char commit SHA + 版本註解
- `node-version: 22` → `24`；spec 內所有「until §A.2.1 resolved」deferred 條款移除
- `jetli/wasm-pack-action` 替換為 composite-based、不依賴 Node runtime 的替代品，同時保持「wasm-pack 不從 npm devDep 安裝」之 §A.2.1 約束
- 本機可在 Node 24 全綠跑完 `pnpm install --frozen-lockfile && pnpm wasm:build && pnpm challenge:keygen && pnpm test --run && pnpm docs:build` 之前置驗證
- `AUDIT.md` §A.2.1 / §A.2.2 補上「Node 24 阻擋已解除」附註

**Non-Goals:**

- 不引入 Node 22/24 build matrix（模板單一版本即可，matrix 雙倍 CI 時間與維護成本不值）
- 不升級 Rust-stack 之 `dtolnay/rust-toolchain` 與 `Swatinem/rust-cache`（屬 composite，不受 Node deprecation 影響）
- 不調整 `softprops/action-gh-release` 至 Node 24 stack（v2 線目前最新，待 upstream 釋出後 follow-up）
- 不調整 `wasm-pack` 版本字串 `v0.14.0`（與 §A.2.1 一致）
- 不解 `tests/unit/components/CodeEditorPanel.test.ts` 之 5 個 vitest 失敗（已 parked，獨立 change）
- 不調整 ruleset、permissions、parallel jobs、challenge:keygen 等其餘 spec 範圍

## Decisions

### 採用 actions/checkout v6 線之 latest stable 並 pin commit SHA

選 v6 而非 v5：v5 首版以 Node 24 為 runtime，v6 為當前 latest stable 並修補 v5 早期 release 之 cache 與 sparse-checkout 相關 issue。本 change 之 tasks 階段 SHALL 對 https://github.com/actions/checkout/releases 之 latest stable release 取得 tag → annotated tag dereference → 40-char commit SHA，再 pin 入兩支 workflow。版本註解採 `# v6.x.y`。

### 採用 actions/setup-node v6 線之 latest stable 並 pin commit SHA

同上原則：upstream 已將 runtime 切至 node24，且 `cache: pnpm` 行為與 v4 相容。

### 採用 pnpm/action-setup v6 線之 latest stable 並 pin commit SHA

注意：pnpm/action-setup 之 latest release 多為 annotated tag。tasks 階段 SHALL 解開 tag object（`git rev-parse <tag>^{}` 或 GitHub API `git/refs/tags/<tag>`）取得指向之 commit SHA，再 pin。pin tag object SHA 雖然 GitHub 仍接受，但語意上是 pin tag 物件本身而非 commit；採 commit SHA pin 更穩定。

### 替換 jetli/wasm-pack-action → taiki-e/install-action

選 `taiki-e/install-action` 而非「裸 shell `cargo install`」之理由：

- `taiki-e/install-action` 為 composite action，`runs.using: composite`，**不受 Node runtime 廢棄影響**
- 內建 release-binary 下載 + cache，遠快於 `cargo install wasm-pack` 之 source compile（CI 每次 cold build 約節省 60-90 秒）
- 維護活躍（>500 release / 月度 release 節奏），與本 repo 對「third-party action SHA pinning」與「toolchain at fixed versions」之 spec 規範一致

API 介面：

```yaml
- uses: taiki-e/install-action@<sha> # v2.x.y
  with:
    tool: wasm-pack@0.14.0   # 保留 §A.2.1 規定之 v0.14.0 pin
```

替代方案考量：

- **「裸 shell `curl ... | sh`」**：拒絕。違反「third-party action via SHA pin」之 hardening 原則，且需要在 PATH 額外處理快取
- **「在 Rust toolchain step 內合併安裝」**：拒絕。`dtolnay/rust-toolchain` 不提供 cargo binary install API；hacky
- **「自架 fork jetli/wasm-pack-action 並升 runtime」**：拒絕。維護負擔過大

### 保持 node-version: 24 之單一版本而非 matrix

模板 fork 後典型只跑一個 Node 版本；雙版本 matrix 會雙倍 CI 時間，且 v1.0.0 階段優先穩定大於 cross-version 矩陣。若未來模板使用者反映需要可再加 follow-up change。

### Spec MODIFIED 邊界

- `ci-quality-gates` spec 第 4 條 Requirement 從「pin Node 22 LTS」MODIFIED 為「pin Node 24 LTS」，同時刪除 `AUDIT.md §A.2.1` 之 deferred 條款（不再有阻擋）
- `ci-quality-gates` spec 第 5 條 Requirement 從「`wasm-pack` SHALL be installed via `jetli/wasm-pack-action`」MODIFIED 為「`wasm-pack` SHALL be installed via a composite GitHub Action that is not subject to the Node runtime deprecation policy and does not install `wasm-pack` from npm」，並在 Scenario 內舉 `taiki-e/install-action` 為 normative example
- `ci-quality-gates` spec 第 9 條 Requirement「Third-party GitHub Actions pinned to commit SHAs」之 Example 從 `actions/checkout@v4.2.2` SHA 更新為新版 v6 SHA
- `ci-quality-gates` spec 第 10 條 Requirement「CI workflows install build toolchain at fixed versions」之 Example 表格從 `jetli/wasm-pack-action` 改為 `taiki-e/install-action`，保留 `version` 仍為 `v0.14.0`
- `github-release-workflow` spec 之 Requirement 是否含 Node 版本與具體 action 文字參照，tasks 階段 SHALL 全文檢查；若無，免 MODIFIED；若有，同步至 Node 24 與新 action

## Implementation Contract

**觀察行為**：

- 兩支 workflow 在 2026-06-02 之後仍可正常 trigger 與執行；每個 step 內所有 `uses:` 行 100% 解析為以 `node24` 或 `composite` 為 `runs.using` 之 action 版本
- `actions/setup-node` step 之 `node-version` 為 `24`；後續 step 之 `node --version` 印出 `v24.x.y`
- `wasm-pack` 由 `taiki-e/install-action` 安裝至 PATH，版本字串為 `0.14.0`；`pnpm wasm:build` 不再 invoke `jetli/wasm-pack-action`
- `package.json` 仍 SHALL NOT 列 `wasm-pack` 於 dependencies / devDependencies（§A.2.1 不變）

**Interface / 變更介面**：

- `.github/workflows/quality-gates.yml`：第 4 個 `uses: jetli/wasm-pack-action@<sha> # v0.4.0` 步驟（出現於 `test` 與 `build` 兩個 job）改為 `uses: taiki-e/install-action@<sha> # v2.x.y`，`with.version` 改為 `with.tool: wasm-pack@0.14.0`；`actions/setup-node` 之 `node-version: 22` 改為 `node-version: 24`；`actions/checkout`、`actions/setup-node`、`pnpm/action-setup` SHA 全部更新
- `.github/workflows/release.yml`：同上 4 處更換（release job 內各一次）
- `openspec/specs/ci-quality-gates/spec.md`：四條 Requirement MODIFIED 如上
- `openspec/specs/github-release-workflow/spec.md`：若有 Node 22 / jetli reference 則同步 MODIFIED
- `AUDIT.md`：§A.2.1 與 §A.2.2 末段補一行 anchor：`> Node 24 阻擋已於 change <node-24-actions-upgrade> 解除（archived YYYY-MM-DD-node-24-actions-upgrade）`

**Failure modes**：

- 若 `taiki-e/install-action` 之 `wasm-pack@0.14.0` manifest 未提供 prebuilt binary fallback 為 source compile，可能延長 CI 時間 60-90 秒（仍 < 5 分鐘總 budget，可接受）
- 若 Node 24 對 `pnpm@10.28.0` 之 wasm 模組或 `vitest@1.x` 有未發現相容性 regression，本機 `pnpm test --run` 全綠仍 SHALL 為 hard gate；不全綠則 rollback 至 Node 22 並改為待 follow-up change

**Acceptance criteria**：

| 驗證項                                                                              | 方法                                                                            | 通過條件                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------- |
| 本機 Node 24 全綠 pipeline                                                          | `nvm use 24 && pnpm install --frozen-lockfile && pnpm wasm:build && pnpm challenge:keygen && pnpm wasm:test && pnpm test --run && pnpm docs:build` | Exit 0                    |
| 兩支 workflow 無 node20-runtime 殘留                                                | 在 PR branch 上 `gh workflow run` 觸發後檢視 run summary                        | 0 個 step warning         |
| `wasm-pack` 經 `taiki-e/install-action` 安裝                                        | workflow step inspection                                                        | 步驟 use `taiki-e/install-action`，版本 `v0.14.0` |
| `actions/checkout` `actions/setup-node` `pnpm/action-setup` 全部 v6+                | `rg '@v[0-9]+' .github/workflows/` + 對照註解版本                               | 全部註解 `v6.x.y` 以上    |
| spec 12 條 Requirement 對齊                                                         | `spectra validate node-24-actions-upgrade` + 手動讀 spec delta                  | validate exit 0           |
| `AUDIT.md` §A.2.1 / §A.2.2 補 anchor                                                | grep AUDIT.md 找 anchor 行                                                      | 兩處出現 change name      |

**Scope boundaries**：

- **In scope**：4 個 Node-runtime action SHA + 版本升級、`node-version` 22→24、`jetli` → `taiki-e` 切換、`ci-quality-gates` + `github-release-workflow` spec MODIFIED、AUDIT §A.2.1 / A.2.2 anchor 補充
- **Out of scope**：Node matrix、Rust action 升級、`softprops/action-gh-release` 升級、ruleset 異動、CodeEditorPanel vitest regression、pnpm 主版號升級、`wasm-pack` 版本由 v0.14.0 改其他

## Risks / Trade-offs

- **`taiki-e/install-action` 為新 dependency surface** → Mitigation：選擇 maintenance 活躍且為 composite（不受 Node runtime 政策影響）之 action；pin commit SHA 杜絕意外 upstream 改動；保留 §A.2.1「不從 npm 安裝 wasm-pack」之核心約束
- **Node 24 對 vitest / pyodide / vite 之 transitive 相容** → Mitigation：本機 `pnpm test --run` 全綠為 hard gate；若 fail 則 design 之 Open Questions 升級到 follow-up change
- **`pnpm/action-setup` v6.x cache key 行為若與 v4 不同** → Mitigation：tasks 階段檢視 v4 → v6 CHANGELOG 之 cache 章節；若有 breaking 則於 design Open Questions 記錄
- **CI 時間 60-90 秒增加（taiki-e 若 wasm-pack 0.14.0 無 prebuilt fallback compile）** → Mitigation：可接受；若實測超過 5 分鐘總 budget 則 follow-up 考慮升級 wasm-pack 至有 prebuilt 的更新版

## Migration Plan

1. 在新 feature branch 上實作所有檔案改動
2. 本機 `nvm use 24` 跑 acceptance criteria 表第一列之完整 pipeline，hard fail 即 rollback
3. Push branch → 觀察 PR-time quality-gates workflow 全綠
4. Merge feature PR → archive change PR（依本 repo 之既有 spectra-archive 流程）
5. 後續 release（v1.0.0 正式版或 v1.0.1）將驗證 release.yml 之 Node 24 路徑

**Rollback**：

- 任一 acceptance criteria fail → revert workflow + spec 改動之 commit，保留 design.md 之失敗紀錄於 design 之 Open Questions

## Open Questions

- `taiki-e/install-action` 對 `wasm-pack@0.14.0` 是否提供 prebuilt binary？若無 prebuilt 而需 source compile，CI 時間是否仍可接受？（tasks 階段以實測為準）
- 是否需要在 `package.json` `engines.node` 加 `>=24` 之 declaration？（目前 repo 無此欄位；模板使用者期望 forward-compat 而非強制下限，傾向不加，留作未來 ABI 變動時再評估）
