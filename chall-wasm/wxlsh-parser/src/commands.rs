use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The result of executing a Rust-native wxlsh command.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeCommandResult {
    /// Output text to display in the terminal.
    pub output: String,
    /// Whether the terminal should be cleared before displaying the output.
    pub clear: bool,
}

impl NativeCommandResult {
    fn text(output: impl Into<String>) -> Self {
        NativeCommandResult { output: output.into(), clear: false }
    }

    fn clear_screen() -> Self {
        NativeCommandResult { output: String::new(), clear: true }
    }
}

/// Try to execute a Rust-native command.
///
/// Returns `Some(result)` if the command is handled natively,
/// or `None` if the command should fall through to the Python backend.
pub fn execute_native(
    command: &str,
    args: &[String],
    _flags: &HashMap<String, String>,
) -> Option<NativeCommandResult> {
    match command {
        "help" => Some(cmd_help()),
        "clear" => Some(NativeCommandResult::clear_screen()),
        "base64" => Some(cmd_base64(args)),
        "hex" => Some(cmd_hex(args)),
        _ => None,
    }
}

// ─── Command Implementations ──────────────────────────────────────────────────

fn cmd_help() -> NativeCommandResult {
    let text = "\
wxlsh 1.0 — web exploit shell

Built-in commands:
  help              Show this help message
  clear             Clear the terminal screen
  base64 <text>     Base64-encode a string
  base64 -d <text>  Base64-decode a string
  hex <text>        Hex-encode a string (UTF-8 bytes)
  hex -d <text>     Hex-decode a hex string

HTTP commands (Python-backed):
  curl <url>                    HTTP GET request
  curl -X <METHOD> <url>        Custom method
  curl -d <body> <url>          POST with body
  curl -H <header:value> <url>  Add header

Use 'clear' to reset the terminal.";
    NativeCommandResult::text(text)
}

fn cmd_base64(args: &[String]) -> NativeCommandResult {
    use std::fmt::Write;

    // Check for -d flag in args (simple scan, flags are already parsed but we also
    // accept positional "-d" for UX compatibility)
    let decode = args.first().map(|a| a == "-d").unwrap_or(false);
    let data_args: &[String] = if decode { &args[1..] } else { args };

    if data_args.is_empty() {
        return NativeCommandResult::text(
            "Usage: base64 <text>\n       base64 -d <encoded>",
        );
    }

    let data = data_args.join(" ");

    if decode {
        // Decode: accept both standard and URL-safe base64, ignore whitespace
        let cleaned: String = data.chars().filter(|c| !c.is_ascii_whitespace()).collect();
        match base64_decode(&cleaned) {
            Ok(bytes) => match String::from_utf8(bytes) {
                Ok(s) => NativeCommandResult::text(s),
                Err(e) => {
                    // Not valid UTF-8: show hex dump
                    let mut out = String::from("(non-UTF-8 bytes)\n");
                    for b in e.as_bytes() {
                        let _ = write!(out, "{:02x} ", b);
                    }
                    NativeCommandResult::text(out.trim_end().to_string())
                }
            },
            Err(msg) => NativeCommandResult::text(format!("base64 decode error: {}", msg)),
        }
    } else {
        NativeCommandResult::text(base64_encode(data.as_bytes()))
    }
}

fn cmd_hex(args: &[String]) -> NativeCommandResult {
    let decode = args.first().map(|a| a == "-d").unwrap_or(false);
    let data_args: &[String] = if decode { &args[1..] } else { args };

    if data_args.is_empty() {
        return NativeCommandResult::text(
            "Usage: hex <text>\n       hex -d <hex-string>",
        );
    }

    let data = data_args.join(" ");

    if decode {
        let cleaned: String = data.chars().filter(|c| !c.is_ascii_whitespace()).collect();
        match hex_decode(&cleaned) {
            Ok(bytes) => match String::from_utf8(bytes) {
                Ok(s) => NativeCommandResult::text(s),
                Err(e) => {
                    let hex: String = e.as_bytes().iter()
                        .map(|b| format!("{:02x}", b))
                        .collect::<Vec<_>>()
                        .join(" ");
                    NativeCommandResult::text(format!("(non-UTF-8 bytes)\n{}", hex))
                }
            },
            Err(msg) => NativeCommandResult::text(format!("hex decode error: {}", msg)),
        }
    } else {
        let hex: String = data.as_bytes().iter()
            .map(|b| format!("{:02x}", b))
            .collect::<Vec<_>>()
            .join(" ");
        NativeCommandResult::text(hex)
    }
}

