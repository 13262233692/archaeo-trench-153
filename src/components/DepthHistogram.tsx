import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Artifact, Stratum } from '../types';

interface DepthHistogramProps {
  artifacts: Artifact[];
  strata: Stratum[];
  maxDepth: number;
  binSize?: number;
}

export default function DepthHistogram({ 
  artifacts, 
  strata,
  maxDepth,
  binSize = 0.2 
}: DepthHistogramProps) {
  const histogramData = useMemo(() => {
    const bins: { depth: string; count: number; range: [number, number] }[] = [];
    const numBins = Math.ceil(maxDepth / binSize);

    for (let i = 0; i < numBins; i++) {
      const startDepth = i * binSize;
      const endDepth = Math.min((i + 1) * binSize, maxDepth);
      bins.push({
        depth: `${startDepth.toFixed(1)}-${endDepth.toFixed(1)}m`,
        count: 0,
        range: [startDepth, endDepth]
      });
    }

    artifacts.forEach(artifact => {
      const binIndex = Math.floor(artifact.pos_y / binSize);
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex].count++;
      }
    });

    return bins;
  }, [artifacts, maxDepth, binSize]);

  const getStratumColor = (depth: number) => {
    const stratum = strata.find(s => depth >= s.top_depth && depth < s.bottom_depth);
    return stratum?.color || '#d6d3d1';
  };

  const stats = useMemo(() => {
    if (artifacts.length === 0) {
      return {
        meanDepth: 0,
        medianDepth: 0,
        stdDev: 0,
        minDepth: 0,
        maxDepth: 0,
      };
    }

    const depths = artifacts.map(a => a.pos_y).sort((a, b) => a - b);
    const meanDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    const medianDepth = depths.length % 2 === 0
      ? (depths[depths.length / 2 - 1] + depths[depths.length / 2]) / 2
      : depths[Math.floor(depths.length / 2)];
    const variance = depths.reduce((acc, d) => acc + Math.pow(d - meanDepth, 2), 0) / depths.length;
    const stdDev = Math.sqrt(variance);

    return {
      meanDepth,
      medianDepth,
      stdDev,
      minDepth: depths[0],
      maxDepth: depths[depths.length - 1],
    };
  }, [artifacts]);

  const stratumBoundaries = useMemo(() => {
    return strata.map(s => ({
      name: s.name,
      depth: s.top_depth,
      color: s.color,
    }));
  }, [strata]);

  return (
    <div className="w-full">
      <div className="h-64">
        {artifacts.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="depth"
                tick={{ fill: '#57534e', fontSize: 10 }}
                tickLine={{ stroke: '#a8a29e' }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: '#57534e', fontSize: 10 }}
                tickLine={{ stroke: '#a8a29e' }}
                label={{ value: '遗物数量', angle: -90, position: 'insideLeft', style: { fill: '#57534e', fontSize: 10 } }}
              />
              <Tooltip
                formatter={(value: number) => [`${value} 件`, '数量']}
                labelFormatter={(label) => `深度区间: ${label}`}
                contentStyle={{
                  backgroundColor: '#fafaf9',
                  border: '1px solid #d6d3d1',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {histogramData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStratumColor(entry.range[0])}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400">
            暂无遗物数据
          </div>
        )}
      </div>

      {stratumBoundaries.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stratumBoundaries.map((boundary, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-sm border border-stone-300"
                style={{ backgroundColor: boundary.color }}
              />
              <span className="text-stone-600">
                {boundary.name} ({boundary.depth}m)
              </span>
            </div>
          ))}
        </div>
      )}

      {artifacts.length > 0 && (
        <div className="mt-6 grid grid-cols-5 gap-4">
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <p className="text-xs text-stone-500">平均深度</p>
            <p className="font-bold text-stone-800">{stats.meanDepth.toFixed(2)}m</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <p className="text-xs text-stone-500">中位深度</p>
            <p className="font-bold text-stone-800">{stats.medianDepth.toFixed(2)}m</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <p className="text-xs text-stone-500">标准差</p>
            <p className="font-bold text-stone-800">{stats.stdDev.toFixed(2)}m</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <p className="text-xs text-stone-500">最浅</p>
            <p className="font-bold text-stone-800">{stats.minDepth.toFixed(2)}m</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <p className="text-xs text-stone-500">最深</p>
            <p className="font-bold text-stone-800">{stats.maxDepth.toFixed(2)}m</p>
          </div>
        </div>
      )}
    </div>
  );
}
