## Context

共享 runtime 的 active specs 同時保留了來自多個 archived changes 的平行描述，造成相同能力在規格上出現互斥版本。實作目前已經形成一套明確分工：ChallengeLayout 內部以 `trackedDispatch` 直呼 runtime，BrowserPanel 透過 postMessage interceptor 維持瀏覽器感的 UI，Service Worker 保留 challenge-origin fetch/nav 的攔截路徑，而 Python runtime 的 request translation 由 `usePythonRuntime.ts` 內嵌 bridge 實作。

## Goals / Non-Goals

**Goals:**

- 讓共享 runtime 的 spec 可以獨立描述真實平台契約。
- 消除 `challenge-ui`、`challenge-framework`、`python-asgi-runtime`、`service-worker-router` 之間的重複與互斥敘述。
- 讓後續 release-readiness change 可以依賴單一版本的共享 runtime contract。

**Non-Goals:**

- 不在本 change 中改寫 ChallengeLayout 的執行架構。
- 不處理單一 challenge 內容、flag 邏輯或 release workflow gate。
- 不把 `docs/public/challenge-sw.js` 與 `.vitepress/workers/router.ts` 合併成單一檔案。

## Decisions

### Canonical request path ownership

共享 runtime 需要同時描述兩條路徑：一條是 Browser、Repeater、Terminal、Code panels 透過 injected dispatch 直接呼叫 runtime；另一條是 Service Worker 攔截 challenge-origin fetch/navigation 後，透過 `REGISTER_CHALLENGE` 的 MessagePort relay 到頁面。規格將明確指出 UI panel dispatch 不依賴 fetch interception，但 challenge-origin 的真實瀏覽器請求仍由 Service Worker contract 覆蓋。

### Frontmatter compatibility model

frontmatter 的 canonical schema 以 `title`、`backend`、`app` 為必填，`wasmModule` 為 build pipeline 自動注入，`fs` 為 migration 期間保留的 deprecated compatibility field。規格不再把已下放到 per-challenge WASM payload 的 key material 欄位當成前端可宣告欄位。

### Python bridge authority

Python runtime 的 request translation contract 以 `.vitepress/theme/composables/usePythonRuntime.ts` 內的 inline bridge 為準。`chall-wasm/asgi-bridge/` 可以保留作為相關 WASM utility code，但 active runtime spec 不再把它描述成 challenge request 的 canonical execution path。

## Risks / Trade-offs

- [Risk] 這次以規格收斂既有行為，若實作暗藏未被測試覆蓋的分支，spec 可能會把偶然行為誤寫成正式 contract。 → Mitigation: tasks 會要求對照現有 unit/e2e 測試並補充缺口。
- [Risk] 現有 active specs 已有重複 requirement header，未來 archive 時容易產生人工衝突。 → Mitigation: 這個 change 只修改共享 runtime 所需的 requirement，實作時需在 archive 前人工檢查最終合併結果。

## Migration Plan

1. 先更新共享 runtime 規格與 trace，固定 canonical contract。
2. 對照現有 Vue/runtime/router tests 確認規格沒有偏離實作。
3. 若在整理規格時發現實作與目標 contract 不一致，再拆出後續 implementation change。

## Open Questions

- `docs/public/challenge-sw.js` 與 `.vitepress/workers/router.ts` 長期是否要維持 mirror relationship，還是之後改成單一來源生成，留待後續架構 change 判斷。
