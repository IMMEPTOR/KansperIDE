import { invoke } from '@tauri-apps/api/core';
import { useState, useCallback } from 'react';

interface CompilationResult {
  success: boolean;
  output: string;
  errors: string[];
}

export function useRusCompiler() {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const runCode = useCallback(async (code: string) => {
    setIsRunning(true);
    setOutput('');
    setErrors([]);

    // Даём Tauri чуть времени на инициализацию (Tauri v2 иногда медленный)
    // Даём Tauri 1 секунду на инициализацию
    await new Promise(r => setTimeout(r, 1000));

    console.log('__TAURI_INTERNALS__ после ожидания:', !!window.__TAURI_INTERNALS__);
    console.log('__TAURI__ после ожидания:', !!window.__TAURI__);

    if (!window.__TAURI_INTERNALS__ && !window.__TAURI__) {
    setErrors(['Tauri API всё ещё не готов...']);
    setIsRunning(false);
    return null;
    }
    try {
      const result = await invoke<CompilationResult>('run_code', { code });
      setOutput(result.output || '');
      setErrors(result.errors || []);

      if (!result.success) {
        console.warn('Выполнение завершилось с ошибками:', result.errors);
      }

      return result;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      setErrors([`Ошибка связи с Rust: ${errorMsg}`]);
      console.error('invoke error:', error);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const saveFile = useCallback(async (path: string, content: string) => {
    try {
      await invoke('save_file', { path, content });
      return true;
    } catch (error) {
      console.error('save_file error:', error);
      return false;
    }
  }, []);

  const loadFile = useCallback(async (path: string) => {
    try {
      return await invoke<string>('load_file', { path });
    } catch (error) {
      console.error('load_file error:', error);
      return null;
    }
  }, []);

  return { runCode, saveFile, loadFile, isRunning, output, errors };
}