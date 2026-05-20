## Context

`wxl-template` 目前的 CI 由兩個 workflow 構成：

- `.github/workflows/quality-gates.yml`：PR-time gate，定義 `test` 與 `build` 兩個並行 job，覆蓋 vitest／Rust-WASM tests／challenge frontmatter validation／VitePress build。**沒有任何 `permissions:` 宣告**。
- `.github/workflows/release.yml`：Tag-driven release pipeline，跑完所有 gate 後打包 zip 並建立 GitHub Release。有 `permissions: contents: write`（`softprops/action-gh-release` 需要），但所有 `uses:` 仍是 mutable tag。

兩個 workflow 共用 7 種 third-party action（`actions/checkout`、`dtolnay/rust-toolchain`、`Swatinem/rust-cache`、`jetli/wasm-pack-action`、`pnpm/action-setup`、`actions/setup-node`、`softprops/action-gh-release`）；全部指向 mutable tag（`@v4`、`@v2`、`@stable`、`@v0.4.0`），任何一個 action 作者都可以對同一個 tag 推 breaking 或惡意內容。`jetli/wasm-pack-action` 只 pin 了 action 本體版本，**沒有透過 `version:` input 鎖定其安裝的 wasm-pack 版本**，跨 run／跨 job 可能裝到不同版本。

對齊 `netsim-template/openspec/specs/quality-assurance-gates/spec.md` 的四條 hardening 要求，本 change 只 port 平台通用三條（minimal token permissions、SHA pinning、toolchain version pinning），不 port「CI quality gates enforce build-chain commands」那一條（內容是 netsim 自家業務命令，不適用 wxl）。

關鍵限制：

- `quality-gates.yml` 兩個 job 的 `name:` 即 `test`／`build`，是 `configure-branch-protection-ruleset` 那個姊妹 change 預期要綁的 required check 名稱；本 change SHALL NOT 改動 job ID。
- `release.yml` 的 `softprops/action-gh-release` 與打包步驟必須維持原行為，本 change 只動 `uses:` 與工具版本 pinning。
- 本 change 不引入 Node 22／24 matrix（被 `AUDIT.md §A.2.1` Node 24 相容性技術債阻擋）。

## Goals / Non-Goals

**Goals:**

- 讓兩個 workflow 對應到 spec `ci-quality-gates` 新增的三條 hardening Requirement，零 violation。
- 即使 `actions/checkout@v4` 等 mutable tag 在上游被改寫，wxl CI 仍因 SHA pin 而保持 reproducible。
- `quality-gates.yml` 的 `GITHUB_TOKEN` 預設僅有 `contents: read`；`release.yml` 維持 `contents: write` 並有 inline 註解說明其必要性。
- 三處 `jetli/wasm-pack-action` 統一帶 `version: 'v0.14.0'`，跨 job 安裝 wasm-pack 版本一致。
- 既有 8 條 Requirement 與兩個 workflow 的 jobs／steps 行為等價：commit 後 PR 仍跑相同的 test／build／release 流程。

**Non-Goals:**

- 不引入 Node 22/24 matrix。
- 不引入 Playwright site-smoke。
- 不引入 fork PR ephemeral key 機制（目前 repo 沒有 workflow secret）。
- 不重寫 `release.yml` 的 `generate_release_notes: true` 與後置 `gh release edit` 客製 release-note 流程。
- 不設定 GitHub repo 端 ruleset／required status checks（屬於姊妹 change `configure-branch-protection-ruleset`）。
- 不引入自動化的 SHA 升級工具（Renovate／Dependabot），保持手動審核。

## Decisions

### SHA 來源策略：先抄 netsim、其餘 `gh api` 即時解析

netsim 已驗證並寫死的 SHA 直接複用（同一族 use-template repo、同一個 hardening 標準，沒有理由各自解析不同 SHA）。netsim 沒覆蓋的兩個 action（`Swatinem/rust-cache`、`softprops/action-gh-release`），apply phase 以 `gh api /repos/<owner>/<repo>/git/ref/tags/<tag>` 解析該 tag 對應的 commit object SHA，再附 `# vN.x.y` 註解。

