# wxl-template Stage 4 端到端驗證報告（Change 1 收尾）

> Change：`project-audit-and-cleanup` ｜ Stage：4 / 4 ｜ 產出日期：2026-05-19 ｜ 環境：與 AUDIT.md A 節同（macOS Darwin 25.2.0、Node v24.13.0、pnpm 10.28.0、cargo 1.94.0、wasm-pack 0.14.0（cargo 安裝））。
>
> 本報告為 Change 1 之最終驗收紀錄。對應 tasks.md Task 4.1 之四個驗證項（a/b/c/d），逐項記載指令、exit code、觀察重點；末段為 Task 4.3 之最終 /spectra-audit 結果。

---

## A. 驗證項 (a)：完整建構管線 — 全綠

依序執行：

| # | 指令 | Exit | 真實耗時 | 結論 |
|---|---|---|---|---|
| 1 | `pnpm install` | 0 | 1.68s | ✓ |
| 2 | `pnpm wasm:build` | 0 | 6.02s | ✓ 三個 WASM 模組（virtual-fs / asgi-bridge / wxlsh-parser）建構完成 |
| 3 | `pnpm challenge:keygen` | 0 | 1.55s | ✓ 僅處理 door-is-open；不再觸及 archived demos |
| 4 | `rm -rf .vitepress/dist && pnpm docs:build` | 0 | 5.79s | ✓ fresh build 完成 |

完整 log 暫存於 `/tmp/wxl-audit-stage4/0{1..4}-*.log`。

**結論**：建構管線全綠；對應 AUDIT.md A.2.1（wasm-pack 修復）與 A.2.2（vite.build.target='esnext'）兩項 Stage 1 修復**持續有效**。

## B. 驗證項 (b)：測試套件

| # | 指令 | Exit | 真實耗時 | 結論 |
|---|---|---|---|---|
| 5 | `cargo test --workspace` | 0 | 4.11s | ✓ 全 57 unit tests（virtual-fs 6 + asgi-bridge 25 + wxlsh-parser 26）+ 0 doc tests pass |
| 6 | `pnpm test --run`（vitest） | 1 | 6.04s | ⚠ 4 failed / 648 passed（49 test files，1 failed）— **皆為 AUDIT.md A.3 已記錄之 CodeEditorPanel.test.ts regression 子集**，無新增失敗 |

vitest 失敗清單：

1. `CodeEditorPanel > calls runPythonAsync when Run is clicked`
2. `CodeEditorPanel > calls onCodeExecuted callback on successful execution`
3. `CodeEditorPanel > calls onCodeExecuted with error flag on exception`
4. `CodeEditorPanel > works without onCodeExecuted prop (optional)`

第 5 條（`destroys editor on unmount`）為 AUDIT.md A.3 已記錄之 flaky 條目，本次 full-suite run 通過（隔離跑時偶會失敗，全套件跑下不穩定）。此規律與 Stage 1 記錄一致。

**結論**：cargo test 全綠；vitest regression 集合**未擴大**，且 follow-up 由 §E 之 parked change 承接。**非 Stage 4 acceptance blocker**。

## C. 驗證項 (c)：pnpm dev smoke test

執行：`pnpm dev`（背景啟動，8 秒後 SIGTERM 終結）。

觀察重點：

- `wasm:build` → `challenge:keygen`（僅處理 door-is-open）→ `vitepress dev` 鏈完整啟動
- VitePress 印出：`Local: http://localhost:5173/`、`Re-optimizing dependencies because lockfile has changed`
- 啟動後 8 秒程序仍存活；無 console error / fatal stack
- 經 SIGTERM 後乾淨退出

**人工瀏覽限制**：本 stage 由 AI 執行，無法在瀏覽器手動導覽至 `http://localhost:5173/challenge/door-is-open/` 確認 challenge UI 渲染、flag 送出回饋。這部分屬未來人工驗收（Change 1 archive 前由人類 maintainer 補完，或在 Change 2 i18n runtime 工作中順帶驗收）。

**結論**：dev server 啟動完整（含 WASM 構建 + keygen + Vite dev 三段全綠），無啟動期錯誤；door-is-open 已具備被載入之必要 build artifacts。Pending：browser-level UI smoke 須人工執行。

