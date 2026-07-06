## Context

`wxl-fork-init` 是 authoring skill（受 authoring-skill-pattern 規範），目前純 prose：fork template repo 成新專案時的所有確定性編輯都交給 LLM agent 手動完成。作用中檔案的 `wxl` 短名共約 597 處，其中四處是 runtime 敏感鍵：localStorage `wxl-locale`（`.vitepress/theme/i18n/index.ts`）、env `WXL_VERIFY_RUNTIME`（`scripts/challenge-verify-blind.ts`）、tmp `tmp/wxl-verify`（`.gitignore` 與 blind verify）、release asset `wxl-${tag}.zip`（`release.yml`）。目前無任何 fork/rebrand script。`.spectra.yaml` 啟用 tdd 與 audit。

## Goals / Non-Goals

**Goals:**

- 以確定性 CLI 取代 LLM 手動編輯，將 fork 的機械工作 token 成本降到近乎零。
- rebrand 的 runtime 敏感鍵處理可測試、可審計，杜絕「盲目 sed 全域取代」誤傷。
- skill 保持為互動 wrapper，仍遵循 authoring-skill-pattern。

**Non-Goals:**

- 不做任何 GitHub 遠端操作（建 repo／push／ruleset）。
- 不改 LICENSE 條款或 deploy 範本內容。
- 不觸及 challenge 或其他 skill 功能。

## Decisions

### fork:init CLI 契約與 A/B 兩模式

`scripts/fork-init.ts`（`pnpm fork:init`）以 flags 驅動：`--name`、`--author`、`--repo <owner/repo>`、`--base <path|none>`、`--rebrand <newshortname>`（給定即進 B 模式）、`--dry-run`。A 模式做身分欄位與 URL／base／deploy 的確定性編輯；B 模式在 A 之上再跑分類式 `wxl` 短名 rename。選 flag 驅動而非互動式 prompt，因為互動由 skill 層負責，script 保持純確定性、可測試、可被 CI 或其他 agent 直接呼叫。

### runtime 敏感鍵獨立分類與結尾報告

B 模式的 rename 把四個 runtime 敏感鍵（localStorage key、env 變數、tmp 工作目錄、release 資產名）視為獨立一類，明確 rename 並在結尾單獨列出「已改的敏感鍵」報告，讓使用者清楚 storage／env／release 契約被更名的影響。選擇「明確改並報告」而非「一律保留」，因為真正 rebrand 時這些鍵本就該改名以維持品牌一致；關鍵在可見與可審計，而非盲改。

### rebrand rename 的排除範圍與安全邊界

rename 只掃作用中檔案且只替換 exact-case `wxl`/`WXL`，排除 `pnpm-lock.yaml`、`node_modules`、`.git`、`openspec/changes/archive/**`、結構性 skill 目錄 `.agent`/`.claude`/`.codex`/`.gemini`（其識別字為目錄名與 thin-pointer 路徑引用，content-only rename 會破壞）、以及工具自身 `scripts/fork-init.ts`（需保留 `wxl` probe）。使用者提供的 `--repo`／`--author`（可能合法含 `wxl`）以 sentinel 於 rename 期間保護，確保 fork 身分不被誤改。因只改 exact-case，script 於結尾輸出 **residual 報告**：列出仍含 case-insensitive `wxl` 的作用中檔案（Title-case 如 `Wxlsh`、路徑引用如 `chall-wasm/wxlsh-parser`），提示需手動完成（含目錄改名，否則 build 無法執行）。冪等：exact-case 改完後重跑無殘留 exact-case `wxl`，protected 身分原樣還原。

### dry-run 與變更摘要

`--dry-run` 計算並印出所有規劃中的編輯（含敏感鍵分類）但不落地，供使用者預覽；正式執行結尾列出每個被改檔案與敏感鍵摘要。這是安全網，讓大範圍 rebrand 可先審再套。

### skill 改寫為 script-driven wrapper

`wxl-fork-init` SKILL.md 改寫為：偵測 A／B 意圖 → 以純文字問題區塊收集 `--name`／`--author`／`--repo`／`--base`／`--rebrand` → 呼叫 `pnpm fork:init`（含 `--dry-run` 先預覽再正式）→ 跑既有 Verification grep 確認零殘留 upstream 身分。AGENTS.md 同步更新關係表（新增 fork:init CLI）。skill 仍是 host-neutral、thin-pointer 不變。

### TDD 覆蓋敏感鍵分類與 dry-run 不落地

以 vitest 對 `scripts/fork-init.ts` 撰寫單元測試（fixture 目錄）：驗證 A 模式身分欄位正確改寫、B 模式敏感鍵被分類且出現在報告、`--dry-run` 不寫入任何檔案、排除清單生效。先寫失敗測試再實作（Red-Green）。

