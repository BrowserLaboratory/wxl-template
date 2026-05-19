"""
Door Is Open — IDOR via file download endpoint

A FastAPI file-sharing app backed by in-memory SQLite.
Each user has private files, but the /download endpoint only checks
whether the file ID exists — it never verifies that the requesting
user actually owns the file.

Users log in with a simple session cookie (username only, no signing).
The admin account owns a private file whose content IS the flag.

Goal: log in as a regular user, then manipulate the file ID in
      /download?id=… to retrieve the admin's private file.
"""

import sqlite3
from urllib.parse import parse_qs
from jinja2 import Environment
from markupsafe import Markup
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse, Response

app = FastAPI()

# --- Jinja2 setup -----------------------------------------------------------

env = Environment(autoescape=True)

CSS = """\
  body { font-family: sans-serif; max-width: 520px; margin: 60px auto; }
  input, button { display: block; width: 100%; margin: 8px 0; padding: 6px 10px; box-sizing: border-box; }
  button { background: #1e40af; color: white; border: none; cursor: pointer; }
  a.btn { display: inline-block; margin: 6px 4px 6px 0; padding: 4px 12px;
          background: #1e40af; color: white; text-decoration: none; border-radius: 4px; }
  .error { color: #dc2626; }
  .info { color: #6b7280; font-size: 0.85em; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  th { background: #f3f4f6; }
"""

PAGE = env.from_string("""\
<!DOCTYPE html>
<html><head><title>FileHub - {{ title }}</title><style>{{ css }}</style></head>
<body>{{ content }}</body></html>""")

LOGIN_BODY = env.from_string("""\
<h2>FileHub Login</h2>
{% if error %}<p class="error">{{ error }}</p>{% endif %}
<form method="POST" action="/login">
  <input name="username" placeholder="Username" />
  <input name="password" type="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
<p style="color:#6b7280; font-size:0.85em;">Hint: guest / guest</p>""")

FILES_BODY = env.from_string("""\
<h2>My Files</h2>
<p class="info">Logged in as <strong>{{ user }}</strong> | <a href="/logout">Logout</a></p>
<table>
  <tr><th>ID</th><th>Filename</th><th></th></tr>
  {% for f in files %}
  <tr>
    <td>{{ f.id }}</td>
    <td>{{ f.filename }}</td>
    <td><a class="btn" href="/download?id={{ f.id }}">Download</a></td>
  </tr>
  {% endfor %}
</table>""")

def render(title, body_html):
    return HTMLResponse(PAGE.render(title=title, css=CSS, content=Markup(body_html)))

# --- Database setup ----------------------------------------------------------

def get_db():
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    flag = open("/flag.txt").read().strip()

    db.executescript("""
        CREATE TABLE users (
            id       INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT
        );
        CREATE TABLE files (
            id       INTEGER PRIMARY KEY,
            owner_id INTEGER,
            filename TEXT,
            content  TEXT
        );
    """)

    db.execute("INSERT INTO users VALUES (1, 'admin',  'Sx!9kL@mQ2')")
    db.execute("INSERT INTO users VALUES (2, 'guest',  'guest')")

    db.execute("INSERT INTO files VALUES (1, 1, 'credentials.txt', ?)", (flag,))
    db.execute("INSERT INTO files VALUES (2, 1, 'todo.txt',        'Rotate DB passwords')")
    db.execute("INSERT INTO files VALUES (3, 2, 'notes.txt',       'Nothing important here.')")
    db.execute("INSERT INTO files VALUES (4, 2, 'readme.txt',      'Welcome to the file hub!')")
    db.commit()
    return db

# --- Helpers -----------------------------------------------------------------

def current_user(request: Request):
    return request.cookies.get("session_user")

async def parse_form(request: Request) -> dict[str, str]:
    """Parse URL-encoded form body without python-multipart."""
    body = (await request.body()).decode()
    parsed = parse_qs(body, keep_blank_values=True)
    return {k: v[0] for k, v in parsed.items()}

# --- Routes ------------------------------------------------------------------

@app.get("/")
async def index(request: Request):
    user = current_user(request)
    if not user:
        return render("Login", LOGIN_BODY.render(error=None))
    return RedirectResponse("/files", status_code=302)


@app.post("/login")
async def login(request: Request):
    form = await parse_form(request)
    username = form.get("username", "")
    password = form.get("password", "")

    db = get_db()
    row = db.execute(
        "SELECT id FROM users WHERE username = ? AND password = ?",
        (username, password),
    ).fetchone()

    if not row:
        return render("Login", LOGIN_BODY.render(error="Invalid credentials."))

    resp = RedirectResponse("/files", status_code=302)
    resp.set_cookie("session_user", username)
    return resp


@app.get("/files")
async def list_files(request: Request):
    user = current_user(request)
    if not user:
        return RedirectResponse("/", status_code=302)

    db = get_db()
    uid = db.execute("SELECT id FROM users WHERE username = ?", (user,)).fetchone()
    if not uid:
        return RedirectResponse("/", status_code=302)

    rows = db.execute(
        "SELECT id, filename FROM files WHERE owner_id = ?", (uid["id"],)
    ).fetchall()

    files = [{"id": r["id"], "filename": r["filename"]} for r in rows]
    return render("My Files", FILES_BODY.render(user=user, files=files))


@app.get("/download")
async def download(request: Request, id: int = 0):
    user = current_user(request)
    if not user:
        return RedirectResponse("/", status_code=302)

    db = get_db()

    # Vulnerability: fetches the file by ID without checking owner_id against
    # the logged-in user — any authenticated user can download any file.
    row = db.execute(
        "SELECT filename, content FROM files WHERE id = ?", (id,)
    ).fetchone()

    if not row:
        return render("Error", '<p class="error">File not found.</p><a href="/files">Back</a>')

    return Response(
        content=row["content"],
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{row["filename"]}"'},
    )


@app.get("/logout")
async def logout():
    resp = RedirectResponse("/", status_code=302)
    resp.delete_cookie("session_user")
    return resp
