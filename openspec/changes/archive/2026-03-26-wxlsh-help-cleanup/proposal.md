## Why

wxlsh 終端機中的檔案系統指令（`ls`、`cat`、`mkdir`、`touch` 等）目前是 stub 實作，只回傳空字串。這導致使用者執行 `touch a` 後 `ls` 仍然沒有輸出，行為令人困惑。在 UserVFS 尚未整合之前，應該把這些指令從可用清單中移除，讓它們回傳 `command not found`，而非假裝成功。

同時 `help` 目前只列出指令名稱，沒有任何說明。需要為每個可用指令加上簡短描述，並支援 `help <command>` 查看單一指令的用法。

## What Changes

- **移除 FS stub 指令**：從 `TIER1_COMMANDS` 移除 `ls`、`cat`、`mkdir`、`touch`、`cp`、`mv`、`rm`、`head`、`tail`、`wc`、`file`，讓它們 fall through 到 unknown command handler，回傳原生的 `wxlsh: command not found: <cmd>` 格式
- **`help` 無參數輸出改版**：列出所有可用指令並附上簡短功能描述（一行一指令）
- **`help <command>` 支援**：輸入 `help curl` 顯示 curl 的用法、語法和可用選項；輸入不存在的指令則回傳 `help: no help for '<cmd>'`
- 同步移除 `executeTier1()` 中對應的 stub case 分支
- `help` 輸出的指令分類列表更新（移除 Shell 分類中的 FS 指令）

## Non-Goals

- 不實作 UserVFS 整合（留給未來的 change）
- 不新增 `man` 指令（`help <cmd>` 已足夠）
- 不改動 `whoami`（已正確回傳 `hacker`）
- 不變更 Tier 2-5 指令的行為

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `wxlsh-commands`：移除 FS stub 指令、改版 `help` 輸出格式、新增 `help <command>` per-command 查詢功能

## Impact

- 受影響程式碼：`.vitepress/theme/composables/useWxlsh.ts`
- 受影響 spec：`wxlsh-commands`
