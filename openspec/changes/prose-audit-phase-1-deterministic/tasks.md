## 1. Vendor checker modules

- [ ] 1.1 在 repo 根建立 `scripts/prose-audit/` 目錄骨架（`scripts/prose-audit/{checks,scripts,scripts/_common,schemas}/`），並加入空 `__init__.py` 讓 Python import path 可達——可觀察行為：`python -c "import scripts.prose_audit.checks"` 不報錯。驗證：`find scripts/prose-audit -name __init__.py | wc -l` 至少回 3（checks / scripts / scripts/_common）。
- [ ] 1.2 從 `~/.claude/skills/humane-prose-audit/checks/` 複製 14 個 checker module 至 `scripts/prose-audit/checks/`：`mainland_vocab.py` / `placeholder_grep.py` / `duplicate_sentences.py` / `citation_format.py` / `readability_metrics.py` / `lazy_writer_check.py` / `ai_tells.py` / `burstiness.py` / `hedge_density.py` / `imperative_fog.py` / `lexical_diversity.py` / `pronoun_consistency.py` / `discourse_marker_density.py` / `repetition_fingerprint.py`——可觀察行為：`ls scripts/prose-audit/checks/*.py | wc -l` 回 14。驗證：每個 module 仍能以 `python scripts/prose-audit/checks/<rule>.py <file>` 獨立 CLI 跑出 schema-valid JSON（與 upstream 對照 stdout）。
- [ ] 1.3 從 `~/.claude/skills/humane-prose-audit/scripts/_common/` 複製 `config_resolver.py` / `output_schema.py` / `journal.py` 至 `scripts/prose-audit/scripts/_common/`（`locale_detect.py` / `token_estimator.py` 視 checker 實際 import 而定，必要時補進；不必要則不引入以減 vendor 表面）——可觀察行為：`from scripts.prose_audit.scripts._common import output_schema` 不 ImportError。驗證：`python -c "from scripts.prose_audit.scripts._common.output_schema import validate"` exit 0。
- [ ] 1.4 從 `~/.claude/skills/humane-prose-audit/schemas/` 複製 `check-output.schema.json` 至 `scripts/prose-audit/schemas/`——可觀察行為：`jsonschema -i <checker-stdout.json> scripts/prose-audit/schemas/check-output.schema.json` 通過。驗證：對 14 個 checker 各跑一次空 fixture，stdout 全部 schema-valid。
- [ ] 1.5 在 vendor 之 module 開頭加上 `# Vendored from ~/.claude/skills/humane-prose-audit/<path> @ <commit-or-date>; do not edit in place. Upstream-sync via dedicated change.` 註解——可觀察行為：`rg -n "Vendored from .* humane-prose-audit" scripts/prose-audit/` 命中至少 18 條（14 checker + 3 _common + 1 schema headnote）。驗證：人工 review 確認每個 vendor 檔頂行皆含 provenance 註解。

## 2. Orchestrator Phase-1-only 裁減

