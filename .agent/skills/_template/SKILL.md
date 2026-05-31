---
name: <SKILL-NAME>
description: <一句話描述 skill 做什麼、何時自動觸發、何時不適用>
---

<!--
⚠️ 撰寫前必讀
本檔由 authoring-skill-pattern capability 規範。三件 host-neutral 限制：

1. canonical source 位置：本檔必須位於 .agent/skills/<SKILL-NAME>/SKILL.md
   （三家 host agent 的 .claude / .codex / .gemini path 只放 ≤3 行 thin pointer，
   指向本檔；body 不得重複本檔內容）。
2. host-agent-neutral 措辭：禁止字串清單見
   openspec/specs/authoring-skill-pattern/spec.md 中
   "Host-agent-neutral skill prose" Requirement，請勿在本檔出現其中任一字串。
3. 可用工具：Bash / Read / Write / Edit / Glob / Grep / WebFetch（跨 agent 通用）。
   MCP 工具僅在 best-effort + 標明 degraded behavior 時才可引用。

驗證命令模板（將 <FORBIDDEN-PATTERN> 替換為 spec.md Requirement 內列舉的完整禁字 regex）：

    git grep -nE '<FORBIDDEN-PATTERN>' .agent/skills/<SKILL-NAME>/
    # exit code 1 = 0 命中 = 通過
-->

## Overview

<!--
用 1-2 段說明：
- skill 解決什麼問題、給誰用
- 何時自動觸發（trigger keyword / 對話情境 / 檔案模式）
- 何時不適用（明確 anti-trigger）
-->

## Workflow

<!--
逐步描述 skill 觸發後的流程。每步用以下格式：

### Step N: <步驟標題>

- **What**: 這一步做什麼（觀察到的 behavior / 產出物 / 契約）
- **How**: 用哪些跨 agent 通用工具達成
- **Verification**: 完成可驗證條件（指令輸出、檔案存在、字串命中、退出碼）
-->

## Anti-patterns

<!--
列出此 skill 已知會踩的坑與避免方式。每條格式：

- ❌ **錯誤做法**：……
  - ✅ **正確做法**：……
  - **Why**: ……（為什麼錯誤做法會出問題、過往真實 incident 引用）
-->

## Verification

<!--
列出 skill 收工的最終 acceptance criteria，全部使用跨 agent 通用工具：

- 對應 spec Requirement: <Requirement 名> 的可驗證 Scenario
- `git grep ...` / `ls ...` / `wc -l ...` 等指令
- 退出碼預期值（0 / 1 各代表什麼）
-->
