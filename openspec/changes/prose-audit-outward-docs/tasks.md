<!--
Each task description states:
- the behavior delivered when complete (config file exists, audit verdict
  PASS, file added to .gitignore, etc.), and
- the verification target (CLI invocation, ls / grep on the resulting state,
  spec scenario reference).
-->

## 1. Project config 與 ignore 規則（Audit-runs is gitignored; summary is committed）

- [x] 1.1 在 repo root 產生 `.humane-prose-audit.yaml` 並設 `profile: technical-doc`。完成定義：檔案存在且 `cat .humane-prose-audit.yaml | grep '^profile: technical-doc'` 命中一行。驗證：依 design 之「Profile choice: technical-doc」決策確認 profile 值；spectra scenario「Audit run output is not committed」隱含此 config 由 repo root 解析。
- [x] 1.2 在 `.gitignore` 末尾新增 `# Humane Prose Audit` 區塊與 `audit-runs/` 規則。完成定義：`grep -n '^audit-runs/$' .gitignore` 命中一行。驗證：兌現 Requirement: Outward-facing Markdown SHALL pass humane-prose-audit before release — Scenario「Audit run output is not committed」。

## 2. 對外文件清單列舉（Target enumeration: deterministic and recorded）

- [x] 2.1 列舉 outward 對外文件 19 個（5 root developer docs + 7 docs/en + 7 docs/zh-TW）：
    - Root：`README.md`、`CONTRIBUTE.md`、`CLAUDE.md`、`AGENTS.md`、`GEMINI.md`
    - `docs/`（en source-of-truth）：`docs/index.md`、`docs/challenges.md`、`docs/guide/index.md`、`docs/guide/python.md`、`docs/guide/terminal.md`、`docs/guide/network.md`、`docs/challenge/door-is-open/index.md`
    - `docs/zh-TW/`（locale mirror）：`docs/zh-TW/index.md`、`docs/zh-TW/challenges.md`、`docs/zh-TW/guide/index.md`、`docs/zh-TW/guide/python.md`、`docs/zh-TW/guide/terminal.md`、`docs/zh-TW/guide/network.md`、`docs/zh-TW/challenge/door-is-open/index.md`
    完成定義：清單與 `find docs -name '*.md'` + 5 root .md 之 union 一致。驗證：手動比對 + 兌現 Requirement: Outward-facing Markdown SHALL pass humane-prose-audit before release — Scenario「Internal docs are out of scope」（確認 openspec/** / AUDIT.md / 隱藏目錄不在清單）。

## 3. 對每檔執行 audit（Per-file audit, not glob audit）

- [x] 3.1 對清單上每檔執行 `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py <file> --out audit-runs/prose/<slug>/ --seed 0`，產出 `audit-runs/prose/<slug>/audit-report.json`。完成定義：19 個 run dir 各存在 `audit-report.json`。驗證：`ls audit-runs/prose/*/audit-report.json | wc -l` = 19。**結果**：19 檔全部執行完成、19 個 `audit-report.json` 產出。執行時 `humane-prose-audit` 每檔內部 dispatch 4 個 persona sub-agents（SLP / ILL / SHL / HUM），共 76 次 persona 對抗分析。

## 4. 彙整與分類（Remediation strategy: blocking on Critical / High only）

- [x] 4.1 將 19 個 `audit-report.json` 之 `verdict` 與 `findings` 彙整至 `openspec/changes/prose-audit-outward-docs/audit-summary.md`，按 severity 分類列出（Critical / High = blocking、Medium / Low / Suggestion = 資訊性）。完成定義：summary 檔案存在且按檔列出 verdict + severity 分布。驗證：手動讀 summary。**結果**：`audit-summary.md` 已寫入，內含 per-file 表格（19 列）+ 2 條 Medium informational 詳述（`docs/guide/index.md` 之 pronoun-voice 切換、`docs/guide/terminal.md` 之 lexical diversity）+ 12 條 Low informational 之 pattern 分類（lexical-diversity 與 repetition-fingerprint 兩類為主，皆屬正常技術文件 repeat 識別字）。Mean humane_score = 92.5、全部 high band。

## 5. Remediation（如必要）（Halt-on-overflow rule for any single file）

- [x] 5.1 對每個 Critical / High finding 逐一修補對應檔案，修補後對該檔重跑 audit 直到 verdict PASS。若任一檔之 Critical / High count > 10，halt 並向使用者回報。完成定義：所有 19 檔之最終 verdict 皆為 PASS（0 Critical AND 0 High）。驗證：兌現 Requirement: Outward-facing Markdown SHALL pass humane-prose-audit before release — Scenario「All outward docs PASS at PR time」與 Scenario「Critical and High findings are remediation-blocking」。**結果**：首次 audit 即 19 檔全 PASS，**0 remediation 需求**。所有 19 檔之 `verdict` 為 `PASS`、`summary.critical` = 0、`summary.high` = 0。Halt-on-overflow 規則未觸發（單檔最高 finding count 為 2 Medium 或 2 Low）。

## 6. Build verification

- [x] 6.1 `pnpm docs:build` 通過，warning 數量 ≤ Stage 2 baseline（僅 pre-existing `@vueuse/core` PURE + php-wasm eval）。完成定義：build exit 0、無新 VitePress dead-link / missing-asset warning。驗證：build 輸出對比。**結果**：build 5.47s 完成、exit 0；warning 與 Stage 2 baseline 相同（`@vueuse/core` 兩條 PURE 註解 + php-wasm eval），本 change 未新增任何 warning。

## 7. Audit 與封關

- [x] 7.1 對 `git diff HEAD` 跑 `/spectra-audit`，由其自動 dispatch 內建 3-agent。完成定義：0 Critical / 0 Warning。驗證：audit report。**結果**：壞蛋 / 懶惰開發者 / 搞混的開發者三 lens 掃描，0 finding（本 change 為 config + 文件，無 attack surface；audit-runs 已 gitignored 故無 secret leak 風險）。
- [x] 7.2 派遣 3 個獨立 Stage 3 sub-agents（S3-A 跨檔術語與語氣一致性 / S3-B Link / asset / anchor 完整性 / S3-C VitePress build & render）；依 design 之「`humane-prose-audit` 4 personas count toward the "≥3 sub-agents" requirement」決策，這 3 個 sub-agent 與 humane-prose-audit 內建之 4 個 persona（SLP / ILL / SHL / HUM）不重疊，著重 prose-audit 不涵蓋之維度。完成定義：三 agent 報告皆無 blocking finding。驗證：三份 agent 報告。**結果**：
    - **S3-A**：CONSISTENT。`WebAssembly` / `Pyodide` / `VitePress` / `JavaScript` / `Python` 等識別字 casing 一致；en ↔ zh-TW 之 `challenge / 挑戰`、`tool / 工具`、`runtime / 執行環境`、`terminal / 終端機`、`flag / flag` 對應一致；tone 自 docs/index → docs/guide → docs/challenge 為自然 marketing → educational → reference → narrative 漸進、無突兀切換。
    - **S3-B**：INTACT。README → CONTRIBUTE / LICENSE、CONTRIBUTE 之 6 條 TOC anchor、docs/index 之 6 條 SVG icon path、en ↔ zh-TW 之 path mirroring 全 OK；無 dead link / missing asset / anchor drift / 損壞 frontmatter。
    - **S3-C**：READY-TO-SHIP。build 5.47s clean、`audit-runs/` 確認在 `.gitignore` 且 `git ls-files audit-runs/` 為空、2 條 Medium informational finding 為 stylistic 不影響 render、spec 之 4 條 ADDED Requirement Scenario 全部滿足。
- [x] 7.3 `spectra validate prose-audit-outward-docs` 通過、`spectra analyze` 之 4 dimensions Coverage / Consistency / Gaps Clean（Ambiguity Suggestion-level 可保留）。完成定義：CLI exit 0。驗證：CLI 輸出。**結果**：validate 通過、analyze 之 4 dimensions 全 Clean、0 finding。
- [ ] 7.4 用 `/tw-emoji-commit` 產生 commit message，然後執行 `git commit -F <tmpfile>`。完成定義：commit 已建立並包含本 change 全部 diff（不含 audit-runs/）。驗證：`git log -1 --stat`。
- [ ] 7.5 `/spectra-archive prose-audit-outward-docs` 封關。完成定義：change 移入 `openspec/changes/archive/<date>-<name>/`、spec delta 套用至 `openspec/specs/prose-audit-outward-docs/spec.md`（新 capability）、`spectra list --json` 不再列為 active。驗證：CLI 輸出 + 目錄 listing。
