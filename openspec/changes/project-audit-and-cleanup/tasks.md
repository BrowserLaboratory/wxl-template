<!--
本 change 的 tasks 採四階段結構：
- 每 stage 包含 1-2 個實質工作 task + 1 個 /spectra-audit gating task + 1 個 commit checkpoint task。
- /spectra-audit gating 為 commit 前的強制檢查；Critical/High 嚴重度若未清空，禁止進入後續 task。
- 所有 commit 統一透過 /tw-emoji-commit skill 落地，emoji prefix 依 stage 對應：📝 / 📋 / 🗑️ / ✅。
- 跨 session resume 流程：讀 `git log --oneline -10` 找最新 stage commit；讀本檔已勾選 `[x]` 找下一個未完成 task。
-->

## 1. 稽核基準（Audit Baseline）

- [x] 1.1 端到端跑完整建構與測試管線並擷取結果：依序執行 `pnpm install`、`pnpm wasm:build`、`pnpm challenge:keygen`、`pnpm docs:build`、`pnpm test`、`cargo test`，把每個指令的 exit code、耗時、最後 20 行 stdout 暫存於工作筆記，作為下一 task 寫入 AUDIT.md 的素材。**驗收**：六個指令全部 exit 0；六筆紀錄齊全。
- [x] 1.2 產出 `AUDIT.md` 作為 **Decision: Three durable audit report files** 的第一份；內容須涵蓋 (a) 上一 task 的 build+test 結果摘要、(b) `openspec/specs/` 下 39 個 spec 的 `@trace` 區段盤點（標註指向不存在檔案的 dead link）、(c) i18n surface 統計（依檔案分類 CJK 字元出現的位置與行數，並標註 UI / content / dev-doc / comment 四類）、(d) 既有 commit 慣例與 pre-commit hook 行為紀錄。**驗收**：`AUDIT.md` 存在於專案根目錄；四個 section 標題齊全；spec dead-link 清單非空時須明確列出對應 spec 與 trace 行號。
- [x] 1.3 對 stage 1 產出執行 **Decision: Per-stage /spectra-audit gating** 的首次基準跑，要求 Critical/High 嚴重度 finding 為 0；若有 Critical/High，必須在本 task 內修正並重跑 audit 直到清空。**驗收**：保存 audit 輸出於工作筆記；最終 finding 計數 Critical=0、High=0。
- [x] 1.4 透過 **Decision: Per-stage commit checkpoint pattern using /tw-emoji-commit** 落地 Stage 1 commit，訊息開頭為 `📝 docs:` 且台灣繁中（嚴禁簡體與大陸用語）。**驗收**：`git log --oneline -1` 顯示新 commit；訊息以 `📝 docs:` 開頭；diff 含 `AUDIT.md` 與 tasks.md 進度勾選變更。

## 2. 刪除計畫（Deletion Plan）

- [x] 2.1 產出 `DELETION-PLAN.md` 作為 **Decision: Three durable audit report files** 的第二份；內容須包含 (a) 三個 demo（sqli-demo / php-demo / fastapi-demo）在 specs、scripts、tests、`.claude/skills/*` 內被引用的完整位置清單、(b) **Decision: Switch wxl-creator canonical reference from sqli-demo to door-is-open** 之具體執行步驟（要替換的字串、要更新的 @trace 條目、要保留的引用）、(c) 預期執行後仍可運作之 invariant 列表（如：door-is-open 仍可被 build 與 dev server 載入）。**驗收**：`DELETION-PLAN.md` 存在於專案根目錄；每個被引用位置都標註絕對路徑 + 行號；wxl-creator 更新步驟可逐條對照執行。
- [x] 2.2 對 stage 2 產出執行 **Decision: Per-stage /spectra-audit gating**，Critical/High 嚴重度 finding 為 0。**驗收**：audit 輸出保存；finding 計數 Critical=0、High=0。
- [x] 2.3 透過 **Decision: Per-stage commit checkpoint pattern using /tw-emoji-commit** 落地 Stage 2 commit，訊息開頭為 `📋 plan:`。**驗收**：`git log --oneline -1` 顯示新 commit；訊息以 `📋 plan:` 開頭。

## 3. 歸檔與移除（Archive & Remove）

- [x] 3.1 依 **Decision: Archive via git mv to .archive/ instead of git rm** 設計決議，以**單一原子化 shell block** 完成三個 demo 搬移；採用以下精確序列以避免 partial-completion 或路徑混淆：

  ```bash
  # 先確認 .archive/ 不在任何 ignore 名單，避免搬移後從版本控制消失
  if [ -f .gitignore ] && grep -E '^\.archive(/|$)' .gitignore >/dev/null; then
    echo "ERROR: .archive/ is in .gitignore — fix first" >&2; exit 1
  fi
  # 建立目標目錄（mv 需要父目錄存在）
  mkdir -p .archive/challenge
  # 原子搬移
  git mv docs/challenge/sqli-demo    .archive/challenge/sqli-demo
  git mv docs/challenge/php-demo     .archive/challenge/php-demo
  git mv docs/challenge/fastapi-demo .archive/challenge/fastapi-demo
  # 精確驗收
  test "$(ls docs/challenge/ | sort | tr '\n' ' ')" = "door-is-open " || { echo FAIL_docs; exit 1; }
  test "$(ls .archive/challenge/ | sort | tr '\n' ' ')" = "fastapi-demo php-demo sqli-demo " || { echo FAIL_archive; exit 1; }
  test "$(git status --porcelain | grep -cE '^R')" -ge 3 || { echo FAIL_rename_count; exit 1; }
  ```

  保留 `docs/challenge/door-is-open/` 不變。**驗收**：上述 shell block 整體 exit 0（無中途 echo FAIL_*）；`git status --porcelain` 至少含三組 `R` 開頭條目。
