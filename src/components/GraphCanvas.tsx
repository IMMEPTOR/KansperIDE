import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

interface PlotData {
  points: [number, number][];
  color: string;
  label: string;
  timestamp?: number;
}

interface GraphCanvasProps {
  plots: PlotData[];
}

type Theme = 'dark' | 'light';

const THEMES = {
  dark: {
    background: '#1a1a1a',
    gridMajor: '#333333',
    gridMinor: '#222222',
    axis: '#666666',
    text: '#e0e0e0',
    textBg: 'rgba(0, 0, 0, 0.7)',
  },
  light: {
    background: '#ffffff',
    gridMajor: '#cccccc',
    gridMinor: '#e8e8e8',
    axis: '#666666',
    text: '#333333',
    textBg: 'rgba(255, 255, 255, 0.8)',
  },
};

const PLOT_COLORS = [
  '#2196F3', // Синий
  '#F44336', // Красный
  '#4CAF50', // Зеленый
  '#FF9800', // Оранжевый
  '#9C27B0', // Фиолетовый
  '#00BCD4', // Голубой
];

export function GraphCanvas({ plots }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [theme, setTheme] = useState<Theme>('dark');
  const [zoom, setZoom] = useState(1);

  const handleSavePNG = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const filePath = await save({
        filters: [{
          name: 'PNG Image',
          extensions: ['png']
        }],
        defaultPath: `график-${new Date().toISOString().slice(0, 10)}.png`
      });

      if (!filePath) return;

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await writeFile(filePath, uint8Array);
      
      console.log('График сохранен:', filePath);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Обработка Cmd/Ctrl + колесико мыши для масштабирования
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Обработка Cmd/Ctrl + +/- для масштабирования
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || plots.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = THEMES[theme];
    const baseWidth = 1000;
    const baseHeight = 700;
    
    // Применить масштаб
    canvas.width = baseWidth * zoom;
    canvas.height = baseHeight * zoom;
    ctx.scale(zoom, zoom);

    // Очистка фона
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Найти границы данных
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;

    plots.forEach(plot => {
      plot.points.forEach(([x, y]) => {
        if (isFinite(x) && isFinite(y)) {
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      });
    });

    // Добавить отступы к границам
    const xPadding = (xMax - xMin) * 0.1 || 1;
    const yPadding = (yMax - yMin) * 0.1 || 1;
    xMin -= xPadding;
    xMax += xPadding;
    yMin -= yPadding;
    yMax += yPadding;

    const padding = 80;
    const graphWidth = baseWidth - 2 * padding;
    const graphHeight = baseHeight - 2 * padding;

    const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * graphWidth;
    const scaleY = (y: number) => baseHeight - padding - ((y - yMin) / (yMax - yMin)) * graphHeight;

    // Размер клетки
    const cellSize = 20;

    // Нарисовать мелкие клетки (как на тетрадной бумаге)
    ctx.strokeStyle = colors.gridMinor;
    ctx.lineWidth = 0.5;
    
    for (let x = padding; x <= baseWidth - padding; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, baseHeight - padding);
      ctx.stroke();
    }
    
    for (let y = padding; y <= baseHeight - padding; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(baseWidth - padding, y);
      ctx.stroke();
    }

    // Нарисовать основные линии сетки (каждая 5-я клетка)
    ctx.strokeStyle = colors.gridMajor;
    ctx.lineWidth = 1;
    
    for (let x = padding; x <= baseWidth - padding; x += cellSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, baseHeight - padding);
      ctx.stroke();
    }
    
    for (let y = padding; y <= baseHeight - padding; y += cellSize * 5) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(baseWidth - padding, y);
      ctx.stroke();
    }

    // Нарисовать оси
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;
    
    // Ось Y
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, baseHeight - padding);
    ctx.stroke();
    
    // Ось X
    ctx.beginPath();
    ctx.moveTo(padding, baseHeight - padding);
    ctx.lineTo(baseWidth - padding, baseHeight - padding);
    ctx.stroke();

    // Подписи осей
    ctx.fillStyle = colors.text;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Подписи X
    const xSteps = 10;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding + (i / xSteps) * graphWidth;
      const val = xMin + (i / xSteps) * (xMax - xMin);
      
      // Фон
      const text = val.toFixed(2);
      const metrics = ctx.measureText(text);
      ctx.fillStyle = colors.textBg;
      ctx.fillRect(x - metrics.width / 2 - 2, baseHeight - padding + 5, metrics.width + 4, 14);
      
      ctx.fillStyle = colors.text;
      ctx.fillText(text, x, baseHeight - padding + 8);
    }

    // Подписи Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const ySteps = 10;
    for (let i = 0; i <= ySteps; i++) {
      const y = baseHeight - padding - (i / ySteps) * graphHeight;
      const val = yMin + (i / ySteps) * (yMax - yMin);
      
      // Фон
      const text = val.toFixed(2);
      const metrics = ctx.measureText(text);
      ctx.fillStyle = colors.textBg;
      ctx.fillRect(padding - metrics.width - 10, y - 7, metrics.width + 4, 14);
      
      ctx.fillStyle = colors.text;
      ctx.fillText(text, padding - 8, y);
    }

    // Заголовки осей
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', baseWidth / 2, baseHeight - padding + 35);
    
    ctx.save();
    ctx.translate(padding - 50, baseHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y', 0, 0);
    ctx.restore();

    // Нарисовать графики
    plots.forEach((plot, idx) => {
      const color = PLOT_COLORS[idx % PLOT_COLORS.length];
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let first = true;
      plot.points.forEach(([x, y]) => {
        if (!isFinite(x) || !isFinite(y)) return;
        const px = scaleX(x);
        const py = scaleY(y);
        
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      });

      ctx.stroke();
      
      // Легенда
      const legendX = baseWidth - padding - 150;
      const legendY = padding + 20 + idx * 30;
      
      // Фон легенды
      ctx.fillStyle = colors.textBg;
      ctx.fillRect(legendX - 5, legendY - 12, 145, 24);
      
      // Линия
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 40, legendY);
      ctx.stroke();
      
      // Название
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(plot.label, legendX + 50, legendY);
    });

  }, [plots, theme, zoom]);

  if (plots.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span>График</span>
          <div style={styles.headerButtons}>
            <button onClick={toggleTheme} style={styles.iconButton} title="Переключить тему">
              {theme === 'dark' ? '☀' : '🌙'}
            </button>
          </div>
        </div>
        <div style={styles.emptyState}>
          Запустите программу с функцией график() для отображения
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>График</span>
        <div style={styles.headerButtons}>
          <button onClick={toggleTheme} style={styles.iconButton} title="Переключить тему">
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <div style={styles.divider} />
          <button onClick={handleZoomOut} style={styles.iconButton} title="Уменьшить (Ctrl/Cmd + -)">
            -
          </button>
          <span style={styles.zoomText}>{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} style={styles.iconButton} title="Увеличить (Ctrl/Cmd + +)">
            +
          </button>
          <button onClick={handleZoomReset} style={styles.iconButton} title="Сбросить (Ctrl/Cmd + 0)">
            ↺
          </button>
          <div style={styles.divider} />
          <button onClick={handleSavePNG} style={styles.saveButton} title="Сохранить график как PNG">
            Сохранить PNG
          </button>
        </div>
      </div>
      <div style={styles.canvasContainer} ref={containerRef}>
        <canvas 
          ref={canvasRef}
          style={styles.canvas}
        />
      </div>
      <div style={styles.info}>
        {plots.map((plot, idx) => (
          <div key={idx} style={styles.plotInfo}>
            <span style={{ 
              ...styles.colorDot, 
              backgroundColor: PLOT_COLORS[idx % PLOT_COLORS.length]
            }}></span>
            <span>{plot.label}: {plot.points.length} точек</span>
          </div>
        ))}
        <div style={styles.hint}>
          Используйте Ctrl/Cmd + колесико мыши или Ctrl/Cmd + +/- для масштабирования
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
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
    color: '#d4d4d4',
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  iconButton: {
    padding: '4px 8px',
    background: '#3e3e42',
    color: '#d4d4d4',
    border: 'none',
    borderRadius: '4px',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s',
    minWidth: '30px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  zoomText: {
    fontSize: 12,
    color: '#999',
    minWidth: '45px',
    textAlign: 'center' as const,
  },
  divider: {
    width: 1,
    height: 20,
    background: '#3e3e42',
    margin: '0 4px',
  },
  saveButton: {
    padding: '6px 12px',
    background: '#0e639c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: 500,
  } as React.CSSProperties,
  canvasContainer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#1a1a1a',
  },
  canvas: {
    display: 'block',
    border: '1px solid #3e3e42',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6a6a6a',
    fontStyle: 'italic' as const,
    padding: '40px',
    textAlign: 'center' as const,
  },
  info: {
    padding: '10px 15px',
    borderTop: '1px solid #3e3e42',
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap' as const,
    fontSize: 11,
    color: '#999',
    flexShrink: 0,
    alignItems: 'center',
  },
  plotInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#cccccc',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  hint: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic' as const,
  },
};