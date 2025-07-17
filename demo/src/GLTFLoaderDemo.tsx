import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { DSLEngine } from '../../src/DSL/engine';
import { DSLRenderer } from '../../src/DSL/r3fRenderer';
import { ActionTypes } from '../../src/DSL/types';

// DSL React Hook - 修正版
function useDSLRenderer() {
  const r3fContext = useThree();
  const [engine] = useState(() => new DSLEngine());
  const rendererRef = useRef<DSLRenderer>();

  useEffect(() => {
    // 只在第一次创建时初始化
    if (!rendererRef.current) {
      rendererRef.current = new DSLRenderer(r3fContext, engine);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []); // 空依赖数组，只运行一次

  return { engine, renderer: rendererRef.current };
}

// GLTF模型组件 - 修正版
function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { engine } = useDSLRenderer();

  useEffect(() => {
    if (scene && engine) {
      // 使用正确的 DSL API
      engine.addObject({
        id: 'gltf_model',
        name: 'GLTF Model',
        type: 'group',
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        visible: true,
        castShadow: false,
        receiveShadow: false,
      });
    }
  }, [scene, engine]);

  return <primitive object={scene} />;
}

// DSL控制面板 - 修正版
function DSLControls() {
  const { engine } = useDSLRenderer();
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [position, setPosition] = useState([0, 0, 0]);
  const [scale, setScale] = useState([1, 1, 1]);

  const updateTransform = () => {
    engine.updateObject('gltf_model', {
      transform: {
        position: { x: position[0], y: position[1], z: position[2] },
        rotation: {
          x: (rotation[0] * Math.PI) / 180,
          y: (rotation[1] * Math.PI) / 180,
          z: (rotation[2] * Math.PI) / 180,
        },
        scale: { x: scale[0], y: scale[1], z: scale[2] },
      },
    });
  };

  const addLight = () => {
    engine.dispatch({
      type: ActionTypes.ADD_LIGHT,
      payload: {
        id: 'directional_light',
        name: 'Directional Light',
        type: 'directional',
        color: '#ffffff',
        intensity: 1,
        position: { x: 5, y: 5, z: 5 },
        castShadow: true,
      },
    });
  };

  const changeMaterial = (color: string) => {
    const materialId = engine.addMaterial({
      name: `Material ${color}`,
      type: 'standard',
      color,
      metalness: 0.5,
      roughness: 0.5,
    });

    // 应用材质到模型
    engine.applyMaterial(['gltf_model'], materialId);
  };

  return (
    <Html position={[-5, 2, 0]} style={{ width: '300px' }}>
      <div
        style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '14px',
        }}
      >
        <h3>DSL Controls</h3>

        {/* Rotation Controls */}
        <div style={{ marginBottom: '15px' }}>
          <h4>Rotation (degrees):</h4>
          <div style={{ marginBottom: '8px' }}>
            <label>X: </label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation[0]}
              onChange={(e) => setRotation([+e.target.value, rotation[1], rotation[2]])}
              style={{ width: '180px' }}
            />
            <span style={{ marginLeft: '8px' }}>{rotation[0]}°</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Y: </label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation[1]}
              onChange={(e) => setRotation([rotation[0], +e.target.value, rotation[2]])}
              style={{ width: '180px' }}
            />
            <span style={{ marginLeft: '8px' }}>{rotation[1]}°</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Z: </label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation[2]}
              onChange={(e) => setRotation([rotation[0], rotation[1], +e.target.value])}
              style={{ width: '180px' }}
            />
            <span style={{ marginLeft: '8px' }}>{rotation[2]}°</span>
          </div>
        </div>

        {/* Position Controls */}
        <div style={{ marginBottom: '15px' }}>
          <h4>Position:</h4>
          <div style={{ marginBottom: '8px' }}>
            <label>X: </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={position[0]}
              onChange={(e) => setPosition([+e.target.value, position[1], position[2]])}
              style={{ width: '180px' }}
            />
            <span style={{ marginLeft: '8px' }}>{position[0].toFixed(1)}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Y: </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={position[1]}
              onChange={(e) => setPosition([position[0], +e.target.value, position[2]])}
              style={{ width: '180px' }}
            />
            <span style={{ marginLeft: '8px' }}>{position[1].toFixed(1)}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Z: </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={position[2]}
              onChange={(e) => setPosition([position[0], position[1], +e.target.value])}
              style={{ width: '180px' }}
            />
            <span style={{ marginLeft: '8px' }}>{position[2].toFixed(1)}</span>
          </div>
        </div>

        {/* Scale Controls */}
        <div style={{ marginBottom: '15px' }}>
          <h4>Scale:</h4>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={scale[0]}
            onChange={(e) => setScale([+e.target.value, +e.target.value, +e.target.value])}
            style={{ width: '180px' }}
          />
          <span style={{ marginLeft: '8px' }}>{scale[0].toFixed(1)}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={updateTransform}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Update Transform
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={addLight}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Directional Light
          </button>
        </div>

        {/* Material Buttons */}
        <div>
          <h4>Materials:</h4>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <button
              onClick={() => changeMaterial('#ff0000')}
              style={{
                flex: '1',
                padding: '8px',
                backgroundColor: '#ff0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Red
            </button>
            <button
              onClick={() => changeMaterial('#00ff00')}
              style={{
                flex: '1',
                padding: '8px',
                backgroundColor: '#00ff00',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Green
            </button>
            <button
              onClick={() => changeMaterial('#0000ff')}
              style={{
                flex: '1',
                padding: '8px',
                backgroundColor: '#0000ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Blue
            </button>
          </div>
        </div>
      </div>
    </Html>
  );
}

// 主场景组件
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

      {/* GLTF模型 */}
      <GLTFModel url="./assets/glb/ToyCar.glb" />

      {/* DSL控制面板 */}
      <DSLControls />

      {/* 网格辅助 */}
      <gridHelper args={[10, 10]} />
    </>
  );
}

// 主组件
export default function GLTFLoaderDemo() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {error ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'red',
            background: 'rgba(0,0,0,0.8)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      ) : (
        <Canvas camera={{ position: [5, 5, 5], fov: 60 }} onError={setError}>
          <Scene />
        </Canvas>
      )}

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '300px',
        }}
      >
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>DSL GLTF Loader Demo</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>使用React Three Fiber和DSL引擎加载GLTF模型</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
          使用鼠标控制视角，左侧面板控制模型
        </p>
      </div>
    </div>
  );
}
