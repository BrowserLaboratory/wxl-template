# 安裝指南 — <SKILL-NAME>

本檔說明把 starter template 複製到新 skill 後，如何在三家官方 host agent path 建立 thin pointer，並驗證符合 authoring-skill-pattern capability 全部 Requirement。

## Step 1：複製 starter template 到新 skill 名

    cp -r .agent/skills/_template .agent/skills/<SKILL-NAME>
    cd .agent/skills/<SKILL-NAME>

把所有檔案內的字串 `<SKILL-NAME>` 替換為實際 skill 名（kebab-case）。

## Step 2：撰寫 canonical source

依 SKILL.md 4 章節骨架（Overview / Workflow / Anti-patterns / Verification）撰寫 canonical 內容。

## Step 3：在三家 host agent path 建 thin pointer

每家 path 各複製一份 POINTER.template.md，body 必須 ≤ 3 行（不含 frontmatter），格式範例：

    Read .agent/skills/<SKILL-NAME>/SKILL.md for the canonical skill content.

三條 thin pointer 路徑：

- `.claude/skills/<SKILL-NAME>/SKILL.md`
- `.codex/skills/<SKILL-NAME>/SKILL.md`
- `.gemini/skills/<SKILL-NAME>/SKILL.md`

實際操作：

    mkdir -p .claude/skills/<SKILL-NAME> .codex/skills/<SKILL-NAME> .gemini/skills/<SKILL-NAME>
    cp .agent/skills/<SKILL-NAME>/POINTER.template.md .claude/skills/<SKILL-NAME>/SKILL.md
    cp .agent/skills/<SKILL-NAME>/POINTER.template.md .codex/skills/<SKILL-NAME>/SKILL.md
    cp .agent/skills/<SKILL-NAME>/POINTER.template.md .gemini/skills/<SKILL-NAME>/SKILL.md

複製完畢後，分別編輯三個 pointer，frontmatter 依各 host 慣例調整（name / description），body 保持 ≤ 3 行單一指令。

## Step 4：驗證

### 4.1 thin pointer body ≤ 3 行

    for p in .claude/skills/<SKILL-NAME>/SKILL.md .codex/skills/<SKILL-NAME>/SKILL.md .gemini/skills/<SKILL-NAME>/SKILL.md; do
      echo "=== $p ==="
      awk '/^---$/{c++;next} c>=2' "$p" | grep -v '^$' | wc -l
    done
    # 每條應 ≤ 3

### 4.2 host-agent-neutral 措辭

把下方 `<FORBIDDEN-PATTERN>` 替換為 `openspec/specs/authoring-skill-pattern/spec.md` 「Host-agent-neutral skill prose」Requirement 中列舉的 forbidden primitive 完整 regex（pipe 分隔），再執行：

    git grep -nE '<FORBIDDEN-PATTERN>' .agent/skills/<SKILL-NAME>/
    # exit code 1 = 0 命中 = 通過

### 4.3 _template 不被當 active skill

    ls .claude/skills/_template .codex/skills/_template .gemini/skills/_template 2>&1 | grep -c "No such file"
    # 應回傳 3（落實「Starter template is not activated as a skill」Requirement）

### 4.4 spec 對齊

authoring-skill-pattern capability 的多數 Requirement 已由 4.1–4.3 涵蓋（thin pointer body ≤ 3 行、host-agent-neutral 措辭、`_template` 未被啟用）。再補一項「Minimum source files」Requirement 的檢查，確認 canonical `SKILL.md` 與 `AGENTS.md` 皆存在：

    test -f .agent/skills/<SKILL-NAME>/SKILL.md && test -f .agent/skills/<SKILL-NAME>/AGENTS.md \
      && echo "OK: canonical 最小 source 檔齊全" || echo "FAIL: 缺 SKILL.md 或 AGENTS.md"

註：`spectra` CLI 無法以 spec 名稱單獨 validate 一個 capability——`spectra validate <name>` 會把 `<name>` 當成 change 名解析並回報 `Change '<name>' not found`。若要檢視或列出 spec，改用 `spectra show authoring-skill-pattern`（顯示 spec 全文）或 `spectra list --specs`（列出所有 spec，應含 `authoring-skill-pattern`）。