// ─── Minimal Base64 (no external deps) ───────────────────────────────────────

const BASE64_CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn base64_encode(input: &[u8]) -> String {
    let mut out = String::new();
    for chunk in input.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(BASE64_CHARS[((n >> 18) & 0x3f) as usize] as char);
        out.push(BASE64_CHARS[((n >> 12) & 0x3f) as usize] as char);
        if chunk.len() > 1 {
            out.push(BASE64_CHARS[((n >> 6) & 0x3f) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(BASE64_CHARS[(n & 0x3f) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

fn base64_char_value(c: char) -> Option<u8> {
    match c {
        'A'..='Z' => Some(c as u8 - b'A'),
        'a'..='z' => Some(c as u8 - b'a' + 26),
        '0'..='9' => Some(c as u8 - b'0' + 52),
        '+' | '-' => Some(62), // accept URL-safe '-' too
        '/' | '_' => Some(63), // accept URL-safe '_' too
        _ => None,
    }
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    let input = input.trim_end_matches('=');
    let mut out = Vec::new();
    let chars: Vec<u8> = input
        .chars()
        .map(|c| base64_char_value(c).ok_or_else(|| format!("invalid char '{}'", c)))
        .collect::<Result<Vec<_>, _>>()?;

    for chunk in chars.chunks(4) {
        let c0 = chunk[0] as u32;
        let c1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let c2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let c3 = chunk.get(3).copied().unwrap_or(0) as u32;
        let n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
        out.push(((n >> 16) & 0xff) as u8);
        if chunk.len() > 2 {
            out.push(((n >> 8) & 0xff) as u8);
        }
        if chunk.len() > 3 {
            out.push((n & 0xff) as u8);
        }
    }
    Ok(out)
}

fn hex_decode(input: &str) -> Result<Vec<u8>, String> {
    // Accept both "aabbcc" and "aa bb cc" (already stripped whitespace by caller)
    if input.len() % 2 != 0 {
        return Err(format!("odd length hex string ({})", input.len()));
    }
    (0..input.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&input[i..i + 2], 16)
                .map_err(|_| format!("invalid hex byte '{}'", &input[i..i + 2]))
        })
        .collect()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn run(cmd: &str, args: &[&str]) -> NativeCommandResult {
        execute_native(cmd, &args.iter().map(|s| s.to_string()).collect::<Vec<_>>(), &HashMap::new())
            .expect("command should be native")
    }

    #[test]
    fn help_returns_text() {
        let r = run("help", &[]);
        assert!(!r.output.is_empty());
        assert!(r.output.contains("wxlsh"));
        assert!(!r.clear);
    }

    #[test]
    fn clear_sets_clear_flag() {
        let r = run("clear", &[]);
        assert!(r.clear);
    }

    #[test]
    fn unknown_command_returns_none() {
        let result = execute_native("unknowncmd", &[], &HashMap::new());
        assert!(result.is_none());
    }

    #[test]
    fn base64_encode_hello() {
        let r = run("base64", &["hello"]);
        assert_eq!(r.output, "aGVsbG8=");
    }

    #[test]
    fn base64_decode_hello() {
        let r = run("base64", &["-d", "aGVsbG8="]);
        assert_eq!(r.output, "hello");
    }

    #[test]
    fn base64_no_args_shows_usage() {
        let r = run("base64", &[]);
        assert!(r.output.contains("Usage"));
    }

    #[test]
    fn base64_encode_roundtrip() {
        let original = "The quick brown fox";
        let encoded = base64_encode(original.as_bytes());
        let decoded = base64_decode(&encoded).unwrap();
        assert_eq!(String::from_utf8(decoded).unwrap(), original);
    }

    #[test]
    fn hex_encode_hello() {
        let r = run("hex", &["hello"]);
        assert_eq!(r.output, "68 65 6c 6c 6f");
    }

    #[test]
    fn hex_decode_hello() {
        let r = run("hex", &["-d", "68656c6c6f"]);
        assert_eq!(r.output, "hello");
    }

    #[test]
    fn hex_no_args_shows_usage() {
        let r = run("hex", &[]);
        assert!(r.output.contains("Usage"));
    }

    #[test]
    fn hex_roundtrip() {
        let original = "wxlsh";
        let encoded = original.as_bytes().iter()
            .map(|b| format!("{:02x}", b))
            .collect::<Vec<_>>()
            .join("");
        let decoded = hex_decode(&encoded).unwrap();
        assert_eq!(String::from_utf8(decoded).unwrap(), original);
    }
}
