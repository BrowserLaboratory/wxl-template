## Why

`openspec/specs/` 內 `python-asgi-runtime`（9 條）與 `php-runtime`（5 條）描述的是同一套「在瀏覽器內執行挑戰題後端程式碼」的 runtime 契約——兩者在「每 challenge session 初始化一次」「執行前先掛載 virtual filesystem」「runtime 模組置於 .vitepress/composables」「處理 HTTP request 並回傳 response」等需求幾乎逐條平行、內容重複。`fastapi-challenge`（1 條）並非獨立 runtime，只是斷言「存在一支可用的 FastAPI demo 題」，而 FastAPI 本就跑在 ASGI runtime 之上。這些重複與零散提高維護成本、易產生 drift，是 P3.1 spec consolidation 審視確認的最高信心合併候選。

## What Changes

- 新增單一 capability `challenge-runtimes`，以「共用 runtime 契約 + 各 runtime 專屬需求」結構收斂上述內容：
  - 共用契約只敘述一次（每 session 初始化一次、執行前掛載 virtual filesystem、runtime 模組位置、HTTP request/response 處理），各需求以 Python 與 PHP scenario 分別涵蓋。
  - Python-ASGI 專屬：ASGI scope 轉譯與 response event 蒐集、micropip 套件安裝、FastAPI 支援（BASE_PACKAGES 注入與 packages frontmatter 欄位、可用 demo 存在）、E2E mock 完整性。
  - PHP 專屬：php-wasm 執行、HTTP 請求情境（$_SERVER／$_GET／$_POST／$_COOKIE／$GLOBALS 原始輸入）。
- 移除 `python-asgi-runtime`、`php-runtime`、`fastapi-challenge` 三個 capability spec 目錄，內容全數遷入 `challenge-runtimes`。三者名稱經查證未被其他 spec 以 capability 名稱引用，遷移不會產生 orphan reference。
- `requests-shim` 維持獨立 capability（界線清楚、跨 backend 使用），不在本 change 範圍。

## Capabilities

### New Capabilities

- `challenge-runtimes`: 統一的挑戰題後端 runtime spec，涵蓋共用 runtime 契約與 Python-ASGI、PHP 各自專屬需求（由 python-asgi-runtime + php-runtime + fastapi-challenge demo 收斂而來）。

### Modified Capabilities

（無）

## Impact

- Affected specs:
  - 新增：openspec/specs/challenge-runtimes/spec.md
  - 移除（capability 目錄刪除、內容遷入 challenge-runtimes）：openspec/specs/python-asgi-runtime/、openspec/specs/php-runtime/、openspec/specs/fastapi-challenge/
  - 不變：openspec/specs/requests-shim/spec.md
- Affected code: 無。runtime 實作（Python／PHP runtime composables 與 php-bridge 模組等）與其行為皆不更動，本 change 僅重構 spec 文字。
