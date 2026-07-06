## 1. 可用性稽核執行

- [x] 1.1 產出可用性稽核 ledger `.spectra/analysis/skill-agent-usability-audit.md`：對 repo 內全部 14 個 skill（`.agent`/`.claude`/`.codex`/`.gemini` 四處）逐一套用九項 rubric（frontmatter 合法性、description 可觸發性、canonical source 位置、thin pointer 完整性、host matrix 完整性、host-agent-neutral 措辭、引用可解析性、canonical 與 pointer 一致性、`_template` 未被啟用），每個 skill 對每項標記 PASS 或 FAIL 並附證據與可重現指令。驗收：ledger 存在且矩陣涵蓋 14 skill × 9 檢查無遺漏（內容審閱），且每筆 FAIL 附一條可重跑的 `git grep`/`test -f`/`spectra` 指令。

## 2. 稽核結果的對抗式驗證

- [x] 2.1 對 ledger 內每一筆 FAIL finding 執行 multi-agent adversarial review（多個 sub agent 以驗真、去偽、補漏三種 lens 獨立重跑證據指令），為每筆標記 CONFIRMED 或 REJECTED 並附裁決理由，且新增 review 補抓到的遺漏 finding。驗收：ledger 每筆 finding 皆帶 verdict 與依據，review 涵蓋率 100%（所有 FAIL 皆有裁決），且至少一輪 completeness pass 記錄「有無新增遺漏」。

## 3. 修復 repo-owned skill 缺陷

- [x] 3.1 針對每筆 CONFIRMED 且屬 repo-owned skill（`wxl-creator`、`wxl-fork-init`、`.agent/skills/_template`）的 finding 施作修復，使該 skill 對官方 host agent matrix 可被正確依循。驗收：對每筆修復重跑 ledger 記錄的原始檢查指令並得到 PASS（exit 0 / 零命中）；若稽核與 review 後 repo-owned CONFIRMED findings 為零，於 ledger 記錄「repo-owned 全數 PASS、無需修復」並附全項檢查通過證據。

## 4. vendored spectra-* 問題 triage

- [x] 4.1 在 ledger 的 triage 段落記錄 vendored `spectra-*` 的每筆問題（缺 `.codex` pointer、`spectra-analyze` 與 `spectra-verify` 僅存於 `.claude`、`.agent/skills/spectra-*` 下缺 `AGENTS.md`）及其處置理由（CLI 管理、直接修改會被覆寫、非 `authoring-skill-pattern` 規範對象），且不修改任何 `spectra-*` 檔案。驗收：ledger triage 段落逐筆列出問題與 disposition；`git status --porcelain` 不顯示任何 `spectra-*` skill 檔案被修改。

## 5. skill-agent-usability spec 落地驗證

- [x] 5.1 驗證 Requirement "Authoring skill reference resolvability" 對兩個 authoring skill（`wxl-creator`、`wxl-fork-init`）成立：其 canonical SKILL.md 與 reference 文件內引用的每個 repo 相對檔案路徑、script、`pnpm <script>` 指令都可解析。驗收：抽取所有引用路徑逐一 `test -f` 全過，且每個 `pnpm <script>` 對應 `package.json` `scripts` 內存在的 key，結果附入 ledger。
- [x] 5.2 驗證 Requirement "Valid and discoverable skill frontmatter" 對兩個 authoring skill 成立：canonical `SKILL.md` 與三家 thin pointer 的 frontmatter 皆為合法 YAML、`name` 為 kebab-case 且等於目錄名、`description` 非空且描述觸發時機。驗收：對每個 entry-point 解析 frontmatter，`name` 等於 `<skill-name>`、`description` 非空，結果附入 ledger。
- [x] 5.3 驗證 Requirement "Canonical and pointer name consistency" 對兩個 authoring skill 成立：`.claude`/`.codex`/`.gemini` 三家 pointer 的 `name` 皆等於 canonical `.agent/skills/<name>/SKILL.md` 的 `name`，且每家 pointer body 指向該 canonical 檔。驗收：比對四處 `name` 完全一致、三家 pointer body 皆 reference `.agent/skills/<name>/SKILL.md`，結果附入 ledger。
