## Why

R1 `authoring-skill-pattern`（PR #28、2026-05-31 merged）已建立跨 agent skill 的標準 pattern，但 `wxl-creator` 目前只把 `vuln` 當 free-text 自由字串、靠唯一一份 canonical reference（`docs/challenge/door-is-open/`）出所有題目，缺乏對特定 OWASP 類型的辨識、修復建議與多 backend 範例。本 change（R8）以 OWASP A01 Broken Access Control 為首個試點，建立「題型 pack」契約供 R6（A05）、R7（A03）等後續 pack 複用：一個 OWASP 題型 = 一個 capability + `wxl-creator/reference/<capability>.md` + 一組 cover 全部 runtime 的 reference challenge。

## What Changes

- 新增 capability `a01-access-control-template-pack`，定義 A01 reference challenge 集合、reference 文件位置、wxl-creator 出題與修復迴圈對 A01 的辨識與行為
- `wxl-creator-skill` capability 加 1 條通用 Requirement「skill SHALL consume capability-specific reference documents from reference/」，建立 trigger regex → reference 文件的 registry table 機制，讓 R9–R12（後續 OWASP 題型 pack）只要加 row 就能延伸，**不需要再改 wxl-creator-skill spec**
- 新增 `.agent/skills/wxl-creator/reference/a01-access-control.md`：A01 辨識啟發、IDOR / JWT alg:none / Path traversal 各自的修復提示、reference challenge 表
- 修改 `.agent/skills/wxl-creator/SKILL.md` 與 `SKILL.zhTW.md`：Workflow 插入 step 3.0「諮詢 capability-specific reference」、加 registry table、修復迴圈 append A01-specific 修復 bullet
- 新增 2 個 reference challenge：`jwt-none-alg`（Flask + pyjwt、JWT alg=none 繞過、medium）與 `confidential-files`（PHP + LFI via include/file_get_contents、easy）
- 沿用既有 `door-is-open`（FastAPI、IDOR、easy）作為 A01 第三題，不改動其程式碼
- 新增對應 Playwright spec：`tests/challenges/jwt-none-alg.spec.ts` 與 `tests/challenges/confidential-files.spec.ts`
- 同時為 Flask 與 PHP 建立 first production A01 reference（既有 Flask/PHP demo 僅存於 `.archive/challenge/`）

## Capabilities

### New Capabilities

- `a01-access-control-template-pack`: 定義 OWASP A01（Broken Access Control）題型模板包：reference challenge 集合（必須 cover `challenge-runtimes` 當前所有 runtime）、A01 reference 文件契約、wxl-creator 出題流程對 A01 的 dispatch heuristic、修復迴圈的 A01-specific 修復建議、A01 challenge 的 tag taxonomy

### Modified Capabilities

- `wxl-creator-skill`: 新增「skill SHALL consume capability-specific reference documents from `reference/`」這條通用 Requirement，建立 registry table 機制（trigger regex → reference 文件路徑），讓 wxl-creator 在 `vuln` 命中已知 capability 的 trigger regex 時，於 code-gen 前自動讀取對應 `reference/<capability>.md`；本 change 在 table 加入第一 row（A01）

## Impact

- 影響 specs：新 `openspec/specs/a01-access-control-template-pack/spec.md`、修改 `openspec/specs/wxl-creator-skill/spec.md`（+1 Requirement）；spec count 由 42 增為 43（archive 後）
- 影響程式碼：
  - 新增：`docs/challenge/jwt-none-alg/index.md`、`docs/challenge/jwt-none-alg/src/app.py`、`docs/challenge/jwt-none-alg/src/flag.txt`
  - 新增：`docs/challenge/confidential-files/index.md`、`docs/challenge/confidential-files/src/index.php`、`docs/challenge/confidential-files/src/flag.txt`
  - 新增：`tests/challenges/jwt-none-alg.spec.ts`、`tests/challenges/confidential-files.spec.ts`
  - 新增：`.agent/skills/wxl-creator/reference/a01-access-control.md`
  - 修改：`.agent/skills/wxl-creator/SKILL.md`、`.agent/skills/wxl-creator/SKILL.zhTW.md`
- 影響 runtime：jwt-none-alg 需要 `pyjwt`（純 Python wheel，Pyodide 透過 micropip 載入），其餘新題不引入新 runtime 依賴
- 不影響：既有 `door-is-open` 程式碼與 frontmatter、`challenge-runtimes` capability、其他 spec
