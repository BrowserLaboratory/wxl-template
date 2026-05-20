## Context

i18n master plan 與 `docs-prose-polish` 收尾後（2026-05-20），repo 在 `code-editor-panel` / `oss-readme` spec 規範了三條本地 PASS 行為：

- `pnpm test --run` 必須 deterministic PASS（`code-editor-panel/spec.md:270, 306`）
- `pnpm docs:build` 必須 clean（`oss-readme/spec.md:130`）
- `pnpm wasm:test` 必須 0 fail（`oss-readme/spec.md:81` scripts 表）

這些 SHALL 條款目前只活在 spec 層與人工提醒，沒被 CI 強制。既有 `.github/workflows/release.yml` 由 `push tags v*` 觸發，跑同樣命令——但 release-time 已是壞 commit merge 入 `main` / `staging` 之後，違反 git flow PR-stage attack-surface containment 原則。

並行 constraint：AUDIT.md §A.2.1 記載 Node 24 + `wasm-pack` npm devDep 觸發 `ERR_REQUIRE_ESM` / class-extends error；修復決策是把 `wasm-pack` 從 devDep 移除，改由系統 PATH 解析（`cargo install wasm-pack`），並把 Node pin 在 22 LTS。`release.yml` 已落實此決策；新 workflow 必須跟齊。

## Goals / Non-Goals

**Goals:**

- 在 PR 對 `main` / `staging` 開啟、以及 push 至 `main` 時，自動 enforce 三條既有本地 PASS gate。
- workflow 步驟對齊 `release.yml`，避免 PR-time 與 release-time 行為漂移。
- 新增 `ci-quality-gates` capability spec，把「PR-time CI 必須跑 X」寫成 SHALL 條款，供未來 audit / change 引用。
- 為 prose-audit gate 的 CI 化保留三個明確 follow-up 路徑（不在本 change 實作）。

**Non-Goals:**

- 不擴張 `prose-audit-outward-docs` spec 至 CI 強制；該 spec 仍規範 release-time 行為。
- 不抽 reusable workflow（`workflow_call`）——只有一個 PR-time workflow + 一個既有 release workflow，沒有 DRY 收益足以蓋過抽象成本。
- 不替 PR 加 status check 強制設定（branch protection rule）——那屬於 repo 設定層，超出 spec / code change 範疇。
- 不替 `release.yml` 加 `needs: quality-gates` cross-workflow 依賴——release 由 tag 觸發、quality-gates 由 PR / push 觸發，兩者沒有共同事件，技術上也無法直接串。
- 不導入 `actionlint` 或 yaml lint 至 repo 工具鏈——這是基礎設施層決策，超出本 change 範圍。
- 不在本 change 內處理 prose-audit CI 化（見「Open Questions」段）。

## Decisions

### PR-time gate workflow 與 release-time workflow 並行而非取代

**選項：**

- A: 取代——把 `release.yml` 的 test/build 步驟全搬到新 workflow，release 階段只剩 packaging。
- B: 並行（本 change 採用）——新增 PR-time workflow，`release.yml` 內既有 test/build 不動。
- C: 抽 reusable workflow——`workflow_call` 把 setup + test/build 抽成可被兩個 workflow 呼叫的單元。

**選 B 的理由：**

- A 會讓 release-time 失去 redundancy 第二道防線；若 PR-time CI 因 GitHub Actions 半小時 outage 跳過，release tag 切下去就裸奔。
- C 引入 reusable workflow 抽象層，但目前只有兩個 caller，DRY 收益低於抽象成本。等到出現第三個 caller（例如 nightly scheduled audit）再抽不遲。
- B 的代價是兩份 workflow yaml 步驟序列重複——可接受，因為步驟序列由 `release.yml` 既有實作背書（line 16–60），抄一份比抽一份維運成本低。

### 兩個並行 job 而非單一序列 job

**選項：**

- A: 單一 job 序列跑 wasm:test + test + challenge:validate + docs:build。
- B: 兩個並行 job（`test` / `build`，本 change 採用），各自跑共用 setup 後再分跑 test 步驟或 build 步驟。

**選 B 的理由：**

- 並行縮短 wall-clock：在 8 核 GitHub-hosted runner 上，docs:build（含 Vite bundling）與 vitest 可平行，不互相阻擋。
- 狀態 badge 分開，PR review 一眼看出是 test 失敗還是 build 失敗。
- setup 步驟（checkout、Rust toolchain、wasm-pack、binaryen、pnpm install、wasm:build、challenge:keygen）會各跑一份，但 `Swatinem/rust-cache@v2` + pnpm cache 攤平大部分成本——重複部分是 binaryen apt-get（~15s）與 wasm:build cold path（~7s per A.2.1），加總 < 30s wall-clock 損失，遠低於並行收益。

