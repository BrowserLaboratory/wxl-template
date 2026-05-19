---
title: Door Is Open
layout: challenge
difficulty: easy
category: web
backend: fastapi
app: app.py
packages: []
tools: [ browser, network, repeater, code ]
source_visible: false
date: 2026-04-02T08:54:17.674Z
tags: [ idor, access-control, fastapi, sqlite ]
description: A file-sharing app with an IDOR vulnerability — download other users' private files by manipulating the file ID.
wasmModule: /challenge/door-is-open/runtime.wasm
---

# Door Is Open

FileHub is a simple file-sharing platform where every user keeps their own private files. Your goal is to exploit an access-control flaw and download a file that doesn't belong to you in order to retrieve the flag.