| Action | Tag | SHA 來源 |
| --- | --- | --- |
| `actions/checkout` | `v4.2.2` | netsim test.yml |
| `dtolnay/rust-toolchain` | `stable` | netsim test.yml |
| `jetli/wasm-pack-action` | `v0.4.0` | netsim test.yml |
| `pnpm/action-setup` | `v4.1.0` | netsim test.yml |
| `actions/setup-node` | `v4.4.0` | netsim test.yml |
| `Swatinem/rust-cache` | 最新 v2.x.y | apply phase 以 `gh api` 解析 |
| `softprops/action-gh-release` | 最新 v2.x.y | apply phase 以 `gh api` 解析 |

**替代方案**：對所有 7 個 action 都重新 `gh api` 解析最新 SHA — 拒絕，因為會跟 netsim 漂移、未來 cross-repo audit 比對成本上升。

### 註解格式統一：`uses: <owner>/<repo>@<40-char SHA> # <tag>`

每行 `uses:` 之後**強制**附 `# vN.x.y` 註解，提供人類可讀的版本資訊。違反例：只寫 SHA 沒註解，會被 spec scenario 的 grep 自我驗證攔下。

**替代方案**：用 Renovate `# renovate: datasource=...` 機讀格式 — 拒絕，目前 repo 沒裝 Renovate／Dependabot，這個格式會誤導未來維護者以為有自動升級。

### Permissions 放 workflow level，job level 不 override

`quality-gates.yml` 兩個 job 都是 read-only，故在 workflow 級宣告 `contents: read` 一次即可；不在 job level 重複宣告。`release.yml` workflow 級宣告 `contents: write`（因 `softprops/action-gh-release` 需 write 才能建立 release + 上傳 asset），亦不在 job level override。

**替代方案**：兩個 workflow 都在 job level 宣告 — 拒絕，重複宣告易漂移，spec 的 example 也偏好 workflow-level 寫法。

### wasm-pack 版本選 `v0.14.0`（與 netsim 同步）

`jetli/wasm-pack-action` 的 `version:` input 寫 `'v0.14.0'`，與 netsim 對齊。**替代方案**：寫 `'latest'` — 拒絕，違反第三條 Requirement；寫 `'v0.13.x'` — 拒絕，無理由刻意落後 netsim。

### Spec delta 用「純 ADDED」操作

`ci-quality-gates` 現有 8 條 Requirement 與本變更**互不重疊**（既有 Requirement 沒有任何一條提及 permissions／SHA／toolchain version pinning）。因此 delta 只用 `## ADDED Requirements`，不需要 MODIFIED／REMOVED／RENAMED，archive 時可直接 append 至既有 spec 末尾。

**替代方案**：把第 3、6、7 條既有 Requirement 改寫成更嚴格版本 — 拒絕，行為相同的 Requirement 應該分層而不是融合，未來才能單獨溯源。

## Implementation Contract

**Observable behavior（apply 完成後）**：

- `gh workflow view quality-gates.yml` 與 `gh workflow view release.yml` 都能 parse、PR-time 與 tag-driven 跑出來的 job 結果與 hardening 前等價（除了 GITHUB_TOKEN 在 `quality-gates.yml` 從預設權限降為 `contents: read`）。
- GitHub Actions UI 的 job summary 會 surface declared permissions；reviewer 從 workflow run 頁面可看到 `Permissions: contents: read`（或 `contents: write` for release）。
- 同一 PR 在 fork 與 internal 兩種來源跑出來的 wasm-pack 版本一致（皆為 v0.14.0）。

**Interface / data shape**：

