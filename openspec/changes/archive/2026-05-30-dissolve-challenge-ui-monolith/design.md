## Context

`challenge-ui` spec（1347 行、18 條 Requirement）是 P3.1 spec consolidation 審視確認的「challenge-ui cluster」核心問題。它是歷史累積、格式損壞的 monolith：以 `## ADDED Requirements` 開場（delta 格式外洩進 canonical spec）、缺 `## Purpose`（違反 `spec-corpus-governance`）、夾帶 29 個多為複製貼上的巨型 `@trace` 區塊，且多條 Requirement 是既有 atomic spec 的 summary-stub 重複，其中「DescriptionModal component」更與 canonical `challenge-description-modal` 互相矛盾。

本 change 為 P3.1 兩個 consolidation change 中的 Change B（challenge-ui cluster）；Change A（runtime family，`consolidate-backend-runtimes`）已於先前 archive。已查證全 corpus 無任何 spec 以 capability 名稱引用 `challenge-ui`，遷移不會產生 orphan reference。

## Goals / Non-Goals

**Goals:**

- 以「逐條盤點 → 獨有內容遷入 canonical atomic spec → 已涵蓋的重複內容移除 → 刪整個 `challenge-ui` 目錄」收斂 monolith。
- 無損遷移：保留所有獨有 Requirement 的 normative 文字與全部 scenario。
- 結束狀態：spec 數 42 → 41、跨 corpus 零重複 requirement header、每個觸及的 spec 都有具體 `## Purpose`。

**Non-Goals:**

- 不更動任何 TypeScript／Vue／runtime 程式碼與其執行行為（純 spec 文字重構）。
- 不新增任何 spec（與 Change A 建立新 capability 的方向相反）。
- 不處理 `challenge-file-structure`、`challenge-precommit-hook`（非 UI、與 monolith 無重疊）。
- 不為 Repeater Panel、SourceViewer 另立新 capability spec。
- 不重寫各目的地 spec 的既有 Requirement（唯一例外：`challenge-layout` 的 flag 那條 MODIFIED）。

## Decisions

- **D1（遷入 vs 移除判準）**：以「該 Requirement 內容是否已被某 atomic spec 涵蓋」為準。已涵蓋者移除（#3 三分頁過時標題、#6 Terminal Panel、#15 MergedNav stub、#17 BrowserChrome stub）；獨有者遷入最適 canonical spec。遷入落點：`challenge-design-tokens`（#1、#2）、`challenge-browser-chrome`（#4、#5、#18）、`network-traffic-panel`（#7、#10）、`challenge-layout`（#8、#11、#12、#13 ADDED；#9 MODIFIED）。
- **D2（移除方式）**：`challenge-ui` 整個 capability 目錄於 apply 階段以 git rm 刪除，**不**寫 REMOVED delta、**不**列入 proposal Capabilities——沿用 Change A 慣例（Spectra 無乾淨的「刪整個 capability」delta op，且 archive 對 REMOVED 常回報 removed:0 不套用）。此步使 corpus 42 → 41。
- **D3（flag 用 MODIFIED 而非 ADDED）**：#9 套用在 `challenge-layout` 既有「Flag submit form is fixed at the bottom of the left column」條上（沿用 header），避免與既有 placement 條產生重複 header（governance 要求 unique header）。#14「FlagSubmit supports a notes export download action」的 onExportNotes 內容與 #9 逐字重複，折入同一條、丟棄獨立 header。
- **D4（矛盾 stub 丟棄）**：#16 DescriptionModal stub 宣稱該元件存在，與 canonical `challenge-description-modal`「DescriptionModal component does not exist」矛盾，刻意丟棄不遷移（遷移會重新引入矛盾）。
- **D5（@trace 精簡）**：各遷入 Requirement 的 `@trace` 改寫為只列該條真正相關的 code/tests，不複製 monolith 的巨型貼上區塊。ADDED 條的 `@trace` 隨 verbatim body 一併保留；MODIFIED（#9）條的 `@trace` 已知會被 archive 吃掉，列為 apply 階段手動補回項。

## Implementation Contract

- **Observable（apply 後）**：`openspec/specs/challenge-ui/` 不再存在；其 18 條中的獨有內容分散於 4 個 atomic spec（新增 11 條 ADDED header + 1 條 MODIFIED）；其餘 6 條因已被既有 spec 涵蓋而捨棄；spec 總數為 41。
- **Interface（delta 落點）**：4 個 delta 檔位於 openspec/changes/dissolve-challenge-ui-monolith/specs/ 下，對應 4 個目的地 capability；操作僅 `## ADDED Requirements` 與 `## MODIFIED Requirements`，無 REMOVED。
- **Failure / landmine**：archive 對 MODIFIED 條會吃掉 `@trace`、對 REMOVED 常半套用——故採 git rm（避開 REMOVED）+ MODIFIED 後手動驗 `@trace`。
- **Acceptance criteria**：
  - `ls -d openspec/specs/*/ | wc -l` 回傳 41
  - `rg -l 'challenge-ui' openspec/specs/` 回傳 0（無 capability 名稱殘留引用）
  - 4 個目的地 spec 各自 `rg '^### Requirement:' | sort | uniq -d` 為空（零重複 header）且含 `## Purpose`
  - `challenge-layout` 的 flag MODIFIED 條於 archive 後仍帶 `@trace`（被吃則自 archived delta 補回）
  - `git status --porcelain` 僅顯示 openspec/ 下變更（無 TypeScript／Vue 變更）；`pnpm test --run` 綠
- **Scope boundary**：in scope = 上述 4 個 delta + 刪 `challenge-ui` 目錄 + apply 後驗證/補 `@trace`；out of scope = 任何程式碼／測試／其他 spec。

## Risks / Trade-offs

- **archive 吃 @trace（MODIFIED #9）**：高機率發生，以 apply 階段手動補回緩解。
- **#7 Repeater 落點 = `network-traffic-panel`（least-bad）**：RepeatPanel 嚴格說可為獨立元件，但無專屬 spec 且本 change 不新增 spec；network-traffic-panel 擁有 Network↔Repeater pipeline 與「Send to Repeater」，為最近的家。
- **#8 White-box 落點 = `challenge-layout`**：唯讀 SourceViewer 由 `source_visible` frontmatter gating、屬頁面組裝（layout 領域），刻意不放可編輯的 `code-editor-panel`。
- **目的地 spec 體積上升**：例如 `challenge-layout` 由 13 條增為約 17 條，但仍遠小於 1347 行的 monolith 且職責清楚。
