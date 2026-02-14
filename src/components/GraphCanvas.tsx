import React, { useRef, useLayoutEffect } from 'react';

interface PlotData {
  points: [number, number][];
  color: string;
  label: string;
  timestamp?: number; // ДОБАВИЛИ
}

interface GraphCanvasProps {
  plots: PlotData[];
}

export function GraphCanvas({ plots }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    console.log('📊 GraphCanvas redraw triggered');
    
    if (plots.length > 0) {
      console.log('Plot data:', {
        label: plots[0].label,
        timestamp: plots[0].timestamp,
        pointsCount: plots[0].points.length,
        first: plots[0].points[0],
        middle: plots[0].points[100],
        last: plots[0].points[plots[0].points.length - 1]
      });
    }
    
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

    console.log('Y range:', yMin, 'to', yMax);

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
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * width;
      const val = xMin + (i / 5) * (xMax - xMin);
      ctx.fillText(val.toFixed(1), x, canvas.height - padding + 20);
    }

    // Подписи Y
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i / 5) * height;
      const val = yMin + (i / 5) * (yMax - yMin);
      ctx.fillText(val.toFixed(1), padding - 10, y + 4);
    }

    // График
    plots.forEach((plot) => {
      console.log(`Drawing ${plot.label}...`);
      
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
      ctx.fillStyle = plot.color;
      ctx.fillRect(canvas.width - 150, 30, 40, 3);
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(plot.label, canvas.width - 100, 33);
    });

    console.log('✅ Drawing complete');
  }, [plots]); // React будет сравнивать по ссылке

  if (plots.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>📈 График (нет данных)</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        📈 График - {plots[0]?.label} 
        {plots[0]?.timestamp && ` (${new Date(plots[0].timestamp).toLocaleTimeString()})`}
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        style={styles.canvas}
      />
    </div>
  );
}

const styles = {
  container: {
    background: '#1e1e1e',
    borderTop: '1px solid #3e3e42',
  },
  header: {
    padding: '10px',
    background: '#2d2d30',
    color: '#d4d4d4',
    fontSize: '14px',
  },
  canvas: {
    display: 'block',
    margin: '20px auto',
    border: '1px solid #444',
  },
};