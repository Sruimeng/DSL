import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { DSLEngine } from '../../src/DSL/engine';
import { DSLRenderer } from '../../src/DSL/r3fRenderer';
import './styles/gltf-demo.css';

// 使用Three的对象类型
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// DSL React Hook
function useDSLRenderer() {
  const r3fContext = useThree();
  const [engine] = useState(() => new DSLEngine());
  const rendererRef = useRef<DSLRenderer>();

  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new DSLRenderer(r3fContext, engine);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return { engine, renderer: rendererRef.current };
}

// 3D场景组件
function Scene() {
  const { engine } = useDSLRenderer();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const gltfRef = useRef<THREE.Group>(null);

  // 加载GLTF模型
  const { scene: gltfScene } = useGLTF('./assets/glb/ToyCar.glb');

  useEffect(() => {
    if (gltfScene && engine) {
      engine.addObject({
        id: 'gltf_model',
        name: 'Toy Car',
        type: 'group',
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        visible: true,
        castShadow: true,
        receiveShadow: true
      });
    }
  }, [gltfScene, engine]);

  useFrame((state) => {
    if (gltfRef.current) {
      gltfRef.current.rotation.y += 0.005;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      <primitive 
        ref={gltfRef}
        object={gltfScene} 
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
      />
      
      <gridHelper args={[10, 10]} />
    </>
  );
}

// 控制面板组件
function ControlPanel() {
  const { engine } = useDSLRenderer();
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('ToyCar.glb');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-10));
  };

  const updateTransform = () => {
    if (engine) {
      engine.updateObject('gltf_model', {
        transform: {
          position: { x: position.x, y: position.y, z: position.z },
          rotation: { x: rotation.x * Math.PI / 180, y: rotation.y * Math.PI / 180, z: rotation.z * Math.PI / 180 },
          scale: { x: scale.x, y: scale.y, z: scale.z }
        }
      });
      addLog(`Transform updated: Pos(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
    }
  };

  const addLight = () => {
    if (engine) {
      engine.addLight({
        id: 'directional_light_2',
        name: 'Additional Light',
        type: 'directional',
        color: '#ffffff',
        intensity: 0.8,
        position: { x: 5, y: 5, z: 5 }
      });
      addLog('Added directional light');
    }
  };

  const loadModel = (filename: string) => {
    setSelectedFile(filename);
    addLog(`Loading model: ${filename}`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addLog(`Uploading: ${file.name}`);
    }
  };

  const clearScene = () => {
    if (engine) {
      engine.clearScene();
      addLog('Scene cleared');
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1>🎨 GLTF模型管理器</h1>
        <p>React Three Fiber + DSL引擎演示</p>
      </div>

      {/* 模型选择区域 */}
      <div className="control-section">
        <div className="section-title">📂 模型选择</div>
        <div className="button-grid">
          <button className="btn btn-primary" onClick={() => loadModel('ToyCar.glb')}>🚗 ToyCar</button>
          <button className="btn btn-primary" onClick={() => loadModel('Duck.glb')}>🦆 Duck</button>
          <button className="btn btn-primary" onClick={() => loadModel('Suzanne.glb')}>🐵 Suzanne</button>
          <button className="btn btn-primary" onClick={() => loadModel('BoomBox.glb')}>📻 BoomBox</button>
        </div>
        
        <div className="control-group" style={{ marginTop: '12px' }}>
          <label className="control-label">上传文件</label>
          <input 
            type="file" 
            accept=".glb,.gltf" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            📤 上传GLTF
          </button>
        </div>
      </div>

      {/* 变换控制区域 */}
      <div className="control-section">
        <div className="section-title">🎯 变换控制</div>
        
        <div className="control-group">
          <label className="control-label">位置 (Position)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div>
              <label className="control-label">X: {position.x.toFixed(1)}</label>
              <input 
                type="range" 
                className="range-input" 
                min="-5" max="5" step="0.1" 
                value={position.x}
                onChange={(e) => setPosition({...position, x: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="control-label">Y: {position.y.toFixed(1)}</label>
              <input 
                type="range" 
                className="range-input" 
                min="-5" max="5" step="0.1" 
                value={position.y}
                onChange={(e) => setPosition({...position, y: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="control-label">Z: {position.z.toFixed(1)}</label>
              <input 
                type="range" 
                className="range-input" 
                min="-5" max="5" step="0.1" 
                value={position.z}
                onChange={(e) => setPosition({...position, z: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">旋转 (Rotation)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div>
              <label className="control-label">X: {rotation.x.toFixed(0)}°</label>
              <input 
                type="range" 
                className="range-input" 
                min="0" max="360" step="1" 
                value={rotation.x}
                onChange={(e) => setRotation({...rotation, x: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="control-label">Y: {rotation.y.toFixed(0)}°</label>
              <input 
                type="range" 
                className="range-input" 
                min="0" max="360" step="1" 
                value={rotation.y}
                onChange={(e) => setRotation({...rotation, y: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="control-label">Z: {rotation.z.toFixed(0)}°</label>
              <input 
                type="range" 
                className="range-input" 
                min="0" max="360" step="1" 
                value={rotation.z}
                onChange={(e) => setRotation({...rotation, z: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">缩放 (Scale)</label>
          <input 
            type="range" 
            className="range-input" 
            min="0.1" max="3" step="0.1" 
            value={scale.x}
            onChange={(e) => setScale({x: parseFloat(e.target.value), y: parseFloat(e.target.value), z: parseFloat(e.target.value)})}
          />
          <label className="control-label">{scale.x.toFixed(1)}</label>
        </div>

        <button className="btn btn-primary" onClick={updateTransform}>
          🔄 应用变换
        </button>
      </div>

      {/* 场景控制区域 */}
      <div className="control-section">
        <div className="section-title">💡 场景控制</div>
        <div className="button-grid">
          <button className="btn btn-secondary" onClick={addLight}>💡 添加光源</button>
          <button className="btn btn-warning" onClick={clearScene}>🗑️ 清空场景</button>
        </div>
      </div>

      {/* 日志区域 */}
      <div className="logs-section">
        <div className="section-title">📝 操作日志</div>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 统计面板组件
function StatsPanel() {
  const [stats, setStats] = useState({
    objects: 1,
    materials: 1,
    lights: 2,
    fps: 60
  });

  return (
    <div className="top-stats-panel">
      <div className="stats-title">📊 场景统计</div>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="label">Objects:</span>
          <span className="value">{stats.objects}</span>
        </div>
        <div className="stat-item">
          <span className="label">Materials:</span>
          <span className="value">{stats.materials}</span>
        </div>
        <div className="stat-item">
          <span className="label">Lights:</span>
          <span className="value">{stats.lights}</span>
        </div>
        <div className="stat-item">
          <span className="label">FPS:</span>
          <span className="value">{stats.fps}</span>
        </div>
      </div>
    </div>
  );
}

// 主组件
export default function GLTFLoaderDemo() {
  return (
    <div className="gltf-demo-container">
      {/* 左侧展示区 */}
      <div className="viewer-section">
        <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
          <Scene />
        </Canvas>
        <StatsPanel />
      </div>

      {/* 右侧控制面板 */}
      <ControlPanel />
    </div>
  );
}