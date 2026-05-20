## Why

2026-05-20 收尾的 `prose-audit-outward-docs` change 對 19 個對外文件執行 `humane-prose-audit` 全 PASS，但留下 **2 條 Medium informational findings**（design 決策：Critical/High 才 blocking，Medium 留作後續 polish）。本 change 把這 2 條 Medium 補完，讓兩個檔案的 prose 品質完整對齊 `technical-doc` profile，未來 release tag 帶的 audit 報告才能展示「無 Medium」的乾淨狀態。

## What Changes

- 改寫 `docs/guide/index.md` 的 FAQ Q 句（3 處 first-person `I` / `my` 出現位置），統一為 voice-neutral 問題式，消除 `<pronoun-voice>` Medium finding（原 sequence `['second', 'second', 'second', 'second', 'first_singular', 'second', 'first_singular', 'second', 'first_singular']` 中 3 個 `first_singular` 全部位於 FAQ 第 62 / 70 / 74 行 Q 句）
- 改寫 `docs/guide/terminal.md` 的 prose 段落（**非** wxlsh 指令名 / Syntax / Example block），對 `command` / `terminal` / `string` / `text` 等核心名詞引入同義詞變體，把 MTLD 從 33.89 拉到 ≥ 40，消除 `<lexical-diversity>` Medium finding
- 加入 audit re-run 步驟到 `tasks.md` 驗證流程，確保兩檔重跑後 Medium count = 0、verdict 仍 PASS、`humane_score` 不退步
- 對 `prose-audit-outward-docs` capability 新增一條 requirement，把 design 階段約定好的「Medium findings polish workflow」契約顯性化進 spec — 涵蓋 pronoun-voice / lexical-diversity 兩條 polish 情境、locale-mirror 範圍邊界、不可 regress 其他 finding rule 的 invariant

## Non-Goals

- **不修 zh-TW 鏡像檔**：`docs/zh-TW/guide/index.md`（PASS=99，0 Medium）與 `docs/zh-TW/guide/terminal.md`（PASS=96，0 Medium）兩檔 audit 報告都已乾淨，無需動工。中文 FAQ 用「我」是自然語感，不會被英文 audit 規則抓
- **不擴大到 Low findings**：12 條 Low 多為 README badge URL / 後端 enum 之類「正確的重複」，動它反而會 regress technical accuracy
- **不修 `prose-audit-outward-docs` spec.md `Purpose: TBD`**：那是 archive 階段遺留的技術債，非本 change motivation；應另開小型 polish change 或在下一輪 spec 維護處理
- **不動 wxlsh 指令名 / Syntax block / Example block**：`base64 encode`、`hex decode`、`curl` 等指令名是 technical contract，改名會破壞 user-facing API。同義詞替換僅針對描述性 prose
- **不新增 CI workflow**：CI quality gates（含 prose-audit gate）是下一個 change `ci-quality-gates` 的範圍

## Capabilities

### New Capabilities

(none — 本 change 是純 artifact-level prose polish，不引入新 capability)

### Modified Capabilities

- `prose-audit-outward-docs`: ADDED 一條 requirement「Medium findings SHALL be remediated in dedicated polish changes」，把 design 階段的 polish follow-up 約定寫進 spec contract。涵蓋 pronoun-voice / lexical-diversity 兩條 polish 情境、locale-mirror scope boundary、不可 regress 其他 finding rule 的 invariant

## Impact

- Affected specs: `openspec/specs/prose-audit-outward-docs/spec.md`（ADDED 一條 requirement）
- Affected code:
  - Modified: `docs/guide/index.md`, `docs/guide/terminal.md`
  - New: (none — `audit-runs/prose/<slug>/` 由稽核腳本生成且已 gitignore)
  - Removed: (none)
- Affected workflow: 任何後續 release pre-flight 重跑 `humane-prose-audit` 都會看到「無 Medium」狀態，可作為 `ci-quality-gates` change 中 prose-audit gate 之 baseline