### 步驟順序對齊 `release.yml`，不重新設計

**選項：**

- A: 從頭設計步驟順序（例如把 wasm:build 移到更後面）。
- B: 對齊 `release.yml` 步驟順序（本 change 採用）。

**選 B 的理由：**

- `release.yml` 步驟順序（line 16–60：checkout → Rust → cache → wasm-pack → binaryen → pnpm → Node → pnpm install → wasm:build → challenge:keygen → wasm:test → test → challenge:validate → docs:build → package → release）已在 production 跑過 release（per `github-release-workflow` spec 與 archive `2026-04-04-tighten-github-release-gates` 之背書），是 known-good 序列。
- 重新設計只增加 review 負擔與 regression 風險，沒有正面收益。
- 本 change 只跑到 `docs:build` 為止——不含 packaging 與 GitHub Release 步驟，因為 PR-time 不該 publish artifact。

### Node 版本 pin 至 22 LTS

**選項：**

- A: 跟 `release.yml` 一致用 `node-version: 22`（本 change 採用）。
- B: matrix 跑 Node 22 + 24，提早暴露 Node 24 regression。

**選 A 的理由：**

- AUDIT.md §A.2.1 已記載 Node 24 在本 repo 撞 `ERR_REQUIRE_ESM` / class-extends error；未修之前跑 Node 24 必失敗，沒有 enforcement 價值。
- matrix 雙跑會把 CI 成本翻倍，但 Node 24 path 目前必紅，等同浪費 runner 額度。
- 等 wasm-pack 上游修好或 repo 解決 Node 24 相容性後再開 matrix 不遲——那會是另一個 change。

### `wasm-pack` 由 GitHub Action 提供，不從 npm 安裝

**選項：**

- A: 用 `jetli/wasm-pack-action@v0.4.0`（本 change 採用，跟 `release.yml` 一致）。
- B: `cargo install wasm-pack`（本地推薦方式）。
- C: 加回 `wasm-pack` npm devDependency。

**選 A 的理由：**

- AUDIT.md §A.2.1 已明確記載「C 觸發 minipass/minizlib 版本錯位導致 wasm:build 失敗」——禁止選 C。
- B 在 CI 上慢（cargo install 編譯 wasm-pack 源碼可能要 1–2 分鐘 cold）；A 直接下載預編譯 binary，~5s。
- A 的版本鎖（v0.4.0 of the action）對應 wasm-pack v0.13 binary，與本地 v0.14 相容。

## Implementation Contract

**觀察行為**（外部使用者看到的）：

- 任何 PR 開啟、更新、或 reopen，base branch 為 `main` 或 `staging` 時，GitHub Actions 即觸發 `Quality Gates` workflow，跑 `test` 與 `build` 兩個 job。
- 任何 push 至 `main`（含 PR squash-merge）時，同一 workflow 觸發。
- workflow 完成後，PR 介面顯示兩個 check（`Quality Gates / test`、`Quality Gates / build`）；任一紅燈即標示 PR 不可 merge（前提是有人在 repo settings 將 check 設為 required；本 change 不負責設定）。

**workflow 介面（觸發契約）：**

```yaml
on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main]
```

兩個 job 名稱固定為 `test` 與 `build`，job ID 不可變（外部 status-badge URL 與 branch-protection rule 依賴 job 名）。

**`test` job 步驟序列（必須包含且依此順序）：**

1. `actions/checkout@v4`
2. `dtolnay/rust-toolchain@stable`
3. `Swatinem/rust-cache@v2`
4. `jetli/wasm-pack-action@v0.4.0`
5. `sudo apt-get update && sudo apt-get install -y binaryen`
6. `pnpm/action-setup@v4`
7. `actions/setup-node@v4` with `node-version: 22`, `cache: pnpm`
8. `pnpm install --frozen-lockfile`
9. `pnpm wasm:build`
10. `pnpm challenge:keygen`
11. `pnpm wasm:test`
12. `pnpm test --run`

**`build` job 步驟序列（必須包含且依此順序）：**

1. 步驟 1–10 同 `test` job
2. `pnpm challenge:validate`
3. `pnpm docs:build`

**失敗模式：**

- 任一步驟 exit code 非 0 即整個 job 失敗，workflow 紅燈。
- 兩 job 並行；其中一 job 失敗時，另一 job 不受影響繼續跑完（GitHub Actions 預設 `fail-fast: false` 的 job-level 行為——本 workflow 不用 matrix，故無需顯式設定）。
- pnpm install 階段命中 lockfile mismatch 時，`--frozen-lockfile` 會 exit 非 0，這是 desired behavior（強迫貢獻者更新 lockfile 並 commit）。

**接受標準（implementer / reviewer 驗證點）：**

