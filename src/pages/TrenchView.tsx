import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { trenchApi } from '../services/api';
import type { Trench, Stratum, Artifact } from '../types';
import { Box, Info, Layers, MapPin } from 'lucide-react';

function StratumMesh({ 
  stratum, 
  trenchLength, 
  trenchWidth,
  isSelected,
  onClick 
}: { 
  stratum: Stratum; 
  trenchLength: number; 
  trenchWidth: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const thickness = stratum.bottom_depth - stratum.top_depth;
  
  const dip = stratum.dip || 0;
  const strike = stratum.strike || 0;
  
  const dipRad = (dip * Math.PI) / 180;
  const strikeRad = (strike * Math.PI) / 180;

  const midDepth = (stratum.top_depth + stratum.bottom_depth) / 2;

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.01);
    }
  });

  const scaleFactor = 1 / Math.cos(dipRad);
  const scaledLength = trenchLength * scaleFactor;
  const scaledWidth = trenchWidth * scaleFactor;

  return (
    <group position={[0, -midDepth, 0]}>
      <group rotation={[0, strikeRad, 0]}>
        <mesh
          ref={meshRef}
          rotation={[dipRad, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <boxGeometry args={[scaledLength, thickness, scaledWidth]} />
          <meshStandardMaterial
            color={stratum.color}
            transparent
            opacity={isSelected ? 0.9 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

function ArtifactMarker({ 
  artifact, 
  isSelected,
  onClick 
}: { 
  artifact: Artifact;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (isSelected) {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[
        artifact.pos_x,
        -artifact.pos_y,
        artifact.pos_z
      ]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <octahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial
        color={isSelected ? '#ef4444' : '#f59e0b'}
        emissive={isSelected ? '#ef4444' : '#f59e0b'}
        emissiveIntensity={isSelected ? 0.5 : 0.2}
      />
    </mesh>
  );
}

function TrenchFrame({ length, width, depth }: { length: number; width: number; depth: number }) {
  const edges = [
    [[-length/2, 0, -width/2], [length/2, 0, -width/2]],
    [[length/2, 0, -width/2], [length/2, 0, width/2]],
    [[length/2, 0, width/2], [-length/2, 0, width/2]],
    [[-length/2, 0, width/2], [-length/2, 0, -width/2]],
    [[-length/2, 0, -width/2], [-length/2, -depth, -width/2]],
    [[length/2, 0, -width/2], [length/2, -depth, -width/2]],
    [[length/2, 0, width/2], [length/2, -depth, width/2]],
    [[-length/2, 0, width/2], [-length/2, -depth, width/2]],
    [[-length/2, -depth, -width/2], [length/2, -depth, -width/2]],
    [[length/2, -depth, -width/2], [length/2, -depth, width/2]],
    [[length/2, -depth, width/2], [-length/2, -depth, width/2]],
    [[-length/2, -depth, width/2], [-length/2, -depth, -width/2]],
  ];

  return (
    <group>
      {edges.map((edge, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...edge[0], ...edge[1]])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#78716c" linewidth={2} />
        </line>
      ))}
    </group>
  );
}

function Scene({ 
  trench, 
  strata, 
  artifacts,
  selectedStratum,
  selectedArtifact,
  onSelectStratum,
  onSelectArtifact
}: {
  trench: Trench;
  strata: Stratum[];
  artifacts: Artifact[];
  selectedStratum: string | null;
  selectedArtifact: string | null;
  onSelectStratum: (id: string | null) => void;
  onSelectArtifact: (id: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />
      
      <gridHelper args={[20, 20, '#a8a29e', '#d6d3d1']} position={[0, -trench.depth - 0.01, 0]} />
      
      <TrenchFrame length={trench.length} width={trench.width} depth={trench.depth} />
      
      {strata.map((stratum) => (
        <StratumMesh
          key={stratum.id}
          stratum={stratum}
          trenchLength={trench.length}
          trenchWidth={trench.width}
          isSelected={selectedStratum === stratum.id}
          onClick={() => onSelectStratum(selectedStratum === stratum.id ? null : stratum.id)}
        />
      ))}
      
      {artifacts.map((artifact) => (
        <ArtifactMarker
          key={artifact.id}
          artifact={artifact}
          isSelected={selectedArtifact === artifact.id}
          onClick={() => onSelectArtifact(selectedArtifact === artifact.id ? null : artifact.id)}
        />
      ))}
    </>
  );
}

export default function TrenchView() {
  const { id } = useParams<{ id: string }>();
  const [trench, setTrench] = useState<Trench | null>(null);
  const [strata, setStrata] = useState<Stratum[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedStratum, setSelectedStratum] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (trenchId: string) => {
    try {
      const [trenchData, strataData, artifactsData] = await Promise.all([
        trenchApi.get(trenchId),
        trenchApi.getStrata(trenchId),
        trenchApi.getArtifacts(trenchId),
      ]);
      setTrench(trenchData);
      setStrata(strataData);
      setArtifacts(artifactsData);
    } catch (error) {
      console.error('Failed to load trench data:', error);
    }
  };

  const selectedStratumData = strata.find(s => s.id === selectedStratum);
  const selectedArtifactData = artifacts.find(a => a.id === selectedArtifact);

  if (!trench) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-stone-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
          <h2 className="font-bold text-stone-800 text-lg">{trench.name}</h2>
          <p className="text-sm text-stone-500">{trench.location}</p>
          <div className="flex gap-4 mt-2 text-xs text-stone-600">
            <span>长: {trench.length}m</span>
            <span>宽: {trench.width}m</span>
            <span>深: {trench.depth}m</span>
          </div>
        </div>

        <Canvas
          camera={{ position: [8, 6, 8], fov: 50 }}
          onPointerMissed={() => {
            setSelectedStratum(null);
            setSelectedArtifact(null);
          }}
        >
          <Scene
            trench={trench}
            strata={strata}
            artifacts={artifacts}
            selectedStratum={selectedStratum}
            selectedArtifact={selectedArtifact}
            onSelectStratum={setSelectedStratum}
            onSelectArtifact={setSelectedArtifact}
          />
        </Canvas>
      </div>

      <div className="w-80 bg-white border-l border-stone-200 p-6 overflow-y-auto">
        <h3 className="font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
          <Info size={20} />
          详情面板
        </h3>

        {selectedStratumData && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Layers size={16} />
              地层信息
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-stone-300"
                  style={{ backgroundColor: selectedStratumData.color }}
                />
                <span className="font-medium">{selectedStratumData.name}</span>
              </div>
              <p className="text-stone-600">{selectedStratumData.description || '暂无描述'}</p>
              <div className="text-stone-500">
                <p>顶部深度: {selectedStratumData.top_depth}m</p>
                <p>底部深度: {selectedStratumData.bottom_depth}m</p>
                <p>厚度: {(selectedStratumData.bottom_depth - selectedStratumData.top_depth).toFixed(2)}m</p>
                <p>倾角: {(selectedStratumData.dip || 0).toFixed(1)}°</p>
                <p>倾向: {(selectedStratumData.strike || 0).toFixed(1)}°</p>
              </div>
            </div>
          </div>
        )}

        {selectedArtifactData && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              遗物信息
            </h4>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{selectedArtifactData.name}</p>
              <p className="text-stone-600">类型: {selectedArtifactData.type}</p>
              <p className="text-stone-600">{selectedArtifactData.description || '暂无描述'}</p>
              <div className="text-stone-500">
                <p>坐标: X:{selectedArtifactData.pos_x.toFixed(2)} Y:{selectedArtifactData.pos_y.toFixed(2)} Z:{selectedArtifactData.pos_z.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {!selectedStratumData && !selectedArtifactData && (
          <div className="text-center py-8 text-stone-400">
            <Box size={48} className="mx-auto mb-2 opacity-50" />
            <p>点击地层或遗物查看详情</p>
          </div>
        )}

        <div className="mt-6">
          <h4 className="font-bold text-stone-700 mb-3">地层图例</h4>
          <div className="space-y-2">
            {strata.map((stratum) => (
              <div 
                key={stratum.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded"
                onClick={() => setSelectedStratum(stratum.id)}
              >
                <div 
                  className="w-4 h-4 rounded border border-stone-300"
                  style={{ backgroundColor: stratum.color }}
                />
                <span className="text-stone-700">{stratum.name}</span>
              </div>
            ))}
            {strata.length === 0 && (
              <p className="text-stone-400 text-sm">暂无地层数据</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-stone-700 mb-3">遗物统计</h4>
          <p className="text-2xl font-bold text-amber-600">{artifacts.length}</p>
          <p className="text-sm text-stone-500">已标记遗物数量</p>
        </div>
      </div>
    </div>
  );
}
