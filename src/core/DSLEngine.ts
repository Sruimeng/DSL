/**
 * DSLEngine - DSL 引擎核心驱动器
 *
 * 解析 DSL JSON，管理场景状态，调度插件和动作，提供统一接口。
 */

import type * as THREE from 'three';
import type { ISceneState, IUSDScene } from '../type/scene';
import { DSLParser } from './DSLParser';
import type { EventBus } from './EventBus';
import { globalEventBus } from './EventBus';
import { SceneManager } from './SceneManager';
import { USDLoader } from './USDLoader';

import type {
  EngineConfig,
  EngineStats,
  IActionConstructor,
  IPlugin,
  Params,
} from '../type/engine';

/**
 * DSLEngine 是整个系统的核心，负责协调各个模块
 */
export class DSLEngine {
  private sceneManager: SceneManager;
  private eventBus: EventBus;
  private plugins: Map<string, IPlugin> = new Map();
  private actions: Map<string, IActionConstructor> = new Map();
  private sceneState: ISceneState;
  private config: EngineConfig;
  private stats: EngineStats;
  private state: {
    isInitialized: boolean;
    isRunning: boolean;
    isPaused: boolean;
    scene: ISceneState;
    config: EngineConfig;
    stats: EngineStats;
    plugins: Map<string, IPlugin>;
    actions: Map<string, IActionConstructor>;
    version: string;
  };
  private isInitialized: boolean = false;

  /**
   * 创建 DSLEngine 实例
   * @param canvas 可选的 Canvas 元素
   * @param config 引擎配置
   */
  constructor(canvas?: HTMLCanvasElement, config?: Partial<EngineConfig>) {
    // 初始化配置
    this.config = this.mergeConfig(config);

    // 初始化统计信息
    this.stats = {
      fps: 0,
      frameTime: 0,
      uptime: 0,
      memory: {
        used: 0,
        total: 0,
        limit: 0,
      },
      plugins: {
        total: 0,
        active: 0,
      },
      actions: {
        total: 0,
        executed: 0,
        failed: 0,
      },
      scene: {
        objects: 0,
        lights: 0,
        cameras: 0,
        materials: 0,
      },
    };

    // 初始化场景状态
    this.sceneState = {
      objects: new Map(),
      currentTime: 0,
      isLoaded: false,
      isRunning: false,
    };

    // 创建场景管理器
    this.sceneManager = new SceneManager(canvas || this.config.renderer.canvas);

    // 使用全局事件总线
    this.eventBus = globalEventBus;

    // 初始化引擎状态
    this.state = {
      isInitialized: false,
      isRunning: false,
      isPaused: false,
      scene: this.sceneState,
      config: this.config,
      stats: this.stats,
      plugins: this.plugins,
      actions: this.actions,
      version: '1.0.0',
    };

    // 监听渲染循环事件
    this.setupEventListeners();
  }

