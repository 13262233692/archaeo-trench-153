import { useEffect, useRef, useMemo } from 'react';
import type { Artifact, Trench } from '../types';

interface DensityHeatmapProps {
  artifacts: Artifact[];
  trench: Trench;
  cellSize?: number;
}

export default function DensityHeatmap({ 
  artifacts, 
  trench, 
  cellSize = 0.5 
}: DensityHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const densityData = useMemo(() => {
    const cols = Math.ceil(trench.length / cellSize);
    const rows = Math.ceil(trench.width / cellSize);
    const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

    artifacts.forEach(artifact => {
      const col = Math.floor((artifact.pos_x + trench.length / 2) / cellSize);
      const row = Math.floor((artifact.pos_z + trench.width / 2) / cellSize);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        grid[row][col]++;
      }
    });

    const maxDensity = Math.max(...grid.flat(), 1);

    return { grid, maxDensity, cols, rows };
  }, [artifacts, trench, cellSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { grid, maxDensity, cols, rows } = densityData;
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const density = grid[row][col];
        const intensity = density / maxDensity;
        
        const r = Math.floor(255 * intensity);
        const g = Math.floor(255 * (1 - intensity));
        const b = Math.floor(100 * (1 - intensity));
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);

        if (density > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.strokeRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    artifacts.forEach(artifact => {
      const x = ((artifact.pos_x + trench.length / 2) / trench.length) * canvas.width;
      const y = ((artifact.pos_z + trench.width / 2) / trench.width) * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#57534e';
    ctx.font = '10px sans-serif';
    ctx.fillText(`0m`, 4, canvas.height - 4);
    ctx.fillText(`${trench.length.toFixed(1)}m`, canvas.width - 30, canvas.height - 4);
    ctx.fillText(`0m`, canvas.width - 20, 14);
    ctx.fillText(`${trench.width.toFixed(1)}m`, canvas.width - 20, canvas.height - 4);
  }, [densityData, artifacts, trench]);

  const colorLegend = useMemo(() => {
    const colors: { color: string; label: string }[] = [];
    for (let i = 0; i <= 5; i++) {
      const intensity = i / 5;
      const r = Math.floor(255 * intensity);
      const g = Math.floor(255 * (1 - intensity));
      const b = Math.floor(100 * (1 - intensity));
      colors.push({
        color: `rgb(${r}, ${g}, ${b})`,
        label: i === 0 ? '低' : i === 5 ? '高' : ''
      });
    }
    return colors;
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-stone-300 rounded-lg bg-stone-50"
        />
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-stone-500">低密度</span>
        <div className="flex gap-1">
          {colorLegend.map((item, i) => (
            <div
              key={i}
              className="w-8 h-4 border border-stone-300"
              style={{ backgroundColor: item.color }}
            />
          ))}
        </div>
        <span className="text-xs text-stone-500">高密度</span>
      </div>
      
      <div className="mt-2 text-xs text-stone-500">
        最大密度: {densityData.maxDensity} 件/格 | 网格大小: {cellSize}m × {cellSize}m
      </div>
    </div>
  );
}
