import { EventEmitter } from 'eventemitter3';
import { AttributeResolver } from './resolvers/attribute-resolver';
import { CompositionResolver } from './resolvers/composition-resolver';
import {
  SdfPath as SdfPathClass,
  type EditContext,
  type PrimPredicate,
  type SdfLayer,
  type SdfPath,
  type StageOperation,
  type UsdPrim,
  type UsdPrimType,
  type UsdStage,
} from './types';

/**
 * USD Stage实现 - 场景图的核心容器
 */
export class UsdStageImpl extends EventEmitter implements UsdStage {
  rootLayer: SdfLayer;
  sessionLayer?: SdfLayer;
  currentTime: number = 0;
  timeCodesPerSecond: number = 24;
  framesPerSecond: number = 24;
  metadata: Record<string, any> = {};

  private primCache: Map<string, UsdPrim> = new Map();
  private attributeResolver: AttributeResolver;
  private compositionResolver: CompositionResolver;
  private editContextStack: EditContext[] = [];
  private mutedLayers: Set<string> = new Set();
  private subLayers: Map<string, SdfLayer> = new Map();

  constructor(rootLayer: SdfLayer) {
    super();
    this.rootLayer = rootLayer;
    this.attributeResolver = new AttributeResolver(this);
    this.compositionResolver = new CompositionResolver(this);
    this.initializeCache();
  }

  /**
   * 初始化Prim缓存
   */
  private initializeCache(): void {
    this.primCache.clear();
    this.cacheLayerPrims(this.rootLayer);
    if (this.sessionLayer) {
      this.cacheLayerPrims(this.sessionLayer);
    }
  }

  /**
   * 缓存图层中的Prim
   */
  private cacheLayerPrims(layer: SdfLayer): void {
    for (const prim of layer.rootPrims) {
      this.cachePrimRecursively(prim);
    }
  }

  /**
   * 递归缓存Prim
   */
  private cachePrimRecursively(prim: UsdPrim): void {
    this.primCache.set(prim.path.pathString, prim);
    // 递归处理子Prim
    const children = this.getChildren(prim.path);
    for (const child of children) {
      this.cachePrimRecursively(child);
    }
  }

  /**
   * 定义新的Prim
   */
  definePrim(path: SdfPath, typeName?: UsdPrimType): UsdPrim | null {
    if (!path.isAbsolute) {
      console.error('Prim路径必须是绝对的');
      return null;
    }

    // 检查是否已存在
    if (this.hasPrim(path)) {
      return this.getPrimAtPath(path);
    }

    // 确保父Prim存在
    const parentPath = path.parentPath;
    if (!parentPath.isPrimPath || (!this.hasPrim(parentPath) && parentPath.pathString !== '/')) {
      console.error('父Prim不存在:', parentPath.pathString);
      return null;
    }

    // 创建新的Prim
    const prim: UsdPrim = {
      path,
      typeName: typeName || 'Xform',
      specifier: 'def',
      active: true,
      attributes: new Map(),
      relationships: new Map(),
      metadata: new Map(),
    };

    // 添加到当前编辑目标
    const editTarget = this.getEditTarget();
    editTarget.layer?.rootPrims.push(prim);

    // 更新缓存
    this.primCache.set(path.pathString, prim);

    // 触发事件
    this.emit('primAdded', path);

    return prim;
  }

  /**
   * 获取指定路径的Prim
   */
  getPrimAtPath(path: SdfPath): UsdPrim | null {
    // 首先检查缓存
    const cached = this.primCache.get(path.pathString);
    if (cached) return cached;

    // 在图层中查找
    const prim = this.findPrimInLayer(this.rootLayer, path);
    if (prim) {
      this.primCache.set(path.pathString, prim);
      return prim;
    }

    // 检查会话层
    if (this.sessionLayer) {
      const sessionPrim = this.findPrimInLayer(this.sessionLayer, path);
      if (sessionPrim) {
        this.primCache.set(path.pathString, sessionPrim);
        return sessionPrim;
      }
    }

    return null;
  }

  /**
   * 在图层中查找Prim
   */
  private findPrimInLayer(layer: SdfLayer, path: SdfPath): UsdPrim | null {
    const parts = path.pathString.split('/').filter((p) => p);

    if (parts.length === 0) {
      return null;
    }

    let currentPrim: UsdPrim | null = null;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      currentPath += '/' + parts[i];
      const currentSdfPath = new SdfPathClass(currentPath);

      if (i === 0) {
        // 根Prim
        currentPrim = layer.rootPrims.find((p) => p.path.equals(currentSdfPath)) || null;
      } else if (currentPrim) {
        // 子Prim
        const children = this.getChildren(currentPrim.path);
        currentPrim = children.find((p) => p.path.equals(currentSdfPath)) || null;
      }

      if (!currentPrim) {
        return null;
      }
    }

