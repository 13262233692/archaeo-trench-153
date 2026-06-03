import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  BarChart3, Layers, MapPin, Image, Download, TrendingUp, 
  HeatMap, Target, Brain, Settings
} from 'lucide-react';
import { trenchApi } from '../services/api';
import type { Trench, Stratum, Artifact, Photo } from '../types';
import DensityHeatmap from '../components/DensityHeatmap';
import DepthHistogram from '../components/DepthHistogram';
import BurialAnalysis from '../components/BurialAnalysis';

const COLORS = ['#8B4513', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F', '#A0522D', '#CD853F'];

type TabType = 'overview' | 'spatial' | 'depth' | 'burial';

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const [trench, setTrench] = useState<Trench | null>(null);
  const [strata, setStrata] = useState<Stratum[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [cellSize, setCellSize] = useState(0.5);
  const [binSize, setBinSize] = useState(0.2);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (trenchId: string) => {
    try {
      const [trenchData, strataData, artifactsData, photosData] = await Promise.all([
        trenchApi.get(trenchId),
        trenchApi.getStrata(trenchId),
        trenchApi.getArtifacts(trenchId),
        trenchApi.getPhotos(trenchId),
      ]);
      setTrench(trenchData);
      setStrata(strataData);
      setArtifacts(artifactsData);
      setPhotos(photosData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const artifactTypeData = () => {
    const typeCount: Record<string, number> = {};
    artifacts.forEach(a => {
      typeCount[a.type] = (typeCount[a.type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };

  const stratumThicknessData = () => {
    return strata.map(s => ({
      name: s.name,
      厚度: parseFloat((s.bottom_depth - s.top_depth).toFixed(2)),
    }));
  };

  const stratumArtifactData = () => {
    return strata.map(s => ({
      name: s.name,
      遗物数量: artifacts.filter(a => a.stratum_id === s.id).length,
    }));
  };

  const totalVolume = () => {
    if (!trench) return 0;
    return trench.length * trench.width * trench.depth;
  };

  const averageDepth = () => {
    if (strata.length === 0) return 0;
    return Math.max(...strata.map(s => s.bottom_depth));
  };

  const exportReport = () => {
    const depths = artifacts.map(a => a.pos_y);
    const meanDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;
    const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
    const minDepth = depths.length > 0 ? Math.min(...depths) : 0;

    const report = {
      探方名称: trench?.name,
      探方位置: trench?.location,
      探方尺寸: `${trench?.length}m × ${trench?.width}m × ${trench?.depth}m`,
      探方体积: `${totalVolume().toFixed(2)} m³`,
      地层数量: strata.length,
      遗物数量: artifacts.length,
      照片数量: photos.length,
      遗物空间分析: {
        平均深度: `${meanDepth.toFixed(2)}m`,
        最大深度: `${maxDepth.toFixed(2)}m`,
        最小深度: `${minDepth.toFixed(2)}m`,
        深度跨度: `${(maxDepth - minDepth).toFixed(2)}m`,
      },
      地层详情: strata.map(s => ({
        名称: s.name,
        深度: `${s.top_depth}m - ${s.bottom_depth}m`,
        厚度: `${(s.bottom_depth - s.top_depth).toFixed(2)}m`,
        倾角: `${s.dip || 0}°`,
        倾向: `${s.strike || 0}°`,
        描述: s.description,
        遗物数量: artifacts.filter(a => a.pos_y >= s.top_depth && a.pos_y < s.bottom_depth).length,
      })),
      遗物类型统计: artifactTypeData(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trench?.name || 'trench'}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: '总览', icon: BarChart3 },
    { id: 'spatial', label: '空间分布', icon: HeatMap },
    { id: 'depth', label: '深度分析', icon: Target },
    { id: 'burial', label: '埋藏规律', icon: Brain },
  ];

  if (!trench) {
    return <div className="p-8 text-stone-500">加载中...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <BarChart3 size={32} className="text-amber-600" />
            数据分析
          </h1>
          <p className="text-stone-600 mt-1">{trench.name} - 数据统计与分析</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-lg"
        >
          <Download size={20} />
          导出报告
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Layers size={24} className="text-amber-600" />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-stone-800">{strata.length}</p>
          <p className="text-stone-500">地层数量</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin size={24} className="text-orange-600" />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-stone-800">{artifacts.length}</p>
          <p className="text-stone-500">遗物数量</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image size={24} className="text-blue-600" />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-stone-800">{photos.length}</p>
          <p className="text-stone-500">照片数量</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-stone-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-stone-800">{totalVolume().toFixed(1)}</p>
          <p className="text-stone-500">发掘体积 (m³)</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-md">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <IconComponent size={18} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-6">地层厚度分布</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stratumThicknessData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fill: '#57534e' }} />
                  <YAxis tick={{ fill: '#57534e' }} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fafaf9',
                      border: '1px solid #d6d3d1',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="厚度" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-6">遗物类型分布</h2>
            <div className="h-80">
              {artifactTypeData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={artifactTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {artifactTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fafaf9',
                        border: '1px solid #d6d3d1',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400">
                  暂无遗物数据
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-6">各地层遗物数量</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stratumArtifactData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fill: '#57534e' }} />
                  <YAxis tick={{ fill: '#57534e' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fafaf9',
                      border: '1px solid #d6d3d1',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="遗物数量" fill="#8b5a2b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-6">探方详情</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-500">探方名称</p>
                  <p className="font-bold text-stone-800">{trench.name}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-500">位置</p>
                  <p className="font-bold text-stone-800">{trench.location || '-'}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-500">长度 × 宽度</p>
                  <p className="font-bold text-stone-800">{trench.length}m × {trench.width}m</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-500">设计深度</p>
                  <p className="font-bold text-stone-800">{trench.depth}m</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-500">实际发掘深度</p>
                  <p className="font-bold text-stone-800">{averageDepth().toFixed(2)}m</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-500">创建时间</p>
                  <p className="font-bold text-stone-800">
                    {new Date(trench.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spatial' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <HeatMap size={24} className="text-amber-600" />
                遗物密度热力图
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <Settings size={16} />
                  网格大小:
                </label>
                <select
                  value={cellSize}
                  onChange={(e) => setCellSize(parseFloat(e.target.value))}
                  className="px-3 py-1 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value={0.25}>0.25m × 0.25m</option>
                  <option value={0.5}>0.5m × 0.5m</option>
                  <option value={1}>1m × 1m</option>
                </select>
              </div>
            </div>
            <div className="flex justify-center">
              <DensityHeatmap
                artifacts={artifacts}
                trench={trench}
                cellSize={cellSize}
              />
            </div>
            <div className="mt-4 text-center text-sm text-stone-500">
              <p>红色表示高密度区域，绿色表示低密度区域。白色圆点为遗物实际位置。</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'depth' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Target size={24} className="text-amber-600" />
                深度分布直方图
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <Settings size={16} />
                  区间大小:
                </label>
                <select
                  value={binSize}
                  onChange={(e) => setBinSize(parseFloat(e.target.value))}
                  className="px-3 py-1 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value={0.1}>0.1m</option>
                  <option value={0.2}>0.2m</option>
                  <option value={0.5}>0.5m</option>
                  <option value={1}>1m</option>
                </select>
              </div>
            </div>
            <DepthHistogram
              artifacts={artifacts}
              strata={strata}
              maxDepth={trench.depth}
              binSize={binSize}
            />
          </div>
        </div>
      )}

      {activeTab === 'burial' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <Brain size={24} className="text-amber-600" />
              埋藏规律智能分析
            </h2>
            <BurialAnalysis
              artifacts={artifacts}
              strata={strata}
              trenchLength={trench.length}
              trenchWidth={trench.width}
            />
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-stone-800 mb-6">地层明细表</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-3 px-4 font-medium text-stone-600">地层名称</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">颜色</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">顶部深度</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">底部深度</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">厚度</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">倾角/倾向</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">遗物数量</th>
                <th className="text-left py-3 px-4 font-medium text-stone-600">描述</th>
              </tr>
            </thead>
            <tbody>
              {strata.map((stratum) => (
                <tr key={stratum.id} className="border-b border-stone-100">
                  <td className="py-3 px-4 font-medium text-stone-800">{stratum.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-stone-300"
                        style={{ backgroundColor: stratum.color }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-600">{stratum.top_depth}m</td>
                  <td className="py-3 px-4 text-stone-600">{stratum.bottom_depth}m</td>
                  <td className="py-3 px-4 text-stone-600">
                    {(stratum.bottom_depth - stratum.top_depth).toFixed(2)}m
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {stratum.dip || 0}° / {stratum.strike || 0}°
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">
                      {artifacts.filter(a => a.pos_y >= stratum.top_depth && a.pos_y < stratum.bottom_depth).length}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                    {stratum.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
