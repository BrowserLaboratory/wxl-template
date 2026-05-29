## Context

P3.1 spec consolidation 審視確認：`python-asgi-runtime`（9 條）與 `php-runtime`（5 條）描述同一套「在瀏覽器內執行挑戰題後端程式碼」的 runtime 契約，且在「每 session 初始化一次」「執行前掛載 virtual filesystem」「runtime 模組置於 `.vitepress/theme/composables`」三處需求逐條平行、內容重複。`fastapi-challenge`（1 條）非獨立 runtime，僅斷言「存在可用 FastAPI demo」，FastAPI 本就跑在 ASGI runtime 上。本 change 把三者收斂為單一 `challenge-runtimes` capability。此為 P3.1「完整 consolidation」兩個 change 中的 Change A（runtime family）；Change B（challenge-ui cluster）另案處理。

## Goals / Non-Goals

**Goals:**

- 以單一 `challenge-runtimes` spec 取代 `python-asgi-runtime` + `php-runtime` + `fastapi-challenge`，共用契約只敘述一次、各 runtime 專屬需求保留。
- 完整保留三來源 spec 的所有 Requirement 語意與 Scenario（不得遺漏行為）。
- canonical capability 由 44 降為 42（移除 3、新增 1）。

**Non-Goals:**

- 不更動任何 runtime 程式碼或其行為（`.vitepress/theme/composables` 下之 Python／PHP runtime 模組、`chall-wasm/php-bridge` 等皆不碰）；本 change 純 spec 重構。
- 不動 `requests-shim`（界線清楚、跨 backend 使用，維持獨立 capability）。
- 不處理 challenge-ui cluster（屬 Change B）。
- 不更動 `challenge-markdown-injection`、`wasm-source-loading` 等原子 spec。

## Decisions

- **D1：以「新增 capability」而非「rename 既有」實作**。`challenge-runtimes` 為全新 capability，spec delta 用 `## ADDED Requirements`（archive 對 ADDED 處理乾淨）。不重用／rename `python-asgi-runtime`（header／capability rename 是 archive 半自動坑）。
- **D2：三個舊 capability 以 `git rm` 目錄方式移除，不以 REMOVED delta 表達**。理由：Spectra delta 模型無「刪整個 capability」的乾淨操作，且 archive 對 REMOVED 常回報 removed:0 不套用（見記憶中 main-only-branch-flow 坑）。故 proposal Capabilities 段只列 `challenge-runtimes`（避免 analyzer 要求 REMOVED delta），三者移除於 apply 階段以刪除 spec 目錄完成、並於 archive 後逐項驗證。
- **D3：Requirement 對應（15 → 12）**。共用三條吸收雙方 scenario；其餘維持各 runtime 專屬：
  - 共用 R1「Challenge runtime initializes once per challenge session」← python「Pyodide app initialized once」+ php「PHP Runtime initialized once」。
  - 共用 R2「Challenge runtime mounts the virtual filesystem before executing app code」← python「Virtual FS mounted into Pyodide」+ python「initializes virtual filesystem from encrypted entries（nested dir）」+ php「Virtual FS mounted into php-wasm」。
  - 共用 R3「Challenge runtime modules reside in `.vitepress/theme/composables`」← python「module resides」+ php「module resides」的模組位置部分。
  - Python 專屬：WSGI/ASGI 轉譯、response 正規化、initialize()+micropip 簽章、cookie/header 傳輸 dispatch、E2E mock 完整性。
  - PHP 專屬：php-wasm 執行與請求情境、superglobals 由 method/body 填充、initialize() 簽章。
- **D4：fastapi-challenge 折為 Python-ASGI/FastAPI 需求**「Python ASGI runtime supports FastAPI apps with BASE_PACKAGES and the packages frontmatter」，保留其 4 個 scenario（頁面載入、HTTP 回應、無 packages 用 BASE_PACKAGES 預設、合併額外 packages）。
- **D5：Purpose 處理**。archive 為新 capability 產生的 placeholder Purpose 須於 archive 後手動改為具體 Purpose（spec-corpus-governance 要求）。

## Implementation Contract

- **Behavior（可觀察結果）**：`openspec/specs/challenge-runtimes/spec.md` 存在且含上述 12 條 Requirement 與全部來源 scenario；`openspec/specs/python-asgi-runtime/`、`openspec/specs/php-runtime/`、`openspec/specs/fastapi-challenge/` 三目錄不復存在；`openspec/specs/requests-shim/spec.md` 不變；runtime 程式碼與其單元/E2E 測試行為不變。
- **Interface / data shape**：spec 文件（normative SHALL/WHEN/THEN）。被保留的程式介面契約（如 `PythonRuntime.initialize(appCode, fsEntries, packages)`、`PhpRuntime.initialize(appCode, fsEntries)`、`handleRequest(request)`、`BASE_PACKAGES` for fastapi = `['fastapi','anyio','sqlite3']`）原文照搬進新 spec。
- **Failure modes**：archive 對新 capability 可能 (a) 產生 placeholder Purpose、(b) 動到檔尾換行；apply 後刪目錄若 spectra 狀態未同步亦須驗。皆以 archive 後手動 reconcile 處理。
- **Acceptance criteria**：(1) `ls openspec/specs/ | wc -l` = 42；(2) `rg -n "^### Requirement:" openspec/specs/challenge-runtimes/spec.md` 數量 = 12；(3) `rg -l "(python-asgi-runtime|php-runtime|fastapi-challenge)" openspec/specs/ -g '!**/challenge-runtimes/**'` 0 命中（capability 名稱不再被引用，code 檔名巧合不算）；(4) `challenge-runtimes` 有具體 Purpose、非 placeholder；(5) `pnpm test` 全綠（runtime 程式碼未動，測試應不受影響）。
- **Scope boundaries**：in scope＝`openspec/specs/` 下 spec 檔（新增 challenge-runtimes、刪除三舊 capability 目錄）。out of scope＝任何 `.ts`／`.vue`／runtime 程式碼、`requests-shim`、challenge-ui cluster、原子 spec。

## Risks / Trade-offs

- **archive 重災區**：移除整個 capability 無 Spectra 原生支援，採 git rm + 手動驗證；archive 後必跑 acceptance criteria 全項，不可信 "Specs applied" 摘要。
- **dedup vs 保真**：共用三條改寫為 runtime-agnostic 措辭、雙方 scenario 併陳，須逐一核對來源 scenario 無遺漏。
- **Purpose placeholder**：新 capability 經 archive 可能帶 placeholder Purpose，違反 spec-corpus-governance，須手動補具體 Purpose。
