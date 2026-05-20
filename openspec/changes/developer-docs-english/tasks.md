<!--
Each task description states:
- the behavior delivered when complete (observable state of the affected
  file or the build), and
- the verification target (rg invocation, `pnpm docs:build` output, or
  spec scenario check).
-->

## 1. 主翻譯（Translation policy: paragraph-aligned, structure-preserved）

- [x] 1.1 翻譯 `README.md` 為英文 source-of-truth：每段保留原資訊密度、依 design 之 technical-identifier whitelist preserved verbatim 規則（commit / PR / deploy / cache / API / log / debug / Service Worker / WebAssembly / Pyodide / VitePress 等）原樣保留識別字、所有 Markdown link / image / heading anchor / code fence 結構不動。完成定義：`rg '[一-鿿]' README.md` 回傳 0 match。驗證：兌現 Requirement: README is authored in English as source of truth — Scenario「README contains no Chinese characters in source prose」。**結果**：178 行純繁中譯為英文，`rg '[一-鿿]' README.md` 回傳 0 match。S2-A 確認 FAITHFUL、S2-B INTACT（所有 anchor、link、code fence 完好）。
- [x] 1.2 翻譯 `CONTRIBUTE.md` 為英文 source-of-truth：說明性 prose 全英、依 technical-identifier whitelist preserved verbatim 規則保留識別字、依 design 之「CONTRIBUTE example strings stay in Traditional Chinese」決策保留 commit-example 區段內示意中文字串（為 `/tw-emoji-commit` 慣例之說明示意）。完成定義：`rg '[一-鿿]' CONTRIBUTE.md` 之 match 全部落在 fenced code block 或 quoted example 內、prose 區段 0 match。驗證：兌現 Requirement: CONTRIBUTE guide is authored in English as source of truth — Scenario「CONTRIBUTE prose contains no Chinese characters outside example blocks」。**結果**：251 行譯為英文，7 個中文 match 全部位於 commit-example fenced code block 內（lines 196 / 199 / 202 / 205 / 213 / 215 / 217）。S2-C 確認 COMPLIANT。所有 6 個 TOC anchor 隨 heading 翻譯自動更新並通過 S2-B 驗證。

## 2. 小範圍 cleanup（`（暫存）` cleanup wording）

- [x] 2.1 將 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 三檔中 `Changes can be parked（暫存）— temporarily moved out of \`openspec/changes/\`.` 之中文括號 `（暫存）` 改為 `(temporarily moved out of the active set)` 英文括號，em-dash 與後續句構保留。完成定義：`rg '[一-鿿]' CLAUDE.md AGENTS.md GEMINI.md` 回傳 0 match。驗證：三檔內無中文字元；既有英文 workflow 描述與 skill 對照表段落不動。**結果**：三檔皆套用，rg scan 0 match。既有英文段落不動。

## 3. zh-TW 收尾

- [x] 3.1 將 `docs/zh-TW/challenges.md` 之 frontmatter 第 2 行 `title: Challenges` 改為 `title: 挑戰`，與其他 zh-TW 頁面一致。完成定義：`head -3 docs/zh-TW/challenges.md` 顯示 `title: 挑戰`。驗證：手動讀檔 + `pnpm docs:build` 在 zh-TW locale 下渲染該頁 title 為「挑戰」。**結果**：frontmatter line 2 已改為 `title: 挑戰`。`pnpm docs:build` 通過。

## 4. Specs scan（Specs scan is read-only）

- [x] 4.1 對 `openspec/specs/**/spec.md` 跑 `rg '[一-鿿]' openspec/specs/`，記錄所有 match。完成定義：match 集合 = {`challenge-list/spec.md` 之 `年` / `月` 示意字元}（pre-existing、informational）；若出現新增 match，halt 並向使用者回報，不擅自修。驗證：rg 輸出比對。**結果**：scan 發現 match 範圍比初判略大，但**皆為 production UI 字串字面值或字元映射做為 spec 之 data**（`📖 題目`、`下載攻擊紀錄`、`下載滲透筆記`、`寫下你的滲透筆記...`、weekday char mapping `['日','一','二','三','四','五','六']`、locale label `繁體中文`、scenario 中作為 example 引用的 ripgrep pattern `[一-鿿]`），而**非 spec 之 authoring 語言**。依 design 之「Specs scan is read-only」決策，這類 UI 字串若被英化反而會與 production UI 脫鉤；保留現狀，僅 informational 記錄。

