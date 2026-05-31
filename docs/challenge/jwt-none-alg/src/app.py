"""
JWT None-Alg Bypass — Broken Access Control via a forged JWT

A Flask API for "FileVault". Logging in issues an HS256-signed JWT inside a
`session` cookie that carries the caller's role. The /admin endpoint decodes
that token but trusts the algorithm named in the token's OWN header — so a
token whose header says `alg: none` is accepted without any signature check.

JWT encode/decode is implemented with the Python standard library only
(hmac / hashlib / base64 / json) so the challenge has no third-party runtime
dependency. The vulnerability is the `alg: none` acceptance, not the crypto.

Goal: forge an unsigned token with role=admin, send it as the `session`
cookie, and read the flag from /admin.
"""

import json
import hmac
import hashlib
import base64
from flask import Flask, request, Response, redirect

app = Flask(__name__)

# Server signing key for legitimately issued tokens. Never exposed to players.
SECRET = b"v4ult-s1gning-k3y"


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def jwt_encode(payload: dict) -> str:
    """Issue an HS256-signed JWT."""
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    p = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{h}.{p}".encode()
    sig = hmac.new(SECRET, signing_input, hashlib.sha256).digest()
    return f"{h}.{p}.{_b64url_encode(sig)}"


def jwt_decode(token: str) -> dict:
    """Decode a JWT, trusting the algorithm named in the token header.

    Vulnerability: when the header says alg='none', the claims are accepted
    without any signature verification, so a forged token is trusted.
    """
    h_seg, p_seg, sig_seg = token.split(".")
    header = json.loads(_b64url_decode(h_seg))
    payload = json.loads(_b64url_decode(p_seg))

    alg = header.get("alg", "HS256")
    if alg == "none":
        # Vulnerability: 'none' algorithm accepted — no signature required.
        return payload

    signing_input = f"{h_seg}.{p_seg}".encode()
    expected = hmac.new(SECRET, signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(expected, _b64url_decode(sig_seg)):
        raise ValueError("signature mismatch")
    return payload


CSS = """\
  body { font-family: sans-serif; max-width: 520px; margin: 60px auto; }
  input, button { display: block; width: 100%; margin: 8px 0; padding: 6px 10px; box-sizing: border-box; }
  button { background: #1e40af; color: white; border: none; cursor: pointer; }
  a.btn { display: inline-block; margin: 6px 4px; padding: 4px 12px; background: #1e40af;
          color: white; text-decoration: none; border-radius: 4px; }
  .error { color: #dc2626; }
  .flag { font-family: monospace; color: #16a34a; word-break: break-all; }
  .info { color: #6b7280; font-size: 0.85em; }
"""


def page(title: str, body: str, status: int = 200) -> Response:
    html = f"""<!DOCTYPE html>
<html><head><title>FileVault - {title}</title><style>{CSS}</style></head>
<body>{body}</body></html>"""
    return Response(html, content_type="text/html", status=status)


def read_flag() -> str:
    try:
        with open("/flag.txt") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "(flag not found)"


@app.route("/")
def index() -> Response:
    return page(
        "Login",
        """<h2>FileVault</h2>
<form method="POST" action="/login">
  <input name="username" placeholder="Username" />
  <input name="password" type="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
<p class="info">After login your role is stored in a signed <code>session</code> JWT.
The admin console lives at <a href="/admin">/admin</a> — staff only.</p>
<p class="info">Hint: guest / guest</p>""",
    )


@app.route("/login", methods=["POST"])
def login() -> Response:
    username = request.form.get("username", "")
    password = request.form.get("password", "")
    if username == "guest" and password == "guest":
        token = jwt_encode({"sub": "guest", "role": "user"})
        resp = redirect("/admin", code=302)
        resp.set_cookie("session", token)
        return resp
    return page("Login", '<p class="error">Invalid credentials.</p><a class="btn" href="/">Back</a>', status=401)


@app.route("/admin")
def admin() -> Response:
    token = request.cookies.get("session")
    if not token:
        return page("Admin", '<p class="error">No session.</p><a class="btn" href="/">Login</a>', status=401)

    try:
        claims = jwt_decode(token)
    except Exception as exc:
        return page("Admin", f'<p class="error">Invalid token: {exc}</p><a class="btn" href="/">Back</a>', status=401)

    if claims.get("role") == "admin":
        return page("Admin", f'<h2>Admin Console</h2><p>Flag:</p><p class="flag">{read_flag()}</p>')

    return page(
        "Admin",
        f'<p>Hello {claims.get("sub", "?")} (role={claims.get("role")}). '
        f'This console is restricted to admins.</p><a class="btn" href="/">Back</a>',
        status=403,
    )
