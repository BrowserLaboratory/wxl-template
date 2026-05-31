## Context

L4 blind-solve 是 `wxl-creator` 出題技能四層驗證的最後一層：spawn 一個 agent CLI、只給玩家可見素材（`description.md` + `META.yaml`，無源碼無 flag），看它能不能盲解出 canonical flag。現行實作只支援單一 runtime：

- `scripts/wxl-solver/spawn-runtime.ts` — `resolveRuntime(env)` 從 `WXL_VERIFY_RUNTIME` 取單一值（`claude` / `codex` / `gemini`，預設 `claude`）；`buildRuntimeCommand()` 依 runtime 組指令；`KNOWN_RUNTIMES`、`UnknownRuntimeError` 既有。
- `scripts/challenge-verify-blind.ts` — 建 player package（`buildPlayerPackage`）→ spawn → `extractFinalFlag` → `compareToCanonical` → 取 verdict（`pass`/`fail`/`inconclusive`）→ exit 0/1/2 → cleanup `tmp/wxl-verify/<slug>/`。
- `scripts/challenge-verify.ts` — `parseVerifyArgs()` 解析 `--blind` / `--layers` / `--json`；`selectLayers()`；`runVerify()` 串接 L1→L4；L4 runner 以子行程跑 blind。

L4 為 maintainer-only、不在 CI 跑（需實際安裝 agent CLI）。單元測試以注入 runner / mock spawn 驗證邏輯。

R9（roadmap `generic-discovering-sunbeam.md`）要把 L4 擴成「多 agent 交叉驗證」：同一題對多個 agent 各跑一次、聚合、輸出 cross-agent diff，作為難度校準與 skill 跨 agent 中立性的訊號。本 change 無前置依賴，完成後解鎖 R11（hint-quality-check）。

## Goals / Non-Goals

**Goals:**
- L4 支援同題多 agent 各 spawn 一次，per-runtime 隔離 workdir，互不汙染。
- 產出 cross-agent divergence 報告（每 agent 的 verdict + 取得 flag + 分歧標示）作為頭號輸出。
- aggregate verdict 採可解性語意，裁決優先序 fail > pass > inconclusive，對應 exit 0/1/2。
- 新增 `--agents <list>` 旗標與 list 形式 `WXL_VERIFY_RUNTIME`，含明確 precedence。
- 單一 agent 既有路徑 100% 回溯相容（輸出與 exit code 不變）。
- 雙語 skill prose 與 reference doc 同步，維持 host-agent-neutral。

**Non-Goals:**
- 不在 CI 自動跑多 agent L4（仍 maintainer-only）。
- 不修既有「spec 寫 claude `--output-format json`、實作走純文字」歧異。
- 不改 L1/L2/L3、不改 player package 內容契約。
- 不新增第四種 runtime。

## Decisions

### Decision 1: 新 capability + MODIFY 既有，而非只 MODIFY

新增 `l4-multi-agent-cross-check` capability 承載「多 agent 編排 / aggregate verdict / divergence 報告 / `--agents` 解析」新 requirements；同時 MODIFY `wxl-blind-solve-verification` 的「Runtime CLI dispatch via environment variable」requirement，把 `WXL_VERIFY_RUNTIME` 從單值擴成可接受 comma-separated list。

理由：對齊 change 名稱與 R8（a01-access-control-template-pack）確立的「新 capability + MODIFIED 既有」雙軌 pattern；把「跨 agent 語意」獨立成一個可被後續 R10/R11 引用的 capability 載體，避免把單 agent 與多 agent 邏輯混在同一 spec。

**Alternatives considered:**
- 只 MODIFY `wxl-blind-solve-verification`（全部新 requirement 塞進去）：所有 L4 邏輯集中，但單/多 agent 混雜、且新語意難以被後續 change 乾淨引用。已否決。

### Decision 2: aggregate verdict 語意 = 可解性 + 分歧報告，優先序 fail > pass > inconclusive