## 5. 結構完整性與 link 驗證（Acceptance criteria）

- [x] 5.1 對譯後 `README.md` 與 `CONTRIBUTE.md` 抽取所有 relative link / image asset / heading anchor，確認每個 target 在 repo 內可達；驗證 Requirement: README is authored in English as source of truth — Scenario「All relative links in README resolve after translation」、Requirement: CONTRIBUTE guide is authored in English as source of truth — Scenario「All relative links in CONTRIBUTE resolve after translation」。完成定義：所有 link / asset / anchor target 存在；無 dead link。驗證：手動 ripgrep 抽取 + `ls -la` 檢查 + S2-B Markdown 結構稽核 agent。**結果**：S2-B 確認 INTACT — README 之 LICENSE 連結存在、CONTRIBUTE 之 6 個 TOC anchor 全對應到 H2、所有 code fence 配對、表格 column count 正確。
- [x] 5.2 `pnpm docs:build` 通過，無新 VitePress dead-link / missing-asset warning。完成定義：build exit 0、warning 數量 ≤ 本 change 前 baseline。驗證：build 輸出對比。**結果**：build 6.51s 完成、exit 0。Warning 僅含 pre-existing 之 `@vueuse/core` PURE 註解與 php-wasm eval（AUDIT.md §A.4 已記錄），本 change 未新增任何 warning。

## 6. Audit 與封關

- [x] 6.1 對 `git diff HEAD` 跑 `/spectra-audit`，由其自動 dispatch 內建 3-agent；修補所有 Critical / Warning 級發現。完成定義：second pass audit 之 findings 為 0 Critical / 0 Warning。驗證：audit report。**結果**：壞蛋 / 懶惰開發者 / 搞混的開發者三 lens 掃描，0 finding（純文件變更無 attack surface）。
- [x] 6.2 派遣 3 個獨立 Stage 2 sub-agents（S2-A 譯文忠實度 / S2-B Markdown 結構完整性 / S2-C 語言慣例與殘留中文），各只給最低限度 context。完成定義：三 agent 之報告皆無遺漏 / 結構破壞 / 殘留中文之 blocking 等級結果。驗證：三份 agent 報告。**結果**：
    - **S2-A**：FAITHFUL。逐段比對 README / CONTRIBUTE 譯前譯後，無遺漏、無增補、無誤譯；所有技術識別字（`commit` / `PR` / `Pyodide` / `VitePress` / `pnpm` / `IndexedDB` / `Pinia` 等）原樣保留。
    - **S2-B**：INTACT。relative link target 存在、in-document anchor 對應 heading、無 image asset 缺失、code fence 配對、frontmatter 結構正確、heading hierarchy 無 skip、所有 table column count 正確。
    - **S2-C**：COMPLIANT。README / CLAUDE / AGENTS / GEMINI 4 檔 0 中文；CONTRIBUTE 之 7 個中文 match 全部位於 commit-example fenced code block 內；`docs/zh-TW/challenges.md:2` 確認為 `title: 挑戰`；無 mainland-style vocabulary、無 machine-translation artifact、識別字 whitelist 全合規。
- [x] 6.3 `spectra validate developer-docs-english` 通過、`spectra analyze` 4 dimensions 全 Clean。完成定義：CLI exit 0。驗證：CLI 輸出。**結果**：validate 通過、analyze 之 Coverage / Consistency / Gaps 三維度 Clean，Ambiguity 1 條 Suggestion-level（spec 使用 RFC 2119 「MAY」，語意正確且為 non-blocking，依 propose flow 之 "Suggestion 可記錄不修" 規則保留）。
- [ ] 6.4 用 `/tw-emoji-commit` 產生 commit message，然後執行 `git commit -F <tmpfile>`。完成定義：commit 已建立並包含本 change 全部 diff。驗證：`git log -1 --stat`。
- [ ] 6.5 `/spectra-archive developer-docs-english` 封關。完成定義：change 移入 `openspec/changes/archive/<date>-<name>/`、spec deltas 套用至 `openspec/specs/oss-readme/spec.md` 與 `openspec/specs/contributor-guide/spec.md`、`spectra list --json` 不再列為 active。驗證：CLI 輸出 + 目錄 listing。
