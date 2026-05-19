## Why

WXL（Web eXploitation Laboratory）作為對外發佈的純前端 WASM CTF 靶場 template，目前堆積 4 個示範題目（sqli-demo、php-demo、fastapi-demo、door-is-open）與全繁體中文內容。在後續啟動 i18n 強化與開發者文件英化之前，必須先建立一份可信賴的稽核基準，並將示範題目精簡到單一最具代表性的 example（door-is-open），讓後續重構作業有乾淨、有限、可控的起點。

## What Changes

- **新增** 三份基準報告：`AUDIT.md`（build / test / spec / i18n surface 完整稽核）、`DELETION-PLAN.md`（保留 vs 移除依據）、`VERIFICATION.md`（精簡後端到端驗證結果）。
- **移除** 三個示範題目至 `.archive/challenge/` 之下（採 `git mv` 保留歷史）：`docs/challenge/sqli-demo/`、`docs/challenge/php-demo/`、`docs/challenge/fastapi-demo/`。
- **保留** 唯一 example：`docs/challenge/door-is-open/`（不變動內容）。
- **修改** `.claude/skills/wxl-creator/SKILL.md`：將內部「參考題目」從 `sqli-demo` 改為 `door-is-open`，並同步更新 spec `wxl-creator-skill` 的對應規範條目。
- **建立** 四階段 commit + audit 檢查點機制：每完成一個 stage 必須先執行 `/spectra-audit`，無 Critical/High finding 後才能透過 `/tw-emoji-commit` 落地一個 git commit，作為跨 session 中斷恢復與 rollback 的錨點。
- **不變動** 任何使用者面字串、不引入 i18n 套件、不翻譯任何文件、不修改 Rust WASM 模組與核心 framework specs。

## Non-Goals

- 不引入 vue-i18n 或 VitePress i18n routing（屬於 Change 2 `i18n-runtime-foundation` 範圍）。
- 不抽取任何 Vue 元件硬編碼字串到 locale 檔（屬於 Change 2）。
- 不產生任何 markdown 內容的英文版（屬於 Change 3 `content-i18n-migration`）。
- 不翻譯 README、CONTRIBUTE 或 openspec/specs/ 內容（屬於 Change 4 `developer-docs-english`）。
- 不刪除 `door-is-open` 以外的 framework / runtime / UI specs。
- 不真正物理刪除被移除的 demo 題目原始檔；它們保留在 `.archive/` 與 git 歷史中，方便回溯。

## Capabilities

### New Capabilities

（無新增 capability。本次變更為 template 精簡與基準建立，產出物為操作型報告與檔案搬移，皆非規範行為。）

### Modified Capabilities

- `wxl-creator-skill`：將「參考題目」從 `sqli-demo` 改為 `door-is-open`，包含 SKILL.md 內所有引用以及對應 spec 規範條目；同時補上「demo 題目精簡後，scaffold 流程仍需可運作」之驗收條件。

## Impact

- **Affected specs**：`wxl-creator-skill`（modified delta）。
- **Affected code**：
  - 新增：`AUDIT.md`、`DELETION-PLAN.md`、`VERIFICATION.md`（皆位於專案根目錄）。
  - 修改：`.claude/skills/wxl-creator/SKILL.md`。
  - 搬移：`docs/challenge/{sqli-demo,php-demo,fastapi-demo}/` → `.archive/challenge/{sqli-demo,php-demo,fastapi-demo}/`。
- **Affected workflows**：
  - 後續以 `/spectra-propose` 啟動的 Change 2/3/4 將以本次稽核基準為起點。
  - `wxl-creator` skill 使用者透過 `/wxl-creator` 建立新題目時，預設參考改為 `door-is-open`。
- **Affected dependencies**：無套件層異動（不安裝、不升級、不移除任何 dependency）。
- **Risk / Rollback**：任一 stage 失敗或審視後決定退回，可透過 `git revert <stage-commit>` 或 `git reset --hard <previous-stage-commit>` 回到上一檢查點；`.archive/` 內容可隨時 `git mv` 回原位。
