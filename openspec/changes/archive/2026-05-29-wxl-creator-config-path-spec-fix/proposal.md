## Why

`openspec/specs/wxl-creator-skill/spec.md` 的 Requirement #7（「Fix loop has a configurable maximum iteration limit」）自相矛盾：本文與其中兩個 Scenario 寫 config 位於 `.agent/skills/wxl-creator/config.local.md`（此路徑實際上不存在），但同一條 Requirement 的 `@trace code:` 清單與真正的實作都讀 `.wxl-creator/config.yaml`（此檔存在，內容為 `max_fix_attempts: 10`）。這是純 spec-debt，會誤導後續維護者與盲解驗證者。

## What Changes

- 以單一 `MODIFIED Requirements` delta 重寫 `wxl-creator-skill` 的 Requirement #7，使其一致引用 `.wxl-creator/config.yaml`：
  - 本文：`.agent/skills/wxl-creator/config.local.md` with YAML frontmatter → `.wxl-creator/config.yaml`。
  - 範例 code block：把 `---` 包夾的 frontmatter 改成真實的 plain-YAML 形狀（`# wxl-creator skill configuration` + `max_fix_attempts: 10`），並把誤嵌在 yaml code fence 內的 `@trace` 註解搬回 Requirement 末尾的慣例位置。
  - Scenario「Custom limit configured」：`config.local.md` → `.wxl-creator/config.yaml`。
  - Scenario「Config file does not exist」：`.agent/skills/wxl-creator/config.local.md` → `.wxl-creator/config.yaml`。
- 不改 Requirement header（header 未提到錯誤路徑），保留 `@trace` 內容不變（其 `code:` 清單已正確列出 `.wxl-creator/config.yaml`），只調整 `@trace` 位置。

## Non-Goals

- **不**修改任何實作程式碼或 runtime 行為——實作（wxl-creator skill 與 workflow 文件）早已正確讀取 `.wxl-creator/config.yaml`，本 change 純粹對齊 spec 文字。
- **不**改寫已封存的歷史 change（`openspec/changes/archive/2026-04-03-wxl-creator-skill/` 內仍會保留 `config.local.md` 的字樣，視為歷史紀錄）。
- **不**重新命名 Requirement #7 的 header，亦不新增／刪除任何 Requirement。
- **不**處理其他 P3 候選（spec 整併、release workflow 等）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `wxl-creator-skill`: Requirement #7 的 config 路徑、範例格式與 `@trace` 位置修正，使其與實作一致。

## Impact

- Affected specs: `wxl-creator-skill`（僅 Requirement #7）。
- Affected code:
  - Modified: 無（實作已符合 spec；`.wxl-creator/config.yaml` 既有且正確）。
  - New: 無。
  - Removed: 無。
