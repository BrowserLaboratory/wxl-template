# 網路流量與 HTTP Repeater

## Network Traffic Log 面板說明

Network Traffic Log 面板會自動記錄所有透過 **Browser 面板**發出的 HTTP 請求與對應的回應。每一筆記錄顯示以下欄位：

| 欄位 | 說明 |
|---|---|
| Method | HTTP 請求方法（GET、POST、PUT、DELETE 等） |
| URL | 請求的完整目標網址 |
| Status | HTTP 回應狀態碼（搭配顏色標示） |
| Timing | 請求從發出到收到回應的時間（毫秒） |

點擊清單中的任一筆記錄，可在展開區域看到：

- **Request Headers**：完整的請求標頭
- **Request Body**：請求本體（POST/PUT 請求）
- **Response Headers**：完整的回應標頭
- **Response Body**：回應本體內容

> **注意**：Network Traffic Log 僅記錄 Browser 面板發出的請求。Code Editor 中 `requests` 模組發送的請求不會出現在此面板。

## HTTP 狀態碼說明

面板以顏色區分不同類別的 HTTP 狀態碼，方便快速辨別請求結果：

| 狀態碼範圍 | 顏色 | 說明 |
|---|---|---|
| 2xx | 綠色 | 請求成功（200 OK、201 Created、204 No Content 等） |
| 3xx | 黃色 | 重新導向（301 Moved Permanently、302 Found、304 Not Modified 等） |
| 4xx | 橘色 | 用戶端錯誤（400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found 等） |
| 5xx | 紅色 | 伺服器端錯誤（500 Internal Server Error、502 Bad Gateway 等） |

常見狀態碼對滲透測試的意義：

| 狀態碼 | 測試意義 |
|---|---|
| `200 OK` | 請求正常處理，注意回應內容是否含有敏感資訊 |
| `302 Found` | 登入後重新導向，可能代表認證成功 |
| `401 Unauthorized` | 需要認證，可嘗試繞過或暴力破解 |
| `403 Forbidden` | 權限不足，可嘗試修改標頭（如 `X-Forwarded-For`）或 path traversal |
| `500 Internal Server Error` | 伺服器錯誤，可能暴露 SQL 語法錯誤或堆疊追蹤資訊 |

## Send to Repeater 流程

Network Traffic Log 與 HTTP Repeater 緊密整合。若你發現某筆請求值得進一步分析或修改，可透過以下步驟將其送至 Repeater：

1. 在 Network Traffic Log 清單中，點擊要分析的請求條目
2. 展開詳細資訊後，點擊「**Send to Repeater**」按鈕
3. 該請求的所有資訊（方法、URL、標頭、本體）會自動填入 HTTP Repeater 面板
4. 切換至 **Repeater** 面板進行編輯與重送

> **提示**：找到可疑請求後，立刻使用 Send to Repeater，避免在 Browser 面板重複操作而產生過多雜訊紀錄。

## HTTP Repeater 功能說明

HTTP Repeater 讓你可以自由編輯 HTTP 請求的每個部分，然後重新發送並即時查看回應。這是測試參數篡改、標頭繞過與 Injection 漏洞的核心工具。

| 元件 | 說明 |
|---|---|
| Method 選擇器 | 下拉選單，可切換 GET、POST、PUT、DELETE、PATCH 等 HTTP 方法 |
| URL 編輯器 | 輸入或修改完整的目標 URL，包含查詢字串 |
| Headers 編輯器 | 以 `Key: Value` 格式逐行編輯請求標頭 |
| Body 編輯器 | 編輯請求本體，支援表單格式與 JSON 格式 |
| Send 按鈕 | 以目前設定發送請求 |
| Response 檢視器 | 顯示回應狀態碼、標頭與本體，支援格式化顯示 |

### Headers 編輯格式

每行一個標頭，格式為 `標頭名稱: 值`：

```
Content-Type: application/json
Authorization: Bearer eyJhbGci...
Cookie: session=abc123; admin=false
X-Forwarded-For: 127.0.0.1
```

### Body 編輯格式

表單格式（`application/x-www-form-urlencoded`）：

```
username=admin&password=test&remember=true
```

JSON 格式（`application/json`）：

```json
{
  "username": "admin",
  "password": "' OR '1'='1"
}
```

## 組合工作流範例

以下示範一個完整的測試流程，從發現問題到成功利用漏洞：

**場景**：某挑戰的後台登入頁面疑似有 SQL Injection 漏洞

### 步驟一：Browser 面板觀察

在 Browser 面板開啟 `http://target.local/login`，輸入測試帳號密碼後點擊登入。

### 步驟二：Network Traffic Log 分析

在 Network Traffic Log 面板找到 `POST /login` 的請求記錄。展開後可以看到：

```
Method: POST
URL: http://target.local/login
Status: 302

Request Body:
username=testuser&password=testpass
```

### 步驟三：Send to Repeater

點擊「Send to Repeater」將此請求送至 Repeater 面板。

### 步驟四：修改參數測試

在 Repeater 的 Body 編輯器中，將 `password` 參數修改為 SQL Injection payload：

```
username=admin&password=' OR '1'='1' --
```

點擊「Send」送出修改後的請求。

### 步驟五：分析回應取得 flag

若 Response 檢視器顯示狀態碼變為 `200 OK` 且回應本體中包含歡迎訊息或 flag，代表 Injection 成功：

```
HTTP/1.1 200 OK

Welcome, admin! Your flag is: flag{sql_injection_success}
```

將 flag 複製後提交至挑戰頁面，完成本題。
