import type { OrbitControls } from 'three/examples/jsm/Addons.js';
import type { DSLRenderer, DSLScene } from '../../src';

// 渲染循环
export function animate(controls: OrbitControls): void {
  requestAnimationFrame(() => animate(controls));
  controls.update();
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
        对象数量: ${scene.objects.length}<br>
        材质数量: ${scene.materials.length}<br>
        光源数量: ${scene.lights.length}<br>
        选中对象: ${scene.selection.length > 0 ? scene.selection.join(', ') : '无'}<br>
        场景版本: ${scene.metadata.version}
      `;
  }
}
