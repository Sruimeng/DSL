// 统计面板UI组件
import type { DSLEngine } from '../../../src/engine/engine';

export class StatsPanelUI {
  private engine: DSLEngine;
  private container: HTMLElement;

  constructor(engine: DSLEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.setupEventListeners();
    this.render();
  }

  // 渲染统计面板
  render(): void {
    const scene = this.engine.getScene();
    const historyStats = this.engine.getHistoryStats();

    const meshCount = scene.objects.filter((obj) => obj.type === 'mesh').length;
    const groupCount = scene.objects.filter((obj) => obj.type === 'group').length;
    const lightCount = scene.lights.length;
    const materialCount = scene.materials.length;
    const selectedCount = scene.selection.length;

    this.container.innerHTML = `
      <div class="stats-title">📊 节点树统计</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="label">总节点数:</span>
          <span class="value">${scene.objects.length}</span>
        </div>
        <div class="stat-item">
          <span class="label">网格节点:</span>
          <span class="value">${meshCount}</span>
        </div>
        <div class="stat-item">
          <span class="label">组节点:</span>
          <span class="value">${groupCount}</span>
        </div>
        <div class="stat-item">
          <span class="label">光源数量:</span>
          <span class="value">${lightCount}</span>
        </div>
        <div class="stat-item">
          <span class="label">材质数量:</span>
          <span class="value">${materialCount}</span>
        </div>
        <div class="stat-item">
          <span class="label">选中节点:</span>
          <span class="value">${selectedCount}</span>
        </div>
        <div class="stat-item">
          <span class="label">历史记录:</span>
          <span class="value">${historyStats.totalActions}/${historyStats.maxSize}</span>
        </div>
        <div class="stat-item">
          <span class="label">内存占用:</span>
          <span class="value">${historyStats.memoryUsageKB.toFixed(2)} KB</span>
        </div>
      </div>
    `;
  }

  // 格式化字节数
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 设置事件监听
  private setupEventListeners(): void {
    // 监听DSL状态变化，自动更新统计
    this.engine.subscribe(() => {
      this.render();
    });
  }
}
