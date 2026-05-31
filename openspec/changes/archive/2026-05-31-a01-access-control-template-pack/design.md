## Context

`/spectra-discuss` 在 `generic-discovering-sunbeam` plan 中把「更豐富的 authoring skill」方向拆成 R1–R12 共 12 個 change，R8 是 phase-3「題型擴充」的首發。R1 已在 2026-05-31 merged（PR #28），確立「跨 agent skill canonical source + thin pointers + 禁字檢查 + starter template」標準。

當前 `wxl-creator` skill 把 `vuln` 當 free-text 自由字串、僅以 `docs/challenge/door-is-open/`（FastAPI、IDOR）作為唯一 canonical reference，缺乏：

- 對特定 OWASP 類型（A01 / A03 / A05 …）的辨識與分支
- 多 backend（Flask / PHP）的 production reference（既有 Flask `sqli-demo` 與 PHP `php-demo` 都僅存於 `.archive/challenge/`）
- 修復迴圈的類型特定建議（IDOR、JWT alg=none、Path traversal 各有經典修補模式，目前需依賴 LLM 即興判斷）

R8 不是單純為了「再加一題」，而是為 R6（A05）/ R7（A03）等後續 pack 立下可複用契約：**一個 OWASP 題型 = 一個 capability + 一個 `reference/<capability>.md` + 一組 cover 全部 `challenge-runtimes` runtime 的 reference challenge**。

## Goals / Non-Goals

**Goals:**

- 讓 wxl-creator 在 `vuln` 命中 A01 trigger regex 時自動 dispatch 到 A01 reference 文件，code-gen 前先讀
- 在 wxl-creator-skill 加 1 條**通用** Requirement（不寫死 A01），使 R9–R12 之後新增 pack 只需在 registry table 加 row、不需再改 wxl-creator-skill spec
- 提供 IDOR / JWT bypass / Path traversal 共 3 個 reference challenge，分別 cover FastAPI / Flask / PHP（dogfood 多 backend、為 R6/R7 立範例）
- 把修復迴圈擴成「失敗 challenge tags 與 A01 taxonomy 相交時，諮詢 A01 修復建議」
- 為 Flask 與 PHP 建立 first production A01 reference

**Non-Goals:**

- 不為其他 OWASP 類型（A02–A10）出題（屬於後續 R6/R7 等獨立 change）
- 不對 challenge frontmatter schema 加 `owasp:` 或 `owasp_subtype:` 欄位（沿用 free-text `tags`、未來若 R6/R7 都用同樣模式，再於獨立 cross-cutting change 抽欄位）
- 不擴 `challenge-runtimes`（Django 屬 R2、static 屬 R3、web-server-emulation 屬 R4）
- 不對既有 `door-is-open` 程式碼或 frontmatter 做任何修改
- 不把 `.archive/challenge/sqli-demo`、`.archive/challenge/php-demo` 復活為 production（它們是 A03/A05 的素材，與 R8 無關）
- 不引入「題型分類」的程式碼 enum / 註冊機制（wxl-creator 仍以 `vuln` 自由字串 + trigger regex 為唯一判別）

## Decisions

### 新增 capability 而非僅 MODIFY 既有 capability

選用「新 capability + MODIFIED wxl-creator-skill」的雙軌組合，而非只把 A01 內容塞進 `wxl-creator-skill` 既有 capability。理由：

- A01 pack 的契約（必須 cover 全部 runtime、必須有 reference 文件三節結構、tag taxonomy）需要獨立 spec 載體，否則 wxl-creator-skill spec 會被未來 12 個 OWASP 類型 + 4 個驗題擴充塞爆
- 獨立 capability 給 R6/R7（A05/A03 pack）一個 copy-and-replace 形狀，與 R1 給 R8 立的 starter-template 角色一致
- 取代方案：把 A01 內容變成 wxl-creator-skill 的 7 條新 Requirement — rejected：未來每加一個 pack 都會把 wxl-creator-skill spec 翻一遍，diff review 與 archive @trace 都會痛

### wxl-creator-skill 用「通用 registry table」延伸點，而非「A01-specific Requirement」

新增的 MODIFIED Requirement 規範「skill SHALL consume capability-specific reference documents from `reference/` via a trigger regex registry table」，**完全不提 A01**。理由：

- R9–R12（A02 / A04 / A06 / A07 etc. pack）之後加 row 即可，不需要每加一個 pack 都修 wxl-creator-skill spec
- registry table 本身在 SKILL.md 維護（檔案內容），不是 spec 條文 — 可以零成本延伸
- 取代方案：「Requirement: wxl-creator SHALL dispatch to A01 reference when vuln matches /idor|jwt|.../」— rejected：硬編碼 A01 等於 R6/R7 都要改 wxl-creator-skill spec

### A01 guidance 落點：wxl-creator 子文件，不開新 skill

