## 1. Vendor checker modules + config + 最小 _common + schema

- [x] 1.1 在 repo 根建立 `scripts/prose-audit/` 目錄骨架（`scripts/prose-audit/{checks,scripts,scripts/_common,schemas}/`），並加入空 `__init__.py` 讓 vendored checker 之 `Path(__file__).resolve().parent.parent` 解析到 vendored 根、且 `scripts._common` import 可達——可觀察行為：目錄結構就位、Python import path 可達。驗證：`find scripts/prose-audit -name __init__.py | wc -l` 至少回 3（`checks` / `scripts` / `scripts/_common`）。
- [x] 1.2 [P] 從 `~/.claude/skills/humane-prose-audit/checks/` 複製 14 個 checker module 至 `scripts/prose-audit/checks/`：`mainland_vocab` / `placeholder_grep` / `duplicate_sentences` / `citation_format` / `readability_metrics` / `lazy_writer_check` / `ai_tells` / `burstiness` / `hedge_density` / `imperative_fog` / `lexical_diversity` / `pronoun_consistency` / `discourse_marker_density` / `repetition_fingerprint`——可觀察行為：`ls scripts/prose-audit/checks/*.py | wc -l` 回 14。驗證：每個 module 仍能以 `python scripts/prose-audit/checks/<rule>.py <file>` 獨立 CLI 跑出 JSON（與 upstream 對照 stdout，僅差 path 欄位）。
- [x] 1.3 [P] 從 skill 根複製 `config.yaml` 至 `scripts/prose-audit/config.yaml`——5 個 checker（`mainland_vocab` / `placeholder_grep` / `duplicate_sentences` / `lazy_writer_check` / `readability_metrics`）以 `SKILL_ROOT/config.yaml` 讀 wordlist / pattern；缺檔會 exit 2。可觀察行為：這 5 個 checker 不再印「cannot load config」。驗證：`python scripts/prose-audit/checks/mainland_vocab.py <fixture>` exit 0 且 stdout 為 JSON。
- [x] 1.4 [P] 複製最小 `_common` 子集至 `scripts/prose-audit/scripts/_common/`：`locale_detect.py`（`burstiness` import `ratio_cjk`）+ `config_resolver.py`（`citation_format` lazy import `find_project_config`）。其餘 `_common`（`output_schema` / `journal` / `token_estimator`）**不**引入——可觀察行為：`burstiness` / `citation_format` 不 ImportError。驗證：`python scripts/prose-audit/checks/burstiness.py <fixture>` 與 `python scripts/prose-audit/checks/citation_format.py <fixture>` 皆無 ImportError。
- [x] 1.5 [P] 複製 `schemas/check-output.schema.json` 至 `scripts/prose-audit/schemas/`（vendor 供文件 / 選用驗證；`run.py` **不**跑上游那套會隔離 checker 的 strict 驗證）——可觀察行為：檔案就位。驗證：`test -f scripts/prose-audit/schemas/check-output.schema.json`。
- [x] 1.6 在每個 vendored 檔頂行加 `# Vendored from ~/.claude/skills/humane-prose-audit/<path> @ 2026-05-28; do not edit in place. Upstream-sync via dedicated change.` provenance 註解（14 checker + `config.yaml` + 2 `_common` + 1 schema = 18 檔）——可觀察行為：每個 vendor 檔可追溯來源。驗證：`rg -n "Vendored from .* humane-prose-audit" scripts/prose-audit/` 命中 ≥ 18 條。

## 2. Wrapper CLI `scripts/prose-audit/run.py`（rule-allowlist；不呼 orchestrator）

