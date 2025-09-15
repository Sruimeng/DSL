import type { Matrix4, Vector3 } from 'three';

// USD基础类型
type SdfValueTypeName =
  | 'bool'
  | 'uchar'
  | 'int'
  | 'uint'
  | 'int64'
  | 'uint64'
  | 'half'
  | 'float'
  | 'double'
  | 'timecode'
  | 'string'
  | 'token'
  | 'asset'
  | 'vec2f'
  | 'vec3f'
  | 'vec4f'
  | 'vec2d'
  | 'vec3d'
  | 'vec4d'
  | 'vec2h'
  | 'vec3h'
  | 'vec4h'
  | 'vec2i'
  | 'vec3i'
  | 'vec4i'
  | 'quatf'
  | 'quatd'
  | 'quath'
  | 'matrix2d'
  | 'matrix3d'
  | 'matrix4d'
  | 'texCoord2f'
  | 'texCoord3f'
  | 'color3f'
  | 'color4f'
  | 'color3d'
  | 'color4d'
  | 'color3h'
  | 'color4h';

// 时间采样值
export interface TimeSample<T = any> {
  time: number;
  value: T;
}

// 支持时间变化的属性
export interface UsdAttribute {
  name: string;
  typeName: SdfValueTypeName;
  defaultValue?: any;
  timeSamples?: TimeSample[];
  customData?: Record<string, any>;
  variability?: 'varying' | 'uniform' | 'constant';
}

// Prim路径 - 类似"/World/Geometry/Mesh"
export class SdfPath {
  constructor(public pathString: string) {}

  get name(): string {
    const parts = this.pathString.split('/');
    return parts[parts.length - 1] || '';
  }

  get parentPath(): SdfPath {
    const lastSlash = this.pathString.lastIndexOf('/');
    if (lastSlash <= 0) return new SdfPath('/');
    return new SdfPath(this.pathString.substring(0, lastSlash));
  }

  get isAbsolute(): boolean {
    return this.pathString.startsWith('/');
  }

  get isPrimPath(): boolean {
    return !this.pathString.includes('.');
  }

  get isPropertyPath(): boolean {
    return this.pathString.includes('.');
  }

  appendChild(name: string): SdfPath {
    return new SdfPath(`${this.pathString}/${name}`);
  }

  appendProperty(name: string): SdfPath {
    return new SdfPath(`${this.pathString}.${name}`);
  }
}

// Prim类型定义
export type UsdPrimType =
  // 基础类型
  | 'Xform'
  | 'Scope'
  | 'GeomSubset'
  // 几何体
  | 'Mesh'
  | 'Sphere'
  | 'Cube'
  | 'Cylinder'
  | 'Cone'
  | 'Capsule'
  | 'Plane'
  | 'Points'
  | 'Curves'
  | 'NurbsCurves'
  // 材质
  | 'Material'
  | 'Shader'
  | 'NodeGraph'
  // 灯光
  | 'DistantLight'
  | 'DomeLight'
  | 'RectLight'
  | 'SphereLight'
  | 'DiskLight'
  | 'CylinderLight'
  | 'GeometryLight'
  // 相机
  | 'Camera'
  // 渲染设置
  | 'RenderSettings'
  | 'RenderProduct'
  | 'RenderVar'
  // 自定义
  | string;

// Prim定义 - USD核心概念
export interface UsdPrim {
  path: SdfPath;
  typeName: UsdPrimType;
  specifier: 'def' | 'over' | 'class';
  active?: boolean;
  instanceable?: boolean;
  kind?: string;
  attributes: Map<string, UsdAttribute>;
  relationships: Map<string, UsdRelationship>;
  metadata: Map<string, any>;
  payload?: UsdPayload;
  references?: UsdReference[];
  inherits?: SdfPath[];
  specializes?: SdfPath[];
  variants?: UsdVariantSet[];
  compositionArcs?: CompositionArc[];
}

// 关系连接
export interface UsdRelationship {
  name: string;
  targets: SdfPath[];
  customData?: Record<string, any>;
}

// 组合弧类型
export type CompositionArcType = 'reference' | 'payload' | 'inherit' | 'specialize' | 'variant';

export interface CompositionArc {
  type: CompositionArcType;
  targetPath?: SdfPath;
  assetPath?: string;
  layerOffset?: LayerOffset;
}

// 图层偏移
export interface LayerOffset {
  offset: number;
  scale: number;
}

// 引用
export interface UsdReference {
  assetPath: string;
  primPath?: SdfPath;
  layerOffset?: LayerOffset;
}

// 负载
export interface UsdPayload {
  assetPath: string;
  primPath?: SdfPath;
}

// 变体集
export interface UsdVariantSet {
  name: string;
  variants: UsdVariant[];
  selection?: string;
}

export interface UsdVariant {
  name: string;
  primSpec: Partial<UsdPrim>;
}

// 图层 - 存储Prim定义
export interface SdfLayer {
  identifier: string;
  displayName?: string;
  rootPrims: UsdPrim[];
  customLayerData?: Record<string, any>;
  timeCodesPerSecond?: number;
  framesPerSecond?: number;
  framePrecision?: number;
  startTimeCode?: number;
  endTimeCode?: number;
  subLayers: string[];
}

// Stage - 场景根容器
export interface UsdStage {
  rootLayer: SdfLayer;
  sessionLayer?: SdfLayer;
  currentTime: number;
  timeCodesPerSecond: number;
  framesPerSecond: number;
  metadata: Record<string, any>;
}

// 场景对象类型映射
export interface UsdSceneObject {
  prim: UsdPrim;
  computedTransform: Matrix4;
  computedVisibility: boolean;
  computedPurpose: 'default' | 'render' | 'proxy' | 'guide';
  boundingBox?: {
    min: Vector3;
    max: Vector3;
  };
}

// 材质类型映射
export interface UsdMaterial {
  prim: UsdPrim;
  surfaceShader?: UsdPrim;
  displacementShader?: UsdPrim;
  volumeShader?: UsdPrim;
}

// 相机参数
export interface UsdCamera {
  prim: UsdPrim;
  projection: 'perspective' | 'orthographic';
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  focusDistance?: number;
  fStop?: number;
}

// 灯光参数
export interface UsdLight {
  prim: UsdPrim;
  type: UsdPrimType;
  color: [number, number, number];
  intensity: number;
  exposure: number;
  normalize: boolean;
  // 类型特定参数
  angle?: number; // cone angle for spot
  shaping?: {
    focus: number;
    softness: number;
  };
}
