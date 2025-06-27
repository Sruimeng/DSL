// DSL架构使用示例 - 展示框架无关的设计
import React, { useMemo, useState } from 'react';
import { TripoEngine, type TripoScene } from '../../src/engine/core';
import { TripoRenderer } from '../../src/engine/renderer';

// 纯JS使用示例
function createDSLExample() {
  // 1. 创建DSL引擎 - 框架无关
  const engine = new TripoEngine();

  // 2. 添加对象 - 通过Action系统
  engine.dispatch({
    type: 'ADD_OBJECT',
    payload: {
      name: '红色立方体',
      type: 'mesh',
      geometry: {
        type: 'box',
        params: { width: 1, height: 1, depth: 1 },
      },
      transform: {
        position: [-2, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    },
  });

  engine.dispatch({
    type: 'ADD_OBJECT',
    payload: {
      name: '蓝色球体',
      type: 'mesh',
      geometry: {
        type: 'sphere',
        params: { radius: 1 },
      },
      transform: {
        position: [2, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    },
  });

  // 3. 创建材质
  engine.dispatch({
    type: 'ADD_MATERIAL',
    payload: {
      name: '红色材质',
      type: 'standard',
      color: '#ff0000',
      metalness: 0.1,
      roughness: 0.3,
    },
  });

  engine.dispatch({
    type: 'ADD_MATERIAL',
    payload: {
      name: '蓝色材质',
      type: 'standard',
      color: '#0066ff',
      metalness: 0.5,
      roughness: 0.2,
    },
  });

  return engine;
}

// React Hook - 简化版本，避免语法错误
function useSimpleTripo(engine: TripoEngine) {
  const [scene, setScene] = React.useState<TripoScene | null>(null);

  React.useEffect(() => {
    const unsubscribe = engine.subscribe(setScene);
    setScene(engine.getScene());
    return unsubscribe;
  }, [engine]);

  return {
    scene,
    engine,
    addCube: () =>
      engine.addObject({
        name: '立方体',
        type: 'mesh',
        geometry: { type: 'box', params: { width: 1, height: 1, depth: 1 } },
        materialId: 'default',
      }),
    addSphere: () =>
      engine.addObject({
        name: '球体',
        type: 'mesh',
        geometry: { type: 'sphere', params: { radius: 1 } },
        materialId: 'default',
      }),
    selectObject: (id: string) => engine.selectObjects([id]),
    removeSelected: () => {
      if (scene) {
        scene.selection.forEach((id) => engine.removeObject(id));
      }
    },
    undo: () => engine.undo(),
    redo: () => engine.redo(),
  };
}

// React组件 - 简化Canvas
function SimpleCanvas({
  engine,
  width = 800,
  height = 600,
}: {
  engine: TripoEngine;
  width?: number;
  height?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rendererRef = React.useRef<TripoRenderer | null>(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new TripoRenderer(canvasRef.current, engine);
    }

    return () => {
      rendererRef.current?.dispose();
    };
  }, [engine]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '1px solid #ccc',
        display: 'block',
      }}
    />
  );
}

// 完整的React应用示例
export default function DSLExample() {
  // 创建引擎实例
  const engine = useMemo(() => createDSLExample(), []);
  const { scene, addCube, addSphere, selectObject, removeSelected, undo, redo } =
    useSimpleTripo(engine);

  const [selectedId, setSelectedId] = useState<string>('');

  return (
    <div style={{ padding: '20px' }}>
      <h1>TripoScript 2.1 - 框架无关DSL架构示例</h1>

      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <button onClick={addCube}>添加立方体</button>
        <button onClick={addSphere}>添加球体</button>
        <button onClick={removeSelected} disabled={!scene || scene.selection.length === 0}>
          删除选中
        </button>
        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 10px' }} />
        <button onClick={undo}>撤销</button>
        <button onClick={redo}>重做</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 3D视图 */}
        <div>
          <h3>3D场景</h3>
          <SimpleCanvas engine={engine} />
        </div>

        {/* 侧边栏 */}
        <div style={{ width: '300px' }}>
          {/* 对象列表 */}
          <div style={{ marginBottom: '20px' }}>
            <h3>场景对象</h3>
            {scene && (
              <div
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                {Object.values(scene.objects).map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => {
                      selectObject(obj.id);
                      setSelectedId(obj.id);
                    }}
                    style={{
                      padding: '8px',
                      cursor: 'pointer',
                      backgroundColor: scene.selection.includes(obj.id) ? '#e3f2fd' : 'transparent',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{obj.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {obj.type} | {obj.visible ? '可见' : '隐藏'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 属性编辑器 */}
          {selectedId && scene && scene.objects[selectedId] && (
            <div>
              <h3>属性编辑器</h3>
              <ObjectProperties object={scene.objects[selectedId]} engine={engine} />
            </div>
          )}

          {/* 场景信息 */}
          {scene && (
            <div style={{ marginTop: '20px' }}>
              <h3>场景信息</h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>对象数量: {Object.keys(scene.objects).length}</div>
                <div>材质数量: {Object.keys(scene.materials).length}</div>
                <div>选中对象: {scene.selection.length}</div>
                <div>场景名称: {scene.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 代码示例 */}
      <div style={{ marginTop: '40px' }}>
        <h3>代码示例</h3>
        <CodeExample />
      </div>
    </div>
  );
}

// 对象属性编辑器
function ObjectProperties({ object, engine }: { object: any; engine: TripoEngine }) {
  const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = [...object.transform.position];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] = value;

    engine.updateObject(object.id, {
      transform: {
        ...object.transform,
        position: newPosition as [number, number, number],
      },
    });
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <strong>{object.name}</strong>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>位置 X:</label>
        <input
          type="number"
          step="0.1"
          value={object.transform.position[0]}
          onChange={(e) => updatePosition('x', parseFloat(e.target.value) || 0)}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>位置 Y:</label>
        <input
          type="number"
          step="0.1"
          value={object.transform.position[1]}
          onChange={(e) => updatePosition('y', parseFloat(e.target.value) || 0)}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>位置 Z:</label>
        <input
          type="number"
          step="0.1"
          value={object.transform.position[2]}
          onChange={(e) => updatePosition('z', parseFloat(e.target.value) || 0)}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={object.visible}
            onChange={(e) => {
              engine.updateObject(object.id, {
                visible: e.target.checked,
              });
            }}
          />
          可见
        </label>
      </div>
    </div>
  );
}

// 代码示例展示
function CodeExample() {
  return (
    <div
      style={{
        backgroundColor: '#f8f8f8',
        padding: '20px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace',
      }}
    >
      <h4>框架无关的使用方式:</h4>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {`// 1. 创建DSL引擎（纯JS，框架无关）
const engine = new TripoEngine();

// 2. 通过Action修改场景
engine.dispatch({
  type: 'ADD_OBJECT',
  payload: {
    name: '立方体',
    type: 'mesh',
    geometry: { type: 'box', params: { width: 1, height: 1, depth: 1 } }
  }
});

// 3. 创建渲染器（自动监听状态变化）
const renderer = new TripoRenderer(canvas, engine);

// 4. 监听场景变化
engine.subscribe((scene) => {
  console.log('场景已更新:', scene);
  updateUI(scene);
});

// 便捷方法
const cubeId = engine.addObject({
  name: '我的立方体',
  type: 'mesh',
  geometry: { type: 'box', params: { width: 2, height: 2, depth: 2 } }
});

engine.selectObjects([cubeId]);
engine.updateObject(cubeId, { 
  transform: { position: [1, 0, 0] }
});`}
      </pre>

      <h4 style={{ marginTop: '20px' }}>React框架适配:</h4>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {`// React Hook封装
function useTripo(engine) {
  const [scene, setScene] = useState(null);
  
  useEffect(() => {
    const unsubscribe = engine.subscribe(setScene);
    setScene(engine.getScene());
    return unsubscribe;
  }, [engine]);

  return {
    scene,
    addObject: (obj) => engine.addObject(obj),
    updateObject: (id, changes) => engine.updateObject(id, changes),
    // ... 其他便捷方法
  };
}

// React组件使用
function App() {
  const engine = useMemo(() => new TripoEngine(), []);
  const { scene, addObject } = useTripo(engine);
  
  return (
    <div>
      <button onClick={() => addObject({ name: 'Cube', type: 'mesh' })}>
        添加立方体
      </button>
      <TripoCanvas engine={engine} />
    </div>
  );
}`}
      </pre>
    </div>
  );
}
