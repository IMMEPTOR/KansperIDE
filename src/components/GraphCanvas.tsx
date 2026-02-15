import React, { useRef, useLayoutEffect } from 'react';

interface PlotData {
  points: [number, number][];
  color: string;
  label: string;
  timestamp?: number;
}

interface GraphCanvasProps {
  plots: PlotData[];
}

export function GraphCanvas({ plots }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSavePNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    try {
      // Создать ссылку для скачивания
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `график-${timestamp}.png`;
      
      // Конвертировать canvas в data URL
      link.href = canvas.toDataURL('image/png');
      
      // Триггернуть скачивание
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ PNG saved successfully');
    } catch (error) {
      console.error('❌ Error saving PNG:', error);
    }
  };

  useLayoutEffect(() => {
    console.log('📊 GraphCanvas redraw:', plots.length, 'plots');
    
    const canvas = canvasRef.current;
    if (!canvas || plots.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Найти границы
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

    const xPadding = (xMax - xMin) * 0.1;
    const yPadding = (yMax - yMin) * 0.1;
    xMin -= xPadding;
    xMax += xPadding;
    yMin -= yPadding;
    yMax += yPadding;

    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * width;
    const scaleY = (y: number) => canvas.height - padding - ((y - yMin) / (yMax - yMin)) * height;

    // Сетка
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(padding + (i / 10) * width, padding);
      ctx.lineTo(padding + (i / 10) * width, canvas.height - padding);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, padding + (i / 10) * height);
      ctx.lineTo(canvas.width - padding, padding + (i / 10) * height);
      ctx.stroke();
    }

    // Оси
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Подписи X
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * width;
      const val = xMin + (i / 5) * (xMax - xMin);
      ctx.fillText(val.toFixed(1), x, canvas.height - padding + 10);
    }

    // Подписи Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i / 5) * height;
      const val = yMin + (i / 5) * (yMax - yMin);
      ctx.fillText(val.toFixed(1), padding - 10, y);
    }

    // График
    plots.forEach((plot, idx) => {
      ctx.strokeStyle = plot.color;
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
      const legendX = canvas.width - padding - 150;
      const legendY = padding + 20 + idx * 30;
      
      ctx.strokeStyle = plot.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 40, legendY);
      ctx.stroke();
      
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(plot.label, legendX + 50, legendY);
    });

    console.log('✅ Drawing complete');
  }, [plots]);

  if (plots.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span>📈 График</span>
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
        <span>📈 График</span>
        <button 
          onClick={handleSavePNG} 
          style={styles.saveButton}
          title="Сохранить график как PNG"
        >
          💾 Сохранить PNG
        </button>
      </div>
      <div style={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          style={styles.canvas}
        />
      </div>
      <div style={styles.info}>
        {plots.map((plot, idx) => (
          <div key={idx} style={styles.plotInfo}>
            <span style={{ ...styles.colorDot, backgroundColor: plot.color }}></span>
            <span>{plot.label}: {plot.points.length} точек</span>
          </div>
        ))}
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
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  saveButton: {
    padding: '6px 12px',
    background: '#0e639c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: 500,
  } as React.CSSProperties,
  canvasContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    padding: '20px',
  },
  canvas: {
    border: '1px solid #3e3e42',
    display: 'block',
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
    gap: '20px',
    flexWrap: 'wrap' as const,
    fontSize: '12px',
    color: '#cccccc',
    flexShrink: 0,
  },
  plotInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
};