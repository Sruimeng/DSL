import type { SdfLayer, UsdStage, SdfPath, UsdPrim, LayerOffset } from '../types';
import { EventEmitter } from 'eventemitter3';

/**
 * 图层管理器 - 管理USD图层的创建、编辑、组合等
 */
export class LayerManager extends EventEmitter {
  private layers: Map<string, SdfLayer> = new Map();
  private stage: UsdStage;
  private activeLayer: SdfLayer;
  private layerStack: SdfLayer[] = [];
  private mutedLayers: Set<string> = new Set();
  private subLayerOffsets: Map<string, LayerOffset> = new Map();

  constructor(stage: UsdStage) {
    super();
    this.stage = stage;
    this.activeLayer = stage.rootLayer;
    this.buildLayerStack();
  }

  /**
   * 构建图层堆栈
   */
  private buildLayerStack(): void {
    this.layerStack = [];
    
    // 添加子图层（递归）
    this.addLayerToStack(this.stage.rootLayer);
    
    // 添加会话层（如果存在）
    if (this.stage.sessionLayer) {
      this.layerStack.push(this.stage.sessionLayer);
    }
  }

  /**
   * 递归添加图层到堆栈
   */
  private addLayerToStack(layer: SdfLayer): void {
    // 先添加子图层（弱到强）
    for (const subLayerIdentifier of layer.subLayers) {
      const subLayer = this.layers.get(subLayerIdentifier);
      if (subLayer && !this.mutedLayers.has(subLayerIdentifier)) {
        this.addLayerToStack(subLayer);
      }
    }
    
    // 添加当前图层
    if (!this.mutedLayers.has(layer.identifier)) {
      this.layerStack.push(layer);
    }
  }

  /**
   * 创建新图层
   */
  createLayer(identifier: string, displayName?: string): SdfLayer {
    const layer: SdfLayer = {
      identifier,
      displayName: displayName || identifier,
      rootPrims: [],
      subLayers: [],
      timeCodesPerSecond: this.stage.timeCodesPerSecond,
      framesPerSecond: this.stage.framesPerSecond,
      customLayerData: {},
    };

    this.layers.set(identifier, layer);
    this.emit('layerCreated', layer);
    return layer;
  }

  /**
   * 添加子图层
   */
  addSubLayer(parentLayer: SdfLayer, subLayerIdentifier: string, offset?: LayerOffset): boolean {
    const subLayer = this.layers.get(subLayerIdentifier);
    if (!subLayer) {
      console.error(`子图层不存在: ${subLayerIdentifier}`);
      return false;
    }

    if (parentLayer.subLayers.includes(subLayerIdentifier)) {
      console.warn(`子图层已存在: ${subLayerIdentifier}`);
      return false;
    }

    // 检查循环引用
    if (this.hasCircularReference(subLayer, parentLayer)) {
      console.error('检测到循环引用');
      return false;
    }

    parentLayer.subLayers.push(subLayerIdentifier);
    
    if (offset) {
      this.subLayerOffsets.set(subLayerIdentifier, offset);
    }

    this.buildLayerStack();
    this.emit('subLayerAdded', parentLayer, subLayer);
    return true;
  }

  /**
   * 移除子图层
   */
  removeSubLayer(parentLayer: SdfLayer, subLayerIdentifier: string): boolean {
    const index = parentLayer.subLayers.indexOf(subLayerIdentifier);
    if (index === -1) {
      console.warn(`子图层不存在: ${subLayerIdentifier}`);
      return false;
    }

    parentLayer.subLayers.splice(index, 1);
    this.subLayerOffsets.delete(subLayerIdentifier);
    this.buildLayerStack();
    this.emit('subLayerRemoved', parentLayer, subLayerIdentifier);
    return true;
  }

