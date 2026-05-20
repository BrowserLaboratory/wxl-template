## 1. Pre-flight baseline

- [x] 1.1 對 `docs/guide/index.md` 與 `docs/guide/terminal.md` 跑 `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py <file> --out audit-runs/prose/<slug>-pre/ --seed 0`，把 baseline `audit-report.json` 留在 `audit-runs/prose/guide-index-pre/` 與 `audit-runs/prose/guide-terminal-pre/`，作為 polish 後 regression 比對基準。**Verification**: 兩個 `audit-report.json` 存在，且各自包含原先 archive 紀錄的 1 條 Medium finding（`<pronoun-voice>` 或 `<lexical-diversity>`）

## 2. Patch `docs/guide/index.md`（pronoun-voice neutralization）

- [x] [P] 2.1 改寫 `docs/guide/index.md` 中以 `Q: My Python script ran but printed nothing` 開頭的 FAQ Q 句，去除 first-person 代詞 `My` / `I`，改為 voice-neutral 問題形式（例如 `Q: What if a Python script runs but prints nothing?` 或等價句式）。改寫後該 Q 句對應的 A 句保持不變。**Verification**: `rg -nP "Q: My Python script" docs/guide/index.md` 回傳零命中；改寫後行包含 `Python script` 與 `print` 但不含 `My` / `I` first-person token
- [x] [P] 2.2 改寫 `docs/guide/index.md` 中以 `Q: Will my Pentest Notes` 開頭的 FAQ Q 句，去除 `my` / `I` first-person 代詞，改為被動或第三人稱問句（例如 `Q: Do Pentest Notes disappear after closing the page?`）。**Verification**: `rg -nP "Q: Will my Pentest" docs/guide/index.md` 回傳零命中；改寫後句意保留「page close 後 Notes 是否消失」之原始 user concern
- [x] [P] 2.3 改寫 `docs/guide/index.md` 中以 `Q: Can I `import`` 開頭的 FAQ Q 句，去除 `I` first-person 代詞，改為被動或主題式問句（例如 `Q: Are third-party packages importable in the Code Editor?`）。**Verification**: `rg -nP "Q: Can I" docs/guide/index.md` 回傳零命中；`import` 與 `Code Editor` 之 technical terminology 保持不變

## 3. Patch `docs/guide/terminal.md`（lexical diversity uplift）

- [x] [P] 3.1 對 `docs/guide/terminal.md` 描述性 prose 段落（即非 `## Built-in Command List` 表格、非 `### <cmd>` Syntax / Example block、非 code fence）做同義詞替換，建立 `command` / `terminal` / `string` / `text` 等核心名詞的變體分布。可用詞庫：command → utility / directive / invocation；terminal → console / shell prompt / command-line interface；string → input / payload / sequence；text → characters / plaintext。**Verification**: 改寫後 MTLD ≥ 40（由 step 4.2 之 audit re-run 驗證）
- [x] 3.2 確認 `## Built-in Command List` 表格、所有 `### <cmd>` 區段的 `**Syntax**` / `**Example**` block、所有 code fence 內容 **byte-identical** 於 polish 前狀態。**Verification**: `git diff docs/guide/terminal.md` 顯示之改動全部落在描述性 prose 段落；對 syntax/example 區之 diff 行數 = 0

## 4. Post-flight re-audit gate（Medium findings SHALL be remediated in dedicated polish changes）

- [x] 4.1 履行 spec requirement「Medium findings SHALL be remediated in dedicated polish changes」之 pronoun-voice 情境：重跑 `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py docs/guide/index.md --out audit-runs/prose/guide-index/ --seed 0`，並比對 `audit-runs/prose/guide-index/audit-report.json` 對 `audit-runs/prose/guide-index-pre/audit-report.json`。**Verification**: post-polish report 之 `<pronoun-voice>` Medium count = 0，verdict = `PASS`，`humane_score` ≥ pre-polish 分數；所有其他 finding rule 之 count ≤ pre-polish count（不 regress）
- [x] 4.2 重跑 `python3 ~/.agents/custom_skills/humane-prose-audit/scripts/audit_orchestrator.py docs/guide/terminal.md --out audit-runs/prose/guide-terminal/ --seed 0`，並比對 pre / post baseline。**Verification**: post-polish report 之 `<lexical-diversity>` Medium count = 0，MTLD ≥ 40，verdict = `PASS`，`humane_score` ≥ pre-polish 分數；所有其他 finding rule 之 count ≤ pre-polish count
- [x] 4.3 跑 `pnpm docs:build` 確認 VitePress 正常產出兩檔對應的 HTML，Markdown 結構（headings、links、anchors、code fences、frontmatter）完整。**Verification**: build 完成無 error / warning，`docs/.vitepress/dist/guide/index.html` 與 `docs/.vitepress/dist/guide/terminal.html` 存在且包含改寫後的 FAQ Q 句與描述性 prose
- [x] 4.4 跑 `git status` 確認 `audit-runs/` 路徑（含 `-pre` / 非 `-pre` 兩組目錄）皆被 `.gitignore` 排除，未進入 staging。**Verification**: `git status --short audit-runs/` 回傳空輸出

## 5. Locale-mirror scope verification

- [x] 5.1 確認 `docs/zh-TW/guide/index.md` 與 `docs/zh-TW/guide/terminal.md` 兩檔在本 change 中 **byte-identical** 於 polish 前狀態（locale-mirror 已 0 Medium，不在 polish 範圍）。**Verification**: `git diff docs/zh-TW/guide/index.md docs/zh-TW/guide/terminal.md` 回傳空輸出

## 6. Spectra audit gate（apply 結尾必跑，不可省略）

- [x] 6.1 執行 `/spectra-audit docs-prose-polish` 對本 change 內所有變更（含 proposal / specs delta / 兩個 docs 檔之 prose 改寫）做詳細、嚴謹、完整的分析、稽核、確認與驗證 — 涵蓋 dangerous defaults、type confusion、silent failures 等 security sharp edges。**Verification**: spectra-audit 輸出 verdict = PASS，無 Critical / High 級 finding；任何 Warning / Suggestion 級 finding 必須在 archive 前處理或顯性記錄理由
