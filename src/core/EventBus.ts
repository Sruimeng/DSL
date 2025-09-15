/**
 * EventBus - 事件总线
 *
 * 提供事件发布和订阅机制，用于模块间通信。
 */

import type { IEventData, IEventHandler } from '../type';

/**
 * 事件处理器包装器
 */
interface EventHandlerWrapper<T extends IEventData> {
  handler: IEventHandler<T>;
  once: boolean;
}

/**
 * EventBus 实现发布-订阅模式的事件系统
 */
export class EventBus {
  private eventHandlers: Map<string, EventHandlerWrapper<IEventData>[]> = new Map();
  private maxListeners: number = 100;
  private warningsShown: Set<string> = new Set();

  /**
   * 创建 EventBus 实例
   * @param maxListeners 最大监听器数量
   */
  constructor(maxListeners?: number) {
    if (maxListeners !== undefined) {
      this.maxListeners = maxListeners;
    }
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns this 支持链式调用
   */
  public on<T extends IEventData>(event: string, handler: IEventHandler<T>): this {
    return this.addListener(event, handler, false);
  }

  /**
   * 订阅一次性事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns this 支持链式调用
   */
  public once<T extends IEventData>(event: string, handler: IEventHandler<T>): this {
    return this.addListener(event, handler, true);
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns this 支持链式调用
   */
  public off<T extends IEventData>(event: string, handler: IEventHandler<T>): this {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.findIndex((wrapper) => wrapper.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);

        // 如果没有监听器了，删除事件
        if (handlers.length === 0) {
          this.eventHandlers.delete(event);
        }
      }
    }
    return this;
  }

  /**
   * 发送事件
   * @param event 事件名称
   * @param data 事件数据
   * @returns boolean 是否有监听器处理了此事件
   */
  public emit<T extends IEventData>(event: string, data: T): boolean {
    const handlers = this.eventHandlers.get(event);
    if (!handlers || handlers.length === 0) {
      return false;
    }

    // 复制一份监听器数组，防止在执行过程中修改
    const handlersCopy = [...handlers];

    for (let i = 0; i < handlersCopy.length; i++) {
      const wrapper = handlersCopy[i];

      try {
        // 执行处理器
        wrapper.handler(data);

        // 如果是一次性监听器，移除它
        if (wrapper.once) {
          this.off(event, wrapper.handler);
        }
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    }

    return true;
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件名称
   * @returns number 监听器数量
   */
  public listenerCount(event: string): number {
    const handlers = this.eventHandlers.get(event);
    return handlers ? handlers.length : 0;
  }

  /**
   * 获取所有事件名称
   * @returns string[] 事件名称数组
   */
  public eventNames(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * 获取指定事件的所有监听器
   * @param event 事件名称
   * @returns IEventHandler[] 监听器数组
   */
  public listeners<T extends IEventData>(event: string): IEventHandler<T>[] {
    const handlers = this.eventHandlers.get(event);
    return handlers ? handlers.map((wrapper) => wrapper.handler) : [];
  }

  /**
   * 移除所有监听器或指定事件的所有监听器
   * @param event 可选的事件名称
   * @returns this 支持链式调用
   */
  public removeAllListeners(event?: string): this {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
    return this;
  }

  /**
   * 添加监听器（内部方法）
   * @param event 事件名称
   * @param handler 事件处理器
   * @param once 是否是一次性监听
   * @returns this 支持链式调用
   */
  private addListener<T extends IEventData>(
    event: string,
    handler: IEventHandler<T>,
    once: boolean,
  ): this {
    // 检查监听器数量限制
    const currentCount = this.listenerCount(event);
    if (currentCount >= this.maxListeners) {
      const warningKey = `${event}_max_listeners`;
      if (!this.warningsShown.has(warningKey)) {
        console.warn(
          `Possible memory leak detected. ${currentCount} listeners added for event '${event}'. ` +
            `Use emitter.setMaxListeners() to increase limit`,
        );
        this.warningsShown.add(warningKey);
      }
      return this;
    }

    // 获取或创建监听器数组
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = [];
      this.eventHandlers.set(event, handlers);
    }

    // 添加监听器
    handlers.push({
      handler: handler as IEventHandler<IEventData>,
      once,
    });

    return this;
  }

  /**
   * 设置最大监听器数量
   * @param n 最大数量
   * @returns this 支持链式调用
   */
  public setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  /**
   * 获取最大监听器数量
   * @returns number 最大数量
   */
  public getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * 销毁事件总线，清理所有资源
   */
  public destroy(): void {
    this.removeAllListeners();
    this.warningsShown.clear();
  }
}

// 创建全局事件总线实例
export const globalEventBus = new EventBus();
