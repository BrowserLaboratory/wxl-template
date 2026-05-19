## Why

目前 24 份 active specs 仍保留 archive 產生的 `Purpose TBD` 佔位文字，讓 spec corpus 在 release 審查時缺少可讀的能力摘要，也讓後續 change 難以快速判斷既有 spec 的責任邊界。這些 Purpose 缺口不影響執行期功能，但會直接削弱 spec 作為正式版本準據的可用性。

## What Changes

- 新增一組 spec corpus governance requirements，要求 active specs 必須具備具體 Purpose 描述，且不得保留 archive placeholder 文案。
- 盤點目前所有保留 `Purpose TBD` 的 active specs，逐一補上與實際能力一致的 Purpose。
- 明確 release 審查與後續 archive 工作在 spec metadata 上的最低完成標準，避免 placeholder 再次回流到 active corpus。

## Non-Goals (optional)

- 不更動任何產品功能或 runtime 行為。
- 不改寫既有 requirements 的 normative 行為，除非某份 spec 必須為了寫出正確 Purpose 而做最小文字修整。
- 不在本 change 中引入新的 Spectra CLI 功能或 analyzer 規則。

## Capabilities

### New Capabilities

- `spec-corpus-governance`: 定義 active spec 的 Purpose metadata 與 release-ready 最低 hygiene 要求。

### Modified Capabilities

(none)

## Impact

- Affected specs: `spec-corpus-governance`, all active specs that still contain archive-generated placeholder Purpose text
- Affected code: `openspec/specs/**/spec.md`
