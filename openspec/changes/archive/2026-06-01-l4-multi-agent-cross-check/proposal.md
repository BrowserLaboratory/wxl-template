## Why

L4 blind-solve 驗證目前只能 spawn 單一 agent runtime（`WXL_VERIFY_RUNTIME` 取 `claude` / `codex` / `gemini` 其中一個，預設 `claude`），無法回答「這題是否所有 agent 都解得出、或只有某個 agent 解得出」。跨 agent 的解題分歧是題目難度校準與 skill 跨 agent 中立性的重要訊號，目前完全沒有被量測。

## What Changes

- L4 從「單 runtime」擴成「多 runtime 交叉驗證」：同一題對多個 agent 各 spawn 一次，逐一盲解，再聚合結果。
- 新增 cross-agent **divergence 報告**作為頭號產出：列出每個 agent 的 verdict 與取得的 flag，並標示彼此分歧。
- aggregate verdict 採「可解性 + 分歧報告」語意，裁決優先序 **fail > pass > inconclusive**：任一 agent 給出符合 flag 格式但非正解的 flag 即 aggregate fail（疑似非預期解）；否則只要 ≥1 agent 解出正解即 aggregate pass；皆未解出則 inconclusive。對應 exit code 0/1/2。
- `challenge:verify` 與 blind driver 新增 `--agents <list>` 旗標；`WXL_VERIFY_RUNTIME` 同步支援 comma-separated list。precedence：`--agents` > list 形式 env > 預設 `claude`。`--agents` 須搭 `--blind`。
- **單一 agent 既有行為完全不變**：未給 `--agents`、env 為單值或未設時，輸出與 exit code 與現況逐位元相同。
- 雙語 skill prose（SKILL.md / SKILL.zhTW.md）與 reference/runtime-cli.md 補上 maintainer 的多 agent 選項說明，維持 host-agent-neutral。

## Non-Goals

- 不在 CI 自動跑多 agent L4（L4 維持 maintainer-only；單元測試以 mock spawn 驗證，不需實際安裝三個 CLI）。
- 不修正既有「spec 寫 claude `--output-format json` 但實作走純文字」的歷史歧異（超出本 change 範圍）。
- 不改動 L1 / L2 / L3 任一層、不改 player package 內容契約（仍只含 description.md + META.yaml）。
- 不新增第四種 runtime；可選 runtime 仍為 claude / codex / gemini。

## Capabilities

### New Capabilities

- `l4-multi-agent-cross-check`: 多 agent L4 編排（per-runtime 隔離 workdir）、aggregate verdict 規則（fail > pass > inconclusive）、cross-agent divergence 報告，以及 `--agents` flag 與 list 形式 `WXL_VERIFY_RUNTIME` 的解析與 precedence。

### Modified Capabilities

- `wxl-blind-solve-verification`: 「Runtime CLI dispatch via environment variable」requirement 擴成可接受 comma-separated list（保留單值預設 `claude` 行為與既有 per-runtime 指令契約）。

## Impact

- Affected specs:
  - New: `l4-multi-agent-cross-check`
  - Modified: `wxl-blind-solve-verification`
- Affected code:
  - New: scripts/wxl-solver/aggregate-cross-agent.ts, tests/unit/scripts/wxl-solver/aggregate-cross-agent.test.ts
  - Modified: scripts/challenge-verify-blind.ts, scripts/challenge-verify.ts, scripts/wxl-solver/spawn-runtime.ts, tests/unit/scripts/wxl-solver/spawn-runtime.test.ts, tests/unit/scripts/challenge-verify-blind-orchestration.test.ts, tests/unit/scripts/challenge-verify-args.test.ts, tests/unit/scripts/challenge-verify-L4-dispatch.test.ts, tests/unit/scripts/challenge-verify-json.test.ts, .agent/skills/wxl-creator/reference/runtime-cli.md, .agent/skills/wxl-creator/SKILL.md, .agent/skills/wxl-creator/SKILL.zhTW.md, README.md, CONTRIBUTE.md, package.json
