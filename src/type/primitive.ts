/**
 * USD Primitive Type Definitions
 *
 * Defines types for primitive shapes, their attributes,
 * and common geometric properties.
 */

import { USDPrim } from './scene';

/**
 * Primitive types
 */
export type PrimitiveType =
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
export interface PrimitiveAttributes {
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
  ** Tubular segments (for tube, torus) */
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
  pivot?: [number, number, number];
  /** Scale */
  scale?: [number, number, number];
}

/**
 * Cube primitive
 */
export interface CubePrimitive extends USDPrim {
  type: 'Cube';
  /** Cube size */
  size: number;
  /** Cube center */
  center?: [number, number, number];
  /** Subdivisions */
  subdivisions?: [number, number, number];
}

/**
 * Sphere primitive
 */
export interface SpherePrimitive extends USDPrim {
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
export interface CylinderPrimitive extends USDPrim {
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
export interface ConePrimitive extends USDPrim {
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
export interface TorusPrimitive extends USDPrim {
  type: 'Torus';
  /** Torus radius */
  radius: number;
  /** Tube radius */
  tube: number;
  /** Radial segments */
  radialSegments?: number;
  ** Tubular segments */
  tubularSegments?: number;
  /** Arc */
  arc?: number;
}

/**
** Torus knot primitive
 */
export interface TorusKnotPrimitive extends USDPrim {
  type: 'TorusKnot';
  /** Torus radius */
  radius: number;
  /** Tube radius */
  tube: number;
  ** Tubular segments */
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
export interface TubePrimitive extends USDPrim {
  type: 'Tube';
  /** Tube path */
  path: [number, number, number][];
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
export interface PlanePrimitive extends USDPrim {
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
export interface CirclePrimitive extends USDPrim {
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
export interface CapsulePrimitive extends USDPrim {
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
export interface TetrahedronPrimitive extends USDPrim {
  type: 'Tetrahedron';
  /** Tetrahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Octahedron primitive
 */
export interface OctahedronPrimitive extends USDPrim {
  type: 'Octahedron';
  /** Octahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Icosahedron primitive
 */
export interface IcosahedronPrimitive extends USDPrim {
  type: 'Icosahedron';
  /** Icosahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Dodecahedron primitive
 */
export interface DodecahedronPrimitive extends USDPrim {
  type: 'Dodecahedron';
  /** Dodecahedron radius */
  radius: number;
  /** Detail level */
  detail?: number;
}

/**
 * Ring primitive
 */
export interface RingPrimitive extends USDPrim {
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
export interface ShapePrimitive extends USDPrim {
  type: 'Shape';
  /** Shape type */
  shapeType: 'path' | 'circle' | 'rectangle' | 'ellipse' | 'polygon';
  /** Shape parameters */
  parameters: Record<string, any>;
  /** Shape transform */
  transform?: number[];
}

/**
 * Text primitive
 */
export interface TextPrimitive extends USDPrim {
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
export interface ExtrusionPrimitive extends USDPrim {
  type: 'Extrude';
  /** Shape to extrude */
  shape: ShapePrimitive;
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
export interface LathePrimitive extends USDPrim {
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
export interface PrimitiveCollection {
  /** Collection name */
  name: string;
  /** Primitives in collection */
  primitives: PrimitivePrimitive[];
  /** Collection properties */
  properties?: Record<string, any>;
}

/**
 * Primitive generator settings
 */
export interface PrimitiveGeneratorSettings {
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
export interface PrimitiveState {
  /** Primitive ID */
  id: string;
  /** Primitive type */
  type: PrimitiveType;
  /** Primitive attributes */
  attributes: PrimitiveAttributes;
  /** Vertex count */
  vertexCount: number;
  /** Face count */
  faceCount: number;
  /** Is primitive generated */
  isGenerated: boolean;
}