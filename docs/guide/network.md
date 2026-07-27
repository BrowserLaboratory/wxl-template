# Network Traffic & HTTP Repeater

## Network Traffic Log Panel

The Network Traffic Log panel automatically records every HTTP request the challenge issues, along with its matching response. Each entry shows the following fields:

| Field | Description |
|---|---|
| # | Sequence number of the entry, in capture order |
| Method | HTTP request method (GET, POST, PUT, DELETE, etc.) |
| URL | Request path and query string (the host is omitted to keep entries readable) |
| Status | HTTP response status code (colour-coded) |
| Time | Time elapsed from request dispatch to response receipt (milliseconds) |

Clicking any entry in the list expands a detail area with two sub-tabs and a **Send to Repeater** button:

- **Request**: the complete request rendered as one raw HTTP message — request line, headers, blank line, body
- **Response**: the raw response — status line, headers, blank line, body

Because both tabs show whole messages rather than field-by-field breakdowns, you can copy either one straight into the Repeater or into a script.

> **Note**: Every tool panel shares one dispatch layer, so the log captures requests from all of them — the Browser panel, the Repeater, `curl` and `wget` in the Terminal, and the `requests` module inside the Code Editor. The list itself does not label which panel a request came from, so use the sequence number and timing to line entries up with the action that produced them.

## HTTP Status Codes

The panel colour-codes status code classes so you can identify request outcomes at a glance:

| Status Range | Colour | Description |
|---|---|---|
| 2xx | Green | Successful request (200 OK, 201 Created, 204 No Content, etc.) |
| 3xx | Yellow | Redirection (301 Moved Permanently, 302 Found, 304 Not Modified, etc.) |
| 4xx | Orange | Client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, etc.) |
| 5xx | Red | Server error (500 Internal Server Error, 502 Bad Gateway, etc.) |

What common status codes mean during a penetration test:

| Status Code | Pentest Meaning |
|---|---|
| `200 OK` | Request processed normally — inspect the response body for sensitive data |
| `302 Found` | Post-login redirect, often a sign that authentication succeeded |
| `401 Unauthorized` | Authentication is required — try bypass techniques or brute force |
| `403 Forbidden` | Insufficient permissions — try header manipulation (e.g. `X-Forwarded-For`) or path traversal |
| `500 Internal Server Error` | Server-side error that may leak SQL syntax errors or stack traces |

## Send to Repeater Workflow

The Network Traffic Log integrates tightly with the HTTP Repeater. When you spot a request worth analysing or tampering with further, send it to the Repeater with these steps:

1. In the Network Traffic Log list, click the request entry you want to analyse
2. After the detail panel expands, click the "**Send to Repeater**" button
3. The complete request is written into the Repeater's raw request editor as one HTTP message
4. Switch to the **Repeater** panel to edit and resend it

> **Tip**: Once you find a suspicious request, use Send to Repeater right away. This avoids repeating actions in the Browser panel and cluttering the log with noise.

## HTTP Repeater

The HTTP Repeater lets you freely edit every part of an HTTP request, resend it, and inspect the response in real time. It is the core tool for testing parameter tampering, header bypasses, and injection vulnerabilities.

Rather than splitting the request across separate fields, the Repeater gives you one **Raw HTTP Request** editing area holding the whole message — request line, headers, blank line, body — the same way Burp Repeater does.

| Component | Description |
|---|---|
| Raw HTTP Request area | A single editor holding the complete request text: request line, headers, an empty line, then the body |
| Send button | Dispatch the request exactly as written |
| Response pane | Displays the raw response — status line, headers, and body |
| Saved Snapshots sidebar | Name and store the current request; click a saved entry to restore it, or use the × to delete it |

### Raw Request Format

Write the request the way it goes on the wire: the request line first, then one header per line, then an empty line, then the body.

