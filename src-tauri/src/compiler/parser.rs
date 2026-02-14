use crate::compiler::lexer::Token;
use crate::compiler::ast::*;

pub struct Parser {
    tokens: Vec<Token>,
    position: usize,
}

impl Parser {
    pub fn new(tokens: Vec<Token>) -> Self {
        Parser { tokens, position: 0 }
    }
    
    fn current_token(&self) -> &Token {
        self.tokens.get(self.position).unwrap_or(&Token::КонецФайла)
    }
    
    fn advance(&mut self) {
        self.position += 1;
    }
    
    fn expect(&mut self, expected: Token) {
        if self.current_token() != &expected {
            panic!("Ожидался {:?}, получен {:?}", expected, self.current_token());
        }
        self.advance();
    }
    
    pub fn parse(&mut self) -> Program {
        let mut statements = Vec::new();
        
        while self.current_token() != &Token::КонецФайла {
            statements.push(self.parse_statement());
        }
        
        Program { statements }
    }
    
    fn parse_statement(&mut self) -> Stmt {
        match self.current_token() {
            Token::Пусть => self.parse_variable_declaration(),
            Token::Если => self.parse_if_statement(),
            Token::Пока => self.parse_while_statement(),
            Token::Функция => self.parse_function_declaration(),
            Token::Вернуть => self.parse_return_statement(),
            _ => {
                let expr = self.parse_expression();
                self.expect(Token::ТочкаЗапятая);
                Stmt::Выражение(expr)
            }
        }
    }
    
    fn parse_variable_declaration(&mut self) -> Stmt {
        self.expect(Token::Пусть);
        
        let имя = match self.current_token() {
            Token::Идентификатор(name) => name.clone(),
            _ => panic!("Ожидался идентификатор"),
        };
        self.advance();
        
        self.expect(Token::Присвоить);
        
        let значение = self.parse_expression();
        self.expect(Token::ТочкаЗапятая);
        
        Stmt::ОбъявлениеПеременной { имя, значение }
    }
    
    fn parse_if_statement(&mut self) -> Stmt {
        self.expect(Token::Если);
        self.expect(Token::ЛевСкобка);
        let условие = self.parse_expression();
        self.expect(Token::ПравСкобка);
        
        self.expect(Token::ЛевФигСкобка);
        let mut тогда = Vec::new();
        while self.current_token() != &Token::ПравФигСкобка {
            тогда.push(self.parse_statement());
        }
        self.expect(Token::ПравФигСкобка);
        
        let иначе = if self.current_token() == &Token::Иначе {
            self.advance();
            self.expect(Token::ЛевФигСкобка);
            let mut else_block = Vec::new();
            while self.current_token() != &Token::ПравФигСкобка {
                else_block.push(self.parse_statement());
            }
            self.expect(Token::ПравФигСкобка);
            Some(else_block)
        } else {
            None
        };
        
        Stmt::Если { условие, тогда, иначе }
    }
    
    fn parse_while_statement(&mut self) -> Stmt {
        self.expect(Token::Пока);
        self.expect(Token::ЛевСкобка);
        let условие = self.parse_expression();
        self.expect(Token::ПравСкобка);
        
        self.expect(Token::ЛевФигСкобка);
        let mut тело = Vec::new();
        while self.current_token() != &Token::ПравФигСкобка {
            тело.push(self.parse_statement());
        }
        self.expect(Token::ПравФигСкобка);
        
        Stmt::Пока { условие, тело }
    }
    
    fn parse_function_declaration(&mut self) -> Stmt {
        self.expect(Token::Функция);
        
        let имя = match self.current_token() {
            Token::Идентификатор(name) => name.clone(),
            _ => panic!("Ожидалось имя функции"),
        };
        self.advance();
        
        self.expect(Token::ЛевСкобка);
        let mut параметры = Vec::new();
        
        while self.current_token() != &Token::ПравСкобка {
            if let Token::Идентификатор(param) = self.current_token() {
                параметры.push(param.clone());
                self.advance();
                
                if self.current_token() == &Token::Запятая {
                    self.advance();
                }
            } else {
                break;
            }
        }
        self.expect(Token::ПравСкобка);
        
        self.expect(Token::ЛевФигСкобка);
        let mut тело = Vec::new();
        while self.current_token() != &Token::ПравФигСкобка {
            тело.push(self.parse_statement());
        }
        self.expect(Token::ПравФигСкобка);
        
        Stmt::ОбъявлениеФункции { имя, параметры, тело }
    }
    
