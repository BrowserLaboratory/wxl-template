# Terminal 終端機工具

## Terminal 介面說明

Terminal 面板提供一個在瀏覽器內執行的指令列環境，使用平台自訂的 **wxlsh** shell。wxlsh 內建了資安測試常用的工具指令，包含編碼轉換、HTTP 請求與資料解析等功能。

介面區域說明：

| 區域 | 說明 |
|---|---|
| 輸出區 | 顯示指令執行結果與系統訊息 |
| 輸入列 | 輸入指令的區域，支援歷史紀錄瀏覽 |
| 提示字元 | `wxlsh $` 表示 shell 就緒，可接受輸入 |

## 內建指令清單

| 指令 | 說明 |
|---|---|
| `help` | 顯示所有可用指令與說明 |
| `clear` / `cls` | 清除終端機輸出畫面 |
| `base64 encode <text>` | 將文字進行 Base64 編碼 |
| `base64 decode <text>` | 將 Base64 字串解碼為原始文字 |
| `hex encode <text>` | 將文字轉換為十六進位編碼 |
| `hex decode <hex>` | 將十六進位字串還原為文字 |
| `curl <url>` | 對指定 URL 發送 HTTP GET 請求並顯示回應 |
| `encode <text>` | 對文字進行 URL encode |
| `decode <text>` | 對 URL encoded 字串進行解碼 |

## 指令詳解

### help

顯示 wxlsh 所有可用指令的說明清單。

**語法**

```
help
```

**範例**

```
wxlsh $ help
Available commands:
  help              顯示此說明
  clear / cls       清除畫面
  base64 encode     Base64 編碼
  base64 decode     Base64 解碼
  ...
```

---

### clear / cls

清除終端機目前所有輸出內容，回到空白畫面。

**語法**

```
clear
cls
```

---

### base64 encode

將輸入的純文字字串進行 Base64 編碼並輸出結果。

**語法**

```
base64 encode <text>
```

**範例**

```
wxlsh $ base64 encode admin:password
YWRtaW46cGFzc3dvcmQ=
```

---

### base64 decode

將 Base64 編碼字串解碼並輸出原始文字。

**語法**

```
base64 decode <encoded>
```

**範例**

```
wxlsh $ base64 decode ZmxhZ3tzZWNyZXR9
flag{secret}
```

---

### hex encode

將文字字串的每個字元轉換為對應的十六進位 ASCII 碼。

**語法**

```
hex encode <text>
```

**範例**

```
wxlsh $ hex encode hello
68656c6c6f
```

---

### hex decode

將十六進位字串還原為可讀文字。

**語法**

```
hex decode <hex>
```

**範例**

```
wxlsh $ hex decode 666c61677b68657878787d
flag{hexxx}
```

---

### curl

對指定 URL 發送 HTTP GET 請求，並將回應本體輸出至終端機。適合快速查看 API 回應或測試端點是否存在。

**語法**

```
curl <url>
curl <url> -H "Header-Name: value"
```

**範例**

```
wxlsh $ curl http://target.local/api/status
{"status": "ok", "version": "1.0"}

wxlsh $ curl http://target.local/admin -H "X-Admin: true"
403 Forbidden
```

---

### encode

對字串進行 URL 百分比編碼（percent-encoding），將特殊字元轉換為 `%XX` 格式。適合構造含特殊字元的查詢參數。

**語法**

```
encode <text>
```

**範例**

```
wxlsh $ encode ' OR 1=1 --
%27%20OR%201%3D1%20--
```

---

### decode

將 URL 百分比編碼的字串還原為原始文字。

**語法**

```
decode <encoded>
```

**範例**

```
wxlsh $ decode %66%6c%61%67%7b%74%65%73%74%7d
flag{test}
```

---

## 歷史紀錄操作

wxlsh 會記錄目前工作階段中執行過的指令歷史，可使用鍵盤方向鍵快速瀏覽與重用。

| 按鍵 | 動作 |
|---|---|
| `↑`（向上） | 顯示上一條歷史指令 |
| `↓`（向下） | 顯示下一條歷史指令（往較新的方向） |

> **注意**：歷史紀錄僅在目前頁面工作階段中有效，重新整理頁面後歷史紀錄會清除。

## 快捷鍵

| 快捷鍵 | 動作 |
|---|---|
| `Ctrl + A` | 將游標移至輸入列開頭 |
| `Ctrl + E` | 將游標移至輸入列結尾 |
| `Ctrl + L` | 清除終端機畫面（等同 `clear` 指令） |
| `Ctrl + C` | 中止目前輸入，清空輸入列並換行 |
