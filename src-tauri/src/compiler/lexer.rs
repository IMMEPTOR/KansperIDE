#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Ключевые слова
    Пусть,
    Функция,
    Если,
    Иначе,
    Пока,
    Вернуть,
    Истина,
    Ложь,
    
    // Литералы
    Идентификатор(String),
    Число(f64),
    Строка(String),
    
    // Операторы
    Плюс,           // +
    Минус,          // -
    Умножить,       // *
    Разделить,      // /
    Присвоить,      // =
    Равно,          // ==
    НеРавно,        // !=
    Больше,         // >
    Меньше,         // 
    БольшеРавно,    // >=
    МеньшеРавно,    // <=
    
    // Разделители
    ЛевСкобка,      // (
    ПравСкобка,     // )
    ЛевФигСкобка,   // {
    ПравФигСкобка,  // }
    Запятая,        // ,
    ТочкаЗапятая,   // ;
    
    КонецФайла,
}

pub struct Lexer {
    input: Vec<char>,
    position: usize,
    current_char: Option<char>,
}

impl Lexer {
    pub fn new(input: String) -> Self {
        let chars: Vec<char> = input.chars().collect();
        let current = chars.get(0).copied();
        Lexer {
            input: chars,
            position: 0,
            current_char: current,
        }
    }
    
    fn advance(&mut self) {
        self.position += 1;
        self.current_char = self.input.get(self.position).copied();
    }
    
    fn peek(&self, offset: usize) -> Option<char> {
        self.input.get(self.position + offset).copied()
    }
    
    fn skip_whitespace(&mut self) {
        while let Some(ch) = self.current_char {
            if ch.is_whitespace() {
                self.advance();
            } else {
                break;
            }
        }
    }
    
    fn skip_comment(&mut self) {
        // Однострочный комментарий //
        if self.current_char == Some('/') && self.peek(1) == Some('/') {
            while self.current_char.is_some() && self.current_char != Some('\n') {
                self.advance();
            }
        }
        
        // Многострочный комментарий /* */
        if self.current_char == Some('/') && self.peek(1) == Some('*') {
            self.advance(); // /
            self.advance(); // *
            
            while self.current_char.is_some() {
                if self.current_char == Some('*') && self.peek(1) == Some('/') {
                    self.advance(); // *
                    self.advance(); // /
                    break;
                }
                self.advance();
            }
        }
    }
    
    fn read_number(&mut self) -> f64 {
        let mut num_str = String::new();
        
        while let Some(ch) = self.current_char {
            if ch.is_numeric() || ch == '.' {
                num_str.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        
        num_str.parse().unwrap_or(0.0)
    }
    
    fn read_identifier(&mut self) -> String {
        let mut id = String::new();
        
        while let Some(ch) = self.current_char {
            if ch.is_alphanumeric() || ch == '_' || is_cyrillic(ch) {
                id.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        
        id
    }
    
    fn read_string(&mut self) -> String {
        let mut string = String::new();
        self.advance(); // Пропустить открывающую кавычку
        
        while let Some(ch) = self.current_char {
            if ch == '"' {
                self.advance();
                break;
            }
            string.push(ch);
            self.advance();
        }
        
        string
    }
    
    pub fn next_token(&mut self) -> Token {
        loop {
            self.skip_whitespace();
            
            // Пропустить комментарии
            if self.current_char == Some('/') && 
               (self.peek(1) == Some('/') || self.peek(1) == Some('*')) {
                self.skip_comment();
                continue;
            }
            
            break;
        }
        
        match self.current_char {
            None => Token::КонецФайла,
            Some(ch) => {
                if ch.is_numeric() {
                    return Token::Число(self.read_number());
                }
                
                if ch.is_alphabetic() || is_cyrillic(ch) || ch == '_' {
                    let id = self.read_identifier();
                    return match id.as_str() {
                        "пусть" => Token::Пусть,
                        "функция" | "фн" => Token::Функция,
                        "если" => Token::Если,
                        "иначе" => Token::Иначе,
                        "пока" => Token::Пока,
                        "вернуть" => Token::Вернуть,
                        "истина" => Token::Истина,
                        "ложь" => Token::Ложь,
                        _ => Token::Идентификатор(id),
                    };
                }
                
                let token = match ch {
                    '+' => Token::Плюс,
                    '-' => Token::Минус,
                    '*' => Token::Умножить,
                    '/' => Token::Разделить,
                    '(' => Token::ЛевСкобка,
                    ')' => Token::ПравСкобка,
                    '{' => Token::ЛевФигСкобка,
                    '}' => Token::ПравФигСкобка,
                    ',' => Token::Запятая,
                    ';' => Token::ТочкаЗапятая,
                    '"' => {
                        return Token::Строка(self.read_string());
                    }
                    '=' => {
                        self.advance();
                        if self.current_char == Some('=') {
                            self.advance();
                            return Token::Равно;
                        }
                        return Token::Присвоить;
                    }
                    '!' => {
                        self.advance();
                        if self.current_char == Some('=') {
                            self.advance();
                            return Token::НеРавно;
                        }
                        panic!("Неожиданный символ после !");
                    }
                    '>' => {
                        self.advance();
                        if self.current_char == Some('=') {
                            self.advance();
                            return Token::БольшеРавно;
                        }
                        return Token::Больше;
                    }
                    '<' => {
                        self.advance();
                        if self.current_char == Some('=') {
                            self.advance();
                            return Token::МеньшеРавно;
                        }
                        return Token::Меньше;
                    }
                    _ => panic!("Неизвестный символ: {}", ch),
                };
                
                self.advance();
                token
            }
        }
    }
    
    pub fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();
        loop {
            let token = self.next_token();
            if token == Token::КонецФайла {
                tokens.push(token);
                break;
            }
            tokens.push(token);
        }
        tokens
    }
}

fn is_cyrillic(ch: char) -> bool {
    ('\u{0400}'..='\u{04FF}').contains(&ch)
}