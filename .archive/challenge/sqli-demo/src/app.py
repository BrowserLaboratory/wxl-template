"""
SQLi Demo Challenge — SQL Injection via login form

A Flask app backed by in-memory SQLite.
The login query is built with string concatenation — classic SQLi.
The users table contains an admin account whose password IS the flag.

Goal: bypass the login check and retrieve the admin password (= flag).
"""

import sqlite3
from flask import Flask, request, Response

app = Flask(__name__)

# ─── Database setup ───────────────────────────────────────────────────────────

def get_db():
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    flag = open("/flag.txt").read().strip()
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)")
    db.execute("INSERT INTO users VALUES (1, 'admin', ?)", (flag,))
    db.execute("INSERT INTO users VALUES (2, 'alice', 'correcthorsebatterystaple')")
    db.execute("INSERT INTO users VALUES (3, 'bob',   'hunter2')")
    db.commit()
    return db

# ─── Routes ───────────────────────────────────────────────────────────────────

HTML_INDEX = """<!DOCTYPE html>
<html>
<head><title>Login</title>
<style>
  body { font-family: sans-serif; max-width: 420px; margin: 60px auto; }
  input, button { display: block; width: 100%; margin: 8px 0; padding: 6px 10px; box-sizing: border-box; }
  button { background: #1e40af; color: white; border: none; cursor: pointer; }
  .error { color: #dc2626; }
  .success { color: #16a34a; font-family: monospace; word-break: break-all; }
</style>
</head>
<body>
<h2>Login</h2>
<form method="POST" action="/login">
  <input name="username" placeholder="Username" />
  <input name="password" type="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
</body>
</html>"""


@app.route("/")
def index():
    return Response(HTML_INDEX, content_type="text/html")


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    db = get_db()
    # Vulnerability: raw string interpolation — classic SQL injection
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    try:
        rows = db.execute(query).fetchall()
    except sqlite3.OperationalError as e:
        return Response(
            f"<p class='error'>SQL Error: {e}</p><a href='/'>Back</a>",
            content_type="text/html", status=400
        )

    if rows:
        user = rows[0]
        return Response(
            f"<p class='success'>Welcome, {user['username']}! "
            f"Your password is: {user['password']}</p><a href='/'>Back</a>",
            content_type="text/html"
        )
    return Response(
        "<p class='error'>Invalid credentials.</p><a href='/'>Back</a>",
        content_type="text/html", status=401
    )
