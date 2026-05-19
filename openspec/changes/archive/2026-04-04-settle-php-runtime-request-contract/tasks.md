## 1. Runtime contract

- [x] 1.1 在 `usePhpRuntime.ts` 實作 Supported PHP superglobals 與 Cookie parsing and normalization，滿足 "PHP Runtime executes challenge PHP code via php-wasm" 與 "PHP Runtime handles HTTP request method and body"。
- [x] 1.2 更新 `php-runtime` spec，將 Upstream header limitations 與 "PHP Runtime executes challenge PHP code via php-wasm"、"PHP Runtime handles HTTP request method and body" 對齊。

## 2. Verification

- [x] 2.1 擴充 `usePhpRuntime` 相關單元測試，驗證 Supported PHP superglobals、Cookie parsing and normalization、Upstream header limitations 與兩個 requirement 的 cookie/body 邊界行為。
