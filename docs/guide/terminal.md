# Terminal Tool

## Terminal Interface Overview

The Terminal panel exposes an in-browser command-line console driven by the platform's custom **wxlsh** shell. wxlsh ships with native utilities frequently invoked during security testing — including codec conversion, HTTP probes, and data parsing helpers.

Interface regions:

| Region | Description |
|---|---|
| Output area | Renders directive results and system notices |
| Input line | Where directives are typed; supports history navigation |
| Prompt | `wxlsh $` signals that the shell stands ready to accept input |

## Built-in Command List

| Command | Description |
|---|---|
| `help` | Show all available commands and their descriptions |
| `clear` / `cls` | Clear the terminal output screen |
| `base64 encode <text>` | Base64-encode the given text |
| `base64 decode <text>` | Decode a Base64 string back to plain text |
| `hex encode <text>` | Convert text to hexadecimal encoding |
| `hex decode <hex>` | Convert a hexadecimal string back to text |
| `curl <url>` | Send an HTTP GET request to the URL and print the response |
| `encode <text>` | URL-encode the given text |
| `decode <text>` | URL-decode the given string |

## Command Reference

### help

List every utility exposed by wxlsh alongside its purpose.

**Syntax**

```
help
```

**Example**

```
wxlsh $ help
Available commands:
  help              Show this help text
  clear / cls       Clear the screen
  base64 encode     Base64 encode
  base64 decode     Base64 decode
  ...
```

---

### clear / cls

Wipe the existing output from the console and restore a blank canvas.

**Syntax**

```
clear
cls
```

---

### base64 encode

Apply Base64 encoding to the supplied plaintext payload and emit the resulting ciphered output.

**Syntax**

```
base64 encode <text>
```

**Example**

```
wxlsh $ base64 encode admin:password
YWRtaW46cGFzc3dvcmQ=
```

---

### base64 decode

Reverse Base64 encoding on the given input and emit the original characters.

**Syntax**

```
base64 decode <encoded>
```

**Example**

```
wxlsh $ base64 decode ZmxhZ3tzZWNyZXR9
flag{secret}
```

---

### hex encode

Translate each character of the supplied input into its hexadecimal ASCII codepoint.

**Syntax**

```
hex encode <text>
```

**Example**

```
wxlsh $ hex encode hello
68656c6c6f
```

---

### hex decode

Reverse hexadecimal encoding back into human-readable characters.

**Syntax**

```
hex decode <hex>
```

**Example**

```
wxlsh $ hex decode 666c61677b68657878787d
flag{hexxx}
```

---

### curl

Issue an HTTP GET request against the supplied URL and emit the response body to the console. Handy for rapidly inspecting API replies or probing whether an endpoint exists.

**Syntax**

```
curl <url>
curl <url> -H "Header-Name: value"
```

**Example**

```
wxlsh $ curl http://target.local/api/status
{"status": "ok", "version": "1.0"}

wxlsh $ curl http://target.local/admin -H "X-Admin: true"
403 Forbidden
```

---

### encode

Apply URL percent-encoding to a payload, transforming reserved characters into the `%XX` form. Handy for crafting query parameters that carry reserved characters.

**Syntax**

```
encode <text>
```

**Example**

```
wxlsh $ encode ' OR 1=1 --
%27%20OR%201%3D1%20--
```

---

### decode

Reverse URL percent-encoding on a payload, restoring the original characters.

**Syntax**

```
decode <encoded>
```

**Example**

```
wxlsh $ decode %66%6c%61%67%7b%74%65%73%74%7d
flag{test}
```

---

## Command History

wxlsh retains every directive invoked during the current session, and the arrow keys let you browse and reuse prior entries quickly.

| Key | Action |
|---|---|
| `↑` (Up) | Surface the previous directive from history |
| `↓` (Down) | Advance to the next directive in history (toward newer entries) |

> **Note**: The session log persists only while the page stays open; refreshing the tab purges the buffer.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + A` | Jump the cursor to the start of the input line |
| `Ctrl + E` | Jump the cursor to the end of the input line |
| `Ctrl + L` | Wipe the console screen (equivalent to invoking `clear`) |
| `Ctrl + C` | Abort the current entry, empty the input line, and advance to a fresh row |
