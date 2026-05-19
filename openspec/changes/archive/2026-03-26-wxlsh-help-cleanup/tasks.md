## 1. 移除 FS 指令（Five-tier command system）

- [x] 1.1 更新 five-tier command system：從 `TIER1_COMMANDS` Set 中移除 11 個檔案系統指令 `ls`、`cat`、`mkdir`、`touch`、`cp`、`mv`、`rm`、`head`、`tail`、`wc`、`file`（`useWxlsh.ts:587-590`）
- [x] 1.2 刪除 `executeTier1()` 中對應的 stub case 分支（`useWxlsh.ts:673-684`，從 `case 'ls'` 到 `case 'file'`，共 11 個 case）。移除後這些指令會 fall through 到 unknown command handler（`:775`），自動回傳 `wxlsh: command not found: <cmd>`

## 2. Help 指令改版（Command behavior aligned to real Linux tools）

- [x] 2.1 建立指令說明 registry 以支援 command behavior aligned to real Linux tools：在 `useWxlsh.ts` 中建立 `Record<string, { brief: string; usage: string; description: string }>` 物件，涵蓋所有可用的 Tier 1-4 指令。每筆包含：`brief`（一行簡述，用於 `help` 列表）、`usage`（語法，如 `curl [options] <url>`）、`description`（詳細說明含可用選項，用於 `help <cmd>`）
- [x] 2.2 改寫 `executeTier1()` 中 `case 'help'` 的無參數輸出（`:618-623`）：從 registry 動態產生分類列表，每行格式為 `  <command> — <brief>`，按分類（Shell、Text、Encoding、Network）分組顯示。不包含任何已移除的 FS 指令
- [x] 2.3 實作 `help <command>` 邏輯：當 `args[0]` 存在時，在 registry 中查詢該指令，找到則回傳 usage + description；找不到則回傳 `help: no help for '<command>'`

## 3. 更新既有測試

- [x] 3.1 修改 `tests/unit/composables/useWxlsh-tiers.test.ts` 中的 help 測試（`:28-35`）：移除 `expect(result.output).toContain('ls')` 和 `toContain('cat')` 斷言，改為驗證輸出包含可用指令（如 `echo`、`curl`）且不包含已移除的 FS 指令
- [x] 3.2 修改 `which ls` 測試（`:79-84`）：改為測試 `which echo` 回傳 `/usr/bin/echo`，並新增斷言 `which ls` 回傳 `ls not found` 且 `error` 為 `true`

## 4. 新增測試

- [x] 4.1 新增 FS 指令回傳 command not found 的測試：驗證 `ls`、`cat`、`touch`、`mkdir` 的輸出符合 `wxlsh: command not found: <cmd>` 格式且 `error` 為 `true`（Filesystem commands not available）
- [x] 4.2 新增 `help <command>` 測試：驗證 `help echo` 回傳 echo 的用法說明、`help curl` 回傳 curl 的選項說明（help with command argument shows per-command usage）
- [x] 4.3 新增 `help <unknown>` 測試：驗證 `help nonexistent` 回傳 `help: no help for 'nonexistent'`（help with unknown command argument）
- [x] 4.4 新增 pipe support 測試：驗證 `echo "hello" | grep "hello"` 正確輸出（Pipe support，確保 pipe 在移除 FS 指令後仍正常運作）
