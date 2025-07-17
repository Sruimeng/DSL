import React from 'react';
import ReactDOM from 'react-dom/client';
import GLTFLoaderDemo from './GLTFLoaderDemo';

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            background: 'rgba(255,0,0,0.8)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <h2>应用程序错误</h2>
          <p>抱歉，发生了意外错误。</p>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: 'red',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            重新加载页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 渲染应用
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GLTFLoaderDemo />
    </ErrorBoundary>
  </React.StrictMode>,
);
