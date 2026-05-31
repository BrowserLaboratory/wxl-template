> 每個 Stage 結尾的 `/spectra-audit` 為**硬性 gate**：跑完針對本 stage diff 的 `/spectra-audit` 後，必須先處理掉 Critical/High 等級 findings，才能進入下一個 stage。流程走 TDD（測試先紅再實作轉綠）。

## 1. Stage 1 — 多 runtime 解析（resolveRuntimes）

- [x] 1.1 在 `tests/unit/scripts/wxl-solver/spawn-runtime.test.ts` 新增 `resolveRuntimes` 測試案例：單值 `claude` 解析為 `['claude']`、`claude,codex,gemini` 解析為三元素清單、`gemini, claude , gemini` 經 trim 與去重保序後為 `['gemini','claude']`、空字串或未設環境變數預設回 `['claude']`、含未知值 `claude,copilot` 必須丟出既有 `UnknownRuntimeError`。確認新測試先紅。
- [x] 1.2 在 `scripts/wxl-solver/spawn-runtime.ts` 實作 `resolveRuntimes(raw: string | undefined): RuntimeName[]`（split 逗號、trim、去重保序、空/未設回 `['claude']`、未知值丟既有 `UnknownRuntimeError`），並把既有 `resolveRuntime` 改為回傳 `resolveRuntimes(raw)[0]` 維持回溯相容；沿用既有 `KNOWN_RUNTIMES`。本 task 落實 spec requirement「Runtime CLI dispatch via environment variable」中對 list 形式環境變數的解析行為。跑 `pnpm test tests/unit/scripts/wxl-solver/spawn-runtime.test.ts` 確認轉綠。
- [x] 1.3 **[硬性 gate]** 跑 `/spectra-audit`（本 stage 對應的 git diff）→ 將輸出 findings 依 severity triage → 必須先處理掉所有 Critical 與 High 等級 findings，才能進入 Stage 2。

## 2. Stage 2 — 聚合 + cross-agent diff 報告模組

- [x] 2.1 新增 `tests/unit/scripts/wxl-solver/aggregate-cross-agent.test.ts`，驗 `aggregateVerdicts` 三個分支：全部 `pass` 聚合為 `pass` 並 exit 0、含一個 `fail` 蓋過 `pass` 聚合為 `fail` 並 exit 1、全部 `inconclusive` 聚合為 `inconclusive` 並 exit 2；驗 `divergent`（per-agent verdict 不全相同時為 true）；驗 `renderCrossAgentReport` 的 human 與 JSON 兩種形狀（JSON 含 `perAgent[]` 與 `aggregate`）。確認測試先紅。
- [x] 2.2 新增 `scripts/wxl-solver/aggregate-cross-agent.ts`：定義 `PerAgentOutcome { runtime, verdict, reason, flag }`、`CrossAgentResult { perAgent, aggregateVerdict, aggregateExitCode, divergent }`；實作 `aggregateVerdicts(perAgent)` 落實 spec requirement「Aggregate verdict follows fail-over-pass-over-inconclusive precedence」的裁決順序，並實作 `renderCrossAgentReport(result, { json })` 落實 spec requirement「Cross-agent divergence report is always emitted」的人類可讀與 JSON 兩種輸出形狀；沿用 `scripts/wxl-solver/extract-flag.ts` 既有的 `Verdict` 型別。跑該測試檔轉綠。
- [x] 2.3 **[硬性 gate]** 跑 `/spectra-audit`（本 stage 對應的 git diff）→ triage → 必須先處理掉所有 Critical 與 High 等級 findings，才能進入 Stage 3。

## 3. Stage 3 — blind driver 多 agent 編排

