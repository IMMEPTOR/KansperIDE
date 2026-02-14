import { useState } from 'react';
import { CodeEditor } from './components/Editor';
import { Console } from './components/Console';
import { useRusCompiler } from './hooks/useRusCompiler';
import './App.css';

const EXAMPLE_CODE = `// Добро пожаловать в Рус IDE!

печать("Привет, мир!");

пусть х = 10;
пусть у = 20;
печать("Сумма:", х + у);

функция факториал(н) {
    если (н < 2) {
        вернуть 1;
    } иначе {
        вернуть н * факториал(н - 1);
    }
}

печать("Факториал 5:", факториал(5));

пусть счетчик = 0;
пока (счетчик < 3) {
    печать("Итерация", счетчик);
    счетчик = счетчик + 1;
}
`;

function App() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const { runCode, isRunning, output, errors } = useRusCompiler();

  const handleRun = async () => {
    await runCode(code);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🇷🇺 РУС IDE</h1>
        <div className="toolbar">
          <button 
            onClick={handleRun} 
            disabled={isRunning}
            className="btn-primary"
          >
            ▶ Запустить (Ctrl+Enter)
          </button>
        </div>
      </header>
      
      <div className="main-content">
        <div className="editor-panel">
          <CodeEditor 
            value={code} 
            onChange={setCode}
            onRun={handleRun}
          />
        </div>
        
        <div className="console-panel">
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