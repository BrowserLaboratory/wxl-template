## Context

WXL（Web eXploitation Laboratory）目前是一個全繁體中文、堆積 4 個示範題目的純前端 WASM CTF 靶場 template。基準狀態：

- **建構工具鏈**：pnpm 10.28 + Vitest 4.1 + Cargo（workspace：virtual-fs / asgi-bridge / wxlsh-parser）+ wasm-pack 0.14。
- **內容堆積**：`docs/challenge/` 下 4 個 demo（sqli-demo / php-demo / fastapi-demo / door-is-open），其中只有 door-is-open 具備完整 frontmatter（含 tools 陣列、正確日期、現實混合語意描述）。
- **i18n 缺位**：無 vue-i18n、無 VitePress i18n routing，UI 元件硬編碼繁中字串 ~15 處，markdown 內容 7 檔 ~400 行繁中。
- **Spectra 狀態**：`.spectra.yaml` 已啟用 `tdd / audit / parallel_tasks`，locale=tw，39 個 spec 已建立，無 in-progress changes，git 在 `main`，工作樹乾淨。
- **stakeholders**：template 維護者（將以本基準為起點推動 Change 2/3/4）、未來下游使用者（fork 本 template 建立自己的 CTF 平台者）。

本次變更是 **四階段 template 重構計畫的第 1/4 個 Spectra change**。Change 2/3/4 將在本次 archive 後依序提案。所有後續工作都會引用本次產出的稽核基準與 commit/audit 機制。

## Goals / Non-Goals

**Goals:**

1. 建立**可信賴的稽核基準**，供未來 Change 2/3/4 比對前後狀態。
2. 把示範題目精簡到 1 個（door-is-open），降低 i18n / 文件英化的範圍。
3. 把「**每階段 commit + 每階段 `/spectra-audit`**」機制 bake 進此次的 tasks 結構，作為後續 changes 的範本。
4. 把 wxl-creator skill 的 canonical reference example 從 sqli-demo 切換到 door-is-open。

**Non-Goals:**

- 不引入 vue-i18n / VitePress i18n routing（Change 2 範圍）。
- 不抽取任何 Vue 元件硬編碼字串到 locale 檔（Change 2）。
- 不產生任何 markdown 英文版（Change 3）。
- 不翻譯 README / CONTRIBUTE / openspec specs（Change 4）。
- 不刪除 door-is-open 以外的任何 framework / runtime / UI 規範。
- 不真正物理刪除 demo 題目；保留在 `.archive/` 與 git 歷史，方便回溯。

## Decisions

### Decision: Archive via git mv to .archive/ instead of git rm

**選擇**：刪除示範題目時，使用 `git mv docs/challenge/<slug>/ .archive/challenge/<slug>/` 而非 `git rm -r`。

**理由**：
- Git 歷史已可回溯任何刪除操作，但保留 `.archive/` 在工作樹意味著可以快速 `ls .archive/challenge/` 看到被移除清單，免去頻繁 `git log` 追蹤。
- 若未來 review 中發現某 demo 仍需參考（例如 wxl-creator 需要多種 backend 範例），可即時 `git mv` 回原位，不需翻 git 歷史。
- `.archive/` 不會被 VitePress 預設掃描為內容目錄（VitePress 只看 `docs/` 與設定的 `srcDir`），對 build 輸出無副作用。

**替代方案**：
- `git rm -r`：較乾淨但 rollback 成本高，且工作樹無灰名單可審視。否決。
- 移到 git branch `archive/demos`：增加 branch 管理負擔；目前 template 維護者只在 `main` 工作。否決。

### Decision: Three durable audit report files

**選擇**：產出三份位於專案根目錄的 markdown 報告作為持久 artifact：`AUDIT.md`（Stage 1）、`DELETION-PLAN.md`（Stage 2）、`VERIFICATION.md`（Stage 4）。

**理由**：
- 跨 session 中斷恢復時，這些報告是 session-independent 的真實狀態快照。
- Change 2/3/4 之 propose 時可直接讀取 `AUDIT.md` 作為 i18n surface 與 build baseline 的權威來源。
- 報告為純 markdown，可直接 in-place edit 補充，也可作為 PR description 來源。

**替代方案**：
- 把報告塞進 `openspec/changes/project-audit-and-cleanup/notes/`：較貼近 Spectra 慣例，但 archive 後可見性下降。否決，選擇放專案根目錄以最大化未來可見度。
- 用 git tag 標記基準：tag 是 immutable 指標但不承載內容，無法替代報告。否決。

### Decision: Per-stage commit checkpoint pattern using /tw-emoji-commit

