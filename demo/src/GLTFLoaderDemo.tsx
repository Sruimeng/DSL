import { OrbitControls } from '@react-three/drei';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DSLEngine } from '../../src/DSL/engine';
import type { R3FContext } from '../../src/DSL/r3fRenderer';
import { DSLRenderer } from '../../src/DSL/r3fRenderer';
import { ActionTypes } from '../../src/DSL/types';
import './styles/gltf-demo.css';

// DSL Context
interface DSLContextType {
  engine: DSLEngine;
  renderer?: DSLRenderer;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const DSLContext = createContext<DSLContextType | null>(null);

// DSL Provider
function DSLProvider({ children }: { children: React.ReactNode }) {
  const [engine] = useState(() => new DSLEngine());
  const [renderer, setRenderer] = useState<DSLRenderer>();
  const [selectedModel, setSelectedModel] = useState<string>('ToyCar.glb');

  return (
    <DSLContext.Provider value={{ engine, renderer, selectedModel, setSelectedModel }}>
      {children}
    </DSLContext.Provider>
  );
}

// 使用 DSL Context 的 Hook
function useDSL() {
  const context = useContext(DSLContext);
  if (!context) {
    throw new Error('useDSL must be used within DSLProvider');
  }
  return context;
}

// 在 Canvas 内部初始化 DSL Renderer
function DSLInitializer() {
  const r3fContext = useThree();
  const { engine, renderer, setRenderer } = useDSL();
  const rendererRef = useRef<DSLRenderer>();

  useEffect(() => {
    if (!rendererRef.current) {
      const { scene, camera, gl } = r3fContext;
      console.log('🚀 Creating DSL Renderer...');
      rendererRef.current = new DSLRenderer({ scene, camera, gl } as R3FContext, engine);

      // 将renderer保存到context中，方便其他组件使用
      if (setRenderer) {
        setRenderer(rendererRef.current);
      }

      console.log('✅ DSL Renderer created and synced');
    }

    return () => {
      if (rendererRef.current) {
        console.log('🧹 Disposing DSL Renderer...');
        rendererRef.current.dispose();
      }
    };
  }, [r3fContext, engine, setRenderer]);

  return null;
}

// GLTF模型加载器组件
function GLTFModelLoader({ url, onLoad }: { url: string; onLoad: (gltf: THREE.Group) => void }) {
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const loadedRef = useRef(false);

  try {
    const { scene } = useLoader(GLTFLoader, url);

    useEffect(() => {
      if (scene && !loadedRef.current) {
        console.log(`📦 Loaded GLTF model: ${url}`);
        loadedRef.current = true;
        setGltfScene(scene);

        // 不要克隆 Three.js 对象，直接传递引用
        onLoad(scene); // 移除 .clone() 调用
      }
    }, [scene, onLoad, url]);
  } catch (error) {
    console.warn(`❌ Failed to load ${url}:`, error);

    useEffect(() => {
      if (!loadedRef.current) {
        loadedRef.current = true;

        // 创建后备立方体
        const fallbackGroup = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
        const cube = new THREE.Mesh(geometry, material);
        cube.name = 'fallback-cube';
        fallbackGroup.add(cube);

        console.log('📦 Using fallback cube model');
        onLoad(fallbackGroup);
      }
    }, [onLoad]);
  }

  return null;
}

// 3D场景组件 - 完全依赖DSL
function Scene() {
  const { engine, selectedModel } = useDSL();
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);

