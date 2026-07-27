# 快速上手

## 平台介紹

Web eXploitation Laboratory (WXL) 是一個完全在瀏覽器端執行的 Web 資安挑戰平台。平台採用 **WASM（WebAssembly）架構**，所有工具與腳本執行環境均內建於前端，不需要任何後端伺服器。

主要特色：

- **零後端依賴**：所有挑戰工具（Python 執行環境、終端機、網路流量記錄）皆在瀏覽器內執行
- **隱私保護**：攻擊腳本與測試資料不會離開你的裝置
- **即開即用**：只需現代瀏覽器，無需安裝任何軟體或設定環境

## 系統需求

| 需求項目 | 說明 |
|---|---|
| 瀏覽器 | 支援 WebAssembly 的現代瀏覽器（Chrome 89+、Firefox 89+、Safari 15+、Edge 89+） |
| 網路連線 | 首次載入需要下載 Pyodide 執行環境（約 10–20 MB），之後可離線使用 |
| JavaScript | 必須啟用 JavaScript |
| Service Worker | 部分功能依賴 Service Worker，請確保瀏覽器未封鎖 |

> **提示**：建議使用桌面版瀏覽器以獲得最佳操作體驗。行動裝置瀏覽器可能因螢幕空間不足而影響使用。

## 快速開始步驟

### 步驟一：選題

在挑戰清單頁面瀏覽所有可用題目。每道題目標示了難度等級與技術分類（例如：SQL Injection、XSS、Command Injection）。點擊題目卡片即可進入挑戰頁面。

### 步驟二：使用工具

挑戰頁面提供多個內建工具面板：

- 使用 **Browser** 面板瀏覽目標網站並觀察行為
- 使用 **Network Traffic Log** 面板攔截並分析 HTTP 請求
- 使用 **Code Editor** 撰寫 Python 攻擊腳本並執行
- 使用 **Terminal** 執行內建指令列工具
- 使用 **HTTP Repeater** 修改並重送特定請求
- 使用 **Pentest Notes** 記錄觀察與測試結果

### 步驟三：提交 flag

成功利用漏洞後，你會取得一組 flag 字串（格式通常為 `flag{...}`）。將 flag 貼入挑戰頁面底部的提交欄位，按下送出即可完成挑戰。

## 工具總覽

| 工具名稱 | 面板標籤 | 主要用途 |
|---|---|---|
| Code Editor / Pyodide | Code | 在瀏覽器內執行 Python 3 腳本，支援 HTTP 請求模擬 |
| Terminal / wxlsh | Terminal | 執行內建指令列工具，包含編碼轉換與 curl 等指令 |
| 內建瀏覽器 | Browser | 直接瀏覽並互動目標挑戰網站 |
| Network Traffic Log | Network | 記錄並檢視所有 HTTP 請求與回應的完整內容 |
| HTTP Repeater | Repeater | 修改 HTTP 請求的方法、標頭、參數後重新送出 |
| Pentest Notes | —（導覽列按鈕，開啟 modal） | 自由記錄測試過程、觀察與破解思路 |

## 常見問題 FAQ

**Q：為什麼頁面載入很慢？**

首次進入挑戰頁面時，平台需要下載 Pyodide WebAssembly 執行環境（約 10–20 MB）。請耐心等待載入完成，載入後即可正常使用。後續重新開啟時會使用快取，速度會快很多。

**Q：Python 腳本執行後沒有輸出，怎麼辦？**

請確認腳本中有使用 `print()` 輸出結果。此外，Pyodide 初始化需要一些時間，但你不會不小心提早執行：在 runtime 就緒前，Run 按鈕是停用狀態並顯示「Loading…」。等它變成「▶ Run」再執行即可。

**Q：Network Traffic Log 看不到任何請求？**

所有工具面板共用同一層 dispatch，因此 Browser 面板、Repeater、Terminal 的 `curl` 與 `wget`，以及 Code Editor 的 `requests` 呼叫都會被記錄下來。清單空白通常代表還沒發出任何請求——請先與挑戰互動。

**Q：關閉頁面後，Pentest Notes 的內容會消失嗎？**

只有你明確儲存過的筆記會留下。儲存時會把筆記寫入瀏覽器的 IndexedDB，只要不清除瀏覽器資料，下次開啟頁面仍看得到。還留在編輯區、尚未儲存的文字並沒有被存到任何地方，關閉或重新整理頁面就會消失——離開前請先儲存。

**Q：可以在 Code Editor 中 import 第三方套件嗎？**

可以。除了 Pyodide 內建的標準函式庫模組（如 `json`、`re`、`base64`、`hashlib`）之外，平台會以 micropip 安裝第三方套件——真正的 `requests` 套件就是這樣提供的。題目作者在挑戰的 `packages` frontmatter 欄位宣告需要的額外套件，執行環境啟動時便會安裝。你無法自己在腳本中執行 `pip install`；套件清單由題目決定。
