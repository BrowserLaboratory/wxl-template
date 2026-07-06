## Context

wxl-creator 是單一 authoring skill，canonical SKILL.md 412 行（全 repo 最大），把四種 verb 綁在一起：create（出題主流程）、mutate（retype）、verify（L1 至 L3 gate 加 auto-fix loop）、L4 cross-check（maintainer-only blind 多 runtime）。底層 CLI 早已依 verb 拆成四支獨立 script，skill 對 CLI 因此是 1 對 4；auto-fix loop 也在 create 與 mutate 尾端被口頭複製。

skill 結構受既有 authoring-skill-pattern capability 通用規範（canonical 位於 .agent/skills/<name>/，三家 host thin pointer body 不超過三行，host-agent-neutral prose 禁用 AskUserQuestion 等 primitive）。這代表新 skill 只要遵循該 pattern 即自動繼承橫切需求。config 檔 .wxl-creator/config.yaml 僅由 skill prose 讀取、無任何 script 依賴，可安全 re-home。

## Goals / Non-Goals

**Goals:**

- 四個新 skill 與四個新 spec capability 皆與 CLI verb 1 對 1 對齊，可獨立觸發與獨立演進。
- 共用的 verify gate 加 auto-fix loop 收斂成單一 wxl-verify skill，消除 create 與 mutate 的口頭複製。
- 橫切結構需求（host-neutral、thin-pointer、canonical 位置）由 authoring-skill-pattern 繼承，不在新 capability 重複。
- 移除後全 repo 無殘留 wxl-creator 作用中引用（歷史快照除外）。

**Non-Goals:**

- 不改任何底層 script 及其單元測試。
- 不改 challenge 內容、L4 CLI 行為、authoring-skill-pattern 本身。
- 不重寫歷史或工作文件；不保留舊 wxl-creator 觸發別名。

## Decisions

### 依 CLI verb 邊界切成四個 skill

wxl-create、wxl-mutate、wxl-verify、wxl-crosscheck 各對應一支既有 CLI script。選此邊界而非「依流程步驟再細切 create 內部」（例如再拆 collect、generate、self-test），因為 CLI 邊界是既有且穩定的自然接縫，再細切會超出使用者要的粒度且製造過多薄 skill。每個 skill 保留 canonical SKILL.md 與 AGENTS.md，並在三家 host 建 thin pointer。

### 橫切需求繼承 authoring-skill-pattern，不在新 capability 重複

authoring-skill-pattern 已通用規範 canonical 位置、最小 source 檔、三家 thin-pointer body 不超過三行、host-agent-neutral prose、官方 agent matrix。四個新 skill 遵循該 pattern 即繼承這些需求，因此新 capability 只寫 verb 專屬行為需求。舊 wxl-creator-skill 內的 host-neutral 與 thin-pointer 兩條需求本就是被抽取成 authoring-skill-pattern 的來源，移除時由通用 capability 接手，不會產生規範缺口。

### wxl-verify 為 create 與 mutate 共用的 gate 加 fix-loop

wxl-verify 擁有 challenge verify 的 L1 至 L3 gate 執行、auto-fix loop（plain-text 確認）、與可設定的 max_fix_attempts 上限。create 完成檔案生成後交棒給 wxl-verify；mutate 於 retype 成功後交棒給 wxl-verify 做回歸確認。verify 本身不觸發 L4（L4 保留給 crosscheck）。

### 共用資產 re-home 至主要擁有者

- exploit-spec 範本與 SKILL.zhTW.md 只服務 create，歸 wxl-create。
- runtime-cli 參考文件描述 L4 dispatch，歸 wxl-crosscheck。
- a01-access-control 參考文件同時服務 create 的生成（registry 觸發）與 verify 的修復提示；因 a01 pack 規範它為單一 source-of-truth，故歸主要且最先消費者 wxl-create，wxl-verify 於 fix-loop 以路徑引用同一份文件。此跨 skill 文件引用屬 prose 讀取，非工具依賴，符合 authoring-skill-pattern（該 pattern 只要求一個 skill 自身的 impl 檔位於自身目錄，不禁止引用他 skill 的參考文件）。

### config 檔隨 fix-loop 遷至 .wxl-verify

auto-fix loop 移入 wxl-verify，故 max_fix_attempts 設定檔由 .wxl-creator/config.yaml 遷至 .wxl-verify/config.yaml。此檔僅 skill prose 讀取、無 script 依賴，且缺檔時預設 10，遷移風險低。.gitignore 對應註解同步更新。

### crosscheck 沿用 l4-multi-agent-cross-check CLI capability

wxl-crosscheck skill 只是 blind 多 runtime CLI 的薄包裝，CLI 契約（--agents、precedence、divergence report）已由既有 l4-multi-agent-cross-check capability 規範，故不另立 CLI capability；新 wxl-crosscheck-skill capability 只描述 skill 層的呼叫、maintainer-only 定位與 degrade 行為。