- [x] 2.1 先寫 `run.py` 之行為測試（fixtures + 期望 exit code，可為 pytest 或 shell 斷言腳本）：乾淨檔 → exit 0、含「視頻」檔 → exit 1、含「TODO」檔 → exit 1、模擬 checker ImportError → exit 2——可觀察行為：測試在 `run.py` 實作前先紅。驗證：跑測試先 fail（紅），實作後轉綠。
- [x] 2.2 實作 `run.py`：positional 接多檔；對每檔逐一以 subprocess 跑 14 個 `checks/<rule>.py <file>`、parse stdout JSON、套用 60s timeout——可觀察行為：多檔批次各產 `<file-slug>/findings.json`，並輸出 summary stdout（掃幾檔、各檔 blocking / advisory finding 數）。驗證：傳兩個 markdown，stdout 含「2 files scanned」與每檔 finding 數摘要。
- [x] 2.3 rule-allowlist gate：`--block-rules`（預設 `mainland_vocab,placeholder_grep,citation_format`）。Exit 1 iff 任一 blocking-set rule 在任一檔有 finding（不論 severity）；只剩 advisory finding 或無檔 → exit 0；checker 非 0 結束 / crash → exit 2（與 blocking 之 exit 1 區分）——可觀察行為：blocking / advisory / internal-error 三態 exit code 分明。驗證：含 Critical-等級之 `mainland_vocab` 命中（「視頻」）→ exit 1；只剩 `burstiness` advisory finding → exit 0；故意指向不存在的 checker → exit 2；`echo $?` 各為 1 / 0 / 2。
- [x] 2.4 `--surface <glob>` 可多次傳入；預設與 `prose-audit-outward-docs` spec line 13 一致（`README.md` / `CONTRIBUTE.md` / `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `docs/**/*.md`）；非 surface 之 markdown 一律跳過——可觀察行為：PR 改 `openspec/changes/foo/proposal.md` 不會被掃。驗證：餵入混合 surface / 非 surface 清單，stdout 之 scanned-file list 只含 surface 檔。
- [x] 2.5 無檔輸入（PR 沒改任何 surface markdown）→ exit 0 並印「No markdown files to audit; skipping.」——可觀察行為：不誤報為 failure。驗證：`run.py` 不帶 positional arg，exit 0、stderr 含 skip 訊息。
- [x] 2.6 `--out <dir>`（預設 `audit-runs/prose-phase1-ci/`）寫 per-file `<slug>/findings.json`；`--json-summary <path>` 寫合併 summary，schema 含 `files: [{path, blocking_findings, advisory_findings, by_rule}]` + `overall_exit: 0|1|2`——可觀察行為：CI 可從 artifact / summary 讀回結果。驗證：跑一次後 `jq '.overall_exit' <summary>` 回 0/1/2，且 `jq '.files | length'` 等於 scanned file 數；`ls <out>` 出現 file-slug 子目錄含 `findings.json`。

## 3. Python dependency 管理

- [x] 3.1 新增 `scripts/prose-audit/requirements.txt`，明列**且僅列** `pyyaml` / `textstat` / `jsonschema`（含版號 pin，例如 `pyyaml==6.*` / `textstat==0.7.*` / `jsonschema==4.*`，以 upstream skill working set 對齊）——`tiktoken`、`py-readability-metrics` **不**列入（無 vendored module import）。可觀察行為：`pip install -r scripts/prose-audit/requirements.txt` 全綠。驗證：乾淨 venv 跑 install + 一次 sample audit，無 ImportError。
- [x] 3.2 確認 3 個套件皆有 `ubuntu-latest`（x86_64）manylinux wheel，無 source-build fallback——可觀察行為：CI install 步驟 wall-clock < 30s（cold pip cache）。驗證：CI log 之 pip install 步驟 timing 在 30s 內。
- [x] 3.3 確認 `.gitignore` **無需改動**：既有 `__pycache__/` / `*.pyc`（line 82–83）與 `audit-runs/`（line 111）已涵蓋 vendored pycache 與 CI artifact——可觀察行為：`git status` 不顯示 vendor 之 `.pyc` 與 CI artifact。驗證：跑一次本地 audit 後 `git status --short` 不見 cache / artifact 檔。

## 4. CI workflow job

- [x] 4.1 在 `.github/workflows/quality-gates.yml` 新增第三個 top-level job ID 為 `prose-audit`，無 `needs:` 依賴（與 `test` / `build` 並行）——可觀察行為：GitHub Actions UI 顯示三 job 同時排程。驗證：`yq '.jobs | keys' .github/workflows/quality-gates.yml` 輸出 `[test, build, prose-audit]`。
- [x] 4.2 `prose-audit` job 之共用 setup：`actions/checkout`（沿用既有 SHA `de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2`，含 `fetch-depth: 0` 以利 `git diff origin/<base>...HEAD`）→ `actions/setup-python`（pin 40-char SHA `# v6.x.y`）with `python-version: '3.12'` and `cache: pip`——可觀察行為：setup 步驟 < 20s（含 pip cache hit）。驗證：CI log 之 setup-python 成功安裝 3.12.x。
- [x] 4.3 `prose-audit` job 在 setup 後跑 `pip install -r scripts/prose-audit/requirements.txt`——可觀察行為：依賴安裝紀錄於 log。驗證：log 末出現 `Successfully installed` 含 `pyyaml` / `textstat` / `jsonschema` 三套件名稱。
- [x] 4.4 `prose-audit` job 之 diff 步驟：`git fetch origin ${{ github.base_ref }} && CHANGED=$(git diff --name-only --diff-filter=AMR -M origin/${{ github.base_ref }}...HEAD -- '*.md')`，寫入 step output——可觀察行為：log 列出 PR 改動 markdown 清單。驗證：對 throwaway PR 改一個 `docs/foo.md`，log 中 `CHANGED` 值為該檔。
- [x] 4.5 `prose-audit` job 之執行步驟：`python scripts/prose-audit/run.py $CHANGED --out audit-runs/prose-phase1-ci/ --json-summary audit-runs/prose-phase1-ci/summary.json`——可觀察行為：summary.json 落地、run.py exit code 傳遞為 step exit code。驗證：對含「視頻」之 throwaway PR，step exit 1；對乾淨 PR，step exit 0。
- [x] 4.6 `prose-audit` job 結尾 `actions/upload-artifact`（pin 40-char SHA `# v5.x.y`）上傳 `audit-runs/prose-phase1-ci/` 全目錄，`if: always()`，`name: prose-audit-phase1-reports`，`retention-days: 14`——可觀察行為：PR 上 workflow run 頁面顯示 artifact 可下載。驗證：throwaway PR 跑完，Actions UI artifact 列表含該 artifact。
- [x] 4.7 `prose-audit` job **不**宣告 job-level `permissions:`（繼承 workflow-level `contents: read`），與 §Workflows declare minimal token permissions Requirement 不衝突——可觀察行為：job 不請求 `pull-requests: write` 等高權限。驗證：`yq '.jobs."prose-audit".permissions' .github/workflows/quality-gates.yml` 回 null（繼承）或顯式 `contents: read`。
- [x] 4.8 `prose-audit` job 之 third-party action（`actions/checkout` / `actions/setup-python` / `actions/upload-artifact`）皆 pin 至 40-char commit SHA + `# vN.x.y` 註解，符合 §Third-party GitHub Actions pinned to commit SHAs Requirement——可觀察行為：新 job 內無 `@vN` 浮動 tag。驗證：對新增之 job 區塊 `rg '@v[0-9]+(\.[0-9]+)*$'` 無命中；每個 `uses:` 行皆為 `uses: <owner>/<repo>@<40-char SHA> # vN.x.y`。