  /**
   * 检查循环引用
   */
  private hasCircularReference(child: SdfLayer, parent: SdfLayer): boolean {
    const visited = new Set<string>();
    
    const checkCircular = (current: SdfLayer, target: SdfLayer): boolean => {
      if (current.identifier === target.identifier) {
        return true;
      }
      
      if (visited.has(current.identifier)) {
        return false;
      }
      
      visited.add(current.identifier);
      
      for (const subLayerId of current.subLayers) {
        const subLayer = this.layers.get(subLayerId);
        if (subLayer && checkCircular(subLayer, target)) {
          return true;
        }
      }
      
      return false;
    };
    
    return checkCircular(child, parent);
  }

  /**
   * 静音图层
   */
  muteLayer(identifier: string): boolean {
    const layer = this.getLayer(identifier);
    if (!layer) {
      console.error(`图层不存在: ${identifier}`);
      return false;
    }

    this.mutedLayers.add(identifier);
    this.buildLayerStack();
    this.emit('layerMuted', layer);
    return true;
  }

  /**
   * 取消静音
   */
  unmuteLayer(identifier: string): boolean {
    if (!this.mutedLayers.has(identifier)) {
      return false;
    }

    const layer = this.getLayer(identifier);
    this.mutedLayers.delete(identifier);
    this.buildLayerStack();
    
    if (layer) {
      this.emit('layerUnmuted', layer);
    }
    
    return true;
  }

  /**
   * 获取图层
   */
  getLayer(identifier: string): SdfLayer | undefined {
    return this.layers.get(identifier) || 
           (this.stage.rootLayer.identifier === identifier ? this.stage.rootLayer : undefined) ||
           (this.stage.sessionLayer?.identifier === identifier ? this.stage.sessionLayer : undefined);
  }

  /**
   * 设置活动图层
   */
  setActiveLayer(identifier: string): boolean {
    const layer = this.getLayer(identifier);
    if (!layer) {
      console.error(`图层不存在: ${identifier}`);
      return false;
    }

    if (this.mutedLayers.has(identifier)) {
      console.error(`图层已被静音: ${identifier}`);
      return false;
    }

    this.activeLayer = layer;
    this.emit('activeLayerChanged', layer);
    return true;
  }

  /**
   * 获取活动图层
   */
  getActiveLayer(): SdfLayer {
    return this.activeLayer;
  }

  /**
   * 获取图层堆栈
   */
  getLayerStack(): SdfLayer[] {
    return [...this.layerStack];
  }

  /**
   * 在图层中定义Prim
   */
  definePrimInLayer(layer: SdfLayer, path: SdfPath, typeName?: string): UsdPrim | null {
    // 检查路径是否已存在
    const existingPrim = this.findPrimInLayer(layer, path);
    if (existingPrim) {
      return existingPrim;
    }

    // 创建新的Prim定义
    const prim: UsdPrim = {
      path,
      typeName: typeName || 'Xform',
      specifier: 'def',
      active: true,
      attributes: new Map(),
      relationships: new Map(),
      metadata: new Map(),
    };

    // 添加到图层的根Prim列表
    layer.rootPrims.push(prim);
    this.emit('primDefined', layer, prim);
    
    return prim;
  }

  /**
   * 在图层中查找Prim
   */
  private findPrimInLayer(layer: SdfLayer, path: SdfPath): UsdPrim | null {
    for (const prim of layer.rootPrims) {
      if (prim.path.equals(path)) {
        return prim;
      }
      
      // 递归查找子Prim
      const child = this.findPrimRecursive(prim, path);
      if (child) {
        return child;
      }
    }
    
    return null;
  }

  /**
   * 递归查找Prim
   */
  private findPrimRecursive(prim: UsdPrim, targetPath: SdfPath): UsdPrim | null {
    if (prim.path.equals(targetPath)) {
      return prim;
    }
    
    // 这里需要实现子Prim的查找逻辑
    // 取决于Prim结构如何存储子Prim
    
    return null;
  }

