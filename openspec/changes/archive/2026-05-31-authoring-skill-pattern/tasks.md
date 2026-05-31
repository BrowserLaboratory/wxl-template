## 1. 建立 starter template 四件套

- [x] 1.1 [P] 撰寫 `.agent/skills/_template/SKILL.md` canonical source 範本（落實 design.md「Starter template 放置於 `.agent/skills/_template/`」決策），依「Authoring skill canonical source location」與「Host-agent-neutral skill prose」Requirement 提供作者複製即用的 frontmatter 範例（`name` / `description` 兩 key）、章節骨架（Overview / Workflow / Anti-patterns / Verification）、forbidden primitive 註解警告 — verification: `ls .agent/skills/_template/SKILL.md` 存在、`wc -l < .agent/skills/_template/SKILL.md` 回傳 ≥ 30、`git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/_template/SKILL.md` 退出碼 1（0 命中）
- [x] 1.2 [P] 撰寫 `.agent/skills/_template/AGENTS.md` host compatibility 註記範本，依「Official supported agent matrix」Requirement 與 design.md「Agent matrix = Claude Code / Codex CLI / Gemini CLI」決策列三家 host agent 的 invocation 慣例與已知差異 — verification: `ls .agent/skills/_template/AGENTS.md` 存在、`grep -c "Claude Code" .agent/skills/_template/AGENTS.md` 與 `grep -c "Codex CLI" .agent/skills/_template/AGENTS.md` 與 `grep -c "Gemini CLI" .agent/skills/_template/AGENTS.md` 皆 ≥ 1、`wc -l < .agent/skills/_template/AGENTS.md` ≥ 15
- [x] 1.3 [P] 撰寫 `.agent/skills/_template/INSTALL.md` 安裝指南範本，依「Thin pointer files for each official host agent」Requirement 提供三家 thin pointer 路徑安裝步驟、`POINTER.template.md` 套用方法、`git grep` 驗證指令範例 — verification: `ls .agent/skills/_template/INSTALL.md` 存在、含 `.claude/skills/<skill-name>/SKILL.md`、`.codex/skills/<skill-name>/SKILL.md`、`.gemini/skills/<skill-name>/SKILL.md` 三條 path 字面命中、含 `git grep` 字面命中
- [x] 1.4 [P] 撰寫 `.agent/skills/_template/POINTER.template.md` thin pointer body 範本，依「Thin pointer files for each official host agent」Requirement body ≤ 3 行（不含 frontmatter）、含 `<SKILL-NAME>` placeholder、明文標示「先替換 `<SKILL-NAME>` 再複製到 `.claude/.codex/.gemini` 對應 path」 — verification: `awk '/^---$/{c++;next} c>=2' .agent/skills/_template/POINTER.template.md | grep -v '^$' | wc -l` ≤ 3、`grep -c '<SKILL-NAME>' .agent/skills/_template/POINTER.template.md` ≥ 1

## 2. 確認 starter template 未被當 active skill 載入

- [x] 2.1 驗證 starter template 未在任何官方 host agent path 出現 thin pointer，落實「Starter template is not activated as a skill」Requirement — verification: `ls .claude/skills/_template .codex/skills/_template .gemini/skills/_template 2>&1 | grep -c "No such file"` 回傳 3

## 3. 全 starter template forbidden primitive 掃描

- [x] 3.1 對整 `.agent/skills/_template/` 目錄做 forbidden primitive 全掃，呼應「Starter template location and required contents」Requirement 的 Template body 子 Scenario 與「Host-agent-neutral skill prose」Requirement — verification: `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/_template/` 退出碼 1（0 命中）

## 4. wxl-creator-skill 既有 Req 維持原文驗證

- [x] 4.1 驗證本 change 未動 `openspec/specs/wxl-creator-skill/spec.md`，落實 design.md「wxl-creator-skill 既有 Req #9 / #10 維持原文」決策、避免 sibling-clobber 風險 — verification: `git diff main -- openspec/specs/wxl-creator-skill/spec.md` 為空（本 change branch 的 diff 不應觸及該檔）

## 5. spectra 收尾驗證

- [x] 5.1 `spectra validate authoring-skill-pattern` 為綠，落實 design.md「Starter template 四件套」決策的完工標準 — verification: `spectra validate authoring-skill-pattern` exit code 0、stdout/stderr 無 ERROR 行
- [x] 5.2 確認新 capability spec 已準備就緒可進 archive，呼應「Authoring skill canonical source location」Requirement 的 spec 落地 — verification: `ls openspec/changes/authoring-skill-pattern/specs/authoring-skill-pattern/spec.md` 存在；archive 後 `ls openspec/specs/authoring-skill-pattern/spec.md` 存在、`ls openspec/specs/ | wc -l` 從 41 → 42
