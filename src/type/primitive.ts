/**
 * USD 基元类型定义
 *
 * 定义基元形状、其属性
 * 和常见几何属性的类型。
 */

import type { IParams, IVector3 } from './common';
import type { IUSDPrim } from './scene';

/**
 * Primitive types
 */
export type IPrimitiveType =
  | 'Cube'
  | 'Sphere'
  | 'Cylinder'
  | 'Cone'
  | 'Torus'
  | 'Plane'
  | 'Circle'
  | 'Capsule'
  | 'Tetrahedron'
  | 'Octahedron'
  | 'Icosahedron'
  | 'TorusKnot'
  | 'Tube'
  | 'Lathe'
  | 'Extrude'
  | 'Revolve';

/**
 * Primitive attributes
 */
export interface IPrimitiveAttributes {
  /** Width */
  width?: number;
  /** Height */
  height?: number;
  /** Depth */
  depth?: number;
  /** Radius */
  radius?: number;
  /** Inner radius (for torus, tube) */
  innerRadius?: number;
  /** Outer radius (for torus, tube) */
  outerRadius?: number;
  /** Segments */
  segments?: number;
  /** Radial segments */
  radialSegments?: number;
  /** Tubular segments (for tube, torus) */
  tubularSegments?: number;
  /** Height segments */
  heightSegments?: number;
  /** Open ended */
  openEnded?: boolean;
  /** Theta start */
  thetaStart?: number;
  /** Theta length */
  thetaLength?: number;
  /** Phi start */
  phiStart?: number;
  /** Phi length */
  phiLength?: number;
  /** Pivot point */
  pivot?: IVector3;
  /** Scale */
  scale?: IVector3;
}

/**
 * Cube primitive
 */
export interface ICubePrimitive extends IUSDPrim {
  type: 'Cube';
  /** Cube size */
  size: number;
  /** Cube center */
  center?: IVector3;
  /** Subdivisions */
  subdivisions?: [number, number, number];
}

/**
 * Sphere primitive
 */
export interface ISpherePrimitive extends IUSDPrim {
  type: 'Sphere';
  /** Sphere radius */
  radius: number;
  /** Width segments */
  widthSegments?: number;
  /** Height segments */
  heightSegments?: number;
  /** Phi start angle */
  phiStart?: number;
  /** Phi length angle */
  phiLength?: number;
  /** Theta start angle */
  thetaStart?: number;
  /** Theta length angle */
  thetaLength?: number;
}

/**
 * Cylinder primitive
 */
export interface ICylinderPrimitive extends IUSDPrim {
  type: 'Cylinder';
  /** Cylinder radius */
  radiusTop?: number;
  /** Cylinder bottom radius */
  radiusBottom?: number;
  /** Cylinder height */
  height: number;
  /** Radial segments */
  radialSegments?: number;
  /** Height segments */
  heightSegments?: number;
  /** Open ended */
  openEnded?: boolean;
  /** Theta start */
  thetaStart?: number;
  /** Theta length */
  thetaLength?: number;
}

/**
 * Cone primitive
 */
export interface IConePrimitive extends IUSDPrim {
  type: 'Cone';
  /** Cone radius */
  radius: number;
  /** Cone height */
  height: number;
  /** Radial segments */
  radialSegments?: number;
  /** Height segments */
  heightSegments?: number;
  /** Open ended */
  openEnded?: boolean;
  /** Theta start */
  thetaStart?: number;
  /** Theta length */
  thetaLength?: number;
}

/**
 * Torus primitive
 */
export interface ITorusPrimitive extends IUSDPrim {
  type: 'Torus';
  /** Torus radius */
  radius: number;
  /** Tube radius */
  tube: number;
  /** Radial segments */
  radialSegments?: number;
  /** Tubular segments */
  tubularSegments?: number;
  /** Arc */
  arc?: number;
}

/**
 * Torus knot primitive
 */
export interface ITorusKnotPrimitive extends IUSDPrim {
  type: 'TorusKnot';
  /** Torus radius */
  radius: number;
  /** Tube radius */
  tube: number;
  /** Tubular segments */
  tubularSegments?: number;
  /** Radial segments */
  radialSegments?: number;
  /** P value */
  p?: number;
  /** Q value */
  q?: number;
}

/**
 * Tube primitive
 */
export interface ITubePrimitive extends IUSDPrim {
  type: 'Tube';
  /** Tube path */
  path: IVector3[];
  /** Tube radius */
  radius?: number;
  /** Tube segments */
  tubularSegments?: number;
  /** Radial segments */
  radialSegments?: number;
  /** Closed */
  closed?: boolean;
}

/**
 * Plane primitive
 */
export interface IPlanePrimitive extends IUSDPrim {
  type: 'Plane';
  /** Plane width */
  width: number;
  /** Plane height */
  height: number;
  /** Width segments */
  widthSegments?: number;
  /** Height segments */
  heightSegments?: number;
}

