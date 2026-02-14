use crate::compiler::ast::*;
use crate::compiler::PlotData;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH}; // Вынес импорт времени наверх

pub type OutputHandler = Box<dyn FnMut(String) + Send>;
pub type PlotHandler = Box<dyn FnMut(PlotData) + Send>;

#[derive(Debug, Clone)]
pub enum Value {
    Число(f64),
    Строка(String),
    Булево(bool),
    Функция {
        параметры: Vec<String>,
        тело: Vec<Stmt>,
    },
    Пусто,
}

pub struct Interpreter {
    variables: HashMap<String, Value>,
    functions: HashMap<String, (Vec<String>, Vec<Stmt>)>,
    output_handler: Option<OutputHandler>,
    plot_handler: Option<PlotHandler>,
}

impl Interpreter {
    pub fn new() -> Self {
        Interpreter {
            variables: HashMap::new(),
            functions: HashMap::new(),
            output_handler: None,
            plot_handler: None,
        }
    }
    
    pub fn set_output_handler(&mut self, handler: OutputHandler) {
        self.output_handler = Some(handler);
    }
    
    pub fn set_plot_handler(&mut self, handler: PlotHandler) {
        self.plot_handler = Some(handler);
    }
    
    fn print(&mut self, text: String) {
        if let Some(ref mut handler) = self.output_handler {
            handler(text);
        } else {
            println!("{}", text);
        }
    }
    
    pub fn execute(&mut self, program: Program) -> Result<(), String> {
        for stmt in program.statements {
            self.execute_statement(&stmt)?;
        }
        Ok(())
    }
    
    fn execute_statement(&mut self, stmt: &Stmt) -> Result<Option<Value>, String> {
        match stmt {
            Stmt::ОбъявлениеПеременной { имя, значение } => {
                let val = self.evaluate_expression(значение)?;
                self.variables.insert(имя.clone(), val);
                Ok(None)
            }
            Stmt::Если { условие, тогда, иначе } => {
                let cond = self.evaluate_expression(условие)?;
                
                if let Value::Булево(true) = cond {
                    for s in тогда {
                        if let Some(ret) = self.execute_statement(s)? {
                            return Ok(Some(ret));
                        }
                    }
                } else if let Some(else_block) = иначе {
                    for s in else_block {
                        if let Some(ret) = self.execute_statement(s)? {
                            return Ok(Some(ret));
                        }
                    }
                }
                Ok(None)
            }
            Stmt::Пока { условие, тело } => {
                loop {
                    let cond = self.evaluate_expression(условие)?;
                    if let Value::Булево(false) = cond {
                        break;
                    }
                    
                    for s in тело {
                        if let Some(ret) = self.execute_statement(s)? {
                            return Ok(Some(ret));
                        }
                    }
                }
                Ok(None)
            }
            Stmt::Вернуть(expr) => {
                let val = self.evaluate_expression(expr)?;
                Ok(Some(val))
            }
            Stmt::Выражение(expr) => {
                self.evaluate_expression(expr)?;
                Ok(None)
            }
            Stmt::ОбъявлениеФункции { имя, параметры, тело } => {
                self.functions.insert(имя.clone(), (параметры.clone(), тело.clone()));
                Ok(None)
            }
        }
    }
    
