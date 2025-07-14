import type { DSLAPI } from '../types';
import type { DSLPlugin, PluginCommand } from './plugin-manager';

export abstract class BasePlugin implements DSLPlugin {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description: string;

  readonly author?: string;
  readonly dependencies?: string[];
  readonly category?: DSLPlugin['category'];

  protected api!: DSLAPI;

  async onInstall(api: DSLAPI): Promise<void> {
    this.api = api;
    await this.install();
  }

  async onActivate(api: DSLAPI): Promise<void> {
    this.api = api;
    await this.activate();
  }

  async onDeactivate(api: DSLAPI): Promise<void> {
    await this.deactivate();
  }

  async onUninstall(api: DSLAPI): Promise<void> {
    await this.uninstall();
  }

  // 子类可以重写这些方法
  protected async install(): Promise<void> {}
  protected async activate(): Promise<void> {}
  protected async deactivate(): Promise<void> {}
  protected async uninstall(): Promise<void> {}

  // 便捷方法
  protected createCommand(
    command: Omit<PluginCommand, 'execute'> & {
      execute: (api: DSLAPI, ...args: any[]) => any;
    },
  ): PluginCommand {
    return {
      ...command,
      execute: command.execute,
    };
  }

  protected log(message: string, ...args: any[]): void {
    console.log(`[${this.name}] ${message}`, ...args);
  }

  protected error(message: string, ...args: any[]): void {
    console.error(`[${this.name}] ${message}`, ...args);
  }
}
