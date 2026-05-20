# Getting Started

## Platform Overview

Web eXploitation Laboratory (WXL) is a Web-security challenge platform that runs entirely in the browser. The platform is built on a **WebAssembly (WASM) architecture** — every tool and script runtime lives on the front-end, so no backend server is required.

Highlights:

- **Zero backend dependency**: every challenge tool (Python runtime, terminal, network traffic log) runs inside the browser
- **Privacy by design**: attack scripts and test data never leave your device
- **Ready to go**: just a modern browser — no software install, no environment setup

## System Requirements

| Requirement | Details |
|---|---|
| Browser | A modern browser with WebAssembly support (Chrome 89+, Firefox 89+, Safari 15+, Edge 89+) |
| Network | The first visit downloads the Pyodide runtime (~10–20 MB); afterwards the platform works offline |
| JavaScript | Must be enabled |
| Service Worker | Some features rely on Service Workers — make sure your browser is not blocking them |

> **Tip**: A desktop browser is recommended for the best experience. Mobile browsers may feel cramped due to limited screen space.

## Quick Start

### Step 1: Pick a challenge

Browse every available challenge on the challenge list page. Each entry shows a difficulty level and a topic tag (for example: SQL Injection, XSS, Command Injection). Click a card to enter the challenge page.

### Step 2: Use the tools

The challenge page exposes several built-in tool panels:

- Use the **Browser** panel to navigate the target site and observe its behavior
- Use the **Network Traffic Log** panel to intercept and analyze HTTP requests
- Use the **Code Editor** to write and run Python attack scripts
- Use the **Terminal** to invoke the built-in command-line utilities
- Use the **HTTP Repeater** to edit and replay specific requests
- Use **Pentest Notes** to record observations and intermediate results

### Step 3: Submit the flag

Once you successfully exploit the vulnerability you obtain a flag string (typically formatted as `flag{...}`). Paste the flag into the submission box at the bottom of the challenge page and submit it to clear the challenge.

## Tool Overview

| Tool | Panel label | Primary purpose |
|---|---|---|
| Code Editor / Pyodide | Code Editor | Run Python 3 scripts inside the browser, with HTTP request simulation |
| Terminal / wxlsh | Terminal | Invoke built-in command-line utilities, including encoders and `curl`-style commands |
| Built-in browser | Browser | Browse and interact with the target challenge application |
| Network Traffic Log | Network | Record and inspect every HTTP request and response in full |
| HTTP Repeater | Repeater | Modify the method, headers, and parameters of a request and replay it |
| Pentest Notes | Notes | Freely record the testing process, observations, and exploitation ideas |

## FAQ

**Q: Why does the page load slowly the first time?**

When you open a challenge page for the first time, the platform downloads the Pyodide WebAssembly runtime (~10–20 MB). Please be patient until the load completes. Subsequent visits use the browser cache and load much faster.

**Q: What if a Python script runs but prints nothing?**

Make sure your script calls `print()` to emit output. Pyodide also takes a moment to initialize, so if you run a script immediately after opening the page, you may see a "Pyodide not ready yet" notice — wait a few seconds and try again.

**Q: The Network Traffic Log shows no requests — why?**

The Network Traffic Log only records requests issued through the **Browser** panel. Requests made from the Code Editor via the `requests` module appear in the Code Editor's output area, not in the Network panel.

**Q: Do Pentest Notes disappear after closing the page?**

No. Pentest Notes are stored in the browser's `localStorage`. As long as you do not clear your browser data, you will see your previous notes the next time you open the page.

**Q: Are third-party packages importable in the Code Editor?**

The platform supports the standard library modules bundled with Pyodide (such as `json`, `re`, `base64`, `hashlib`) and the platform-provided `requests` stub. `pip install` is not supported, and third-party packages that are not bundled with Pyodide cannot be imported.
