# wxl-template 內容精簡刪除計畫（Stage 2 · Change 1）

> Change：`project-audit-and-cleanup` ｜ Stage：2 / 4 ｜ 產出日期：2026-05-19。
>
> 本計畫以 `AUDIT.md` 為唯一 baseline，列出 Stage 3 將執行的具體刪除/搬移/替換動作。Stage 3 完成後須兌現本檔 §C 的 invariants。

---

## A. 引用清單（依處理動作分類）

### A.1 MUST UPDATE — Stage 3.2 必處理

**Skill prose 檔（共 3 檔 / 9 處引用）**

| 檔 | 行 | 原文摘要 | 處理 |
|---|---|---|---|
| `.claude/skills/wxl-creator/SKILL.md` | 109 | `**Read the existing sqli-demo as reference** for code style and structure:` | 改為 door-is-open；強化「only reference」語意 |
| `.claude/skills/wxl-creator/SKILL.md` | 110 | `- \`docs/challenge/sqli-demo/src/app.py\`` | 改為 `docs/challenge/door-is-open/src/app.py` |
| `.claude/skills/wxl-creator/SKILL.md` | 259 | `- You SHALL always read \`sqli-demo/src/app.py\` as a reference for code style before generating.` | 改為 door-is-open；補上「禁止 fallback 到任何非 canonical reference」之 SHALL NOT 條款 |
| `.agent/skills/wxl-creator/SKILL.md` | 109 / 110 / 259 | 同上三條 | 同上三條（duplicate file for non-Claude agents） |
| `.agent/workflows/wxl-creator.md` | 111 / 112 / 261 | 同上三條（行號各 +1 / +1 / +2） | 同上三條 |

**驗收**：`rg "sqli-demo" .claude/skills/wxl-creator/ .agent/skills/wxl-creator/ .agent/workflows/wxl-creator.md` 必須為零比對。

**`.wxl-creator/config.yaml`**：本次 grep 未找到 sqli-demo 殘餘字串；Stage 3.2 仍應再次 `rg` 確認（防呆）。

### A.2 MUST UPDATE — Stage 3 須處理之 active spec @trace

`openspec/specs/` 下 **28 個 spec** 之 `<!-- @trace -->` 區段 `code:` 列表內含至少一條指向即將 archive 之 demo 路徑。處理規則：

- **逐 spec 處理**：把 `@trace ... code:` 列表內指向 `docs/challenge/<sqli-demo|php-demo|fastapi-demo>` 之條目刪除，**包含兩種路徑形態**：
  - `docs/challenge/<demo>/...` — 例如 `docs/challenge/sqli-demo/index.md`、`docs/challenge/sqli-demo/src/app.py`
  - `docs/challenge/<demo>.md` — 例如 `docs/challenge/sqli-demo.md`（舊 flat 結構之殘留路徑）
- **保留**：所有指向 `docs/challenge/door-is-open/`、`.vitepress/`、`scripts/`、`tests/`、`chall-wasm/` 等仍存在路徑之條目。
- **若刪除後該 spec 的 @trace `code:` 列表為空**：保留空區段（不刪整個 @trace 區段），維持 spec ↔ source 結構完整性，方便未來補上指向新 source 的條目。
- **不重命名、不調序、不更動 spec 規範文字**：本 stage 只清理 dead link。

**受影響 spec 與精確命中數**（以 `grep -cE 'docs/challenge/(sqli-demo|php-demo|fastapi-demo)[./]' openspec/specs/<name>/spec.md` 取得；**本表為 Stage 3 唯一權威清單，不得 mid-flight 重 grep 重算**）：

