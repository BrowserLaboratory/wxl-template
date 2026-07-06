## 1. TDD：先寫 fork:init 失敗測試（TDD 覆蓋敏感鍵分類與 dry-run 不落地）

- [x] 1.1 撰寫 `tests/unit/scripts/fork-init.test.ts`（以 fixture 目錄）先寫失敗測試，覆蓋：A-mode 身分欄位改寫、B-mode 四個 runtime 敏感鍵被分類且出現在報告、`--dry-run` 零檔案寫入、排除清單（`pnpm-lock.yaml`／`openspec/changes/archive`）生效、rebrand 冪等。行為：測試表達 Provides a deterministic fork:init CLI 與 Dry-run previews all edits without writing 的可觀察契約。驗證：`pnpm exec vitest run tests/unit/scripts/fork-init.test.ts` 於實作前為紅（fail）。

## 2. 實作 fork:init CLI

- [x] 2.1 實作 `scripts/fork-init.ts` 的 flag 解析與 A/B 模式選擇（`--name`/`--author`/`--repo`/`--base`/`--rebrand`/`--dry-run`），對應 fork:init CLI 契約與 A/B 兩模式；缺必要 flag 或 `--repo` 非 `owner/repo` 時非零 exit 不 silent。行為：Provides a deterministic fork:init CLI。驗證：測試中 flag 解析與 mode 選擇案例轉綠。
- [x] 2.2 實作 A-mode 確定性編輯：`package.json` 身分欄位、`.vitepress/config.mts` 的 `base`/socialLinks/title、README.md 與 CONTRIBUTE.md 的 GitHub URLs、複製 `deploy.yml.template` 至 `.github/workflows/deploy.yml`。行為：A-mode rewrites identity fields, base, URLs, and deploy workflow。驗證：A-mode 測試案例轉綠，且 fixture 上 `BrowserLaboratory/wxl-template` 零殘留。
- [x] 2.3 實作 B-mode 分類式 `wxl` rename 與 runtime 敏感鍵獨立分類與結尾報告（`wxl-locale`／`WXL_VERIFY_RUNTIME`／`tmp/wxl-verify`／`wxl-` release 前綴），並落實 rebrand rename 的排除範圍與安全邊界（排除 lockfile／node_modules／.git／archive、有邊界替換、冪等）。行為：Rebrand mode renames the wxl short-name with classified runtime-sensitive-key handling。驗證：B-mode 敏感鍵、排除清單、冪等測試案例轉綠。
- [x] 2.4 實作 dry-run 與變更摘要：`--dry-run` 只計算並印出規劃編輯、零寫入；正式執行結尾列出每檔變更與敏感鍵摘要。行為：Dry-run previews all edits without writing。驗證：dry-run 測試確認 fixture byte-for-byte 不變。
- [x] 2.5 於 `package.json` 新增 `fork:init` script 指向 `scripts/fork-init.ts`。行為：`pnpm fork:init` 可被呼叫。驗證：`pnpm fork:init --help`（或無參數）以預期非零/說明退出，且整份 `pnpm exec vitest run tests/unit/scripts/fork-init.test.ts` 全綠。

## 3. skill 改寫為 script-driven wrapper

- [x] 3.1 改寫 `.agent/skills/wxl-fork-init/SKILL.md` 為 script-driven wrapper：偵測 A/B 意圖、以純文字問題區塊收集參數、呼叫 `pnpm fork:init`（先 `--dry-run` 預覽再正式）、跑既有 Verification grep；不再於 prose 重述確定性編輯細節。行為：The wxl-fork-init skill drives the CLI。驗證：SKILL.md 內含 `pnpm fork:init` 呼叫且不含手動逐檔 Edit 指示；host-neutral grep exit 1。
- [x] 3.2 更新 `.agent/skills/wxl-fork-init/AGENTS.md` 關係表，新增 `pnpm fork:init` CLI 與其職責；File layout 對齊實際檔案。行為：AGENTS.md 反映 script-driven 架構。驗證：AGENTS.md 提及 `fork:init` 且 host-neutral grep exit 1。

## 4. 整合驗收

- [x] 4.1 fork:init 單元測試全綠且既有測試套件不退：行為：CLI 契約由測試守護。驗證：`pnpm exec vitest run` exit 0。
- [x] 4.2 change 整體驗收：`wxl-fork-init` 仍通過 authoring-skill-pattern（thin pointer body ≤3 行、host-neutral grep exit 1、canonical SKILL.md＋AGENTS.md 存在），且 `spectra validate scriptify-wxl-fork-init` 通過。驗證：兩項檢查與 `spectra validate scriptify-wxl-fork-init` 皆 exit 0。
