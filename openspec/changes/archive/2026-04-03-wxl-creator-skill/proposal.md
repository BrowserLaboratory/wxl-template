## Why

現有的 `pnpm create:challenge` CLI 只產生空的 skeleton（帶有 `# TODO: Add the vulnerability here` 佔位符），出題者仍需手動撰寫漏洞程式碼、更新 frontmatter metadata、再分別跑 analyze 和 validate 確認正確性。這個流程步驟繁瑣、容易遺漏，需要一個互動式的 Claude Code skill 把整個出題流程串起來，從需求收集到品質驗證一氣呵成。

## What Changes

- 新增 `.agent/skills/wxl-creator` skill，提供互動式出題流程
- Skill 透過 `AskUserQuestion` 逐步收集出題參數：slug、backend 類型（flask/fastapi/php）、漏洞類型、描述、flag 格式、難度
- 呼叫 `pnpm create:challenge` 完成 scaffold
- 根據漏洞類型和描述，生成真正包含漏洞的應用程式碼，覆蓋 skeleton 的 TODO 佔位符
- 更新 `index.md` frontmatter，補上 description、tags、source_visible 等 metadata
- 依序執行 `pnpm challenge:analyze <slug>` 和 `pnpm challenge:validate <slug>`
- 若驗證失敗，進入自動修正循環：自動修正 → 顯示 diff 給使用者確認 → 重跑 validate，直到通過或達到循環上限
- 循環上限預設 10 次，可透過 `.agent/skills/wxl-creator/config.local.md` 的 YAML frontmatter 設定 `max_fix_attempts`

## Non-Goals

- 不修改現有的 `create-challenge.ts`、`challenge-validate.ts`、`challenge-analyze.ts` scripts — 直接調用它們
- 不建立新的 CLI 工具 — 這是一個 Claude Code skill，不是獨立的 CLI
- 不處理 challenge 的 keygen 流程 — `create:challenge` 已經自動呼叫 keygen
- 不負責產出「正確的解法」或 writeup — skill 只負責出題，不負責解題

## Capabilities

### New Capabilities

- `wxl-creator-skill`: Claude Code skill 的互動式出題流程，包含參數收集、scaffold 調用、漏洞程式碼生成、frontmatter 更新、以及帶循環限制器的自動修正驗證機制

### Modified Capabilities

（無）

## Impact

- 新增檔案：`.agent/skills/wxl-creator`（skill 主檔）、`.agent/skills/wxl-creator/config.local.md`（循環限制器 config）
- 依賴現有 scripts：`scripts/create-challenge.ts`、`scripts/challenge-analyze.ts`、`scripts/challenge-validate.ts`
- 依賴現有 pnpm scripts：`create:challenge`、`challenge:analyze`、`challenge:validate`
- 產出物：`docs/challenge/<slug>/` 目錄下完整的 challenge 檔案結構
