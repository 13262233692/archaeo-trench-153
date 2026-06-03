import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Save, X, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { trenchApi, stratumApi } from '../services/api';
import type { Trench, Stratum } from '../types';

const DEFAULT_COLORS = [
  '#D2B48C',
  '#C4A484',
  '#8B7355',
  '#6B4423',
  '#A0522D',
  '#CD853F',
  '#DEB887',
  '#F4A460',
];

export default function StrataEditor() {
  const { id } = useParams<{ id: string }>();
  const [trench, setTrench] = useState<Trench | null>(null);
  const [strata, setStrata] = useState<Stratum[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStratum, setEditingStratum] = useState<Stratum | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: DEFAULT_COLORS[0],
    description: '',
    topDepth: 0,
    bottomDepth: 0.5,
    dip: 0,
    strike: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (trenchId: string) => {
    try {
      const [trenchData, strataData] = await Promise.all([
        trenchApi.get(trenchId),
        trenchApi.getStrata(trenchId),
      ]);
      setTrench(trenchData);
      setStrata(strataData.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const openAddModal = () => {
    const maxDepth = strata.length > 0 ? Math.max(...strata.map(s => s.bottom_depth)) : 0;
    setFormData({
      name: `第${strata.length + 1}层`,
      color: DEFAULT_COLORS[strata.length % DEFAULT_COLORS.length],
      description: '',
      topDepth: maxDepth,
      bottomDepth: Math.min(maxDepth + 0.5, trench?.depth || 2),
      dip: 0,
      strike: 0,
    });
    setEditingStratum(null);
    setShowModal(true);
  };

  const openEditModal = (stratum: Stratum) => {
    setFormData({
      name: stratum.name,
      color: stratum.color,
      description: stratum.description,
      topDepth: stratum.top_depth,
      bottomDepth: stratum.bottom_depth,
      dip: stratum.dip || 0,
      strike: stratum.strike || 0,
    });
    setEditingStratum(stratum);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    try {
      if (editingStratum) {
        await stratumApi.update(editingStratum.id, {
          ...formData,
          orderIndex: editingStratum.order_index,
        });
      } else {
        await stratumApi.create({
          trenchId: id,
          ...formData,
          orderIndex: strata.length,
        });
      }
      setShowModal(false);
      loadData(id);
    } catch (error) {
      console.error('Failed to save stratum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stratumId: string) => {
    if (confirm('确定要删除这个地层吗？')) {
      try {
        await stratumApi.delete(stratumId);
        if (id) loadData(id);
      } catch (error) {
        console.error('Failed to delete stratum:', error);
      }
    }
  };

  const moveStratum = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= strata.length) return;

    const newStrata = [...strata];
    [newStrata[index], newStrata[newIndex]] = [newStrata[newIndex], newStrata[index]];
    
    try {
      await Promise.all(
        newStrata.map((s, i) => stratumApi.update(s.id, { ...s, orderIndex: i }))
      );
      if (id) loadData(id);
    } catch (error) {
      console.error('Failed to reorder strata:', error);
    }
  };

  if (!trench) {
    return <div className="p-8 text-stone-500">加载中...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Layers size={32} className="text-amber-600" />
            地层编辑
          </h1>
          <p className="text-stone-600 mt-1">{trench.name} - 管理探方地层</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
        >
          <Plus size={20} />
          添加地层
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-stone-800 mb-6">地层列表</h2>
          
          {strata.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Layers size={48} className="mx-auto mb-4 opacity-50" />
              <p>暂无地层数据</p>
              <p className="text-sm">点击上方按钮添加第一个地层</p>
            </div>
          ) : (
            <div className="space-y-4">
              {strata.map((stratum, index) => (
                <div
                  key={stratum.id}
                  className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveStratum(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveStratum(index, 'down')}
                      disabled={index === strata.length - 1}
                      className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-stone-300 flex-shrink-0"
                    style={{ backgroundColor: stratum.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800 truncate">{stratum.name}</h3>
                    <p className="text-sm text-stone-500">
                      深度: {stratum.top_depth}m - {stratum.bottom_depth}m
                    </p>
                    <p className="text-sm text-stone-400 truncate">
                      {stratum.description || '暂无描述'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(stratum)}
                      className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(stratum.id)}
                      className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-stone-800 mb-6">地层剖面图预览</h2>
          
          <div className="relative h-80 bg-stone-100 rounded-lg overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-8 bg-stone-300 flex items-center justify-center text-stone-600 text-sm font-medium">
              地表 (0m)
            </div>
            
            <div className="absolute inset-x-4 top-10 bottom-4 border-2 border-stone-400 rounded">
              {strata.map((stratum) => {
                const totalDepth = trench.depth;
                const topPercent = (stratum.top_depth / totalDepth) * 100;
                const heightPercent = ((stratum.bottom_depth - stratum.top_depth) / totalDepth) * 100;
                
                return (
                  <div
                    key={stratum.id}
                    className="absolute left-0 right-0 flex items-center justify-center text-xs font-medium text-stone-800 border-b border-stone-400"
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                      backgroundColor: stratum.color,
                    }}
                  >
                    {stratum.name}
                  </div>
                );
              })}
              
              {strata.length === 0 && (
                <div className="flex items-center justify-center h-full text-stone-400">
                  添加地层后显示预览
                </div>
              )}
            </div>
            
            <div className="absolute right-0 top-10 bottom-4 w-8 flex flex-col justify-between text-xs text-stone-500 pr-1">
              <span>0m</span>
              <span>{(trench.depth / 2).toFixed(1)}m</span>
              <span>{trench.depth}m</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-stone-700 mb-3">探方信息</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-stone-50 rounded-lg p-3 text-center">
                <p className="text-xs text-stone-500">长度</p>
                <p className="font-bold text-stone-700">{trench.length}m</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3 text-center">
                <p className="text-xs text-stone-500">宽度</p>
                <p className="font-bold text-stone-700">{trench.width}m</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3 text-center">
                <p className="text-xs text-stone-500">深度</p>
                <p className="font-bold text-stone-700">{trench.depth}m</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-stone-800">
                {editingStratum ? '编辑地层' : '添加地层'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-stone-400 hover:text-stone-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  地层名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  地层颜色
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 ${
                        formData.color === color ? 'border-amber-600 ring-2 ring-amber-300' : 'border-stone-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    顶部深度 (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={trench.depth}
                    value={formData.topDepth}
                    onChange={(e) => setFormData({ ...formData, topDepth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    底部深度 (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={trench.depth}
                    value={formData.bottomDepth}
                    onChange={(e) => setFormData({ ...formData, bottomDepth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    倾角 (°)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="90"
                    value={formData.dip}
                    onChange={(e) => setFormData({ ...formData, dip: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <p className="text-xs text-stone-500 mt-1">地层倾斜角度 (0-90°)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    倾向 (°)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="360"
                    value={formData.strike}
                    onChange={(e) => setFormData({ ...formData, strike: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <p className="text-xs text-stone-500 mt-1">地层倾斜方向 (0-360°)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  地层描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="描述土质、土色、包含物等..."
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