    return currentPrim;
  }

  /**
   * 移除Prim
   */
  removePrim(path: SdfPath): boolean {
    const prim = this.getPrimAtPath(path);
    if (!prim) return false;

    // 从图层中移除
    const editTarget = this.getEditTarget();
    const index = editTarget.layer!.rootPrims.findIndex((p) => p.path.equals(path));
    if (index >= 0) {
      editTarget.layer!.rootPrims.splice(index, 1);
      this.primCache.delete(path.pathString);
      this.emit('primRemoved', path);
      return true;
    }

    return false;
  }

  /**
   * 获取子Prim
   */
  getChildren(parentPath: SdfPath, predicate?: PrimPredicate): UsdPrim[] {
    const children: UsdPrim[] = [];

    for (const [pathStr, prim] of this.primCache) {
      if (prim.path.parentPath.equals(parentPath)) {
        if (!predicate || this.matchesPredicate(prim, predicate)) {
          children.push(prim);
        }
      }
    }

    return children;
  }

  /**
   * 遍历场景图
   */
  *traverse(rootPath?: SdfPath, predicate?: PrimPredicate): Generator<UsdPrim> {
    const startPath = rootPath || new SdfPathClass('/');
    const prim = this.getPrimAtPath(startPath);

    if (prim && (!predicate || this.matchesPredicate(prim, predicate))) {
      yield prim;
    }

    const children = this.getChildren(startPath, predicate);
    for (const child of children) {
      yield* this.traverse(child.path, predicate);
    }
  }

  /**
   * 检查Prim是否匹配谓词
   */
  private matchesPredicate(prim: UsdPrim, predicate: PrimPredicate): boolean {
    if (predicate.typeName && !predicate.typeName.includes(prim.typeName)) {
      return false;
    }

    if (predicate.pathPattern && !predicate.pathPattern.test(prim.path.pathString)) {
      return false;
    }

    if (predicate.hasAttribute) {
      for (const attrName of predicate.hasAttribute) {
        if (!prim.attributes.has(attrName)) return false;
      }
    }

    if (predicate.hasRelationship) {
      for (const relName of predicate.hasRelationship) {
        if (!prim.relationships.has(relName)) return false;
      }
    }

    if (predicate.isActive !== undefined && prim.active !== predicate.isActive) {
      return false;
    }

    if (predicate.isInstanceable !== undefined && prim.instanceable !== predicate.isInstanceable) {
      return false;
    }

    return true;
  }

  /**
   * 设置属性值
   */
  setAttributeValue(primPath: SdfPath, attrName: string, value: any, time?: number): boolean {
    const prim = this.getPrimAtPath(primPath);
    if (!prim) return false;

    const attr = prim.attributes.get(attrName);
    if (!attr) {
      console.warn(`属性不存在: ${attrName}`);
      return false;
    }

    if (time !== undefined && attr.timeSamples) {
      // 时间采样值
      const existingIndex = attr.timeSamples.findIndex((s) => s.time === time);
      if (existingIndex >= 0) {
        attr.timeSamples[existingIndex].value = value;
      } else {
        attr.timeSamples.push({ time, value });
        attr.timeSamples.sort((a, b) => a.time - b.time);
      }
    } else {
      // 默认值
      attr.defaultValue = value;
    }

    this.emit('attributeChanged', primPath, attrName);
    return true;
  }

  /**
   * 获取属性值
   */
  getAttributeValue(primPath: SdfPath, attrName: string, time?: number): any {
    const prim = this.getPrimAtPath(primPath);
    if (!prim) return undefined;

    return this.attributeResolver.resolve(prim, attrName, time)?.value;
  }

  /**
   * 设置时间
   */
  setTime(time: number): void {
    this.currentTime = time;
    this.emit('timeChanged', time);
  }

  /**
   * 获取当前编辑目标
   */
  private getEditTarget(): EditContext {
    if (this.editContextStack.length > 0) {
      return this.editContextStack[this.editContextStack.length - 1];
    }
    return {
      target: 'ROOT_LAYER',
      layer: this.rootLayer,
    };
  }

  /**
   * 检查Prim是否存在
   */
  hasPrim(path: SdfPath): boolean {
    return this.primCache.has(path.pathString);
  }

  /**
   * 检查Prim是否激活
   */
  isPrimActive(path: SdfPath): boolean {
    const prim = this.getPrimAtPath(path);
    return prim?.active ?? false;
  }

  /**
   * 批量操作
   */
  batch(operations: StageOperation[]): boolean {
    let success = true;

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'ADD_PRIM':
            this.definePrim(op.path, op.payload.typeName);
            break;
          case 'UPDATE_ATTRIBUTE':
            this.setAttributeValue(op.path, op.payload.attrName, op.payload.value, op.payload.time);
            break;
          // 其他操作类型...
          default:
            console.warn('未支持的操作类型:', op.type);
        }
      } catch (error) {
        console.error('批量操作失败:', error);
        success = false;
      }
    }

    return success;
  }

  // 事件类型定义
  onPrimAdded: (path: SdfPath) => void = () => {};
  onPrimRemoved: (path: SdfPath) => void = () => {};
  onAttributeChanged: (path: SdfPath, attrName: string) => void = () => {};
  onTimeChanged: (time: number) => void = () => {};
}

// 扩展SdfPath类
SdfPathClass.prototype.equals = function (other: SdfPathClass): boolean {
  return this.pathString === other.pathString;
};