`.agent/skills/wxl-creator/reference/a01-access-control.md` 而非 `.agent/skills/a01-pack/SKILL.md`。理由：

- A01 pack 是 wxl-creator 在「出題流程」中參照的 **內容**，不是獨立的跨 agent workflow
- 開新 skill 需要 SKILL.md + AGENTS.md + INSTALL.md + 三份 thin pointer（R1 規範），但 a01-pack 沒有自己的 workflow step，這些檔案會全部是空殼或重複 wxl-creator 內容
- `reference/` 子目錄 pattern 已存在（`agent-tools.md`、`runtime-cli.md`），host-agent-neutral
- 取代方案：開 `.agent/skills/a01-pack/` 獨立 skill — rejected：違反 R1「一 skill = 一 workflow」精神，徒增 thin pointer 與安裝指南維護負擔

### 三題各擔一個 runtime（FastAPI / Flask / PHP）

- IDOR = `door-is-open` (FastAPI、easy、既有不動)
- JWT alg=none = `jwt-none-alg` (Flask + pyjwt、medium、新增)
- Path traversal = `confidential-files` (PHP LFI、easy、新增)

理由（使用者 2026-05-31 propose 階段明確要求）：

- pack 本來就要展示「wxl-creator 能在所有 runtime 下出該類型題」，全用同一 backend 等於只 dogfood 1/N 能力
- 不同 backend 的 A01 慣用語境不同（PHP LFI / Python web JWT / Flask vs FastAPI auth pattern 差異）對讀者更具教學價值
- R8 同時為 Flask 與 PHP 建立 first production A01 reference（之前都只有 archived demo）
- 取代方案：全 FastAPI 與 door-is-open 一致 — rejected：dogfood 程度低、無法為 R6/R7 立 multi-backend 範例

### A01 primitive 選擇：alg=none / classic `../`

- **JWT primitive 選 alg=none**（不選 weak HMAC / kid path traversal / missing verification）：alg=none 是教學最直接的 primitive，瀏覽器內偽造 token 零工具依賴；weak HMAC 需要 offline brute-force（不適合 WASM 環境）；kid traversal 把兩個 vuln 糾纏在一起、混淆 A01-only 意圖
- **Path traversal primitive 選 classic `../`**（不選 null byte / URL encoding / symlink）：Python 3.5+ 忽略 null byte（不可靠）、wxl service worker 會 decode URL（encoding round-trip 對 runtime 不可見、教學意圖落空）、symlink 需可寫 FS prep（WASM 不支援）

### A01 tag taxonomy：free-text `tags` + 取交集判斷

A01 challenge SHALL 至少含 `{idor, access-control, jwt, path-traversal, broken-access}` 中一個 tag；wxl-creator 修復迴圈以「失敗 challenge tags ∩ A01 taxonomy ≠ ∅」判斷是否諮詢 A01 修復建議。

理由：不動 frontmatter schema、不需要 ADDED `owasp:` 欄位（如 propose 階段所決定，沿用 free-text 慣例）。`door-is-open` 既有 `tags: [idor, access-control, fastapi, sqlite]` 自然滿足，零修改。

## Implementation Contract

### 觀察行為（apply 完成後）

1. **wxl-creator dispatch heuristic**：以 fresh session 起 wxl-creator skill、給 `vuln: IDOR`（或 `JWT bypass` / `path traversal` / `Broken Access Control` / `access control bypass`），skill 在 Step 3.0 讀取 `.agent/skills/wxl-creator/reference/a01-access-control.md`（在讀 canonical door-is-open 之前）；給 `vuln: reflected XSS` 則不讀。
2. **修復迴圈 A01 hint**：對 `door-is-open` / `jwt-none-alg` / `confidential-files` 任一題故意打壞、跑 `pnpm challenge:verify` 失敗、進入修復迴圈，skill 在 propose-fixes 階段先讀 A01 reference「Per-primitive fix hints」節再提建議。
3. **三題皆 verify 綠**：`pnpm challenge:verify door-is-open` / `jwt-none-alg` / `confidential-files` 三者 exit 0（L1+L2+L3 全通過）。

### Reference 文件契約（`.agent/skills/wxl-creator/reference/a01-access-control.md`）

至少含三節（`##` heading）：

- **Recognition heuristics**：含 trigger regex（與 SKILL.md registry table 同步）、典型指紋（`?id=`、JWT `alg` header、URL `..`）
- **Per-primitive fix hints**：至少含 IDOR / JWT alg=none / Path traversal / 通用 4 個小節（`###`），每節給「壞掉的程式碼樣本 + 修補後樣本」
- **Reference challenges table**：列出 3 個 slug、primitive、backend、difficulty

不可字面列禁字 primitive（`AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate`）；如需 prose 引用、用 `<FORBIDDEN-PATTERN>` placeholder。

### wxl-creator SKILL.md / SKILL.zhTW.md 變更契約

雙語對等同步：