- [ ] 2.1 從 `~/.claude/skills/humane-prose-audit/scripts/audit_orchestrator.py` 複製至 `scripts/prose-audit/scripts/audit_orchestrator.py`，刪除 Phase 2 sub-agent dispatch / Phase 3 fuzz / Phase 4 humane-signal scoring / Phase 5 consolidated findings 之執行路徑（保留 import 與 dead-code 註解亦可，但不可在 `--phase 1 --no-fuzz` 模式下被觸發）——可觀察行為：`python scripts/prose-audit/scripts/audit_orchestrator.py <file> --phase 1 --no-fuzz --out /tmp/run/` 不產生 `agents/` 或 `mutators/` 子目錄。驗證：`tree /tmp/run/` 只見 `phase1/` + `audit-report.phase1.json`；無 `agents/_inputs.json`、無 `fuzz/`。
- [ ] 2.2 將 orchestrator 之 `--out` 預設根目錄改為 `audit-runs/prose-phase1-ci/`（CI 模式）或允許 `--out` 顯式覆寫——可觀察行為：CI 環境下不傳 `--out` 時自動產生 `audit-runs/prose-phase1-ci/<file-slug>/audit-report.phase1.json`。驗證：未傳 `--out` 跑一次，`ls audit-runs/prose-phase1-ci/` 出現 file-slug 子目錄。
- [ ] 2.3 確認 orchestrator 對 `--fail-on critical` flag 之語意：exit 1 iff 任一 finding 之 `severity == "critical"`；exit 0 否則（含 High / Medium / Low / Suggestion 一律不擋）——可觀察行為：刻意餵入含 Critical mainland_vocab 命中之 fixture，exit 1；換成只剩 High 之 fixture，exit 0。驗證：`echo $?` 對兩 fixture 各為 1 / 0。
- [ ] 2.4 把 orchestrator 之 schema 驗證路徑指向 `scripts/prose-audit/schemas/check-output.schema.json`（不要繼續指向 `~/.claude/skills/.../schemas/`）——可觀察行為：CI runner 無 `~/.claude/` 目錄下 vendor 失敗時 orchestrator 仍能跑。驗證：在 `unset HOME` 之 docker container 跑 orchestrator 仍 exit 0（或在 CI 模擬上跑通）。

## 3. Wrapper CLI (`scripts/prose-audit/run.py`)

