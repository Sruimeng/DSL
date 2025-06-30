// DSL引擎核心实现 - 框架无关的状态管理引擎
import { Vector3 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils.js';
import {
  ActionTypes,
  type DSLAction,
  type DSLScene,
  type Environment,
  type Light,
  type MaterialInline,
  type SceneObject,
} from '../types';

/**
 * 历史记录条目 - 使用状态快照而非逆操作
 */
interface HistoryEntry {
  action: DSLAction;
  beforeState: DSLScene; // action执行前的完整状态
  afterState: DSLScene; // action执行后的完整状态
  timestamp: number;
}

/**
 * 深度克隆，保持Three.js对象类型
 */
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Vector3) {
    return new Vector3(obj.x, obj.y, obj.z);
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * 创建默认场景
 */
function createDefaultScene(partial?: Partial<DSLScene>): DSLScene {
  const now = Date.now();

  return {
    id: generateUUID(),
    name: 'Untitled Scene',
    objects: [],
    materials: [
      {
        id: 'default',
        name: 'Default Material',
        type: 'standard',
        color: '#ffffff',
        metalness: 0,
        roughness: 0.5,
        opacity: 1,
      },
    ],
    lights: [
      {
        id: 'ambient-light',
        type: 'ambient',
        name: 'Ambient Light',
        color: '#404040',
        intensity: 0.4,
      },
      {
        id: 'directional-light',
        type: 'directional',
        name: 'Directional Light',
        color: '#ffffff',
        intensity: 0.8,
        position: new Vector3(5, 10, 5),
        target: new Vector3(0, 0, 0),
        castShadow: true,
      },
    ],
    camera: {
      type: 'perspective',
      position: new Vector3(5, 5, 5),
      target: new Vector3(0, 0, 0),
      fov: 75,
      near: 0.1,
      far: 1000,
    },
    environment: {
      background: { type: 'color', color: '#f0f0f0' },
    },
    selection: [],
    metadata: {
      version: '1.0.0',
      created: now,
      modified: now,
    },
    ...partial,
  };
}

/**
 * 计算对象大小（用于内存统计）
 */
function calculateObjectSize(obj: any): number {
  const seen = new WeakSet();

  function getSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'boolean') return 4;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'string') return obj.length * 2;

    if (typeof obj === 'object') {
      if (seen.has(obj)) return 0;
      seen.add(obj);

      let size = 0;
      if (Array.isArray(obj)) {
        size = obj.reduce((acc, item) => acc + getSize(item), 0);
      } else {
        size = Object.keys(obj).reduce((acc, key) => {
          return acc + key.length * 2 + getSize(obj[key]);
        }, 0);
      }
      return size;
    }

    return 0;
  }

  return getSize(obj);
}

/**
 * DSL引擎类 - 使用改进的状态快照式undo/redo系统
 */
export class DSLEngine {
  private scene: DSLScene;
  private listeners: Set<(scene: DSLScene) => void> = new Set();

