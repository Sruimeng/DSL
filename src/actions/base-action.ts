/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Base Action - 动作基类
 *
 * 所有动作的基类，定义了动作的基本结构和执行流程。
 */

import type { DSLEngine } from '../core';
import type { IAction, Params } from '../type';

/**
 * BaseAction 实现了 IAction 接口的基本功能
 * 提供了动作生命周期管理和错误处理的基础设施
 */
export abstract class BaseAction implements IAction {
  /** Action name */
  abstract name: string;
  /** Action description */
  description?: string;
  /** Action metadata */
  metadata?: {
    category?: string;
    icon?: string;
    shortcut?: string;
    permissions?: string[];
  };

  /** Engine reference */
  protected engine?: DSLEngine;
  /** Execution state */
  protected isExecuting: boolean = false;
  /** Execution history */
  protected history: Array<{
    timestamp: number;
    params?: Params;
    result?: unknown;
    error?: Error;
  }> = [];

  /**
   * Execute the action
   * @param engine DSL engine instance
   * @param params Action parameters
   */
  async execute(engine: DSLEngine, params?: Params): Promise<void> {
    if (this.isExecuting) {
      throw new Error(`Action ${this.name} is already executing`);
    }

    this.engine = engine;
    this.isExecuting = true;

    try {
      // Validate parameters
      if (!this.validate?.(params)) {
        throw new Error('Invalid parameters for action ' + this.name);
      }

      // Pre-execution hook
      await this.onBeforeExecute(params || {});

      // Execute the action
      const result = await this.onExecute(params || {});

      // Post-execution hook
      await this.onAfterExecute(params || {}, result);

      // Record successful execution
      this.recordExecution(params, result);

      console.log(`Action ${this.name} executed successfully`);
    } catch (error) {
      // Error handling
      await this.onError(error as Error, params);

      // Record failed execution
      this.recordExecution(params, undefined, error as Error);

      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Validate action parameters
   * @param params Action parameters
   */
  validate?(params: Params | undefined): boolean {
    // Base implementation always returns true
    // Override in subclasses to implement specific validation
    return true;
  }

  /**
   * Action execution logic - must be implemented by subclasses
   * @param params Action parameters
   */
  protected abstract onExecute(params: Params): Promise<unknown>;

  /**
   * Pre-execution hook
   * @param params Action parameters
   */
  protected async onBeforeExecute(params: Params): Promise<void> {
    // Base implementation does nothing
  }

  /**
   * Post-execution hook
   * @param params Action parameters
   * @param result Execution result
   */
  protected async onAfterExecute(params: Params, result: unknown): Promise<void> {
    // Base implementation does nothing
  }

  /**
   * Error handler
   * @param error Execution error
   * @param params Action parameters
   */
  protected async onError(error: Error, _params?: Params): Promise<void> {
    console.error(`Action ${this.name} failed:`, error);
  }

  /**
   * Record execution in history
   */
  private recordExecution(params?: Params, result?: unknown, error?: Error): void {
    this.history.push({
      timestamp: Date.now(),
      params,
      result,
      error,
    });

    // Limit history size
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Get execution history
   */
  getHistory(): Array<{
    timestamp: number;
    params?: Params;
    result?: unknown;
    error?: Error;
  }> {
    return [...this.history];
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Check if action is executing
   */
  isExecutingNow(): boolean {
    return this.isExecuting;
  }

  /**
   * Get action metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      ...this.metadata,
    };
  }

  /**
   * Cancel action execution (if supported)
   */
  async cancel(): Promise<void> {
    if (this.isExecuting) {
      // Override in subclasses to implement cancellation
      throw new Error(`Action ${this.name} does not support cancellation`);
    }
  }

  /**
   * Get action schema for parameter validation
   */
  getSchema(): Record<string, unknown> {
    // Override in subclasses to return JSON Schema for validation
    return {};
  }

  /**
   * Log debug message
   */
  protected debug(message: string, ...args: unknown[]): void {
    if (this.engine?.getLogger) {
      (this.engine.getLogger() as any).debug(`[${this.name}]`, message, ...args);
    } else {
      console.debug(`[${this.name}]`, message, ...args);
    }
  }

  /**
   * Log info message
   */
  protected info(message: string, ...args: unknown[]): void {
    if (this.engine?.getLogger) {
      (this.engine.getLogger() as any).info(`[${this.name}]`, message, ...args);
    } else {
      console.info(`[${this.name}]`, message, ...args);
    }
  }

  /**
   * Log warning message
   */
  protected warn(message: string, ...args: unknown[]): void {
    if (this.engine?.getLogger) {
      (this.engine.getLogger() as any).warn(`[${this.name}]`, message, ...args);
    } else {
      console.warn(`[${this.name}]`, message, ...args);
    }
  }

  /**
   * Log error message
   */
  protected error(message: string, ...args: unknown[]): void {
    if (this.engine?.getLogger) {
      (this.engine.getLogger() as any).error(`[${this.name}]`, message, ...args);
    } else {
      console.error(`[${this.name}]`, message, ...args);
    }
  }
}
