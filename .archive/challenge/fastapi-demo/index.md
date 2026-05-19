---
title: "FastAPI IDOR Demo"
layout: challenge
difficulty: easy
category: web
backend: fastapi
source_visible: false
app: app.py
description: >
  A FastAPI notes app with an IDOR vulnerability. Can you access a note that doesn't belong to you?
date: "2025-04-01T00:00:00.000Z"
tags: [ idor, fastapi, rest-api ]
wasmModule: /challenge/fastapi-demo/runtime.wasm
---

# FastAPI IDOR Demo

A simple REST API for managing notes, built with FastAPI.

You are logged in as **alice** (user id: 2). Your note is at `/notes/2`.

But the app fails to verify ownership before returning a note — there's another user whose note contains the flag.

**Goal:** Retrieve the flag from `/flag.txt` via the API.

**Hint:** Try other note IDs. Who else has a note stored here?
