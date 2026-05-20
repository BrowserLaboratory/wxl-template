## 1. Workflow 骨架（建立 `quality-gates.yml`）

- [x] 1.1 在 `.github/workflows/quality-gates.yml` 設定 `on:` 區塊，落實「PR-time quality gates SHALL trigger on PRs to `main`/`staging` and pushes to `main`」之契約——可觀察行為：`gh workflow list` 顯示 `Quality Gates` workflow；對 `staging` 開 PR 即觸發；push `v*` tag 不觸發；PR 對 feature branch 也不觸發。驗證：開一個 draft PR 至 `staging` 確認 Quality Gates run 出現在 Actions 頁面；本地 `git tag v0.0.0-dryrun-only-local` 後不 push 仍可比對 trigger 設定 grep 結果。
- [x] 1.2 在 `quality-gates.yml` 內定義兩個 top-level job ID 為 `test` 與 `build`，且兩者皆無 `needs:` 依賴——落實「The workflow SHALL define two parallel jobs named `test` and `build`」與設計決策「兩個並行 job 而非單一序列 job」。可觀察行為：GitHub Actions UI 顯示兩 job 同時排程；其中一 job 失敗時另一 job 仍跑完。驗證：trigger 一次 workflow，run 頁面確認兩 job 之 `Set up job` 時間戳幾乎同步；`yq '.jobs | keys' .github/workflows/quality-gates.yml` 輸出 `[test, build]`。

## 2. 共用 setup 步驟

- [x] 2.1 兩 job 各自依下列固定順序 10 步驟跑共用 setup（checkout → rust-toolchain → rust-cache → wasm-pack-action → binaryen → pnpm/action-setup → setup-node → `pnpm install --frozen-lockfile` → `pnpm wasm:build` → `pnpm challenge:keygen`），落實「Both jobs SHALL share an identical setup step sequence」與設計決策「步驟順序對齊 `release.yml`，不重新設計」。可觀察行為：workflow log 顯示 10 步驟依序執行於兩 job 開頭。驗證：對照 `release.yml` line 16–47，action 名稱與版本完全一致；`pnpm install` 帶 `--frozen-lockfile` 旗標。
- [x] 2.2 `actions/setup-node@v4` 之 `node-version` 設為 `22`、`cache: pnpm`——落實「The workflow SHALL pin Node.js to version 22 LTS」與設計決策「Node 版本 pin 至 22 LTS」。可觀察行為：setup-node log 顯示安裝 Node 22.x.x；workflow 不含 Node 24+ matrix。驗證：workflow run 之 `Setup Node.js` 步驟輸出 `node-version: 22` 解析到具體 22.x release。
- [x] 2.3 用 `jetli/wasm-pack-action@v0.4.0` 安裝 `wasm-pack`，且 `package.json` 不出現 `wasm-pack` 於 dependencies 或 devDependencies——落實「`wasm-pack` SHALL be installed via `jetli/wasm-pack-action`, not via npm」與設計決策「`wasm-pack` 由 GitHub Action 提供，不從 npm 安裝」（per AUDIT.md §A.2.1）。可觀察行為：workflow log 顯示 wasm-pack action 下載預編譯 binary（~5s），非 cargo build；`pnpm install` log 無 wasm-pack 解析條目。驗證：`grep -n "wasm-pack" package.json` 不命中 dependencies 區塊；workflow log 中 wasm-pack 版本來自 action。

## 3. Test job gate 步驟

- [x] 3.1 `test` job 在共用 setup 之後依序跑 `pnpm wasm:test` 再 `pnpm test --run`——落實「The `test` job SHALL execute `pnpm wasm:test` and `pnpm test --run`」。可觀察行為：Rust test 失敗或 Vitest 失敗即 job 紅燈；vitest 帶 `--run` 不進 watch mode。驗證：故意打壞一個 vitest test 並 push 至 throwaway PR，PR 上 `Quality Gates / test` 之 conclusion 為 `failure`；`grep -nE "pnpm test( --run|\$)" .github/workflows/quality-gates.yml` 必須命中 `--run` 變體、不命中無 flag 變體。

## 4. Build job gate 步驟

- [x] 4.1 `build` job 在共用 setup 之後依序跑 `pnpm challenge:validate` 再 `pnpm docs:build`——落實「The `build` job SHALL execute `pnpm challenge:validate` and `pnpm docs:build`」。可觀察行為：`docs/challenge/**` frontmatter 違規或 VitePress build 錯誤即 job 紅燈；`challenge:validate` 失敗時 `docs:build` 不執行。驗證：故意在 throwaway PR 引入 `docs/` 之 broken link，PR 上 `Quality Gates / build` 之 conclusion 為 `failure`。

## 5. Scope 邊界

- [x] 5.1 確認 `quality-gates.yml` 在 `docs:build` / `test --run` 之後結束，無 packaging / release-publish 步驟——落實「The PR-time workflow SHALL NOT duplicate the release-time packaging steps」與設計決策「PR-time gate workflow 與 release-time workflow 並行而非取代」。可觀察行為：workflow log 不出現 `softprops/action-gh-release`、`zip` 打包、或 `actions/upload-artifact`。驗證：`grep -nE "action-gh-release|upload-artifact|^[[:space:]]*zip " .github/workflows/quality-gates.yml` 必須無命中。

## 6. 端到端驗證

- [x] 6.1 在 Node 22 LTS workstation 上以乾淨 checkout 跑 local-equivalent 指令鏈 `pnpm install --frozen-lockfile && pnpm wasm:build && pnpm challenge:keygen && pnpm wasm:test && pnpm test --run && pnpm challenge:validate && pnpm docs:build`——可觀察行為：全部 7 條指令 exit 0。驗證：terminal log 每條指令尾端可見 exit 0；任一條紅即停手，不進入 PR-time 驗證。
- [x] 6.2 從 throwaway branch 開 PR 至 `staging` 確認 workflow 正常觸發——可觀察行為：60 秒內 PR 上出現 `Quality Gates / test` 與 `Quality Gates / build` 兩個 check，且乾淨 branch 上兩者皆 green。驗證：`gh pr checks <pr-number>` 輸出兩條 check 與其 conclusion。
- [x] 6.3 在 throwaway branch 上故意打壞一個 vitest test 並 push，確認 `Quality Gates / test` 紅燈而 `Quality Gates / build` 仍 green，驗證兩 job 並行獨立性——可觀察行為：PR check 列表顯示 test red、build green。驗證：`gh pr checks <pr-number>` 或 PR 介面截圖；接著還原修改、再 push、確認兩 check 重回 green。

## 7. Follow-up 紀錄（本 change 不實作）

- [x] 7.1 確認 `design.md` 之 Open Questions 段已記錄「prose-audit gate 的 CI 化路徑（follow-up change，非本次實作）」三個候選（Option A Phase 1 deterministic-only / Option B verify-committed-summary / Option C Claude API）——可觀察行為：後續 change 的 author 讀 design.md 可直接看到三選項與各自 trade-off。驗證：`grep -nE "Option A|Option B|Option C" openspec/changes/ci-quality-gates/design.md` 至少三條命中、且各含對應 trade-off 描述。
- [x] 7.2 確認 `design.md` 之 Open Questions 段已記錄「`release.yml` 之 prose-audit 整合」未決議題，且明確聲明本 change 不動 `release.yml`——可觀察行為：後續 change 可看到此議題並接手。驗證：`grep -nE "release\.yml.*prose-audit|本 change 不動.*release\.yml" openspec/changes/ci-quality-gates/design.md` 至少一條命中。
