// DSL Generate Demo - 模型生成演示
import { createRoot } from 'react-dom/client';
import { TripoCanvas, TripoProvider, useGenerate } from '../../src';

// 生成控制面板组件
function GeneratePanel() {
  const { generate, scene, selection, history } = useGenerate();

  const handleGenerate = async () => {
    await generate.start();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '12px',
        minWidth: '300px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Generate Workspace</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>模型生成</h4>
        <input
          type="text"
          value={generate.prompt}
          onChange={(e) => generate.setPrompt(e.target.value)}
          placeholder="输入生成提示词..."
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '12px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#007acc')}
          onBlur={(e) => (e.target.style.borderColor = '#e1e5e9')}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleGenerate}
            disabled={generate.isGenerating || !generate.prompt.trim()}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: generate.isGenerating ? '#ccc' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: generate.isGenerating ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {generate.isGenerating ? `生成中... ${generate.progress}%` : '开始生成'}
          </button>

          {generate.isGenerating && (
            <button
              onClick={generate.cancel}
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          )}
        </div>

        {generate.isGenerating && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#e1e5e9',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${generate.progress}%`,
                  height: '100%',
                  backgroundColor: '#007acc',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>快速预设</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => generate.setPrompt('一个现代风格的椅子')}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            现代椅子
          </button>
          <button
            onClick={() => generate.setPrompt('一个科幻风格的机器人')}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            科幻机器人
          </button>
          <button
            onClick={() => generate.setPrompt('一个古典风格的花瓶')}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            古典花瓶
          </button>
          <button
            onClick={() => generate.setPrompt('一个卡通风格的汽车')}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            卡通汽车
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>场景操作</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={history.undo}
            disabled={!history.canUndo}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
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
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: history.canRedo ? 'pointer' : 'not-allowed',
              backgroundColor: history.canRedo ? 'white' : '#f5f5f5',
            }}
          >
            重做
          </button>
          <button
            onClick={() => scene.objects.forEach((obj) => scene.remove(obj.id))}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #dc3545',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#dc3545',
            }}
          >
            清空场景
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: '13px',
          color: '#666',
          background: '#f8f9fa',
          padding: '12px',
          borderRadius: '8px',
        }}
      >
        <p style={{ margin: '0 0 4px 0' }}>场景对象: {scene.objects.length}</p>
        <p style={{ margin: '0 0 4px 0' }}>选中对象: {selection.selected.length}</p>
        <p style={{ margin: '0', fontSize: '11px', fontStyle: 'italic' }}>
          输入描述文字，点击生成按钮创建3D模型
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
        <GeneratePanel />
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
