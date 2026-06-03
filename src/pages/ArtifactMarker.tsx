import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Save, X, MapPin, Box } from 'lucide-react';
import { trenchApi, artifactApi } from '../services/api';
import type { Trench, Artifact, Stratum } from '../types';

const ARTIFACT_TYPES = [
  '陶器',
  '瓷器',
  '石器',
  '骨器',
  '金属器',
  '建筑构件',
  '动物骨骼',
  '植物遗存',
  '其他',
];

export default function ArtifactMarker() {
  const { id } = useParams<{ id: string }>();
  const [trench, setTrench] = useState<Trench | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [strata, setStrata] = useState<Stratum[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: ARTIFACT_TYPES[0],
    stratumId: '',
    posX: 0,
    posY: 0.5,
    posZ: 0,
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (trenchId: string) => {
    try {
      const [trenchData, artifactsData, strataData] = await Promise.all([
        trenchApi.get(trenchId),
        trenchApi.getArtifacts(trenchId),
        trenchApi.getStrata(trenchId),
      ]);
      setTrench(trenchData);
      setArtifacts(artifactsData);
      setStrata(strataData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      type: ARTIFACT_TYPES[0],
      stratumId: strata[0]?.id || '',
      posX: 0,
      posY: 0.5,
      posZ: 0,
      description: '',
    });
    setEditingArtifact(null);
    setShowModal(true);
  };

  const openEditModal = (artifact: Artifact) => {
    setFormData({
      name: artifact.name,
      type: artifact.type,
      stratumId: artifact.stratum_id || '',
      posX: artifact.pos_x,
      posY: artifact.pos_y,
      posZ: artifact.pos_z,
      description: artifact.description,
    });
    setEditingArtifact(artifact);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    try {
      if (editingArtifact) {
        await artifactApi.update(editingArtifact.id, {
          ...formData,
          stratumId: formData.stratumId || null,
        });
      } else {
        await artifactApi.create({
          trenchId: id,
          ...formData,
          stratumId: formData.stratumId || null,
        });
      }
      setShowModal(false);
      loadData(id);
    } catch ( error) {
      console.error('Failed to save artifact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (artifactId: string) => {
    if (confirm('确定要删除这个遗物吗？')) {
      try {
        await artifactApi.delete(artifactId);
        if (id) loadData(id);
      } catch (error) {
        console.error('Failed to delete artifact:', error);
      }
    }
  };

  const getStratumName = (stratumId: string | null) => {
    const stratum = strata.find(s => s.id === stratumId);
    return stratum?.name || '未归属';
  };

  if (!trench) {
    return <div className="p-8 text-stone-500">加载中...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <MapPin size={32} className="text-amber-600" />
            遗物标注
          </h1>
          <p className="text-stone-600 mt-1">{trench.name} - 标记和管理出土遗物</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
        >
          <Plus size={20} />
          添加遗物
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Box size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">遗物总数</p>
              <p className="text-2xl font-bold text-stone-800">{artifacts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
              <MapPin size={20} className="text-stone-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">遗物类型</p>
              <p className="text-2xl font-bold text-stone-800">
                {new Set(artifacts.map(a => a.type)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">已归属地层</p>
              <p className="text-2xl font-bold text-stone-800">
                {artifacts.filter(a => a.stratum_id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-stone-800 mb-6">遗物列表</h2>
        
        {artifacts.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无遗物数据</p>
            <p className="text-sm">点击上方按钮添加第一个遗物</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 font-medium text-stone-600">名称</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-600">类型</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-600">所属地层</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-600">坐标 (X, Y, Z)</th>
                  <th className="text-left py-3 px-4 font-medium text-stone-600">描述</th>
                  <th className="text-right py-3 px-4 font-medium text-stone-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map((artifact) => (
                  <tr key={artifact.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-stone-800">{artifact.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">
                        {artifact.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {getStratumName(artifact.stratum_id)}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-sm">
                      ({artifact.pos_x.toFixed(2)}, {artifact.pos_y.toFixed(2)}, {artifact.pos_z.toFixed(2)})
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-sm max-w-xs truncate">
                      {artifact.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(artifact)}
                        className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-block"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(artifact.id)}
                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-stone-800">
                {editingArtifact ? '编辑遗物' : '添加遗物'}
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
                  遗物名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="例如：陶片1号"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  遗物类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {ARTIFACT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  所属地层
                </label>
                <select
                  value={formData.stratumId}
                  onChange={(e) => setFormData({ ...formData, stratumId: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">未归属</option>
                  {strata.map((stratum) => (
                    <option key={stratum.id} value={stratum.id}>{stratum.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    X 坐标
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.posX}
                    onChange={(e) => setFormData({ ...formData, posX: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Y 坐标 (深度)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.posY}
                    onChange={(e) => setFormData({ ...formData, posY: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Z 坐标
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.posZ}
                    onChange={(e) => setFormData({ ...formData, posZ: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  遗物描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="描述遗物的形状、纹饰、材质等..."
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
