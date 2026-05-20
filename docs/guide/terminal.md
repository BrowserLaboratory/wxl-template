# Terminal Tool

## Terminal Interface Overview

The Terminal panel provides an in-browser command-line environment powered by the platform's custom **wxlsh** shell. wxlsh ships with built-in commands commonly used in security testing, including encoding conversions, HTTP requests, and data parsing utilities.

Interface regions:

| Region | Description |
|---|---|
| Output area | Displays command results and system messages |
| Input line | Where you type commands; supports history navigation |
| Prompt | `wxlsh $` indicates the shell is ready to accept input |

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

Show the description list for every command available in wxlsh.

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

Clear all current output from the terminal and return to a blank screen.

**Syntax**

```
clear
cls
```

---

### base64 encode

Base64-encode the given plain text string and print the result.

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

Decode a Base64-encoded string and print the original text.

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

Convert each character of a text string into its corresponding hexadecimal ASCII code.

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

Convert a hexadecimal string back to readable text.

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

Send an HTTP GET request to the given URL and print the response body to the terminal. Useful for quickly inspecting API responses or probing whether an endpoint exists.

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

Apply URL percent-encoding to a string, converting special characters into the `%XX` form. Useful for crafting query parameters that contain special characters.

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

Convert a URL percent-encoded string back to its original text.

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

wxlsh records the commands executed during the current session, and you can use the arrow keys to browse and reuse them quickly.

| Key | Action |
|---|---|
| `↑` (Up) | Show the previous command in history |
| `↓` (Down) | Show the next command in history (toward newer entries) |

> **Note**: History is only kept for the current page session; refreshing the page clears the history.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + A` | Move the cursor to the beginning of the input line |
| `Ctrl + E` | Move the cursor to the end of the input line |
| `Ctrl + L` | Clear the terminal screen (equivalent to the `clear` command) |
| `Ctrl + C` | Abort the current input, empty the input line, and move to a new line |
