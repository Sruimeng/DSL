/**
 * DSL 引擎类型定义
 *
 * 定义 DSL 引擎的类型，包括插件、动作、
 * 事件和引擎配置的接口。
 */

import type * as THREE from 'three';
import type { RendererSettings, USDRenderer } from './renderer';
import type { IUSDScene } from './scene';

/**
 * 通用参数类型
 */
export type Params = Record<string, unknown>;

/**
 * Plugin interface
 */
export interface IPlugin {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Called when plugin is registered */
  onRegister(engine: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
  }): void;
  /** Called when plugin is unregistered */
  onUnregister?(): void;
  /** Update method called each frame */
  update?(deltaTime: number): void;
  /** Scene lifecycle callbacks */
  onSceneInit?(scene: THREE.Scene): void;
  onObjectAdded?(object: THREE.Object3D): void;
  onObjectRemoved?(object: THREE.Object3D): void;
  onRenderStart?(): void;
  onRenderEnd?(): void;
  /** Plugin lifecycle methods */
  lifecycle?: {
    onInit?(): void;
    onStart?(): void;
    onPause?(): void;
    onResume?(): void;
    onStop?(): void;
    onDestroy?(): void;
  };
  /** Plugin event handlers */
  handlers?: {
    [event: string]: (...args: unknown[]) => void;
  };
}

/**
 * Action interface
 */
export interface IAction {
  /** Action name */
  name: string;
  /** Action description */
  description?: string;
  /** Execute the action */
  execute(engine: DSLEngine, params?: Params): Promise<void>;
  /** Validate action parameters */
  validate?(params: Params): boolean;
  /** Action metadata */
  metadata?: {
    category?: string;
    icon?: string;
    shortcut?: string;
    permissions?: string[];
  };
}

/**
 * Action constructor
 */
export interface IActionConstructor {
  new (): IAction;
}

/**
 * Event types
 */
export type EventType =
  | 'scene:loaded'
  | 'scene:unloaded'
  | 'object:added'
  | 'object:removed'
  | 'object:updated'
  | 'renderer:initialized'
  | 'renderer:resized'
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'animation:started'
  | 'animation:stopped'
  | 'animation:completed'
  | 'camera:changed'
  | 'light:changed'
  | 'material:changed'
  | 'custom';

/**
 * Event handler
 */
export type EventHandler = (event: unknown) => void;

/**
 * Event payload
 */
export interface EventPayload {
  /** Event type */
  type: EventType;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: unknown;
  /** Event source */
  source?: string;
}

/**
 * Engine configuration
 */
export interface EngineConfig {
  /** Renderer settings */
  renderer: RendererSettings;
  /** Scene settings */
  scene?: {
    autoUpdate?: boolean;
    enablePhysics?: boolean;
    enableAnimation?: boolean;
    defaultUpAxis?: 'Y' | 'Z';
  };
  /** Asset settings */
  assets?: {
    basePath?: string;
    enableCache?: boolean;
    maxCacheSize?: number;
    assetLoaders?: Record<string, string>;
  };
  /** Debug settings */
  debug?: {
    enabled?: boolean;
    showStats?: boolean;
    showWireframe?: boolean;
    showBounds?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  };
  /** Performance settings */
  performance?: {
    targetFPS?: number;
    adaptiveQuality?: boolean;
    enableProfiling?: boolean;
  };
}

/**
 * Engine statistics
 */
export interface EngineStats {
  /** Current FPS */
  fps: number;
  /** Frame time in ms */
  frameTime: number;
  /** Uptime in seconds */
  uptime: number;
  /** Memory usage */
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  /** Plugin statistics */
  plugins: {
    total: number;
    active: number;
  };
  /** Action statistics */
  actions: {
    total: number;
    executed: number;
    failed: number;
  };
  /** Scene statistics */
  scene: {
    objects: number;
    lights: number;
    cameras: number;
    materials: number;
  };
}

/**
 * DSLEngine interface
 */
export interface DSLEngine {
  /** Initialize engine with configuration */
  initialize(config: EngineConfig): Promise<void>;
  /** Load USD scene */
  loadDSL(dslJson: IUSDScene): Promise<void>;
  /** Unload current scene */
  unloadDSL(): Promise<void>;
  /** Start engine */
  start(): void;
  /** Stop engine */
  stop(): void;
  /** Pause engine */
  pause(): void;
  /** Resume engine */
  resume(): void;
  /** Update engine */
  update(deltaTime?: number): void;
  /** Register plugin */
  registerPlugin(plugin: IPlugin): void;
  /** Unregister plugin */
  unregisterPlugin(pluginName: string): void;
  /** Get plugin by name */
  getPlugin(pluginName: string): IPlugin | undefined;
  /** Register action */
  registerAction(actionName: string, actionClass: IActionConstructor): void;
  /** Unregister action */
  unregisterAction(actionName: string): void;
  /** Execute action */
  executeAction(actionName: string, params?: Params): Promise<void>;
  /** Get all registered actions */
  getActions(): Map<string, IActionConstructor>;
  /** Add event listener */
  on(event: EventType, handler: EventHandler): void;
  /** Remove event listener */
  off(event: EventType, handler: EventHandler): void;
  /** Emit event */
  emit(event: EventType, data?: unknown): void;
  /** Get scene manager */
  getSceneManager(): unknown;
  /** Get renderer */
  getRenderer(): USDRenderer | undefined;
  /** Get engine state */
  getState(): unknown;
  /** Get engine statistics */
  getStats(): EngineStats;
  /** Add asset loader */
  addAssetLoader(loader: unknown): void;
  /** Load asset */
  loadAsset(path: string, options?: unknown): Promise<unknown>;
  /** Get logger */
  getLogger(): unknown;
  /** Get script context */
  getScriptContext(): unknown;
  /** Dispose engine */
  dispose(): void;
}