- workflow YAML 內每行 `uses:` 形如 `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2`（40-char lowercase hex SHA + 一個半形空白 + `#` + 一個半形空白 + tag）。
- `permissions:` block 為 YAML mapping、key 為 `contents`、value 為 `read` 或 `write`。
- `jetli/wasm-pack-action` 的 `with:` block 內 `version: 'v0.14.0'`（含單引號）。
- 新增三條 spec Requirement 在 `openspec/specs/ci-quality-gates/spec.md` 末尾以 `### Requirement:` 開頭、每條至少一個 `#### Scenario:`、皆為 SHALL／MUST 句式（純英文）。

**Failure modes**：

- 若 apply phase `gh api` 解析 `Swatinem/rust-cache` 或 `softprops/action-gh-release` 失敗（網路／rate limit），SHALL halt apply 並要求人工提供 SHA；不得 fallback 到 mutable tag。
- 若 actionlint 對改寫後 workflow 報 error，SHALL 修到 0 error 才繼續；不得 ignore。

**Acceptance criteria**：

- `rg '@v[0-9]+(\.[0-9]+)*$' .github/workflows/` 無 match。
- `rg -n 'uses:' .github/workflows/` 每行右側皆為 40-char hex + ` # ` + `vN.x.y`（或 `stable`，對應 `dtolnay/rust-toolchain`）。
- `rg -n 'permissions:' .github/workflows/` 各 workflow 至少出現一次。
- `rg -nC1 'jetli/wasm-pack-action' .github/workflows/` 每個出現點下方都有 `version: 'v0.14.0'`。
- `spectra validate harden-ci-workflows` 通過、`spectra analyze harden-ci-workflows --json` 為 0 Critical / 0 Warning。
- 在 feature branch push 一個 trivial commit，`quality-gates` workflow 的 `test`／`build` 兩個 job 仍 PASS、job summary 顯示新 permissions。

**Scope 邊界**：

- In scope：兩個 workflow 的 `uses:` SHA pin、`permissions:` 宣告、`jetli/wasm-pack-action` `version:` input、spec 新增三條 Requirement。
- Out of scope：jobs／steps 結構、Node matrix、Playwright、fork PR secret 機制、`release.yml` 打包與 release-note 步驟、`configure-branch-protection-ruleset` 範圍內的所有 repo settings 變更。

## Risks / Trade-offs

- 維護負擔上升：未來升級 action 版本需手動查 SHA。 → 部分緩解：sister repo netsim 已採同模式；可在 `CONTRIBUTE.md` 補一段「Upgrading pinned actions」即可（不在本 change scope，列入後續 follow-up）。
- 與 netsim SHA 漂移：若 netsim 將來升 `actions/checkout@v4.3.0`，wxl 不會自動跟進。 → 接受，兩 repo 升級節奏本來就不需強耦合。
- `wasm-pack@v0.14.0` 與 wxl 既有 Rust／WASM 程式碼相容性：經 netsim 完整 build／test 已驗證；wxl 與 netsim 共用 `simnet-engine`-style 結構，相容性風險低。 → 接受。
- `Swatinem/rust-cache` 與 `softprops/action-gh-release` 的 v2.x.y 最新 SHA 在 apply phase 才解析：如果 apply 與 propose 中間（>1 個月）這兩個 repo 推新 patch，SHA 會與本 design 的「預期最新版」不同。 → 接受，本 design 不寫死具體 SHA、apply phase 即時解析才是正確策略。

## Migration Plan

- 不需要 migration：兩 workflow 改寫對 PR contributors／downstream use-template 衍生 repo 完全透明（除了 GITHUB_TOKEN 權限降為 read，這是預期效果）。
- 回滾路徑：若 SHA 後實際跑出 regression，`git revert` 本 change 的 commit 即可回到 mutable tag 狀態。
- 後續：姊妹 change `configure-branch-protection-ruleset` 落地後，會把 `test`／`build` 這兩個 job 名稱綁定到 main branch 的 required status checks；本 change 維持 job ID 不變即可。

## Open Questions

- `Swatinem/rust-cache` 與 `softprops/action-gh-release` 是否要鎖到比 v2 更具體的 v2.x.y patch（例如 v2.8.0／v2.4.0），由 apply phase 解 `gh api` 時決定並寫進 commit message。