- [ ] 3.1 新增 `scripts/prose-audit/run.py`，shape：`python scripts/prose-audit/run.py <file>... [--phase 1] [--no-fuzz] [--fail-on critical] [--out <dir>] [--json-summary <path>]`——可觀察行為：對多檔批次跑，per-file 各產 `<file-slug>/audit-report.phase1.json`，並輸出一份 summary stdout（已掃幾檔、各檔 Critical / High 數量、總體 exit code 判斷依據）。驗證：傳入兩個 markdown 跑，stdout 含「2 files scanned」與每檔 finding count 摘要。
- [ ] 3.2 `run.py` 預設 `--phase 1 --no-fuzz --fail-on critical`（不傳即用此組合）——可觀察行為：CI workflow yaml 不必每行重複 flag，僅需傳檔案清單。驗證：`run.py --help` 之 default 段明列三 flag 為 default true。
- [ ] 3.3 `run.py` 在無檔案輸入時（PR 沒改動任何 markdown）exit 0 並印「No markdown files to audit; skipping.」——可觀察行為：不誤報為 failure。驗證：`run.py` 不帶 positional arg，exit 0、stderr 含 skip 訊息。
- [ ] 3.4 `run.py` 之 outward-facing surface 過濾：接受 `--surface <path-glob>` 多次傳入；CI 端傳入與 `prose-audit-outward-docs` spec line 13 一致之 surface 清單（`README.md` / `CONTRIBUTE.md` / `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `docs/**/*.md`）；非 surface 之 markdown 一律跳過——可觀察行為：PR 改動 `openspec/changes/foo/proposal.md` 不會被掃。驗證：餵入混合 surface / 非 surface 清單，stdout 之 scanned-file list 只含 surface 檔。
- [ ] 3.5 `run.py` 之 `--json-summary <path>` 寫一份合併 summary（每檔 verdict / Critical count / High count / per-rule breakdown），CI 可在 PR comment / annotation 使用——可觀察行為：summary JSON schema 含 `files: [{path, verdict, critical_count, high_count, by_rule}]` + `overall_exit: 0|1`。驗證：跑一次後 `jq '.overall_exit' <summary>` 回 0 或 1，且 `jq '.files | length'` 等於 scanned file 數。

## 4. Python dependency 管理

- [ ] 4.1 新增 `scripts/prose-audit/requirements.txt`，明列 `pyyaml jsonschema textstat tiktoken py-readability-metrics`（含具體版號 pin，例如 `pyyaml==6.*` / `jsonschema==4.*` / `textstat==0.7.*` / `tiktoken==0.7.*` / `py-readability-metrics==1.4.*`，版號以 upstream skill 之 working set 對齊）——可觀察行為：`pip install -r scripts/prose-audit/requirements.txt` 全綠。驗證：在乾淨 venv 跑 install + 一次 sample audit，無 ImportError。
- [ ] 4.2 確認 vendor 不引入 `tiktoken` 等 binary-wheel-only 套件之 platform 偏好——CI runner 為 `ubuntu-latest`（x86_64），與 GitHub-hosted runner 兼容。可觀察行為：CI install 步驟 wall-clock < 60s（cold pip cache）。驗證：CI log 之 pip install 步驟 timing 在 60s 內。
- [ ] 4.3 在 `.gitignore` 加入 `scripts/prose-audit/__pycache__/` 與 `scripts/prose-audit/**/__pycache__/` 條目，並確認既有 `audit-runs/` ignore 涵蓋 `audit-runs/prose-phase1-ci/`——可觀察行為：`git status` 不顯示 vendor 之 `.pyc` 與 CI artifact。驗證：跑一次本地 audit 後 `git status --short` 不見 cache 檔。

## 5. CI workflow job

- [ ] 5.1 在 `.github/workflows/quality-gates.yml` 新增第三個 top-level job ID 為 `prose-audit`，無 `needs:` 依賴（與 `test` / `build` 並行）——可觀察行為：GitHub Actions UI 顯示三 job 同時排程。驗證：`yq '.jobs | keys' .github/workflows/quality-gates.yml` 輸出 `[test, build, prose-audit]`。
- [ ] 5.2 `prose-audit` job 之共用 setup：`actions/checkout@v6`（含 `fetch-depth: 0` 以利 `git diff origin/<base>...HEAD`）→ `actions/setup-python@v6` with `python-version: '3.12'` and `cache: pip`——可觀察行為：setup 步驟 < 20s wall-clock（含 pip cache hit）。驗證：CI log 之 setup-python 步驟成功安裝 3.12.x。
- [ ] 5.3 `prose-audit` job 在 setup 後跑 `pip install -r scripts/prose-audit/requirements.txt`——可觀察行為：依賴安裝紀錄於 log。驗證：log 末出現 `Successfully installed` 含 5 個套件名稱。
- [ ] 5.4 `prose-audit` job 之 diff 步驟：`git fetch origin <base> && CHANGED=$(git diff --name-only --diff-filter=AM origin/<base>...HEAD -- '*.md') && echo "$CHANGED"`——可觀察行為：log 列出 PR 改動 markdown 清單。驗證：對 throwaway PR 改一個 `docs/foo.md`，log 中 `CHANGED` 變數值為該檔。
- [ ] 5.5 `prose-audit` job 之執行步驟：`python scripts/prose-audit/run.py $CHANGED --phase 1 --no-fuzz --fail-on critical --out audit-runs/prose-phase1-ci/ --json-summary audit-runs/prose-phase1-ci/summary.json`——可觀察行為：summary.json 落地、exit code 傳遞為 step exit code。驗證：對含 Critical fixture 之 throwaway PR，step exit 1；對乾淨 PR，step exit 0。
- [ ] 5.6 `prose-audit` job 結尾 `actions/upload-artifact@v5` 上傳 `audit-runs/prose-phase1-ci/` 全目錄，`name: prose-audit-phase1-reports`，`retention-days: 14`——可觀察行為：PR 上之 workflow run 頁面顯示 artifact 可下載。驗證：throwaway PR 跑完，Actions UI artifact 列表含該 artifact。
- [ ] 5.7 `prose-audit` job 之 `permissions:` 區塊宣告 `contents: read`（與既有 `test` / `build` job 一致；不要 override workflow-level）——可觀察行為：與 ci-quality-gates spec §Workflows declare minimal token permissions Requirement 不衝突。驗證：`yq '.jobs."prose-audit".permissions' .github/workflows/quality-gates.yml` 回 null（繼承 workflow-level read）或顯式 `contents: read`。
- [ ] 5.8 `prose-audit` job 之 third-party action（`actions/checkout` / `actions/setup-python` / `actions/upload-artifact`）皆 pin 至 40-char commit SHA + `# vN.x.y` 註解，符合 §Third-party GitHub Actions pinned to commit SHAs Requirement——可觀察行為：`rg '@v[0-9]+(\.[0-9]+)*$' .github/workflows/quality-gates.yml` 無命中。驗證：每個 `uses:` 行皆為 `uses: <owner>/<repo>@<40-char SHA> # vN.x.y` shape。