- workflow yaml syntax 通過 `actionlint` 或 `gh workflow view`（本地驗證手段，不要求 commit `actionlint` 設定）。
- 本地等效命令 `pnpm install --frozen-lockfile && pnpm wasm:build && pnpm challenge:keygen && pnpm wasm:test && pnpm test --run && pnpm challenge:validate && pnpm docs:build` 在 Node 22 LTS 環境全綠。
- 開 throwaway PR 至 `staging`，故意打壞一個 vitest test，PR 上 `Quality Gates / test` 紅燈、`Quality Gates / build` 綠燈（兩 job 並行驗證）。
- 修回 PASS 狀態後重 push，PR 上兩 check 皆綠燈。
- `spectra validate ci-quality-gates` 在 archive 前 PASS。

**Scope 邊界：**

- **In scope**：新增 `.github/workflows/quality-gates.yml`、新增 `ci-quality-gates` capability spec（archive 階段建立至 `openspec/specs/ci-quality-gates/spec.md`）。
- **Out of scope**：`release.yml` 任何修改、`prose-audit-outward-docs` spec 任何修改、branch protection rule 設定、`actionlint` 工具鏈導入、prose-audit CI 化（見 Open Questions）。

## Risks / Trade-offs

- **[Risk] PR-time workflow 步驟序列與 `release.yml` 漂移**——`release.yml` 之後升級或調整時，本 workflow 未同步會導致 release-time 跑得過、PR-time 卻擋下（或反之）。**Mitigation**：在 `ci-quality-gates` spec 中加入 SHALL 條款「兩 workflow 之 setup 步驟序列須保持一致」；新 change 修 `release.yml` 時 spec 會 fail validate。
- **[Risk] CI 執行時間爆增使 PR review 慢**——預估 8–12 分鐘 wall-clock，視 cache 命中。**Mitigation**：Rust cache（`Swatinem/rust-cache@v2`）+ pnpm cache 已含；不額外加 cache 步驟。若實際長於 15 分鐘，於後續 change 拆 job 或加 step-level cache。
- **[Risk] `jetli/wasm-pack-action@v0.4.0` 上游不維護**——action 自 2023 起無新 release，可能與未來 wasm-pack 版本不同步。**Mitigation**：保持與 `release.yml` 同步，問題會同時暴露於 release 流程；屆時兩 workflow 一起換到 `cargo install wasm-pack`。
- **[Trade-off] 兩 job 各自跑 setup 步驟，binaryen / wasm-pack 安裝重複**——以可讀性與並行收益換 ~30s 重複成本。可接受。
- **[Trade-off] 不抽 reusable workflow**——維護負擔是兩份 yaml 步驟序列需手動對齊。可接受，直到第三個 caller 出現。

## Open Questions

### prose-audit gate 的 CI 化路徑（follow-up change，非本次實作）

humane-prose-audit Phase 2（sub-agent dispatch）需要外部 LLM harness 投放 sidecar JSON（`~/.agents/custom_skills/humane-prose-audit/SKILL.md:43-44`），無法在無 LLM 的 CI runner 上跑完整 verdict。三個候選路徑：

- **Option A：Phase 1 deterministic-only**——CI 跑 `python audit_orchestrator.py <file> --phase 1`，只攔 14 個 deterministic check（ai_tells、burstiness、mainland_vocab、placeholder_grep、lexical_diversity、pronoun_consistency、duplicate_sentences、citation_format、discourse_marker_density、hedge_density、imperative_fog、lazy_writer_check、readability_metrics、repetition_fingerprint）能升到 Critical 的情況。低保真但全自動；不滿足 spec PASS 門檻（0 Critical AND 0 High，含 Phase 2 sub-agent 發現）。
- **Option B：verify-committed-summary**——維護者本地跑完整 5 phase（含 LLM）→ commit `audit-summary.md` 顯示 PASS → CI 只驗證該 summary 存在、verdict=PASS、且 outward-facing surface 列表對應 commit。高保真但靠維護者紀律；需要新增 audit-summary 格式 SHALL 條款至 `prose-audit-outward-docs` spec。
- **Option C：CI 內呼 Claude API**——把 `ANTHROPIC_API_KEY` 放 GitHub secret，CI 直接驅動 Phase 2 sub-agents。最完整但有 cost（每次 PR 19 個檔案 × 4 個 persona = 76 LLM 呼叫）與 secret-management 考量。

待後續 change 決定哪個（或組合）路徑。本 change 不實作。

### `release.yml` 之 prose-audit 整合

`prose-audit-outward-docs` spec 規範「before a release tag is cut」要 PASS，但 release.yml 目前不跑 audit。是否在本系列 follow-up 中：

- 把 prose-audit 整合進 `release.yml`（release-time enforce）？還是
- 留作維護者 pre-tag 手動流程，靠 `tw-emoji-release-note` skill 提醒？

待後續 change 決定。本 change 不動 `release.yml`。
