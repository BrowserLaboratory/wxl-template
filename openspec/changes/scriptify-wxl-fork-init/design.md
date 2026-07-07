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

`scripts/fork-init.ts`（`pnpm fork:init`）以 flags 驅動：`--name`、`--author`、`--repo <owner/repo>`、`--base <path|none>`、`--rebrand <newshortname>`（給定即進 B 模式）、`--dry-run`。A 模式做身分欄位、base、deploy 與**掃描式上游 slug 原子替換**的確定性編輯；B 模式在 A 之上，只對「可證明為完整、獨立 token」者做結構感知的定點 rename（見下）。選 flag 驅動而非互動式 prompt，因為互動由 skill 層負責，script 保持純確定性、可測試、可被 CI 或其他 agent 直接呼叫。

### 只改「可證明的 token」，其餘誠實 inventory（不做盲目全域取代）

在本 repo，子字串 `wxl` 橫跨數個語意獨立的識別子家族，deterministic 文字工具無法分辨：品牌短名、`wxlsh` 子系統／`X-Wxlsh-*` wire header、四個 runtime 敏感鍵、上游 repo slug、路徑引用的 skill/spec 目錄名。**盲目 `wxl`→`<newname>` 全域取代**會腐蝕本該保留者（如 `wxlsh`→`xsh`、或把 `wxl-template` 攪成死連結 `<brand>-template`）且是靜默的。因此 B 模式**不做盲目取代**，只 rename 兩類可證明為完整 token 者：(1) 上游 slug（由 A 模式原子替換整段 `BrowserLaboratory/wxl-template`）與 (2) 四個 runtime 敏感鍵（`wxl-locale`、`WXL_VERIFY_RUNTIME`、`tmp/wxl-verify`、`release.yml` 的 `wxl-` 前綴），以 exact full-token、結構感知的替換完成，並在結尾列出「已改的敏感鍵」報告。敏感鍵 rename 於**原始內容上、在 slug swap 寫入使用者身分之前**執行，故含敏感鍵 token 的 `--repo`／`--author` 絕不會被誤改（由建構保證身分安全，不需 sentinel）。

### 排除範圍、路徑邊界、與誠實 residual inventory

text pass 只掃作用中檔案，排除 `pnpm-lock.yaml`、`node_modules`、`.git`、`openspec/changes/archive/**`、**重生的 build 產物 `.vitepress/dist/**`／`.vitepress/cache/**`**、**Spectra 內部狀態 `.spectra/**`**、結構性 skill 目錄 `.agent`/`.claude`/`.codex`/`.gemini`（識別字為目錄名與 thin-pointer 路徑引用，content-only rename 會破壞）、以及工具自身 `scripts/fork-init.ts` 與 `tests/unit/scripts/fork-init.test.ts`（需保留 `wxl` probe／fixture）。路徑排除以 **path-segment 邊界**比對（`=== frag` 或 `startsWith(frag + sep)`），故 `openspec/changes/archive-notes.md` 這類現役同名前綴檔不會被誤判為封存。因只 rename 可證明的 token，script 於結尾輸出**誠實 residual inventory**：**由實際寫入的最終內容重算**（非 pre-edit 快照），逐一列出仍含 case-insensitive `wxl` 的 `file:line`（品牌散字、`wxlsh` 子系統、Title-case `Wxlsh`、路徑引用如 `chall-wasm/wxlsh-parser` 等），並**在仍有 `wxl` 殘留時明確聲明 rebrand 未完成、絕不誤報 clean**。residual 計算僅剝除使用者自己的 `--repo` slug（必含 `/`，不可能是裸品牌 token 或 `wxlsh` 的子字串，剝除安全）；**`--author` 不剝除**，故裸 `--author wxl` 無法遮蔽真實殘留。冪等：敏感鍵與 slug 改完後重跑零變更，且永不 double-rename（`acme` 不會變 `acacmeme`）。

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
- A 模式編輯集合：package.json 結構化編輯（version→`0.1.0`、author、repository.url、bugs.url、homepage、license；B 另含 name〔取自 `--rebrand`／`--name`〕，`description` 僅在給 `--description` 時設）、`.vitepress/config.mts` 依 `--base` 設定或清除 base、**掃描式上游 slug 原子替換**（把 `BrowserLaboratory/wxl-template` 整段換成 `--repo`，涵蓋 config.mts socialLink、README、CONTRIBUTE、CHANGELOG 及任何未來含 slug 的檔案，非硬編碼清單）、複製 `.agent/skills/wxl-fork-init/deploy.yml.template` 至 `.github/workflows/deploy.yml`。品牌文案（VitePress `title`、package.json `description`）不由 CLI 杜撰。
- B 模式**只 rename 可證明的完整 token**：上游 slug（同 A 的原子替換）與四個 runtime 敏感鍵（`wxl-locale`、`WXL_VERIFY_RUNTIME`、`tmp/wxl-verify`、`release.yml` 的 `wxl-${tag}` 前綴），以 exact full-token 結構感知替換；**不做盲目 `wxl`→`<newname>` 全域取代**。敏感鍵 rename 在 slug swap 之前、對原始內容執行（身分由建構保證安全，無 sentinel）。其餘 `wxl` 一律進**誠實 residual inventory**（由最終內容重算，`file:line`），仍有殘留時聲明「rebrand 未完成」、不誤報 clean。
- 新增 `package.json` script：`fork:init`。

