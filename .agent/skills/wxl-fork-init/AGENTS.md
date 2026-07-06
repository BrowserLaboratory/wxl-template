# Host Agent Compatibility Notes — wxl-fork-init

本檔列三家官方 host agent（authoring-skill-pattern capability「Official supported agent matrix」Requirement 規定）對本 skill 的 invocation 慣例與已知差異。新增官方 host 須走獨立 change 更新該 Requirement。

## Official agent matrix

| Host agent | Thin pointer path | 啟動方式（一般慣例） |
|------------|-----------------------------------------------|----------------------|
| Claude Code | `.claude/skills/wxl-fork-init/SKILL.md` | 自動 skill discovery；亦可由使用者輸入 `/wxl-fork-init` 觸發 |
| Codex CLI  | `.codex/skills/wxl-fork-init/SKILL.md` | session 啟動時載入 skill discovery；對話內以關鍵字觸發 |
| Gemini CLI | `.gemini/skills/wxl-fork-init/SKILL.md` | 透過 activate_skill 工具觸發；session 啟動載入 metadata |

## Relationship to CLIs

| Tool / skill | Relationship |
|--------------|--------------|
| `pnpm fork:init` (`scripts/fork-init.ts`) | 本 skill 的核心：收集意圖與參數後呼叫它做確定性 fork 編輯（身分欄位、base、URL swap、deploy workflow、B 模式 rebrand rename）。skill prose 不重述其編輯細節，也不繞過它手改檔案。 |
| `.agent/skills/wxl-fork-init/deploy.yml.template` | GitHub Pages 部署 workflow 範本，由 `pnpm fork:init` 複製到 `.github/workflows/deploy.yml`。 |

## 已知 host-specific 差異

- **互動式問答**：本 skill 不使用任何 host-specific 互動 primitive。需要使用者決策時（A 沿用品牌 vs B rebrand、部署到哪決定 `base`），以純文字選項呈現，等使用者直接回覆。
- **背景任務 / 平行執行**：本 skill 不假設 host agent 支援背景或平行執行；流程為順序性的參數收集、CLI 呼叫與驗證命令。
- **檔案讀寫**：確定性編輯一律交給 `pnpm fork:init`（透過 Bash 呼叫）；skill 本身只用 Bash / Read / Grep 做參數收集與驗收。不假設 host-specific IDE 工具。
- **路徑解析**：所有檔案路徑相對 repo root；`pnpm fork:init` 亦以 repo root 為 cwd。

## File layout

```
.agent/skills/wxl-fork-init/
├── SKILL.md              # Canonical prose (script-driven wrapper)
├── AGENTS.md             # This file
└── deploy.yml.template   # GitHub Pages deploy workflow, copied by pnpm fork:init
```

## Cross-runtime 驗證

在三家 host agent 內各觸發一次本 skill，預期等價地收集參數並呼叫 `pnpm fork:init`（容許各家自然 rendering 差異），且不因 host-specific 工具缺失而失敗。SKILL.md 的 Verification 段（`git grep` 殘留檢查 + `pnpm build` 預覽 + host-neutral grep）為跨 runtime 共通的 acceptance criteria。