    fn parse_return_statement(&mut self) -> Stmt {
        self.expect(Token::Вернуть);
        let expr = self.parse_expression();
        self.expect(Token::ТочкаЗапятая);
        Stmt::Вернуть(expr)
    }
    
    fn parse_expression(&mut self) -> Expr {
        self.parse_comparison()
    }
    
    fn parse_comparison(&mut self) -> Expr {
        let mut left = self.parse_term();
        
        while matches!(
            self.current_token(),
            Token::Равно | Token::НеРавно | Token::Больше | 
            Token::Меньше | Token::БольшеРавно | Token::МеньшеРавно
        ) {
            let op = match self.current_token() {
                Token::Равно => BinOp::Равно,
                Token::НеРавно => BinOp::НеРавно,
                Token::Больше => BinOp::Больше,
                Token::Меньше => BinOp::Меньше,
                Token::БольшеРавно => BinOp::БольшеРавно,
                Token::МеньшеРавно => BinOp::МеньшеРавно,
                _ => unreachable!(),
            };
            self.advance();
            
            let right = self.parse_term();
            left = Expr::БинарнаяОперация {
                левый: Box::new(left),
                оператор: op,
                правый: Box::new(right),
            };
        }
        
        left
    }
    
    fn parse_term(&mut self) -> Expr {
        let mut left = self.parse_factor();
        
        while matches!(self.current_token(), Token::Плюс | Token::Минус) {
            let op = match self.current_token() {
                Token::Плюс => BinOp::Плюс,
                Token::Минус => BinOp::Минус,
                _ => unreachable!(),
            };
            self.advance();
            
            let right = self.parse_factor();
            left = Expr::БинарнаяОперация {
                левый: Box::new(left),
                оператор: op,
                правый: Box::new(right),
            };
        }
        
        left
    }
    
    fn parse_factor(&mut self) -> Expr {
        let mut left = self.parse_primary();
        
        while matches!(self.current_token(), Token::Умножить | Token::Разделить) {
            let op = match self.current_token() {
                Token::Умножить => BinOp::Умножить,
                Token::Разделить => BinOp::Разделить,
                _ => unreachable!(),
            };
            self.advance();
            
            let right = self.parse_primary();
            left = Expr::БинарнаяОперация {
                левый: Box::new(left),
                оператор: op,
                правый: Box::new(right),
            };
        }
        
        left
    }
    
    fn parse_primary(&mut self) -> Expr {
        match self.current_token().clone() {
            Token::Число(n) => {
                self.advance();
                Expr::Число(n)
            }
            Token::Строка(s) => {
                self.advance();
                Expr::Строка(s)
            }
            Token::Истина => {
                self.advance();
                Expr::Булево(true)
            }
            Token::Ложь => {
                self.advance();
                Expr::Булево(false)
            }
            Token::Идентификатор(name) => {
                self.advance();
                
                // Проверка на вызов функции
                if self.current_token() == &Token::ЛевСкобка {
                    self.advance();
                    let mut аргументы = Vec::new();
                    
                    while self.current_token() != &Token::ПравСкобка {
                        аргументы.push(self.parse_expression());
                        if self.current_token() == &Token::Запятая {
                            self.advance();
                        }
                    }
                    self.expect(Token::ПравСкобка);
                    
                    Expr::ВызовФункции { имя: name, аргументы }
                } else if self.current_token() == &Token::Присвоить {
                    self.advance();
                    let значение = self.parse_expression();
                    Expr::Присваивание {
                        имя: name,
                        значение: Box::new(значение),
                    }
                } else {
                    Expr::Идентификатор(name)
                }
            }
            Token::ЛевСкобка => {
                self.advance();
                let expr = self.parse_expression();
                self.expect(Token::ПравСкобка);
                expr
            }
            _ => panic!("Неожиданный токен: {:?}", self.current_token()),
        }
    }
}