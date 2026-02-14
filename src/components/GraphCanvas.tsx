import React, { useRef, useEffect } from 'react';

interface PlotData {
  points: [number, number][];
  color: string;
  label: string;
}

interface GraphCanvasProps {
  plots: PlotData[];
}

export function GraphCanvas({ plots }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('GraphCanvas useEffect triggered, plots:', plots);
    
    if (!canvasRef.current) {
      console.log('No canvas ref');
      return;
    }
    
    if (plots.length === 0) {
      console.log('No plots to render');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('No context');
      return;
    }

    console.log('Starting to draw', plots.length, 'plot(s)');

    // Очистить canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Найти границы всех графиков
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;

    plots.forEach((plot, plotIndex) => {
      console.log(`Plot ${plotIndex}:`, {
        label: plot.label,
        color: plot.color,
        pointCount: plot.points.length,
        firstPoint: plot.points[0],
        lastPoint: plot.points[plot.points.length - 1]
      });

      plot.points.forEach(([x, y]) => {
        if (isFinite(x) && isFinite(y)) {
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      });
    });

    console.log('Bounds:', { xMin, xMax, yMin, yMax });

    // Добавить отступы
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    xMin -= xRange * 0.1;
    xMax += xRange * 0.1;
    yMin -= yRange * 0.1;
    yMax += yRange * 0.1;

    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    // Функции масштабирования
    const scaleX = (x: number) => {
      return padding + ((x - xMin) / (xMax - xMin)) * width;
    };
    
    const scaleY = (y: number) => {
      return canvas.height - padding - ((y - yMin) / (yMax - yMin)) * height;
    };

    // Нарисовать сетку
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }

    // Горизонтальные линии
    for (let i = 0; i <= 10; i++) {
      const y = padding + (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Нарисовать оси
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    
    // Y ось
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // X ось
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Подписи осей X
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * width;
      const value = xMin + (i / 5) * (xMax - xMin);
      ctx.fillText(value.toFixed(1), x, canvas.height - padding + 10);
    }

    // Подписи осей Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i / 5) * height;
      const value = yMin + (i / 5) * (yMax - yMin);
      ctx.fillText(value.toFixed(1), padding - 10, y);
    }

    // Заголовки осей
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('X', canvas.width / 2, canvas.height - padding + 30);
    
    ctx.save();
    ctx.translate(padding - 40, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Y', 0, 0);
    ctx.restore();

    // Нарисовать графики
    plots.forEach((plot, plotIndex) => {
      console.log(`Drawing plot ${plotIndex}: ${plot.label}`);
      
      ctx.strokeStyle = plot.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let started = false;
      let pointsDrawn = 0;

      plot.points.forEach(([x, y], index) => {
        if (!isFinite(x) || !isFinite(y)) {
          console.log(`Skipping invalid point at index ${index}:`, x, y);
          return;
        }

        const px = scaleX(x);
        const py = scaleY(y);

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
          console.log('First point:', { x, y, px, py });
        } else {
          ctx.lineTo(px, py);
        }
        pointsDrawn++;
      });

      ctx.stroke();
      console.log(`Drew ${pointsDrawn} points for plot ${plotIndex}`);

      // Легенда
      const legendX = canvas.width - padding - 160;
      const legendY = padding + 20 + plotIndex * 30;

      // Линия в легенде
      ctx.strokeStyle = plot.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 40, legendY);
      ctx.stroke();

      // Текст легенды
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(plot.label, legendX + 50, legendY);
    });

    console.log('Drawing complete');
  }, [plots]);

  console.log('Render GraphCanvas, plots.length:', plots.length);

  if (plots.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>📈 График (ожидание данных...)</div>
        <div style={styles.emptyState}>
          Запустите программу с функцией график() для отображения
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        📈 График ({plots.length} {plots.length === 1 ? 'функция' : 'функции'})
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        style={styles.canvas}
      />
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
    background: '#1e1e1e',
    borderTop: '1px solid #3e3e42',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '300px',
  },
  header: {
    padding: '10px 15px',
    background: '#2d2d30',
    borderBottom: '1px solid #3e3e42',
    color: '#d4d4d4',
    fontWeight: 500,
    fontSize: '14px',
  },
  canvas: {
    display: 'block',
    margin: '20px auto',
    border: '1px solid #3e3e42',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#6a6a6a',
    fontStyle: 'italic' as const,
  },
  info: {
    padding: '10px 20px',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
    fontSize: '12px',
    color: '#cccccc',
    borderTop: '1px solid #3e3e42',
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