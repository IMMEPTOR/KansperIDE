import { useState, useRef, useEffect } from 'react';
import { CodeEditor } from './components/Editor';
import { Console } from './components/Console';
import { GraphCanvas } from './components/GraphCanvas';
import { useRusCompiler } from './hooks/useRusCompiler';
import './App.css';

const EXAMPLE_CODE = `// Добро пожаловать в Рус IDE!

печать("Привет, мир!");

// Пример работы с переменными
пусть х = 10;
пусть у = 20;
печать("Сумма:", х + у);

// Пример функции
функция факториал(н) {
    если (н < 2) {
        вернуть 1;
    } иначе {
        вернуть н * факториал(н - 1);
    }
}

печать("Факториал 5:", факториал(5));

// Пример графика
функция квадрат(х) {
    вернуть х * х;
}

график(квадрат, -5, 5);
`;

function App() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [fileName, setFileName] = useState('Без имени');
  const [isModified, setIsModified] = useState(false);
  const [plots, setPlots] = useState<any[]>([]);
  
  // Состояния для resize
  const [editorWidth, setEditorWidth] = useState(50); // процент
  const [consoleHeight, setConsoleHeight] = useState(30); // процент
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    runCode, 
    saveFile, 
    saveFileAs, 
    openFile, 
    newFile,
    isRunning, 
    output, 
    errors,
  } = useRusCompiler();

  // Горизонтальный resize (между редактором и графиком)
  const handleMouseDownHorizontal = () => {
    setIsResizingHorizontal(true);
  };

  // Вертикальный resize (между верхом и консолью)
  const handleMouseDownVertical = () => {
    setIsResizingVertical(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;

    if (isResizingHorizontal) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 25 && newWidth < 75) {
        setEditorWidth(newWidth);
      }
    }

    if (isResizingVertical) {
      const rect = containerRef.current.getBoundingClientRect();
      // Правильное вычисление от верха контейнера
      const clickY = e.clientY - rect.top;
      const newTopHeight = (clickY / rect.height) * 100;
      const newConsoleHeight = 100 - newTopHeight;
      
      if (newConsoleHeight > 15 && newConsoleHeight < 60) {
        setConsoleHeight(newConsoleHeight);
      }
    }
  };

    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
      setIsResizingVertical(false);
    };

    if (isResizingHorizontal || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingHorizontal ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingHorizontal, isResizingVertical]);

  const handleRun = async () => {
    console.log('🚀 Running code...');
    const result = await runCode(code);
    console.log('📦 Result:', result);
    
    if (result?.plots) {
      console.log('📊 Plots received:', result.plots.length);
      setPlots([...result.plots]);
    } else {
      console.log('❌ No plots');
      setPlots([]);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setIsModified(true);
  };

  const handleSave = async () => {
    const result = await saveFile(code);
    if (result.success) {
      setIsModified(false);
      if (result.path) {
        const name = result.path.split('/').pop() || result.path.split('\\').pop() || 'Файл';
        setFileName(name);
      }
    }
  };

  const handleSaveAs = async () => {
    const result = await saveFileAs(code);
    if (result.success && result.path) {
      setIsModified(false);
      const name = result.path.split('/').pop() || result.path.split('\\').pop() || 'Файл';
      setFileName(name);
    }
  };

  const handleOpen = async () => {
    if (isModified) {
      const confirmed = window.confirm('Есть несохраненные изменения. Продолжить?');
      if (!confirmed) return;
    }
    
    const result = await openFile();
    if (result) {
      setCode(result.content);
      setIsModified(false);
      const name = result.path.split('/').pop() || result.path.split('\\').pop() || 'Файл';
      setFileName(name);
    }
  };

  const handleNew = () => {
    if (isModified) {
      const confirmed = window.confirm('Есть несохраненные изменения. Продолжить?');
      if (!confirmed) return;
    }
    
    setCode('');
    setFileName('Без имени');
    setIsModified(false);
    setPlots([]);
    newFile();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>🇷🇺 РУС IDE</h1>
          <span className="file-name">{fileName}{isModified ? ' •' : ''}</span>
        </div>
        <div className="toolbar">
          <button onClick={handleNew} className="btn-secondary" title="Создать новый файл">
            📄 Новый
          </button>
          <button onClick={handleOpen} className="btn-secondary" title="Открыть файл">
            📂 Открыть
          </button>
          <button onClick={handleSave} className="btn-secondary" title="Сохранить">
            💾 Сохранить
          </button>
          <button onClick={handleSaveAs} className="btn-secondary" title="Сохранить как">
            💾 Сохранить как...
          </button>
          <div className="divider" />
          <button 
            onClick={handleRun} 
            disabled={isRunning}
            className="btn-primary"
            title="Запустить программу (Ctrl+Enter)"
          >
            {isRunning ? '⏸ Выполняется...' : '▶ Запустить'}
          </button>
        </div>
      </header>
      
      <div className="main-container" ref={containerRef}>
        {/* Верхняя часть: редактор СЛЕВА, график СПРАВА */}
        <div 
          className="top-section"
          style={{ height: `${100 - consoleHeight}%` }}
        >
          {/* Левая панель - Редактор */}
          <div 
            className="editor-panel"
            style={{ width: `${editorWidth}%` }}
          >
            <div className="panel-header">
              <span>📝 Редактор кода</span>
            </div>
            <div className="editor-content">
              <CodeEditor 
                value={code} 
                onChange={handleCodeChange}
                onRun={handleRun}
              />
            </div>
          </div>

          {/* Вертикальный разделитель */}
          <div 
            className="resize-handle resize-handle-vertical"
            onMouseDown={handleMouseDownHorizontal}
          />

          {/* Правая панель - График */}
          <div 
            className="graph-panel"
            style={{ width: `${100 - editorWidth}%` }}
          >
            <GraphCanvas plots={plots} />
          </div>
        </div>

        {/* Горизонтальный разделитель */}
        <div 
          className="resize-handle resize-handle-horizontal"
          onMouseDown={handleMouseDownVertical}
        />

        {/* Нижняя панель - Консоль (на ВСЮ ширину) */}
        <div 
          className="bottom-section"
          style={{ height: `${consoleHeight}%` }}
        >
          <Console 
            output={output}
            errors={errors}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
}

export default App;