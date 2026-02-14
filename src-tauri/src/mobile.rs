use crate::compiler;

#[tauri::mobile_entry_point]
fn mobile_main() {
    crate::main();
}