| Spec | 命中行數 |
|---|---:|
| `attack-session-tracking` | 3 |
| `challenge-author-scripts` | 36 |
| `challenge-browser-chrome` | 36 |
| `challenge-description-modal` | 36 |
| `challenge-design-tokens` | 18 |
| `challenge-file-structure` | 128 |
| `challenge-framework` | 12 |
| `challenge-layout` | 9 |
| `challenge-list` | 18 |
| `challenge-merged-nav` | 54 |
| `challenge-precommit-hook` | 8 |
| `challenge-runtime-init` | 6 |
| `challenge-rwd` | 18 |
| `challenge-scaffold` | 39 |
| `challenge-tools-control` | 36 |
| `challenge-ui` | 54 |
| `encrypted-virtual-fs` | 12 |
| `fastapi-challenge` | 10 |
| `homepage-content` | 21 |
| `network-traffic-panel` | 3 |
| `platform-documentation` | 12 |
| `python-asgi-runtime` | 12 |
| `requests-shim` | 36 |
| `user-virtual-fs` | 90 |
| `wasm-challenge-payload` | 16 |
| `wxl-creator-skill` | 21 |
| `wxlsh-commands` | 18 |
| `wxlsh-terminal` | 21 |
| **合計** | **803** |

共 28 specs / 803 命中行。AUDIT.md B.1 之「28 specs」與本表一致；先前 §A.2 草稿提及之「31」為早期 grep 不嚴謹之 over-count，已更正。**Stage 3 實作不得使用「31」**。

**驗收**（須同時滿足兩條）：

1. **Negative check**：`rg 'docs/challenge/(sqli-demo|php-demo|fastapi-demo)[./]' openspec/specs/` 為零比對（注意字元類 `[./]` 同時涵蓋 `/` 與 `.` 後綴形態，與 §B.4 之 sed 規則對齊）。
2. **Positive line-count check**：若採用 §B.4 Option A（Node 腳本），其執行結束之 stdout 末段必出現 `Total lines removed: 803 (expected 803)`；若採用 Option B（Edit tool 逐 spec），實作者須在執行前後分別跑 `git diff --stat openspec/specs/ | awk '{s+=$3}END{print s}'`（接近 803 即可，允許 ± few-line drift 因 spec 內部其他無關更新）；若採用 Option C（portable sed），執行前後跑 `wc -l openspec/specs/*/spec.md | tail -1` 比較差異必接近 803。**Negative + Positive 並列**，避免「部分清理 + 後續再次引入」之混合狀態掩蓋。

### A.3 SAFE TO LEAVE — Active spec 之 `fastapi-challenge` 條文

`openspec/specs/fastapi-challenge/spec.md` 之 spec 正文（非 @trace）若引用 `fastapi-demo` 作為示範路徑，**屬於規範文字而非 dead link**，本 stage 不更動；後續 Change 應另案決定是否把規範例子改為 door-is-open（door-is-open 本身就是 FastAPI 題目，可作為新範例）。

### A.4 MUST UPDATE — 文件 / 註解一致性

**先前草稿將本節列為「MAY UPDATE」屬錯誤分類**。為避免 Change 4（developer-docs-english）撞上殘留的 sqli-demo / php-demo / fastapi-demo 字串，所有 user-facing 文件與 in-tree comment 必須在 Stage 3.2 同步更新；本節已升級為 **MUST UPDATE**，由 Stage 3.2 統一負責。

| 檔 | 行 | 原文 | 改成 |
|---|---|---|---|
| `README.md` | 103 | `wasmModule: /challenge/sqli-demo/runtime.wasm  # 由 keygen 自動產生` | `wasmModule: /challenge/door-is-open/runtime.wasm  # 由 keygen 自動產生` |
| `.vitepress/theme/layouts/ChallengeLayout.vue` | 25 | `// Derive slug from per-folder relativePath: "challenge/sqli-demo/index.md" → "sqli-demo"` | `// Derive slug from per-folder relativePath: "challenge/door-is-open/index.md" → "door-is-open"` |
| `scripts/challenge-validate.ts` | 8 | ` *   pnpm challenge:validate fastapi-demo  # validate one challenge` | ` *   pnpm challenge:validate door-is-open  # validate one challenge` |
| `scripts/challenge-analyze.ts` | 8 | ` *   pnpm challenge:analyze fastapi-demo # analyze one challenge` | ` *   pnpm challenge:analyze door-is-open # analyze one challenge` |

