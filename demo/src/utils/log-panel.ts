// 日志面板UI组件
import type { DSLEngine } from '../../../src/engine/engine';

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export class LogPanelUI {
  private engine: DSLEngine;
  private container: HTMLElement;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  constructor(engine: DSLEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.setupEventListeners();
    this.log('日志系统初始化完成', 'success');
  }

  // 添加日志条目
  log(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      message,
      type,
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.render();
  }

  // 渲染日志面板
  private render(): void {
    const logEntries = this.logs
      .slice(-20) // 只显示最近20条
      .map((entry) => {
        const timeStr = entry.timestamp.toLocaleTimeString();
        const icon = this.getLogIcon(entry.type);
        const className = `log-entry log-${entry.type}`;

        return `<div class="${className}">${icon} [${timeStr}] ${entry.message}</div>`;
      })
      .join('');

    this.container.innerHTML = logEntries;

    // 自动滚动到底部
    this.container.scrollTop = this.container.scrollHeight;
  }

  // 获取日志图标
  private getLogIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  }

  // 清空日志
  clear(): void {
    this.logs = [];
    this.render();
    this.log('日志已清空', 'info');
  }

  // 获取操作的显示名称
  private getActionDisplayName(actionType: string): string {
    const actionNames: Record<string, string> = {
      ADD_OBJECT: '添加对象',
      UPDATE_OBJECT: '更新对象',
      REMOVE_OBJECT: '删除对象',
      DUPLICATE_OBJECT: '复制对象',
      MOVE_OBJECT: '移动对象',
      SELECT: '选择对象',
      CLEAR_SELECTION: '清除选择',
      ADD_MATERIAL: '添加材质',
      UPDATE_MATERIAL: '更新材质',
      APPLY_MATERIAL: '应用材质',
      ADD_LIGHT: '添加光源',
      UPDATE_LIGHT: '更新光源',
      REMOVE_LIGHT: '删除光源',
      UPDATE_CAMERA: '更新相机',
      UPDATE_ENVIRONMENT: '更新环境',
      RESET_SCENE: '重置场景',
      LOAD_SCENE: '加载场景',
    };
    return actionNames[actionType] || actionType;
  }

  // 设置事件监听
  private setupEventListeners(): void {
    // 监听DSL引擎的Action执行
    this.engine.subscribe(() => {
      // 这里可以根据场景变化推断操作类型
      // 由于DSL引擎没有直接暴露Action事件，我们通过场景变化来记录
      const historyStats = this.engine.getHistoryStats();
      if (historyStats.recentActions.length > 0) {
        const lastAction = historyStats.recentActions[historyStats.recentActions.length - 1];
        if (lastAction) {
          const actionName = this.getActionDisplayName(lastAction.type);
          this.log(`执行操作: ${actionName}`, 'info');
        }
      }
    });
  }
}
