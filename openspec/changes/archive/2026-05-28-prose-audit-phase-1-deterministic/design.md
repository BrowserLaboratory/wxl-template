## Context

`ci-quality-gates` capability 之 archive design.md（`openspec/changes/archive/2026-05-20-ci-quality-gates/design.md` line 168–187）已明確列出三條 prose-audit CI 化候選路徑，並聲明本系列首個 change 不實作任何一條：

- **Option A：deterministic-only**——CI 跑 14 個 deterministic check（ai_tells / burstiness / mainland_vocab / placeholder_grep / lexical_diversity / pronoun_consistency / duplicate_sentences / citation_format / discourse_marker_density / hedge_density / imperative_fog / lazy_writer_check / readability_metrics / repetition_fingerprint），對「客觀錯誤」類 rule 之 finding 紅燈。低保真但全自動；不滿足 spec PASS 門檻（0 Critical AND 0 High，含 Phase 2 sub-agent 發現）。（註：本 change apply 期確認這 14 個 checker 之最高 severity 為 `high`、無 `critical`，故 gate 改採 rule-allowlist——見 Decisions。）
- **Option B：verify-committed-summary**——維護者本地跑完整 5 phase（含 LLM）→ commit `audit-summary.md` 顯示 PASS → CI 只驗證該 summary 存在、verdict=PASS、且 outward-facing surface 列表對應 commit。高保真但靠維護者紀律；需要新增 audit-summary 格式 SHALL 條款至 `prose-audit-outward-docs` spec。
- **Option C：CI 內呼 Claude API**——把 `ANTHROPIC_API_KEY` 放 GitHub secret，CI 直接驅動 Phase 2 sub-agents。最完整但有 cost（每次 PR 19 個檔案 × 4 個 persona = 76 LLM 呼叫）與 secret-management 考量。

本 change 採行 **Option A**。並行 constraint：

- `prose-audit-outward-docs` spec（line 9–13）規範 release-time PASS 條款是「0 Critical AND 0 High，含 Phase 2 sub-agent findings」。Phase-1-only 之 deterministic 子集無法達到該 PASS 門檻——本 change 之 PR-time gate 在語意上是 **release-time gate 之子集**，attack-surface 互補而非取代。
- vendor 來源 `~/.claude/skills/humane-prose-audit/` 是 system-level skill（2.8MB），由不同維護者管。vendor 後即 fork——upstream 修 bug 不會自動同步進 repo，反向亦然。本 design 把 vendor refresh 流程留作 Open Question。
- GitHub-hosted runner 無 LLM、無 `~/.agents/custom_skills/` mount。所有 Python 依賴必須能從 PyPI 直裝；不可依賴 host filesystem 之 `~/.claude/skills/` 路徑。

## Goals / Non-Goals

**Goals:**

- 把 `~/.claude/skills/humane-prose-audit/` 之 14 個 deterministic checker module（含其讀的 `config.yaml` 與最小 `_common` 子集）vendor 進 `scripts/prose-audit/`，由新增的 `run.py` wrapper 直接呼叫（不 vendor orchestrator），落實 Option A。
- 在 `.github/workflows/quality-gates.yml` 新增第三個並行 job `prose-audit`，對 PR 改動之 outward-facing markdown 跑 14 個 deterministic checker，任一 blocking-set rule（`mainland_vocab` / `placeholder_grep` / `citation_format`）有 finding 即紅燈。
- 擴充 `ci-quality-gates` capability（第 13 條 ADDED Requirement + Branch protection ruleset 之 required-checks 表延伸）。
- 為 Option B（verify-committed-summary）與 Option C（Claude API）保留明確 follow-up 路徑（不在本 change 實作）。
- 為 vendor refresh 流程（upstream skill 更新 → repo vendor 跟進）保留明確 follow-up 路徑（不在本 change 實作）。

**Non-Goals:**