  /**
   * 初始化引擎
   * @param config 引擎配置
   */
  public async initialize(config?: Partial<EngineConfig>): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Engine is already initialized');
    }

    // 合并配置
    if (config) {
      this.config = this.mergeConfig(config);
      this.state.config = this.config;
    }

    try {
      // 触发初始化前事件
      await this.eventBus.emit('beforeInitialize', { config: this.config });

      // 初始化插件
      await this.initializePlugins();

      // 设置已初始化状态
      this.isInitialized = true;
      this.state.isInitialized = true;

      // 触发初始化完成事件
      await this.eventBus.emit('initialized', { engine: this.state });

      console.log('DSLEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DSLEngine:', error);
      throw error;
    }
  }

  /**
   * 加载 USD 场景
   * @param dslJson USD 场景描述
   */
  public async loadDSL(dslJson: IUSDScene): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Engine is not initialized');
    }

    try {
      // 触发加载前事件
      await this.eventBus.emit('beforeLoadScene', { scene: dslJson });

      // 清理现有场景
      await this.unloadDSL();

      // 解析场景
      const sceneObjects = DSLParser.parse(dslJson);

      // 初始化场景管理器
      this.sceneManager.init(sceneObjects);

      // 更新场景状态
      this.updateSceneState(dslJson, sceneObjects);

      // 触发场景加载完成事件
      await this.eventBus.emit('sceneLoaded', {
        scene: dslJson,
        objects: sceneObjects,
      });

      console.log('USD scene loaded successfully');
    } catch (error) {
      console.error('Failed to load USD scene:', error);
      throw error;
    }
  }

  /**
   * 从 URL 加载 USD 场景
   * @param url USD 文件 URL
   */
  public async loadFromURL(url: string): Promise<void> {
    try {
      const dslJson = await USDLoader.load(url);
      await this.loadDSL(dslJson);
    } catch (error) {
      console.error(`Failed to load USD from URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * 卸载当前场景
   */
  public async unloadDSL(): Promise<void> {
    if (!this.sceneState.isLoaded) {
      return;
    }

    try {
      // 触发卸载前事件
      await this.eventBus.emit('beforeUnloadScene', { state: this.sceneState });

      // 清理场景对象
      this.sceneState.objects.clear();

      // 重置场景状态
      this.sceneState = {
        objects: new Map(),
        currentTime: 0,
        isLoaded: false,
        isRunning: false,
      };
      this.state.scene = this.sceneState;

      // 清理场景管理器
      this.sceneManager.init([]);

      // 清理解析器缓存
      DSLParser.clearCache();

      // 触发卸载完成事件
      await this.eventBus.emit('sceneUnloaded', {});

      console.log('USD scene unloaded successfully');
    } catch (error) {
      console.error('Failed to unload USD scene:', error);
      throw error;
    }
  }

  /**
   * 启动引擎
   */
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('Engine is not initialized');
    }

    if (this.state.isRunning) {
      return;
    }

    // 启动渲染循环
    this.sceneManager.startRenderLoop();

    // 更新状态
    this.state.isRunning = true;
    this.sceneState.isRunning = true;

    // 触发启动事件
    this.eventBus.emit('started', { engine: this.state });

    console.log('DSLEngine started');
  }

  /**
   * 停止引擎
   */
  public stop(): void {
    if (!this.state.isRunning) {
      return;
    }

    // 停止渲染循环
    this.sceneManager.stopRenderLoop();

    // 更新状态
    this.state.isRunning = false;
    this.sceneState.isRunning = false;

    // 触发停止事件
    this.eventBus.emit('stopped', { engine: this.state });

    console.log('DSLEngine stopped');
  }

  /**
   * 暂停引擎
   */
  public pause(): void {
    if (!this.state.isRunning || this.state.isPaused) {
      return;
    }

    this.state.isPaused = true;
    this.eventBus.emit('paused', { engine: this.state });
  }

  /**
   * 恢复引擎
   */
  public resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) {
      return;
    }

    this.state.isPaused = false;
    this.eventBus.emit('resumed', { engine: this.state });
  }

  /**
   * 更新引擎
   * @param deltaTime 可选的增量时间
   */
  public update(deltaTime?: number): void {
    if (!this.state.isRunning || this.state.isPaused) {
      return;
    }

    // 更新统计信息
    this.updateStats();

    // 更新场景时间
    if (deltaTime !== undefined) {
      this.sceneState.currentTime += deltaTime;
    }
  }

  /**
   * 注册插件
   * @param plugin 插件实例
   */
  public registerPlugin(plugin: IPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin '${plugin.name}' is already registered`);
      return;
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.plugins.has(dependency)) {
          throw new Error(`Missing dependency '${dependency}' for plugin '${plugin.name}'`);
        }
      }
    }

    try {
      // 注册到场景管理器
      this.sceneManager.registerPlugin(plugin);

      // 添加到插件列表
      this.plugins.set(plugin.name, plugin);

      // 触发插件注册事件
      this.eventBus.emit('pluginRegistered', { plugin });

      console.log(`Plugin '${plugin.name}' registered successfully`);
    } catch (error) {
      console.error(`Failed to register plugin '${plugin.name}':`, error);
      throw error;
    }
  }

  /**
   * 注销插件
   * @param pluginName 插件名称
   */
  public unregisterPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`Plugin '${pluginName}' is not registered`);
      return;
    }

    try {
      // 检查是否有其他插件依赖于此插件
      for (const [name, otherPlugin] of this.plugins) {
        if (name !== pluginName && otherPlugin.dependencies?.includes(pluginName)) {
          throw new Error(
            `Cannot unregister plugin '${pluginName}'. Plugin '${name}' depends on it`,
          );
        }
      }

      // 从场景管理器注销
      this.sceneManager.unregisterPlugin(plugin);

      // 从插件列表移除
      this.plugins.delete(pluginName);

      // 触发插件注销事件
      this.eventBus.emit('pluginUnregistered', { plugin });

      console.log(`Plugin '${pluginName}' unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister plugin '${pluginName}':`, error);
      throw error;
    }
  }

  /**
   * 获取插件
   * @param pluginName 插件名称
   */
  public getPlugin(pluginName: string): IPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * 注册动作
   * @param actionName 动作名称
   * @param actionClass 动作类
   */
  public registerAction(actionName: string, actionClass: IActionConstructor): void {
    if (this.actions.has(actionName)) {
      console.warn(`Action '${actionName}' is already registered`);
      return;
    }

    this.actions.set(actionName, actionClass);
    this.eventBus.emit('actionRegistered', { actionName, actionClass });
    console.log(`Action '${actionName}' registered successfully`);
  }

  /**
   * 注销动作
   * @param actionName 动作名称
   */
  public unregisterAction(actionName: string): void {
    if (!this.actions.has(actionName)) {
      console.warn(`Action '${actionName}' is not registered`);
      return;
    }

    this.actions.delete(actionName);
    this.eventBus.emit('actionUnregistered', { actionName });
    console.log(`Action '${actionName}' unregistered successfully`);
  }

  /**
   * 执行动作
   * @param actionName 动作名称
   * @param params 动作参数
   */
  public async executeAction(actionName: string, params?: Params): Promise<void> {
    const ActionClass = this.actions.get(actionName);
    if (!ActionClass) {
      throw new Error(`Action '${actionName}' is not registered`);
    }

    try {
      // 触发动作执行前事件
      await this.eventBus.emit('beforeExecuteAction', {
        actionName,
        params,
      });

      // 创建动作实例并执行
      const action = new ActionClass();
      await action.execute(this as any, params);

      // 触发动作执行完成事件
      await this.eventBus.emit('actionExecuted', {
        actionName,
        params,
        success: true,
      });
    } catch (error) {
      // 触发动作执行失败事件
      await this.eventBus.emit('actionExecuted', {
        actionName,
        params,
        success: false,
        error,
      });
      throw error;
    }
  }

  /**
   * 获取所有已注册的动作
   */
  public getActions(): Map<string, IActionConstructor> {
    return new Map(this.actions);
  }

  /**
   * 获取场景状态
   */
  public getSceneState(): ISceneState {
    return { ...this.sceneState };
  }

  /**
   * 获取引擎状态
   */
  public getState(): unknown {
    return { ...this.state };
  }

  /**
   * 获取引擎统计信息
   */
  public getStats(): EngineStats {
    return { ...this.stats };
  }

  /**
   * 获取渲染器
   */
  public getRenderer(): any {
    return this.sceneManager.getRenderer();
  }

  /**
   * 添加资源加载器
   */
  public addAssetLoader(loader: unknown): void {
    // 简化实现
    console.log('Asset loader added:', loader);
  }

  /**
   * 加载资源
   */
  public loadAsset(path: string, options?: unknown): Promise<unknown> {
    // 简化实现
    console.log('Loading asset:', path, options);
    return Promise.resolve(null);
  }

  /**
   * 获取日志器
   */
  public getLogger(): unknown {
    return {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
  }

  /**
   * 获取脚本上下文
   */
  public getScriptContext(): unknown {
    return {
      execute: (script: string) => {
        console.log('Executing script:', script);
        return Promise.resolve(null);
      },
      evaluate: (expression: string) => {
        console.log('Evaluating expression:', expression);
        return null;
      },
    };
  }

  /**
   * 销毁引擎
   */
  public dispose(): void {
    this.destroy();
  }

  /**
   * 获取场景管理器
   */
  public getSceneManager(): unknown {
    return this.sceneManager;
  }

  /**
   * 获取事件总线
   */
  public getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  public on(event: string, handler: (data: any) => void): this {
    this.eventBus.on(event, handler);
    return this;
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  public off(event: string, handler: (data: any) => void): this {
    this.eventBus.off(event, handler);
    return this;
  }

  /**
   * 发送事件
   * @param event 事件名称
   * @param data 事件数据
   */
  public emit(event: string, data: any): boolean {
    return this.eventBus.emit(event, data);
  }

  /**
   * 销毁引擎，释放所有资源
   */
  public destroy(): void {
    try {
      // 触发销毁前事件
      this.eventBus.emit('beforeDestroy', { engine: this.state });

      // 停止引擎
      this.stop();

      // 卸载场景
      this.unloadDSL().catch(console.error);

      // 注销所有插件
      for (const [name] of this.plugins) {
        this.unregisterPlugin(name);
      }

      // 注销所有动作
      for (const [name] of this.actions) {
        this.unregisterAction(name);
      }

      // 销毁场景管理器
      this.sceneManager.dispose();

      // 重置状态
      this.isInitialized = false;
      this.state.isInitialized = false;

      // 触发销毁完成事件
      this.eventBus.emit('destroyed', { engine: this.state });

      console.log('DSLEngine destroyed successfully');
    } catch (error) {
      console.error('Failed to destroy DSLEngine:', error);
      throw error;
    }
  }

  /**
   * 合并配置
   * @param config 用户配置
   * @returns EngineConfig 合并后的配置
   */
  private mergeConfig(config?: Partial<EngineConfig>): EngineConfig {
    const defaultConfig: EngineConfig = {
      renderer: {
        api: 'WebGL' as const,
        canvas: '#canvas',
        antialias: 'msaa' as const,
        samples: 4,
        quality: 'high' as const,
        pixelRatio: window.devicePixelRatio || 1,
        background: {
          type: 'color',
          color: [0, 0, 0],
        },
        shadows: {
          enabled: true,
          size: [1024, 1024],
          type: 'pcf',
        },
        toneMapping: {
          enabled: true,
          operator: 'linear',
          exposure: 1,
        },
        maxLights: 10,
        renderTargets: {},
        renderPasses: [],
        postProcess: [],
      },
      scene: {
        autoUpdate: true,
        enablePhysics: false,
        enableAnimation: true,
        defaultUpAxis: 'Y',
      },
      assets: {
        basePath: '',
        enableCache: true,
        maxCacheSize: 100,
        assetLoaders: {},
      },
      debug: {
        enabled: false,
        showStats: false,
        showWireframe: false,
        showBounds: false,
        logLevel: 'info',
      },
      performance: {
        targetFPS: 60,
        adaptiveQuality: false,
        enableProfiling: false,
      },
    };

    return {
      ...defaultConfig,
      ...config,
      renderer: {
        ...defaultConfig.renderer,
        ...config?.renderer,
      },
      scene: {
        ...defaultConfig.scene,
        ...config?.scene,
      },
      assets: {
        ...defaultConfig.assets,
        ...config?.assets,
      },
      debug: {
        ...defaultConfig.debug,
        ...config?.debug,
      },
      performance: {
        ...defaultConfig.performance,
        ...config?.performance,
      },
    };
  }

  /**
   * 初始化插件
   */
  private async initializePlugins(): Promise<void> {
    // 简化处理，实际实现中需要动态加载插件
    console.log('Initializing plugins...');
  }

  /**
   * 更新场景状态
   * @param _dslJson USD 场景（未使用）
   * @param sceneObjects Three.js 对象数组
   */
  private updateSceneState(_dslJson: IUSDScene, sceneObjects: THREE.Object3D[]): void {
    // 更新加载状态
    this.sceneState.isLoaded = true;

    // 将对象添加到状态
    sceneObjects.forEach((obj) => {
      this.sceneState.objects.set(obj.uuid, obj);
    });

    // 更新统计信息
    this.stats.scene.objects = sceneObjects.length;
    this.stats.scene.lights = sceneObjects.filter((obj) => obj.type.includes('Light')).length;
    this.stats.scene.cameras = sceneObjects.filter((obj) => obj.type.includes('Camera')).length;
    this.stats.scene.materials = sceneObjects.filter(
      (obj) => obj.type === 'Mesh' && (obj as any).material,
    ).length;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    // 更新运行时间
    this.stats.uptime = performance.now() / 1000;

    // 更新 FPS
    if (this.config.debug?.enabled) {
      const now = performance.now();
      const delta = now - (this.stats as any).lastTime;
      if (delta > 0) {
        this.stats.fps = Math.round(1000 / delta);
      }
      (this.stats as any).lastTime = now;
    }

    // 更新内存使用
    if ((performance as any).memory) {
      this.stats.memory.used = (performance as any).memory.usedJSHeapSize;
      this.stats.memory.total = (performance as any).memory.totalJSHeapSize;
      this.stats.memory.limit = (performance as any).memory.jsHeapSizeLimit;
    }

    // 更新插件统计
    this.stats.plugins.total = this.plugins.size;
    this.stats.plugins.active = Array.from(this.plugins.values()).filter(
      (p) => p.update !== undefined,
    ).length;

    // 更新动作统计
    this.stats.actions.total = this.actions.size;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听场景对象变化
    this.sceneManager.getScene().addEventListener('childadded', (event) => {
      this.sceneState.objects.set(event.child.uuid, event.child);
    });

    this.sceneManager.getScene().addEventListener('childremoved', (event) => {
      this.sceneState.objects.delete(event.child.uuid);
    });

    // 监听错误事件
    window.addEventListener('error', (event) => {
      this.eventBus.emit('error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
      });
    });

    // 监听未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.eventBus.emit('unhandledRejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }
}
