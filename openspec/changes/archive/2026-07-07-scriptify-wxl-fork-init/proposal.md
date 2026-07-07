## Why

`wxl-fork-init` 目前是純 prose skill：把 template repo fork／clone 成新專案時，所有機械式、確定性的編輯（package.json 身分欄位、VitePress base、swap GitHub URLs、cp deploy workflow、以及 rebrand 時約 597 處 `wxl` 短名 rename）全部交給 LLM agent 逐檔讀寫。這些都是可完全確定化的字串替換，卻花在最不值得的地方，token 成本高、且人工逐檔 rename 易誤傷 runtime 敏感鍵（localStorage `wxl-locale`、env `WXL_VERIFY_RUNTIME`、tmp `tmp/wxl-verify`、release asset `wxl-${tag}.zip`）。

目標：新增一支確定性 CLI `pnpm fork:init`，把 fork 的機械編輯 script 化；skill 瘦身成「收集意圖與參數 → 呼叫 script → 跑 Verification grep」，大幅省 token 並讓 rebrand 的敏感鍵處理可測試、可審計。

## What Changes

新增 `scripts/fork-init.ts`（`pnpm fork:init`），提供兩種確定性模式：

- **A 模式（沿用 WXL 品牌，最小 fork）**：改 package.json 身分欄位（version 重設、author、repository.url／bugs.url／homepage、license）、依 `--base` 設定或清除 VitePress `base`、更新 VitePress socialLinks 與 README／CONTRIBUTE 的 GitHub URLs、把 deploy workflow 範本複製到 `.github/workflows/deploy.yml`。
- **B 模式（rebrand 全新產品名，`--rebrand <newname>`）**：在 A 模式基礎上，對作用中檔案做分類式 `wxl` 短名 rename，並將四個 runtime 敏感鍵（localStorage key、env 變數、tmp 工作目錄、release 資產名）獨立為一類「sensitive keys」明確處理並在結尾報告；排除 lockfile、node_modules、.git、openspec/changes/archive。

`scripts/fork-init.ts` 提供 `--dry-run` 預覽、結尾列出每檔變更與敏感鍵處理摘要。以 vitest 單元測試覆蓋（尤其敏感鍵分類與 dry-run 不落地）。

`wxl-fork-init` skill 改寫為 script-driven：偵測 A／B 意圖、收集參數（new name／author／repo／base）、呼叫 `pnpm fork:init`（適當 flags）、最後跑既有 Verification grep 確認零殘留 upstream 身分。skill 仍遵循 authoring-skill-pattern（host-neutral、thin-pointer）。

## Non-Goals

- 不自動建立或 push 到 GitHub repo、不改 branch protection ruleset、不執行 `git remote` 操作。
- 不更動 `LICENSE` 條款內容或 `deploy.yml.template` 範本本身。
- 不觸及 challenge、其他 skill 或 challenge scripts 的功能。
- rebrand 不涉及圖像資產或非文字品牌素材。
- 不移除 `wxl-fork-init` skill；它保留為 script 的互動 wrapper。

## Capabilities

### New Capabilities

- `fork-init-script`: 確定性 fork／rebrand CLI（`pnpm fork:init`），涵蓋身分欄位、VitePress base、URL swap、deploy workflow 複製，以及 B 模式的分類式 rename 與 runtime 敏感鍵安全處理。

### Modified Capabilities

(none)

## Impact

- Affected specs:
  - New: fork-init-script
- Affected code:
  - New:
    - scripts/fork-init.ts
    - tests/unit/scripts/fork-init.test.ts
  - Modified:
    - package.json
    - .agent/skills/wxl-fork-init/SKILL.md
    - .agent/skills/wxl-fork-init/AGENTS.md
  - Removed: (none)