- [x] 3.1 擴 `tests/unit/scripts/challenge-verify-blind-orchestration.test.ts`：以注入 runner 模擬多 runtime（不實際 spawn），驗每個 runtime 使用各自 workdir `tmp/wxl-verify/<slug>/<runtime>/`、各被 spawn 一次、聚合後 exit code 正確、收尾刪除整個 `tmp/wxl-verify/<slug>/`；並驗單 runtime 回歸：清單長度為 1 時使用 `tmp/wxl-verify/<slug>/`、輸出格式與 exit code 與本 change 前逐位元相同。確認測試先紅。
- [x] 3.2 在 `scripts/challenge-verify-blind.ts` 實作多 runtime loop，落實 spec requirement「Multi-runtime orchestration spawns each selected runtime in isolation」：以 `resolveRuntimes` 取清單；每個 runtime 於各自 workdir 跑既有 `buildPlayerPackage` → spawn → `extractFinalFlag` → `compareToCanonical`，收集 `PerAgentOutcome[]`；呼叫 `aggregateVerdicts` 取得 aggregate verdict 與 exit code；以 `renderCrossAgentReport` 印報告；收尾刪整個 `tmp/wxl-verify/<slug>/`。清單長度為 1 時走逐位元相容路徑（單一 workdir、原輸出格式、原 exit code）。沿用既有 `readCanonicalFlag` 與 `DEFAULT_TURN_BUDGET`。跑相關測試轉綠。
- [x] 3.3 **[硬性 gate]** 跑 `/spectra-audit`（本 stage 對應的 git diff）→ triage → 必須先處理掉所有 Critical 與 High 等級 findings，才能進入 Stage 4。

## 4. Stage 4 — CLI `--agents` 串接

- [x] 4.1 擴測試三個檔案：`tests/unit/scripts/challenge-verify-args.test.ts` 驗 `--agents claude,codex,gemini` 解析、去重保序；`tests/unit/scripts/challenge-verify-L4-dispatch.test.ts` 驗 `--agents` 缺 `--blind` 報錯且 exit 非零、precedence `--agents` > list 形式 env > 預設 `claude`、未知 runtime exit 1；`tests/unit/scripts/challenge-verify-json.test.ts` 驗 `--json` 輸出含 `perAgent[]` 與 `aggregate` 物件。確認測試先紅。
- [x] 4.2 在 `scripts/challenge-verify.ts` 的 `parseVerifyArgs()` 實作 spec requirement「The --agents flag selects runtimes and requires --blind」：新增 `agents?: RuntimeName[]` 解析 `--agents`；加入「`--agents` 須搭 `--blind`、否則報錯 exit 非零」檢查；落實 precedence（`--agents` > list 形式 `WXL_VERIFY_RUNTIME` > 預設 `claude`）；L4 runner 把 agents 傳進 blind 子行程（旗標或 env 形式）；`--json` 輸出帶 `perAgent` 與 `aggregate`。跑相關測試轉綠。
- [x] 4.3 **[硬性 gate]** 跑 `/spectra-audit`（本 stage 對應的 git diff）→ triage → 必須先處理掉所有 Critical 與 High 等級 findings，才能進入 Stage 5。

## 5. Stage 5 — reference doc + 雙語 skill prose + repo docs

- [x] 5.1 [P] 更新 `.agent/skills/wxl-creator/reference/runtime-cli.md`：記載 `--agents` 旗標、list 形式 `WXL_VERIFY_RUNTIME`、aggregate verdict 規則（fail > pass > inconclusive）與 cross-agent 報告輸出。
- [x] 5.2 [P] 雙語更新 `.agent/skills/wxl-creator/SKILL.md` 與 `.agent/skills/wxl-creator/SKILL.zhTW.md` 的 L4 段落：補上 maintainer 的 `--agents` 多 agent 選項說明；兩檔內容對等（parity）且維持 host-agent-neutral（不得引入 `AskUserQuestion`、`subagent_type` 等禁用 primitive）。
- [x] 5.3 [P] 更新 `README.md` 與 `CONTRIBUTE.md` 說明多 agent L4 用法；視需要在 `package.json` 加 `challenge:verify:cross` 便利 script。
- [x] 5.4 **[硬性 gate]** 跑 `/spectra-audit`（本 stage 對應的 git diff）→ triage → 必須先處理掉所有 Critical 與 High 等級 findings，才能進入 Stage 6。

## 6. Stage 6 — 全量驗證與最終 audit

- [x] 6.1 跑 `pnpm test`，全部 vitest 單元測試綠（mock spawn，不需實際安裝三個 agent CLI）。
- [x] 6.2 跑 `pnpm challenge:verify --help` 確認顯示 `--agents`；手動 smoke：`--agents` 缺 `--blind` 報錯、`WXL_VERIFY_RUNTIME=claude,codex` 正確解析成兩個 runtime。
- [x] 6.3 跑 `git grep -nE 'AskUserQuestion|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate|subagent_type' .agent/skills/wxl-creator/` 必須回 exit 1（無命中）；人工比對 `SKILL.md` 與 `SKILL.zhTW.md` 的 L4 段落雙語 parity。
- [x] 6.4 確認單 agent 預設路徑回歸不變：清單長度為 1 時 workdir 路徑、輸出格式、exit code 與本 change 前逐位元相同。
- [x] 6.5 **[硬性 gate]** 最後一次 `/spectra-audit`（針對全量 diff）→ triage → 必須先處理掉所有 Critical 與 High 等級 findings；完成後此 change 即可送 archive。

