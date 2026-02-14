#[derive(Debug, Clone)]
pub enum Expr {
    Число(f64),
    Строка(String),
    Булево(bool),
    Идентификатор(String),
    БинарнаяОперация {
        левый: Box<Expr>,
        оператор: BinOp,
        правый: Box<Expr>,
    },
    ВызовФункции {
        имя: String,
        аргументы: Vec<Expr>,
    },
    Присваивание {
        имя: String,
        значение: Box<Expr>,
    },
}

#[derive(Debug, Clone)]
pub enum BinOp {
    Плюс,
    Минус,
    Умножить,
    Разделить,
    Равно,
    НеРавно,
    Больше,
    Меньше,
    БольшеРавно,
    МеньшеРавно,
}

#[derive(Debug, Clone)]
pub enum Stmt {
    ОбъявлениеПеременной {
        имя: String,
        значение: Expr,
    },
    Если {
        условие: Expr,
        тогда: Vec<Stmt>,
        иначе: Option<Vec<Stmt>>,
    },
    Пока {
        условие: Expr,
        тело: Vec<Stmt>,
    },
    Вернуть(Expr),
    Выражение(Expr),
    ОбъявлениеФункции {
        имя: String,
        параметры: Vec<String>,
        тело: Vec<Stmt>,
    },
}

#[derive(Debug)]
pub struct Program {
    pub statements: Vec<Stmt>,
}