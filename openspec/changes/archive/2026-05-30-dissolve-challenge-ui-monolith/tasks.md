## 1. [P] 遷移驗證：challenge-design-tokens（monolith #1、#2）

- [x] 1.1 套用後確認 `openspec/specs/challenge-design-tokens/spec.md` 併入「UnoCSS utility class 套用」與「平台雙主題套色」2 條 Requirement，且原 6 條保留。
  - [x] 涵蓋 Requirement: Challenge UI components use UnoCSS utility classes for styling
  - [x] 涵蓋 Requirement: Challenge UI applies the platform color palette
  - 驗證：`rg -c '^### Requirement:' openspec/specs/challenge-design-tokens/spec.md` 回傳 8
  - 驗證：`rg -q '#0f0f23' openspec/specs/challenge-design-tokens/spec.md && rg -q 'UnoCSS utility classes' openspec/specs/challenge-design-tokens/spec.md`

## 2. [P] 遷移驗證：challenge-browser-chrome（monolith #4、#5、#18）

- [x] 2.1 套用後確認 `openspec/specs/challenge-browser-chrome/spec.md` 併入 BrowserPanel iframe 渲染、表單攔截、dispatch/cookie-jar 3 條 Requirement，且原 3 條保留。
  - [x] 涵蓋 Requirement: Browser Panel simulates a web browser address bar and viewport
  - [x] 涵蓋 Requirement: Browser Panel intercepts HTML form submissions inside the iframe
  - [x] 涵蓋 Requirement: BrowserPanel dispatches HTTP requests to the challenge runtime
  - 驗證：`rg -c '^### Requirement:' openspec/specs/challenge-browser-chrome/spec.md` 回傳 6
  - 驗證：`rg -q 'allow-scripts allow-forms' openspec/specs/challenge-browser-chrome/spec.md && rg -q 'X-Wxlsh-Set-Cookie' openspec/specs/challenge-browser-chrome/spec.md`

## 3. [P] 遷移驗證：network-traffic-panel（monolith #7、#10）

- [x] 3.1 套用後確認 `openspec/specs/network-traffic-panel/spec.md` 併入 Repeater 原始請求編輯、BrowserPanel 模擬瀏覽器 header 2 條 Requirement，且原 7 條保留。
  - [x] 涵蓋 Requirement: Repeater Panel provides raw HTTP request editing
  - [x] 涵蓋 Requirement: BrowserPanel sends realistic browser-like HTTP requests
  - 驗證：`rg -c '^### Requirement:' openspec/specs/network-traffic-panel/spec.md` 回傳 9
  - 驗證：`rg -q 'Sec-Fetch-Site' openspec/specs/network-traffic-panel/spec.md && rg -q 'named sidebar list' openspec/specs/network-traffic-panel/spec.md`
- [x] 3.2 正規化 network-traffic-panel 既有格式缺陷（apply 時發現的 pre-existing 問題，與 challenge-ui 同病）：補 `# network-traffic-panel Specification` title + 具體 `## Purpose`、移除外洩的 `## ADDED Requirements` preamble 與重複 orphan @trace，使其符合 spec-corpus-governance。原 7 條 Requirement 不變。
  - 驗證：`head -1 openspec/specs/network-traffic-panel/spec.md` 為 `# network-traffic-panel Specification`、`rg -c '^## ADDED' openspec/specs/network-traffic-panel/spec.md` 回傳 0、`rg -q '^## Purpose' openspec/specs/network-traffic-panel/spec.md`

## 4. 遷移驗證：challenge-layout（monolith #8、#11、#12、#13 ADDED + #9 MODIFIED）

- [x] 4.1 套用後確認 `openspec/specs/challenge-layout/spec.md` 新增 white-box viewer、NotesButton、usePentestNotes/NotesModal 整合、executionId threading 4 條，且既有「Flag submit form…」條被 MODIFIED 補上 flag 提交行為與筆記匯出。
  - [x] 涵蓋 Requirement: White-box mode displays app source code viewer
  - [x] 涵蓋 Requirement: ChallengeLayout renders a NotesButton in the header
  - [x] 涵蓋 Requirement: ChallengeLayout integrates usePentestNotes and NotesModal
  - [x] 涵蓋 Requirement: ChallengeLayout threads executionId through code execution dispatch
  - [x] 涵蓋 Requirement: Flag submit form is fixed at the bottom of the left column
  - 驗證：`rg -c '^### Requirement:' openspec/specs/challenge-layout/spec.md` 回傳 17
  - 驗證：flag 條保留既有 header（`rg -q 'Flag submit form is fixed at the bottom of the left column' openspec/specs/challenge-layout/spec.md`）且 onExportNotes 僅出現於該條（`rg -c 'onExportNotes' openspec/specs/challenge-layout/spec.md` 回傳 2）
- [x] 4.2 確認 flag MODIFIED 條於 archive 後仍帶 `@trace`；若被 archive 吃掉，自 archived delta（`openspec/changes/archive/<date>-dissolve-challenge-ui-monolith/specs/challenge-layout/spec.md`）手動補回。
  - 驗證：`rg -A40 'Flag submit form is fixed at the bottom of the left column' openspec/specs/challenge-layout/spec.md | rg -c '@trace'` 至少為 1

## 5. 移除 challenge-ui monolith

- [x] 5.1 以 git rm 刪除整個 `openspec/specs/challenge-ui/` 目錄（不寫 REMOVED delta）。
  - 驗證：`test ! -d openspec/specs/challenge-ui && echo gone`

## 6. Corpus 完整性與 governance

- [x] 6.1 spec 總數由 42 收斂為 41。
  - 驗證：`ls -d openspec/specs/*/ | wc -l` 回傳 41
- [x] 6.2 無任何 spec 殘留以 capability 名稱引用 challenge-ui。
  - 驗證：`rg -l 'challenge-ui' openspec/specs/` 回傳 0
- [x] 6.3 4 個目的地 spec 皆零重複 requirement header 且含具體 `## Purpose`。
  - 驗證：對每個目的地 spec，`rg '^### Requirement:' <spec> | sort | uniq -d` 為空、`rg -q '^## Purpose' <spec>`

## 7. 純 spec 重構確認

- [x] 7.1 本 change 未更動任何 TypeScript／Vue／runtime 程式碼。
  - 驗證：`git status --porcelain` 僅顯示 openspec/ 下變更
- [x] 7.2 既有測試全綠（純 spec 重構不得破壞測試）。
  - 驗證：`pnpm test --run` exit 0
