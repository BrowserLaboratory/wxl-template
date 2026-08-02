## 1. 紅燈:workflow toolchain parity 測試

- [x] 1.1 新增 tests/unit/workflows/toolchain-parity.test.ts:以 repo 既有的 yaml 套件(dependencies 內的 yaml@2.9.0)解析 .github/workflows/quality-gates.yml、deploy.yml、release.yml 三檔;斷言(a)每一個使用 taiki-e/install-action 的步驟,其 with.tool 完全等於 "wasm-pack@0.14.0,wasm-tools@1.249.0";(b)每一個使用 Swatinem/rust-cache 的步驟,其 with.cache-bin 等於 "false";(c)三檔合計含 install-action 的 job 數恰為 5(quality-gates 的 test/build/site-smoke、deploy 的 build、release 的 release),防止未來新增 job 漏裝。驗證:pnpm vitest run tests/unit/workflows/toolchain-parity.test.ts 於本任務完成當下必須紅燈(現況 tool 清單無 wasm-tools、cache-bin 未設定),紅燈原因須為斷言失敗而非解析錯誤。

## 2. 綠燈:workflow 與文件同步修改

- [x] [P] 2.1 修改三個 workflow 的 5 個 job:taiki-e/install-action 步驟的 tool 值改為 "wasm-pack@0.14.0,wasm-tools@1.249.0"(保留原行內註解);Swatinem/rust-cache 步驟加 with 區塊設 cache-bin: "false" 並附一行註解說明遮蔽風險;deploy.yml 檔頭的工具鏈 parity 註解補上 wasm-tools 1.249.0。完成後 quality-gates.yml 的 test/build 兩 job 即符合 ci-quality-gates spec 中「Both jobs SHALL share an identical setup step sequence」requirement 的更新後步驟字面(delta 見本 change 的 specs/ci-quality-gates/spec.md)。驗證:任務 1.1 的測試轉綠,且 git diff 僅觸及三個 workflow 檔。
- [x] [P] 2.2 README.md 與 package.json 的安裝指示與 CI 同版:prerequisites 一節的 cargo install wasm-tools 指令與 Cloudflare Pages 註記中的 wasm-tools 建議,均改為帶 --version 1.249.0 --locked 的釘版形式;package.json 的 wasm:tools script 同樣加 --version 1.249.0 --locked。驗證:grep -n "wasm-tools" README.md package.json 的每一處安裝指令都含 1.249.0,且 pnpm challenge:validate 不受影響(exit 0)。

## 3. 全量驗證

- [x] 3.1 全套件回歸與產物一致性:pnpm test --run 全綠(865 + 新增 parity 測試);spectra validate ci-install-wasm-tools 通過;python scripts/spec-gates/run.py ci-install-wasm-tools --base HEAD 對本 change 的 G1 無 FAIL(工作區僅含本 change 之檔案時執行)。驗證:三個指令的退出碼皆為 0。