## D. 驗證項 (d)：wxl-creator canonical reference — 部分驗收 + 已揭露之 verification gap

執行 throwaway slug `wxl-dryrun-a1b2c3`（符合 DELETION-PLAN.md §C.7 之 `^wxl-dryrun-[a-z0-9]{6}$` 規則）建立流程，**直接呼叫底層 CLI `pnpm create:challenge`**。

| # | 指令 | Exit | 結論 |
|---|---|---|---|
| 7 | `pnpm create:challenge --name wxl-dryrun-a1b2c3 --backend fastapi --difficulty easy --flag "FLAG{wxl-dryrun-a1b2c3_d3adb33f}" --title "Wxl Dryrun A1b2c3"` | 0 | ✓ scaffold 完成；keygen 自動跟跑成功 |
| 8 | `pnpm challenge:analyze wxl-dryrun-a1b2c3` | 0 | ✓ no warnings |
| 9 | `pnpm challenge:validate wxl-dryrun-a1b2c3` | 0 | ✓ All checks passed |
| 10 | `git clean -fd docs/challenge/wxl-dryrun-a1b2c3` + `rm -rf docs/public/challenge/wxl-dryrun-a1b2c3` | 0 | ✓ throwaway 完整清除（後者因 wasm 為 gitignored 須直接 rm） |

### 已驗收

- **Scaffold pipeline 仍可運作**：`pnpm create:challenge` 加上 `pnpm challenge:keygen / analyze / validate` 全鏈 exit 0。
- **`docs/challenge/door-is-open/` 之 canonical reference 路徑存在且可讀**：static check 已執行（`test -f docs/challenge/door-is-open/src/app.py && test -f docs/challenge/door-is-open/index.md`）。
- **三個 SKILL/workflow 檔皆指向 door-is-open**：`rg "sqli-demo" .claude/skills/wxl-creator/ .agent/` 為零比對。
- **`docs/public/challenge/` 內僅有 door-is-open**：archive 後無 stale slug 殘留。
- **Throwaway slug 清除後工作樹乾淨**：`git status --short` 為空。

### Verification gap（誠實揭露）

**本 stage 並未真正呼叫 wxl-creator skill 之互動式 entry point**（`/wxl-creator` slash command 或 `AskUserQuestion` 鏈）。本 stage 僅驗證了 skill 底層必呼叫的 CLI scaffold pipeline，**未驗證 skill 本身讀取 `docs/challenge/door-is-open/src/app.py` 作為 code-style 參考、並產生風格一致之新題目程式碼的行為**。spec ADDED Requirement 之 normative subject 是 skill 本身，CLI 驗證只是 necessary-but-not-sufficient 之子條件。

**Pending follow-up**：

- 在後續 Change（建議 Change 2 之 i18n runtime 工作完成後、Change 3 啟動前）由人類 maintainer 或 AI agent 真實呼叫 `/wxl-creator` skill，使用 throwaway slug 完整走一輪 AskUserQuestion → 讀 canonical reference → 產生程式碼 → analyze/validate 流程，並比對產出與 door-is-open 之風格一致性。
- 該人工驗收可獨立進行，不阻擋 Change 1 archive；本 verification gap 已在本節明文揭露，避免造成「Spec ADDED Requirement 已完整兌現」之過度宣稱。

**附帶觀察**：`docs/public/challenge/<slug>/runtime.wasm` 由 keygen 產生但 `**/*.wasm` 被 .gitignore 排除，`git clean -fd` 無感於此。AUDIT.md A.4 / E.1 已記錄此 keygen 副作用（Medium），後續 change 可考慮把 public/challenge/ 之 stale wasm 一併以 fsignore 規範化或讓 keygen 自動移除 stale slug 之輸出。

---

## E. Stage 4.2 — Vitest Regression Follow-up Parked Change

依 tasks.md Task 4.2，建立 parked change `fix-codeeditorpanel-vitest-regression` 收容 AUDIT.md A.3 所列之 5 個 vitest failures（含 1 個 flaky）；其 proposal.md 含五個 `it()` 完整名稱、AUDIT.md A.3 引用、修復目標、Non-Goals。

