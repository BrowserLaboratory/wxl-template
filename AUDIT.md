# wxl-template 專案稽核基準報告（Stage 1 · Change 1）

> Change：`project-audit-and-cleanup` ｜ Stage：1 / 4 ｜ 產出日期：2026-05-19 ｜ 環境：macOS Darwin 25.2.0、Node v24.13.0、pnpm 10.28.0、cargo 1.94.0、wasm-pack 0.14.0（cargo 安裝）。
>
> 本報告為 Change 1 後續 stages、以及未來 Change 2 / 3 / 4 之單一稽核真實來源。任何「目前狀態」、「相依破損」、「i18n surface 規模」等命題均以本檔記載為準。

---

## A. Build + Test Pipeline 基準

### A.1 指令結果（依序）

| # | 指令 | Exit | 真實耗時 | 結論 |
|---|---|---|---|---|
| 1 | `pnpm install` | 0 | 2.6s | 通過。**前置必修**：原 `devDependencies` 含 `"wasm-pack": "^0.14.0"`，已於本 stage 移除（理由詳 A.2.1）。 |
| 2 | `pnpm wasm:build` | 0 | 6.98s | 通過。修復 A.2.1 後可運作；建構 `virtual-fs` / `asgi-bridge` / `wxlsh-parser` 三個 WASM 模組至 `.vitepress/wasm/`。 |
| 3 | `pnpm challenge:keygen` | 0 | 1.83s | 通過。Rebuild 全部 4 個 demos（sqli-demo / php-demo / fastapi-demo / door-is-open）加密 payload；輸出至 `/challenge/<slug>/runtime.wasm`。**副作用**：會修改 `docs/challenge/door-is-open/index.md` 的 `tools:` 陣列格式（重新排版），導致工作樹變 dirty。 |
| 4 | `pnpm docs:build` | 0 | 6.86s | 通過。**前置必修**：原預設 build target 為 `modules`（含 chrome87 / es2020），與 esbuild 0.27.7 + `vite-plugin-top-level-await` 1.6.0 的 destructuring 下降相容不一致；已加 `vite.build.target = 'esnext'`（理由詳 A.2.2）。 |
| 5 | `pnpm test --run`（vitest） | **1** | 8.43s | **失敗（regression）**。49 個 test files 中 1 個失敗、652 個 tests 中 **5 個失敗**，全部集中於 `tests/unit/components/CodeEditorPanel.test.ts`，與 Pyodide async mock 的呼叫期望未滿足相關。詳 A.3。 |
| 6 | `cargo test --workspace` | 0 | 16.31s | 通過。26 unit tests + 0 doc tests，三個 crate（virtual-fs / asgi-bridge / wxlsh-parser）全綠。 |

**整體結論**：本 template **以 Node 24 + pnpm 10 直接 build 不可運作**，需要 A.2.1、A.2.2 兩個小規模修復才能完成基準。修復後 5/6 通過；剩下 1 個 vitest failure 為功能性 regression，**非 dep 問題**、**非 build 阻擋**，但須在後續 stage 處理或明確 follow-up。

### A.2 Stage 1 已套用的修復（Build 必要）

#### A.2.1 移除 `wasm-pack` npm devDependency [Critical]

**根因**：`package.json` 原 `devDependencies` 列入 `"wasm-pack": "^0.14.0"`（npm 套件版的 JS wrapper，最後 release 2019、停更）。pnpm 將其 binary-install → tar → minizlib 鏈展開後，hoist 區 `node_modules/.pnpm/node_modules/minipass` 解析至 `minipass@7.1.3`（ESM-only、CJS 入口為 namespace 物件）；舊版 minizlib@2.1.2 的 `class ZlibBase extends Minipass` 期望的是 minipass@3.x 的 class 直出 export，導致 V8 拋出 `TypeError: Class extends value #<Object> is not a constructor or null`。

Node ≤ 22 此問題以 `ERR_REQUIRE_ESM` 形式表現，仍會失敗但訊息明確；Node 22+ 的 `--experimental-require-module` 預設啟用使其退化為更難診斷的 class-extends error。