## Implementation Contract

**Behavior**：`pnpm fork:init --name <n> --author <a> --repo <owner/repo> [--base <p>|--base none] [--rebrand <newname>] [--dry-run]` 對 repo 做確定性 fork 編輯並印出變更摘要；`--dry-run` 只預覽不落地。skill 收集參數後呼叫它，再以 grep 驗收。

**Interface / 契約**：
- CLI flags 如上；未給必要 flag 時以非零 exit 與可讀訊息中止（不 silent）。
- A 模式編輯集合：package.json（version→`0.1.0`、author、repository.url、bugs.url、homepage、license；B 另含 name〔取自 `--rebrand`／`--name`〕，`description` 僅在給 `--description` 時設）、`.vitepress/config.mts`（依 `--base` 設定或清除 base、GitHub URL swap 涵蓋 socialLinks link）、README.md 與 CONTRIBUTE.md 的 GitHub URLs、複製 `.agent/skills/wxl-fork-init/deploy.yml.template` 至 `.github/workflows/deploy.yml`。無法自動生成的品牌文案（VitePress `title`、package.json `description`）不由 CLI 杜撰，其中的字面 `wxl` 由 rebrand rename pass 處理。
- B 模式另做 `wxl` → `<newname>` 分類式 rename，敏感鍵四類（`wxl-locale`、`WXL_VERIFY_RUNTIME`、`tmp/wxl-verify`、`wxl-${tag}.zip`）獨立處理並報告；release.yml 的 `wxl-` 前綴一併更新。
- 新增 `package.json` script：`fork:init`。

**Failure modes**：缺必要 flag、`--repo` 格式非 `owner/repo`、目標檔缺失 → 非零 exit 並印明確原因；`--dry-run` 保證零檔案寫入。

**Acceptance criteria**：
- `pnpm fork:init` 的 vitest 測試（含敏感鍵分類、dry-run 不落地、排除清單）全綠。
- A 模式跑完後 `git grep BrowserLaboratory/wxl-template` 與 upstream author 於作用中檔案零殘留（deploy.yml 已就位、base 依部署位置設妥）。
- B 模式跑完後作用中檔案 `wxl` 短名零殘留（敏感鍵已改並列於報告），且 `pnpm build` 可成功。
- skill SKILL.md 為 script-driven、host-neutral grep exit 1、thin-pointer body ≤3 行不變。

**Scope boundaries**：In，`scripts/fork-init.ts`＋測試、package.json script、fork-init skill 改寫、新 capability spec。Out，GitHub 遠端操作、LICENSE 條款、deploy 範本內容、challenge／其他 skill 功能。

## Risks / Trade-offs

- 大範圍 rename 誤傷非預期字串 → exact-case 替換＋排除清單（含 `.agent`/`.claude`/`.codex`/`.gemini`/工具自身）＋使用者身分 sentinel 保護＋`--dry-run` 預覽＋單元測試多重防護。
- 敏感鍵更名改變 storage／env／release 契約 → 明確分類並結尾報告，讓影響可見；fresh fork 無既有使用者，風險低。
- exact-case 無法涵蓋 Title-case（`Wxlsh`）與路徑引用目錄（`wxlsh-parser`）→ residual 報告逐檔列出剩餘 case-insensitive `wxl`，並警示目錄未改名前 build 無法執行，把「不完整 rebrand」從靜默變成可見待辦。
- 含 `wxl` 的 `--repo`／`--author` 被 rename 誤改 → sentinel 於每檔 rename 期間保護、事後還原，並有專門測試覆蓋。
- script 與 skill 文件本身含 `wxl` 字樣，重跑可能雙重 rename → 冪等處理並在測試覆蓋。
- CLI 契約與 skill prose 需一致 → 由 spec Requirement 綁定 flag 集合，skill 只描述呼叫方式不重述細節。

## Migration Plan

1. 先寫 vitest 失敗測試（fixture）。
2. 實作 `scripts/fork-init.ts` 至測試轉綠；加 `package.json` 的 `fork:init` script。
3. 改寫 `wxl-fork-init` SKILL.md／AGENTS.md 為 script-driven。
4. 驗收：測試綠、A/B grep 零殘留、host-neutral、`spectra validate`。

Rollback：純新增 script 加 skill 文件改寫，`git revert` 即可還原；無執行期狀態遷移。

## Open Questions

- `--rebrand` 是否需**自動改名** Title-case 變體（`Wxl`／`Wxlsh`）與結構性目錄（`chall-wasm/wxlsh-parser`）？初版自動處理 exact-case `wxl`/`WXL`，其餘經 residual 報告**明確列出待手動處理**（非靜默略過）；把 Title-case 與目錄改名納入自動化列為後續增強。
