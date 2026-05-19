## Context

commit `7ce9518` 將挑戰檔案結構從平面模式（`challenge/<slug>.md`）重構為 per-folder 模式（`challenge/<slug>/index.md`），但 `ChallengeLayout.vue` 的 slug 提取 regex 未同步更新，導致所有挑戰的 slug 都變成 `"index"`。

此外，`BrowserPanel.vue` 從未實作自動導航功能——使用者進入挑戰頁面後必須手動按 Go 按鈕才能載入內容。

## Goals / Non-Goals

**Goals:**

- 修正 slug 提取邏輯，從 per-folder 路徑正確取得挑戰 slug
- 在 runtime 初始化完成後自動導航至挑戰首頁
- 更新對應的單元測試

**Non-Goals:**

- 不抽取共用的 slug 工具函式（目前只有 ChallengeLayout 使用）
- 不修改 ECONNREFUSED 3000 的 stderr 噪音
- 不修改 Service Worker 路由邏輯（它本身沒問題）

## Decisions

### 從 relativePath 倒數第二段取 slug

現有邏輯 `rel.replace(/^.*\//, '').replace(/\.md$/, '')` 取最後一段，得到 `"index"`。

修正方案：將路徑 split 為 segments，取倒數第二段（parent directory name）。

```
"challenge/sqli-demo/index.md" → split('/') → ["challenge", "sqli-demo", "index.md"]
                                → parts[-2] = "sqli-demo" ✓
```

Fallback：若路徑只有一段（理論上不會發生），取最後一段去掉 `.md`，保持向後相容。

替代方案：從 frontmatter 讀取 slug → 不採用，因為增加了 frontmatter 的必要欄位，且現有挑戰沒有 slug 欄位。

### Watch disabled prop 觸發自動導航

`BrowserPanel` 接收 `disabled` prop，在 runtime 未就緒時為 `true`。當 `disabled` 從 `true` 變為 `false` 時，自動呼叫 `navigate()`。

```
disabled: true  →  runtime init  →  disabled: false  →  watch 觸發 navigate()
```

替代方案考慮：

| 方式 | 做法 | 不採用原因 |
|------|------|-----------|
| defineExpose + 外部呼叫 | ChallengeLayout 直接呼叫 `browserRef.navigate()` | 增加元件耦合，需要 template ref |
| emit 事件 | BrowserPanel emit `ready` 事件 | 方向反了，自動導航是 BrowserPanel 自己的職責 |

Watch `disabled` 最簡單，不需要修改元件介面。

## Risks / Trade-offs

- [風險] 自動導航在 runtime 初始化期間觸發 → 無風險，因為 watch 只在 `disabled` 變 `false` 時觸發，此時 runtime 已就緒
- [風險] VitePress 頁面切換時重新觸發 watch → 低風險，VitePress SPA 路由會 unmount/remount 元件，watch 只在首次 `true→false` 轉換觸發
