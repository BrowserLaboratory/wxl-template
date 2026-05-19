## 1. Shared runtime request path

- [x] 1.1 更新 `challenge-ui` 的 "ChallengeLayout provides three switchable interaction panels"、"Browser Panel simulates a web browser address bar and viewport"、"Browser Panel intercepts HTML form submissions inside the iframe"、"BrowserPanel dispatches HTTP requests to the challenge runtime" requirement，落實 Canonical request path ownership。
- [x] 1.2 更新 `service-worker-router` 的 "Service Worker intercepts challenge-*.localhost requests"、"Router dispatches to correct runtime based on challenge type"、"Challenge page registers itself with the Service Worker" requirement，落實 Canonical request path ownership。

## 2. Frontmatter and Python bridge

- [x] 2.1 更新 `challenge-framework` 的 "Frontmatter schema defines challenge metadata" requirement，落實 Frontmatter compatibility model。
- [x] 2.2 更新 `python-asgi-runtime` 的 "ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app"、"ASGI bridge collects response events and returns HTTP response"、"Runtime handles HTTP request dispatch" requirement，落實 Python bridge authority。

## 3. Verification

- [x] 3.1 對照 `.vitepress/theme/layouts/ChallengeLayout.vue`、`docs/public/challenge-sw.js`、`.vitepress/theme/composables/usePythonRuntime.ts` 與相關測試，確認 Canonical request path ownership、Frontmatter compatibility model、Python bridge authority 與 active spec 完全一致。
