import type { SdfLayer, SdfPath, UsdPrim, UsdPrimType, UsdStage } from './core';

// Stage操作类型
export enum StageOperationType {
  ADD_PRIM = 'ADD_PRIM',
  REMOVE_PRIM = 'REMOVE_PRIM',
  REORDER_PRIM_CHILDREN = 'REORDER_PRIM_CHILDREN',
  UPDATE_ATTRIBUTE = 'UPDATE_ATTRIBUTE',
  UPDATE_RELATIONSHIP = 'UPDATE_RELATIONSHIP',
  UPDATE_METADATA = 'UPDATE_METADATA',
  SET_VARIANT_SELECTION = 'SET_VARIANT_SELECTION',
  ADD_REFERENCE = 'ADD_REFERENCE',
  ADD_PAYLOAD = 'ADD_PAYLOAD',
  MUTE_LAYER = 'MUTE_LAYER',
  UNMUTE_LAYER = 'UNMUTE_LAYER',
}

// Stage操作
export interface StageOperation {
  type: StageOperationType;
  path: SdfPath;
  payload?: any;
}

// Prim查询谓词
export interface PrimPredicate {
  typeName?: UsdPrimType[];
  pathPattern?: RegExp;
  hasAttribute?: string[];
  hasRelationship?: string[];
  isActive?: boolean;
  isInstanceable?: boolean;
  isDefined?: boolean;
  isAbstract?: boolean;
}

// Stage API接口
export interface UsdStageAPI {
  // 基本操作
  open(layer: SdfLayer): UsdStage;
  save(): void;
  export(): string;

  // Prim管理
  definePrim(path: SdfPath, typeName?: UsdPrimType): UsdPrim | null;
  getPrimAtPath(path: SdfPath): UsdPrim | null;
  removePrim(path: SdfPath): boolean;
  reorderPrimChildren(parentPath: SdfPath, newOrder: string[]): void;

  // 遍历
  traverse(rootPath?: SdfPath, predicate?: PrimPredicate): Generator<UsdPrim>;
  getChildren(parentPath: SdfPath, predicate?: PrimPredicate): UsdPrim[];
  getDescendants(parentPath: SdfPath, predicate?: PrimPredicate): UsdPrim[];

  // 属性操作
  createAttribute(primPath: SdfPath, name: string, typeName: string, defaultValue?: any): boolean;
  setAttributeValue(primPath: SdfPath, attrName: string, value: any, time?: number): boolean;
  getAttributeValue(primPath: SdfPath, attrName: string, time?: number): any;

  // 关系操作
  createRelationship(primPath: SdfPath, name: string, targets?: SdfPath[]): boolean;
  addRelationshipTarget(primPath: SdfPath, relName: string, target: SdfPath): boolean;
  removeRelationshipTarget(primPath: SdfPath, relName: string, target: SdfPath): boolean;

  // 元数据操作
  setMetadata(path: SdfPath, key: string, value: any): boolean;
  getMetadata(path: SdfPath, key: string): any;

  // 组合操作
  addReference(assetPath: string, primPath?: SdfPath): boolean;
  addPayload(assetPath: string, primPath?: SdfPath): boolean;
  setInherits(primPath: SdfPath, inheritedPath: SdfPath): boolean;

  // 变体操作
  getVariantSets(primPath: SdfPath): string[];
  getVariantSet(primPath: SdfPath, setName: string): string[];
  setVariantSelection(primPath: SdfPath, setName: string, variantName: string): boolean;

  // 时间码
  setTime(time: number): void;
  getTime(): number;
  setTimeCodesPerSecond(rate: number): void;

  // 图层管理
  getRootLayer(): SdfLayer;
  getSessionLayer(): SdfLayer | null;
  createSubLayer(identifier: string): SdfLayer;
  muteLayer(identifier: string): void;
  unmuteLayer(identifier: string): void;

  // 查询
  hasPrim(path: SdfPath): boolean;
  isPrimActive(path: SdfPath): boolean;
  isPrimLoaded(path: SdfPath): boolean;

  // 批量操作
  batch(operations: StageOperation[]): boolean;

  // 事件
  onPrimAdded: (path: SdfPath) => void;
  onPrimRemoved: (path: SdfPath) => void;
  onAttributeChanged: (path: SdfPath, attrName: string) => void;
  onTimeChanged: (time: number) => void;
}

// 场景图遍历器
export interface SceneGraphIterator {
  current: UsdPrim | null;
  next(): IteratorResult<UsdPrim>;
  reset(rootPath?: SdfPath): void;
  setTraversalPredicate(predicate: PrimPredicate): void;
}

// 属性解析器
export interface AttributeResolver {
  resolve(
    prim: UsdPrim,
    attrName: string,
    time?: number,
  ): {
    value: any;
    source: 'local' | 'reference' | 'payload' | 'inherit' | 'specialize' | 'variant';
    sourcePath: SdfPath;
  } | null;
}

// 组合解析器
export interface CompositionResolver {
  resolve(prim: UsdPrim): {
    local: UsdPrim;
    references: ResolvedReference[];
    inherits: ResolvedInheritance[];
    variants: ResolvedVariant[];
    finalPrim: UsdPrim;
  };
}

export interface ResolvedReference {
  assetPath: string;
  primPath: SdfPath;
  layer: SdfLayer;
  prim: UsdPrim;
}

export interface ResolvedInheritance {
  path: SdfPath;
  prim: UsdPrim;
}

export interface ResolvedVariant {
  setName: string;
  variantName: string;
  prim: UsdPrim;
}

// 编辑目标
export enum EditTarget {
  ROOT_LAYER = 'ROOT_LAYER',
  SESSION_LAYER = 'SESSION_LAYER',
  SUBLAYER = 'SUBLAYER',
}

// 编辑上下文
export interface EditContext {
  target: EditTarget;
  layer?: SdfLayer;
  path?: SdfPath;
}
