## Context

目前 PHP runtime 對 request context 的規格與實作不一致：較早的 spec 要求 `$_COOKIE`，後續 requirement 又只記錄 `$_GET`、`$_POST` 與 `_RAW_INPUT`；測試則幾乎只保護 GET/POST 基本行為。正式版本需要一個可預測的 PHP request model，否則 challenge 作者無法知道哪些 superglobals 可以依賴。

## Goals / Non-Goals

**Goals:**

- 收斂 PHP runtime 每次 request 會建立哪些 superglobals。
- 決定 `Cookie` header 與 `$_COOKIE` 的對應規則，並補上測試。
- 明確寫下 `php-wasm` 對 response header 的限制。

**Non-Goals:**

- 不實作 `$_FILES`、session、multipart upload parsing 或完整 SAPI。
- 不修改 `php-wasm` upstream。
- 不變更 PHP runtime 的 singleton 初始化策略。

## Decisions

### Supported PHP superglobals

每次 request 執行前，runtime 將填充 `$_SERVER`、`$_GET`、`$_POST`、`$_COOKIE` 與 `$GLOBALS['_RAW_INPUT']`。`$_POST` 僅對 `application/x-www-form-urlencoded` 的 POST request 生效；其他 request body 類型保留在 `_RAW_INPUT`。

### Cookie parsing and normalization

runtime 將從 `Cookie` header 解析 `name=value` 配對，以分號切分、去除前後空白、保留原始字串值，不做額外解碼。若同名 cookie 重複出現，最後出現的值將覆蓋前值，使 `$_COOKIE` 保持單值 map。

### Upstream header limitations

`php-wasm` 目前不會把 PHP `header()` 輸出回傳給 adapter，因此 runtime 仍以固定 `Content-Type: text/html` 與空的 adapter headers contract 為準。規格會把這件事明確寫為已知限制，而不是留成未定義行為。

## Risks / Trade-offs

- [Risk] 這個 contract 仍然比真實 PHP SAPI 簡化。 → Mitigation: spec 會明確列出支援與不支援範圍，避免作者誤用。
- [Risk] Cookie parsing 若和作者直覺不同，容易造成 challenge 行為差異。 → Mitigation: 以單值 map 規則寫入 spec 與 tests，讓行為可預測。

## Migration Plan

1. 先補 spec 與 tests，固定 request model。
2. 再更新 `usePhpRuntime.ts` 依規格組裝 superglobals。
3. 以 unit tests 驗證 GET、POST、JSON body 與 cookies。

## Open Questions

- 若後續 challenge 需要 multipart upload 或 `$_FILES`，應另開 change 擴充，不在本 change 偷渡。