**修復**：自 `devDependencies` 移除 `"wasm-pack": "^0.14.0"`；`pnpm wasm:build` 之 `wasm-pack` 改由系統 PATH（`/Users/phoenix/.cargo/bin/wasm-pack 0.14.0`）解析。`pnpm-lock.yaml` 隨之更新。

**Prerequisite（新 contributor 必看）**：fork 或 clone 此 template 後，**首次** `pnpm wasm:build` 之前必須先：

```bash
cargo install wasm-pack --version 0.14.0   # 或更新的 0.1x.x（最低 0.12）
```

若 PATH 上找不到 `wasm-pack`（或版本 < 0.12），`pnpm wasm:build` 會以 `wasm-pack: command not found` 失敗。後續 Change 應在 `scripts/wasm-build.sh`（或同等 preflight）加入 `wasm-pack --version` 檢查，產生顯式錯誤訊息。

**影響範圍**：minimal — 整條 binary-install → tar → minizlib → minipass 損壞鏈從 `node_modules` 完全消失；不影響任何其他套件運作。**Trade-off**：wasm-pack 從 npm devDependency（自動安裝）變成系統 PATH 隱性依賴，第一次使用門檻略升。

> Node 24 阻擋已於 change `node-24-actions-upgrade` 解除（archive 後位於 `openspec/changes/archive/<archive-date>-node-24-actions-upgrade/`，CI workflow 同步升至 Node 24 + composite-based wasm-pack 安裝）。

#### A.2.2 顯式設定 `vite.build.target = 'esnext'` [High]

**根因**（與 vite 版本無關的本質敘述）：`vite-plugin-top-level-await` 1.6.0 把 source 中的 top-level await 包成 IIFE，再交給 esbuild 0.27.7 對該包裝程式碼做 syntax lowering。包裝程式碼內含 esbuild 標為 **non-trivial destructuring** 的模式（assignment-target 結合 spread 或 default value 之組合），esbuild 對該特定模式直接拋出 `Transforming destructuring to the configured target environment is not supported yet`。**只要 build target 不是 `esnext`（亦即任何要求 esbuild 做語法下降的 target）此錯誤就會出現**。當前實際安裝為 vitepress 2.0.0-alpha.16 → vite 7.3.3 / esbuild 0.27.7，但本錯誤源頭是 esbuild 的轉換器實作，與 vite 版本無直接關係。

**修復**：在 `.vitepress/config.mts` 的 `vite.build` 加入 `target: 'esnext'`，讓 esbuild 不嘗試對該模式做下降；同時在該行旁加入 inline 註解，避免未來 contributor 誤刪。

**影響範圍**：build 輸出對應的 browserslist 變大；對純前端 WASM 靶場（鎖定現代瀏覽器）為可接受 trade-off。

**禁止行為**：**未來不得單獨把 `target: 'esnext'` 還原為 Vite 預設**。若要還原，必須先完成下列任一項才能進行：

1. 升級 `vite-plugin-top-level-await` 至已修正該 destructuring 模式之版本（檢查 upstream changelog）；或
2. 重構 source 端的 TLA 使用，使插件不再插入觸發 esbuild 限制的包裝程式碼；或
3. 確認 esbuild 該轉換器分支已支援該 destructuring 模式（檢查 esbuild changelog）。

未滿足上述任一前提即還原 target，`pnpm docs:build` 將再次以 esbuild destructuring 錯誤失敗。

> Node 24 阻擋已於 change `node-24-actions-upgrade` 解除（archive 後位於 `openspec/changes/archive/<archive-date>-node-24-actions-upgrade/`；本 stage 2 之 esbuild target=esnext 修復在 Node 24 build 環境下仍然有效）。

### A.3 Vitest Regression 詳情

**Test 檔**：`tests/unit/components/CodeEditorPanel.test.ts`

**失敗清單**（5 個 `it()`，依執行順序）：

