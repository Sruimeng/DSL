/**
 * USD Geometry Type Definitions
 *
 * Defines types for USD geometry descriptions, including meshes,
 * curves, points, and other geometric primitives.
 */

import type { USDPrim } from './scene';

/**
 * Geometry purpose
 */
export type GeometryPurpose = 'default' | 'proxy' | 'guide' | 'render';

/**
 * Orientation types
 */
export type Orientation = 'rightHanded' | 'leftHanded';

/**
 * Subdivision scheme
 */
export type SubdivisionScheme = 'none' | 'catmullClark' | 'loop' | 'bilinear';

/**
 * Face varying interpolation
 */
export type FaceVaryingInterpolation = 'uniform' | 'varying' | 'vertex' | 'faceVarying';

/**
 * Mesh geometry interface
 */
export interface MeshPrim extends USDPrim {
  type: 'Mesh';
  /** Vertex positions */
  points: [number, number, number][];
  /** Face vertex counts */
  faceVertexCounts: number[];
  /** Face vertex indices */
  faceVertexIndices: number[];
  /** Normals */
  normals?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** UV coordinates */
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
      values: any[];
      interpolation?: FaceVaryingInterpolation;
    };
  };
  /** Vertex colors */
  displayColor?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** Vertex opacity */
  displayOpacity?: {
    values: number[];
    interpolation?: FaceVaryingInterpolation;
  };
  /** Subdivision scheme */
  subdivisionScheme?: SubdivisionScheme;
  /** Crease edges */
  creases?: {
    edgeIndices: number[];
    edgeSharpnesses: number[];
  };
  /** Corner sharpness */
  cornerSharpnesses?: {
    indices: number[];
    sharpnesses: number[];
  };
  /** Hole faces */
  holeIndices?: number[];
  /** Double-sided rendering */
  doubleSided?: boolean;
  /** Orientation */
  orientation?: Orientation;
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Curves geometry interface
 */
export interface CurvesPrim extends USDPrim {
  type: 'Curves';
  /** Curve vertex counts per curve */
  curveVertexCounts: number[];
  /** Curve vertices */
  points: [number, number, number][];
  /** Curve widths */
  widths?: {
    values: number[];
    interpolation?: 'uniform' | 'varying' | 'vertex';
  };
  /** Curve normals */
  normals?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** Curve type */
  type?: 'linear' | 'cubic';
  /** Basis */
  basis?: 'bezier' | 'bspline' | 'catmullRom';
  /** Wrap mode */
  wrap?: 'nonperiodic' | 'periodic' | 'pinned';
  /** Purpose */
  purpose?: GeometryPurpose;
}

/**
 * Points geometry interface
 */
export interface PointsPrim extends USDPrim {
  type: 'Points';
  /** Point positions */
  points: [number, number, number][];
  /** Point widths */
  widths?: {
    values: number[];
    interpolation?: 'uniform' | 'varying' | 'vertex';
  };
  /** Point normals */
  normals?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** Point IDs */
  ids?: number[];
  /** Point colors */
  displayColor?: {
    values: [number, number, number][];
    interpolation?: FaceVaryingInterpolation;
  };
  /** Point opacity */
  displayOpacity?: {
    values: number[];
    interpolation?: FaceVaryingInterpolation;
  };
  /** Purpose */
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
