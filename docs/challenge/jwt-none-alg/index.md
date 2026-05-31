---
title: Jwt None Alg
layout: challenge
difficulty: medium
category: web
backend: flask
app: app.py
source_visible: false
packages: []
date: 2026-05-31T09:13:59.849Z
tags: [ jwt, access-control, authentication, flask ]
description: A Flask API whose JWT session check trusts the token's own alg header. Forge an unsigned (alg=none) admin token to reach /admin and read the flag.
wasmModule: /challenge/jwt-none-alg/runtime.wasm
---

# Jwt None Alg

FileVault issues a signed JWT in a `session` cookie after login. The `/admin`
endpoint, however, trusts the algorithm named in the token header — including
`none`. Forge an unsigned token carrying `role: admin`, send it as the
`session` cookie, and read the flag from the admin console.
