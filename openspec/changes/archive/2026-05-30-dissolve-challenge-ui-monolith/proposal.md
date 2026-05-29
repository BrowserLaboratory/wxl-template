## Why

`challenge-ui` spec（1347 行、18 條 Requirement）是 P3.1 spec consolidation 審視確認的「challenge-ui cluster」核心問題，是一個歷史累積、格式損壞的 monolith：檔頭以 `## ADDED Requirements` 開場（delta 格式外洩進 canonical spec）、**缺少 `## Purpose`**（違反 `spec-corpus-governance`「Active specifications declare concrete purpose text」）、夾帶 29 個多為複製貼上的巨大 `@trace` 區塊，且多條 Requirement 是既有 atomic spec 的 summary-stub 重複——例如單 scenario 的「MergedNav component」對上 `challenge-merged-nav` 的 3 條完整 Requirement、「BrowserChrome component」對上 `challenge-browser-chrome`，而「DescriptionModal component」甚至與 canonical `challenge-description-modal`「DescriptionModal component does not exist」互相矛盾。這些重複、矛盾與格式缺陷提高維護成本、易產生 drift。

## What Changes

- 將 `challenge-ui` 的 18 條 Requirement 逐條盤點，**獨有內容遷入各 canonical atomic spec、已被涵蓋的重複內容直接移除**，最後移除整個 `challenge-ui` capability 目錄：
  - 遷入 `challenge-design-tokens`（2 條）：UnoCSS utility class 套用契約、平台雙主題套色契約。
  - 遷入 `challenge-browser-chrome`（3 條）：BrowserPanel 的 sandboxed iframe 渲染、iframe 內表單攔截、直接 dispatch 與 cookie-jar／redirect 機制。
  - 遷入 `network-traffic-panel`（2 條）：Repeater Panel 原始 HTTP 請求編輯、BrowserPanel 模擬真實瀏覽器 header。
  - 遷入 `challenge-layout`（4 條 ADDED + 1 條 MODIFIED）：white-box source viewer、header 的 NotesButton、usePentestNotes 與 NotesModal 整合、executionId threading；並把既有「Flag submit form…」條 MODIFIED 補上 flag 提交行為與滲透筆記匯出（折入內容重複的獨立 FlagSubmit 筆記匯出條）。
  - 直接移除（已被既有 spec 涵蓋，不遷移）：過時的「three switchable panels」標題（實際五分頁已由 `challenge-layout` 涵蓋）、Terminal Panel（由 `wxlsh-terminal` 涵蓋）、MergedNav 與 BrowserChrome stub（由各自 atomic spec 涵蓋）、以及與 canonical 矛盾的 DescriptionModal stub（刻意丟棄，避免重新引入矛盾）。
- 移除 `challenge-ui` capability spec 目錄。經查證全 corpus 無任何 spec 以 capability 名稱引用 `challenge-ui`，遷移不會產生 orphan reference。
- 本 change 為純 spec 文字重構：不更動任何 TypeScript／Vue／runtime 程式碼與其執行行為，spec 數由 42 收斂為 41。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-design-tokens`：新增「UnoCSS utility class 套用」與「平台雙主題套色」2 條 Requirement。
- `challenge-browser-chrome`：新增 BrowserPanel iframe 渲染、表單攔截、dispatch／cookie-jar 3 條 Requirement。
- `network-traffic-panel`：新增 Repeater 原始請求編輯、BrowserPanel 模擬瀏覽器 header 2 條 Requirement；並一併正規化此 spec 既有格式缺陷（apply 時發現它與 challenge-ui 同病：外洩 `## ADDED Requirements`、無 title／`## Purpose`），補上 title + 具體 Purpose 以符合 spec-corpus-governance。
- `challenge-layout`：新增 white-box viewer、NotesButton、pentest notes 整合、executionId threading 4 條 Requirement，並 MODIFIED 既有 flag 提交條。

## Impact

- Affected specs:
  - 修改（遷入 challenge-ui 獨有 Requirement）：openspec/specs/challenge-design-tokens/spec.md、openspec/specs/challenge-browser-chrome/spec.md、openspec/specs/network-traffic-panel/spec.md、openspec/specs/challenge-layout/spec.md
  - 移除（capability 目錄刪除、獨有內容已遷入上述 spec、重複內容捨棄）：openspec/specs/challenge-ui/
  - 不變：challenge-merged-nav、challenge-description-modal、challenge-rwd、challenge-tools-control、code-editor-panel、challenge-list、wxlsh-terminal
- Affected code: 無。本 change 僅重構 spec 文字，UI 元件（BrowserPanel、FlagSubmit、NotesModal 等）與其行為皆不更動。