  // 处理模型加载完成
  const handleModelLoad = (gltfScene: THREE.Group) => {
    console.log('🎯 Model loaded, adding to DSL engine...');
    setLoadedModel(gltfScene);

    // 清除现有模型
    const existingObject = engine.getObject('gltf_model');
    if (existingObject) {
      console.log('🗑️ Removing existing model from DSL');
      engine.removeObject('gltf_model');
    }

    // 添加新模型到DSL引擎
    const objectId = engine.addObject({
      id: 'gltf_model',
      name: selectedModel.replace('.glb', ''),
      type: 'group',
      geometry: {
        type: 'imported',
        data: gltfScene, // 直接传递Three.js对象
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      visible: true,
      castShadow: true,
      receiveShadow: true,
    });

    console.log(`✅ Model added to DSL with ID: ${objectId}`);
  };

  return (
    <>
      {/* DSL 初始化器 */}
      <DSLInitializer />

      {/* GLTF模型加载器 */}
      <GLTFModelLoader url={`./assets/glb/${selectedModel}`} onLoad={handleModelLoad} />

      {/* 环境光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* 相机控制 */}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

      {/* 网格辅助 */}
      <gridHelper args={[10, 10]} />

      {/* 这里不再直接渲染模型，完全由DSL渲染器接管 */}
    </>
  );
}

// 控制面板组件 - 确保DSL生效
function ControlPanel() {
  const { engine, selectedModel, setSelectedModel } = useDSL();
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-10));
    console.log(`📝 ${message}`);
  };

  // 实时更新变换（不需要点击按钮）
  useEffect(() => {
    const model = engine.getObject('gltf_model');
    if (model) {
      engine.updateObject('gltf_model', {
        transform: {
          position: { x: position.x, y: position.y, z: position.z },
          rotation: {
            x: (rotation.x * Math.PI) / 180,
            y: (rotation.y * Math.PI) / 180,
            z: (rotation.z * Math.PI) / 180,
          },
          scale: { x: scale.x, y: scale.y, z: scale.z },
        },
      });
    }
  }, [position, rotation, scale, engine]);

  const updateTransform = () => {
    const model = engine.getObject('gltf_model');
    if (model) {
      engine.updateObject('gltf_model', {
        transform: {
          position: { x: position.x, y: position.y, z: position.z },
          rotation: {
            x: (rotation.x * Math.PI) / 180,
            y: (rotation.y * Math.PI) / 180,
            z: (rotation.z * Math.PI) / 180,
          },
          scale: { x: scale.x, y: scale.y, z: scale.z },
        },
      });
      addLog(
        `Transform updated: Pos(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`,
      );
    } else {
      addLog('❌ No model found to update');
    }
  };

  const addLight = () => {
    try {
      engine.dispatch({
        type: ActionTypes.ADD_LIGHT,
        payload: {
          id: `light_${Date.now()}`,
          name: 'Additional Light',
          type: 'directional',
          color: '#ffffff',
          intensity: 0.8,
          position: { x: 5, y: 5, z: 5 },
          castShadow: true,
        },
      });
      addLog('✅ Added directional light via DSL');
    } catch (error) {
      addLog(`❌ Failed to add light: ${error}`);
    }
  };

  const loadModel = (filename: string) => {
    setSelectedModel(filename);
    addLog(`🔄 Loading model: ${filename}`);
  };

  const addMaterial = (color: string) => {
    try {
      const materialId = engine.addMaterial({
        name: `Material ${color}`,
        type: 'standard',
        color,
        metalness: 0.5,
        roughness: 0.5,
      });

      // 应用材质到当前模型
      const model = engine.getObject('gltf_model');
      if (model) {
        engine.applyMaterial(['gltf_model'], materialId);
        addLog(`✅ Applied ${color} material via DSL`);
      } else {
        addLog('❌ No model found to apply material');
      }
    } catch (error) {
      addLog(`❌ Failed to add material: ${error}`);
    }
  };

  const clearScene = () => {
    try {
      engine.dispatch({
        type: ActionTypes.RESET_SCENE,
        payload: null,
      });
      addLog('🧹 Scene cleared via DSL');
    } catch (error) {
      addLog(`❌ Failed to clear scene: ${error}`);
    }
  };

  const resetTransform = () => {
    setPosition({ x: 0, y: 0, z: 0 });
    setRotation({ x: 0, y: 0, z: 0 });
    setScale({ x: 1, y: 1, z: 1 });
    addLog('🔄 Transform reset to default');
  };

  const randomTransform = () => {
    const randomPos = () => (Math.random() - 0.5) * 4;
    const randomRot = () => Math.random() * 360;
    const randomScale = () => 0.5 + Math.random() * 1.5;

    setPosition({ x: randomPos(), y: randomPos(), z: randomPos() });
    setRotation({ x: randomRot(), y: randomRot(), z: randomRot() });
    setScale({ x: randomScale(), y: randomScale(), z: randomScale() });
    addLog('🎲 Applied random transform');
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1>🎨 DSL GLTF 演示</h1>
        <p>完全通过DSL引擎控制的3D场景</p>
      </div>

      {/* 模型选择区域 */}
      <div className="control-section">
        <div className="section-title">📂 模型选择</div>
        <div className="button-grid">
          {['ToyCar.glb', 'Duck.glb', 'Suzanne.glb', 'BoomBox.glb'].map((model) => (
            <button
              key={model}
              className={`btn ${selectedModel === model ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => loadModel(model)}
            >
              {model.replace('.glb', '')}
            </button>
          ))}
        </div>
      </div>

      {/* 变换控制区域 */}
      <div className="control-section">
        <div className="section-title">🎯 实时变换控制 (DSL)</div>

        {/* Position Controls */}
        <div className="control-group">
          <label className="control-label">位置 (Position)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="control-label">
                  {axis.toUpperCase()}: {position[axis].toFixed(1)}
                </label>
                <input
                  type="range"
                  className="range-input"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={position[axis]}
                  onChange={(e) => setPosition({ ...position, [axis]: parseFloat(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotation Controls */}
        <div className="control-group">
          <label className="control-label">旋转 (Rotation)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="control-label">
                  {axis.toUpperCase()}: {rotation[axis].toFixed(0)}°
                </label>
                <input
                  type="range"
                  className="range-input"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation[axis]}
                  onChange={(e) => setRotation({ ...rotation, [axis]: parseFloat(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scale Controls */}
        <div className="control-group">
          <label className="control-label">缩放 (Scale): {scale.x.toFixed(1)}</label>
          <input
            type="range"
            className="range-input"
            min="0.1"
            max="3"
            step="0.1"
            value={scale.x}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setScale({ x: value, y: value, z: value });
            }}
          />
        </div>

        <div className="button-grid">
          <button className="btn btn-warning" onClick={resetTransform}>
            🔄 重置
          </button>
          <button className="btn btn-secondary" onClick={randomTransform}>
            🎲 随机
          </button>
        </div>
      </div>

      {/* DSL功能测试区域 */}
      <div className="control-section">
        <div className="section-title">🧪 DSL功能测试</div>

        <div className="control-group">
          <label className="control-label">材质控制</label>
          <div className="button-grid">
            <button
              className="btn"
              style={{ backgroundColor: '#ff0000', color: 'white' }}
              onClick={() => addMaterial('#ff0000')}
            >
              红色
            </button>
            <button
              className="btn"
              style={{ backgroundColor: '#00ff00', color: 'black' }}
              onClick={() => addMaterial('#00ff00')}
            >
              绿色
            </button>
            <button
              className="btn"
              style={{ backgroundColor: '#0000ff', color: 'white' }}
              onClick={() => addMaterial('#0000ff')}
            >
              蓝色
            </button>
            <button
              className="btn"
              style={{ backgroundColor: '#ffff00', color: 'black' }}
              onClick={() => addMaterial('#ffff00')}
            >
              黄色
            </button>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">场景控制</label>
          <div className="button-grid">
            <button className="btn btn-secondary" onClick={addLight}>
              💡 添加光源
            </button>
            <button className="btn btn-warning" onClick={clearScene}>
              🗑️ 清空场景
            </button>
          </div>
        </div>
      </div>

      {/* 日志区域 */}
      <div className="logs-section">
        <div className="section-title">📝 DSL操作日志</div>
        <div className="logs-container">
          {logs.length === 0 ? (
            <div style={{ opacity: 0.6, fontStyle: 'italic' }}>等待DSL操作...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-item">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 统计面板 - 显示DSL状态
function StatsPanel() {
  const { engine } = useDSL();
  const [stats, setStats] = useState({
    objects: 0,
    materials: 0,
    lights: 0,
    dslActive: false,
  });

  useEffect(() => {
    if (!engine) return;

    const updateStats = () => {
      const scene = engine.getScene();
      setStats({
        objects: scene.objects.length,
        materials: scene.materials.length,
        lights: scene.lights.length,
        dslActive: true,
      });
    };

    // 初始更新
    updateStats();

    // 订阅场景变化
    const unsubscribe = engine.subscribe(updateStats);

    return unsubscribe;
  }, [engine]);

  return (
    <div className="top-stats-panel">
      <div className="stats-title">📊 DSL 引擎状态</div>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="label">DSL Active:</span>
          <span className="value" style={{ color: stats.dslActive ? '#00ff00' : '#ff0000' }}>
            {stats.dslActive ? '✅' : '❌'}
          </span>
        </div>
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
      </div>
    </div>
  );
}

// 主组件
export default function GLTFLoaderDemo() {
  const [error, setError] = useState<string | null>(null);

  return (
    <DSLProvider>
      <div className="gltf-demo-container">
        {error ? (
          <div className="error-container">
            <h2>❌ 错误</h2>
            <p>{error}</p>
            <button onClick={() => setError(null)}>重试</button>
          </div>
        ) : (
          <>
            {/* 左侧3D展示区 */}
            <div className="viewer-section">
              <Canvas
                camera={{ position: [5, 5, 5], fov: 60 }}
                shadows
                onError={(error) => setError(error.message)}
              >
                <Scene />
              </Canvas>
              <StatsPanel />
            </div>

            {/* 右侧控制面板 */}
            <ControlPanel />
          </>
        )}
      </div>
    </DSLProvider>
  );
}
