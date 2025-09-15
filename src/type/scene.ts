/**
 * USD Scene Type Definitions
 *
 * Defines types for USD scene descriptions, including hierarchy, prims,
 * and scene-level properties.
 */

/**
 * Basic USD prim type identifier
 */
export type PrimType = 'Xform' | 'Mesh' | 'Camera' | 'Light' | 'Material' | 'Scope' | 'GeomSubset';

/**
 * Base interface for all USD prims
 */
export interface USDPrim {
  /** Unique identifier for this prim */
  name: string;
  /** Type of the prim */
  type: PrimType;
  /** Parent prim path */
  parent?: string;
  /** Whether this prim is active */
  active?: boolean;
  /** Visibility state */
  visibility?: 'inherited' | 'invisible';
  /** User-defined properties */
  customData?: Record<string, any>;
}

/**
 * Transform properties for Xform prims
 */
export interface Transform {
  /** Translation in 3D space */
  translate?: [number, number, number];
  /** Rotation in Euler angles (degrees) */
  rotate?: [number, number, number];
  /** Scale factor */
  scale?: [number, number, number];
  /** Rotation pivot */
  pivot?: [number, number, number];
  /** Transformation matrix (16 values in row-major order) */
  matrix?: number[];
}

/**
 * Xform prim - defines transformation hierarchy
 */
export interface XformPrim extends USDPrim {
  type: 'Xform';
  /** Transform properties */
  xformOpOrder?: string[];
  transform?: Transform;
}

/**
 * Reference to another prim or external asset
 */
export interface Reference {
  /** Path to the referenced prim */
  path: string;
  /** Optional layer offset for time remapping */
  layerOffset?: {
    offset: number;
    scale: number;
  };
}

/**
 * Payload for payload composition
 */
export interface Payload {
  /** Asset path containing the payload */
  assetPath: string;
  /** Prim path within the asset */
  primPath?: string;
}

/**
 * Scope prim - organizational container
 */
export interface ScopePrim extends USDPrim {
  type: 'Scope';
  /** Child prims */
  children?: USDPrim[];
  /** References to other scopes */
  references?: Reference[];
  /** Payload references */
  payload?: Payload[];
}

/**
 * Purpose classification for prims
 */
export type Purpose = 'default' | 'render' | 'proxy' | 'guide';

/**
 * Bound extents in 3D space
 */
export interface Extent {
  /** Minimum corner */
  min: [number, number, number];
  /** Maximum corner */
  max: [number, number, number];
}

/**
 * GeomSubset - defines subsets of geometry
 */
export interface GeomSubsetPrim extends USDPrim {
  type: 'GeomSubset';
  /** Subset type */
  elementType: 'face' | 'point' | 'vertex';
  /** Indices of the subset */
  indices: number[];
  /** Family name for grouping subsets */
  familyName?: string;
}

/**
 * Scene-level metadata
 */
export interface SceneMetadata {
  /** Default prim in the scene */
  defaultPrim?: string;
  /** Up axis orientation */
  upAxis?: 'Y' | 'Z';
  /** Time codes per second */
  timeCodesPerSecond?: number;
  /** Scene start time */
  startTime?: number;
  /** Scene end time */
  endTime?: number;
  /** Frame rate */
  frameRate?: number;
  /** Author information */
  authoredBy?: string;
  /** Creation date */
  created?: string;
  /** Last modified date */
  modified?: string;
  /** Custom metadata */
  customData?: Record<string, any>;
}

/**
 * Layer information
 */
export interface Layer {
  /** Layer identifier */
  identifier: string;
  /** Layer version */
  version?: string;
  /** Layer comments */
  comment?: string;
  /** Sublayers */
  subLayers?: string[];
}

/**
 * Complete USD Scene description
 */
export interface USDScene {
  /** Scene metadata */
  metadata?: SceneMetadata;
  /** Layer information */
  layer?: Layer;
  /** Root prims in the scene */
  prims: USDPrim[];
  /** Global purpose */
  purpose?: Purpose;
  /** Scene extent */
  extent?: Extent;
}

/**
 * Scene state for the DSL Engine
 */
export interface SceneState {
  /** Current scene objects */
  objects: Map<string, any>;
  /** Active camera */
  activeCamera?: string;
  /** Scene bounds */
  bounds?: Extent;
  /** Current time */
  currentTime: number;
  /** Is scene loaded */
  isLoaded: boolean;
  /** Is render loop running */
  isRunning: boolean;
}