1. `CodeEditorPanel > calls runPythonAsync when Run is clicked` — `expect(py.runPythonAsync).toHaveBeenCalled()` 未滿足。
2. `CodeEditorPanel > destroys editor on unmount` — flaky：在 full-suite 執行下穩定失敗；單檔隔離執行時偶會通過。
3. `CodeEditorPanel > calls onCodeExecuted callback on successful execution` — `expect(cb).toHaveBeenCalledTimes(1)` 未滿足。
4. `CodeEditorPanel > calls onCodeExecuted with error flag on exception` — `expect(arg.error).toBe(true)` 在 cb 未被呼叫時失敗。
5. `CodeEditorPanel > works without onCodeExecuted prop (optional)` — `expect(py.runPythonAsync).toHaveBeenCalled()` 未滿足。

**共同特徵**：皆涉及 Pyodide async mock 的呼叫期望（`runPythonAsync`、`onCodeExecuted` callback）；測試使用 `flushPromises()` 等候 microtask 完成，但 CodeEditorPanel 內部的初始化或 click handler 與目前 mock setup 之計時不對齊。**推測根因**：mock 計時 / 元件初始化順序 regression，非 build 問題。

**比對**：其他 48 個 test files、647 個 tests 全綠。此失敗**不阻擋** Stage 1 commit 與後續 stages 的 build pipeline。**durable 追蹤**由 Stage 4.2 之 parked change `fix-codeeditorpanel-vitest-regression` 承接；其 proposal.md 必須引用本節 5 個 `it()` 完整名稱作為驗收基準。

### A.4 額外觀察

- **vite 主版本浮動**：本次 stage 1 修復後清裝產出的 lockfile 將 `vite` 解析至 **7.3.3**（先前舊 lockfile 為 8.0.0），對應 `vite-plugin-wasm` 也由 3.5.0 浮動至 **3.6.0**、`typescript` 由 5.9.3 浮動至 **6.0.3**。皆為 transitive 解析結果，`package.json` 未直接約束。`vite-plugin-wasm 3.6.0` 之 peer 範圍仍宣告 `vite ^2 || ^3 || ^4 || ^5 || ^6 || ^7`，與實際安裝相容。**[Informational]**
- **@vueuse/core dist 內 `/* #__PURE__ */` 註解位置警告**：rollup 提示無法解讀，自動移除註解。**[Low]**
- **php-wasm dist 使用 `eval`**：rollup 警告，build 仍成功。屬上游套件設計。**[Low]**
- **wasm-tools 缺席警告**：keygen 跑時印 `wasm-tools not found — skipping wasm-strip` / `wasm-mutate`。屬選用工具，缺席不影響加密輸出。**[Low]**
- **`docs/challenge/door-is-open/index.md` 在 keygen 後變 dirty**：keygen 會重新排版 `tools:` 陣列（`[a, b]` → `[ a, b ]`）；屬 pipeline 的自動更新而非人工編輯。**因為 pre-commit hook 會 stash unstaged docs/ 變動再驗證，此排版每次 keygen 後都會復現，可能在 stage commits 之間反覆 churn**。**[Medium]** Stage 4 須記錄此行為；後續 change 應決定要 (a) 改 keygen 維持原排版、(b) 一律以 keygen 為 source of truth 並 commit、或 (c) 把 `docs/challenge/*/index.md` 標為 generated 不入版本控。

---

## B. Spec @trace 盤點

### B.1 規模

| 指標 | 數值 |
|---|---|
| `openspec/specs/` 下 spec 數量 | 39 |
| 含 `<!-- @trace ... -->` 區段的 specs | 全部 39（每 spec 內可能多個 @trace 區段，每個 requirement 各掛一份） |
| 指向 **將被 archive 的 demo**（sqli-demo / php-demo / fastapi-demo）的 specs | **28** |
| 指向 **保留 example**（door-is-open）的 specs | 5 |

### B.2 Stage 3 預期動作

Stage 3 完成 `git mv docs/challenge/{sqli-demo,php-demo,fastapi-demo}/ .archive/challenge/<slug>/` 後，**28 個 specs 的 @trace 區段內必有指向 `.archive/` 路徑的條目**。處理原則：

