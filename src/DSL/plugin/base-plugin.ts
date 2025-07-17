import type { DSLAPI } from '../types';

export interface Plugin {
  name: string;
  version?: string;

  // 简化的生命周期
  install(api: DSLAPI): void;
  uninstall?(api: DSLAPI): void;

  // 命令注册
  commands?: Record<string, (...args: any[]) => any>;
}

export abstract class BasePlugin implements Plugin {
  abstract readonly name: string;
  readonly version?: string;

  protected api!: DSLAPI;

  install(api: DSLAPI): void {
    this.api = api;
    this.onInstall();
  }

  uninstall?(api: DSLAPI): void {
    this.onUninstall?.(api);
  }

  // 子类重写
  protected abstract onInstall(): void;
  protected onUninstall?(api: DSLAPI): void;
}
