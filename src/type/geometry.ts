/**
 * USD 几何体类型定义
 *
 * 定义 USD 几何体描述的类型，包括网格、
 * 曲线、点和其他几何基元。
 */

import type { IBounds, IMatrix4, IVector3 } from './common';
import type { IUSDPrim } from './scene';

/**
 * 几何体用途
 */
export type IGeometryPurpose = 'default' | 'proxy' | 'guide' | 'render';

/**
 * 方向类型
 */
export type IOrientation = 'rightHanded' | 'leftHanded';

/**
 * 细分方案
 */
export type ISubdivisionScheme = 'none' | 'catmullClark' | 'loop' | 'bilinear';

/**
 * 面变化插值
 */
export type IFaceVaryingInterpolation = 'uniform' | 'varying' | 'vertex' | 'faceVarying';

/**
 * 网格几何体接口
 */
export interface IMeshPrim extends IUSDPrim {
  type: 'Mesh';
  /** 顶点位置 */
  points: IVector3[];
  /** 面顶点数量 */
  faceVertexCounts: number[];
  /** 面顶点索引 */
  faceVertexIndices: number[];
  /** 法线 */
  normals?: {
    values: IVector3[];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** UV 坐标 */
  primvars?: {
    st?: {
      values: [number, number][];
      interpolation?: IFaceVaryingInterpolation;
    };
    uv?: {
      values: [number, number][];
      interpolation?: IFaceVaryingInterpolation;
    };
    [key: string]:
      | {
          values: unknown[];
          interpolation?: IFaceVaryingInterpolation;
        }
      | undefined;
  };
  /** 顶点颜色 */
  displayColor?: {
    values: [number, number, number][];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** 顶点不透明度 */
  displayOpacity?: {
    values: number[];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** 细分方案 */
  subdivisionScheme?: ISubdivisionScheme;
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
  orientation?: IOrientation;
  /** 用途 */
  purpose?: IGeometryPurpose;
}

/**
 * 曲线几何体接口
 */
export interface ICurvesPrim extends IUSDPrim {
  type: 'Curves';
  /** 每条曲线的顶点数量 */
  curveVertexCounts: number[];
  /** 曲线顶点 */
  points: IVector3[];
  /** 曲线宽度 */
  widths?: {
    values: number[];
    interpolation?: 'uniform' | 'varying' | 'vertex';
  };
  /** 曲线法线 */
  normals?: {
    values: IVector3[];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** 曲线类型 */
  curveType?: 'linear' | 'cubic';
  /** 基函数 */
  basis?: 'bezier' | 'bspline' | 'catmullRom';
  /** 包裹模式 */
  wrap?: 'nonperiodic' | 'periodic' | 'pinned';
  /** 用途 */
  purpose?: IGeometryPurpose;
}

/**
 * 点几何体接口
 */
export interface IPointsPrim extends IUSDPrim {
  type: 'Points';
  /** 点位置 */
  points: IVector3[];
  /** 点宽度 */
  widths?: {
    values: number[];
    interpolation?: 'uniform' | 'varying' | 'vertex';
  };
  /** 点法线 */
  normals?: {
    values: IVector3[];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** 点 ID */
  ids?: number[];
  /** 点颜色 */
  displayColor?: {
    values: [number, number, number][];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** 点不透明度 */
  displayOpacity?: {
    values: number[];
    interpolation?: IFaceVaryingInterpolation;
  };
  /** 用途 */
  purpose?: IGeometryPurpose;
}

/**
 * Volume data interface
 */
export interface IVolumePrim extends IUSDPrim {
  type: 'Volume';
  /** Volume file path */
  filePath?: string;
  /** Volume field data */
  fieldData?: {
    [name: string]: {
      type: 'float' | 'vec3f' | 'vec4f';
      dimensions: [number, number, number];
      data: unknown[];
    };
  };
  /** Volume transform */
  volumeTransform?: IMatrix4;
  /** Purpose */
  purpose?: IGeometryPurpose;
}

/**
 * Instanced geometry interface
 */
export interface IInstancerPrim extends IUSDPrim {
  type: 'Instancer';
  /** Reference prototype */
  prototype: string;
  /** Instance transforms */
  instanceTransforms: IMatrix4[];
  /** Instance IDs */
  instanceIds?: number[];
  /** Instance visibility */
  instanceVisibility?: boolean[];
  /** Instance purposes */
  instancePurposes?: IGeometryPurpose[];
}

/**
 * GeomSubset for mesh parts
 */
export interface IGeomSubset {
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
export interface ISkinningWeights {
  /** Joint indices per vertex */
  jointIndices: number[][];
  /** Joint weights per vertex */
  jointWeights: number[][];
  /** Bind transform matrix */
  bindTransform?: IMatrix4;
  /** Joint transforms */
  jointTransforms?: IMatrix4[];
}

/**
 * Blend shape targets
 */
export interface IBlendShape {
  /** Target name */
  name: string;
  /** Target vertex offsets */
  pointOffsets?: IVector3[];
  /** Target normal offsets */
  normalOffsets?: IVector3[];
  /** Blend shape weight */
  weight?: number;
}

/**
 * Geometry cache
 */
export interface IGeometryCache {
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
export interface IGeometryState {
  /** Geometry ID */
  id: string;
  /** Geometry type */
  type: string;
  /** Vertex count */
  vertexCount: number;
  /** Face count */
  faceCount: number;
  /** Bounding box */
  bounds?: IBounds;
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