## 7. Spec requirement 涵蓋對應

每一條 spec requirement 對應到上方 Stage 中執行其 normative 行為的 task。本節僅為對應表，無新工作。

- **Requirement: Multi-runtime orchestration spawns each selected runtime in isolation** → 由 task 3.1（測試）與 3.2（實作 per-runtime workdir 隔離與單 runtime 回溯相容）覆蓋。
- **Requirement: Aggregate verdict follows fail-over-pass-over-inconclusive precedence** → 由 task 2.1（測試三裁決分支）與 2.2（實作 `aggregateVerdicts`）覆蓋。
- **Requirement: Cross-agent divergence report is always emitted** → 由 task 2.1（測試 `divergent` 與 JSON 形狀）、2.2（實作 `renderCrossAgentReport`）、3.2（在 driver 印出報告）、4.1（測試 `--json` 輸出形狀）共同覆蓋。
- **Requirement: The --agents flag selects runtimes and requires --blind** → 由 task 4.1（測試解析 / precedence / 缺 `--blind` 報錯 / 未知 runtime）與 4.2（在 `parseVerifyArgs` 實作 `--agents` 與 precedence）覆蓋。
- **Requirement: Runtime CLI dispatch via environment variable** → 由 task 1.1（測試 `resolveRuntimes` 各案：單值、list、去重保序、空、未知）與 1.2（實作 `resolveRuntimes` 並保留 `resolveRuntime` 相容）覆蓋；既有 per-runtime CLI 契約（claude/codex/gemini）由 task 3.2 沿用既有 `buildRuntimeCommand`。

## 8. Design decision 對應

對應 `design.md` Decisions 與 Implementation Contract 子節，標示每個決策由哪些 task 落實。

- **Decision 1: 新 capability + MODIFY 既有，而非只 MODIFY** → 由 spec 檔結構落實（`specs/l4-multi-agent-cross-check/spec.md` 為 ADDED 新 capability、`specs/wxl-blind-solve-verification/spec.md` 為 MODIFIED requirement），propose 階段已完成；apply 階段 task 6.3 透過 `spectra validate` 與雙語 parity 檢查間接驗證。
- **Decision 2: aggregate verdict 語意 = 可解性 + 分歧報告，優先序 fail > pass > inconclusive** → 由 task 2.1 與 2.2 落實（測試與實作裁決順序）。
- **Decision 3: `--agents` flag 與 list 形式 env 的 precedence** → 由 task 4.1（測試 precedence）與 4.2（實作 precedence）落實。
- **Decision 4: per-runtime 隔離 workdir** → 由 task 3.1（測試 workdir 隔離）與 3.2（實作 per-runtime workdir 與單 runtime 回溯相容）落實。
- **Decision 5: 抽出獨立聚合模組 `aggregate-cross-agent.ts`** → 由 task 2.1 與 2.2 落實（在 `scripts/wxl-solver/aggregate-cross-agent.ts` 建立純函式模組）。
- **觀察行為（apply 完成後）** → 由 task 6.2 落實（`--help` 顯示 `--agents`、smoke `--agents` 缺 `--blind` 報錯、list 形式 env 正確解析）。
- **程式契約** → 由 Stage 1–4 全部實作 task 落實（`resolveRuntimes`、`aggregate-cross-agent.ts`、blind driver loop、`parseVerifyArgs` 與 L4 runner）。
- **測試契約（TDD，mock spawn / 注入 runner）** → 由 task 1.1 / 2.1 / 3.1 / 4.1 全部 TDD 測試 task 落實（注入 runner、mock spawn、不需實際安裝三個 CLI）。
- **失敗模式與接受標準** → 由 task 6.1（`pnpm test` 全綠）、6.2（`--help` 顯示 `--agents`、smoke）、6.3（neutral-primitive grep + 雙語 parity）、6.4（單 agent 路徑回歸不變）落實。
- **apply stage 結構（每 stage 硬性 `/spectra-audit` gate）** → 由 task 1.3、2.3、3.3、4.3、5.4、6.5（每個 Stage 結尾的硬性 audit gate task）落實。

