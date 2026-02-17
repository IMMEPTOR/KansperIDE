import React, { useRef, useLayoutEffect, useState } from 'react';
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
  onClose?: () => void;
}

const PLOT_COLORS = [
  '#4A90E2',
  '#E74C3C',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
];

export function GraphCanvas({ plots, onClose }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const renderGraph = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Очистка
    ctx.fillStyle = '#2b2d30';
    ctx.fillRect(0, 0, width, height);

    if (plots.length === 0) return;

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

    // Расширить для симметрии
    const xRange = Math.max(Math.abs(xMin), Math.abs(xMax));
    const yRange = Math.max(Math.abs(yMin), Math.abs(yMax));
    
    xMin = -xRange * 1.2;
    xMax = xRange * 1.2;
    yMin = -yRange * 1.2;
    yMax = yRange * 1.2;

    const padding = 50;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    const centerX = width / 2;
    const centerY = height / 2;

    const scaleX = (x: number) => centerX + (x / xMax) * (graphWidth / 2);
    const scaleY = (y: number) => centerY - (y / yMax) * (graphHeight / 2);

    // Сетка
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 0.5;

    const gridSteps = 10;
    const xStep = xMax / (gridSteps / 2);
    const yStep = yMax / (gridSteps / 2);

    for (let i = -gridSteps / 2; i <= gridSteps / 2; i++) {
      // Вертикальные
      const x = scaleX(i * xStep);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Горизонтальные
      const y = scaleY(i * yStep);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Оси
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Ось Y
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, height - padding);
    ctx.stroke();

    // Стрелка Y
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX - 5, padding + 10);
    ctx.lineTo(centerX + 5, padding + 10);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Ось X
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(width - padding, centerY);
    ctx.stroke();

    // Стрелка X
    ctx.beginPath();
    ctx.moveTo(width - padding, centerY);
    ctx.lineTo(width - padding - 10, centerY - 5);
    ctx.lineTo(width - padding - 10, centerY + 5);
    ctx.closePath();
    ctx.fill();

    // Подписи осей
    ctx.fillStyle = '#afb1b3';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x', width - padding + 15, centerY - 8);
    ctx.textAlign = 'right';
    ctx.fillText('y', centerX - 8, padding - 10);

    // Деления и метки
    ctx.font = '10px monospace';
    ctx.fillStyle = '#808080';

    for (let i = -gridSteps / 2; i <= gridSteps / 2; i++) {
      if (i === 0) continue;
      
      const xVal = i * xStep;
      const yVal = i * yStep;
      const x = scaleX(xVal);
      const y = scaleY(yVal);
      
      // Метки X
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xVal.toFixed(1), x, centerY + 5);
      
      // Черточки X
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, centerY - 3);
      ctx.lineTo(x, centerY + 3);
      ctx.stroke();
      
      // Метки Y
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#808080';
      ctx.fillText(yVal.toFixed(1), centerX - 8, y);
      
      // Черточки Y
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(centerX - 3, y);
      ctx.lineTo(centerX + 3, y);
      ctx.stroke();
    }

    // (0,0)
    ctx.fillStyle = '#808080';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', centerX - 8, centerY + 5);

    // Графики
    plots.forEach((plot, plotIdx) => {
      const color = PLOT_COLORS[plotIdx % PLOT_COLORS.length];
      
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
        
        if (px < padding || px > width - padding || py < padding || py > height - padding) {
          first = true;
          return;
        }
        
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      });

      ctx.stroke();

      // Легенда
      const legendX = padding + 15;
      const legendY = padding + 15 + plotIdx * 25;
      
      ctx.fillStyle = 'rgba(43, 45, 48, 0.85)';
      ctx.fillRect(legendX - 8, legendY - 10, 140, 20);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 25, legendY);
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(plot.label, legendX + 32, legendY);
    });
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      renderGraph(ctx, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [plots]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>График</span>
        <div style={styles.headerButtons}>
          <button onClick={handleSavePNG} style={styles.saveBtn} title="Сохранить PNG">
            Сохранить PNG
          </button>
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn} title="Скрыть">
              ✕
            </button>
          )}
        </div>
      </div>
      <div style={styles.canvasArea} ref={containerRef}>
        {plots.length === 0 ? (
          <div style={styles.emptyState}>
            График появится после запуска кода
          </div>
        ) : (
          <canvas ref={canvasRef} style={styles.canvas} />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#2b2d30',
  },
  header: {
    padding: '8px 12px',
    background: '#313335',
    borderBottom: '1px solid #2b2d30',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    color: '#afb1b3',
  },
  headerButtons: {
    display: 'flex',
    gap: 6,
  },
  saveBtn: {
    padding: '4px 10px',
    background: '#365880',
    color: '#ffffff',
    border: '1px solid #466d94',
    borderRadius: 3,
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontWeight: 500,
  } as React.CSSProperties,
  closeBtn: {
    padding: '2px 8px',
    background: 'transparent',
    color: '#808080',
    border: '1px solid transparent',
    borderRadius: 3,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  canvasArea: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
  emptyState: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center' as const,
    padding: 20,
  },
};