## 1. Skill 檔案結構建立

- [x] [P] 1.1 建立 `.agent/skills/wxl-creator` skill 主檔，包含 frontmatter（name、description、觸發條件），以及空的 skill 骨架。對應 design 的「Skill 檔案結構」決策
- [x] [P] 1.2 建立 `.agent/skills/wxl-creator/config.local.md`，包含 YAML frontmatter `max_fix_attempts: 10`。對應 spec「Fix loop has a configurable maximum iteration limit」

## 2. 互動收集流程

- [x] 2.1 實作 skill 的參數提取邏輯：從使用者初始 prompt 中解析已提供的參數（slug、backend、vulnerability type、description、difficulty、flag、title）。對應 spec「Skill collects challenge parameters interactively」及 design 的「互動收集流程設計」
- [x] 2.2 實作三輪 `AskUserQuestion` 互動收集：第一輪必填項（slug、backend、漏洞類型）、第二輪內容項（描述、難度）、第三輪可選項（flag 格式、title），跳過已從初始 prompt 提取的參數

## 3. Scaffold 呼叫

- [x] 3.1 實作呼叫 `pnpm create:challenge --name <slug> --backend <backend> --difficulty <difficulty> --flag <flag> --title <title>` 的邏輯，處理成功和失敗（collision 偵測）。對應 spec「Skill calls create:challenge for scaffolding」

## 4. 漏洞程式碼生成

- [x] 4.1 實作讀取 scaffold 產出的 skeleton 檔案，根據漏洞類型和描述重寫為包含真實可利用漏洞的程式碼。涵蓋 flask、fastapi、php 三種 backend。對應 spec「Skill generates vulnerable application code」及 design 的「漏洞程式碼生成策略」

## 5. Frontmatter 與描述更新

- [x] 5.1 實作更新 `index.md` frontmatter（加入 description、tags、source_visible）及 markdown body 描述。對應 spec「Skill updates index.md frontmatter with metadata」

## 6. 驗證與自動修正循環

- [x] 6.1 實作執行 `pnpm challenge:analyze <slug>` 和 `pnpm challenge:validate <slug>` 並解析輸出結果。對應 spec「Skill runs analyze and validate after creation」
- [x] 6.2 實作自動修正循環：解析錯誤 → 自動修正 → 顯示 diff → 等待使用者確認 → 重跑驗證。對應 spec「Skill auto-fixes validation errors with user confirmation」及 design 的「自動修正循環設計」
- [x] 6.3 實作循環限制器：讀取 `config.local.md` 取得 `max_fix_attempts`，若檔案不存在則使用預設值 10。達到上限時停止並顯示剩餘錯誤。對應 spec「Fix loop has a configurable maximum iteration limit」及 design 的「Config 格式」

## 7. 整合與完成訊息

- [x] 7.1 實作完整流程串接：收集 → scaffold → 生成 → 更新 → 驗證 → 修正循環，以及最終的成功/失敗報告訊息