## 5. Spec delta（`ci-quality-gates` 第 13 條 ADDED + Branch-protection MODIFIED）

- [x] 5.1 確認 `specs/ci-quality-gates/spec.md` 之 ADDED Requirement 反映 rule-allowlist failure 政策（blocking set `mainland_vocab` / `placeholder_grep` / `citation_format`，severity-agnostic）、`run.py` 直接呼叫 checker（不 vendor / 呼叫 orchestrator）、依賴僅 `pyyaml` / `textstat` / `jsonschema`、vendor 含 `config.yaml`、per-file `findings.json` + `summary.json`——可觀察行為：spec delta 與實作一致、≥ 3 個 Scenario（PR 觸發、blocking-rule 擋 merge、advisory 不擋、非 outward 不掃、orchestrator 不 vendor、permissions read-only）。驗證：見任務 6.1。
- [x] 5.2 確認同份 spec delta 之 MODIFIED「Branch protection ruleset」之 required-checks 表含 `prose-audit` 行（不變）——可觀察行為：MODIFIED block 同時含原文 + `prose-audit` 表列。驗證：`rg "prose-audit" openspec/changes/prose-audit-phase-1-deterministic/specs/ci-quality-gates/spec.md` 命中 ≥ 5 條。

## 6. Spec sync 與驗證

- [x] 6.1 `spectra validate prose-audit-phase-1-deterministic --strict` 必須 exit 0——可觀察行為：terminal 出現成功訊號、無 Error / Warning。驗證：跑指令、`echo $?` 為 0。
- [x] 6.2 `spectra analyze prose-audit-phase-1-deterministic` 不報 GAP-1 / GAP-2 / GAP-3——可觀察行為：Requirement-to-Task 對應表全綠。驗證：跑指令、無 Warning 行。
- [x] 6.3 `rg "prose.?audit|humane.?prose|markdown.?lint" openspec/specs/` 之輸出只命中 `prose-audit-outward-docs/spec.md`（archive 後再加本 change 落地之第 13 條），無新生 normative 引用被遺漏——可觀察行為：grep 結果無第三個 spec。驗證：人工 review grep 輸出。

