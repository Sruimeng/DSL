import type { UsdStageImpl } from '../stage';
import type { UsdPrim, SdfPath } from '../types';

/**
 * USD插件基类
 */
export abstract class USDPlugin {
  protected name: string;
  protected version: string;
  protected stage: UsdStageImpl;
  protected enabled: boolean = true;
  protected priority: number = 0;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  /**
   * 初始化插件
   */
  abstract initialize(stage: UsdStageImpl): Promise<void>;

  /**
   * 销毁插件
   */
  abstract destroy(): Promise<void>;

  /**
   * 处理Prim创建事件
   */
  onPrimCreated?(prim: UsdPrim): void | Promise<void>;

  /**
   * 处理Prim删除事件
   */
  onPrimRemoved?(path: SdfPath): void | Promise<void>;

  /**
   * 处理Prim属性变更事件
   */
  onPrimAttributeChanged?(prim: UsdPrim, attributeName: string): void | Promise<void>;

  /**
   * 处理时间变化事件
   */
  onTimeChanged?(time: number): void | Promise<void>;

  /**
   * 处理图层变更事件
   */
  onLayerChanged?(): void | Promise<void>;

  /**
   * 获取插件名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 获取插件版本
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * 启用插件
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用插件
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 检查插件是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置插件优先级
   */
  setPriority(priority: number): void {
    this.priority = priority;
  }

  /**
   * 获取插件优先级
   */
  getPriority(): number {
    return this.priority;
  }

  /**
   * 获取插件信息
   */
  getInfo(): PluginInfo {
    return {
      name: this.name,
      version: this.version,
      enabled: this.enabled,
      priority: this.priority,
    };
  }
}

/**
 * 插件信息
 */
export interface PluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  priority: number;
  description?: string;
  author?: string;
  dependencies?: string[];
}

/**
 * 插件配置
 */
export interface PluginConfig {
  [key: string]: any;
}

/**
 * 渲染器插件接口
 */
export interface RendererPlugin extends USDPlugin {
  render(stage: UsdStageImpl, time: number): Promise<void>;
  getViewportSize(): { width: number; height: number };
  setViewportSize(width: number, height: number): void;
  captureScreenshot(): Promise<ImageData | Blob>;
}

/**
 * 导入器插件接口
 */
export interface ImporterPlugin extends USDPlugin {
  canImport(filePath: string): boolean;
  import(filePath: string, parentPath?: SdfPath): Promise<SdfPath[]>;
  getSupportedFormats(): string[];
}

/**
 * 导出器插件接口
 */
export interface ExporterPlugin extends USDPlugin {
  canExport(filePath: string): boolean;
  export(filePath: string, rootPath?: SdfPath): Promise<void>;
  getSupportedFormats(): string[];
}

/**
 * 材质插件接口
 */
export interface MaterialPlugin extends USDPlugin {
  createMaterial(materialPath: SdfPath, params: Record<string, any>): Promise<UsdPrim>;
  convertMaterial(fromFormat: string, toFormat: string, prim: UsdPrim): Promise<UsdPrim>;
  getSupportedShaders(): string[];
}

/**
 * 动画插件接口
 */
export interface AnimationPlugin extends USDPlugin {
  play(stage: UsdStageImpl): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  getTimeRange(): { start: number; end: number };
  setTimeRange(start: number, end: number): void;
}

/**
 * 几何体插件接口
 */
export interface GeometryPlugin extends USDPlugin {
  createGeometry(type: string, params: Record<string, any>): Promise<UsdPrim>;
  modifyGeometry(prim: UsdPrim, operation: string, params: Record<string, any>): Promise<void>;
  getSupportedGeometryTypes(): string[];
}

/**
 * 相机插件接口
 */
export interface CameraPlugin extends USDPlugin {
  createCamera(cameraPath: SdfPath, params: Record<string, any>): Promise<UsdPrim>;
  setActiveCamera(cameraPath: SdfPath): void;
  getActiveCamera(): SdfPath | null;
  getCameraList(): SdfPath[];
}

/**
 * 灯光插件接口
 */
export interface LightingPlugin extends USDPlugin {
  createLight(lightPath: SdfPath, type: string, params: Record<string, any>): Promise<UsdPrim>;
  updateLight(lightPath: SdfPath, params: Record<string, any>): Promise<void>;
  getSupportedLightTypes(): string[];
}

/**
 * 调试插件接口
 */
export interface DebugPlugin extends USDPlugin {
  enableDebugMode(): void;
  disableDebugMode(): void;
  getDebugInfo(): Record<string, any>;
  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void;
}

/**
 * 性能分析插件接口
 */
export interface ProfilerPlugin extends USDPlugin {
  startProfiling(): void;
  stopProfiling(): void;
  getProfileData(): ProfileData;
  clearProfileData(): void;
}

/**
 * 性能分析数据
 */
export interface ProfileData {
  totalTime: number;
  primCount: number;
  attributeCount: number;
  memoryUsage: number;
  operations: ProfileOperation[];
}

/**
 * 性能分析操作
 */
export interface ProfileOperation {
  name: string;
  startTime: number;
  duration: number;
  memoryDelta: number;
}

/**
 * 扩展插件接口
 */
export interface ExtensionPlugin extends USDPlugin {
  getExtensionPoints(): ExtensionPoint[];
  registerExtension(extension: Extension): void;
  unregisterExtension(extensionId: string): void;
}

/**
 * 扩展点
 */
export interface ExtensionPoint {
  id: string;
  name: string;
  description: string;
  interface: string;
}

/**
 * 扩展
 */
export interface Extension {
  id: string;
  name: string;
  version: string;
  extensionPointId: string;
  implementation: any;
}

/**
 * 插件加载器
 */
export interface PluginLoader {
  load(pluginPath: string): Promise<USDPlugin>;
  unload(plugin: USDPlugin): Promise<void>;
  getLoadedPlugins(): USDPlugin[];
}

/**
 * 插件依赖解析器
 */
export interface DependencyResolver {
  resolveDependencies(plugin: USDPlugin): Promise<USDPlugin[]>;
  checkCircularDependencies(plugins: USDPlugin[]): boolean;
  getDependencyOrder(plugins: USDPlugin[]): USDPlugin[];
}

/**
 * 插件事件
 */
export enum PluginEvent {
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ENABLED = 'plugin:enabled',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_INITIALIZED = 'plugin:initialized',
  PLUGIN_DESTROYED = 'plugin:destroyed',
}