**選擇**：每完成一個 stage 的所有實質性 task 後（不含本身的 audit 與 commit task），透過 `/tw-emoji-commit` skill 落地一個 emoji 開頭的繁中 commit message，stage commit 訊息採用以下範式：

- Stage 1：`📝 docs: 建立 wxl-template 專案稽核基準報告`
- Stage 2：`📋 plan: 確立 wxl-template 內容精簡刪除計畫`
- Stage 3：`🗑️ refactor: 精簡範例題目至 door-is-open`
- Stage 4：`✅ test: 完成 Change 1 端到端驗證`

**理由**：
- 全域 CLAUDE.md 強制規定 commit 須走 `/tw-emoji-commit` skill；任何繞過皆違規。
- 每 stage 一個 commit 形成天然 rollback 錨點：`git reset --hard <stage-commit>` 可乾淨回到任一檢查點。
- `git log --oneline` 即可看出整體進度，跨 session resume 時無須翻 tasks.md 即知道下一個該做哪個 stage。
- emoji 前綴與台灣繁中 conventions（軟體、最佳化、影片等）需在 commit body 一併把關。

**替代方案**：
- 一次大 commit：rollback 成本高、進度不可見。否決。
- 每個 task 一個 commit：commit 噪音過大，分散 reviewer 注意力。否決。

### Decision: Per-stage /spectra-audit gating

**選擇**：每個 stage 的最後一個實質性 task 完成後、commit 之前，必須執行 `/spectra-audit`。若回報任何 **Critical** 或 **High** 嚴重度 finding，必須先修正並重跑 audit 直到清空，才能進行 stage commit。

**理由**：
- 此次變更涉及 skill 行為調整與檔案搬移，潛在邊界條件多（如：sqli-demo 被引用於外部腳本？wxl-creator 是否有隱性依賴？.archive/ 是否會被 bundle？）。
- 把 audit 放在 commit 前，使得 main 分支永遠停留在已稽核的乾淨狀態；任何 stage commit 都是「已通過 audit」的證明。
- Medium / Low finding 可選擇 commit 後再處理；只強制 Critical/High。

**替代方案**：
- 只在 Change 結束時跑一次 audit：失敗時要重做多個 stage，成本高。否決。
- 不跑 audit：違背使用者「每個階段實施 `/spectra-audit`」明確要求。否決。

### Decision: Switch wxl-creator canonical reference from sqli-demo to door-is-open

**選擇**：把 `.claude/skills/wxl-creator/SKILL.md` 中所有「reference example: sqli-demo」字樣改為 `door-is-open`，並在 `openspec/specs/wxl-creator-skill/spec.md` 新增 normative requirement「Skill uses canonical reference example for code generation style」明文鎖定 canonical reference 為 door-is-open。

**理由**：
- sqli-demo 將被 archive，若 SKILL.md 仍指向它，未來執行 `/wxl-creator` 時讀不到參考檔會中斷。
- 把 canonical reference 提升為 spec requirement，避免未來再次「skill 的隱性依賴」造成相同類型 bug。
- door-is-open 是最完整的 demo（含 tools array、正確日期、混合語意描述），作為新 canonical reference 比 sqli-demo 更能展示完整 frontmatter 規格。

**替代方案**：
- 保留 sqli-demo 不 archive：違背「精簡到單一 example」要求。否決。
- 只改 SKILL.md，不更新 spec：違反 spec-driven 原則，留下隱性 contract。否決。

## Implementation Contract

**Behavior delivered**（apply 完成後可觀察到的事實）：

- `ls docs/challenge/` 只輸出 `door-is-open/`。
- `ls .archive/challenge/` 輸出 `sqli-demo/`、`php-demo/`、`fastapi-demo/` 三個目錄。
- 專案根目錄存在三份非空 markdown 報告：`AUDIT.md`、`DELETION-PLAN.md`、`VERIFICATION.md`。
- 在任何使用者環境中執行 `pnpm install && pnpm wasm:build && pnpm challenge:keygen && pnpm docs:build` 皆完成且 exit code 為 0。
- 執行 `pnpm test` 與 `cargo test` 全綠。
- 執行 `pnpm dev` 後於瀏覽器訪問 door-is-open challenge，題目可正常載入、flag 可送出。
- 執行 `/wxl-creator` skill 時，內部讀取的 canonical reference 為 `docs/challenge/door-is-open/`；以該 skill 建立 throwaway 題目（後立即 `git clean -fd` 移除）可成功通過 `pnpm challenge:analyze` 與 `pnpm challenge:validate`。
- `git log --oneline -10` 中包含對應四個 stage 的 emoji commits（順序：📝 → 📋 → 🗑️ → ✅）。

**Acceptance criteria**：