**驗收**：`rg "sqli-demo|php-demo|fastapi-demo" README.md .vitepress/theme/layouts/ChallengeLayout.vue scripts/challenge-validate.ts scripts/challenge-analyze.ts` 必為零比對。

### A.5 LEAVE UNCHANGED — 測試 / 內部資料 / 歷史記錄

| 類別 | 檔案 | 為何不動 |
|---|---|---|
| **Rust 內部測試** | `chall-wasm/virtual-fs/src/payload.rs:207`、`flag_verify.rs:45/53/61` | `"sqli-demo"` 為 `#[cfg(test)]` 區塊內之 string fixture，不需 demo 目錄存在。改名只是美學成本，無功能改變。 |
| **e2e 測試** | `tests/e2e/flask-sqli.test.ts:11`、`tests/e2e/php-demo.test.ts:9` | `const SLUG = 'sqli-demo'` 為 routing label；測試內部用 inline mock Pyodide + inline app code，**不讀取磁碟上的 demo 目錄**。archive 後仍可通過。 |
| **Unit 測試** | `tests/unit/challenge/config.test.ts`、`tests/unit/scripts/challenge-keygen.test.ts`、`tests/challenge-lint-staged.test.ts`、`tests/unit/layouts/ChallengeLayout.test.ts`、`tests/unit/components/{ChallengeList,BrowserPanel}.test.ts`、`tests/unit/composables/{useAttackSession,usePentestNotes,useChallengePersistence}.test.ts` | slug 字串作為 test fixture 使用；無檔案系統依賴。 |
| **Spectra archive** | `openspec/changes/archive/**` | 歷史 change 紀錄。**禁止修改**，那是過去某個時點之事實。 |
| **本 Change 自身** | `openspec/changes/project-audit-and-cleanup/**` | 本 change 規範本身需引用三個 slug 才能說清楚要做什麼。 |
| **AUDIT.md / DELETION-PLAN.md / VERIFICATION.md** | 三份 durable reports | 報告本身需要列名才能完成稽核；屬合理引用。 |

**「不依賴實體 demo 目錄」之 e2e 驗證一行式**：

```bash
# 1. 確認 e2e 測試僅引用 demo slug 字串，不引用 docs/challenge 路徑
rg -l 'docs/challenge/(sqli-demo|php-demo|fastapi-demo)' /Users/phoenix/dev/edu-projects/wxl-template/tests/e2e/   # 應為零比對
# 2. 確認 e2e 測試無讀檔行為
rg -nE 'readFile|readFileSync|fs\.|loadFixture' /Users/phoenix/dev/edu-projects/wxl-template/tests/e2e/flask-sqli.test.ts /Users/phoenix/dev/edu-projects/wxl-template/tests/e2e/php-demo.test.ts   # 應為零比對
```

**驗收（負面）**：`rg "sqli-demo|php-demo|fastapi-demo" tests/ chall-wasm/ openspec/changes/archive/` 仍**會有**比對結果，這是預期的。不視為失敗。

---

## B. wxl-creator canonical reference 切換步驟對照表（Stage 3.2 逐條執行）

依 A.1 表格逐檔操作。**精確替換字串**（使用 Edit tool 的 old_string / new_string 對）：

### B.1 `.claude/skills/wxl-creator/SKILL.md`

**關鍵術語：替換文字中的 `door-is-open` 是**對該檔而言永久固定之 canonical reference 名稱**，不是某個 placeholder 或當下實作者要新建的 slug。實作者**不得**把它改為其他 slug。

**替換 1（line 109–110 block）**

`old_string`:
```
   b. **Read the existing sqli-demo as reference** for code style and structure:
      - `docs/challenge/sqli-demo/src/app.py`
```

`new_string`:
```
   b. **Read the canonical reference — the literal directory `docs/challenge/door-is-open/` (not the slug being created) — as the ONLY reference** for code style and structure. You SHALL NOT add additional reference paths to this list. <!-- SHALL NOT add backend-specific extra references; the single canonical reference applies to all backends -->
      - `docs/challenge/door-is-open/src/app.py`
```