```
POST /login HTTP/1.1
Host: target.local
Content-Type: application/json
Cookie: session=abc123; admin=false
X-Forwarded-For: 127.0.0.1

{"username": "admin", "password": "test"}
```

The empty line between headers and body is required — without it the body is parsed as another header.

### Body Formats

Form format (`application/x-www-form-urlencoded`):

```
username=admin&password=test&remember=true
```

JSON format (`application/json`):

```json
{
  "username": "admin",
  "password": "' OR '1'='1"
}
```

## End-to-End Workflow Example

The following walks through a complete test flow, from spotting the issue to successfully exploiting the vulnerability:

**Scenario**: The admin login page of a challenge appears to be vulnerable to SQL Injection

### Step 1: Observe in the Browser Panel

In the Browser panel, open `http://target.local/login`, enter test credentials, and click login.

### Step 2: Analyse in the Network Traffic Log

In the Network Traffic Log panel, locate the `POST /login` row — method `POST`, path `/login`, status `302`. Expand it and the **Request** tab shows the whole message:

```
POST /login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=testuser&password=testpass
```

### Step 3: Send to Repeater

Click "Send to Repeater" to forward this request to the Repeater panel.

### Step 4: Tamper With the Parameters

In the Repeater's raw request editor, change the `password` parameter in the body to a SQL Injection payload:

```
POST /login HTTP/1.1
Host: target.local
Content-Type: application/x-www-form-urlencoded

username=admin&password=' OR '1'='1' --
```

Click "Send" to dispatch the modified request. Save it as a snapshot first if you plan to try several payload variants — restoring a snapshot is faster than retyping the request.

### Step 5: Inspect the Response and Capture the flag

If the Response viewer now shows status `200 OK` and the response body contains a welcome message or a flag, the injection succeeded:

```
HTTP/1.1 200 OK

Welcome, admin! Your flag is: flag{sql_injection_success}
```

Copy the flag and submit it on the challenge page to complete the task.

## Combining the Terminal and Code Editor With the Traffic Log

The Browser panel is not the only source the Traffic Log records. Because every panel dispatches through the same layer, you can probe from the Terminal, sweep from the Code Editor, and still review and replay everything from one list.

This walkthrough uses a challenge that offers a Terminal tab. On a challenge without one, start at Step 2 and probe from the Code Editor instead — the Traffic Log behaves the same either way.

**Scenario**: an endpoint returns different content for some `id` values, and you want to find which one hides the flag.

### Step 1: Probe once from the Terminal

Confirm the endpoint responds and inspect its headers before writing any script:

```
hacker@wxlsh:~$ curl -i "http://target.local/api/user?id=1"
HTTP 200
content-type: application/json

{
  "id": 1,
  "name": "guest",
  "role": "user"
}
```

A JSON response is re-indented before it is printed, so the body you see is pretty-printed rather than the exact bytes on the wire. Open the entry in the Traffic Log when you need the raw form.

### Step 2: Sweep the range from the Code Editor

Switch to the Code Editor and iterate over the parameter with `requests`:

```python
import requests

for i in range(1, 30):
    r = requests.get("http://target.local/api/user", params={"id": i})
    if "admin" in r.text or "flag" in r.text.lower():
        print(f"[!] id={i}: {r.text[:200]}")
```

### Step 3: Review both sources in the Traffic Log

Open the Network Traffic Log. The single `curl` probe and every request the loop issued are all listed, numbered in capture order. The list is not sortable, so scan down the Status column for the row that breaks the pattern — then expand it to read the raw request and response.

### Step 4: Refine the winning request in the Repeater

Expand the entry that returned the interesting response and click **Send to Repeater**. The raw request lands in the Repeater's editor, where you can adjust a header or a parameter and resend without rerunning the whole sweep. Save a snapshot before each variation so you can jump back to a known-good request.

This is the loop worth internalising: probe in the Terminal, scale in the Code Editor, review in the Traffic Log, refine in the Repeater.
