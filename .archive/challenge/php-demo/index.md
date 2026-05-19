---
title: "PHP File Inclusion Demo"
layout: challenge
difficulty: easy
category: web
backend: php
source_visible: false
app: index.php
description: >
  A PHP application with a file inclusion vulnerability. Can you read the flag?
date: "2025-03-15T00:00:00.000Z"
tags: [ lfi, php, file-inclusion ]
wasmModule: /challenge/php-demo/runtime.wasm
---

# PHP File Inclusion Demo

A simple PHP app that includes files based on a query parameter. Find a way to read `/flag.txt`.