## 6. Spec delta（`ci-quality-gates` 第 13 條 ADDED Requirement）

- [ ] 6.1 在 `openspec/changes/prose-audit-phase-1-deterministic/specs/ci-quality-gates/spec.md` 落定 ADDED Requirement「The pipeline SHALL run Phase-1 deterministic prose audit on changed markdown files」，含 ≥ 3 個 Scenario（PR 觸發、failure block merge、scan 範圍）——可觀察行為：spec delta 通過 `spectra validate prose-audit-phase-1-deterministic --strict`。驗證：見任務 7.1。
- [ ] 6.2 同份 spec delta 加入 MODIFIED Requirement「Branch protection ruleset guards main with required status checks」之 required-checks 表延伸（新增 `prose-audit` 行），落實「PR 不可 merge until prose-audit green」之 ruleset 契約——可觀察行為：MODIFIED block 同時包含原文 + 新增之表列項。驗證：`rg "prose-audit" openspec/changes/prose-audit-phase-1-deterministic/specs/ci-quality-gates/spec.md` 至少命中 ≥ 5 條（含 ADDED Requirement 本體 + MODIFIED 表列）。

## 7. Spec sync 與驗證

- [ ] 7.1 `spectra validate prose-audit-phase-1-deterministic --strict` 必須 exit 0——可觀察行為：terminal 出現 `✓` / `valid` 等成功訊號，無 Error / Warning。驗證：跑指令、`echo $?` 為 0。
- [ ] 7.2 `spectra analyze prose-audit-phase-1-deterministic` 不報 GAP-1 / GAP-2 / GAP-3——可觀察行為：analyze 輸出之 Requirement-to-Task 對應表全綠。驗證：跑指令、無 Warning 行。
- [ ] 7.3 `rg "prose.?audit|humane.?prose|markdown.?lint" openspec/specs/` 之輸出與 propose 階段紀錄一致，無新生 normative 引用被遺漏——可觀察行為：grep 結果只命中 `prose-audit-outward-docs/spec.md` 與本 change 之 spec delta（archive 後）。驗證：人工 review grep 輸出，確認沒有第三個 spec 出現。

## 8. 文件更新

- [ ] 8.1 `CONTRIBUTE.md` 新增「Local equivalent for Phase-1 prose audit」段，列出 `pip install -r scripts/prose-audit/requirements.txt && python scripts/prose-audit/run.py $(git diff --name-only --diff-filter=AM origin/main...HEAD -- '*.md')`——可觀察行為：貢獻者讀 CONTRIBUTE.md 可一行 reproduce CI。驗證：`rg -n "Phase-1 prose audit" CONTRIBUTE.md` 命中。
- [ ] 8.2 `README.md` 之 status badges 段新增 `prose-audit` job badge（GitHub Actions workflow status URL 對應 `quality-gates.yml` 之 `prose-audit` job）——可觀察行為：README 渲染後出現第三顆 badge。驗證：`rg -n "prose-audit" README.md` 命中 badge URL。
- [ ] 8.3 `openspec/changes/prose-audit-phase-1-deterministic/design.md` 之 Open Questions 段持續保留 Option B（verify-committed-summary）與 Option C（Claude API）之 trade-off 描述，以利後續 change 接手——可觀察行為：design.md 末段含三 Option 表格 / 段落。驗證：`rg -nE "Option B|Option C" openspec/changes/prose-audit-phase-1-deterministic/design.md` 至少各命中一次。

