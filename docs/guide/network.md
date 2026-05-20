# Network Traffic & HTTP Repeater

## Network Traffic Log Panel

The Network Traffic Log panel automatically records every HTTP request issued from the **Browser panel**, along with its matching response. Each entry shows the following fields:

| Field | Description |
|---|---|
| Method | HTTP request method (GET, POST, PUT, DELETE, etc.) |
| URL | Full target URL of the request |
| Status | HTTP response status code (colour-coded) |
| Timing | Time elapsed from request dispatch to response receipt (milliseconds) |

Clicking any entry in the list expands a detail area showing:

- **Request Headers**: the complete request headers
- **Request Body**: the request body (for POST/PUT requests)
- **Response Headers**: the complete response headers
- **Response Body**: the response body content

> **Note**: The Network Traffic Log only records requests issued from the Browser panel. Requests sent via the `requests` module inside the Code Editor do not appear in this panel.

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
3. Every part of the request (method, URL, headers, body) is automatically populated into the HTTP Repeater panel
4. Switch to the **Repeater** panel to edit and resend it

> **Tip**: Once you find a suspicious request, use Send to Repeater right away. This avoids repeating actions in the Browser panel and cluttering the log with noise.

## HTTP Repeater

The HTTP Repeater lets you freely edit every part of an HTTP request, resend it, and inspect the response in real time. It is the core tool for testing parameter tampering, header bypasses, and injection vulnerabilities.

| Component | Description |
|---|---|
| Method selector | Dropdown for switching between GET, POST, PUT, DELETE, PATCH, and other HTTP methods |
| URL editor | Enter or modify the full target URL, including the query string |
| Headers editor | Edit request headers line by line in `Key: Value` format |
| Body editor | Edit the request body — supports form and JSON formats |
| Send button | Dispatch the request with the current settings |
| Response viewer | Displays the response status code, headers, and body with formatted rendering |

### Headers Editing Format

One header per line, formatted as `Header-Name: Value`:

```
Content-Type: application/json
Authorization: Bearer eyJhbGci...
Cookie: session=abc123; admin=false
X-Forwarded-For: 127.0.0.1
```

### Body Editing Format

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

In the Network Traffic Log panel, locate the `POST /login` request entry. After expanding it you see:

```
Method: POST
URL: http://target.local/login
Status: 302

Request Body:
username=testuser&password=testpass
```

### Step 3: Send to Repeater

Click "Send to Repeater" to forward this request to the Repeater panel.

### Step 4: Tamper With the Parameters

In the Repeater's Body editor, change the `password` parameter to a SQL Injection payload:

```
username=admin&password=' OR '1'='1' --
```

Click "Send" to dispatch the modified request.

### Step 5: Inspect the Response and Capture the flag

If the Response viewer now shows status `200 OK` and the response body contains a welcome message or a flag, the injection succeeded:

```
HTTP/1.1 200 OK

Welcome, admin! Your flag is: flag{sql_injection_success}
```

Copy the flag and submit it on the challenge page to complete the task.