### a01 pack spec 路徑正文改指向 wxl-create

a01-access-control-template-pack 的 requirement 正文與 scenario 指向 .agent/skills/wxl-creator/reference/a01-access-control.md 及「wxl-creator skill 的 registry table」；隨參考文件與 registry 遷至 wxl-create，這些正文改為 .agent/skills/wxl-create/... 與 wxl-create-skill capability。僅屬 trace metadata 或 Purpose 出處敘述的其他 spec 提及維持歷史敘述。

### 移除舊 wxl-creator 並以 grep 驗證零殘留

移除 .agent/skills/wxl-creator/ 整個目錄、三家 pointer、legacy 的 .agent/workflows/wxl-creator.md、以及 wxl-creator-skill capability。scripts/wxl-solver/spawn-runtime.ts 與 .gitignore 內的 wxl-creator 註解引用同步更新。以 git grep 驗證作用中檔案零殘留（排除 openspec/changes/archive 與歷史工作文件）。

## Implementation Contract

**Behavior**：出題者以四個獨立 skill 分別觸發 create、mutate、verify、crosscheck；行為與現況等價（相同 CLI、相同 gate、相同 fix-loop），差別在入口拆分與 verify 由 create 與 mutate 共用。

**Interface / 結構契約**：
- 每個新 skill：canonical .agent/skills/<name>/SKILL.md 加 AGENTS.md；三家 host（.claude、.codex、.gemini）各一份 thin pointer，body 不超過三行且指向 canonical。
- 四個新 spec capability：wxl-create-skill、wxl-mutate-skill、wxl-verify-skill、wxl-crosscheck-skill，各只含 verb 專屬需求。
- config：.wxl-verify/config.yaml 的 max_fix_attempts；缺檔預設 10。

**Failure modes**：verify gate 非零 exit 進入 auto-fix loop 並受 max_fix_attempts 限制；crosscheck 於 CLI 不可用時 degrade 並提示手動；a01 參考文件缺檔時 create 依 canonical-reference 規範 halt。皆沿用現有 spec 行為。

**Acceptance criteria**：
- 四個新 skill 各通過 authoring-skill-pattern 驗證：thin pointer body 不超過三行、host-neutral grep exit code 1、canonical SKILL.md 與 AGENTS.md 存在、_template 未被啟用。
- git grep 'wxl-creator' 於作用中程式碼零殘留（排除 `openspec/**`、`CHANGELOG.md`、`AUDIT.md`、`VERIFICATION.md`、`DELETION-PLAN.md`）。`openspec/specs/**` 仍有的舊引用屬 pre-archive 殘留，於 `spectra archive` 套用 delta 時清除，非 drift。
- spectra validate split-wxl-creator-skills 通過；既有測試套件（scripts 未動）維持綠燈。

**Scope boundaries**：In，skill 檔、三家 pointer、資產 re-home、四個新 capability、a01 pack 正文路徑、spawn-runtime 與 .gitignore 註解、config 遷移、移除舊 skill 與 capability。Out，底層 script 與其測試、challenge 內容、L4 CLI 行為、historical 文件。

## Risks / Trade-offs

- wxl-verify 以路徑引用 wxl-create 的 a01 參考文件（跨 skill 文件耦合）→ 以單一 source-of-truth 換取避免重複；於 verify SKILL.md 明確標註引用來源，並保留 a01 pack 的 grep 驗證。
- config 路徑由 .wxl-creator 改為 .wxl-verify，既有自訂設定會被忽略 → 影響低（預設 10、template repo 少有自訂），並於 CHANGELOG 與 skill prose 標註遷移。
- 一次移動大量檔案可能遺漏引用點 → 以 git grep 全庫掃描為驗收關卡，並在 tasks 明列每個引用來源。
- 變更同時觸及四個 skill 與多個 spec，體量偏大 → 屬不可再分割的原子重組（半拆狀態會使 skill 與 spec 不一致），以分組 tasks 與 grep 驗收控制風險。

## Migration Plan

1. 建立四個新 skill 的 canonical 與三家 pointer，並 re-home 資產。
2. 建立四個新 spec capability，更新 a01 pack 正文，移除 wxl-creator-skill。
3. 更新 spawn-runtime 與 .gitignore 註解、遷移 config。
4. 移除舊 skill 目錄、三家 pointer、legacy workflow。
5. grep 零殘留驗收 + spectra validate + 既有測試套件。

Rollback：本 change 為檔案層重組，git revert 即可完整還原；無資料庫或執行期狀態遷移。

## Open Questions

- 是否需為新 skill 於 .agent/workflows/ 補對應 workflow 檔？本 change 先移除 legacy 的 wxl-creator.md 而不補新檔（skill 為 canonical 入口）；如日後需要 workflow 呈現，另開 follow-up。