**替換 2（line 259）**

`old_string`:
```
- You SHALL always read `sqli-demo/src/app.py` as a reference for code style before generating.
```

`new_string`:
```
- You SHALL always read `docs/challenge/door-is-open/src/app.py` as THE canonical reference for code style before generating. You SHALL NOT fall back to any archived demo under `.archive/`, nor to any other directory under `docs/challenge/`, nor to a user-supplied path, nor to any auto-discovered "next available demo". If the canonical reference is unreadable, halt the scaffold operation with a deterministic error containing the literal path `docs/challenge/door-is-open/`.
```

### B.2 `.agent/skills/wxl-creator/SKILL.md`

**與 B.1 同兩組替換**（檔案內容鏡像 `.claude/skills/wxl-creator/SKILL.md`）。

### B.3 `.agent/workflows/wxl-creator.md`

**與 B.1 同兩組替換**，行號各 +1 / +1 / +2（依先前 grep 為 111 / 112 / 261）。

### B.4 spec @trace 區段清理（A.2 所列 28 specs）

**禁止使用 sed `-i ''` 形式**：`-i ''` 為 BSD/macOS 專屬；GNU sed (Linux / CI 大多數環境) 會把 `''` 當成 input 檔名導致**檔案損毀**。改用以下任一 portable 方案：

**方案 1（推薦）：Node.js 一次性腳本**

**前置需求**：Node ≥ 22（`fs.globSync` 於 Node 22 stable）。本 repo 之執行環境為 Node 24（見 AUDIT.md），符合。腳本內含執行期防呆斷言；於 Node ≤ 21 環境啟動會立即 throw 並中止，**不會靜默失敗**。

於 Stage 3.2 啟動前建立 `scripts/scrub-archive-traces.mjs`（執行完可選擇 `git clean -f scripts/scrub-archive-traces.mjs` 移除），程式碼骨架：

```javascript
// requires Node >= 22; this repo targets Node 24 per AUDIT.md
import { readFileSync, writeFileSync, globSync } from 'node:fs'

if (typeof globSync !== 'function') {
  throw new Error('Node 22+ required (fs.globSync not available). Got: ' + process.version)
}

const PATTERN = /^\s*-\s+docs\/challenge\/(sqli-demo|php-demo|fastapi-demo)[./].*$/
const EXPECTED_TOTAL_REMOVED = 803   // 來自 DELETION-PLAN.md §A.2 hit-count 表合計

const files = globSync('openspec/specs/*/spec.md')
let totalRemoved = 0

for (const f of files) {
  const original = readFileSync(f, 'utf8')
  const cleaned = original.split('\n').filter(line => !PATTERN.test(line)).join('\n')
  if (cleaned !== original) {
    writeFileSync(f, cleaned)
    const removed = original.split('\n').length - cleaned.split('\n').length
    totalRemoved += removed
    console.log(`${f}: removed ${removed} lines`)
  }
}

console.log(`\nTotal lines removed: ${totalRemoved} (expected ${EXPECTED_TOTAL_REMOVED})`)
if (totalRemoved !== EXPECTED_TOTAL_REMOVED) {
  console.error(`FAIL: total mismatch — expected ${EXPECTED_TOTAL_REMOVED}, got ${totalRemoved}`)
  process.exit(1)
}
```

執行：`node scripts/scrub-archive-traces.mjs`。**驗收**：腳本 exit 0 且 stdout 結尾出現 `Total lines removed: 803 (expected 803)`。Node API 跨平台一致，無 BSD/GNU sed 差異。

**方案 2：以 Edit tool 逐 spec 手動處理**

對 A.2 表內每個 spec，先 `Read` 該 spec.md，識別所有 `^\s*-\s+docs/challenge/(sqli-demo|php-demo|fastapi-demo)[./]` 行，再以 Edit tool 逐行刪除。實作成本高但可逐檔 review。

**方案 3（最後手段）：portable sed**

