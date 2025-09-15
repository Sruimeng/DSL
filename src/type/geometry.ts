/**
 * USD 几何体类型定义
 *
 * 定义 USD 几何体描述的类型，包括网格、
 * 曲线、点和其他几何基元。
 */

import type { USDPrim } from './scene';

/**
 * 几何体用途
 */
export type GeometryPurpose = 'default' | 'proxy' | 'guide' | 'render';

/**
 * 方向类型
 */
export type Orientation = 'rightHanded' | 'leftHanded';

/**
 * 细分方案
 */
export type SubdivisionScheme = 'none' | 'catmullClark' | 'loop' | 'bilinear';

/**
 * 面变化插值
 */
export type FaceVaryingInterpolation = 'uniform' | 'varying' | 'vertex' | 'faceVarying';

/**
 * 网格几何体接口
 */
export interface MeshPrim extends USDPrim {
  type: 'Mesh';
  /** 顶点位置 */
  points: [number, number, number][];
  /** 面顶点数量 */
  faceVertexCounts: number[];
  /** 面顶点索引 */
  faceVertexIndices: number[];
  /** 法线 */
  normals?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** UV 坐标 */
  primvars?: {
    st?: {
      values: [number, number][];
      interpolation?: FaceVaryingInterpolation;
    };
    uv?: {
      values: [number, number][];
      interpolation?: FaceVaryingInterpolation;
    };
    [key: string]: {
      values: unknown[];
      interpolation?: FaceVaryingInterpolation;
    };
  };
  /** 顶点颜色 */
  displayColor?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** 顶点不透明度 */
  displayOpacity?: {
    values: number[];
    interpolation?: FaceVaryingInterpolation;
  };
  /** 细分方案 */
  subdivisionScheme?: SubdivisionScheme;
  /** 折边 */
  creases?: {
    edgeIndices: number[];
    edgeSharpnesses: number[];
  };
  /** 角锐度 */
  cornerSharpnesses?: {
    indices: number[];
    sharpnesses: number[];
  };
  /** 孔洞面 */
  holeIndices?: number[];
  /** 双面渲染 */
  doubleSided?: boolean;
  /** 方向 */
  orientation?: Orientation;
  /** 用途 */
  purpose?: GeometryPurpose;
}

/**
 * 曲线几何体接口
 */
export interface CurvesPrim extends USDPrim {
  type: 'Curves';
  /** 每条曲线的顶点数量 */
  curveVertexCounts: number[];
  /** 曲线顶点 */
  points: [number, number, number][];
  /** 曲线宽度 */
  widths?: {
    values: number[];
    interpolation?: 'uniform' | 'varying' | 'vertex';
  };
  /** 曲线法线 */
  normals?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** 曲线类型 */
  curveType?: 'linear' | 'cubic';
  /** 基函数 */
  basis?: 'bezier' | 'bspline' | 'catmullRom';
  /** 包裹模式 */
  wrap?: 'nonperiodic' | 'periodic' | 'pinned';
  /** 用途 */
  purpose?: GeometryPurpose;
}

/**
 * 点几何体接口
 */
export interface PointsPrim extends USDPrim {
  type: 'Points';
  /** 点位置 */
  points: [number, number, number][];
  /** 点宽度 */
  widths?: {
    values: number[];
    interpolation?: 'uniform' | 'varying' | 'vertex';
  };
  /** 点法线 */
  normals?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** 点 ID */
  ids?: number[];
  /** 点颜色 */
  displayColor?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** 点不透明度 */
  displayOpacity?: {
    values: number[];
    interpolation?: FaceVaryingInterpolation;
  };
  /** 用途 */
  purpose?: GeometryPurpose;
}

/**
 * Volume data interface
 */
