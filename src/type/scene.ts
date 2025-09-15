/**
 * USD 场景类型定义
 *
 * 定义 USD 场景描述的类型，包括层级结构、Prim
 * 和场景级属性。
 */

/**
 * 基本 USD Prim 类型标识符
 */
export type PrimType = 'Xform' | 'Mesh' | 'Camera' | 'Light' | 'Material' | 'Scope' | 'GeomSubset';

/**
 * 所有 USD Prim 的基础接口
 */
export interface USDPrim {
  /** 此 Prim 的唯一标识符 */
  name: string;
  /** Prim 类型 */
  type: PrimType | string;
  /** 父 Prim 路径 */
  parent?: string;
  /** 此 Prim 是否激活 */
  active?: boolean;
  /** 可见性状态 */
  visibility?: 'inherited' | 'invisible';
  /** 用户自定义属性 */
  customData?: Record<string, unknown>;
}

/**
 * Xform Prim 的变换属性
 */
export interface XformTransform {
  /** 3D 空间中的平移 */
  translate?: [number, number, number];
  /** 欧拉角旋转（度） */
  rotate?: [number, number, number];
  /** 缩放因子 */
  scale?: [number, number, number];
  /** 旋转枢轴 */
  pivot?: [number, number, number];
  /** 变换矩阵（16 个值，行主序） */
  matrix?: number[];
}

/**
 * Xform Prim - 定义变换层级
 */
export interface XformPrim extends USDPrim {
  type: 'Xform';
  /** 变换操作顺序 */
  xformOpOrder?: string[];
  transform?: XformTransform;
}

/**
 * 对另一个 Prim 或外部资产的引用
 */
export interface Reference {
  /** 被引用 Prim 的路径 */
  path: string;
  /** 可选的层偏移用于时间重映射 */
  layerOffset?: {
    offset: number;
    scale: number;
  };
}

/**
 * Payload 组合的载荷
 */
export interface Payload {
  /** 包含载荷的资产路径 */
  assetPath: string;
  /** 资产内的 Prim 路径 */
  primPath?: string;
}

/**
 * Scope Prim - 组织容器
 */
export interface ScopePrim extends USDPrim {
  type: 'Scope';
  /** 子 Prim */
  children?: USDPrim[];
  /** 对其他 Scope 的引用 */
  references?: Reference[];
  /** Payload 引用 */
  payload?: Payload[];
}

/**
 * Prim 的用途分类
 */
export type Purpose = 'default' | 'render' | 'proxy' | 'guide';

/**
 * 3D 空间中的边界范围
 */
export interface Extent {
  /** 最小角 */
  min: [number, number, number];
  /** 最大角 */
  max: [number, number, number];
}

/**
 * GeomSubset - 定义几何体子集
 */
export interface GeomSubsetPrim extends USDPrim {
  type: 'GeomSubset';
  /** 子集类型 */
  elementType: 'face' | 'point' | 'vertex';
  /** 子集的索引 */
  indices: number[];
  /** 用于分组子集的族名 */
  familyName?: string;
}

/**
 * 场景级元数据
 */
export interface SceneMetadata {
  /** 场景中的默认 Prim */
  defaultPrim?: string;
  /** 上轴方向 */
  upAxis?: 'Y' | 'Z';
  /** 每秒时间码数 */
  timeCodesPerSecond?: number;
  /** 场景开始时间 */
  startTime?: number;
  /** 场景结束时间 */
  endTime?: number;
  /** 帧率 */
  frameRate?: number;
  /** 作者信息 */
  authoredBy?: string;
  /** 创建日期 */
  created?: string;
  /** 最后修改日期 */
  modified?: string;
  /** 自定义元数据 */
  customData?: Record<string, unknown>;
}

/**
 * 层信息
 */
export interface Layer {
  /** 层标识符 */
  identifier: string;
  /** 层版本 */
  version?: string;
  /** 层注释 */
  comment?: string;
  /** 子层 */
  subLayers?: string[];
}

/**
 * 完整的 USD 场景描述
 */
export interface USDScene {
  /** 场景元数据 */
  metadata?: SceneMetadata;
  /** 层信息 */
  layer?: Layer;
  /** 场景中的根 Prim */
  prims: USDPrim[];
  /** 全局用途 */
  purpose?: Purpose;
  /** 场景范围 */
  extent?: Extent;
}

/**
 * DSL 引擎的场景状态
 */
export interface SceneState {
  /** 当前场景对象 */
  objects: Map<string, unknown>;
  /** 活动相机 */
  activeCamera?: string;
  /** 场景边界 */
  bounds?: Extent;
  /** 当前时间 */
  currentTime: number;
  /** 场景是否已加载 */
  isLoaded: boolean;
  /** 渲染循环是否运行中 */
  isRunning: boolean;
}
