import type { DSLEngine } from '../engine/engine';
import type { DSLAPI } from '../types/core';

// 插件接口定义
export interface DSLPlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly dependencies?: string[];
  readonly category?: 'geometry' | 'material' | 'lighting' | 'animation' | 'utility' | 'workflow';

  // 生命周期钩子
  onInstall?(api: DSLAPI): Promise<void> | void;
  onActivate?(api: DSLAPI): Promise<void> | void;
  onDeactivate?(api: DSLAPI): Promise<void> | void;
  onUninstall?(api: DSLAPI): Promise<void> | void;

  // 扩展点
  commands?: PluginCommand[];
  menuItems?: PluginMenuItem[];
  toolbarButtons?: PluginToolbarButton[];
  panels?: PluginPanel[];
  shortcuts?: PluginShortcut[];
}

// 插件命令
export interface PluginCommand {
  id: string;
  name: string;
  description?: string;
  category?: string;
  execute: (api: DSLAPI, ...args: any[]) => Promise<any> | any;
  canExecute?: (api: DSLAPI) => boolean;
}

// 插件菜单项
export interface PluginMenuItem {
  id: string;
  label: string;
  command: string;
  group?: string;
  icon?: string;
  shortcut?: string;
  when?: string; // 条件表达式
}

// 插件工具栏按钮
export interface PluginToolbarButton {
  id: string;
  label: string;
  icon: string;
  command: string;
  tooltip?: string;
  group?: string;
}

// 插件面板
export interface PluginPanel {
  id: string;
  title: string;
  component: any; // React组件或其他UI框架组件
  defaultVisible?: boolean;
  position?: 'left' | 'right' | 'bottom' | 'floating';
}

// 插件快捷键
export interface PluginShortcut {
  key: string;
  command: string;
  when?: string;
}

// 插件状态
export type PluginStatus = 'installed' | 'active' | 'inactive' | 'error';

// 插件信息
export interface PluginInfo {
  plugin: DSLPlugin;
  status: PluginStatus;
  error?: Error;
  installTime: number;
  activateTime?: number;
}

// 插件事件
export interface PluginEvent {
  type: 'installed' | 'activated' | 'deactivated' | 'uninstalled' | 'error';
  plugin: string;
  data?: any;
  timestamp: number;
}

// 插件管理器
export class PluginManager {
  private plugins = new Map<string, PluginInfo>();
  private commands = new Map<string, PluginCommand>();
  private eventListeners = new Set<(event: PluginEvent) => void>();

  constructor(
    private api: DSLAPI,
    private engine: DSLEngine,
  ) {}

  // 安装插件
  async install(plugin: DSLPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已安装`);
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`缺少依赖插件: ${dep}`);
        }
      }
    }

    try {
      // 执行安装钩子
      if (plugin.onInstall) {
        await plugin.onInstall(this.api);
      }

      // 注册插件
      const info: PluginInfo = {
        plugin,
        status: 'installed',
        installTime: Date.now(),
      };

      this.plugins.set(plugin.name, info);

      // 注册命令
      if (plugin.commands) {
        for (const command of plugin.commands) {
          this.commands.set(command.id, command);
        }
      }

      this.emitEvent({
        type: 'installed',
        plugin: plugin.name,
        timestamp: Date.now(),
      });

      console.log(`✅ 插件 ${plugin.name} 安装成功`);
    } catch (error) {
      console.error(`❌ 插件 ${plugin.name} 安装失败:`, error);
      throw error;
    }
  }

  // 激活插件
  async activate(pluginName: string): Promise<void> {
    const info = this.plugins.get(pluginName);
    if (!info) {
      throw new Error(`插件 ${pluginName} 未安装`);
    }

    if (info.status === 'active') {
      return; // 已激活
    }

    try {
      // 执行激活钩子
      if (info.plugin.onActivate) {
        await info.plugin.onActivate(this.api);
      }

      info.status = 'active';
      info.activateTime = Date.now();

      this.emitEvent({
        type: 'activated',
        plugin: pluginName,
        timestamp: Date.now(),
      });

      console.log(`🚀 插件 ${pluginName} 激活成功`);
    } catch (error) {
      info.status = 'error';
      info.error = error as Error;

      this.emitEvent({
        type: 'error',
        plugin: pluginName,
        data: error,
        timestamp: Date.now(),
      });

      console.error(`❌ 插件 ${pluginName} 激活失败:`, error);
      throw error;
    }
  }

  // 停用插件
  async deactivate(pluginName: string): Promise<void> {
    const info = this.plugins.get(pluginName);
    if (!info || info.status !== 'active') {
      return;
    }

    try {
      // 执行停用钩子
      if (info.plugin.onDeactivate) {
        await info.plugin.onDeactivate(this.api);
      }

      info.status = 'inactive';

      this.emitEvent({
        type: 'deactivated',
        plugin: pluginName,
        timestamp: Date.now(),
      });

      console.log(`⏸️ 插件 ${pluginName} 已停用`);
    } catch (error) {
      console.error(`❌ 插件 ${pluginName} 停用失败:`, error);
      throw error;
    }
  }

  // 卸载插件
  async uninstall(pluginName: string): Promise<void> {
    const info = this.plugins.get(pluginName);
    if (!info) {
      return;
    }

    try {
      // 先停用
      if (info.status === 'active') {
        await this.deactivate(pluginName);
      }

      // 执行卸载钩子
      if (info.plugin.onUninstall) {
        await info.plugin.onUninstall(this.api);
      }

      // 移除命令
      if (info.plugin.commands) {
        for (const command of info.plugin.commands) {
          this.commands.delete(command.id);
        }
      }

      // 移除插件
      this.plugins.delete(pluginName);

      this.emitEvent({
        type: 'uninstalled',
        plugin: pluginName,
        timestamp: Date.now(),
      });

      console.log(`🗑️ 插件 ${pluginName} 已卸载`);
    } catch (error) {
      console.error(`❌ 插件 ${pluginName} 卸载失败:`, error);
      throw error;
    }
  }

  // 执行命令
  async executeCommand(commandId: string, ...args: any[]): Promise<any> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`命令 ${commandId} 不存在`);
    }

    // 检查是否可以执行
    if (command.canExecute && !command.canExecute(this.api)) {
      throw new Error(`命令 ${commandId} 当前不可执行`);
    }

    try {
      return await command.execute(this.api, ...args);
    } catch (error) {
      console.error(`命令 ${commandId} 执行失败:`, error);
      throw error;
    }
  }

  // 获取插件信息
  getPlugin(name: string): PluginInfo | null {
    return this.plugins.get(name) || null;
  }

  // 获取所有插件
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  // 获取活跃插件
  getActivePlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).filter((info) => info.status === 'active');
  }

  // 获取命令
  getCommand(id: string): PluginCommand | null {
    return this.commands.get(id) || null;
  }

  // 获取所有命令
  getAllCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  // 事件监听
  addEventListener(listener: (event: PluginEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emitEvent(event: PluginEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('插件事件监听器错误:', error);
      }
    });
  }

  // 批量操作
  async activateAll(): Promise<void> {
    const plugins = Array.from(this.plugins.keys());
    for (const pluginName of plugins) {
      try {
        await this.activate(pluginName);
      } catch (error) {
        console.error(`激活插件 ${pluginName} 失败:`, error);
      }
    }
  }

  async deactivateAll(): Promise<void> {
    const plugins = Array.from(this.plugins.keys());
    for (const pluginName of plugins) {
      try {
        await this.deactivate(pluginName);
      } catch (error) {
        console.error(`停用插件 ${pluginName} 失败:`, error);
      }
    }
  }
}