- 不修 `prose-audit-outward-docs` spec 任何條款——該 spec 規範 release-time 完整 verdict，本 change 只加 PR-time deterministic 子集；兩者語意正交。
- 不整合 prose-audit 至 `release.yml`——release-time 仍由維護者手動跑完整五階段，per existing spec。
- 不引入 LLM secret（`ANTHROPIC_API_KEY` 等）——Option A 純 deterministic、無 LLM 呼叫。
- 不抽 reusable workflow（`workflow_call`）——`prose-audit` job 之 setup 與 `test` / `build` job 重疊度低（Python 而非 Node + Rust），抽抽象沒收益。
- 不導入 `pre-commit` / `lefthook` 之本地 git hook——CONTRIBUTE.md 文件提示本地等效命令即可；hook 屬於後續決策。
- 不在本 change 實作 Option B 或 Option C——兩者作為 Open Question 紀錄。
- 不替 `prose-audit` job 加 PR comment 自動回報（GitHub Actions 之 `gh pr comment`）——artifact upload 已足以 debug；自動 comment 留作後續 UX 改進。

## Decisions

### Option A（Phase 1 deterministic-only）vs B（committed-summary）vs C（CI 呼 Claude API）

**選項：** 三條候選見 Context 段。

**選 A 的理由：**

- A 是三條中唯一不需 LLM secret 或維護者紀律就能立刻 enforce 之路徑——B 倚賴維護者每次 release 前手動跑完整 audit 並 commit summary，紀律斷一次就失守；C 倚賴 `ANTHROPIC_API_KEY` 之 secret 管理 + 每次 PR ≥ 76 個 LLM 呼叫之 cost 預算。
- A 之 attack surface 已涵蓋 mainland_vocab / placeholder_grep 等對台灣繁體用語 / 中國大陸用語混用最容易出包之 rule——這些就是 PR-time 最常需要立刻擋下的 Critical 類型。
- A 之 false-negative 風險可以靠維護者繼續在 release-time 跑完整 audit（Option A + release-time manual = 雙層防線）補上；先有 A 不會妨礙未來加 B 或 C。
- C 之 cost 估算（19 檔 × 4 persona = 76 LLM 呼叫 / PR）對小型 OSS repo 偏高；除非 LLM cost 降一個數量級，否則 C 是後續才考慮的路徑。
- 三條都可疊加：A 上線後仍可在後續 change 加 B（committed summary 作為 release-time 補強）或 C（API 呼叫作為 PR-time 第二道防線）。本 change 之 design 不阻擋未來疊加。

### Vendor checker 進 repo vs 用 system-level skill 直接呼

**選項：**

- A: `git submodule add` 把 `~/.claude/skills/humane-prose-audit/` 拉進 repo。
- B: vendor（複製 + provenance 註解，本 change 採用）。
- C: 把 humane-prose-audit 包成 pip-installable package 上 PyPI，repo 之 CI 直接 `pip install humane-prose-audit`。
- D: CI 跑 `git clone <skill-repo>` 取 skill。

**選 B 的理由：**

- A 引入 submodule 維運成本（每次 upstream 動就要更新 submodule pointer + commit），且 submodule 對非 git-experts 之貢獻者門檻偏高。
- C 是長期最乾淨路徑，但需要先 upstream 同意把 skill 抽成獨立 PyPI package、加 packaging metadata、走 PyPI 發佈流程——超出本 change 範圍。後續 change 可再評估。
- D 引入 CI runtime fetch 之延遲 + 對 upstream repo 之 availability 依賴；GitHub-hosted runner clone 平均 ~2s，但若 upstream 掛掉就 CI 全紅，不可接受。
- B 是 trade-off：vendor 即 fork，會有 upstream drift 風險，但**換來 deterministic CI 行為**（CI 之行為只依賴 repo 內檔案，不依賴外部資源）。drift 用 provenance 註解 + Open Question 之「vendor refresh」議題追蹤。

### `run.py` wrapper vs 在 CI yaml 寫 shell loop

**選項：**

- A: CI workflow yaml 自己寫 shell loop 逐檔呼 `python scripts/prose-audit/checks/<rule>.py <file>` 並 aggregate exit code / surface 過濾。
- B: 提供 `scripts/prose-audit/run.py` wrapper，封裝多檔批次 / 14 checker 派發 / rule-allowlist 判斷 / surface 過濾 / summary 輸出（本 change 採用）。

**選 B 的理由：**

