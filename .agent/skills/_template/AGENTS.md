# Host Agent Compatibility Notes — <SKILL-NAME>

本檔列三家官方 host agent（authoring-skill-pattern capability「Official supported agent matrix」Requirement 規定）對本 skill 的 invocation 慣例與已知差異。新增官方 host 須走獨立 change 更新該 Requirement。

## Official agent matrix

| Host agent | Thin pointer path                              | 啟動方式（一般慣例） |
|------------|-----------------------------------------------|----------------------|
| Claude Code | `.claude/skills/<SKILL-NAME>/SKILL.md`        | 自動 skill discovery；亦可由使用者輸入 `/<SKILL-NAME>` 觸發 |
| Codex CLI  | `.codex/skills/<SKILL-NAME>/SKILL.md`         | session 啟動時載入 skill discovery；對話內以關鍵字觸發 |
| Gemini CLI | `.gemini/skills/<SKILL-NAME>/SKILL.md`        | 透過 activate_skill 工具觸發；session 啟動載入 metadata |

## 已知 host-specific 差異

- **互動式問答**：本 skill 不使用 host-specific 互動 primitive。需要使用者選項時，輸出純文字選單並等使用者直接回覆（不依賴 host agent 提供的互動工具）。
- **背景任務 / 平行執行**：本 skill 不假設 host agent 支援背景或平行 subagent 派發。若步驟有「可平行」性質，描述為 prompt-level guidance 即可，由各 host agent 自行決定執行策略。
- **檔案讀寫**：一律走 Bash / Read / Write / Edit（三家共有）。不假設 host-specific IDE 工具。
- **路徑解析**：所有檔案路徑相對 repo root，禁止假設 host agent 內建特定 cwd。

## Cross-runtime 驗證

啟動 skill 在三家 host agent 內各跑一次，預期得到「等價產出」（容許各家自然 rendering 差異），且不因 host-specific 工具缺失而失敗。

驗證命令：

    # 在每家 host agent session 內手動跑：
    # 1. 觸發 <SKILL-NAME> skill
    # 2. 對照 SKILL.md Verification 段 acceptance criteria 逐條檢查