- [x] 3.2 兌現 spec 新增的 **Skill uses canonical reference example for code generation style** 規範，並執行 **Decision: Switch wxl-creator canonical reference from sqli-demo to door-is-open**：更新 `.claude/skills/wxl-creator/SKILL.md` 把所有指向 sqli-demo 的字串替換為 door-is-open；同步清理 `openspec/specs/wxl-creator-skill/spec.md` 中 `@trace` 區段內指向已 archive 路徑的條目；確認 `.wxl-creator/config.yaml` 不含 sqli-demo 殘餘字串。**驗收**：`rg "sqli-demo" .claude/ openspec/specs/wxl-creator-skill/ .wxl-creator/` 必須為零比對；對應 spec.md 的 `@trace` 區段不再列 `docs/challenge/sqli-demo/index.md` 等已搬移路徑。
- [x] 3.3 對 stage 3 產出執行 **Decision: Per-stage /spectra-audit gating**，Critical/High 嚴重度 finding 為 0；額外驗證 `pnpm docs:build` 後輸出 `dist/` 不包含 `.archive/` 路徑（若被誤 bundle 則屬 Critical）。**驗收**：audit 輸出保存；finding 計數 Critical=0、High=0；`grep -r ".archive" .vitepress/dist/ 2>/dev/null` 無比對。
- [ ] 3.4 透過 **Decision: Per-stage commit checkpoint pattern using /tw-emoji-commit** 落地 Stage 3 commit，訊息開頭為 `🗑️ refactor:`。**驗收**：`git log --oneline -1` 顯示新 commit；訊息以 `🗑️ refactor:` 開頭；diff 同時涵蓋三組 file rename 與 SKILL.md 更新。

## 4. 驗證（Verification）

- [x] 4.1 執行精簡後的端到端驗證並產出 `VERIFICATION.md` 作為 **Decision: Three durable audit report files** 的第三份；驗證項目須完整包含：(a) 重跑 `pnpm install && pnpm wasm:build && pnpm challenge:keygen && pnpm docs:build` 全綠、(b) 重跑 `pnpm test` 與 `cargo test` 全綠、(c) `pnpm dev` 啟動後手動瀏覽 door-is-open challenge 載入無 console error、flag 可送出後顯示成功訊息、(d) 兌現 **Skill uses canonical reference example for code generation style** 之 dry-run：用 `/wxl-creator` 建立一個一次性 throwaway slug（執行後立刻 `git clean -fd` 清除），驗證流程能讀取 `docs/challenge/door-is-open/` 作為 canonical reference 並順利通過 `pnpm challenge:analyze` 與 `pnpm challenge:validate`。**驗收**：`VERIFICATION.md` 存在；四個驗證項皆記錄結果（含命令、exit code、觀察重點截圖或文字）；dry-run 後工作樹回到乾淨狀態。
- [x] 4.2 建立 vitest CodeEditorPanel regression 之 durable 追蹤：執行 `spectra new change fix-codeeditorpanel-vitest-regression --agent claude` 並寫一份 minimal proposal.md（內容須包含：5 個失敗 test 名稱、AUDIT.md A.3 之 reference、修復目標、Non-Goals = 不修改其他元件），接著 `spectra park fix-codeeditorpanel-vitest-regression` 暫存。**驗收**：`spectra list --parked --json` 應包含 `fix-codeeditorpanel-vitest-regression`；`openspec/changes/fix-codeeditorpanel-vitest-regression/proposal.md` 內含五個失敗 test 之確切名稱。
- [x] 4.3 對 stage 4 產出執行 **Decision: Per-stage /spectra-audit gating** 之最終總檢，Critical/High 嚴重度 finding 為 0。**驗收**：audit 輸出保存於 `VERIFICATION.md` 末段；finding 計數 Critical=0、High=0。
- [ ] 4.4 透過 **Decision: Per-stage commit checkpoint pattern using /tw-emoji-commit** 落地 Stage 4 commit，訊息開頭為 `✅ test:`，並在 commit body 註明本次為 Change 1 之收尾、後續將以 `/spectra-archive project-audit-and-cleanup` 完成歸檔並啟動 Change 2 propose。**驗收**：`git log --oneline -10` 含四個依序排列的 stage commits（📝 → 📋 → 🗑️ → ✅）；`spectra validate project-audit-and-cleanup` 不會因進度未完成而報錯。
