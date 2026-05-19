---
title: "SQL Injection Demo"
layout: challenge
difficulty: easy
category: web
backend: flask
source_visible: false
app: app.py
description: >
  A simple Flask app with a SQL injection vulnerability. Can you retrieve all users from the database?
date: "2025-03-01T00:00:00.000Z"
tags: [ sql, injection, flask, sqlite ]
wasmModule: /challenge/sqli-demo/runtime.wasm
---

# SQL Injection Demo

A login form backed by SQLite. Find a way to bypass authentication and retrieve the flag.
