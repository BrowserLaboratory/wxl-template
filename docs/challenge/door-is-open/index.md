---
title: Door Is Open
layout: challenge
difficulty: easy
category: web
backend: fastapi
app: app.py
packages: []
tools: [browser, network, repeater, code]
source_visible: false
date: 2026-04-02T08:54:17.674Z
tags: [ idor, access-control, fastapi, sqlite ]
description: A file-sharing app with an IDOR vulnerability — download other users' private files by manipulating the file ID.
wasmModule: /challenge/door-is-open/runtime.wasm
---

# Door Is Open

一個簡易的檔案分享平台 FileHub，每位使用者都有自己的私人檔案。你的目標是利用存取控制的漏洞，下載不屬於你的檔案來取得 flag。
