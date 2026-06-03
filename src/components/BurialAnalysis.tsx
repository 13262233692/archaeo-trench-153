import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Layers, Target, Sparkles } from 'lucide-react';
import type { Artifact, Stratum } from '../types';

interface BurialAnalysisProps {
  artifacts: Artifact[];
  strata: Stratum[];
  trenchLength: number;
  trenchWidth: number;
}

interface AnalysisResult {
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
  icon: any;
  priority: number;
}

export default function BurialAnalysis({ 
  artifacts, 
  strata,
  trenchLength,
  trenchWidth
}: BurialAnalysisProps) {
  const analysisResults = useMemo(() => {
    const results: AnalysisResult[] = [];

    if (artifacts.length === 0) {
      results.push({
        type: 'info',
        title: '暂无遗物数据',
        description: '添加遗物后将自动进行埋藏规律分析。',
        icon: Target,
        priority: 10,
      });
      return results;
    }

    const depths = artifacts.map(a => a.pos_y);
    const meanDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    const maxDepth = Math.max(...depths);
    const minDepth = Math.min(...depths);
    const depthRange = maxDepth - minDepth;

    const types: Record<string, number> = {};
    artifacts.forEach(a => {
      types[a.type] = (types[a.type] || 0) + 1;
    });
    const dominantType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];

    const gridSize = 0.5;
    const cols = Math.ceil(trenchLength / gridSize);
    const rows = Math.ceil(trenchWidth / gridSize);
    const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

    artifacts.forEach(artifact => {
      const col = Math.floor((artifact.pos_x + trenchLength / 2) / gridSize);
      const row = Math.floor((artifact.pos_z + trenchWidth / 2) / gridSize);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        grid[row][col]++;
      }
    });

    const maxGridCount = Math.max(...grid.flat());
    const highDensityCells = grid.flat().filter(c => c >= maxGridCount * 0.7).length;
    const totalCells = cols * rows;
    const densityVariance = grid.flat().filter(c => c > 0).length / totalCells;

    if (depthRange < 0.3 && artifacts.length >= 5) {
      results.push({
        type: 'success',
        title: '同一埋藏层位',
        description: `遗物集中分布在${minDepth.toFixed(2)}m-${maxDepth.toFixed(2)}m深度，可能属于同一时期的活动面或废弃堆积。建议关注该层位的遗迹现象。`,
        icon: Layers,
        priority: 1,
      });
    }

    if (depthRange > 1.5 && artifacts.length >= 5) {
      results.push({
        type: 'warning',
        title: '跨层分布明显',
        description: `遗物分布深度跨度达${depthRange.toFixed(2)}m，可能存在扰动或多期活动叠加。建议进一步分析各深度遗物的类型差异。`,
        icon: AlertTriangle,
        priority: 2,
      });
    }

    if (highDensityCells > 3) {
      results.push({
        type: 'success',
        title: '存在密集分布区',
        description: `发现${highDensityCells}个高密度网格区域，可能是废弃物集中堆放点或特殊活动区域。建议对该区域进行重点发掘和记录。`,
        icon: Target,
        priority: 3,
      });
    }

    if (densityVariance < 0.1 && artifacts.length >= 10) {
      results.push({
        type: 'info',
        title: '分布相对均匀',
        description: '遗物在探方内分布较为均匀，可能代表日常活动的散落遗物，而非特殊埋藏行为。',
        icon: TrendingUp,
        priority: 4,
      });
    }

    if (dominantType && dominantType[1] >= artifacts.length * 0.5) {
      results.push({
        type: 'success',
        title: '遗物类型集中',
        description: `以${dominantType[0]}为主（占${(dominantType[1] / artifacts.length * 100).toFixed(0)}%），可能反映了特定的生产活动或功能区域。`,
        icon: Sparkles,
        priority: 5,
      });
    }

    const stratumArtifactCount: Record<string, number> = {};
    strata.forEach(s => {
      stratumArtifactCount[s.id] = artifacts.filter(a => 
        a.pos_y >= s.top_depth && a.pos_y < s.bottom_depth
      ).length;
    });

    const richStratum = Object.entries(stratumArtifactCount)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0];

    if (richStratum) {
      const stratum = strata.find(s => s.id === richStratum[0]);
      if (stratum && richStratum[1] >= 3) {
        results.push({
          type: 'info',
          title: '遗物富集地层',
          description: `${stratum.name}（${stratum.top_depth}m-${stratum.bottom_depth}m）出土遗物最多（${richStratum[1]}件），是主要的文化层。`,
          icon: Layers,
          priority: 6,
        });
      }
    }

    if (meanDepth < 0.5 && artifacts.length >= 3) {
      results.push({
        type: 'warning',
        title: '浅层遗物较多',
        description: `大量遗物分布在0.5m以上的浅层区域（平均深度${meanDepth.toFixed(2)}m），可能受到后期扰动或表土层混入。`,
        icon: AlertTriangle,
        priority: 7,
      });
    }

    const deepArtifacts = artifacts.filter(a => a.pos_y > strata.length > 0 
      ? Math.min(...strata.map(s => s.bottom_depth)) * 0.7 
      : trenchLength * 0.7
    );
    if (deepArtifacts.length >= 2 && deepArtifacts.length < artifacts.length * 0.3) {
      results.push({
        type: 'info',
        title: '存在早期遗物',
        description: `发现${deepArtifacts.length}件深部位遗物，可能代表更早的文化层或被后期活动翻入的早期遗存。`,
        icon: TrendingUp,
        priority: 8,
      });
    }

    return results.sort((a, b) => a.priority - b.priority);
  }, [artifacts, strata, trenchLength, trenchWidth]);

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  };

  const getTitleColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-800';
      case 'warning': return 'text-amber-800';
      default: return 'text-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      {analysisResults.map((result, index) => {
        const IconComponent = result.icon;
        return (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getBgColor(result.type)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-white ${getIconColor(result.type)}`}>
                <IconComponent size={20} />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${getTitleColor(result.type)} mb-1`}>
                  {result.title}
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
