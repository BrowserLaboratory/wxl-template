## 1. CLI 引數解析與驗證

- [x] 1.1 使用 `node:util.parseArgs` 解析 `--name`、`--title`、`--backend`、`--difficulty`、`--flag` 引數——CLI accepts required and optional arguments（design: CLI 引數解析使用 `node:util.parseArgs`）
- [x] 1.2 驗證 `--name` 必填；缺少時 exit(1) 並顯示說明——CLI accepts required and optional arguments: Missing --name argument
- [x] 1.3 驗證 `--backend` 必須為 `flask`、`fastapi`、`php` 之一；無效值 exit(1)——CLI accepts required and optional arguments: Invalid backend value
- [x] 1.4 `--flag` 未傳入時自動生成 `FLAG{<slug>_<random8hex>}`——CLI accepts required and optional arguments: Minimal invocation with only --name（design: flag 自動生成格式：`FLAG{<slug>_<random8hex>}`）

## 2. 衝突偵測與目錄建立

- [x] 2.1 偵測 `docs/challenge/<slug>.md` 或 `docs/challenge/<slug>/` 已存在時 exit(1)——Script creates challenge directory structure: Collision detection
- [x] 2.2 建立 `docs/challenge/<slug>/` 目錄與所有必要檔案——Script creates challenge directory structure: Fresh scaffold for flask backend

## 3. App 骨架產生

- [x] 3.1 Flask 骨架：產生含 `from flask import Flask`、`@app.route('/')` 及讀取 `/flag.txt` 示範的 `app.py`——App skeleton is runnable and reads the flag: Flask skeleton imports Flask and defines a route（design: 骨架以 inline template string 嵌入 script）
- [x] 3.2 FastAPI 骨架：產生含 `from fastapi import FastAPI`、`@app.get('/')` 及讀取 `/flag.txt` 示範的 `app.py`——App skeleton is runnable and reads the flag: FastAPI skeleton imports FastAPI and defines a route
- [x] 3.3 PHP 骨架：產生以 `<?php` 開頭、含 `/flag.txt` 讀取示範的 `index.php`——App skeleton is runnable and reads the flag: PHP skeleton contains PHP opening tag and flag read

## 4. Frontmatter 與 .md 建立

- [x] 4.1 產生含所有必填欄位（`layout`、`backend`、`flag_verifier: PLACEHOLDER`、`fs_key: PLACEHOLDER`、`app`、`fs`）的 `<slug>.md`——Frontmatter stub uses correct PLACEHOLDER values: Generated frontmatter is parseable by VitePress
- [x] 4.2 frontmatter 同時包含 `title`、`difficulty`、`category: web`、`packages: []` 等選填欄位（`packages` 為 challenge-framework 定義的 optional field，生成時以空陣列提示作者）

## 5. Keygen 自動執行

- [x] 5.1 scaffold 完成後以 `child_process.execSync` 呼叫 `pnpm challenge:keygen <slug>`——Script auto-runs keygen after scaffold: Keygen runs on success（design: 建立後自動呼叫 keygen 使用 `child_process.execSync`）
- [x] 5.2 keygen 失敗時顯示錯誤輸出並 exit(1)——Script auto-runs keygen after scaffold: Keygen failure is surfaced

## 6. Package.json 整合

- [x] 6.1 在 `package.json` 的 `scripts` 中新增 `"create:challenge": "node --experimental-strip-types scripts/create-challenge.ts"`

## 7. 測試

- [x] 7.1 撰寫 `tests/unit/scripts/create-challenge.test.ts`：覆蓋 CLI 引數驗證（缺少 --name、無效 backend）
- [x] 7.2 測試：slug 衝突偵測（已有 .md 時 exit(1)）
- [x] 7.3 測試：三種 backend 骨架內容正確性（Flask/FastAPI 含正確 import，PHP 含 `<?php`）
- [x] 7.4 測試：frontmatter PLACEHOLDER 欄位均存在且可被 `validateChallengeConfig` 解析（略過 PLACEHOLDER 驗證）