  // 改进的历史记录系统
  private actionHistory: HistoryEntry[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50; // 减少内存占用
  private isUndoRedoing = false; // 防止undo/redo操作被记录到历史

  constructor(initialScene?: Partial<DSLScene>) {
    this.scene = createDefaultScene(initialScene);
  }

  private isDescendant(scene: DSLScene, ancestorId: string, nodeId: string): boolean {
    const node = scene.objects.find((obj) => obj.id === nodeId);
    if (!node || !node.parent) return false;

    if (node.parent === ancestorId) return true;

    return this.isDescendant(scene, ancestorId, node.parent);
  }

  /**
   * 执行Action - 改进版本，使用状态快照
   */
  dispatch(action: DSLAction): void {
    // 记录执行前的状态（深拷贝）
    const beforeState = !this.isUndoRedoing ? deepClone(this.scene) : null;

    // 执行action
    const newScene = this.reduce(this.scene, action);

    if (newScene !== this.scene) {
      // 更新场景
      this.scene = newScene;

      // 只有在非undo/redo操作时才保存到历史
      if (!this.isUndoRedoing && beforeState) {
        this.saveActionToHistory(action, beforeState, this.scene);
      }

      // 通知所有监听器
      this.notifyListeners();
    }
  }

  // 获取当前状态
  getScene(): DSLScene {
    return this.scene;
  }

  // 监听状态变化
  subscribe(listener: (scene: DSLScene) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Action处理器
  private reduce(scene: DSLScene, action: DSLAction): DSLScene {
    switch (action.type) {
      case 'ADD_OBJECT': {
        // 优先使用payload中的ID，如果没有则生成新的
        const objectId = action.payload.id || generateUUID();
        const object: SceneObject = {
          ...action.payload,
          id: objectId,
          name: action.payload.name || `Object_${objectId}`,
          type: action.payload.type || 'mesh',
          transform: {
            position: new Vector3(0, 0, 0),
            rotation: new Vector3(0, 0, 0),
            scale: new Vector3(1, 1, 1),
            ...action.payload.transform,
          },
          parent: action.payload.parent,
          visible: action.payload.visible ?? true,
          castShadow: action.payload.castShadow ?? false,
          receiveShadow: action.payload.receiveShadow ?? false,
        };

        return {
          ...scene,
          objects: [...scene.objects, object],
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'UPDATE_OBJECT': {
        const { id, changes } = action.payload;
        const objectIndex = scene.objects.findIndex((obj) => obj.id === id);
        if (objectIndex === -1) return scene;

        const updatedObjects = [...scene.objects];
        updatedObjects[objectIndex] = { ...updatedObjects[objectIndex], ...changes };

        return {
          ...scene,
          objects: updatedObjects,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'REMOVE_OBJECT': {
        const { id } = action.payload;
        const filteredObjects = scene.objects.filter((obj) => obj.id !== id);

        return {
          ...scene,
          objects: filteredObjects,
          selection: scene.selection.filter((selectedId) => selectedId !== id),
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'DUPLICATE_OBJECT': {
        const { id } = action.payload;
        const original = scene.objects.find((obj) => obj.id === id);
        if (!original) return scene;

        const newId = generateUUID();
        const duplicated: SceneObject = {
          ...original,
          id: newId,
          name: `${original.name}_Copy`,
          transform: {
            ...original.transform,
            position: new Vector3(
              (original.transform.position?.x || 0) + 1,
              (original.transform.position?.y || 0) + 1,
              (original.transform.position?.z || 0) + 1,
            ),
          },
        };

        return {
          ...scene,
          objects: [...scene.objects, duplicated],
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'MOVE_OBJECT': {
        const { id, parentId, index } = action.payload;
        const objects = [...scene.objects];
        const targetObj = objects.find((obj) => obj.id === id);

        if (!targetObj) return scene;

        // 防止将对象移动到自己的子节点中（避免循环引用）
        if (parentId && this.isDescendant(scene, parentId, id)) {
          return scene;
        }

        // 移除目标对象从旧的父节点的children中
        if (targetObj.parent) {
          const oldParent = objects.find((obj) => obj.id === targetObj.parent);
          if (oldParent && oldParent.children) {
            oldParent.children = oldParent.children.filter((childId) => childId !== id);
          }
        }

        // 更新目标对象的parent
        targetObj.parent = parentId;

        // 将目标对象添加到新的父节点的children中
        if (parentId) {
          const newParent = objects.find((obj) => obj.id === parentId);
          if (newParent) {
            if (!newParent.children) {
              newParent.children = [];
            }

            // 如果指定了index，插入到指定位置，否则添加到末尾
            if (index !== undefined && index >= 0 && index <= newParent.children.length) {
              newParent.children.splice(index, 0, id);
            } else {
              newParent.children.push(id);
            }
          }
        }

        return {
          ...scene,
          objects,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'REORDER_CHILDREN': {
        const { parentId, childIds } = action.payload;
        const objects = [...scene.objects];
        const parent = objects.find((obj) => obj.id === parentId);

        if (!parent) return scene;

        // 验证所有childIds都是当前parent的子节点
        const currentChildren = parent.children || [];
        const validChildIds = childIds.filter((id) => currentChildren.includes(id));

        // 更新parent的children顺序
        parent.children = validChildIds;

        return {
          ...scene,
          objects,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'ADD_MATERIAL': {
        // 优先使用payload中的ID，如果没有则生成新的
        const materialId = action.payload.id || generateUUID();
        const material: MaterialInline = {
          id: materialId,
          name: action.payload.name || `Material_${materialId}`,
          type: action.payload.type || 'standard',
          color: action.payload.color || '#ffffff',
          metalness: action.payload.metalness ?? 0,
          roughness: action.payload.roughness ?? 0.5,
          opacity: action.payload.opacity ?? 1,
          ...action.payload,
        };

        return {
          ...scene,
          materials: [...scene.materials, material],
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'UPDATE_MATERIAL': {
        const { id, changes } = action.payload;
        const materialIndex = scene.materials.findIndex((mat) => mat.id === id);
        if (materialIndex === -1) return scene;

        const updatedMaterials = [...scene.materials];
        updatedMaterials[materialIndex] = { ...updatedMaterials[materialIndex], ...changes };

        return {
          ...scene,
          materials: updatedMaterials,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'APPLY_MATERIAL': {
        const { objectIds, materialId } = action.payload;
        const objects = scene.objects.map((obj) =>
          objectIds.includes(obj.id) ? { ...obj, material: { id: materialId } } : obj,
        );

        return {
          ...scene,
          objects,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'ADD_LIGHT': {
        const lightId = action.payload.id || generateUUID();
        const light: Light = {
          id: lightId,
          name: action.payload.name || `Light_${lightId}`,
          type: action.payload.type || 'directional',
          color: action.payload.color || '#ffffff',
          intensity: action.payload.intensity ?? 1,
          ...action.payload,
        };

        return {
          ...scene,
          lights: [...scene.lights, light],
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'UPDATE_LIGHT': {
        const { id, changes } = action.payload;
        const lightIndex = scene.lights.findIndex((light) => light.id === id);
        if (lightIndex === -1) return scene;

        const updatedLights = [...scene.lights];
        updatedLights[lightIndex] = { ...updatedLights[lightIndex], ...changes };

        return {
          ...scene,
          lights: updatedLights,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'REMOVE_LIGHT': {
        const { id } = action.payload;
        const filteredLights = scene.lights.filter((light) => light.id !== id);

        return {
          ...scene,
          lights: filteredLights,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'UPDATE_CAMERA': {
        const updatedCamera = { ...scene.camera, ...action.payload };

        return {
          ...scene,
          camera: updatedCamera,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'UPDATE_ENVIRONMENT': {
        const updatedEnvironment = { ...scene.environment, ...action.payload };

        return {
          ...scene,
          environment: updatedEnvironment,
          metadata: { ...scene.metadata, modified: Date.now() },
        };
      }

      case 'SELECT': {
        const { ids, mode = 'set' } = action.payload;
        let newSelection: string[];

        switch (mode) {
          case 'add':
            newSelection = [...new Set([...scene.selection, ...ids])];
            break;
          case 'toggle':
            newSelection = scene.selection.slice();
            ids.forEach((id) => {
              const index = newSelection.indexOf(id);
              if (index >= 0) {
                newSelection.splice(index, 1);
              } else {
                newSelection.push(id);
              }
            });
            break;
          case 'set':
          default:
            newSelection = [...ids];
            break;
        }

        return {
          ...scene,
          selection: newSelection,
        };
      }

      case 'CLEAR_SELECTION': {
        return {
          ...scene,
          selection: [],
        };
      }

      case 'RESET_SCENE': {
        return createDefaultScene();
      }

      case 'LOAD_SCENE': {
        return { ...action.payload };
      }

      default:
        return scene;
    }
  }

  /**
   * 保存Action到历史记录 - 使用状态快照
   */
  private saveActionToHistory(
    action: DSLAction,
    beforeState: DSLScene,
    afterState: DSLScene,
  ): void {
    // 清除当前位置之后的历史（用户执行了新操作）
    if (this.historyIndex < this.actionHistory.length - 1) {
      this.actionHistory = this.actionHistory.slice(0, this.historyIndex + 1);
    }

    // 添加新的历史条目
    const entry: HistoryEntry = {
      action,
      beforeState,
      afterState: deepClone(afterState),
      timestamp: Date.now(),
    };

    this.actionHistory.push(entry);
    this.historyIndex++;

    // 限制历史记录大小
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
      this.historyIndex--;
    }

    console.log('💾 Action已保存到历史:', {
      action: action.type,
      historyLength: this.actionHistory.length,
      currentIndex: this.historyIndex,
    });
  }

  /**
   * 撤销操作 - 改进版本
   */
  undo(): boolean {
    if (!this.canUndo()) {
      console.log('⚠️ 无法撤销：没有可撤销的操作');
      return false;
    }

    const entry = this.actionHistory[this.historyIndex];
    this.historyIndex--;

    // 标记为undo/redo操作，防止递归记录
    this.isUndoRedoing = true;

    // 直接恢复到执行action前的状态
    this.scene = deepClone(entry.beforeState);
    this.notifyListeners();

    this.isUndoRedoing = false;

    console.log('↶ 撤销成功:', {
      action: entry.action.type,
      timestamp: new Date(entry.timestamp).toLocaleTimeString(),
      currentIndex: this.historyIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    return true;
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    if (!this.canRedo()) {
      console.log('⚠️ 无法重做：没有可重做的操作');
      return false;
    }

    this.historyIndex++;
    const entry = this.actionHistory[this.historyIndex];
    console.log('🔄 重做操作:', entry);

    // 标记为undo/redo操作，防止递归记录
    this.isUndoRedoing = true;

    // 直接恢复到执行action后的状态
    this.scene = deepClone(entry.afterState);
    this.notifyListeners();

    this.isUndoRedoing = false;

    console.log('↷ 重做成功:', {
      action: entry.action.type,
      timestamp: new Date(entry.timestamp).toLocaleTimeString(),
      currentIndex: this.historyIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    return true;
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.historyIndex < this.actionHistory.length - 1;
  }

  /**
   * 获取历史统计信息
   */
  getHistoryStats() {
    const totalMemoryKB =
      this.actionHistory.reduce((acc, entry) => {
        return acc + calculateObjectSize(entry.beforeState) + calculateObjectSize(entry.afterState);
      }, 0) / 1024;

    const recentActions = this.actionHistory.slice(-5).map((entry) => ({
      type: entry.action.type,
      timestamp: entry.timestamp,
    }));

    return {
      totalActions: this.actionHistory.length,
      currentIndex: this.historyIndex,
      maxSize: this.maxHistorySize,
      memoryUsageKB: Math.round(totalMemoryKB),
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      recentActions,
    };
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.scene));
  }

  // === 便利方法 ===
  addObject(object: Partial<SceneObject>): string {
    const id = object.id || generateUUID();
    this.dispatch({ type: ActionTypes.ADD_OBJECT, payload: { ...object, id } });
    return id;
  }

  updateObject(id: string, changes: Partial<SceneObject>): void {
    this.dispatch({ type: ActionTypes.UPDATE_OBJECT, payload: { id, changes } });
  }

  removeObject(id: string): void {
    this.dispatch({ type: ActionTypes.REMOVE_OBJECT, payload: { id } });
  }

  selectObjects(ids: string[], mode: 'set' | 'add' | 'toggle' = 'set'): void {
    this.dispatch({ type: ActionTypes.SELECT, payload: { ids, mode } });
  }

  clearSelection(): void {
    this.dispatch({ type: ActionTypes.CLEAR_SELECTION });
  }

  addMaterial(material: Partial<MaterialInline>): string {
    const id = material.id || generateUUID();
    this.dispatch({ type: ActionTypes.ADD_MATERIAL, payload: { ...material, id } });
    return id;
  }

  applyMaterial(objectIds: string[], materialId: string): void {
    this.dispatch({ type: ActionTypes.APPLY_MATERIAL, payload: { objectIds, materialId } });
  }

  updateEnvironment(changes: Partial<Environment>): void {
    this.dispatch({ type: ActionTypes.UPDATE_ENVIRONMENT, payload: changes });
  }

  // === 查询方法 ===
  getObject(id: string): SceneObject | null {
    return this.scene.objects.find((obj) => obj.id === id) || null;
  }

  getSelectedObjects(): SceneObject[] {
    return this.scene.objects.filter((obj) => this.scene.selection.includes(obj.id));
  }

  // 按条件查找对象
  findObjects(predicate: (obj: SceneObject) => boolean): SceneObject[] {
    return this.scene.objects.filter(predicate);
  }

  // 导出完整场景
  exportScene(): DSLScene {
    return deepClone(this.scene);
  }

  // 导入场景
  importScene(scene: DSLScene): void {
    this.dispatch({ type: ActionTypes.LOAD_SCENE, payload: scene });
  }
}
