/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * DSL Engine Type Definitions
 *
 * Defines types for the DSL engine, including interfaces for
 * plugins, actions, events, and engine configuration.
 */

import type { RendererSettings, USDRenderer } from './renderer';
import type { SceneState, USDScene } from './scene';

/**
 * Plugin interface
 */
export interface Plugin {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Called when plugin is registered */
  onRegister(engine: DSLEngine): void;
  /** Called when plugin is unregistered */
  onUnregister?(): void;
  /** Update method called each frame */
  update?(deltaTime: number): void;
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
    [event: string]: (...args: any[]) => void;
  };
}

/**
 * Action interface
 */
export interface Action {
  /** Action name */
  name: string;
  /** Action description */
  description?: string;
  /** Execute the action */
  execute(engine: DSLEngine, params?: any): Promise<void>;
  /** Validate action parameters */
  validate?(params: any): boolean;
  /** Action metadata */
  metadata?: {
    category?: string;
    icon?: string;
    shortcut?: string;
    permissions?: string[];
  };
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
export type EventHandler = (event: any) => void;

/**
 * Event payload
 */
export interface EventPayload {
  /** Event type */
  type: EventType;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: any;
  /** Event source */
  source?: string;
}

/**
 ** Engine configuration
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
 * Resource reference
 */
export interface ResourceRef {
  /** Resource type */
  type: 'texture' | 'geometry' | 'material' | 'audio' | 'video';
  /** Resource path */
  path: string;
  /** Resource ID */
  id: string;
  /** Load priority */
  priority: number;
  /** Async load */
  async: boolean;
}

/**
 * Asset loader interface
 */
export interface AssetLoader {
  /** Supported file types */
  extensions: string[];
  /** Load asset from URL */
  load(url: string, options?: any): Promise<any>;
  /** Parse asset data */
  parse(data: any, options?: any): Promise<any>;
  /** Check if file type is supported */
  supports(fileType: string): boolean;
}

/**
 * Script context interface
 */
export interface ScriptContext {
  /** Execute script */
  execute(script: string, context?: any): Promise<any>;
  /** Evaluate expression */
  evaluate(expression: string, context?: any): any;
  /** Get available functions */
  getFunctions(): string[];
  /** Get global variables */
  getGlobals(): Record<string, any>;
}

/**
 ** Engine logger interface
 */
export interface Logger {
  /** Log debug message */
  debug(message: string, ...args: any[]): void;
  /** Log info message */
  info(message: string, ...args: any[]): void;
  /** Log warning message */
  warn(message: string, ...args: any[]): void;
  /** Log error message */
  error(message: string, ...args: any[]): void;
  /** Log group start */
  group(label?: string): void;
  /** Log group end */
  groupEnd(): void;
  /** Time measurement */
  time(label: string): void;
  /** Time end measurement */
  timeEnd(label: string): void;
}

/**
 * Engine state
 */
export interface EngineState {
  /** Is engine initialized */
  isInitialized: boolean;
  /** Is engine running */
  isRunning: boolean;
  /** Is engine paused */
  isPaused: boolean;
  /** Current scene state */
  scene: SceneState;
  /** Engine configuration */
  config: EngineConfig;
  /** Engine statistics */
  stats: EngineStats;
  /** Active plugins */
  plugins: Map<string, Plugin>;
  /** Registered actions */
  actions: Map<string, typeof Action>;
  /** Engine version */
  version: string;
}

/**
 * DSL Engine interface
 */
export interface DSLEngine {
  /** Initialize engine with configuration */
  initialize(config: EngineConfig): Promise<void>;
  /** Load USD scene */
  loadDSL(dslJson: USDScene): Promise<void>;
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
  registerPlugin(plugin: Plugin): void;
  /** Unregister plugin */
  unregisterPlugin(pluginName: string): void;
  /** Get plugin by name */
  getPlugin(pluginName: string): Plugin | undefined;
  /** Register action */
  registerAction(actionName: string, actionClass: typeof Action): void;
  /** Unregister action */
  unregisterAction(actionName: string): void;
  /** Execute action */
  executeAction(actionName: string, params?: any): Promise<void>;
  /** Get all registered actions */
  getActions(): Map<string, typeof Action>;
  /** Add event listener */
  on(event: EventType, handler: EventHandler): void;
  /** Remove event listener */
  off(event: EventType, handler: EventHandler): void;
  /** Emit event */
  emit(event: EventType, data?: any): void;
  /** Get scene manager */
  getSceneManager(): any;
  /** Get renderer */
  getRenderer(): USDRenderer | undefined;
  /** Get engine state */
  getState(): EngineState;
  /** Get engine statistics */
  getStats(): EngineStats;
  /** Add asset loader */
  addAssetLoader(loader: AssetLoader): void;
  /** Load asset */
  loadAsset(path: string, options?: any): Promise<any>;
  /** Get logger */
  getLogger(): Logger;
  /** Get script context */
  getScriptContext(): ScriptContext;
  /** Dispose engine */
  dispose(): void;
}

/**
 * Engine factory interface
 */
export interface EngineFactory {
  /** Create new engine instance */
  create(config?: EngineConfig): DSLEngine;
  /** Get engine version */
  getVersion(): string;
  /** Get supported features */
  getFeatures(): string[];
}

/**
 * Engine plugin API
 */
export interface PluginAPI {
  /** Access to engine instance */
  engine: DSLEngine;
  /** Access to scene manager */
  sceneManager: any;
  /** Access to renderer */
  renderer: USDRenderer;
  /** Resource manager */
  resources: {
    load(path: string, type: string): Promise<any>;
    get(id: string): any;
    cache(id: string, resource: any): void;
  };
  /** Event system */
  events: {
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    emit(event: string, data?: any): void;
  };
  /** Utilities */
  utils: {
    uuid(): string;
    now(): number;
    clamp(value: number, min: number, max: number): number;
    lerp(start: number, end: number, t: number): number;
  };
}
