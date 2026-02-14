use crate::compiler::ast::*;
use std::collections::HashMap;

// Тип обработчика вывода — замыкание, которое принимает String
pub type OutputHandler = Box<dyn FnMut(String) + Send>;

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
    pub variables: HashMap<String, Value>,
    pub functions: HashMap<String, (Vec<String>, Vec<Stmt>)>,
    pub output_handler: Option<OutputHandler>,
}

impl Interpreter {
    pub fn new() -> Self {
        Interpreter {
            variables: HashMap::new(),
            functions: HashMap::new(),
            output_handler: None,
        }
    }

    // Метод, которого не хватало — теперь он есть
    pub fn set_output_handler(&mut self, handler: OutputHandler) {
        self.output_handler = Some(handler);
    }

    // Вспомогательный метод для вывода — используй его вместо println!
    pub fn print(&mut self, text: String) {
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
                if имя == "печать" {
                    let mut output_parts = Vec::new();
                    for arg in аргументы {
                        let val = self.evaluate_expression(arg)?;
                        output_parts.push(format_value(&val));
                    }
                    // ← Вот здесь используем наш print вместо println!
                    self.print(output_parts.join(" "));
                    return Ok(Value::Пусто);
                }

                // Пользовательские функции
                if let Some((params, body)) = self.functions.get(имя).cloned() {
                    let mut arg_values = Vec::new();
                    for arg in аргументы {
                        arg_values.push(self.evaluate_expression(arg)?);
                    }

                    if params.len() != arg_values.len() {
                        return Err(format!(
                            "Функция '{}' ожидает {} аргументов, получено {}",
                            имя, params.len(), arg_values.len()
                        ));
                    }

                    let old_vars = self.variables.clone();

                    for (param, val) in params.iter().zip(arg_values.iter()) {
                        self.variables.insert(param.clone(), val.clone());
                    }

                    let mut result = Value::Пусто;
                    for stmt in &body {
                        if let Some(ret) = self.execute_statement(stmt)? {
                            result = ret;
                            break;
                        }
                    }

                    self.variables = old_vars;

                    Ok(result)
                } else {
                    Err(format!("Функция '{}' не найдена", имя))
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