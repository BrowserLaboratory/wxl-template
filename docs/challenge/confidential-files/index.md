---
title: Confidential Files
layout: challenge
difficulty: easy
category: web
backend: php
app: index.php
source_visible: false
packages: []
date: 2026-05-31T09:16:27.275Z
tags: [ path-traversal, access-control, lfi, php ]
description: A PHP report viewer that builds a file path from the file parameter without sanitisation. Use ../ to escape the reports directory and read the flag.
wasmModule: /challenge/confidential-files/runtime.wasm
---

# Confidential Files

FileVault serves quarterly reports through a `?file=` viewer that joins your input onto its `reports/` directory without any sanitisation. Escape that directory with a `../` segment to reach `flag.txt` and read the flag.
