"""
FastAPI Demo Challenge — IDOR (Insecure Direct Object Reference)

The API manages "notes". Users can access their own notes via /notes/{id},
but there is no ownership check — any note ID works for any user.
The admin note (id=1) contains the flag.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse

app = FastAPI()

# Simulated in-memory note store
NOTES = {
    1: {"owner": "admin", "content": open("/flag.txt").read().strip()},
    2: {"owner": "alice", "content": "Shopping list: eggs, milk, bread"},
    3: {"owner": "bob",   "content": "Meeting notes from Monday"},
}

HTML_INDEX = """<!DOCTYPE html>
<html>
<head><title>FastAPI Notes App</title></head>
<body>
<h1>Notes API</h1>
<p>Welcome! Use the API to manage your notes.</p>
<ul>
  <li><code>GET /notes/{id}</code> — Retrieve a note by ID</li>
  <li><code>GET /me</code> — Get current user info</li>
</ul>
<p>You are logged in as <strong>alice</strong> (user id: 2).</p>
<p>Try fetching your note: <a href="/notes/2">/notes/2</a></p>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def index():
    return HTML_INDEX


@app.get("/me")
async def me():
    return {"user": "alice", "id": 2}


@app.get("/notes/{note_id}")
async def get_note(note_id: int):
    # Vulnerability: no ownership check — any authenticated user can read any note
    note = NOTES.get(note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"id": note_id, "owner": note["owner"], "content": note["content"]}