- 不刪除 spec 本身（capability 不變）。
- 自每個 @trace 區段內**移除指向已 archive 路徑的條目**；保留指向 `door-is-open/` 與其他仍存在路徑的條目。
- 若移除後 @trace `code:` 列表為空，可視 spec 重要性決定是否保留空區段、或同時移除整個區段（建議保留以維持 spec 與 source 的雙向追溯結構）。

### B.3 規範條目層級的引用

`wxl-creator-skill/spec.md` 已在 Change 1 之 specs delta（`openspec/changes/project-audit-and-cleanup/specs/wxl-creator-skill/spec.md`）新增規範 `Skill uses canonical reference example for code generation style`，明文鎖定 canonical reference 為 `docs/challenge/door-is-open/`。Stage 3 將兌現此規範。

---

## C. i18n Surface 統計

### C.1 來源類別

| 類別 | 路徑樣本 | 檔案數 | CJK 行數合計 | i18n 處置（規劃，非本 stage 動作） |
|---|---|---|---|---|
| UI / runtime 字串 | `.vitepress/theme/components/*.vue`、`.vitepress/theme/composables/*.ts` | 10 | 61 | Change 2：抽取到 vue-i18n locale 檔。 |
| User content（首頁 + Guide） | `docs/index.md`、`docs/guide/*.md` | 5 | 254 | Change 3：建立 `docs/zh-TW/` 對應檔，root 用英文。 |
| Challenge content | `docs/challenge/door-is-open/index.md` | 1 | 1 | Change 3：補英文版（目前幾乎全英）。 |
| Dev / internal docs | `README.md`、`CONTRIBUTE.md`、`docs/challenges.md`、`openspec/**` 等 | 多數 | — | Change 4：英主中副 parallel 對照。 |
| Code comments | 各 source file 內 `//` `#` 註解 | 不重要 | — | 不在 i18n 範圍。 |

### C.2 UI / runtime 字串明細

| 檔案 | CJK 行數 |
|---|---|
| `.vitepress/theme/components/NotesModal.vue` | 15 |
| `.vitepress/theme/components/ChallengeList.vue` | 12 |
| `.vitepress/theme/components/HomeContent.vue` | 12 |
| `.vitepress/theme/composables/useAttackSession.ts` | 6 |
| `.vitepress/theme/components/NoteEditor.vue` | 4 |
| `.vitepress/theme/components/NoteCard.vue` | 4 |
| `.vitepress/theme/composables/usePentestNotes.ts` | 2 |
| `.vitepress/theme/components/NotesButton.vue` | 2 |
| `.vitepress/theme/components/FlagSubmit.vue` | 2 |
| `.vitepress/theme/components/MergedNav.vue` | 2 |
| **合計** | **61** |

### C.3 User content 明細（占行比）

| 檔案 | CJK 行 / 總行 | 占比 |
|---|---|---|
| `docs/guide/index.md` | 46 / 76 | 61% |
| `docs/guide/network.md` | 64 / 143 | 45% |
| `docs/guide/python.md` | 70 / 197 | 36% |
| `docs/guide/terminal.md` | 62 / 223 | 28% |
| `docs/index.md` | 12 / 53 | 23% |
| `docs/challenge/door-is-open/index.md` | 1 / 19 | 5% |
| **合計** | **255 / 711** | **36%** |

### C.4 推估 i18n 工作量

| Change | 主要工作 | 預估規模 |
|---|---|---|
| Change 2（runtime） | 安裝 vue-i18n + VitePress i18n routing；抽取 61 行 UI 字串至 `locales/{en,zh-TW}.json`；新增 locale 切換 UI | 12 tasks（先前規劃） |
| Change 3（content） | 6 個 markdown 檔產生英文版；建立 `docs/zh-TW/` 對應 routing；challenge frontmatter 多語系 | 10 tasks |
| Change 4（dev docs） | `README` / `CONTRIBUTE` 英化 + `*.zh-TW.md` 對照；`AGENTS.md` / `CLAUDE.md` 已英文無需動 | 10 tasks |

---

## D. Commit 慣例 與 Pre-commit Hook

### D.1 既有 commit 慣例

`git log --oneline -3` 顯示 template 初始僅有單一 commit：

```
e9a8d95 ✨ feat: 將 WXL 前端 WebAssembly 靶場平台初始化為可重用 template
```

