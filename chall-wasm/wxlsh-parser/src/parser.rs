use serde::{Deserialize, Serialize};

/// The result of parsing a shell-like command line.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParsedCommand {
    /// The command name (first token).
    pub command: String,
    /// Positional arguments (non-flag tokens after the command).
    pub args: Vec<String>,
    /// Named flags. Values:
    ///   `--foo=bar`  → ("foo", "bar")
    ///   `--verbose`  → ("verbose", "")   — boolean
    ///   `-X POST`    → ("X", "POST")     — short flag consumes next non-flag token
    ///   `-v`         → ("v", "")         — boolean when next token is absent or starts with `-`
    pub flags: std::collections::HashMap<String, String>,
}

// ─── Internal token representation ───────────────────────────────────────────

#[derive(Debug, Clone)]
struct Token {
    value: String,
    /// True when the token originated from a quoted string; quoted tokens are
    /// never treated as flags even if they look like `--something`.
    quoted: bool,
}

/// Parse a command line string into a `ParsedCommand`.
///
/// Flag parsing conventions (designed for wxlsh/web-exploit context):
///
/// | Syntax            | Result                                          |
/// |-------------------|-------------------------------------------------|
/// | `--flag=value`    | long flag with explicit value                   |
/// | `--flag`          | long boolean flag (never consumes next token)   |
/// | `-f value`        | short flag: consumes next non-flag token        |
/// | `-f`              | short boolean flag (next token is flag or EOF)  |
/// | `"--flag-like"`   | positional arg (quoted tokens skip flag parse)  |
///
/// Long flags NEVER consume the next token — use `--flag=value` for values.
/// Short flags consume the next token ONLY if it does not start with `-`.
pub fn parse_command(input: &str) -> ParsedCommand {
    let tokens = tokenize(input);
    build_parsed(&tokens)
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

fn tokenize(input: &str) -> Vec<Token> {
    let mut tokens: Vec<Token> = Vec::new();
    let mut current = String::new();
    let mut chars = input.chars().peekable();
    let mut in_quote: Option<char> = None;
    let mut is_quoted = false;

    while let Some(ch) = chars.next() {
        match (in_quote, ch) {
            // Start of a quoted string
            (None, '"') | (None, '\'') => {
                in_quote = Some(ch);
                is_quoted = true;
            }
            // End of a quoted string
            (Some(q), c) if c == q => {
                in_quote = None;
                // Flush the quoted token immediately (even if empty)
                tokens.push(Token { value: std::mem::take(&mut current), quoted: true });
                is_quoted = false;
            }
            // Backslash escape inside double quotes
            (Some('"'), '\\') => {
                if let Some(escaped) = chars.next() {
                    match escaped {
                        'n' => current.push('\n'),
                        't' => current.push('\t'),
                        'r' => current.push('\r'),
                        _ => current.push(escaped),
                    }
                }
            }
            // Whitespace outside quotes → flush unquoted token
            (None, c) if c.is_ascii_whitespace() => {
                if !current.is_empty() {
                    tokens.push(Token { value: std::mem::take(&mut current), quoted: is_quoted });
                    is_quoted = false;
                }
            }
            // All other characters
            (_, c) => {
                current.push(c);
            }
        }
    }

    // Flush any remaining unquoted token
    if !current.is_empty() {
        tokens.push(Token { value: current, quoted: is_quoted });
    }

    tokens
}

// ─── Parser ───────────────────────────────────────────────────────────────────

fn build_parsed(tokens: &[Token]) -> ParsedCommand {
    if tokens.is_empty() {
        return ParsedCommand {
            command: String::new(),
            args: Vec::new(),
            flags: std::collections::HashMap::new(),
        };
    }

    let command = tokens[0].value.clone();
    let mut args: Vec<String> = Vec::new();
    let mut flags: std::collections::HashMap<String, String> = std::collections::HashMap::new();

    let mut i = 1;
    while i < tokens.len() {
        let tok = &tokens[i];

        // Quoted tokens are always positional — never treated as flags.
        if tok.quoted {
            args.push(tok.value.clone());
            i += 1;
            continue;
        }

        if let Some(long) = tok.value.strip_prefix("--") {
            // Long flag: --key=value  OR  --key (boolean — never consumes next token)
            if let Some(eq_pos) = long.find('=') {
                let key = long[..eq_pos].to_string();
                let val = long[eq_pos + 1..].to_string();
                flags.insert(key, val);
            } else {
                // Boolean long flag — value is always empty
                flags.insert(long.to_string(), String::new());
            }
        } else if let Some(short) = tok.value.strip_prefix('-') {
            if short.is_empty() {
                // Bare "-" → treat as positional
                args.push(tok.value.clone());
            } else {
                // Short flag: -f [value]
                // Consume the next token as value ONLY if it does not start with '-'.
                let key = short.to_string();
                let val = if let Some(next) = tokens.get(i + 1) {
                    if !next.value.starts_with('-') && !next.quoted {
                        i += 1;
                        next.value.clone()
                    } else if !next.value.starts_with('-') && next.quoted {
                        // Quoted value after short flag is treated as its value
                        i += 1;
                        next.value.clone()
                    } else {
                        String::new()
                    }
                } else {
                    String::new()
                };
                flags.insert(key, val);
            }
        } else {
            args.push(tok.value.clone());
        }

        i += 1;
    }

    ParsedCommand { command, args, flags }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn flags_of(cmd: &ParsedCommand) -> &std::collections::HashMap<String, String> {
        &cmd.flags
    }

    #[test]
    fn empty_input_returns_empty_command() {
        let p = parse_command("");
        assert_eq!(p.command, "");
        assert!(p.args.is_empty());
        assert!(p.flags.is_empty());
    }

    #[test]
    fn whitespace_only_returns_empty_command() {
        let p = parse_command("   ");
        assert_eq!(p.command, "");
    }

    #[test]
    fn simple_command_no_args() {
        let p = parse_command("help");
        assert_eq!(p.command, "help");
        assert!(p.args.is_empty());
        assert!(p.flags.is_empty());
    }

    #[test]
    fn command_with_positional_args() {
        let p = parse_command("curl https://example.com /path");
        assert_eq!(p.command, "curl");
        assert_eq!(p.args, vec!["https://example.com", "/path"]);
    }

    #[test]
    fn long_flag_with_equals() {
        let p = parse_command("curl --method=POST https://x.com");
        assert_eq!(flags_of(&p).get("method"), Some(&"POST".to_string()));
        assert_eq!(p.args, vec!["https://x.com"]);
    }

    /// Long flags without `=` are ALWAYS boolean (never consume next token).
    /// Use `--flag=value` to pass a value to a long flag.
    #[test]
    fn long_flag_without_equals_is_boolean() {
        let p = parse_command("curl --method POST https://x.com");
        // --method without `=` → boolean flag; POST and https://x.com become positional
        assert_eq!(flags_of(&p).get("method"), Some(&String::new()));
        assert_eq!(p.args, vec!["POST", "https://x.com"]);
    }

    #[test]
    fn boolean_long_flag() {
        let p = parse_command("curl --verbose https://x.com");
        assert_eq!(flags_of(&p).get("verbose"), Some(&String::new()));
        assert_eq!(p.args, vec!["https://x.com"]);
    }

    #[test]
    fn short_flag_with_value() {
        let p = parse_command("curl -X POST https://x.com");
        assert_eq!(flags_of(&p).get("X"), Some(&"POST".to_string()));
        assert_eq!(p.args, vec!["https://x.com"]);
    }

    /// Short flag followed by another flag (starts with `-`) → boolean.
    #[test]
    fn short_boolean_flag() {
        let p = parse_command("curl -v --method=GET https://x.com");
        assert_eq!(flags_of(&p).get("v"), Some(&String::new()));
        assert_eq!(flags_of(&p).get("method"), Some(&"GET".to_string()));
        assert_eq!(p.args, vec!["https://x.com"]);
    }

    #[test]
    fn double_quoted_string_becomes_single_token() {
        let p = parse_command(r#"echo "hello world""#);
        assert_eq!(p.command, "echo");
        assert_eq!(p.args, vec!["hello world"]);
    }

    #[test]
    fn single_quoted_string_becomes_single_token() {
        let p = parse_command("echo 'hello world'");
        assert_eq!(p.command, "echo");
        assert_eq!(p.args, vec!["hello world"]);
    }

    /// Quoted tokens that look like flags are treated as positional args.
    #[test]
    fn quoted_string_with_flag_chars() {
        let p = parse_command(r#"echo "--not-a-flag""#);
        assert_eq!(p.command, "echo");
        assert_eq!(p.args, vec!["--not-a-flag"]);
        assert!(p.flags.is_empty());
    }

    #[test]
    fn escape_sequences_in_double_quotes() {
        let p = parse_command(r#"echo "line1\nline2""#);
        assert_eq!(p.args[0], "line1\nline2");
    }

    #[test]
    fn multiple_flags_mixed() {
        // Long flag --header uses `=`; --verbose is boolean (no `=`); -X takes next token.
        let p = parse_command("req -X POST --header=Authorization:Bearer --verbose url");
        assert_eq!(p.command, "req");
        assert_eq!(flags_of(&p).get("X"), Some(&"POST".to_string()));
        assert_eq!(
            flags_of(&p).get("header"),
            Some(&"Authorization:Bearer".to_string())
        );
        assert_eq!(flags_of(&p).get("verbose"), Some(&String::new()));
        assert_eq!(p.args, vec!["url"]);
    }

    #[test]
    fn short_flag_with_quoted_value() {
        let p = parse_command(r#"curl -d '{"key":"value"}' https://x.com"#);
        assert_eq!(flags_of(&p).get("d"), Some(&r#"{"key":"value"}"#.to_string()));
        assert_eq!(p.args, vec!["https://x.com"]);
    }
}