若必須用 sed，採用如下 portable 形式（在 macOS 與 Linux 皆運作），並以 `set -euo pipefail` + post-loop assertion 確保失敗不被掩蓋：

```bash
set -euo pipefail   # 任一指令失敗立即中止；未綁定變數視為錯誤

# 注意：使用 -i.bak 而非 -i ''；後者僅 BSD 接受
rg -l 'docs/challenge/(sqli-demo|php-demo|fastapi-demo)[./]' openspec/specs/ \
  | while read -r f; do
      sed -i.bak -E '/^[[:space:]]*-[[:space:]]+docs\/challenge\/(sqli-demo|php-demo|fastapi-demo)[./].*$/d' "$f"
      rm -f "${f}.bak"   # set -e 保證 sed 失敗時不會走到這行；rm 自身失敗也會中止
    done

# Post-loop assertion：不得有任何 .bak 殘留（代表 sed 中途失敗）
remaining_bak=$(find openspec/specs -name '*.bak' | head -1)
if [ -n "$remaining_bak" ]; then
  echo "FAIL: stray .bak file found: $remaining_bak — sed may have failed mid-loop" >&2
  exit 1
fi
```

關鍵差異：使用 `-i.bak` 加 `.bak` 後綴（兩個平台都接受），完成後 `rm` 清理；使用 `[[:space:]]` POSIX 字元類取代 `\s`（後者非全平台 sed 支援）；使用 `[./]` 同時覆蓋 `/` 與 `.` 後綴形態（涵蓋 `docs/challenge/php-demo/...` 與 `docs/challenge/php-demo.md` 兩種樣式）；`set -euo pipefail` + 殘留 `.bak` 檢查防止失敗被掩蓋。

**驗收**：操作後立即執行

```bash
rg 'docs/challenge/(sqli-demo|php-demo|fastapi-demo)[./]' openspec/specs/
```

必為零比對。**注意**：先前草稿的 verification regex 用 `(...)/`（只覆蓋 `/` 後綴），會漏抓 `docs/challenge/<demo>.md` 形態，給出 false green。本檔已更正為 `[./]`。

---

## C. Stage 3 完成後之 Invariants（Stage 4 必驗）

執行完 Stage 3 全部 task 後，下列條件必須同時成立：

1. **目錄結構**
   - `ls docs/challenge/` 僅輸出 `door-is-open`
   - `ls .archive/challenge/` 輸出 `fastapi-demo`、`php-demo`、`sqli-demo`（依字母序）
2. **無 archive-path dead link**（**注意 regex 必須含 `[./]` 字元類同時覆蓋 `/` 與 `.` 後綴形態，否則漏抓**）
   - `rg 'docs/challenge/(sqli-demo|php-demo|fastapi-demo)[./]' openspec/specs/` 為零比對
   - `rg "sqli-demo" .claude/skills/wxl-creator/ .agent/skills/wxl-creator/ .agent/workflows/wxl-creator.md .wxl-creator/` 為零比對
   - `rg "sqli-demo|php-demo|fastapi-demo" README.md .vitepress/theme/layouts/ChallengeLayout.vue scripts/challenge-validate.ts scripts/challenge-analyze.ts` 為零比對
3. **canonical reference 正確指向**
   - `rg "door-is-open" .claude/skills/wxl-creator/SKILL.md` 至少含 3 個比對（對應原本的 3 個 sqli-demo 出現位置）
   - `.agent/skills/wxl-creator/SKILL.md` 同上
   - `.agent/workflows/wxl-creator.md` 同上
4. **Build pipeline 仍綠**
   - `pnpm install && pnpm wasm:build && pnpm challenge:keygen && pnpm docs:build` 全部 exit 0
   - `cargo test --workspace` 全部 exit 0
   - `pnpm test --run` 僅剩 AUDIT.md A.3 所列 5 個 CodeEditorPanel.test.ts 失敗，不得新增其他失敗
