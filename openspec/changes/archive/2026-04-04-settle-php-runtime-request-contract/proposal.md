## Why

`php-runtime` spec 與 `usePhpRuntime.ts` 對 request context 的契約仍未收斂，尤其是 `$_COOKIE` 是否存在、從哪裡填入、哪些 superglobals 受支援都不明確。測試目前只覆蓋 GET/POST 基本路徑，正式 release 前需要一個可測且可依賴的 PHP request model。

## What Changes

- 定義 PHP runtime 支援的 request superglobals 集合，包含 `$_GET`、`$_POST`、`$_SERVER`、`_RAW_INPUT` 與 `$_COOKIE` 的來源與填充規則。
- 讓 `usePhpRuntime.ts` 依該 contract 從 URL、request body 與 `Cookie` header 建立一致的 PHP 執行環境。
- 補齊 unit tests，覆蓋 query、body、cookie、header 邊界，並明確記錄 `header()` 無法由 `php-wasm` 暴露的既知限制。

## Non-Goals (optional)

- 不在本 change 中導入完整 web server emulation、session support 或 `$_FILES` 上傳處理。
- 不嘗試解決 `php-wasm` upstream 尚未提供的 response header capture 能力。
- 不調整非 request-context 類型的 PHP runtime 行為。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `php-runtime`: 收斂 request context、cookie injection 與測試保護範圍。

## Impact

- Affected specs: `php-runtime`
- Affected code: `.vitepress/theme/composables/usePhpRuntime.ts`, `tests/unit/composables/usePhpRuntime.test.ts`, `tests/unit/composables/usePhpRuntime-post.test.ts`, `tests/unit/composables/usePhpRuntime-headers.test.ts`
