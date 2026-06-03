import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, Box, MapPin, Image, Calendar } from 'lucide-react';
import { trenchApi } from '../services/api';
import type { Trench } from '../types';

export default function TrenchList() {
  const [trenches, setTrenches] = useState<Trench[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    length: 5,
    width: 5,
    depth: 2,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrenches();
  }, []);

  const loadTrenches = async () => {
    try {
      const data = await trenchApi.getAll();
      setTrenches(data);
    } catch (error) {
      console.error('Failed to load trenches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await trenchApi.create(formData);
      setShowModal(false);
      setFormData({ name: '', location: '', length: 5, width: 5, depth: 2 });
      loadTrenches();
    } catch (error) {
      console.error('Failed to create trench:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个探方吗？相关的地层、遗物和照片也会被删除。')) {
      try {
        await trenchApi.delete(id);
        loadTrenches();
      } catch (error) {
        console.error('Failed to delete trench:', error);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">探方列表</h1>
          <p className="text-stone-600 mt-1">管理所有考古探方项目</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
        >
          <Plus size={20} />
          新建探方
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trenches.map((trench) => (
          <div
            key={trench.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="h-40 bg-gradient-to-br from-amber-600 to-stone-700 flex items-center justify-center">
              <Box size={64} className="text-white opacity-50" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-stone-800 mb-2">{trench.name}</h3>
              <p className="text-stone-500 text-sm mb-4 flex items-center gap-1">
                <MapPin size={14} />
                {trench.location || '未设置位置'}
              </p>
              
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-stone-100 rounded-lg p-2">
                  <p className="text-xs text-stone-500">长</p>
                  <p className="font-bold text-stone-700">{trench.length}m</p>
                </div>
                <div className="bg-stone-100 rounded-lg p-2">
                  <p className="text-xs text-stone-500">宽</p>
                  <p className="font-bold text-stone-700">{trench.width}m</p>
                </div>
                <div className="bg-stone-100 rounded-lg p-2">
                  <p className="text-xs text-stone-500">深</p>
                  <p className="font-bold text-stone-700">{trench.depth}m</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-400 mb-4">
                <Calendar size={12} />
                <span>创建于 {new Date(trench.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/trench/${trench.id}`}
                  className="flex-1 text-center py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                >
                  查看详情
                </Link>
                <button
                  onClick={() => handleDelete(trench.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {trenches.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Box size={64} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500 text-lg">暂无探方</p>
            <p className="text-stone-400">点击上方按钮创建第一个探方</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">新建探方</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  探方名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="例如：T0101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  位置
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="例如：遗址A区"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    长度 (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    宽度 (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    深度 (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.depth}
                    onChange={(e) => setFormData({ ...formData, depth: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
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
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
