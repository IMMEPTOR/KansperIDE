import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useState, useCallback } from 'react';

interface CompilationResult {
  success: boolean;
  output: string;
  errors: string[];
  plots?: PlotData[];
}

interface PlotData {
  points: [number, number][];
  color: string;
  label: string;
}

export function useRusCompiler() {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const runCode = useCallback(async (code: string) => {
    setIsRunning(true);
    setOutput('');
    setErrors([]);
    setPlots([]);

    try {
      const result = await invoke<CompilationResult>('run_code', { code });
      
      setOutput(result.output);
      setErrors(result.errors);
      
      if (result.plots) {
        setPlots(result.plots);
      }
      
      return result;
    } catch (error) {
      setErrors([`Ошибка: ${error}`]);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const saveFile = useCallback(async (content: string, path?: string) => {
    try {
      let filePath = path || currentFilePath;
      
      if (!filePath) {
        // Открыть диалог сохранения
        filePath = await save({
          filters: [{
            name: 'Рус',
            extensions: ['рус', 'rus']
          }],
          defaultPath: 'program.рус'
        });
        
        if (!filePath) {
          return { success: false, message: 'Отменено' };
        }
      }
      
      await invoke('save_file', { path: filePath, content });
      setCurrentFilePath(filePath);
      
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      return { success: false, message: String(error) };
    }
  }, [currentFilePath]);

  const saveFileAs = useCallback(async (content: string) => {
    return await saveFile(content, undefined);
  }, [saveFile]);

  const openFile = useCallback(async () => {
    try {
      const selected = await open({
        filters: [{
          name: 'Рус',
          extensions: ['рус', 'rus']
        }],
        multiple: false
      });
      
      if (!selected) {
        return null;
      }
      
      const filePath = selected;
      const content = await invoke<string>('load_file', { path: filePath });
      
      setCurrentFilePath(filePath);
      
      return { content, path: filePath };
    } catch (error) {
      console.error('Ошибка открытия:', error);
      return null;
    }
  }, []);

  const newFile = useCallback(() => {
    setCurrentFilePath(null);
    setPlots([]);
  }, []);

  return {
    runCode,
    saveFile,
    saveFileAs,
    openFile,
    newFile,
    isRunning,
    output,
    errors,
    plots,
    currentFilePath,
  };
}