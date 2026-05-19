use wasm_bindgen::prelude::*;

mod parser;
mod commands;

pub use parser::{ParsedCommand, parse_command};
pub use commands::{execute_native, NativeCommandResult};

/// WASM entry point: parse a command string into tokens.
#[wasm_bindgen]
pub fn wasm_parse_command(input: &str) -> JsValue {
    let parsed = parse_command(input);
    serde_wasm_bindgen::to_value(&parsed).unwrap_or(JsValue::NULL)
}

/// WASM entry point: execute a Rust-native command if one exists.
/// Returns null if the command is not Rust-native.
#[wasm_bindgen]
pub fn wasm_execute_native(command: &str, args: JsValue, flags: JsValue) -> JsValue {
    let args_vec: Vec<String> = serde_wasm_bindgen::from_value(args).unwrap_or_default();
    let flags_map: std::collections::HashMap<String, String> =
        serde_wasm_bindgen::from_value(flags).unwrap_or_default();
    let result = execute_native(command, &args_vec, &flags_map);
    match result {
        Some(r) => serde_wasm_bindgen::to_value(&r).unwrap_or(JsValue::NULL),
        None => JsValue::NULL,
    }
}