  /**
   * 合并图层
   */
  mergeLayers(targetLayer: SdfLayer, sourceLayer: SdfLayer, override: boolean = true): void {
    // 合并Prim定义
    for (const sourcePrim of sourceLayer.rootPrims) {
      const targetPrim = this.findPrimInLayer(targetLayer, sourcePrim.path);
      
      if (targetPrim && !override) {
        // 跳过已存在的Prim（不覆盖）
        continue;
      }
      
      if (targetPrim && override) {
        // 合并Prim定义
        this.mergePrimDefinitions(targetPrim, sourcePrim);
      } else {
        // 添加新Prim
        targetLayer.rootPrims.push({ ...sourcePrim });
      }
    }
    
    // 合并子图层
    for (const subLayerId of sourceLayer.subLayers) {
      if (!targetLayer.subLayers.includes(subLayerId)) {
        targetLayer.subLayers.push(subLayerId);
      }
    }
    
    // 合并自定义数据
    if (sourceLayer.customLayerData) {
      targetLayer.customLayerData = {
        ...targetLayer.customLayerData,
        ...sourceLayer.customLayerData,
      };
    }
    
    this.emit('layersMerged', targetLayer, sourceLayer);
  }

  /**
   * 合并Prim定义
   */
  private mergePrimDefinitions(target: UsdPrim, source: UsdPrim): void {
    // 合并属性
    for (const [name, attr] of source.attributes) {
      target.attributes.set(name, { ...attr });
    }
    
    // 合并关系
    for (const [name, rel] of source.relationships) {
      target.relationships.set(name, { ...rel });
    }
    
    // 合并元数据
    for (const [key, value] of source.metadata) {
      target.metadata.set(key, value);
    }
    
    // 合并其他字段
    if (source.active !== undefined) target.active = source.active;
    if (source.instanceable !== undefined) target.instanceable = source.instanceable;
    if (source.kind !== undefined) target.kind = source.kind;
  }

  /**
   * 扁平化图层堆栈
   */
  flatten(): SdfLayer {
    const flattenedLayer: SdfLayer = {
      identifier: 'flattened.usd',
      displayName: 'Flattened Layer',
      rootPrims: [],
      subLayers: [],
      timeCodesPerSecond: this.stage.timeCodesPerSecond,
      framesPerSecond: this.stage.framesPerSecond,
    };

    // 从弱到强遍历图层
    for (const layer of this.layerStack) {
      this.mergeLayers(flattenedLayer, layer, true);
    }

    return flattenedLayer;
  }

