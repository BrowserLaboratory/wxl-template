# 網路流量與 HTTP Repeater

## Network Traffic Log 面板說明

Network Traffic Log 面板會自動記錄挑戰發出的每一個 HTTP 請求與對應的回應。每一筆記錄顯示以下欄位：

| 欄位 | 說明 |
|---|---|
| # | 該筆記錄的序號，依擷取順序編號 |
| Method | HTTP 請求方法（GET、POST、PUT、DELETE 等） |
| URL | 請求的路徑與查詢字串（省略主機名稱以維持清單可讀性） |
| Status | HTTP 回應狀態碼（搭配顏色標示） |
| Time | 請求從發出到收到回應的時間（毫秒） |

點擊清單中的任一筆記錄，展開區域會出現兩個子頁籤與一個 **Send to Repeater** 按鈕：

- **Request**：完整請求，以單一封 raw HTTP 訊息呈現——請求行、標頭、空行、本體
- **Response**：原始回應——狀態行、標頭、空行、本體

兩個頁籤顯示的都是完整訊息而非逐欄拆解，因此可以直接整段複製到 Repeater 或腳本裡。

> **注意**：所有工具面板共用同一層 dispatch，因此記錄涵蓋全部來源——Browser 面板、Repeater、Terminal 的 `curl` 與 `wget`，以及 Code Editor 中 `requests` 模組發出的請求。清單本身不會標示某筆請求來自哪個面板，請改用序號與時間把記錄對應回產生它的操作。

## HTTP 狀態碼說明

面板以顏色區分不同類別的 HTTP 狀態碼，方便快速辨別請求結果：

| 狀態碼範圍 | 顏色 | 說明 |
|---|---|---|
| 2xx | 綠色 | 請求成功（200 OK、201 Created、204 No Content 等） |
| 3xx | 黃色 | 重新導向（301 Moved Permanently、302 Found、304 Not Modified 等） |
| 4xx | 橘色 | 使用者端錯誤（400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found 等） |
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
3. 完整的請求會以單一 HTTP 訊息的形式寫入 Repeater 的 raw request 編輯區
4. 切換至 **Repeater** 面板進行編輯與重送

> **提示**：找到可疑請求後，立刻使用 Send to Repeater，避免在 Browser 面板重複操作而產生過多雜訊紀錄。

## HTTP Repeater 功能說明

HTTP Repeater 讓你可以自由編輯 HTTP 請求的每個部分，然後重新發送並即時查看回應。這是測試參數竄改、標頭繞過與 Injection 漏洞的核心工具。

Repeater 並不把請求拆成多個欄位，而是提供單一的 **Raw HTTP Request** 編輯區，直接編輯整封訊息——請求行、標頭、空行、本體——與 Burp Repeater 的做法相同。

| 元件 | 說明 |
|---|---|
| Raw HTTP Request 編輯區 | 單一編輯區，容納完整的請求文字：請求行、標頭、一個空行，接著是本體 |
| Send 按鈕 | 依照你寫的內容原樣發送請求 |
| Response 區 | 顯示原始回應——狀態行、標頭與本體 |
| Saved Snapshots 側欄 | 為目前請求命名並儲存；點擊已存項目即可還原，按 × 可刪除 |

### Raw Request 格式

依照實際上線的格式書寫：先請求行，接著每行一個標頭，然後一個空行，最後是本體。

```
POST /login HTTP/1.1
Host: target.local
Content-Type: application/json
Cookie: session=abc123; admin=false
X-Forwarded-For: 127.0.0.1

{"username": "admin", "password": "test"}
```

標頭與本體之間的空行是必要的——少了它，本體會被當成另一個標頭解析。

### Body 格式

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

在 Network Traffic Log 面板找到 `POST /login` 那一列——方法為 `POST`、路徑為 `/login`、狀態碼為 `302`。展開後，**Request** 頁籤會顯示完整的訊息：

```
POST /login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=testuser&password=testpass
```

### 步驟三：Send to Repeater

點擊「Send to Repeater」將此請求送至 Repeater 面板。

### 步驟四：修改參數測試

在 Repeater 的 raw request 編輯區中，將本體的 `password` 參數修改為 SQL Injection payload：

```
POST /login HTTP/1.1
Host: target.local
Content-Type: application/x-www-form-urlencoded

username=admin&password=' OR '1'='1' --
```

點擊「Send」送出修改後的請求。若打算嘗試多種 payload 變體，建議先存成 snapshot——還原 snapshot 比重打整封請求快得多。

### 步驟五：分析回應取得 flag

若 Response 檢視器顯示狀態碼變為 `200 OK` 且回應本體中包含歡迎訊息或 flag，代表 Injection 成功：

```
HTTP/1.1 200 OK

Welcome, admin! Your flag is: flag{sql_injection_success}
```

將 flag 複製後提交至挑戰頁面，完成本題。

## Terminal 與 Code Editor 搭配 Traffic Log

Browser 面板並不是 Traffic Log 唯一的來源。由於所有面板都經同一層 dispatch 送出請求，你可以在 Terminal 探測、在 Code Editor 大量掃描，最後仍在同一份清單裡檢視並重送。

**場景**：某個 endpoint 會依 `id` 值回傳不同內容，你想找出藏著 flag 的那一個。

### 步驟一：先用 Terminal 探測一次

在動手寫腳本之前，先確認 endpoint 有回應並檢視它的標頭：

```
hacker@wxlsh:~$ curl -i "http://target.local/api/user?id=1"
HTTP 200
content-type: application/json

{
  "id": 1,
  "name": "guest",
  "role": "user"
}
```

JSON 回應會先重新排版再印出，因此看到的本體是排版後的結果，而非連線上的原始位元組。需要原始形式時，請到 Traffic Log 展開該筆記錄。

### 步驟二：用 Code Editor 掃過整個範圍

切換到 Code Editor，以 `requests` 迭代該參數：

```python
import requests

for i in range(1, 30):
    r = requests.get("http://target.local/api/user", params={"id": i})
    if "admin" in r.text or "flag" in r.text.lower():
        print(f"[!] id={i}: {r.text[:200]}")
```

### 步驟三：在 Traffic Log 一併檢視兩邊的流量

開啟 Network Traffic Log，剛才那一次 `curl` 探測與迴圈送出的每一個請求都會列在其中，並依擷取順序編號。清單不支援排序，請沿著 Status 欄往下掃，找出與其他列不同的那一筆，展開後閱讀原始請求與回應。

### 步驟四：在 Repeater 微調勝出的那個請求

展開回應可疑的那筆記錄，點擊 **Send to Repeater**。原始請求會落入 Repeater 的編輯區，你可以只調整某個標頭或參數後重送，不必重跑整輪掃描。每試一種變化前先存一個 snapshot，就能隨時跳回已知可用的請求。

值得記住的節奏是：在 Terminal 探測、在 Code Editor 放大、在 Traffic Log 檢視、在 Repeater 微調。