    fn evaluate_expression(&mut self, expr: &Expr) -> Result<Value, String> {
        match expr {
            Expr::Число(n) => Ok(Value::Число(*n)),
            Expr::Строка(s) => Ok(Value::Строка(s.clone())),
            Expr::Булево(b) => Ok(Value::Булево(*b)),
            Expr::Идентификатор(name) => {
                self.variables
                    .get(name)
                    .cloned()
                    .ok_or_else(|| format!("Переменная '{}' не найдена", name))
            }
            Expr::БинарнаяОперация { левый, оператор, правый } => {
                let left = self.evaluate_expression(левый)?;
                let right = self.evaluate_expression(правый)?;
                
                match (left, оператор, right) {
                    (Value::Число(l), BinOp::Плюс, Value::Число(r)) => Ok(Value::Число(l + r)),
                    (Value::Число(l), BinOp::Минус, Value::Число(r)) => Ok(Value::Число(l - r)),
                    (Value::Число(l), BinOp::Умножить, Value::Число(r)) => Ok(Value::Число(l * r)),
                    (Value::Число(l), BinOp::Разделить, Value::Число(r)) => {
                        if r == 0.0 {
                            Err("Деление на ноль".to_string())
                        } else {
                            Ok(Value::Число(l / r))
                        }
                    }
                    (Value::Число(l), BinOp::Равно, Value::Число(r)) => Ok(Value::Булево(l == r)),
                    (Value::Число(l), BinOp::НеРавно, Value::Число(r)) => Ok(Value::Булево(l != r)),
                    (Value::Число(l), BinOp::Больше, Value::Число(r)) => Ok(Value::Булево(l > r)),
                    (Value::Число(l), BinOp::Меньше, Value::Число(r)) => Ok(Value::Булево(l < r)),
                    (Value::Число(l), BinOp::БольшеРавно, Value::Число(r)) => Ok(Value::Булево(l >= r)),
                    (Value::Число(l), BinOp::МеньшеРавно, Value::Число(r)) => Ok(Value::Булево(l <= r)),
                    
                    (Value::Строка(l), BinOp::Плюс, Value::Строка(r)) => {
                        Ok(Value::Строка(format!("{}{}", l, r)))
                    }
                    
                    _ => Err("Неподдерживаемая операция".to_string()),
                }
            }
            Expr::ВызовФункции { имя, аргументы } => {
                // --- 1. Встроенная функция ПЕЧАТЬ ---
                if имя == "печать" {
                    let mut output_parts = Vec::new();
                    for arg in аргументы {
                        let val = self.evaluate_expression(arg)?;
                        output_parts.push(format_value(&val));
                    }
                    self.print(output_parts.join(" "));
                    return Ok(Value::Пусто);
                }
                
                // --- 2. Встроенная функция ГРАФИК ---
                if имя == "график" {
                    if аргументы.len() < 3 {
                        return Err("график требует: функция, от, до".to_string());
                    }
                    
                    let func_name = match &аргументы[0] {
                        Expr::Идентификатор(name) => name.clone(),
                        _ => return Err("Первый аргумент должен быть именем функции".to_string()),
                    };
                    
                    let from = match self.evaluate_expression(&аргументы[1])? {
                        Value::Число(n) => n,
                        _ => return Err("Второй аргумент должен быть числом".to_string()),
                    };
                    
                    let to = match self.evaluate_expression(&аргументы[2])? {
                        Value::Число(n) => n,
                        _ => return Err("Третий аргумент должен быть числом".to_string()),
                    };
                    
                    // Получить функцию
                    let (params, body) = self.functions.get(&func_name).cloned()
                        .ok_or_else(|| format!("Функция '{}' не найдена", func_name))?;
                    
                    if params.len() != 1 {
                        return Err(format!("Функция для графика должна иметь 1 параметр, получено {}", params.len()));
                    }
                    
                    let param_name = params[0].clone();
                    
                    // Сохранить глобальные переменные
                    let saved_globals = self.variables.clone();
                    
                    // Вычислить точки
                    let steps = 200;
                    let step = (to - from) / steps as f64;
                    let mut points = Vec::new();
                    
                    for i in 0..=steps {
                        let x = from + i as f64 * step;
                        
                        // Создать чистую область видимости для вычисления точки
                        self.variables.clear();
                        self.variables.insert(param_name.clone(), Value::Число(x));
                        
                        // Выполнить функцию
                        let mut result = Value::Пусто;
                        for stmt in &body {
                            if let Some(ret) = self.execute_statement(stmt)? {
                                result = ret;
                                break;
                            }
                        }
                        
                        if let Value::Число(y) = result {
                            if y.is_finite() {
                                points.push((x, y));
                            }
                        }
                    }
                    
                    // Восстановить глобальные переменные
                    self.variables = saved_globals;
                    
                    // Отправить график
                    if let Some(ref mut handler) = self.plot_handler {
                        let timestamp = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as i64;
                        
                        handler(PlotData {
                            points,
                            color: "#0066cc".to_string(),
                            label: func_name,
                            timestamp,
                        });
                    }
                    
                    return Ok(Value::Пусто);
                }

                // --- 3. ВЫЧИСЛЕНИЕ АРГУМЕНТОВ (для математики и пользовательских функций) ---
                let mut arg_values = Vec::new();
                for arg in аргументы {
                    arg_values.push(self.evaluate_expression(arg)?);
                }

                // --- 4. МАТЕМАТИЧЕСКИЕ И ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ ---
                match имя.as_str() {
                    "син" => {
                        if arg_values.len() != 1 {
                            return Err("син ожидает 1 аргумент".to_string());
                        }
                        if let Value::Число(x) = arg_values[0] {
                            Ok(Value::Число(x.sin()))
                        } else {
                            Err("Аргумент син должен быть числом".to_string())
                        }
                    }
                    "кос" => {
                        if arg_values.len() != 1 {
                            return Err("кос ожидает 1 аргумент".to_string());
                        }
                        if let Value::Число(x) = arg_values[0] {
                            Ok(Value::Число(x.cos()))
                        } else {
                            Err("Аргумент кос должен быть числом".to_string())
                        }
                    }
                    "эксп" => {
                        if arg_values.len() != 1 {
                            return Err("эксп ожидает 1 аргумент".to_string());
                        }
                        if let Value::Число(x) = arg_values[0] {
                            Ok(Value::Число(x.exp()))
                        } else {
                            Err("Аргумент эксп должен быть числом".to_string())
                        }
                    }
                    "лог" => {
                        if arg_values.len() != 1 {
                            return Err("лог ожидает 1 аргумент".to_string());
                        }
                        if let Value::Число(x) = arg_values[0] {
                            if x <= 0.0 {
                                Err("Аргумент лог должен быть >0".to_string())
                            } else {
                                Ok(Value::Число(x.ln()))
                            }
                        } else {
                            Err("Аргумент лог должен быть числом".to_string())
                        }
                    }
                    "корень" => {
                        if arg_values.len() != 1 {
                            return Err("корень ожидает 1 аргумент".to_string());
                        }
                        if let Value::Число(x) = arg_values[0] {
                            if x < 0.0 {
                                Err("Аргумент корень должен быть >=0".to_string())
                            } else {
                                Ok(Value::Число(x.sqrt()))
                            }
                        } else {
                            Err("Аргумент корень должен быть числом".to_string())
                        }
                    }
                    // Пользовательские функции
                    _ => {
                        if let Some((params, body)) = self.functions.get(имя).cloned() {
                            if params.len() != arg_values.len() {
                                return Err(format!(
                                    "Функция '{}' ожидает {} аргументов, получено {}",
                                    имя, params.len(), arg_values.len()
                                ));
                            }
                            
                            // Сохранить текущие переменные (изоляция scope, как в оригинале)
                            let old_vars = self.variables.clone();
                            
                            // Установить параметры
                            // Очищаем переменные, чтобы эмулировать локальную область видимости (если такова задумка)
                            // Если вы хотите доступ к глобальным переменным внутри функции, 
                            // уберите self.variables.clear() и просто вставьте параметры.
                            // Но судя по коду графика, вы используете изоляцию.
                            
                            // Вариант 1: Полная изоляция (только параметры доступны)
                             self.variables.clear(); 
                            
                            // Вариант 2 (обычный): Новая область видимости + доступ к глобальным (раскомментировать при желании)
                            // self.variables = old_vars.clone(); 
                            
                            for (param, val) in params.iter().zip(arg_values.iter()) {
                                self.variables.insert(param.clone(), val.clone());
                            }
                            
                            // Выполнить функцию
                            let mut result = Value::Пусто;
                            for stmt in &body {
                                if let Some(ret) = self.execute_statement(stmt)? {
                                    result = ret;
                                    break;
                                }
                            }
                            
                            // Восстановить переменные
                            self.variables = old_vars;
                            
                            Ok(result)
                        } else {
                            Err(format!("Функция '{}' не найдена", имя))
                        }
                    }
                }
            }
            Expr::Присваивание { имя, значение } => {
                let val = self.evaluate_expression(значение)?;
                self.variables.insert(имя.clone(), val.clone());
                Ok(val)
            }
        }
    }
}

fn format_value(val: &Value) -> String {
    match val {
        Value::Число(n) => n.to_string(),
        Value::Строка(s) => s.clone(),
        Value::Булево(b) => if *b { "истина" } else { "ложь" }.to_string(),
        Value::Функция { .. } => "<функция>".to_string(),
        Value::Пусто => "пусто".to_string(),
    }
}