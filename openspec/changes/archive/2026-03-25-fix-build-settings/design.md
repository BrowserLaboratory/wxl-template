## Context

兩項獨立的建置設定問題：

1. `.gitignore` 第 67 行忽略 `Cargo.lock`。對於 application-type workspace（產出的是最終 WASM binary，非 library），Rust 官方建議 commit `Cargo.lock` 以確保可重現建置。
2. `.vitepress/theme/index.ts` 第 31 行將 Service Worker 路徑 hardcode 為 `'/challenge-sw.js'`。若 VitePress 設定了 `base` 子路徑（如 `/seclab/`），service worker 會 404。

## Goals / Non-Goals

**Goals:**

- 將 `Cargo.lock` 從 `.gitignore` 移除並納入版控
- Service Worker 註冊路徑支援 VitePress `base` 配置

**Non-Goals:**

- 不修改 `Cargo.lock` 的實際內容（由 cargo 管理）
- 不改變 Service Worker 的行為邏輯

## Decisions

### 從 .gitignore 移除 Cargo.lock

直接刪除 `.gitignore` 中的 `Cargo.lock` 行。之後執行 `cargo generate-lockfile`（或下次 `cargo build`）會自動產生 `Cargo.lock`，然後將其加入 git。

### 使用 VitePress useData().site.value.base 動態串接 SW 路徑

在 `enhanceApp` 中改用 `import.meta.env.BASE_URL` 串接 service worker 路徑：

```typescript
navigator.serviceWorker.register(`${import.meta.env.BASE_URL}challenge-sw.js`)
```

替代方案：使用 VitePress 的 `withBase()` helper — 但 `withBase()` 需要在 Vue component context 中使用，而 `enhanceApp` 不在 component context 中。`import.meta.env.BASE_URL` 由 Vite 在建置時注入，適合在任何地方使用。

## Risks / Trade-offs

- [風險] 首次 commit `Cargo.lock` 會是一個較大的檔案差異 → 一次性成本，後續只有 dependency 變動時才會改變
- [風險] `import.meta.env.BASE_URL` 在 SSR context 中可能不可用 → 已有 `typeof navigator !== 'undefined'` 守衛，SSR 時不會執行此段程式碼