  /**
   * 导出图层
   */
  exportLayer(layer: SdfLayer, format: 'usda' | 'usdc' | 'json'): string {
    switch (format) {
      case 'usda':
        return this.exportToUSDA(layer);
      case 'usdc':
        // 二进制格式需要专门的编码器
        throw new Error('USDC export not implemented');
      case 'json':
        return JSON.stringify(layer, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 导出为USDA格式
   */
  private exportToUSDA(layer: SdfLayer): string {
    let usda = `#usda 1.0
`;

    // 添加元数据
    if (layer.customLayerData) {
      usda += `(
`;
      for (const [key, value] of Object.entries(layer.customLayerData)) {
        usda += `    customData = {
      ${key} = ${this.valueToUSDA(value)}
    }
`;
      }
      usda += `)

`;
    }

    // 添加时间设置
    if (layer.timeCodesPerSecond) {
      usda += `timeCodesPerSecond = ${layer.timeCodesPerSecond}
`;
    }
    if (layer.framesPerSecond) {
      usda += `framesPerSecond = ${layer.framesPerSecond}
`;
    }
    if (layer.startTimeCode) {
      usda += `startTimeCode = ${layer.startTimeCode}
`;
    }
    if (layer.endTimeCode) {
      usda += `endTimeCode = ${layer.endTimeCode}
`;
    }

    usda += `
`;

    // 添加子图层
    if (layer.subLayers.length > 0) {
      usda += `subLayers = [${layer.subLayers.map(sl => `"${sl}"`).join(', ')}]

`;
    }

    // 添加Prim定义
    for (const prim of layer.rootPrims) {
      usda += this.exportPrimToUSDA(prim, 0);
    }

    return usda;
  }

  /**
   * 导出Prim为USDA格式
   */
  private exportPrimToUSDA(prim: UsdPrim, indent: number): string {
    let usda = '';
    const indentStr = '  '.repeat(indent);
    
    // Prim定义
    usda += `${indentStr}def ${prim.typeName} "${prim.path.name}" \n${indentStr}{\n`;
    
    // 添加属性（简化版）
    for (const [name, attr] of prim.attributes) {
      if (attr.defaultValue !== undefined) {
        usda += `${indentStr}  ${this.getUSDATypeName(attr.typeName)} ${name} = ${this.valueToUSDA(attr.defaultValue)}\n`;
      }
    }
    
    usda += `${indentStr}}\n\n`;
    
    return usda;
  }

  /**
   * 获取USDA类型名
   */
  private getUSDATypeName(typeName: string): string {
    // 简化映射，实际需要完整的类型系统
    const typeMap: Record<string, string> = {
      'bool': 'bool',
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'string': 'string',
      'color3f': 'color3f',
      'color4f': 'color4f',
      'vec3f': 'vec3f',
      'vec4f': 'vec4f',
      'matrix4d': 'matrix4d',
    };
    
    return typeMap[typeName] || 'token';
  }

  /**
   * 值转换为USDA格式
   */
  private valueToUSDA(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (Array.isArray(value)) {
      return `(${value.map(v => this.valueToUSDA(v)).join(', ')})`;
    }
    
    return '""';
  }

  /**
   * 获取图层统计信息
   */
  getLayerStats(): {
    totalLayers: number;
    mutedLayers: number;
    activeLayer: string;
    layerStackDepth: number;
    totalPrims: number;
  } {
    let totalPrims = 0;
    
    for (const layer of this.layers.values()) {
      totalPrims += this.countPrimsInLayer(layer);
    }
    
    return {
      totalLayers: this.layers.size + 1, // +1 for root layer
      mutedLayers: this.mutedLayers.size,
      activeLayer: this.activeLayer.identifier,
      layerStackDepth: this.layerStack.length,
      totalPrims,
    };
  }

  /**
   * 计算图层中的Prim数量
   */
  private countPrimsInLayer(layer: SdfLayer): number {
    let count = layer.rootPrims.length;
    
    // 递归计算子Prim
    for (const prim of layer.rootPrims) {
      count += this.countChildPrims(prim);
    }
    
    return count;
  }

  /**
   * 计算子Prim数量
   */
  private countChildPrims(prim: UsdPrim): number {
    // 这里需要实现实际的子Prim计数逻辑
    return 0;
  }

  // 事件定义
  onLayerCreated?: (layer: SdfLayer) => void;
  onLayerDeleted?: (layer: SdfLayer) => void;
  onSubLayerAdded?: (parent: SdfLayer, child: SdfLayer) => void;
  onSubLayerRemoved?: (parent: SdfLayer, child: string) => void;
  onLayerMuted?: (layer: SdfLayer) => void;
  onLayerUnmuted?: (layer: SdfLayer) => void;
  onActiveLayerChanged?: (layer: SdfLayer) => void;
  onPrimDefined?: (layer: SdfLayer, prim: UsdPrim) => void;
  onLayersMerged?: (target: SdfLayer, source: SdfLayer) => void;
}

// 扩展SdfPath类以支持比较
import { SdfPath } from '../types';
if (!SdfPath.prototype.equals) {
  SdfPath.prototype.equals = function(other: SdfPath): boolean {
    return this.pathString === other.pathString;
  };
}