/**
 * Circle primitive
 */
export interface ICirclePrimitive extends IUSDPrim {
  type: 'Circle';
  /** Circle radius */
  radius: number;
  /** Segments */
  segments?: number;
  /** Theta start */
  thetaStart?: number;
  /** Theta length */
  thetaLength?: number;
}

/**
 * Capsule primitive
 */
export interface ICapsulePrimitive extends IUSDPrim {
  type: 'Capsule';
  /** Capsule radius */
  radius: number;
  /** Capsule height (excluding hemispheres) */
  height: number;
  /** Capsule segments */
  capSegments?: number;
  /** Radial segments */
  radialSegments?: number;
}

/**
 * Tetrahedron primitive
 */
export interface ITetrahedronPrimitive extends IUSDPrim {
  type: 'Tetrahedron';
  /** Tetrahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Octahedron primitive
 */
export interface IOctahedronPrimitive extends IUSDPrim {
  type: 'Octahedron';
  /** Octahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Icosahedron primitive
 */
export interface IIcosahedronPrimitive extends IUSDPrim {
  type: 'Icosahedron';
  /** Icosahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Dodecahedron primitive
 */
export interface IDodecahedronPrimitive extends IUSDPrim {
  type: 'Dodecahedron';
  /** Dodecahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Ring primitive
 */
export interface IRingPrimitive extends IUSDPrim {
  type: 'Ring';
  /** Inner radius */
  innerRadius: number;
  /** Outer radius */
  outerRadius: number;
  /** Theta segments */
  thetaSegments?: number;
  /** Phi segments */
  phiSegments?: number;
  /** Theta start */
  thetaStart?: number;
  /** Theta length */
  thetaLength?: number;
}

/**
 * Shape primitive
 */
export interface IShapePrimitive extends IUSDPrim {
  type: 'Shape';
  /** Shape type */
  shapeType: 'path' | 'circle' | 'rectangle' | 'ellipse' | 'polygon';
  /** Shape parameters */
  parameters: IParams;
}

/**
 * Text primitive
 */
export interface ITextPrimitive extends IUSDPrim {
  type: 'Text';
  /** Text content */
  text: string;
  /** Font size */
  size: number;
  /** Font name */
  font?: string;
  /** Height (extrusion depth) */
  height?: number;
  /** Bevel thickness */
  bevelThickness?: number;
  /** Bevel size */
  bevelSize?: number;
  /** Bevel segments */
  bevelSegments?: number;
  /** Curve segments */
  curveSegments?: number;
}

/**
 * Extrusion primitive
 */
export interface IExtrusionPrimitive extends IUSDPrim {
  type: 'Extrude';
  /** Shape to extrude */
  shape: IShapePrimitive;
  /** Extrusion settings */
  settings: {
    depth: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelSegments?: number;
  };
}

/**
 * Lathe primitive
 */
export interface ILathePrimitive extends IUSDPrim {
  type: 'Lathe';
  /** Points to revolve */
  points: [number, number][];
  /** Segments */
  segments?: number;
  /** Phi start */
  phiStart?: number;
  /** Phi length */
  phiLength?: number;
}

/**
 * Primitive collection
 */
export interface IPrimitiveCollection {
  /** Collection name */
  name: string;
  /** Primitives in collection */
  primitives: (
    | ICubePrimitive
    | ISpherePrimitive
    | ICylinderPrimitive
    | IConePrimitive
    | ITorusPrimitive
    | ITorusKnotPrimitive
    | ITubePrimitive
    | IPlanePrimitive
    | ICirclePrimitive
    | ICapsulePrimitive
    | ITetrahedronPrimitive
    | IOctahedronPrimitive
    | IIcosahedronPrimitive
    | IDodecahedronPrimitive
    | IRingPrimitive
    | IShapePrimitive
    | ITextPrimitive
    | IExtrusionPrimitive
    | ILathePrimitive
  )[];
  /** Collection properties */
  properties?: IParams;
}

/**
 * Primitive generator settings
 */
export interface IPrimitiveGeneratorSettings {
  /** UV generation */
  generateUVs: boolean;
  /** Normal generation */
  generateNormals: boolean;
  /** Tangent generation */
  generateTangents: boolean;
  /** Winding order */
  windingOrder: 'cw' | 'ccw';
  /** Indexing mode */
  indexingMode: 'triangle' | 'line' | 'point';
}

/**
 * Primitive state for runtime
 */
export interface IPrimitiveState {
  /** Primitive ID */
  id: string;
  /** Primitive type */
  type: IPrimitiveType;
  /** Primitive attributes */
  attributes: IPrimitiveAttributes;
  /** Vertex count */
  vertexCount: number;
  /** Face count */
  faceCount: number;
  /** Is primitive generated */
  isGenerated: boolean;
}
