## Why

新增挑戰時需要手動建立目錄結構、frontmatter、app 骨架、flag.txt，再執行 keygen——流程繁瑣且容易出錯。一個 CLI scaffold script 能讓挑戰作者一行指令完成所有初始化。

## What Changes

- 新增 `scripts/create-challenge.ts`，透過 `pnpm create:challenge` 執行
- 支援參數：`--name`（必填 slug）、`--title`、`--backend`（flask|fastapi|php，預設 flask）、`--difficulty`（easy|medium|hard，預設 easy）、`--flag`（選填，未傳則自動生成 `FLAG{<slug>_<random8>}`）
- 自動建立 `docs/challenge/<slug>/app.py`（或 `index.php`）骨架
- 自動建立 `docs/challenge/<slug>/flag.txt`
- 自動建立 `docs/challenge/<slug>.md`（含完整 frontmatter PLACEHOLDER）
- 建立完成後自動呼叫 `challenge:keygen <slug>` 完成加密

## Capabilities

### New Capabilities

- `challenge-scaffold`: CLI script，一行指令初始化完整的挑戰目錄結構、frontmatter 與 app 骨架，並自動執行 keygen

### Modified Capabilities

（無 spec 層級的行為變更）

## Impact

- Affected specs: `challenge-scaffold`（新建）
- Affected code:
  - `scripts/create-challenge.ts`（新建）
  - `package.json`（新增 `challenge:keygen` 呼叫整合）
