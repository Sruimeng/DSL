// Demo 工具函数
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { DSLRenderer, DSLScene } from '../../src/index.js';

// 获取操作的显示名称
function getActionDisplayName(actionType: string): string {
  const actionNames: Record<string, string> = {
    ADD_OBJECT: '添加对象',
    REMOVE_OBJECT: '删除对象',
    UPDATE_OBJECT: '修改对象',
    ADD_MATERIAL: '添加材质',
    APPLY_MATERIAL: '应用材质',
    ADD_LIGHT: '添加光源',
    UPDATE_LIGHT: '修改光源',
    CLEAR_SCENE: '清空场景',
    UPDATE_CAMERA: '调整相机',
  };
  return actionNames[actionType] || actionType;
}

// 更新历史记录显示
function updateHistoryDisplay(undoStack: any[], redoStack: any[]): void {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  historyList.innerHTML = '';

  // 显示撤销栈（最新的在上面）
  [...undoStack].reverse().forEach((action) => {
    const item = document.createElement('div');
    item.className = 'history-item active';
    item.innerHTML = `
      <span class="action-type">${getActionDisplayName(action.type)}</span>
      <span class="action-time">${action.timestamp}</span>
    `;
    historyList.appendChild(item);
  });

  // 显示重做栈
  redoStack.forEach((action) => {
    const item = document.createElement('div');
    item.className = 'history-item inactive';
    item.innerHTML = `
      <span class="action-type">${getActionDisplayName(action.type)}</span>
      <span class="action-time">${action.timestamp}</span>
    `;
    historyList.appendChild(item);
  });
}

// 渲染循环
export function animate(controls: OrbitControls): void {
  function loop(): void {
    requestAnimationFrame(loop);
    controls.update();
    // 渲染器会自动监听场景变化并渲染
  }
  loop();
}

// 窗口大小调整
export function setupResize(renderer: DSLRenderer): void {
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas && renderer) {
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
    }
  });
}

// 日志功能
export function log(message: string): void {
  const logs = document.getElementById('logs');
  if (logs) {
    const time = new Date().toLocaleTimeString();
    logs.innerHTML += `<div>[${time}] ${message}</div>`;
    logs.scrollTop = logs.scrollHeight;
  }
}

// 更新统计信息
export function updateStats(scene: DSLScene): void {
  const stats = document.getElementById('stats');
  if (stats) {
    stats.innerHTML = `
      <div class="stat-item">
        <span class="label">对象数量:</span>
        <span class="value">${scene.objects.length}</span>
      </div>
      <div class="stat-item">
        <span class="label">材质数量:</span>
        <span class="value">${scene.materials.length}</span>
      </div>
      <div class="stat-item">
        <span class="label">光源数量:</span>
        <span class="value">${scene.lights.length}</span>
      </div>
      <div class="stat-item">
        <span class="label">选中对象:</span>
        <span class="value">${scene.selection.length > 0 ? scene.selection.join(', ') : '无'}</span>
      </div>
      <div class="stat-item">
        <span class="label">场景版本:</span>
        <span class="value">${scene.metadata.version}</span>
      </div>
    `;
  }
}

// 更新 undo/redo 按钮状态
export function updateUndoRedoButtons(undoStack: any[], redoStack: any[]): void {
  const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
  const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

  if (undoBtn) {
    undoBtn.disabled = undoStack.length === 0;
    undoBtn.title = `撤销 (${undoStack.length} 个操作)`;
  }

  if (redoBtn) {
    redoBtn.disabled = redoStack.length === 0;
    redoBtn.title = `重做 (${redoStack.length} 个操作)`;
  }

  // 更新历史记录显示
  updateHistoryDisplay(undoStack, redoStack);
}
