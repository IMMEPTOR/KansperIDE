pub mod lexer;
pub mod ast;
pub mod parser;
pub mod interpreter;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationResult {
    pub success: bool,
    pub output: String,
    pub errors: Vec<String>,
}

pub fn compile_and_run(code: String) -> CompilationResult {
    use std::sync::{Arc, Mutex};
    
    let output = Arc::new(Mutex::new(String::new()));
    let output_clone = output.clone();
    
    let mut errors = Vec::new();
    
    // Лексический анализ
    let mut lexer = lexer::Lexer::new(code);
    let tokens = match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        lexer.tokenize()
    })) {
        Ok(tokens) => tokens,
        Err(_) => {
            errors.push("Ошибка лексического анализа".to_string());
            return CompilationResult {
                success: false,
                output: String::new(),
                errors,
            };
        }
    };
    
    // Парсинг
    let mut parser = parser::Parser::new(tokens);
    let program = match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        parser.parse()
    })) {
        Ok(program) => program,
        Err(e) => {
            let error_msg = if let Some(s) = e.downcast_ref::<String>() {
                s.clone()
            } else if let Some(s) = e.downcast_ref::<&str>() {
                s.to_string()
            } else {
                "Ошибка синтаксического анализа".to_string()
            };
            errors.push(error_msg);
            return CompilationResult {
                success: false,
                output: String::new(),
                errors,
            };
        }
    };
    
    // Выполнение
    let mut interpreter = interpreter::Interpreter::new();
    
    // Перехватываем вывод
    interpreter.set_output_handler(Box::new(move |text| {
        let mut out = output_clone.lock().unwrap();
        out.push_str(&text);
        out.push('\n');
    }));
    
    match interpreter.execute(program) {
        Ok(_) => {
            let final_output = output.lock().unwrap().clone();
            CompilationResult {
                success: true,
                output: final_output,
                errors: Vec::new(),
            }
        }
        Err(e) => {
            errors.push(e);
            let final_output = output.lock().unwrap().clone();
            CompilationResult {
                success: false,
                output: final_output,
                errors,
            }
        }
    }
}