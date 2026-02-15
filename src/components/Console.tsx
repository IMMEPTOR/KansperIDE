import React, { useEffect, useRef } from 'react';

interface ConsoleProps {
  output: string;
  errors: string[];
  isRunning: boolean;
}

export function Console({ output, errors, isRunning }: ConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, errors]);

  return (
    <div style={styles.console}>
      <div style={styles.header}>
        <span>Консоль</span>
        {isRunning && <span style={styles.running}>Выполняется...</span>}
      </div>
      <div style={styles.content} ref={consoleRef}>
        {errors.length > 0 && (
          <div style={styles.errors}>
            {errors.map((error, i) => (
              <div key={i} style={styles.errorLine}>
                Ошибка: {error}
              </div>
            ))}
          </div>
        )}
        {output && (
          <div style={styles.output}>
            {output.split('\n').map((line, i) => (
              <div key={i} style={styles.outputLine}>
                {line}
              </div>
            ))}
          </div>
        )}
        {!output && errors.length === 0 && !isRunning && (
          <div style={styles.empty}>
            Нажмите Ctrl+Enter для запуска кода
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  console: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#1e1e1e',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 15px',
    background: '#2d2d30',
    borderBottom: '1px solid #3e3e42',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#d4d4d4',
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  },
  running: {
    color: '#4ec9b0',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto' as const,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 13,
  },
  errors: {
    marginBottom: '10px',
  },
  errorLine: {
    color: '#f48771',
    padding: '4px 0',
    borderLeft: '3px solid #f48771',
    paddingLeft: '10px',
    marginBottom: '5px',
  },
  output: {},
  outputLine: {
    color: '#d4d4d4',
    padding: '2px 0',
    lineHeight: 1.5,
  },
  empty: {
    color: '#6a6a6a',
    fontStyle: 'italic' as const,
  },
};