裁決規則（依序短路）：
1. 任一 per-agent verdict 為 `fail` → aggregate `fail`（exit 1）。「fail」指 agent 給出符合 `flag_regex` 但 ≠ canonical 的 flag，或不符 regex 的 flag——代表疑似非預期解或 spec 問題，最該被攔。
2. 否則 ≥1 per-agent verdict 為 `pass` → aggregate `pass`（exit 0）。
3. 否則（全 `inconclusive`）→ aggregate `inconclusive`（exit 2）。

無論 aggregate 結果為何，皆印出完整 cross-agent 報告（每 agent verdict + flag + 是否分歧）。

**Alternatives considered:**
- 嚴格共識（全數 pass 才 pass）：最嚴謹，但 gemini MCP 尚不成熟期間幾乎永遠卡 inconclusive，實務不可用。已否決。
- 多數決：介於兩者，但無法表達「一個錯誤 flag 就該攔」的安全語意。已否決。
- 純報告（永遠 exit 0）：失去 gate 能力，錯誤 flag 不會被攔。已否決。

### Decision 3: `--agents` flag 與 list 形式 env 的 precedence

precedence（高→低）：`--agents <list>` > list 形式 `WXL_VERIFY_RUNTIME` > 預設 `['claude']`。`--agents` 僅在 L4 有意義，故須搭 `--blind`；單獨給 `--agents` 而無 `--blind` 時報錯並 exit 非零。清單解析：逗號分隔、trim、去重、保序；任一未知值沿用既有 `UnknownRuntimeError` 行為（exit 1，列出 accepted）。

**Alternatives considered:**
- 只用 env、不加 flag：roadmap 明確要求 flag；且 CLI flag 比 env 更利於一次性指定。已否決。
- `--agents` 自動隱含 `--blind`：較便利但會讓「L4 才能多 agent」的契約變模糊，且與 `selectLayers` 既有語意衝突。改採「須明確搭 `--blind`、否則報錯」。

### Decision 4: per-runtime 隔離 workdir

每個 runtime 用各自 ephemeral workdir `tmp/wxl-verify/<slug>/<runtime>/`（內含自己的 player-package 與 run.log），避免並行/序列執行互相覆蓋。收尾仍 best-effort 刪除整個 `tmp/wxl-verify/<slug>/`。**清單長度為 1 時**，路徑與輸出格式維持與現況逐位元相同（不引入 `<runtime>` 子目錄、不改報告格式），以保證回溯相容。

**Alternatives considered:**
- 共用單一 workdir：player package 內容相同看似可共用，但 run.log 會互相覆蓋、且並行不安全。已否決。

### Decision 5: 抽出獨立聚合模組 `aggregate-cross-agent.ts`

新增 `scripts/wxl-solver/aggregate-cross-agent.ts`，純函式 `aggregateVerdicts(perAgent)` 與 `renderCrossAgentReport(result, { json })`，與 spawn / I/O 解耦，便於單元測試（不需 mock 子行程即可測裁決與報告）。沿用 `extract-flag.ts` 的 `Verdict` 型別。

## Implementation Contract

### 觀察行為（apply 完成後）
- `pnpm challenge:verify <slug> --blind --agents claude,codex,gemini` 對三個 runtime 各跑一次，印出 cross-agent 報告，exit code 依 Decision 2。
- `pnpm challenge:verify <slug> --blind`（無 `--agents`、env 未設）行為與現況逐位元相同。
- `--agents` 無 `--blind` → 報錯、exit 非零。
- `WXL_VERIFY_RUNTIME=claude,codex pnpm challenge:verify <slug> --blind` 等同 `--agents claude,codex`（flag 未給時）。

