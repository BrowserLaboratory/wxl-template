## Why

兩項建置設定問題影響可重現性與可攜性：(1) `.gitignore` 忽略了 `Cargo.lock`，導致 CI 與不同開發者之間的 WASM 建置可能產出不同結果；(2) Service Worker 的註冊路徑 hardcode 為 `'/challenge-sw.js'`，一旦 VitePress 設定 `base` 子路徑部署就會 404。

## What Changes

- 從 `.gitignore` 移除 `Cargo.lock` 規則，將 `Cargo.lock` 納入版控以確保可重現建置
- 將 Service Worker 註冊路徑改為使用 VitePress 的 `withBase()` helper 或 `import.meta.env.BASE_URL` 動態串接

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `service-worker-router`：Service Worker 註冊路徑需支援 VitePress base 子路徑

## Impact

- 受影響檔案：`.gitignore`、`Cargo.lock`（新增追蹤）、`.vitepress/theme/index.ts`
- 受影響 spec：`service-worker-router`
