# 快速上手

## 平台介紹

Web eXploitation Laboratory (WXL) 是一個完全在瀏覽器端執行的 Web 資安挑戰平台。平台採用 **WASM（WebAssembly）架構**，所有工具與腳本執行環境均內建於前端，不需要任何後端伺服器。

主要特色：

- **零後端依賴**：所有挑戰工具（Python 執行環境、終端機、網路流量記錄）皆在瀏覽器內運行
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
| Code Editor / Pyodide | Code Editor | 在瀏覽器內執行 Python 3 腳本，支援 HTTP 請求模擬 |
| Terminal / wxlsh | Terminal | 執行內建指令列工具，包含編碼轉換與 curl 等指令 |
| 內建瀏覽器 | Browser | 直接瀏覽並互動目標挑戰網站 |
| Network Traffic Log | Network | 記錄並檢視所有 HTTP 請求與回應的完整內容 |
| HTTP Repeater | Repeater | 修改 HTTP 請求的方法、標頭、參數後重新送出 |
| Pentest Notes | Notes | 自由記錄測試過程、觀察與破解思路 |

## 常見問題 FAQ

**Q：為什麼頁面載入很慢？**

首次進入挑戰頁面時，平台需要下載 Pyodide WebAssembly 執行環境（約 10–20 MB）。請耐心等待載入完成，載入後即可正常使用。後續重新開啟時會使用快取，速度會快很多。

**Q：Python 腳本執行後沒有輸出，怎麼辦？**

請確認腳本中有使用 `print()` 輸出結果。此外，Pyodide 初始化需要一些時間，若剛進入頁面就立即執行，可能會看到「Pyodide 尚未就緒」的提示，請稍等幾秒後再試。

**Q：Network Traffic Log 看不到任何請求？**

Network Traffic Log 只會記錄透過 **Browser 面板**發出的請求。若你在 Code Editor 中使用 `requests` 模組發送的請求，會顯示在 Code Editor 的輸出區塊，而不是 Network 面板。

**Q：關閉頁面後，Pentest Notes 的內容會消失嗎？**

不會。Pentest Notes 的內容儲存在瀏覽器的 `localStorage` 中。只要不清除瀏覽器資料，關閉後重新開啟仍可看到先前的筆記。

**Q：可以在 Code Editor 中 import 第三方套件嗎？**

目前支援 Pyodide 內建的標準函式庫模組（如 `json`、`re`、`base64`、`hashlib`）以及平台提供的 `requests` stub。不支援 `pip install` 安裝額外套件，也無法 import 未內建的第三方套件。