### 程式契約
- `scripts/wxl-solver/spawn-runtime.ts`：新增 `resolveRuntimes(raw: string | undefined): RuntimeName[]`（逗號分隔、trim、去重、保序、空/未設回 `['claude']`、未知值丟 `UnknownRuntimeError`）。`resolveRuntime` 保留並改為回傳 `resolveRuntimes(raw)[0]`。
- `scripts/wxl-solver/aggregate-cross-agent.ts`（新）：`interface PerAgentOutcome { runtime: RuntimeName; verdict: Verdict; reason: string; flag: string | null }`；`interface CrossAgentResult { perAgent: PerAgentOutcome[]; aggregateVerdict: Verdict; aggregateExitCode: number; divergent: boolean }`；`aggregateVerdicts(perAgent)`（Decision 2）；`renderCrossAgentReport()`（human + JSON）。`divergent` 定義為「per-agent verdict 不全相同」。
- `scripts/challenge-verify-blind.ts`：以 `resolveRuntimes` 取清單；逐一在 `tmp/wxl-verify/<slug>/<runtime>/` 跑既有 build→spawn→extract→compare，收集 `PerAgentOutcome[]`；呼叫 `aggregateVerdicts`；印報告；exit aggregate code；cleanup。長度 1 走相容路徑。
- `scripts/challenge-verify.ts`：`parseVerifyArgs()` 新增 `agents?: RuntimeName[]`（解析 `--agents`）；驗證 `--agents` 須搭 `--blind`；L4 runner 把 agents 傳進 blind 子行程（旗標或 env）；`--json` 輸出含 `perAgent` 與 `aggregate`。

### 測試契約（TDD，mock spawn / 注入 runner）
- `spawn-runtime.test.ts`：`resolveRuntimes` 各案（單值、多值、去重、保序、空、未知）。
- `aggregate-cross-agent.test.ts`（新）：三裁決分支（全 pass→pass、一 fail 蓋過 pass→fail、全 inconclusive→inconclusive）、`divergent` 判定、報告 human/JSON 形狀。
- `challenge-verify-blind-orchestration.test.ts`：注入多 runtime runner，驗 per-runtime workdir、聚合、exit code、cleanup；單 runtime 回歸。
- `challenge-verify-args.test.ts` / `challenge-verify-L4-dispatch.test.ts` / `challenge-verify-json.test.ts`：`--agents` 解析、precedence、須搭 `--blind`、JSON 形狀。

### 失敗模式與接受標準
- 任一 runtime CLI 不在 PATH：沿用既有 exit 2 / 訊息語意（per-runtime 記入報告，不應讓整批靜默成功）。
- 接受標準：`pnpm test` 全綠；`pnpm challenge:verify --help` 顯示 `--agents`；單 agent 路徑回歸不變；`.agent/skills/wxl-creator/` neutral-primitive grep 無命中；SKILL.md/SKILL.zhTW.md L4 段落雙語 parity。

### apply stage 結構（每 stage 硬性 `/spectra-audit` gate）
六個 stage：(1) `resolveRuntimes`、(2) 聚合模組、(3) blind driver 多 agent 編排、(4) CLI `--agents` 串接、(5) spec + reference doc + 雙語 prose + repo docs、(6) 全量驗證 + spec sync。**每個 stage 最後一個 task 固定為「跑 `/spectra-audit`（本 stage diff）→ triage → 修掉 Critical/High 才進下一 stage」**（硬性 gate）。

## Risks / Trade-offs

- **gemini MCP 不成熟 → 常 inconclusive**：採可解性語意（≥1 pass 即 pass）緩解；分歧報告仍如實揭露 gemini 解不出。
- **回溯相容破壞**：以「清單長度 1 走逐位元相同路徑」與回歸測試守住；`resolveRuntime` 保留為 `resolveRuntimes(...)[0]`。
- **archive 吃 @trace（記憶教訓）**：MODIFIED requirement 的 @trace 可能在 archive 時被吃掉，需於 archive 後人工驗證並補回。
- **L4 不在 CI 跑**：實作正確性靠 mock spawn 單元測試保證；真實三 agent 跑屬 maintainer 手動，文件需說明清楚。
- **per-runtime workdir 體積**：多 runtime 各自 workdir 增加暫存空間；以收尾 cleanup 與 `tmp/wxl-verify/` gitignore 守住。

## Migration Plan

純增量、向後相容：未使用 `--agents` / 單值 env 的既有呼叫行為不變，無需資料遷移。新功能由 maintainer 明確以 `--agents` 或 list 形式 env 啟用。

## Open Questions

無（三個設計分歧——verdict 語意、spec 結構、audit gate 強度——已於 propose 前由 maintainer 拍板）。
