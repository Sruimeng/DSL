import { EventEmitter } from 'eventemitter3';
import type { USDPlugin, PluginInfo, PluginConfig } from './base-plugin';
import type { UsdStageImpl } from '../stage';

/**
 * 插件管理器
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, USDPlugin> = new Map();
  private stage: UsdStageImpl;
  private configs: Map<string, PluginConfig> = new Map();
  private loader: PluginLoader;
  private dependencyResolver: DependencyResolver;

  constructor(stage: UsdStageImpl) {
    super();
    this.stage = stage;
    this.loader = new DefaultPluginLoader();
    this.dependencyResolver = new DefaultDependencyResolver();
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听Stage事件并转发给插件
    this.stage.on('primAdded', (path) => {
      this.broadcastToPlugins('onPrimCreated', async (plugin) => {
        const prim = this.stage.getPrimAtPath(path);
        if (prim && plugin.onPrimCreated) {
          await plugin.onPrimCreated(prim);
        }
      });
    });

    this.stage.on('primRemoved', (path) => {
      this.broadcastToPlugins('onPrimRemoved', async (plugin) => {
        if (plugin.onPrimRemoved) {
          await plugin.onPrimRemoved(path);
        }
      });
    });

    this.stage.on('attributeChanged', (path, attrName) => {
      this.broadcastToPlugins('onPrimAttributeChanged', async (plugin) => {
        const prim = this.stage.getPrimAtPath(path);
        if (prim && plugin.onPrimAttributeChanged) {
          await plugin.onPrimAttributeChanged(prim, attrName);
        }
      });
    });

    this.stage.on('timeChanged', (time) => {
      this.broadcastToPlugins('onTimeChanged', async (plugin) => {
        if (plugin.onTimeChanged) {
          await plugin.onTimeChanged(time);
        }
      });
    });
  }

  /**
   * 向所有插件广播事件
   */
  private async broadcastToPlugins(
    methodName: string,
    callback: (plugin: USDPlugin) => Promise<void>
  ): Promise<void> {
    const enabledPlugins = Array.from(this.plugins.values()).filter(p => p.isEnabled());
    
    // 按优先级排序
    enabledPlugins.sort((a, b) => b.getPriority() - a.getPriority());

    const promises = enabledPlugins.map(async (plugin) => {
      try {
        await callback(plugin);
      } catch (error) {
        this.emit('plugin:error', {
          plugin: plugin.getName(),
          method: methodName,
          error,
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * 加载插件
   */
  async loadPlugin(pluginPath: string, config?: PluginConfig): Promise<USDPlugin> {
    // 加载插件
    const plugin = await this.loader.load(pluginPath);
    
    // 检查是否已加载
    if (this.plugins.has(plugin.getName())) {
      throw new Error(`插件已加载: ${plugin.getName()}`);
    }

    // 保存配置
    if (config) {
      this.configs.set(plugin.getName(), config);
    }

    // 解析依赖
    const dependencies = await this.dependencyResolver.resolveDependencies(plugin);
    
    // 检查依赖是否满足
    for (const dep of dependencies) {
      if (!this.plugins.has(dep.getName())) {
        throw new Error(`缺少依赖插件: ${dep.getName()}`);
      }
    }

    // 检查循环依赖
    const allPlugins = Array.from(this.plugins.values());
    if (this.dependencyResolver.checkCircularDependencies([...allPlugins, plugin])) {
      throw new Error('检测到循环依赖');
    }

    // 初始化插件
    await plugin.initialize(this.stage);

    // 添加到插件列表
    this.plugins.set(plugin.getName(), plugin);

    // 发送事件
    this.emit('plugin:loaded', plugin.getInfo());

    return plugin;
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`插件未找到: ${pluginName}`);
    }

    // 检查是否有其他插件依赖此插件
    for (const [name, otherPlugin] of this.plugins) {
      if (name === pluginName) continue;
      
      const dependencies = await this.dependencyResolver.resolveDependencies(otherPlugin);
      if (dependencies.some(dep => dep.getName() === pluginName)) {
        throw new Error(`其他插件依赖此插件: ${pluginName}`);
      }
    }

    // 销毁插件
    await plugin.destroy();

    // 从列表中移除
    this.plugins.delete(pluginName);
    this.configs.delete(pluginName);

    // 卸载插件
    await this.loader.unload(plugin);

    // 发送事件
    this.emit('plugin:unloaded', pluginName);
  }

  /**
   * 启用插件
   */
  enablePlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`插件未找到: ${pluginName}`);
    }

    plugin.enable();
    this.emit('plugin:enabled', pluginName);
  }

  /**
   * 禁用插件
   */
  disablePlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`插件未找到: ${pluginName}`);
    }

    plugin.disable();
    this.emit('plugin:disabled', pluginName);
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): USDPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): USDPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件信息
   */
  getPluginInfo(name: string): PluginInfo | undefined {
    const plugin = this.plugins.get(name);
    return plugin?.getInfo();
  }

  /**
   * 获取所有插件信息
   */
  getAllPluginInfo(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(p => p.getInfo());
  }

  /**
   * 设置插件配置
   */
  setPluginConfig(pluginName: string, config: PluginConfig): void {
    this.configs.set(pluginName, config);
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(pluginName: string): PluginConfig | undefined {
    return this.configs.get(pluginName);
  }

  /**
   * 获取特定类型的插件
   */
  getPluginsByType<T extends USDPlugin>(type: new (...args: any[]) => T): T[] {
    return Array.from(this.plugins.values()).filter(
      plugin => plugin instanceof type
    ) as T[];
  }

  /**
   * 批量加载插件
   */
  async loadPlugins(pluginConfigs: Array<{
    path: string;
    config?: PluginConfig;
    priority?: number;
  }>): Promise<USDPlugin[]> {
    const plugins: USDPlugin[] = [];

    // 按优先级排序
    const sortedConfigs = [...pluginConfigs].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );

    for (const config of sortedConfigs) {
      try {
        const plugin = await this.loadPlugin(config.path, config.config);
        if (config.priority !== undefined) {
          plugin.setPriority(config.priority);
        }
        plugins.push(plugin);
      } catch (error) {
        console.error(`加载插件失败: ${config.path}`, error);
      }
    }

    return plugins;
  }

  /**
   * 卸载所有插件
   */
  async unloadAllPlugins(): Promise<void> {
    // 按依赖顺序卸载
    const plugins = this.dependencyResolver.getDependencyOrder(
      Array.from(this.plugins.values())
    );

    for (const plugin of plugins.reverse()) {
      try {
        await this.unloadPlugin(plugin.getName());
      } catch (error) {
        console.error(`卸载插件失败: ${plugin.getName()}`, error);
      }
    }
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.plugins.size,
      enabled: 0,
      disabled: 0,
      byType: {} as Record<string, number>,
    };

    for (const plugin of this.plugins.values()) {
      if (plugin.isEnabled()) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }

      // 统计类型
      const type = plugin.constructor.name;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  /**
   * 调用插件方法（如果存在）
   */
  async callPluginMethod<T>(
    pluginName: string,
    methodName: string,
    ...args: any[]
  ): Promise<T | undefined> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !plugin.isEnabled()) {
      return undefined;
    }

    const method = (plugin as any)[methodName];
    if (typeof method !== 'function') {
      return undefined;
    }

    try {
      return await method.apply(plugin, args);
    } catch (error) {
      this.emit('plugin:error', {
        plugin: pluginName,
        method: methodName,
        error,
      });
      throw error;
    }
  }
}