- 每個 checker 之 CLI 以 single-file 為單位（`<target.md>` positional 只接一檔），且共 14 個。CI 之 PR diff 會給多檔；在 yaml 寫雙層 loop（檔 × checker）+ 自己 parse JSON 算 blocking-set + aggregate exit code 既醜又難測。wrapper 內部處理乾淨得多，且讓本地等效命令也是同一個 `run.py`。
- Wrapper 是「對外 stable API」+ checker 是「實作細節」之介面分離：未來某個 checker CLI shape 變更、或 blocking set 增減，只改 `run.py` 不破 CI yaml。
- Wrapper 同時是 surface 過濾與 rule-allowlist 判斷之執行點——CI 不必在 yaml 寫 glob / severity 邏輯，由 wrapper 內部以 fnmatch + `--block-rules` 處理。

### Scan 範圍：PR-changed `*.md` ∩ outward-facing surface（不掃全 repo）

**選項：**

- A: 對 PR 改動之所有 `*.md` 跑（含 `openspec/`、`.claude/` 等內部檔）。
- B: 對 PR 改動之 markdown ∩ outward-facing surface 跑（本 change 採用）。
- C: 對全 repo 之 outward-facing surface 跑（不限 PR 改動）。

**選 B 的理由：**

- A 會在 PR 改 `openspec/changes/foo/proposal.md`（內部文件）時 false-positive 擋下；違反 `prose-audit-outward-docs` spec line 34–38 之「internal docs are out of scope」之 invariant。
- C 之 wall-clock 太慢（全 repo outward surface ≥ 30 個檔），每 PR 都掃會浪費 runner 額度，且大多數時間 PR 沒改到那些檔。
- B 是「PR-incremental + 範圍對齊既有 surface 定義」之最小 attack surface。`audit-runs/prose-phase1-ci/summary.json` 顯示掃過幾檔，貢獻者可確認自己改的檔有被掃。
- B 之 trade-off：rename / move 操作可能漏網（git diff 把 rename 視為 delete + add）。Mitigation：CI 之 `git diff` 加 `-M` flag（rename detection），rename 後之新檔仍會被掃。

### Failure 政策：rule-allowlist 而非 severity threshold

**選項：**

- A: severity threshold（`--fail-on critical` / `high` / `medium`）——對某 severity 以上之 finding 紅燈。
- B: rule-allowlist——只對特定「客觀錯誤」rule 之 finding 紅燈，不論 severity（本 change 採用）。

**選 B 的理由（含為何 A 行不通）：**

- **A 的前提不成立**：直接讀源碼確認，14 個 deterministic checker **沒有任何一個發 `critical`**（最高 `high`：`ai_tells` / `placeholder_grep` / `citation_format`）。`mainland_vocab` 只發 `Medium`、`placeholder_grep` 發 `High`。故 `--fail-on critical` 是一個永遠不會亮紅燈的死 gate；上游 orchestrator 也根本沒有 `--fail-on` flag。
- severity 在 deterministic checker 之間語意不一致（`burstiness` 偏直線 = `medium`，`mainland_vocab` 命中大陸用語 = `Medium`），所以一個跨 checker 的 severity 門檻無法乾淨地分「客觀錯誤」與「stylistic 訊號」。
- rule-allowlist 直接點名要擋的 rule：`mainland_vocab`（大陸用語）、`placeholder_grep`（未完成佔位符）、`citation_format`（引用格式錯誤）——這三類在 outward 文件就是「明確錯」，擋下無誤殺風險，且正好涵蓋台灣繁體 / 大陸用語混用這個 repo 最常出包的類型。
- 其餘 11 個偏 stylistic 之 checker（`burstiness` / `lexical_diversity` / `hedge_density` / `ai_tells` 等）一律 advisory：finding 寫進 `summary.json` 供人讀，但不擋 merge——避免重構 / merge / 自動產生段落被誤殺。
- gate 是 severity-agnostic，所以**不需要**動到 vendored checker 的 severity 大小寫（見下一個 Decision）；blocking set 由 `run.py` 之 `--block-rules`（預設那三個）控制，未來要加減 rule 改 default 即可。
- `prose-audit-outward-docs` 之 release-time PASS（0 Critical AND 0 High，含 Phase 2 sub-agent）仍由維護者手動跑完整 audit 守住；PR-time 之 rule-allowlist 是「最小必要 attack surface」，與 release-time 雙層防線並存。

