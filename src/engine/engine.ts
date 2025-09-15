import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type {
  DSLScene,
  DSLObject,
  DSLState,
  Command,
  ResourceManager,
  CommandHistory,
  DSLEngineOptions,
  SceneUpdateCallback,
  ObjectUpdateCallback,
  SelectionCallback,
  DSLPlugin,
  USDExportOptions,
  USDImportOptions,
  DSLObjectType,
  DSLComponent,
  DSLTransform
} from './types';
import type { USDScene } from '../USD/types/core';
import { USDSceneExporter } from './exporters/usd-exporter';
import { USDSceneImporter } from './importers/usd-importer';

export class DSLEngineImpl extends EventEmitter implements DSLEngine {
  public readonly version = '1.0.0';
  private _scene: DSLScene;
  private _state: DSLState;
  private _plugins: Map<string, DSLPlugin> = new Map();
  private _subscribers: Set<SceneUpdateCallback> = new Set();
  private _objectSubscribers: Map<string, Set<ObjectUpdateCallback>> = new Map();
  private _selectionSubscribers: Set<SelectionCallback> = new Set();
  private _options: DSLEngineOptions;
  private _isInitialized = false;

  constructor(options: DSLEngineOptions = {}) {
    super();
    this._options = {
      enableUndoRedo: true,
      maxUndoStackSize: 100,
      enableUSDIntegration: true,
      enablePerformanceMonitoring: false,
      ...options
    };

    // 初始化场景
    this._scene = this._createInitialScene();

    // 初始化状态
    this._state = {
      scene: this._scene,
      selectedObjects: [],
      hoveredObjects: [],
      commandHistory: {
        commands: [],
        currentIndex: -1,
        maxSize: this._options.maxUndoStackSize!
      },
      resources: {
        geometries: new Map(),
        materials: new Map(),
        textures: new Map()
      }
    };
  }

  get scene(): DSLScene {
    return this._scene;
  }

  get state(): DSLState {
    return this._state;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    // 初始化插件
    for (const plugin of this._plugins.values()) {
      plugin.initialize(this);
    }

    this._isInitialized = true;
    this.emit('initialized');
    this._notifySceneUpdate();
  }

  dispose(): void {
    // 销毁插件
    for (const plugin of this._plugins.values()) {
      plugin.destroy();
    }

    // 清理订阅
    this._subscribers.clear();
    this._objectSubscribers.clear();
    this._selectionSubscribers.clear();

    // 清理资源
    this._state.resources.geometries.clear();
    this._state.resources.materials.clear();
    this._state.resources.textures.clear();

    this._isInitialized = false;
    this.emit('disposed');
    this.removeAllListeners();
  }