5. **`.archive/` 不會被 bundle**（**注意：先 build 為強制步驟，不是建議**）
   - **Step a**：執行 `[ -d .vitepress/dist ] && rm -rf .vitepress/dist; pnpm docs:build` 強制 fresh build
   - **Step b**：`grep -rF '.archive/' .vitepress/dist/` 為零比對
   - **Step c**（防 base64/split 編碼掩蔽）：`rg -F 'sqli-demo' .vitepress/dist/`、`rg -F 'php-demo' .vitepress/dist/`、`rg -F 'fastapi-demo' .vitepress/dist/` 三者皆為零比對。若任一非零代表 archived demo 內容仍以原始 slug 形式進入 bundle
6. **Git 狀態正確**
   - `git status --porcelain` 必有 ≥ 3 個 `R` 開頭條目（三組 rename）
7. **wxl-creator skill 仍可運作**
   - Stage 4 dry-run：以 `/wxl-creator` 建立 throwaway slug 並驗證流程通過 `pnpm challenge:analyze` 與 `pnpm challenge:validate`。
   - **throwaway slug 命名規則（強制）**：必須符合 `^wxl-dryrun-[a-z0-9]{6}$` 格式（例如 `wxl-dryrun-a1b2c3`），以避免與保留 slug 衝突。**禁止使用** `sqli-demo`、`php-demo`、`fastapi-demo`（被 archive 的名稱）、`door-is-open`（canonical reference）、`test`、`demo`、`example` 等通用字。
   - dry-run 結束時 `git clean -fd docs/challenge/wxl-dryrun-*` 移除 throwaway，工作樹必須回到乾淨狀態。
   - **負驗證**：dry-run 過程中 skill **不得** 讀取任何 `.archive/` 路徑下檔案（可由 strace 或人工 review skill 輸出 log 驗證）。

---

## D. 風險與緩解

| 風險 | 緩解 |
|---|---|
| `.gitignore` 未來新增條目把 `.archive/` 排除 | tasks.md 3.1 之 shell block 已加入 `.gitignore` 守門 |
| 自動化 trace 清理腳本誤刪非 @trace 之合法行 | §B.4 Option A（Node.js）使用 line-by-line filter 並印出 `removed N` per file，與 §A.2 表內各 spec 的命中數比對；異常時立刻 `git restore` 回滾並改採 Option B（Edit tool 逐 spec） |
| Node.js scrub 腳本（§B.4 Option A）對 Node ≤ 21 環境失效 | §B.4 已要求腳本 top 加 `if (typeof globSync !== 'function') throw new Error('Node 22+ required')`；本 repo 之執行環境為 Node 24（見 AUDIT.md），符合 |
| README.md / ChallengeLayout.vue / challenge-{validate,analyze}.ts 未一併更新，未來 Change 4 撞上殘留 sqli-demo / fastapi-demo 字串 | **A.4 已升級為 MUST UPDATE**，由 Stage 3.2 統一負責；A.4 含逐檔 old/new 替換對照表 |
| keygen 在 Stage 3 / Stage 4 重跑時，會把 `docs/challenge/door-is-open/index.md` 之 `tools:` 陣列重新排版（AUDIT.md A.4 已記錄） | 已知行為；Stage 3 / 4 commit diff 可能包含此微小變動，視為 pipeline 副作用 |
| 28 specs / 803 命中行之最終驗收若僅依賴 `rg ... [./]` 為零比對，可能掩蓋「部分檔案被部分清理 + 某些檔案被 re-introduce」的混合狀態 | §C invariant 2 之 `rg` 驗證為 negative check；額外加 positive check：Stage 3.2 跑 Option A 後 sum 印出之 `removed N` 必須恰等於 803（見 §C.2 末段） |

---

## E. Stage 3 執行順序總結

1. Stage 3.1 — `git mv` 三個 demo 至 `.archive/challenge/`（已於 tasks.md 收斂為原子化 shell block）
2. Stage 3.2 — 套用 B.1–B.3 之 6 組替換 + B.4 之 spec @trace 清理 + A.4 之 4 檔順手更新
3. Stage 3.3 — `/spectra-audit` gating（Critical=0、High=0）
4. Stage 3.4 — commit（emoji `🗑️ refactor:`）
