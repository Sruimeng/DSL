/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Base Plugin - 插件基类
 *
 * 所有插件的基类，定义了插件的基本结构和生命周期方法。
 */

import type * as THREE from 'three';
import type { DSLEngine } from '../core/DSL-engine';
import type { IPlugin } from '../type';

/**
 * BasePlugin 实现了 IPlugin 接口的基本功能
 * 提供了插件生命周期管理和事件处理的基础设施
 */
export abstract class BasePlugin implements IPlugin {
  /** Plugin name */
  abstract name: string;
  /** Plugin version */
  abstract version: string;
  /** Plugin description */
  description?: string;
  /** Plugin dependencies */
  dependencies?: string[];

  /** Engine reference */
  protected engine?: DSLEngine;
  /** Whether the plugin is enabled */
  protected enabled: boolean = false;
  /** Plugin state */
  protected state: Record<string, unknown> = {};

  /**
   * Called when plugin is registered
   * @param engine Engine instance with scene, camera and renderer
   */
  onRegister(engine: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
  }): void {
    this.enabled = true;
    // Store engine reference for internal use
    this.engine = engine as any;
    console.log(`Plugin ${this.name} v${this.version} registered`);
  }

  /**
   * Called when plugin is unregistered
   */
  onUnregister?(): void {
    this.enabled = false;
    this.engine = undefined;
    console.log(`Plugin ${this.name} unregistered`);
  }

  /**
   * Update method called each frame
   * @param deltaTime Time since last frame in seconds
   */
  update?(_deltaTime: number): void {
    // Base implementation does nothing
  }

  /**
   * Scene lifecycle callbacks
   */
  onSceneInit?(scene: THREE.Scene): void {
    // Base implementation does nothing
  }

  onObjectAdded?(object: THREE.Object3D): void {
    // Base implementation does nothing
  }

  onObjectRemoved?(object: THREE.Object3D): void {
    // Base implementation does nothing
  }

  onRenderStart?(): void {
    // Base implementation does nothing
  }

  onRenderEnd?(): void {
    // Base implementation does nothing
  }

  /**
   * Plugin lifecycle methods
   */
  lifecycle?: {
    onInit?(): void;
    onStart?(): void;
    onPause?(): void;
    onResume?(): void;
    onStop?(): void;
    onDestroy?(): void;
  };

  /**
   * Enable the plugin
   */
  enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      this.lifecycle?.onStart?.();
    }
  }

  /**
   * Disable the plugin
   */
  disable(): void {
    if (this.enabled) {
      this.enabled = false;
      this.lifecycle?.onStop?.();
    }
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get plugin state
   */
  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  /**
   * Set plugin state
   */
  setState(state: Record<string, unknown>): void {
    this.state = { ...this.state, ...state };
  }

  /**
   * Log debug message
   */
  protected debug(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.debug(`[${this.name}]`, message, ...args);
    }
  }

  /**
   * Log info message
   */
  protected info(message: string, ...args: unknown[]): void {
    console.info(`[${this.name}]`, message, ...args);
  }

  /**
   * Log warning message
   */
  protected warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.name}]`, message, ...args);
  }

  /**
   * Log error message
   */
  protected error(message: string, ...args: unknown[]): void {
    console.error(`[${this.name}]`, message, ...args);
  }
}
