# Changelog

All notable changes to **wxl-template** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## ✨ [1.0.0] - 2026-05-28

> 跨三家 host agent 的 wxl-creator 技巧（Create / Mutate / Verify 三階段管線、L4 盲解驗證）、Branch protection ruleset 對齊、Node 24 強制升級、CI 供應鏈安全強化。

### ✨ 新增 (Added)

- 跨三家 host agent（Claude Code / Codex CLI / Gemini CLI）的 wxl-creator 技巧，採 Create / Mutate / Verify 三階段管線設計 ([#13])
- 新 capability `wxl-blind-solve-verification` — L4 盲解子系統 spec（9 條 Requirement，含 player package shape、`WXL_VERIFY_RUNTIME` 派發、exit code 0/1/2 契約） ([#13])
- `pnpm challenge:retype <slug>` — Mutate 階段 CLI：變更 backend / difficulty / tags / category，同語系 backend 互換保留 vuln body ([#13])
- `pnpm challenge:verify <slug>` — Release-blocking gate orchestrator：L1（frontmatter+structure lint）+ L2（content analyze + keygen + `wasm-tools validate`）+ L3（Playwright e2e）+ L4（`--blind` 盲解，opt-in） ([#13])
- `pnpm challenge:verify:blind <slug>` — L4 盲解 standalone 入口，依 `WXL_VERIFY_RUNTIME` 環境變數派發到 claude / codex / gemini non-interactive CLI ([#13])
- `tests/challenges/door-is-open.spec.ts` 作為 Playwright e2e exploit spec 範本（含 `globalThis.__wxlDispatch` dev-only hook） ([#13])
- `CONTRIBUTE.md` 新增 Maintainer Setup top-level section + Branch protection ruleset 子段落（含 `gh api` 重現指令） + multi-reviewer team PR approval 升級指引 ([#4], [#5])
- 啟用 GitHub repository ruleset 對齊 sister repo hardening：`deletion` + `non_fast_forward` rules + `integration_id: 15368` pinning + `bypass_mode: pull_request` + `~DEFAULT_BRANCH` 動態 ref + `dismiss_stale_reviews_on_push` + `required_review_thread_resolution` ([#7])

### 🔄 變更 (Changed)

- skill prose 改為 host-agent-neutral：全面移除 Claude-only `AskUserQuestion` 原語，改為 plain-text 問句區塊，三家 host agent 都可自然執行 ([#13])
- wxl-creator skill 單一來源遷移：canonical 內容從 `.claude/skills/wxl-creator/` 改放於 `.agent/skills/wxl-creator/`；三家 host (Claude / Codex / Gemini) 改用 thin pointer ([#13])
- `@playwright/test@1.60.0` + `tsx@4.22.3` 加為 devDependency；首次跑 `pnpm challenge:verify` 前需執行 `pnpm exec playwright install chromium` ([#13])

### 🐛 修復 (Fixed)

- `CONTRIBUTE.md` ruleset 範例 payload 修正多個 422 errors：`RepositoryAdmin` → `RepositoryRole + actor_id 5`、移除 `required_status_checks` 內 `integration_id: null`、補 actor_id 對照表 ([#6])
- `pull_request` rule parameters 補滿 5 個 flag 避免 GitHub API 422（採 all-or-nothing schema） ([#9])

### 🔒 安全性 (Security)

- 強化 CI workflows 供應鏈安全：所有第三方 GitHub Action 全 commit SHA pin、`quality-gates.yml` 加 `permissions: contents: read` 最小權限、`jetli/wasm-pack-action` 鎖 `v0.14.0` ([#2])
- 升級 Node-runtime GitHub Actions 對齊 2026-06-02 強制 Node 24 政策：`actions/checkout` v4.2.2 → v6.0.2、`actions/setup-node` v4.4.0 → v6.4.0、`pnpm/action-setup` v4.1.0 → v6.0.8、`jetli/wasm-pack-action@v0.4.0`（停更 3 年、Node 16 runtime）→ composite-based `taiki-e/install-action@v2.79.2`；兩支 workflow `node-version: 22 → 24` ([#10])
- `release.yml` 之 `softprops/action-gh-release` 升 v2.6.2 → v3.0.0（Node 24 runtime） ([#12])

### 💥 Breaking Changes

- **`.claude/skills/wxl-creator/SKILL.md`**：從 283 行完整 skill 內容退化為 3 行 thin pointer ([#13])
  - 舊行為：直接讀此檔即為 wxl-creator skill 完整 prose
  - 新行為：此檔僅指引 host agent 去讀 `.agent/skills/wxl-creator/SKILL.md` 之單一來源
  - 遷移方式：下游若有自動化流程直接 import 此檔內容，需改向 `.agent/skills/wxl-creator/SKILL.md`；若是 Claude Code 自動 discover 並 follow pointer，無需動作

## ✨ [1.0.0-rc.1] - 2026-05-20

> 首個 release candidate — 建立 CI quality gates 雙軌（test + build）作為 release-blocking pipeline。

### ✨ 新增 (Added)

- `.github/workflows/quality-gates.yml` — 雙 job CI pipeline（`test` 跑 vitest、`build` 跑 `pnpm docs:build` 與 wasm artifacts 驗證），PR 與 push 到 main 觸發 ([#1])
- `.github/workflows/release.yml` — `v*` tag push 觸發；跑全 gate + 打包 source zip + 透過 `softprops/action-gh-release` 自動建立 GitHub release ([#1])
- `openspec/specs/ci-quality-gates/` spec — 初始 8 條 Requirement 涵蓋 trigger / parallel jobs / 共用 setup / Node version pin / wasm-pack via action / test + build gate / scope 邊界 ([#1])

[Unreleased]: https://github.com/BrowserLaboratory/wxl-template/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/BrowserLaboratory/wxl-template/compare/v1.0.0-rc.1...v1.0.0
[1.0.0-rc.1]: https://github.com/BrowserLaboratory/wxl-template/releases/tag/v1.0.0-rc.1
[#1]: https://github.com/BrowserLaboratory/wxl-template/pull/1
[#2]: https://github.com/BrowserLaboratory/wxl-template/pull/2
[#4]: https://github.com/BrowserLaboratory/wxl-template/pull/4
[#5]: https://github.com/BrowserLaboratory/wxl-template/pull/5
[#6]: https://github.com/BrowserLaboratory/wxl-template/pull/6
[#7]: https://github.com/BrowserLaboratory/wxl-template/pull/7
[#9]: https://github.com/BrowserLaboratory/wxl-template/pull/9
[#10]: https://github.com/BrowserLaboratory/wxl-template/pull/10
[#12]: https://github.com/BrowserLaboratory/wxl-template/pull/12
[#13]: https://github.com/BrowserLaboratory/wxl-template/pull/13
