#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod compiler;

use compiler::{compile_and_run, CompilationResult};
use std::fs;

#[tauri::command]
fn run_code(code: String) -> CompilationResult {
    compile_and_run(code)
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Ошибка сохранения: {}", e))
}

#[tauri::command]
fn load_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Ошибка загрузки: {}", e))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            run_code,
            save_file,
            load_file,
        ])
        .run(tauri::generate_context!())
        .expect("Ошибка запуска приложения");
}