## 9. 端到端驗證

- [ ] 9.1 在本地 Node 22+ / Python 3.12 工作站乾淨 checkout 跑 `pip install -r scripts/prose-audit/requirements.txt && python scripts/prose-audit/run.py README.md CONTRIBUTE.md --phase 1 --no-fuzz --fail-on critical`——可觀察行為：兩檔皆走 deterministic checker、無 Python ImportError、exit code 反映 finding。驗證：`echo $?` 與 stdout summary 一致。
- [ ] 9.2 開 throwaway PR 至 `staging` 確認 workflow 三 job 並行——可觀察行為：60 秒內 PR 上出現 `Quality Gates / test`、`Quality Gates / build`、`Quality Gates / prose-audit` 三 check。驗證：`gh pr checks <pr-number>` 輸出三條 check。
- [ ] 9.3 在 throwaway branch 改一個 outward markdown 引入 Critical mainland_vocab 命中（例如「視頻」、「程序」一字），push 後確認 `prose-audit` 紅燈而 `test` / `build` 綠燈，驗證三 job 獨立性——可觀察行為：PR check 列表顯示 prose-audit red、其他綠。驗證：`gh pr checks` 或 PR 介面截圖；接著還原修改、再 push、確認三 check 重回 green。
- [ ] 9.4 確認 `audit-runs/prose-phase1-ci/` artifact 可從 Actions UI 下載並含 per-file `audit-report.phase1.json` + `summary.json`——可觀察行為：下載 artifact 解壓後檔案結構與 `--out` 目錄結構一致。驗證：`unzip -l <artifact>.zip` 列出預期檔案。
- [ ] 9.5 確認 vendor 後之 14 個 checker 各自獨立 CLI 仍可跑（與 upstream `~/.claude/skills/humane-prose-audit/checks/` 行為對照）——可觀察行為：對同一 fixture，vendor 與 upstream 之 stdout JSON 內容 byte-identical（或僅差 path 欄位）。驗證：`diff <(python scripts/prose-audit/checks/mainland_vocab.py fixture.md) <(python ~/.claude/skills/humane-prose-audit/checks/mainland_vocab.py fixture.md)` 只見 path 差異。

## 10. Follow-up 紀錄（本 change 不實作）

- [ ] 10.1 `design.md` 之 Open Questions 段保留 Option B（verify-committed-summary）與 Option C（Claude API）作為未來 change 之候選——可觀察行為：後續維護者讀 design.md 可直接看到兩 Option 與 trade-off。驗證：`rg -nE "Option B|Option C" openspec/changes/prose-audit-phase-1-deterministic/design.md` 至少各一條命中。
- [ ] 10.2 `design.md` 之 Open Questions 段保留「upstream sync」議題：vendor 後 `~/.claude/skills/humane-prose-audit/` upstream 修 bug / 加 checker 時，本 repo 如何取得？候選方案（手動 diff + cherry-pick / git submodule / pip-installable package）留待後續 change 決定——可觀察行為：design.md 有對應段落。驗證：`rg -n "upstream sync|vendor refresh" openspec/changes/prose-audit-phase-1-deterministic/design.md` 命中。
- [ ] 10.3 `design.md` 之 Open Questions 段保留「Phase 1 deterministic-only 之 false-negative 風險」議題：Phase 1 不含 sub-agent persona 判斷與 fuzz mutator，會漏掉部分 stylistic AI tells；是否未來補 Option B 或 Option C 作為第二道防線？——可觀察行為：design.md 有對應段落。驗證：`rg -n "false.?negative|second.?line.?of.?defense" openspec/changes/prose-audit-phase-1-deterministic/design.md` 命中。
