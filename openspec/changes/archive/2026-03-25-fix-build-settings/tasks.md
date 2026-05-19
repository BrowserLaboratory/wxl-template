## 1. Cargo.lock 納入版控

- [x] 1.1 [P] 從 `.gitignore` 移除 `Cargo.lock` 規則（對應 design 決策「從 .gitignore 移除 Cargo.lock」）
- [x] 1.2 執行 `cargo generate-lockfile` 產生 `Cargo.lock` 並加入 git 追蹤

## 2. Service Worker 路徑動態化

- [x] 2.1 [P] 修改 `.vitepress/theme/index.ts` 中的 service worker 註冊路徑，從 hardcode `'/challenge-sw.js'` 改為 `` `${import.meta.env.BASE_URL}challenge-sw.js` ``（對應 design 決策「使用 VitePress useData().site.value.base 動態串接 SW 路徑」），確保 Service Worker source resides in .vitepress/workers/ 的註冊路徑支援 VitePress base path

## 3. 驗證

- [x] 3.1 確認現有測試通過，並驗證 `Cargo.lock` 已被 git 追蹤
