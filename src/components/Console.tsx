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
        {isRunning && <span style={styles.running}>Выполнение...</span>}
      </div>
      <div style={styles.content} ref={consoleRef}>
        {errors.length > 0 && (
          <div style={styles.errors}>
            {errors.map((error, i) => (
              <div key={i} style={styles.errorLine}>
                <span style={styles.errorIcon}>✕</span>
                {error}
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
            Нажмите "Запустить" или Ctrl+Enter для выполнения кода
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
    background: '#2b2d30',
    overflow: 'hidden',
  },
  header: {
    padding: '8px 12px',
    background: '#3c3f41',
    borderBottom: '1px solid #2b2d30',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#bbbbbb',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  running: {
    color: '#4A90E2',
    fontSize: 11,
  },
  content: {
    flex: 1,
    padding: 12,
    overflowY: 'auto' as const,
    fontFamily: '"JetBrains Mono", "Consolas", "Courier New", monospace',
    fontSize: 12,
    lineHeight: 1.6,
  },
  errors: {
    marginBottom: 12,
  },
  errorLine: {
    color: '#ff6b68',
    padding: '6px 10px',
    background: 'rgba(255, 107, 104, 0.1)',
    borderLeft: '3px solid #ff6b68',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 3,
  },
  errorIcon: {
    fontWeight: 'bold',
    flexShrink: 0,
  },
  output: {},
  outputLine: {
    color: '#d4d4d4',
    padding: '2px 0',
  },
  empty: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    padding: 40,
  },
};