**Failure modes**：缺必要 flag、`--repo` 格式非 `owner/repo` → 非零 exit 並印明確原因；`--dry-run` 保證零檔案寫入；B 模式若有 residual，exit 0 但訊息明確聲明未完成（不 silent、不誤報 clean）。

**Acceptance criteria**：
- `pnpm fork:init` 的 vitest 測試（含敏感鍵、掃描式 slug、path 邊界、身分保護、bare-token author 不坍縮、誠實 inventory、dry-run 不落地、排除清單）全綠。
- A 模式跑完後 `git grep BrowserLaboratory/wxl-template` 於作用中檔案零殘留（含 CHANGELOG；deploy.yml 已就位、base 依部署位置設妥）。
- B 模式跑完後：四個敏感鍵於**實際寫入內容**已改並列於報告；slug 已換成 `--repo`（無 `<brand>-template` 死連結）；剩餘 `wxl` 逐一列於 residual inventory（`file:line`）且訊息聲明未完成；使用者 `--repo`／`--author` 未被誤改。
- skill SKILL.md 為 script-driven、host-neutral grep exit 1、thin-pointer body ≤3 行不變。

**Scope boundaries**：In，`scripts/fork-init.ts`＋測試、package.json script、fork-init skill 改寫、新 capability spec。Out，GitHub 遠端操作、LICENSE 條款、deploy 範本內容、challenge／其他 skill 功能、多義 `wxl` 家族（`wxlsh` 子系統、skill/spec 目錄）的自動改名（由 inventory 交人工判斷）。

## Risks / Trade-offs

- `wxl` 橫跨多個識別子家族，盲目全域取代會腐蝕該保留者 → **不做盲目取代**，只改可證明的完整 token（slug + 4 敏感鍵），其餘誠實 inventory 交人工；工具因此不會靜默腐蝕 `wxlsh` 子系統或 skill/spec 目錄引用。
- 敏感鍵更名改變 storage／env／release 契約 → 明確分類並結尾報告，讓影響可見；fresh fork 無既有使用者，風險低。
- B 模式**不**幫使用者完成整個品牌改名（Title-case、`wxlsh`、目錄名等留待人工）→ 這是刻意的誠實取捨：deterministic 工具無法安全做 namespace 判斷；residual inventory 逐 `file:line` 列出，並警示目錄未改名前 build 無法執行，把「不完整 rebrand」從靜默變成可見待辦。
- 含敏感鍵 token 或 sentinel 樣式的 `--repo`／`--author` 被誤改 → 已移除 sentinel 機制；敏感鍵 rename 在 slug swap 前對原始內容執行，身分寫入後不再被任何 pass 觸及（由建構保證，並有 `me/wxl-locale`、`me/wxl__FORKINIT_KEEP_1__` 專門測試）。
- residual 報告誤報 clean（RC2）→ 一律由**實際寫入的最終內容**重算；只剝除使用者自己的 `--repo` slug（含 `/`，剝除安全），`--author` 不剝除，故裸 `--author wxl` 無法遮蔽殘留。
- CLI 契約與 skill prose 需一致 → 由 spec Requirement 綁定 flag 集合，skill 只描述呼叫方式不重述細節。

## Migration Plan

1. 先寫 vitest 失敗測試（fixture）。
2. 實作 `scripts/fork-init.ts` 至測試轉綠；加 `package.json` 的 `fork:init` script。
3. 改寫 `wxl-fork-init` SKILL.md／AGENTS.md 為 script-driven。
4. 驗收：測試綠、A slug grep 零殘留、B 敏感鍵已改＋誠實 inventory、host-neutral、`spectra validate`。

Rollback：純新增 script 加 skill 文件改寫，`git revert` 即可還原；無執行期狀態遷移。

## Open Questions

- （已解決）`--rebrand` 是否應**自動改名**多義 `wxl` 家族（Title-case `Wxlsh`、`wxlsh` 子系統、結構性目錄 `chall-wasm/wxlsh-parser`、skill/spec 目錄）？結論：**不自動改**。經三輪對抗式審查 + 多 opus 根因分析確認，deterministic 文字工具無法安全區分這些家族，盲目取代會靜默腐蝕該保留者。工具改為只 rename 可證明的完整 token（slug + 4 敏感鍵），其餘一律以誠實 `file:line` inventory 交人工做 namespace-aware 判斷，並永不誤報 clean。把多義家族的自動改名（含目錄協同 `git mv`）列為後續、需人工把關的增強。