### 直接呼叫 checker vs vendor 整個 orchestrator

**選項：**

- A: vendor `audit_orchestrator.py` 並以 `--phase 1` 跑（原 propose 採用）。
- B: `run.py` 直接逐一以 subprocess 呼叫 `checks/<rule>.py`，**不** vendor orchestrator（本 change 採用）。

**選 B 的理由：**

- **A 會踩到 orchestrator 的隔離 bug**：orchestrator Phase-1 preflight 會用 strict（小寫 enum）schema 驗證每個 checker 輸出，把發 Title-case severity 的 6 個 checker（含 `mainland_vocab` 發 `Medium`、`placeholder_grep` 發 `High`）當 schema 違規丟進 `_errored.json` 隔離、findings 完全不計。也就是說走 orchestrator，本 change 最仰賴的兩個 checker 反而產不出可用 finding。上游正在 refactor（`.refactor-progress.yaml`），這 6 個 checker 目前在 orchestrator 流程裡是壞的。
- **B 繞開隔離**：`run.py` 直接讀 checker stdout JSON，不跑那套 strict 驗證，所以 Title-case severity 不會被隔離；又因為 gate 是 rule-identity（非 severity），大小寫對判斷無影響——**vendored checker 因此維持與上游 byte-identical（只多一行 provenance 註解）**，不必逐檔改 severity。
- B 砍掉 ~1800 LOC 用不到的 Phase 2/3/4/5 程式碼（`audit_orchestrator.py` 985 + `output_aggregator.py` 526 + `journal.py` + `token_estimator.py`）。vendor 量 ~5450 → ~3000 LOC。
- rule-allowlist 是 wrapper 層政策，本來就該住在 `run.py`、不在不支援它的 orchestrator。`run.py` 自己處理多檔批次 / surface 過濾 / summary 聚合（~150–200 LOC）。
- trade-off：`run.py` 自行重做「per-check subprocess + 60s timeout + 聚合」這層（orchestrator 原本有），但相對於 vendor + 維護整個 orchestrator 划算。

### Artifact upload 策略：upload-artifact 而非 PR comment

**選項：**

- A: 上傳 `audit-runs/prose-phase1-ci/` 為 GitHub Actions artifact（本 change 採用）。
- B: 用 `gh pr comment` 把 summary.json 寫進 PR comment。
- C: 用 `actions/github-script` 寫 PR check annotation（per-line warning）。

**選 A 的理由：**

- A 之實作最簡單（`actions/upload-artifact@v5` 直接吃目錄），且 14 日 retention 對 PR debug 已足夠。
- B 需要 `permissions: pull-requests: write`，違反 §Workflows declare minimal token permissions Requirement 之 minimal-scope 原則。
- C 之 implementation 複雜（要把 JSON finding 翻譯成 GitHub check annotation 格式，line / column 對應要算對），維運成本高。先用 A，後續 UX 改進再評估 C。
- A 之 trade-off：artifact 要主動下載，沒像 PR comment 那麼顯眼。Mitigation：CI 紅燈時，紅燈訊息本身已含具體 Critical finding 之檔名 / rule（從 `run.py` 之 stdout summary 取），貢獻者通常不需下載 artifact 也能修。

## Implementation Contract

**觀察行為**（外部使用者看到的）：

- 任何 PR 開啟、更新、或 reopen，base branch 為 `main` 或 `staging` 時，`Quality Gates` workflow 觸發；workflow 內三個並行 job（`test` / `build` / `prose-audit`）同時排程。
- `prose-audit` job 只在 PR 改動之 markdown ∩ outward-facing surface 不為空時實際跑 audit；空集合時 job 在 < 30s 內 PASS（only setup + skip 訊息）。
- 任一改動 markdown 之 Phase-1 audit 報 Critical finding 時，`prose-audit` job 紅燈；其他 job 不受影響。
- workflow 完成後，PR 介面顯示三個 check（`Quality Gates / test`、`Quality Gates / build`、`Quality Gates / prose-audit`）；任一紅燈即標示 PR 不可 merge（前提是 branch protection rule 已將三 job 設為 required；本 change 之 spec delta 同步補進 required-checks 表）。