  // Scene Management
  createObject(type: DSLObjectType, parentId?: string): string {
    const id = uuidv4();
    const object: DSLObject = {
      id,
      name: `${type}_${id.slice(0, 8)}`,
      type,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1]
      },
      visible: true,
      parent: parentId,
      children: [],
      components: new Map(),
      metadata: {}
    };

    this._scene.objects.set(id, object);

    // 设置父子关系
    if (parentId) {
      const parent = this._scene.objects.get(parentId);
      if (parent) {
        parent.children.push(id);
      }
    } else {
      this._scene.root.children.push(id);
      object.parent = this._scene.root.id;
    }

    this._notifyObjectUpdate(id);
    this._notifySceneUpdate();
    return id;
  }

  getObject(id: string): DSLObject | undefined {
    return this._scene.objects.get(id);
  }

  updateObject(id: string, changes: Partial<DSLObject>): void {
    const object = this._scene.objects.get(id);
    if (!object) return;

    // 创建命令
    const command: Command = {
      id: uuidv4(),
      name: `Update ${object.name}`,
      timestamp: Date.now(),
      execute: () => {
        Object.assign(object, changes);
        this._notifyObjectUpdate(id);
        this._notifySceneUpdate();
      },
      undo: () => {
        // 恢复原始值
        Object.keys(changes).forEach(key => {
          if (key in object) {
            (object as any)[key] = (object as any)[`__old_${key}`];
            delete (object as any)[`__old_${key}`];
          }
        });
        this._notifyObjectUpdate(id);
        this._notifySceneUpdate();
      },
      redo: () => {
        Object.assign(object, changes);
        this._notifyObjectUpdate(id);
        this._notifySceneUpdate();
      }
    };

    // 保存旧值
    Object.keys(changes).forEach(key => {
      (object as any)[`__old_${key}`] = (object as any)[key];
    });

    this.executeCommand(command);
  }

  deleteObject(id: string): void {
    const object = this._scene.objects.get(id);
    if (!object) return;

    // 不能删除根节点
    if (id === this._scene.root.id) return;

    // 递归删除子对象
    const children = [...object.children];
    children.forEach(childId => this.deleteObject(childId));

    // 从父对象中移除
    if (object.parent) {
      const parent = this._scene.objects.get(object.parent);
      if (parent) {
        parent.children = parent.children.filter(childId => childId !== id);
      }
    }

    // 从选择列表中移除
    this._state.selectedObjects = this._state.selectedObjects.filter(selectedId => selectedId !== id);

    // 删除对象
    this._scene.objects.delete(id);

    this._notifySelectionUpdate();
    this._notifySceneUpdate();
  }

  duplicateObject(id: string): string {
    const object = this._scene.objects.get(id);
    if (!object) return '';

    const newId = uuidv4();
    const duplicated: DSLObject = {
      ...object,
      id: newId,
      name: `${object.name}_copy`,
      children: [],
      components: new Map(object.components)
    };

    this._scene.objects.set(newId, duplicated);

    // 添加到同一父对象
    if (object.parent) {
      const parent = this._scene.objects.get(object.parent);
      if (parent) {
        parent.children.push(newId);
      }
    }

    // 递归复制子对象
    object.children.forEach(childId => {
      const childNewId = this.duplicateObject(childId);
      if (childNewId) {
        const child = this._scene.objects.get(childNewId);
        if (child) {
          child.parent = newId;
        }
        duplicated.children.push(childNewId);
      }
    });

    this._notifyObjectUpdate(newId);
    this._notifySceneUpdate();
    return newId;
  }

  reparentObject(id: string, newParentId?: string): void {
    const object = this._scene.objects.get(id);
    if (!object) return;

    // 从旧父对象移除
    if (object.parent) {
      const oldParent = this._scene.objects.get(object.parent);
      if (oldParent) {
        oldParent.children = oldParent.children.filter(childId => childId !== id);
      }
    }

    // 添加到新父对象
    if (newParentId) {
      const newParent = this._scene.objects.get(newParentId);
      if (newParent) {
        newParent.children.push(id);
        object.parent = newParentId;
      }
    } else {
      // 移动到根节点
      this._scene.root.children.push(id);
      object.parent = this._scene.root.id;
    }

    this._notifyObjectUpdate(id);
    this._notifySceneUpdate();
  }

  // Component Management
  addComponent(objectId: string, component: DSLComponent): void {
    const object = this._scene.objects.get(objectId);
    if (!object) return;

    object.components.set(component.id, component);
    this._notifyObjectUpdate(objectId);
    this._notifySceneUpdate();
  }

  updateComponent(objectId: string, componentId: string, data: any): void {
    const object = this._scene.objects.get(objectId);
    if (!object) return;

    const component = object.components.get(componentId);
    if (!component) return;

    component.data = data;
    this._notifyObjectUpdate(objectId);
    this._notifySceneUpdate();
  }

  removeComponent(objectId: string, componentId: string): void {
    const object = this._scene.objects.get(objectId);
    if (!object) return;

    object.components.delete(componentId);
    this._notifyObjectUpdate(objectId);
    this._notifySceneUpdate();
  }

  getComponent(objectId: string, componentId: string): DSLComponent | undefined {
    const object = this._scene.objects.get(objectId);
    if (!object) return undefined;
    return object.components.get(componentId);
  }

  // Selection
  selectObject(id: string | string[], append = false): void {
    const ids = Array.isArray(id) ? id : [id];

    if (!append) {
      this._state.selectedObjects = [];
    }

    ids.forEach(objectId => {
      if (this._scene.objects.has(objectId) && !this._state.selectedObjects.includes(objectId)) {
        this._state.selectedObjects.push(objectId);
      }
    });

    this._notifySelectionUpdate();
  }

  deselectObject(id: string | string[]): void {
    const ids = Array.isArray(id) ? id : [id];

    this._state.selectedObjects = this._state.selectedObjects.filter(
      selectedId => !ids.includes(selectedId)
    );

    this._notifySelectionUpdate();
  }

  clearSelection(): void {
    this._state.selectedObjects = [];
    this._notifySelectionUpdate();
  }

  getSelectedObjects(): DSLObject[] {
    return this._state.selectedObjects
      .map(id => this._scene.objects.get(id))
      .filter(Boolean) as DSLObject[];
  }

  // Command System
  executeCommand(command: Command): void {
    if (!this._options.enableUndoRedo) {
      command.execute();
      return;
    }

    // 移除当前索引之后的历史记录
    this._state.commandHistory.commands = this._state.commandHistory.commands.slice(
      0,
      this._state.commandHistory.currentIndex + 1
    );

    // 添加新命令
    this._state.commandHistory.commands.push(command);
    this._state.commandHistory.currentIndex++;

    // 限制历史记录大小
    if (this._state.commandHistory.commands.length > this._state.commandHistory.maxSize) {
      this._state.commandHistory.commands.shift();
      this._state.commandHistory.currentIndex--;
    }

    // 执行命令
    command.execute();
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const command = this._state.commandHistory.commands[this._state.commandHistory.currentIndex];
    command.undo();
    this._state.commandHistory.currentIndex--;

    this.emit('undo', command);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this._state.commandHistory.currentIndex++;
    const command = this._state.commandHistory.commands[this._state.commandHistory.currentIndex];
    command.redo();

    this.emit('redo', command);
    return true;
  }

  canUndo(): boolean {
    return this._state.commandHistory.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this._state.commandHistory.currentIndex < this._state.commandHistory.commands.length - 1;
  }

  // Events
  subscribe(callback: SceneUpdateCallback): () => void {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  subscribeToObject(id: string, callback: ObjectUpdateCallback): () => void {
    if (!this._objectSubscribers.has(id)) {
      this._objectSubscribers.set(id, new Set());
    }
    this._objectSubscribers.get(id)!.add(callback);
    return () => {
      const callbacks = this._objectSubscribers.get(id);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this._objectSubscribers.delete(id);
        }
      }
    };
  }

  subscribeToSelection(callback: SelectionCallback): () => void {
    this._selectionSubscribers.add(callback);
    return () => this._selectionSubscribers.delete(callback);
  }

  // USD Integration
  async exportToUSD(options: USDExportOptions = {}): Promise<USDScene> {
    const exporter = new USDSceneExporter();
    return exporter.export(this._scene, options);
  }

  async importFromUSD(usdScene: USDScene, options: USDImportOptions = {}): Promise<void> {
    const importer = new USDSceneImporter();
    const dslScene = await importer.import(usdScene, options);

    // 替换当前场景
    this._scene = dslScene;
    this._state.scene = dslScene;

    this._notifySceneUpdate();
  }

  syncWithUSD(usdScene: USDScene): void {
    // 实现增量同步逻辑
    // TODO: 实现更智能的同步算法
  }

  // Resources
  loadGeometry(id: string, geometry: any): void {
    this._state.resources.geometries.set(id, geometry);
  }

  loadMaterial(id: string, material: any): void {
    this._state.resources.materials.set(id, material);
  }

  loadTexture(id: string, texture: any): void {
    this._state.resources.textures.set(id, texture);
  }

  // Plugins
  registerPlugin(plugin: DSLPlugin): void {
    if (this._plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this._plugins.set(plugin.name, plugin);
    if (this._isInitialized) {
      plugin.initialize(this);
    }
  }

  unregisterPlugin(name: string): void {
    const plugin = this._plugins.get(name);
    if (plugin) {
      plugin.destroy();
      this._plugins.delete(name);
    }
  }

  // Private methods
  private _createInitialScene(): DSLScene {
    const rootId = uuidv4();
    const root: DSLObject = {
      id: rootId,
      name: 'Root',
      type: 'group',
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1]
      },
      visible: true,
      children: [],
      components: new Map(),
      metadata: {}
    };

    return {
      id: uuidv4(),
      name: 'DSL Scene',
      objects: new Map([[rootId, root]]),
      root,
      metadata: {}
    };
  }

  private _notifySceneUpdate(): void {
    this._subscribers.forEach(callback => callback(this._scene));
    this.emit('sceneUpdate', this._scene);
  }

  private _notifyObjectUpdate(id: string): void {
    const object = this._scene.objects.get(id);
    if (object) {
      const callbacks = this._objectSubscribers.get(id);
      if (callbacks) {
        callbacks.forEach(callback => callback(object));
      }
    }
    this.emit('objectUpdate', id, object);
  }

  private _notifySelectionUpdate(): void {
    this._selectionSubscribers.forEach(callback => callback(this._state.selectedObjects));
    this.emit('selectionUpdate', this._state.selectedObjects);
  }
}

// Export factory function
export function createDSLEngine(options?: DSLEngineOptions): DSLEngine {
  return new DSLEngineImpl(options);
}