## Context

challenge:keygen 的 prepareTemplateWasm 在找不到 wasm-tools 時走 copyFileSync fallback、mutate pass 靜默跳過。目前三個 workflow(quality-gates.yml、deploy.yml、release.yml)只裝 wasm-pack(taiki-e/install-action,釘 0.14.0)與 binaryen(apt),所以 CI 與正式部署產物從未經過 strip 與 mutate。keygen 端的防護(assertUsableWasm、u32 seed)已在前兩個 commit 完成並有 865 全綠測試;本 change 只補「CI 裝工具」這一段。

限制條件:
- taiki-e/install-action 釘在 v2.79.2(commit 213ccc1a),其內建 manifest 對 wasm-tools 最高收錄 1.249.0。
- ci-quality-gates spec 的「Both jobs SHALL share an identical setup step sequence」requirement 以字面列舉 setup 步驟,任何 tool 清單變更都需要 spec delta 同步。
- Swatinem/rust-cache(釘 v2.9.1)的 cache-bin 輸入預設 "true",會快取 CARGO_HOME/bin——正是 install-action 的安裝目的地。

## Goals / Non-Goals

**In scope**
- 5 個 job 的 install-action tool 清單加入 wasm-tools@1.249.0。
- 5 個 job 的 rust-cache 步驟設 cache-bin: "false"。
- deploy.yml 檔頭 parity 註解、README 兩處安裝指示、package.json wasm:tools script 與 CI 同版。
- 一支新的單元測試檔,機械式斷言上述 parity。
- ci-quality-gates spec delta。

**Out of scope**
- fork 模板 deploy.yml.template 的 drift(另案)。
- wasm-challenge-payload spec 的 strip 順序筆誤(另案)。
- 升級 install-action 的 SHA。
- keygen 程式碼本身(已完成)。

## Decisions

1. **版本釘 1.249.0,不追 latest 1.255.0**。釘住的 install-action manifest 不含 1.255.0(以 gh api 讀 commit 213ccc1a 的 manifests/wasm-tools.json 驗證,manifest latest 即 1.249.0);本機驗證環境同為 1.249.0,所有 strip/mutate 實測數據以此版本量得;keygen 已不依賴 -o - 語意,1.249.0 無已知問題。
2. **cache-bin 關閉而非 bump cache key**。key bump 只解一次,之後每次工具改版都要記得再 bump;cache-bin: "false" 永久消除遮蔽路徑。此 repo 的 CARGO_HOME/bin 內只有 install-action 放的預編譯二進位,關閉不會引入任何重新編譯成本。
3. **五個 job 全裝,不只 quality-gates**。deploy 與 release 各自獨立執行 pnpm build / pnpm challenge:keygen 產生部署與發布產物;只裝 quality-gates 會造成「CI 綠但部署產物未 strip」的不一致——這正是 keygen fallback 設計成警告而非失敗所隱藏的差異。
4. **新增 workflow parity 測試而非只靠 spec prose**。repo 目前沒有任何測試斷言 workflow 內容,spec 的字面列舉全靠人工比對。測試以 YAML 解析(js-yaml 已是 devDependency 則直接用;否則以既有相依或 Node 內建讀檔 + 正規式比對,擇 repo 已有者)讀三個 workflow,對 5 個 job 斷言:install-action 步驟的 tool 值完全等於 "wasm-pack@0.14.0,wasm-tools@1.249.0";rust-cache 步驟的 with.cache-bin 等於 "false"。任何一處漂移即紅燈。
5. **README 與 package.json 跟 CI 同版**。本次事故的根因之一是本機與 CI 工具集不一致;文件與 script 指示未釘版會持續製造這種不一致。cargo install 指令加 --version 1.249.0 --locked。

## Implementation Contract

- 觀察行為:三個 workflow 的 5 個 job 在 setup 階段安裝 wasm-tools 1.249.0;之後的 pnpm challenge:keygen log 應出現 [prep] wasm-strip applied 而非 [warn] wasm-tools not found(此行為由既有 keygen 測試涵蓋,CI log 為人工佐證,不新增 e2e)。
- 介面/資料形狀:install-action 的 with.tool 為逗號分隔清單 "wasm-pack@0.14.0,wasm-tools@1.249.0";rust-cache 的 with.cache-bin 為字串 "false"。
- 失敗模式:若 install-action manifest 缺少指定版本,setup 步驟即失敗、job 紅燈——這是刻意的 fail-fast,不得以 continue-on-error 掩蓋。
- 驗收:新測試檔 tests/unit/workflows/toolchain-parity.test.ts 全綠;pnpm test --run 全綠;spectra validate 通過;G1/G2 spec-gates 對本 change 無 FAIL。
- 邊界:不動 install-action 與 rust-cache 的版本 SHA;不動 binaryen 安裝方式;不動 fork 模板。

## Risks / Trade-offs

- **CI 執行時間**:install-action 下載預編譯 tarball,新增一個工具約數秒;cache-bin 關閉不影響 registry/target 快取,無編譯成本。
- **產物位元組改變**:部署與發布的 runtime.wasm 將首次經過 strip(每題約省 422 bytes)與 mutate(u32 seed 修復後 2/3 題可套用),位元組與歷史版本不同屬預期行為;challenge:validate 與 wasm:test 於同一 pipeline 驗證其可用性。
- **apt binaryen 版本差異**:wasm-opt --all-features 在 apt 版 binaryen 不支援時,keygen 已有 try/catch 降級保留 stripped 模板,不會中斷建置。

## Migration Plan

單一 PR 內完成,無資料遷移。合併後第一次 deploy/release 產物即為 stripped+mutated 版本;若需回退,revert 該 PR 即回到 copyFileSync fallback,產物退回未 strip 狀態,無不可逆效果。

## Open Questions

(無——版本、範圍、快取策略、文件同步皆已定案。)