**workflow `prose-audit` job 介面（觸發契約）：**

```yaml
prose-audit:
  runs-on: ubuntu-latest
  permissions:
    contents: read
  steps:
    - uses: actions/checkout@<sha> # v6.x.y
      with:
        fetch-depth: 0
    - uses: actions/setup-python@<sha> # v6.x.y
      with:
        python-version: '3.12'
        cache: pip
    - run: pip install -r scripts/prose-audit/requirements.txt
    - name: Compute changed markdown
      id: diff
      run: |
        git fetch origin ${{ github.base_ref }}
        CHANGED=$(git diff --name-only --diff-filter=AMR -M origin/${{ github.base_ref }}...HEAD -- '*.md')
        echo "files=$CHANGED" >> "$GITHUB_OUTPUT"
    - name: Run deterministic prose audit
      run: |
        python scripts/prose-audit/run.py \
          ${{ steps.diff.outputs.files }} \
          --out audit-runs/prose-phase1-ci/ \
          --json-summary audit-runs/prose-phase1-ci/summary.json
    - uses: actions/upload-artifact@<sha> # v5.x.y
      if: always()
      with:
        name: prose-audit-phase1-reports
        path: audit-runs/prose-phase1-ci/
        retention-days: 14
```

**`run.py` CLI 介面（外部 stable API）：**

```
python scripts/prose-audit/run.py <file>... \
  [--out <dir>] (default audit-runs/prose-phase1-ci/) \
  [--json-summary <path>] \
  [--surface <glob>]... (default per prose-audit-outward-docs spec line 13) \
  [--block-rules <csv>] (default: mainland_vocab,placeholder_grep,citation_format)

對每個檔逐一以 subprocess 跑 14 個 checker（python checks/<rule>.py <file>）、parse stdout JSON。
Exit 0: 無 blocking-set finding（或無檔可掃）；advisory finding 仍記入 summary。
Exit 1: 至少一個 blocking-set rule（--block-rules）有 finding（不論 severity）。
Exit 2: 內部錯誤（checker 非 0 結束 / crash / ImportError）。
```

**Per-file 輸出檔結構：**

```
audit-runs/prose-phase1-ci/
├── summary.json                                # 合併 summary（files:[{path, blocking_findings, advisory_findings, by_rule}] + overall_exit）
├── <file-slug-1>/
│   └── findings.json                           # 該檔 14 checker 之 finding（含 blocking / advisory 標記）
├── <file-slug-2>/
│   └── findings.json
└── ...
```

**失敗模式：**

- `pip install` 階段失敗（PyPI outage / dep 衝突）→ step 紅燈、job 紅燈、上層 workflow 紅燈。
- `git diff` 算出空清單（或全部不在 surface）→ `run.py` exit 0 + skip 訊息；job 綠燈。
- `run.py` 對至少一檔之 blocking-set rule 報 finding → run.py exit 1、job 紅燈；artifact upload 步驟用 `if: always()` 仍會跑（讓貢獻者下載 audit-runs/ 看 finding）。
- 只有 advisory rule 有 finding → run.py exit 0、job 綠燈；finding 仍寫進 summary 供人讀。
- vendor 之 checker module ImportError / 非 0 結束 → `run.py` 捕捉、報 internal error、exit 2（與 blocking finding 之 exit 1 區分），job 紅燈。

**接受標準（implementer / reviewer 驗證點）：**

