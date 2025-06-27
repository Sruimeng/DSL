// Demo 主入口文件
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [currentDemo, setCurrentDemo] = React.useState('objects');

  return (
    <div className="demo-app">
      <nav className="demo-nav">
        <h1>TripoScript 2.1 Demo</h1>
        <div className="nav-buttons">
          <button
            className={currentDemo === 'objects' ? 'active' : ''}
            onClick={() => setCurrentDemo('objects')}
          >
            基础几何体
          </button>
          <button
            className={currentDemo === 'generate' ? 'active' : ''}
            onClick={() => setCurrentDemo('generate')}
          >
            模型生成
          </button>
          <button
            className={currentDemo === 'texture' ? 'active' : ''}
            onClick={() => setCurrentDemo('texture')}
          >
            材质编辑
          </button>
        </div>
      </nav>

      <main className="demo-content">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>当前选择: {currentDemo}</h2>
          <p>版本降级成功！现在可以正常运行了。</p>
        </div>
      </main>
    </div>
  );
}

// 挂载应用
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
