import { useState, useEffect } from 'react';
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
  
  const { 
    runCode, 
    saveFile, 
    saveFileAs, 
    openFile, 
    newFile,
    isRunning, 
    output, 
    errors,
    currentFilePath 
  } = useRusCompiler();

  const handleRun = async () => {
  console.log('Running code...');
  setPlots([]);  // Добавь эту строку для принудительной очистки перед запуском
  
  const result = await runCode(code);
  
  if (result?.plots) {
    console.log('NEW plots received:', {
      count: result.plots.length,
      timestamps: result.plots.map((p: any) => p.timestamp),
      firstPlot: result.plots[0]
    });
    
    // Создать НОВЫЙ массив для принудительного обновления React
    setPlots([...result.plots]);
  } else {
    console.log('No plots');
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
      // Используем нативный confirm вместо Tauri dialog
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
      
      <div className="main-content">
        <div className="editor-panel">
          <CodeEditor 
            value={code} 
            onChange={handleCodeChange}
            onRun={handleRun}
          />
        </div>
        
        <div className="right-panel">
          <div className="console-panel">
            <Console 
              output={output}
              errors={errors}
              isRunning={isRunning}
            />
          </div>
          
          <div className="graph-container">
            <GraphCanvas plots={plots} key={JSON.stringify(plots)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;