- workflow yaml syntax 通過 `actionlint` 或 `gh workflow view`。
- 本地等效命令 `pip install -r scripts/prose-audit/requirements.txt && python scripts/prose-audit/run.py $(git diff --name-only --diff-filter=AMR -M origin/main...HEAD -- '*.md')` 在 Python 3.12 環境跑得通。
- 對 vendor 之 14 個 checker module，`python scripts/prose-audit/checks/<rule>.py <file>` 仍可獨立 CLI 跑（不破壞 upstream 之 single-check 介面；vendor 與 upstream stdout JSON byte-identical，path 欄位除外）。
- 開 throwaway PR 至 `staging`，故意把 `README.md` 加一句「視頻」（中國大陸用語）+ push，PR 上 `Quality Gates / prose-audit` 紅燈（`mainland_vocab` 是 blocking rule）、`test` / `build` 綠燈；改回「影片」後三 check 重回 green。
- `citation_format` 在無 references 設定之純文件（README / CONTRIBUTE）上不產 finding、不誤擋（apply 期驗證；若噪音過多則降為 advisory）。
- `spectra validate prose-audit-phase-1-deterministic --strict` 在 archive 前 PASS。

**Scope 邊界：**

- **In scope**：vendor 14 checker + `config.yaml` + 最小 `_common` + schema + `run.py` wrapper 至 `scripts/prose-audit/`、新增 `.github/workflows/quality-gates.yml` 之 `prose-audit` job、擴充 `ci-quality-gates/spec.md` 第 13 條 Requirement + Branch protection 表延伸、`CONTRIBUTE.md` 與 `README.md` 文件補充。
- **Out of scope**：vendor / 呼叫 `audit_orchestrator.py`、`release.yml` 任何修改、`prose-audit-outward-docs` spec 任何條款修改、LLM secret 設定、Option B / Option C 之實作、upstream sync 自動化、pre-commit hook、PR comment 自動回報。（`.gitignore` 既有條款已涵蓋，無需改動。）

## Risks / Trade-offs

- **[Risk] Vendor 後與 upstream `~/.claude/skills/humane-prose-audit/` drift**——upstream 修 bug 不會自動進 repo；反向亦然。**Mitigation**：每個 vendor 檔頂行加 `# Vendored from ... @ <date>` provenance 註解；Open Questions 段紀錄 vendor refresh 議題；後續 change 評估 pip-installable package 路徑（Option C of vendor strategy）。
- **[Risk] deterministic-only 之 false-negative**——stylistic AI tells / sub-agent 才能抓的問題會漏。**Mitigation**：`prose-audit-outward-docs` 之 release-time 完整 audit 仍由維護者守住（雙層防線）；Open Questions 段紀錄 Option B / Option C 作為 second-line-of-defense follow-up。
- **[Risk] `git diff` rename detection 不完美**——rename + 改內容可能 split 為 delete + add，但 `-M` flag 降低此風險。**Mitigation**：CI 之 diff 步驟加 `-M`；若仍漏，貢獻者可在 PR description 手動 trigger re-run 加上明示 `--surface` flag 之 step。
- **[Risk] cold-cache pip 安裝時間**——3 個套件（`pyyaml` / `textstat` / `jsonschema`，皆有 Linux wheel、無 `tiktoken` 之笨重 binary wheel）估 15–25s。**Mitigation**：`actions/setup-python@v6` 之 `cache: pip` 命中後降至 ~5s；vendor 不加更多依賴。
- **[Risk] `citation_format` 在 blocking set 但對無 references 設定之文件誤報**——它的 finding 只在有引用時才有意義。**Mitigation**：apply 期以 README / CONTRIBUTE 驗證它不產 finding；若噪音過多則把它從 `--block-rules` 預設移出、降為 advisory（改 `run.py` default 一行）。
- **[Risk] vendor 後與 upstream drift（含 upstream 正在 refactor 那 6 個 Title-case checker）**——upstream 修 severity 大小寫或 bug 不會自動進 repo。**Mitigation**：provenance 註解 + Open Questions 之 vendor-refresh 議題；本 change 因 gate 為 severity-agnostic，不受上游大小寫修正影響。
- **[Trade-off] Vendor 增加 ≈ 2900–3100 LOC 之 Python 程式碼進 repo**——比原 propose 之 ~5450 LOC 少（不含 orchestrator / aggregator / journal / token_estimator）。repo size 增加但較可控；vendor 是 deterministic CI 行為之代價。
- **[Trade-off] `run.py` wrapper 自行重做 per-check 派發 / 聚合**——原本是 orchestrator 的職責；換來繞開 orchestrator 隔離 bug + 砍 ~1800 LOC。維運上 `run.py`（~150–200 LOC）與 14 個 vendored checker 各自維護；可接受。
- **[Trade-off] rule-allowlist 而非 severity threshold**——好處是 severity-agnostic（vendored checker 維持 byte-identical、不必改大小寫）、誤殺低；代價是 blocking set 為人工策展，新增「客觀錯誤」類 checker 時要記得加進 `--block-rules` 預設。

