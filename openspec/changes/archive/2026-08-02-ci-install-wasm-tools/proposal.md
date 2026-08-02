## Summary

在三個 CI workflow 以釘版方式安裝 wasm-tools 1.249.0,讓 challenge:keygen 的 wasm-strip 分支首次在 CI 與部署產物中生效,並消除工具版本漂移與快取遮蔽兩類風險。

## Motivation

`pnpm challenge:keygen` 的 strip 與 mutate 兩個 pass 依賴 `wasm-tools`,但目前三個 workflow(quality-gates、deploy、release)都只安裝 wasm-pack 與 binaryen——全 `.github/` 對 wasm-tools 的 grep 為零命中。因此 CI 與正式部署的產物一律走 copyFileSync fallback,strip 從未生效,mutate 從未執行。近期已修復的 strip 靜默腐化缺陷(wasm-tools 1.249.0 起 `-o -` 語意變更)正是「本機與 CI 工具集不一致 + 未釘版」共同造成的事故;本 change 讓 CI 與本機使用同一釘版工具,並以測試釘住 parity。

版本選 1.249.0 而非 upstream latest 1.255.0,依據三點:目前釘住的 taiki-e/install-action v2.79.2(commit 213ccc1a)內建 manifest 對 wasm-tools 最高只收錄 1.249.0;本機驗證環境即 1.249.0,所有 strip/mutate 實測數據皆以此版本量得;程式碼已不再依賴 `-o -` 語意,1.249.0 無已知問題。

## Proposed Solution

- 三個 workflow 共 5 個 job(quality-gates 的 test、build、site-smoke;deploy 的 build;release 的 release)的 taiki-e/install-action 步驟,tool 清單由 wasm-pack@0.14.0 擴為 wasm-pack@0.14.0,wasm-tools@1.249.0。
- 同 5 個 job 的 Swatinem/rust-cache 步驟加上 cache-bin: "false":install-action 把二進位裝進 CARGO_HOME/bin,而 rust-cache 預設會快取該目錄,舊快取可能以過期二進位遮蔽釘版安裝。
- deploy.yml 檔頭的工具鏈 parity 註解同步補上 wasm-tools 1.249.0。
- README.md 兩處未釘版指示改為與 CI 同版:prerequisites 一節的 cargo install wasm-tools 指令,以及 Cloudflare Pages 部署註記中「Add wasm-tools to the install line」的建議。
- package.json 的 wasm:tools script 加版本釘,與 CI 同版。
- 新增單元測試解析三個 workflow 的 YAML,斷言 5 個 job 的 install-action tool 清單與 rust-cache cache-bin 設定一致且含釘版 wasm-tools(目前 repo 沒有任何斷言 workflow 內容的測試)。
- spec delta:ci-quality-gates 的「Both jobs SHALL share an identical setup step sequence」requirement,setup 步驟 3(rust-cache)與步驟 4(install-action tool 清單)的字面更新。

## Non-Goals

- 不處理 fork 模板 .agent/skills/wxl-fork-init/deploy.yml.template 的既有 drift(它連 SITE_BASE 都沒有,屬另案)。
- 不修 openspec/specs/wasm-challenge-payload/spec.md 中 strip 順序寫反的筆誤(另案)。
- 不動 github-release-workflow spec 的 pipeline 敘述——該 prose 只要求「install Rust toolchain and wasm-pack, install binaryen」等步驟存在,加裝 wasm-tools 不違反,無需 delta。
- 不升級 taiki-e/install-action 本身的釘版 SHA(升級它才裝得到 1.255.0,但擴大供應鏈變更面,收益只有 6 個 patch 版本)。

## Alternatives Considered

- 釘 wasm-tools@1.255.0(upstream latest):被否決——釘住的 install-action v2.79.2 manifest 不含該版,會讓 5 個 job 全數失敗;要用它必須連動升級 action SHA。
- 以 cargo install 在 CI 現編:被否決——每次 build 增加數分鐘編譯時間,且未釘版時重演本次 1.249.0 語意變更事故。
- rust-cache 改 bump cache key 而非關 cache-bin:被否決——key bump 是一次性的,下次工具版本變更仍會遮蔽;cache-bin: "false" 一勞永逸,且此 repo 的 cargo bin 只有 install-action 裝的預編譯工具,關掉沒有重編成本。

## Impact

- Affected specs: ci-quality-gates(修改「Both jobs SHALL share an identical setup step sequence」requirement 的 setup 步驟字面)
- Affected code:
  - Modified: .github/workflows/quality-gates.yml
  - Modified: .github/workflows/deploy.yml
  - Modified: .github/workflows/release.yml
  - Modified: README.md
  - Modified: package.json
  - New: tests/unit/workflows/toolchain-parity.test.ts