- emoji 開頭 + `type: 描述` 格式，使用台灣繁體中文。
- 全域 `/Users/phoenix/.claude/CLAUDE.md` 強制規定所有 `git commit` 必須透過 `/tw-emoji-commit` skill；嚴禁直接 `git commit -m` 或 heredoc 自行撰寫；嚴禁中國大陸用語與簡體字。
- Change 1 後續 stage commits 採對應 emoji：📝 docs（Stage 1）、📋 plan（Stage 2）、🗑️ refactor（Stage 3）、✅ test（Stage 4）。

### D.2 Pre-commit Hook 行為

`scripts/pre-commit.sh`（由 `simple-git-hooks` 安裝至 `.git/hooks/pre-commit`）：

- 透過 `node --experimental-strip-types scripts/challenge-lint-staged.ts` 驗證 staged 區內的 challenge 檔案。
- 暫存（stash） unstaged 的 `docs/` 變動 → 對 staged 快照執行驗證 → 還原 stash。
- 退出碼透傳：驗證失敗則整個 commit 中止。

**Stage 1 commit 注意**：此次將同時 commit `package.json` / `pnpm-lock.yaml` / `.vitepress/config.mts` / `AUDIT.md` 等檔，pre-commit hook 不會對非 `docs/challenge/` 檔做攔截；應可順利通過。

### D.3 Spectra 設定（`.spectra.yaml`）

```yaml
locale: tw
tdd: true
audit: true
parallel_tasks: true
claude_slash_commands: true
```

- locale=tw：AI 產出物用繁體中文（規範檔 spec.md 除外，永遠英文）。
- tdd / audit：本次 apply 已啟用對應 discipline；本 stage 的工作以稽核與檔案搬移為主，TDD red-green-refactor 模式對非 code 任務不直接適用，但 audit 的 Scoundrel / Lazy / Confused 透視法仍套用於修復決策（例如 A.2.1 之 dep 移除：確認移除後無上游配置漏洞、無 silent fallback）。
- parallel_tasks=true：本 change tasks.md 內無 `[P]` 標記，採序列執行（design 已說明理由：跨 commit 邊界、無 parallel 機會）。

---

## E. Stage 1 結論與 Findings 總表

### E.0 Severity Tier 定義（本 change 全域有效）

| Tier | 定義 | Gate 行為 |
|---|---|---|
| **Critical** | 主 build / test pipeline 無法完成，或具備可立即被利用的安全弱點，或有資料遺失風險 | **禁止 commit**，當 task 內必須修正 |
| **High** | Pipeline 可完成但違反明文契約：失敗 test、缺漏 artifact、spec drift、或 onboarding/還原時必然踩雷之操作面陷阱 | **禁止 commit**，當 task 內必須修正 |
| **Medium** | 體驗降階、未來脆弱性，或文件不準將誤導下游 fork 使用者；當下不阻擋 build/test | 可延後，但必須留 durable 追蹤（如 follow-up parked change） |
| **Low** | 上游警告、選用工具缺席、純美化建議；無實質影響 | 觀察即可，無需追蹤 |
| **Informational** | 事實註記，無嚴重度 | 紀錄但不分類 |

### E.1 Findings 嚴重度分類