## 7. 文件更新

- [x] 7.1 [P] `CONTRIBUTE.md`「Development workflow」段新增「本地等效 prose-audit 命令」：`pip install -r scripts/prose-audit/requirements.txt && python scripts/prose-audit/run.py $(git diff --name-only --diff-filter=AMR -M origin/main...HEAD -- '*.md')`——可觀察行為：貢獻者可一行 reproduce CI。驗證：`rg -n "prose-audit/run.py" CONTRIBUTE.md` 命中。
- [x] 7.2 [P] `README.md` 之 status badges 段（line 5–7 區）新增 Quality Gates workflow-status badge（GitHub Actions badge 為 per-workflow，對應 `quality-gates.yml`，非 per-job）——可觀察行為：README 渲染後出現該 badge。驗證：`rg -n "quality-gates" README.md` 命中 badge URL。

## 8. 端到端驗證

- [x] 8.1 本地乾淨 checkout（Node 22+ / Python 3.12+）跑 `pip install -r scripts/prose-audit/requirements.txt && python scripts/prose-audit/run.py README.md CONTRIBUTE.md`——可觀察行為：兩檔皆走 14 個 checker、無 ImportError、exit code 反映 finding。驗證：`echo $?` 與 stdout summary 一致。
- [x] 8.2 fixture 驗 blocking：含「視頻」之 markdown → exit 1（`mainland_vocab` 是 blocking rule）；含「TODO」之 markdown → exit 1（`placeholder_grep`）；乾淨 markdown → exit 0——驗證：`echo $?` 各為 1 / 1 / 0。
- [x] 8.3 `citation_format` 在無 references 設定之 README / CONTRIBUTE 上不產 finding、不誤擋——可觀察行為：blocking set 不因 `citation_format` 在純文件上誤觸發。驗證：`python scripts/prose-audit/checks/citation_format.py README.md` 之 `findings` 為空（若噪音過多，將其從 `--block-rules` 預設移出、降為 advisory，並回頭更新 2.3 / spec delta）。
- [x] 8.4 開 throwaway PR 至 `staging` 確認三 job 並行——可觀察行為：60 秒內 PR 出現 `Quality Gates / test`、`Quality Gates / build`、`Quality Gates / prose-audit` 三 check。再在 outward markdown 引入「視頻」push → `prose-audit` 紅燈、`test` / `build` 綠燈；還原後三 check 重回 green。驗證：`gh pr checks <pr-number>` 輸出三條 check + 紅/綠轉換。
- [x] 8.5 確認 `audit-runs/prose-phase1-ci/` artifact 可從 Actions UI 下載並含 per-file `findings.json` + `summary.json`——驗證：`unzip -l <artifact>.zip` 列出預期檔案結構。
- [x] 8.6 確認 vendor 後之 14 個 checker 各自獨立 CLI 仍與 upstream byte-identical（path 欄位除外）——驗證：`diff <(python scripts/prose-audit/checks/mainland_vocab.py fixture.md) <(python ~/.claude/skills/humane-prose-audit/checks/mainland_vocab.py fixture.md)` 只見 path 差異。

## 9. Follow-up 紀錄（本 change 不實作）

- [x] 9.1 `design.md` 之 Open Questions 段保留 Option B（verify-committed-summary）與 Option C（Claude API）作為未來 change 候選——驗證：`rg -nE "Option B|Option C" openspec/changes/prose-audit-phase-1-deterministic/design.md` 至少各一條命中。
- [x] 9.2 `design.md` 保留「vendor refresh / upstream sync」議題（含上游正在 refactor 那 6 個 Title-case checker）——驗證：`rg -n "vendor refresh|upstream sync|drift" openspec/changes/prose-audit-phase-1-deterministic/design.md` 命中。
- [x] 9.3 `design.md` 保留「deterministic-only false-negative 風險量化」議題——驗證：`rg -n "false.?negative" openspec/changes/prose-audit-phase-1-deterministic/design.md` 命中。
