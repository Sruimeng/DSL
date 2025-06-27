// DSL Texture Demo - 材质编辑演示
import { createRoot } from 'react-dom/client';
import { TripoCanvas, TripoProvider, useTexture } from '../../src';

// 材质编辑面板组件
function TexturePanel() {
  const { texture, scene, selection, history } = useTexture();

  // 添加一些基础几何体用于材质测试
  const addTestObjects = () => {
    scene.add({
      name: '测试立方体',
      type: 'mesh',
      geometry: { type: 'box', size: [1, 1, 1] },
      material: { color: '#ffffff' },
      transform: { position: [-2, 0.5, 0] },
    });

    scene.add({
      name: '测试球体',
      type: 'mesh',
      geometry: { type: 'sphere', size: 0.8 },
      material: { color: '#ffffff' },
      transform: { position: [0, 0.8, 0] },
    });

    scene.add({
      name: '测试圆柱体',
      type: 'mesh',
      geometry: { type: 'cylinder', radius: 0.5, height: 1.5 },
      material: { color: '#ffffff' },
      transform: { position: [2, 0.75, 0] },
    });
  };

  const MaterialSlider = ({
    label,
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0.01,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '4px',
          color: '#555',
        }}
      >
        {label}: {value.toFixed(2)}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: '#e1e5e9',
          outline: 'none',
          appearance: 'none',
        }}
      />
    </div>
  );

  const ColorPicker = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '4px',
          color: '#555',
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '40px',
            height: '30px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '12px',
        minWidth: '280px',
        maxWidth: '320px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Texture Workspace</h3>

      {/* 测试对象 */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>测试对象</h4>
        <button
          onClick={addTestObjects}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          添加测试几何体
        </button>
      </div>

      {/* 材质预设 */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>材质预设</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {texture.presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => texture.loadPreset(index.toString())}
              style={{
                padding: '8px',
                fontSize: '11px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: preset.color || '#ffffff',
                color: preset.color === '#000000' ? 'white' : 'black',
              }}
            >
              {preset.type === 'wireframe' ? '线框' : '材质' + (index + 1)}
            </button>
          ))}
        </div>
      </div>

      {/* 材质编辑器 */}
      {texture.preview && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#555' }}>材质编辑器</h4>

          <ColorPicker
            label="基础颜色"
            value={texture.preview.color || '#ffffff'}
            onChange={(color) =>
              texture.setPreview({
                ...texture.preview!,
                color,
              })
            }
          />

          {texture.preview.type !== 'wireframe' && (
            <>
              <MaterialSlider
                label="金属度"
                value={texture.preview.metalness || 0}
                onChange={(metalness) =>
                  texture.setPreview({
                    ...texture.preview!,
                    metalness,
                  })
                }
              />

              <MaterialSlider
                label="粗糙度"
                value={texture.preview.roughness || 0.5}
                onChange={(roughness) =>
                  texture.setPreview({
                    ...texture.preview!,
                    roughness,
                  })
                }
              />

              <MaterialSlider
                label="透明度"
                value={texture.preview.opacity || 1}
                onChange={(opacity) =>
                  texture.setPreview({
                    ...texture.preview!,
                    opacity,
                    transparent: opacity < 1,
                  })
                }
              />

              <ColorPicker
                label="发光颜色"
                value={texture.preview.emissive || '#000000'}
                onChange={(emissive) =>
                  texture.setPreview({
                    ...texture.preview!,
                    emissive,
                  })
                }
              />

              <MaterialSlider
                label="发光强度"
                value={texture.preview.emissiveIntensity || 0}
                max={2}
                onChange={(emissiveIntensity) =>
                  texture.setPreview({
                    ...texture.preview!,
                    emissiveIntensity,
                  })
                }
              />
            </>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={texture.applyToSelected}
              disabled={selection.selected.length === 0}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: selection.selected.length > 0 ? '#007acc' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selection.selected.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              应用到选中对象 ({selection.selected.length})
            </button>
          </div>
        </div>
      )}

      {/* 场景操作 */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>场景操作</h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={history.undo}
            disabled={!history.canUndo}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: history.canUndo ? 'pointer' : 'not-allowed',
              backgroundColor: history.canUndo ? 'white' : '#f5f5f5',
            }}
          >
            撤销
          </button>
          <button
            onClick={history.redo}
            disabled={!history.canRedo}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: history.canRedo ? 'pointer' : 'not-allowed',
              backgroundColor: history.canRedo ? 'white' : '#f5f5f5',
            }}
          >
            重做
          </button>
          <button
            onClick={() => scene.objects.forEach((obj) => scene.remove(obj.id))}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#dc3545',
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* 状态信息 */}
      <div
        style={{
          fontSize: '12px',
          color: '#666',
          background: '#f8f9fa',
          padding: '10px',
          borderRadius: '6px',
        }}
      >
        <p style={{ margin: '0 0 4px 0' }}>场景对象: {scene.objects.length}</p>
        <p style={{ margin: '0 0 4px 0' }}>选中对象: {selection.selected.length}</p>
        <p style={{ margin: '0', fontSize: '11px', fontStyle: 'italic' }}>
          选择对象后调整材质参数并应用
        </p>
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
        <TexturePanel />
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