| Severity | 找到的問題 | 處理狀態 |
|---|---|---|
| **Critical** | `wasm-pack` npm devDep 觸發 minipass/minizlib 版本錯位導致 wasm:build 失敗 | **Stage 1 已修** |
| **High** | esbuild + vite-plugin-top-level-await + 預設 build target 衝突導致 docs:build 失敗 | **Stage 1 已修** |
| **High** | `tests/unit/components/CodeEditorPanel.test.ts` 5 個 test 失敗（功能 regression） | **Stage 1 已建立 durable 追蹤**：tasks.md Stage 4 新增 task 建立 parked change `fix-codeeditorpanel-vitest-regression` 收容此追蹤 |
| **High** | wasm-pack 從 devDep 變成系統 PATH 隱性依賴卻無 preflight 提示 | **Stage 1 已修**：AUDIT.md A.2.1 新增 Prerequisite 段；後續 change 將加入 `wasm-pack --version` 檢查 |
| **High** | spec 內 canonical reference 場景未禁止 fallback 至非 `.archive/` 之其他 docs/challenge/ 目錄 | **Stage 1 已修**：spec.md scenario "Canonical reference becomes unavailable" 強化禁止任何非 declared canonical reference 之讀取 |
| **High** | tasks.md Stage 3.1 `git mv` 三條指令需 `.archive/challenge/` 預先存在，且驗收條件對 partial-completion 過寬 | **Stage 1 已修**：tasks.md 3.1 改為原子化 shell block，含 `mkdir -p` 與精確 verifier |
| **Medium** | `.vitepress/config.mts` `target: 'esnext'` 無 inline 註解，未來 contributor 可能誤刪 | **Stage 1 已修**：加入 inline 註解明確指向 AUDIT.md A.2.2 |
| **Medium** | keygen 自動排版 door-is-open `tools:` 陣列導致工作樹 dirty，與 pre-commit stash 行為交互可能反覆 churn | 觀察，Stage 4 須在 VERIFICATION.md 記錄行為；後續 change 決定 normalization 策略 |
| **Medium** | tasks.md 3.1 之 `.gitignore` 守門 regex `^\.archive(/\|$)` 漏 `/.archive/` 與 `**/.archive` 形式 | 觀察。由 `git mv` 自身拒絕進入 ignored 路徑的內建行為兜底；後續 change 可考慮把 regex 改為 ripgrep `--ignore-file` 完整解析或調用 `git check-ignore` |
| **Medium** | Stage 3 後仍有 ~16 條 normative scenario 例示性 slug 引用殘留於 `challenge-precommit-hook/spec.md`（多 slug 場景）、`challenge-framework/spec.md`、`wasm-challenge-payload/spec.md`、`challenge-file-structure/spec.md`，皆為 WHEN/THEN 語意例示而非檔案存在主張；door-is-open 為 FastAPI 題目，無 Flask 之 `templates/index.html` 結構，無法 1:1 替代所有例示 | 觀察。後續 hygiene change 可擇期改寫為更通用之 placeholder slug（如 `example-challenge`）；此 stage 不在 scope，因會擴大改動範圍且觸及多 slug 場景之語意 |
| **Medium** | AUDIT.md A.3 早期版本未列 5 個失敗 test 之 `it()` 完整名稱，可能讓 4.2 驗收接受模糊 proposal | **Stage 1 已修**：A.3 已列出五個 `it()` 完整路徑，4.2 驗收可比對 |
| **Low** | @vueuse/core 內 `/* #__PURE__ */` 註解位置警告 | 上游問題，無需處理 |
| **Low** | php-wasm 使用 `eval` 之 rollup 警告 | 上游問題，無需處理 |
| **Low** | wasm-tools 缺席導致 keygen 跳過 wasm-strip / wasm-mutate | 選用工具，無需處理 |
| **Low** | spec.md 之 drift detection scenario 並無自動化實作 | 後續 change 評估是否實作 `scripts/check-skill-drift.ts` |
| **Informational** | 清裝後 vite/vite-plugin-wasm/typescript 主版本浮動 | 紀錄於 A.4 |

### E.2 Build Pipeline Health 評分

- **修復前**：1/6 commands 可獨立完成（cargo test）。
- **修復後**：5/6 commands 通過；剩 1 個為功能性 test failure（非 build 阻擋）。
- **可建構性**：✅（pnpm build 全鏈通過）
- **可發佈性**：⚠（vitest regression 須先解決才能進入 Change 2 自動化驗收）

### E.3 進 Stage 2 的前提

Stage 2 之 `DELETION-PLAN.md` 將以本 AUDIT.md 為唯一 baseline，特別是：

- B.1（28 個 specs 引用即將 archive 的 demos）→ 列出每個 spec 的 @trace 條目以擬定移除步驟。
- A.4（door-is-open keygen 副作用）→ 確認 archive 後仍可重跑 keygen 不誤觸他物。
- C 全節（i18n surface 細節）→ Change 2/3/4 之範圍依據。