## Open Questions

### Option B 與 Option C 作為未來補強路徑（follow-up change，本次不實作）

本 change 採行 Option A 後，仍有兩條補強路徑可在後續 change 採行：

- **Option B：verify-committed-summary**——維護者本地跑完整 5 phase（含 LLM）→ commit `openspec/changes/<name>/audit-summary.md` 顯示 verdict=PASS → CI 加一步驟 `python scripts/prose-audit/verify_summary.py audit-summary.md` 驗證 verdict 欄位、surface 列表對應本 commit、且 summary 之 commit hash 對應 HEAD。trade-off：高保真但靠維護者紀律；需要新增 audit-summary 格式 SHALL 條款至 `prose-audit-outward-docs` spec；維護者忘記跑 audit 即繞過 gate。
- **Option C：CI 內呼 Claude API**——把 `ANTHROPIC_API_KEY` 放 GitHub secret，CI 直接驅動 Phase 2 sub-agents。trade-off：最完整但每次 PR ≥ 19 檔 × 4 persona = 76 LLM 呼叫之 cost；secret 管理（rotate、scope）；對 forked PR 之 secret 隔離（GitHub 預設不對 fork PR 暴露 secret，意味 contributor PR 跑不到）。

兩 Option 可疊加於本 change：A 上線後加 B 作為 release-time committed-summary gate；A + B 上線後加 C 作為 PR-time second-line-of-defense。本 change 不阻擋未來疊加。

### Vendor refresh 流程（upstream skill 更新如何同步進 repo）

`~/.claude/skills/humane-prose-audit/` vendor 後即 fork。當 upstream skill 修 bug、加 checker、改 schema 時，本 repo 如何取得？候選方案：

- **手動 diff + cherry-pick**：每次需要時，由維護者跑 `diff -r ~/.claude/skills/humane-prose-audit/checks/ scripts/prose-audit/checks/` 比較，並把要 cherry-pick 之變更手動套入 vendor。低門檻但不可規模化。
- **git submodule** 把 upstream 接成 submodule：解 vendor drift 問題，但 submodule 對非 git-experts 之貢獻者門檻偏高。
- **包成 pip-installable package**：把 humane-prose-audit 抽成獨立 PyPI package（`pip install humane-prose-audit`），repo 之 `requirements.txt` 鎖版號。最乾淨但需要 upstream 同意 + 加 packaging metadata + 走 PyPI 發佈流程。

待後續 change 決定。本 change 之 provenance 註解（每檔頂行 `# Vendored from ... @ <date>`）是過渡 mitigation。

### Phase 1 deterministic-only 之 false-negative 風險量化

Phase 1 不含 sub-agent persona 判斷與 fuzz mutator，會漏掉部分 stylistic AI tells（例如 sub-agent 才能抓的「過度 hedge」、「conclusion-by-listing」之類 prose pattern）。需要回答的問題：

- 對既有 `prose-audit-outward-docs` 之 outward surface，跑一次完整五階段 vs Phase-1-only 之 Critical / High finding 差異多少？
- 是否有具體 case 是 Phase 1 報 PASS 但 Phase 2 / 4 報 Critical？
- 是否需要在 README / CONTRIBUTE 明示 Phase-1 gate 是「最小必要」而非「完整 verdict」？

待後續 change（或本 change 之後續 PR 內補一份 calibration report）決定。

### `release.yml` 之 prose-audit 整合（archive design.md 之未決議題）

`prose-audit-outward-docs` spec 規範「before a release tag is cut」要 PASS，但 `release.yml` 目前不跑 audit。是否在本系列 follow-up 中：

- 把 prose-audit 整合進 `release.yml`（release-time enforce）？還是
- 留作維護者 pre-tag 手動流程，靠 `tw-emoji-release-note` skill 提醒？

待後續 change 決定。本 change 不動 `release.yml`。