/**
 * 默认插件加载器
 */
export class DefaultPluginLoader implements PluginLoader {
  private loadedPlugins: Map<string, USDPlugin> = new Map();

  async load(pluginPath: string): Promise<USDPlugin> {
    // 这里实现实际的插件加载逻辑
    // 动态导入插件模块
    try {
      const module = await import(pluginPath);
      const PluginClass = module.default || module;
      
      if (typeof PluginClass !== 'function') {
        throw new Error(`插件不是有效的类: ${pluginPath}`);
      }

      const plugin = new PluginClass();
      
      if (!(plugin instanceof USDPlugin)) {
        throw new Error(`插件不是USDPlugin的子类: ${pluginPath}`);
      }

      this.loadedPlugins.set(pluginPath, plugin);
      return plugin;
    } catch (error) {
      throw new Error(`加载插件失败: ${pluginPath} - ${error.message}`);
    }
  }

  async unload(plugin: USDPlugin): Promise<void> {
    // 查找并移除插件
    for (const [path, loadedPlugin] of this.loadedPlugins) {
      if (loadedPlugin === plugin) {
        this.loadedPlugins.delete(path);
        break;
      }
    }
  }

  getLoadedPlugins(): USDPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }
}

/**
 * 默认依赖解析器
 */
export class DefaultDependencyResolver implements DependencyResolver {
  async resolveDependencies(plugin: USDPlugin): Promise<USDPlugin[]> {
    const dependencies: USDPlugin[] = [];
    const info = plugin.getInfo();
    
    if (info.dependencies) {
      // 这里应该从插件管理器获取依赖插件
      // 简化实现
    }
    
    return dependencies;
  }

  checkCircularDependencies(plugins: USDPlugin[]): boolean {
    const pluginNames = new Set(plugins.map(p => p.getName()));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (plugin: USDPlugin): boolean => {
      const name = plugin.getName();
      
      if (recursionStack.has(name)) {
        return true;
      }
      
      if (visited.has(name)) {
        return false;
      }
      
      visited.add(name);
      recursionStack.add(name);
      
      // 这里应该检查插件的实际依赖
      // 简化实现
      
      recursionStack.delete(name);
      return false;
    };

    for (const plugin of plugins) {
      if (hasCircularDependency(plugin)) {
        return true;
      }
    }

    return false;
  }

  getDependencyOrder(plugins: USDPlugin[]): USDPlugin[] {
    // 使用拓扑排序获取依赖顺序
    const pluginMap = new Map(plugins.map(p => [p.getName(), p]));
    const visited = new Set<string>();
    const result: USDPlugin[] = [];

    const visit = (plugin: USDPlugin) => {
      const name = plugin.getName();
      
      if (visited.has(name)) {
        return;
      }
      
      visited.add(name);
      
      // 先访问依赖
      const info = plugin.getInfo();
      if (info.dependencies) {
        for (const depName of info.dependencies) {
          const depPlugin = pluginMap.get(depName);
          if (depPlugin) {
            visit(depPlugin);
          }
        }
      }
      
      result.push(plugin);
    };

    for (const plugin of plugins) {
      visit(plugin);
    }

    return result;
  }
}

/**
 * 插件事件
 */
export enum PluginManagerEvent {
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ENABLED = 'plugin:enabled',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_ERROR = 'plugin:error',
  ALL_PLUGINS_UNLOADED = 'all:plugins:unloaded',
}

// 重新导出插件相关类型
export * from './base-plugin';