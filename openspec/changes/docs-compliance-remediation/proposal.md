## Why

四層合規檢核(humane-prose-audit 實跑、spec 對照、drift 實查、i18n 對等)在 outward docs 上查出 24 個議題,其中 19 個屬 A–E 群組的實質錯誤:讀者照文件操作會得到錯誤結果(terminal 指令語法全錯、README 部署指引照做必失敗),且 4 個議題會讓任何觸及相關檔案的 PR 直接被 CI required check `prose-audit` 擋下。不修復,docs 對使用者是誤導、對維護者是地雷。

## What Changes

- **A 群組(CI prose gate 阻斷)**:修正 `docs/zh-TW/guide/python.md`(運行/函數 ×3)、`docs/zh-TW/guide/index.md`(運行)、`docs/zh-TW/guide/network.md`(用戶端→客戶端)的 mainland_vocab 命中;更換英中兩版 terminal 指南的 `flag{hexxx}` 範例值以避開 placeholder_grep(hex 原文同步改為對應編碼)。
- **B 群組(terminal 指南與實作脫節)**:依 wxlsh-commands spec 與 wxlsh-parser 實作重寫英中兩版 terminal 指南:修正 base64/hex/encode/decode 語法、補齊指令清單與 pipe 說明、移除不存在的 cls、修正提示字元為實際格式、修正歷史紀錄持久化描述(IndexedDB)。
- **C 群組(README 部署誤導)**:移除 wasm-pack devDependency 的錯誤宣稱並改寫 Cloudflare Pages 段、GitHub Pages 範例改為與實際 deploy workflow 一致(含 SITE_BASE)、challenge frontmatter 範例改用現行格式(含 layout 欄位、移除 deprecated 的 fs 對映)、Node 版本要求修正為 22.6+、Available scripts 表補齊(含 fork:init)、架構圖補 wxlsh-parser、Prerequisites 補 wasm-tools。
- **D 群組(guide drift)**:修正英中兩版 network 指南的記錄範圍描述(四面板皆經 trackedDispatch)、Repeater UI 描述(Raw HTTP textarea + Saved Snapshots)、python 指南的 requests 描述(micropip 安裝完整套件)、移除不存在的快捷鍵與 UI 元素描述、修正 Pentest Notes 儲存機制描述(IndexedDB)與 URL 欄位描述。
- **E 群組(CONTRIBUTE 矛盾)**:統一 branch 前綴為 feature/、補齊 TOC 兩個遺漏章節。
- **F2(spec delta)**:更新 platform-documentation spec 三條過時 requirement——Terminal Guide 的內建指令清單改為要求與 wxlsh-commands spec 的指令系統一致(含 pipe 與歷史持久化);Network Guide 的 Repeater 描述改為與實作一致(raw HTTP 編輯模型、四面板皆記錄);Python Guide 的 requests 描述改為 micropip 安裝的原版套件與被 patch 的 `HTTPAdapter.send`,並禁止宣稱經 Service Worker 路由。不先修這三條,B/D 群組的 docs 修復會直接違反現行 SHALL。

## Non-Goals

- 不改任何程式碼行為:所有 drift 一律以「docs 對齊實作」方向修復;檢核未發現疑似程式碼 bug。
- 不處理 F1/F3/F4(spec 語料清理:placeholder Purpose、contributor-guide spec 的 required checks 敘述、challenge-list spec 的 layout 條文)——另案。
- 不翻譯 zh-TW 缺少的兩個 challenge 頁(confidential-files、jwt-none-alg)——spec 不強制,另案。
- 不調整 prose-audit checker 的規則或 allowlist(placeholder_grep 誤中以更換範例值解決,不動 checker)。

## Capabilities

### New Capabilities

(無)

### Modified Capabilities

- `platform-documentation`: 三條 requirement 過時——Terminal Guide 的內建指令清單(列出不存在的指令與錯誤語法)改為要求與 wxlsh-commands spec 定義的指令系統一致,涵蓋語法、pipe 與歷史持久化;Network Guide 的 Repeater 功能描述(分欄編輯器)改為要求與實作的 raw HTTP 編輯模型一致,並明訂四個工具面板的請求皆被記錄;Python Guide 的 requests 描述(手寫 stub、經 Service Worker 路由)改為要求描述 micropip 安裝的原版套件與被 patch 的傳輸層(apply 期間查出後補列)。

## Impact

- Affected specs: platform-documentation(delta)
- Affected code:
  - Modified: README.md, CONTRIBUTE.md, docs/guide/index.md, docs/guide/network.md, docs/guide/python.md, docs/guide/terminal.md, docs/zh-TW/guide/index.md, docs/zh-TW/guide/network.md, docs/zh-TW/guide/python.md, docs/zh-TW/guide/terminal.md
  - New: (無)
  - Removed: (無)
- 驗證面:每檔修復後以 scripts/prose-audit/run.py 確認 blocking 歸零;CI 的 test/build/prose-audit 三個 required checks 需全綠。