- 在 Workflow Step 3「Generate vulnerable application code」前插入 **step 3.0**，prose 描述「依 `vuln` 內容查 registry table、若命中則讀對應 `reference/<capability>.md`」
- 新增 registry table（Markdown table），欄位：trigger regex / reference file。本 change 落地時 table 內含 1 row：`/idor|jwt|path.?traversal|access.?control|broken.?access/i` → `reference/a01-access-control.md`
- Step 8.c「Propose fixes」append 一段 prose：「若失敗 challenge 的 `tags` 與已知 capability 的 taxonomy 相交，諮詢對應 `reference/<capability>.md` 的『Per-primitive fix hints』節再提修補」

### 新 reference challenge 程式碼契約

**`docs/challenge/jwt-none-alg/`（Flask）**

- `src/app.py`：Flask app、`POST /login` 簽發 HS256 JWT、`GET /admin` 用 `jwt.decode(token, key, algorithms=['HS256', 'none'])` 接受 alg=none
- `src/flag.txt`：FLAG{...} 字串
- `index.md` frontmatter：`backend: flask`、`difficulty: medium`、`packages: [pyjwt]`、`tags: [jwt, access-control, authentication, flask]`
- Exploit：偽造 `{"alg":"none"}` header + `{"role":"admin"}` payload + 空 signature 的 token，GET /admin 拿 flag

**`docs/challenge/confidential-files/`（PHP）**

- `src/index.php`：PHP app、列出 `reports/` 內公開檔案、`view.php?file=<name>` 用 `file_get_contents("reports/" . $_GET['file'])` 無 canonicalize
- `src/flag.txt`：FLAG{...} 字串
- `index.md` frontmatter：`backend: php`、`difficulty: easy`、`packages: []`、`tags: [path-traversal, access-control, lfi, php]`
- Exploit：`view.php?file=../flag.txt` 拿 flag

**`docs/challenge/door-is-open/`**：完全不動。

### 失敗模式與接受標準

- `pnpm challenge:verify jwt-none-alg` exit 0（pyjwt 在 Pyodide 經 micropip 載入；apply 階段需驗 cold start 不掉）
- `pnpm challenge:verify confidential-files` exit 0
- `pnpm challenge:verify door-is-open` 仍 exit 0（regression check）
- `spectra validate a01-access-control-template-pack` exit 0
- `spectra validate wxl-creator-skill`（MODIFIED delta 套用後）exit 0
- `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/wxl-creator/` exit 1（0 命中）

### 範圍邊界（避免 apply 漂移）

**In scope**：上述觀察行為 1–3、3 個檔案契約、wxl-creator skill 雙語編輯、reference 文件、2 個 Playwright spec、新 capability spec、wxl-creator-skill MODIFIED delta（單一 Requirement）。

**Out of scope**：
- 任何對 `challenge-runtimes` capability 的修改
- 任何對既有 challenge（door-is-open / 其他）的修改
- 任何對 challenge frontmatter schema 的 ADD 欄位
- 任何對 R6（A05）/R7（A03）內容的預埋
- 任何對 wxl-creator-skill 其他 13 條 Requirement 的修改
- 復活 `.archive/challenge/sqli-demo` 或 `.archive/challenge/php-demo`

## Risks / Trade-offs

- **[pyjwt 在 Pyodide cold start 失敗] → Mitigation**：apply 階段先以 `pnpm docs:dev` 手動觸發一次 jwt-none-alg 載入，確認 micropip 能拉 pyjwt wheel；若不行則改 backend = fastapi 並把 jwt-none-alg 標為 multi-backend pending（最壞情況：A01 pack 暫缺 Flask coverage、留 follow-up change 解）
- **[Flask / PHP 沒 production reference，新題程式碼風格可能漂離 wxl-creator 期望] → Mitigation**：tasks 內明確要求 mirror `.archive/challenge/sqli-demo/`（Flask）與 `.archive/challenge/php-demo/`（PHP）的路由 / 設定 / 回應結構，僅換 vulnerability
- **[catch-22：reference/a01-access-control.md 字面列禁字 primitive] → Mitigation**：tasks 含 `git grep` verification step；如需 prose 引用禁字、用 `<FORBIDDEN-PATTERN>` placeholder
- **[archive Purpose TBD] → Mitigation**：tasks 加 archive 後手動補 Purpose 步驟（R1 / P3.1 已記錄此踩坑）
- **[archive 吃掉 wxl-creator-skill 新 Requirement 的 @trace] → Mitigation**：tasks 加 archive 後驗證新 Requirement 仍有 @trace、缺則手動補（與 `feedback_spectra_archive_header_rename` 一致）
- **[registry table 在 R9–R12 累加後變難讀] → Trade-off**：接受；目前只有 1 row，未來若 ≥5 row 可考慮拆 `reference/index.md`，留作 follow-up

## Open Questions

無；range / primitive / backend / slug 命名與 difficulty 皆在 propose plan 階段確認。