| 驗收項 | 驗證手段 |
|---|---|
| `docs/challenge/` 僅剩 door-is-open | `ls docs/challenge/` 比對 |
| 三份報告齊全且內容覆蓋對應 stage | `wc -l` + 人工 review |
| 四個 stage commits 在 git log | `git log --oneline --grep='📝\|📋\|🗑️\|✅' -10` |
| Build pipeline 通過 | `pnpm docs:build` exit 0 |
| 測試套件通過 | `pnpm test && cargo test` |
| wxl-creator skill 仍可運作 | dry-run 建立 throwaway challenge 並驗證 |
| 全程零 Critical/High audit finding | 每個 stage commit 前的 `/spectra-audit` 紀錄 |
| spec `wxl-creator-skill` 已加入 canonical reference example requirement | 讀 `openspec/changes/project-audit-and-cleanup/specs/wxl-creator-skill/spec.md` |

**Failure modes & fallback**：

- 若 Stage 3 archive 後 `pnpm docs:build` 失敗，apply 必須立刻停止並在 commit 前修正；不得帶傷進入 Stage 4。
- 若 `/spectra-audit` 回報無法在當下 stage 解決的問題，使用者選擇：(a) 修正並重跑、(b) 標註 Medium 嚴重度延後處理（須記錄在當 stage 的報告中）。**Critical/High 嚴重度禁止延後**。
- 若 session 中斷：恢復時讀 `git log --oneline` 確定上次完成的 stage，讀 tasks.md 找到下一個未勾選 task，繼續執行。

**Scope boundaries**：

- **In scope**：本 design.md 列出的五個 Decisions 全部範圍。
- **Out of scope**：i18n、文件翻譯、frontend 元件修改、Rust WASM 模組修改、CI 工作流調整、套件升降版。

## Risks / Trade-offs

- **[Risk] demo 題目的 spec @trace 區段指向即將被搬移的檔案** → **Mitigation**：Stage 1 i18n surface 稽核時同步盤點所有 spec 的 @trace 區段；Stage 3 在搬移後同步移除指向 `.archive/` 路徑的 @trace 條目（避免 trace 工具誤判 dead link）。
- **[Risk] wxl-creator skill 有隱性對 sqli-demo 的非 SKILL.md 引用（例如 `.wxl-creator/config.yaml` 內部字串）** → **Mitigation**：Stage 4 透過 dry-run scaffold throwaway challenge 端到端驗證；不只 grep 字串。
- **[Risk] `.archive/` 在某環境被 VitePress 或 pnpm 視為內容目錄** → **Mitigation**：Stage 3 後立刻跑 `pnpm docs:build`，搜尋輸出 `dist/` 是否含 `.archive/` 路徑；若有則加入 `.vitepressignore` 或 vitepress config 的 `ignoreDeadLinks` / `exclude`。
- **[Risk] Stage 3 大量 file move 造成的 commit 體積過大，難以 review** → **Mitigation**：Stage 3 的 `git mv` 全部寫成單一 commit；commit message 明確指出移動清單；reviewer 透過 `git log --stat` 即可看到改動範圍。trade-off 接受：一個大 commit 比三個小 commits 更易 rollback。
- **[Trade-off] 報告檔放專案根目錄會增加 repo 根的「噪音」** → 但提升下游 fork 者第一眼可見的「這 template 是經過稽核的」訊號，trade-off 接受。

## Migration Plan

1. **無資料遷移**：template 無 runtime state。
2. **Stage rollback**：`git reset --hard <previous-stage-commit>` 回退到上一個 stage 開頭。
3. **完整 rollback Change 1**：`git reset --hard <commit-before-stage-1>` 回到 propose 之前狀態；`.archive/` 恢復為 `docs/challenge/<slug>/`（已被 reset 自動處理）。
4. **部分 rollback（保留 audit 但 undo 刪除）**：
   - `git revert <stage-3-commit>` 將 demos 移回 `docs/challenge/`
   - 保留 AUDIT.md / DELETION-PLAN.md / VERIFICATION.md（不撤）
5. **跨 session resume**：
   - 讀 `git log --oneline -10` 找最新的 stage commit
   - 讀 `openspec/changes/project-audit-and-cleanup/tasks.md` 找最新已勾 `[x]` 的位置
   - 從下一個 `[ ]` 繼續執行

## Open Questions

- 暫無。所有需要在 apply 前釐清的問題已透過 brainstorming 階段的 AskUserQuestion 回答（四個 changes 拆分、保留 door-is-open、vue-i18n + VitePress routing）。Stage 2 的 DELETION-PLAN 將處理 stage 3 執行細節（如：哪些 spec @trace 區段需要清理）。