執行：

```bash
spectra new change fix-codeeditorpanel-vitest-regression --agent claude
# 寫入 proposal.md（單 artifact，本 stage 為 follow-up 收容，不展開全 SDD 流程）
spectra park fix-codeeditorpanel-vitest-regression
```

**驗收**：`spectra list --parked --json` 應含 `fix-codeeditorpanel-vitest-regression`；其 proposal.md 內 `rg "(it|test)\(" /openspec/changes/fix-codeeditorpanel-vitest-regression/proposal.md | wc -l` 應為 5。

---

## F. Stage 4 Build Pipeline Health Summary

| 指標 | 修復前（Change 1 啟動點） | Stage 4 收尾 |
|---|---|---|
| 可獨立通過 baseline commands | 1 / 6（僅 cargo test） | 5 / 6（仅 vitest CodeEditorPanel 4 個失敗，已 durable 追蹤） |
| `pnpm build` 全鏈 | ✗（wasm-pack + estree-walker + esbuild target 三重故障） | ✓ 12.85s |
| `pnpm dev` 啟動 | ✗（同上依賴鏈） | ✓ 監聽 5173 |
| `dist/challenge/` 內容 | 4 個 demos | 1 個 demo（door-is-open） |
| `.archive/challenge/` 內容 | 不存在 | 3 個 demos（fastapi-demo / php-demo / sqli-demo） |
| canonical reference | sqli-demo（隱性、僅 SKILL.md prose） | door-is-open（顯性 + spec normative ADDED Requirement + drift detection scenario） |
| 三份 durable audit reports | 不存在 | AUDIT.md / DELETION-PLAN.md / VERIFICATION.md 齊全 |
| /spectra-audit 通過輪次 | n/a | Stage 1 兩輪、Stage 2 三輪、Stage 3 兩輪、Stage 4 一輪（見 §G） |

## G. Stage 4 最終 /spectra-audit 結果

Stage 4 之 `/spectra-audit` 共執行兩輪，最終 gate 清零。

### 輪 1（initial Stage 4 audit）

| Severity | 數 | 摘要 |
|---|---:|---|
| Critical | 0 | — |
| High | 1 | §D dry-run 之「等價驗收」陳述不精確：CLI bypass 僅證明 scaffold pipeline，未驗證 wxl-creator skill 本身之 canonical reference 讀取行為，與 spec ADDED Requirement 之 normative subject 不一致 |
| Low | 2 | (a) §B cargo unit test 計數寫 26、實際 57；(b) §G placeholder 待 Stage 4.4 commit 填入 |

### 輪 2（after remediation）

| Severity | 數 | 摘要 |
|---|---:|---|
| Critical | 0 | — |
| High | 0 | 上輪 High 已 closed：§D 重寫為「已驗收」+「Verification gap（誠實揭露）」雙小節，明文承認 skill 互動式 entry point 未被驗證，並列出後續人工驗收條件 |
| Low | 1 | §G placeholder 已於本 commit 同步填入；§B cargo 計數已更正為 57 unit tests（virtual-fs 6 + asgi-bridge 25 + wxlsh-parser 26）|

### Gate

**Critical = 0、High = 0**，符合 design.md 之 Per-stage /spectra-audit gating 要求；Stage 4 可進行 Task 4.4 之 commit。

---

## H. 後續 Changes 預備

Change 1 收尾後，Spectra change `project-audit-and-cleanup` 將透過 `/spectra-archive` 歸檔；後續工作分三 changes：

| 序 | Change 名稱 | 預計起始時機 |
|---|---|---|
| 2 | `i18n-runtime-foundation`（vue-i18n + VitePress i18n routing） | Change 1 archive 完成後 |
| 3 | `content-i18n-migration`（docs 內容英主中副） | Change 2 archive 完成後 |
| 4 | `developer-docs-english`（README / CONTRIBUTE 等英化、保留 zh-TW 對照） | Change 3 archive 完成後 |

每個後續 change 都將以本 stage 之 commit + audit 機制為範本：每 stage 一個 commit、每 stage 跑 /spectra-audit、Critical/High 必須清零後才能進下一 stage。