export interface VolumePrim extends USDPrim {
  type: 'Volume';
  /** Volume file path */
  filePath?: string;
  /** Volume field data */
  fieldData?: {
    [name: string]: {
      type: 'float' | 'vec3f' | 'vec4f';
      dimensions: [number, number, number];
      data: any[];
    };
  };
  /** Volume transform */
  volumeTransform?: number[];
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Instanced geometry interface
 */
export interface InstancerPrim extends USDPrim {
  type: 'Instancer';
  /** Reference prototype */
  prototype: string;
  /** Instance transforms */
  instanceTransforms: number[][];
  /** Instance IDs */
  instanceIds?: number[];
  /** Instance visibility */
  instanceVisibility?: boolean[];
  /** Instance purposes */
  instancePurposes?: GeometryPurpose[];
}

/**
 * Sphere primitive interface
 */
export interface SpherePrim extends USDPrim {
  type: 'Sphere';
  /** Sphere radius */
  radius: number;
  /** Sphere center */
  center?: [number, number, number];
  /** Subdivision axis */
  axis?: [number, number, number];
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Cube primitive interface
 */
export interface CubePrim extends USDPrim {
  type: 'Cube';
  /** Cube size */
  size: number;
  /** Cube extents */
  extent?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Cylinder primitive interface
 */
export interface CylinderPrim extends USDPrim {
  type: 'Cylinder';
  /** Cylinder radius */
  radius: number;
  /** Cylinder height */
  height: number;
  /** Axis direction */
  axis?: [number, number, number];
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Cone primitive interface
 */
export interface ConePrim extends USDPrim {
  type: 'Cone';
  /** Cone radius */
  radius: number;
  /** Cone height */
  height: number;
  /** Axis direction */
  axis?: [number, number, number];
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Capsule primitive interface
 */
export interface CapsulePrim extends USDPrim {
  type: 'Capsule';
  /** Capsule radius */
  radius: number;
  /** Capsule height */
  height: number;
  /** Axis direction */
  axis?: [number, number, number];
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * NurbsPatch primitive interface
 */
export interface NurbsPatchPrim extends USDPrim {
  type: 'NurbsPatch';
  /** Control points */
  points: [number, number, number][];
  /** U degree */
  uDegree: number;
  /** V degree */
  vDegree: number;
  /** U knot values */
  uKnots: number[];
  /** V knot values */
  vKnots: number[];
  /** U form */
  uForm: 'open' | 'closed' | 'periodic';
  /** V form */
  vForm: 'open' | 'closed' | 'periodic';
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * GeomSubset for mesh parts
 */
export interface GeomSubset {
  /** Subset type */
  elementType: 'face' | 'point' | 'edge';
  /** Subset family name */
  familyName?: string;
  /** Subset indices */
  indices: number[];
  /** Subset membership type */
  membershipType?: 'inclusive' | 'exclusive';
}

/**
 * Skinning weights
 */
export interface SkinningWeights {
  /** Joint indices per vertex */
  jointIndices: number[][];
  /** Joint weights per vertex */
  jointWeights: number[][];
  /** Bind transform matrix */
  bindTransform?: number[];
  /** Joint transforms */
  jointTransforms?: number[][];
}

/**
 * Blend shape targets
 */
export interface BlendShape {
  /** Target name */
  name: string;
  /** Target vertex offsets */
  pointOffsets?: [number, number, number][];
  /** Target normal offsets */
  normalOffsets?: [number, number, number][];
  /** Blend shape weight */
  weight?: number;
}

/**
 * Geometry cache
 */
export interface GeometryCache {
  /** Cache file path */
  filePath: string;
  /** Time range */
  timeRange: [number, number];
  /** Topology varies over time */
  topologyVariance: 'constant' | 'uniform' | 'varying';
}

/**
 * Geometry state for runtime
 */
export interface GeometryState {
  /** Geometry ID */
  id: string;
  /** Geometry type */
  type: string;
  /** Vertex count */
  vertexCount: number;
  /** Face count */
  faceCount: number;
  /** Bounding box */
  bounds?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Geometry data */
  data: {
    positions?: Float32Array;
    normals?: Float32Array;
    uvs?: Float32Array;
    colors?: Float32Array;
    indices?: Uint16Array | Uint32Array;
  };
  /** Is geometry loaded */
  isLoaded: boolean;
}
