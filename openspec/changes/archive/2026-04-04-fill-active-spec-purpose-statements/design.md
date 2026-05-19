## Context

active spec corpus 目前仍有大量 archive placeholder Purpose，且部分 spec 還保留重複 requirement header。這些問題不一定反映產品功能錯誤，但會讓 spec 失去作為正式版本契約的可讀性與可審查性。

## Goals / Non-Goals

**Goals:**

- 建立 active spec metadata 的最低 hygiene 標準。
- 在本次 release scope 內清除 placeholder Purpose。
- 收斂本次 release scope 內尚未被其他 changes 處理的 duplicate requirement headers。

**Non-Goals:**

- 不更改產品實作行為。
- 不重寫與本次 release 無關的需求內容。
- 不在本 change 中擴充 Spectra CLI 或 analyzer 功能。

## Decisions

### Release-time purpose normalization

本 change 以人工盤點與逐檔修正為主，把 active specs 中 archive placeholder 的 `## Purpose` 全數換成具體描述。規格層只定義 release-ready contract，不假設當前工具鏈已能自動填入正確 Purpose。

### Duplicate header cleanup boundaries

duplicate requirement headers 只處理本次 release scope 中尚未由其他 changes 吸收的剩餘項目。已由共享 runtime、payload pipeline、PHP runtime 等 change 明確承接的 duplicate headers，交由各自 change 一併收斂，避免同一 requirement 被多個 changes 重複修改。

## Risks / Trade-offs

- [Risk] 這是以文件 hygiene 為主的 change，容易被低估而延後。 → Mitigation: 把 release-ready contract 寫進新 capability，讓它成為顯性工作。
- [Risk] 與其他 spec-cleanup changes 有邊界重疊。 → Mitigation: tasks 明確要求只處理未被其他 changes 承接的殘餘項目。

## Migration Plan

1. 先補 governance spec。
2. 再逐份更新 active specs 的 Purpose。
3. 最後清點 duplicate headers 是否都已被對應 change 吸收或清除。

## Open Questions

- 若未來 placeholder Purpose 再次回流，是否需要 analyzer 規則支援，留待後續 tooling change 評估。
