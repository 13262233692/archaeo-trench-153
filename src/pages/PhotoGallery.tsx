import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Trash2, Image, X, Eye, Download } from 'lucide-react';
import { trenchApi, photoApi } from '../services/api';
import type { Trench, Photo, Stratum, Artifact } from '../types';

export default function PhotoGallery() {
  const { id } = useParams<{ id: string }>();
  const [trench, setTrench] = useState<Trench | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [strata, setStrata] = useState<Stratum[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState<Photo | null>(null);
  const [uploadData, setUploadData] = useState({
    stratumId: '',
    artifactId: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'stratum' | 'artifact'>('all');

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (trenchId: string) => {
    try {
      const [trenchData, photosData, strataData, artifactsData] = await Promise.all([
        trenchApi.get(trenchId),
        trenchApi.getPhotos(trenchId),
        trenchApi.getStrata(trenchId),
        trenchApi.getArtifacts(trenchId),
      ]);
      setTrench(trenchData);
      setPhotos(photosData);
      setStrata(strataData);
      setArtifacts(artifactsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('trenchId', id);
      if (uploadData.stratumId) formData.append('stratumId', uploadData.stratumId);
      if (uploadData.artifactId) formData.append('artifactId', uploadData.artifactId);
      formData.append('description', uploadData.description);

      await photoApi.upload(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ stratumId: '', artifactId: '', description: '' });
      loadData(id);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (confirm('确定要删除这张照片吗？')) {
      try {
        await photoApi.delete(photoId);
        if (id) loadData(id);
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }
  };

  const getFilteredPhotos = () => {
    switch (filter) {
      case 'stratum':
        return photos.filter(p => p.stratum_id);
      case 'artifact':
        return photos.filter(p => p.artifact_id);
      default:
        return photos;
    }
  };

  const getStratumName = (stratumId: string | null) => {
    const stratum = strata.find(s => s.id === stratumId);
    return stratum?.name || '-';
  };

  const getArtifactName = (artifactId: string | null) => {
    const artifact = artifacts.find(a => a.id === artifactId);
    return artifact?.name || '-';
  };

  if (!trench) {
    return <div className="p-8 text-stone-500">加载中...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Image size={32} className="text-amber-600" />
            照片管理
          </h1>
          <p className="text-stone-600 mt-1">{trench.name} - 管理发掘照片</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
        >
          <Upload size={20} />
          上传照片
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100'
          }`}
        >
          全部 ({photos.length})
        </button>
        <button
          onClick={() => setFilter('stratum')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'stratum'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100'
          }`}
        >
          地层照片 ({photos.filter(p => p.stratum_id).length})
        </button>
        <button
          onClick={() => setFilter('artifact')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'artifact'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100'
          }`}
        >
          遗物照片 ({photos.filter(p => p.artifact_id).length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {getFilteredPhotos().length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Image size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无照片</p>
            <p className="text-sm">点击上方按钮上传第一张照片</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getFilteredPhotos().map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-stone-100 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={photo.url}
                  alt={photo.original_name}
                  className="w-full h-full object-cover"
                  onClick={() => setShowPreviewModal(photo)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setShowPreviewModal(photo)}
                    className="p-2 bg-white rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors ml-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                  <p className="text-white text-sm truncate">{photo.original_name}</p>
                  <p className="text-white text-xs opacity-75">
                    {photo.stratum_id && `地层: ${getStratumName(photo.stratum_id)}`}
                    {photo.artifact_id && `遗物: ${getArtifactName(photo.artifact_id)}`}
                    {!photo.stratum_id && !photo.artifact_id && '探方全景'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-stone-800">上传照片</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-stone-400 hover:text-stone-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  selectedFile ? 'border-amber-400 bg-amber-50' : 'border-stone-300 hover:border-amber-400'
                }`}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                {selectedFile ? (
                  <div>
                    <Image size={48} className="mx-auto mb-2 text-amber-600" />
                    <p className="text-stone-700 font-medium">{selectedFile.name}</p>
                    <p className="text-stone-500 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={48} className="mx-auto mb-2 text-stone-400" />
                    <p className="text-stone-600">点击选择照片或拖拽到此处</p>
                    <p className="text-stone-400 text-sm">支持 JPG, PNG 格式</p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  关联地层
                </label>
                <select
                  value={uploadData.stratumId}
                  onChange={(e) => setUploadData({ ...uploadData, stratumId: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">不关联</option>
                  {strata.map((stratum) => (
                    <option key={stratum.id} value={stratum.id}>{stratum.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  关联遗物
                </label>
                <select
                  value={uploadData.artifactId}
                  onChange={(e) => setUploadData({ ...uploadData, artifactId: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">不关联</option>
                  {artifacts.map((artifact) => (
                    <option key={artifact.id} value={artifact.id}>{artifact.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  照片描述
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={2}
                  placeholder="拍摄角度、内容描述等..."
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  {uploading ? '上传中...' : '上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowPreviewModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={showPreviewModal.url}
              alt={showPreviewModal.original_name}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
              <h3 className="text-white font-bold">{showPreviewModal.original_name}</h3>
              <p className="text-white text-sm opacity-75">
                {showPreviewModal.description || '暂无描述'}
              </p>
              <div className="flex gap-4 mt-2 text-sm text-white opacity-75">
                <span>地层: {getStratumName(showPreviewModal.stratum_id)}</span>
                <span>遗物: {getArtifactName(showPreviewModal.artifact_id)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowPreviewModal(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
