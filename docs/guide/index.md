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
| Code Editor / Pyodide | Code | Run Python 3 scripts inside the browser, with HTTP request simulation |
| Terminal / wxlsh | Terminal | Invoke built-in command-line utilities, including encoders and `curl`-style commands |
| Built-in browser | Browser | Browse and interact with the target challenge application |
| Network Traffic Log | Network | Record and inspect every HTTP request and response in full |
| HTTP Repeater | Repeater | Modify the method, headers, and parameters of a request and replay it |
| Pentest Notes | — (nav-bar button, opens a modal) | Freely record the testing process, observations, and exploitation ideas |

## FAQ

**Q: Why does the page load slowly the first time?**

When you open a challenge page for the first time, the platform downloads the Pyodide WebAssembly runtime (~10–20 MB). Please be patient until the load completes. Subsequent visits use the browser cache and load much faster.

**Q: What if a Python script runs but prints nothing?**

Make sure your script calls `print()` to emit output. Pyodide also takes a moment to initialize, but you cannot run a script early by accident: until the runtime is ready the Run button is disabled and reads "Loading…". Wait for it to turn into "▶ Run".

**Q: The Network Traffic Log shows no requests — why?**

Every tool panel shares one dispatch layer, so the log captures requests from the Browser panel, the Repeater, the Terminal's `curl` and `wget`, and the Code Editor's `requests` calls alike. An empty log usually means no request has been issued yet — interact with the challenge first.

**Q: Do Pentest Notes disappear after closing the page?**

Only the notes you explicitly save. Saving writes the note to the browser's IndexedDB, and those notes reappear the next time you open the page as long as you do not clear your browser data. Text still sitting in the editor has not been saved anywhere, so closing or reloading the page discards it — save before you navigate away.

**Q: Are third-party packages importable in the Code Editor?**

Yes. Alongside the standard library modules bundled with Pyodide (such as `json`, `re`, `base64`, `hashlib`), the platform installs third-party packages with micropip — that is how the real `requests` library is provided. A challenge author declares any extra packages in the challenge's `packages` frontmatter field, and they are installed when the runtime starts. You cannot run `pip install` from a script yourself; the package set is fixed by the challenge.
