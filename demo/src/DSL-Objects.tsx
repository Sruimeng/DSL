// DSL Objects Demo - 基础几何体演示
import { createRoot } from 'react-dom/client';
import { TripoCanvas, TripoProvider, useTripo, useTripoScene } from '../../src';

// 控制面板组件
function ControlPanel() {
  const scene = useTripoScene();
  const { selection, history } = useTripo();

  const addCube = () => {
    scene.addMesh({
      name: '立方体',
      geometry: { type: 'box', size: [1, 1, 1] },
      material: { color: '#ff0000', metalness: 0.1, roughness: 0.1 },
      position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2],
    });
  };

  const addSphere = () => {
    scene.addMesh({
      name: '球体',
      geometry: { type: 'sphere', size: 0.8 },
      material: { color: '#00ff00', metalness: 0.2, roughness: 0.2 },
      position: [Math.random() * 4 - 2, 0.8, Math.random() * 4 - 2],
    });
  };

  const addCylinder = () => {
    scene.addMesh({
      name: '圆柱体',
      geometry: { type: 'cylinder', radius: 0.5, height: 1.5, radialSegments: 16 },
      material: { color: '#0000ff', metalness: 0.3, roughness: 0.3 },
      position: [Math.random() * 4 - 2, 0.75, Math.random() * 4 - 2],
    });
  };

  const addWireframeCube = () => {
    scene.addWireframe({
      name: '线框立方体',
      geometry: { type: 'box', size: [1.2, 1.2, 1.2] },
      color: '#000000',
      position: [Math.random() * 4 - 2, 0.6, Math.random() * 4 - 2],
    });
  };

  const changeSelectedColor = (color: string) => {
    selection.selected.forEach((id) => {
      scene.update(id, {
        material: { color },
      });
    });
  };

  const clearScene = () => {
    scene.objects.forEach((obj) => {
      scene.remove(obj.id);
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '8px',
        minWidth: '250px',
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: '0 0 16px 0' }}>DSL Objects Demo</h3>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>添加几何体</h4>
        <button onClick={addCube} style={{ margin: '4px', padding: '8px 12px' }}>
          添加立方体
        </button>
        <button onClick={addSphere} style={{ margin: '4px', padding: '8px 12px' }}>
          添加球体
        </button>
        <button onClick={addCylinder} style={{ margin: '4px', padding: '8px 12px' }}>
          添加圆柱体
        </button>
        <button onClick={addWireframeCube} style={{ margin: '4px', padding: '8px 12px' }}>
          添加线框
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>材质操作</h4>
        <button
          onClick={() => changeSelectedColor('#ff0000')}
          style={{ margin: '4px', padding: '8px 12px', backgroundColor: '#ff0000', color: 'white' }}
        >
          红色
        </button>
        <button
          onClick={() => changeSelectedColor('#00ff00')}
          style={{ margin: '4px', padding: '8px 12px', backgroundColor: '#00ff00', color: 'white' }}
        >
          绿色
        </button>
        <button
          onClick={() => changeSelectedColor('#0000ff')}
          style={{ margin: '4px', padding: '8px 12px', backgroundColor: '#0000ff', color: 'white' }}
        >
          蓝色
        </button>
        <button
          onClick={() => changeSelectedColor('#ffd700')}
          style={{ margin: '4px', padding: '8px 12px', backgroundColor: '#ffd700', color: 'black' }}
        >
          金色
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>场景操作</h4>
        <button
          onClick={history.undo}
          disabled={!history.canUndo}
          style={{ margin: '4px', padding: '8px 12px' }}
        >
          撤销
        </button>
        <button
          onClick={history.redo}
          disabled={!history.canRedo}
          style={{ margin: '4px', padding: '8px 12px' }}
        >
          重做
        </button>
        <button onClick={clearScene} style={{ margin: '4px', padding: '8px 12px' }}>
          清空场景
        </button>
      </div>

      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>对象数量: {scene.objects.length}</p>
        <p>选中对象: {selection.selected.length}</p>
        {selection.selected.length > 0 && <p>点击颜色按钮修改选中对象的材质</p>}
      </div>
    </div>
  );
}

// 主应用组件
function App() {
  return (
    <TripoProvider>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <TripoCanvas
          showStats={true}
          showGrid={true}
          showEnvironment={true}
          environmentPreset="studio"
        />
        <ControlPanel />
      </div>
    </TripoProvider>
  );
}

// 渲染应用
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('找不到app容器元素');
}
