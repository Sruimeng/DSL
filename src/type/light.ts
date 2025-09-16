/**
 * USD 光源类型定义
 *
 * 定义 USD 光源的类型，包括各种光源类型、
 * 阴影属性和光传输配置。
 */

import type { IUSDPrim } from './scene';

/**
 * Light types
 */
export type LightType = 'distant' | 'sphere' | 'disk' | 'rect' | 'dome' | 'cylinder' | 'geometry';

/**
 * Light purpose
 */
export type LightPurpose = 'texture' | 'guide' | 'render';

/**
 * Shadow types
 */
export type ShadowType = 'hard' | 'pcf' | 'pcfSoft' | 'variance' | 'rayTraced';

/**
 * Light filter types
 */
export type LightFilterType = 'shadow' | 'cookie' | 'barndoor' | 'gobo' | 'IES';

/**
 * IES light profile
 */
export interface IESProfile {
  /** IES file path */
  file: string;
  /** Profile rotation */
  rotation?: [number, number, number];
  /** Profile scale */
  scale?: number;
}

/**
 * Light portal configuration
 */
export interface LightPortal {
  /** Portal geometry path */
  geometry: string;
  /** Portal priority */
  priority?: number;
  /** Portal efficiency */
  efficiency?: number;
}

/**
 * Barndoor configuration
 */
export interface BarndoorConfig {
  /** Left barn door angle */
  left?: number;
  /** Right barn door angle */
  right?: number;
  /** Top barn door angle */
  top?: number;
  /** Bottom barn door angle */
  bottom?: number;
}

/**
 * Gobo configuration
 */
export interface GoboConfig {
  /** Gobo texture path */
  texture: string;
  /** Gobo rotation */
  rotation?: number;
  /** Gobo scale */
  scale?: [number, number];
}

/**
 * Light base interface
 */
export interface ILightPrim extends IUSDPrim {
  type: 'Light';
  /** Light type */
  lightType: LightType;
  /** Light color */
  color: [number, number, number];
  /** Light intensity */
  intensity: number;
  /** Light exposure (EV) */
  exposure?: number;
  /** Light purpose */
  purpose?: LightPurpose;
  /** Normalize color by intensity */
  normalize?: boolean;
  /** Enable/disable light */
  enable: boolean;
  /** Shadow configuration */
  shadow?: {
    enable: boolean;
    type?: ShadowType;
    color?: [number, number, number];
    distance?: number;
    bias?: number;
    softness?: number;
    resolution?: [number, number];
  };
  /** Light filters */
  filters?: LightFilter[];
  /** Light portals */
  portals?: LightPortal[];
}

/**
 * Light filter base interface
 */
export interface LightFilter {
  /** Filter type */
  type: LightFilterType;
  /** Filter name */
  name: string;
  /** Filter intensity */
  intensity?: number;
  /** Filter color */
  color?: [number, number, number];
  /** Filter-specific settings */
  settings?: Record<string, unknown>;
}

/**
 * Distant light (directional)
 */
export interface IDistantLight extends ILightPrim {
  lightType: 'distant';
  /** Light angle (degrees) */
  angle: number;
}

/**
 * Sphere light (point light)
 */
export interface ISphereLight extends ILightPrim {
  lightType: 'sphere';
  /** Light radius */
  radius: number;
  /** Attenuation radius */
  attenuationRadius?: number;
  /** Treat as area light */
  treatAsArea?: boolean;
}

/**
 * Disk light
 */
export interface IDiskLight extends ILightPrim {
  lightType: 'disk';
  /** Disk radius */
  radius: number;
  /** Disk normal direction */
  normal: [number, number, number];
  /** Treat as area light */
  treatAsArea?: boolean;
}

/**
 * Rectangle light (area light)
 */
export interface IRectLight extends ILightPrim {
  lightType: 'rect';
  /** Rectangle width */
  width: number;
  /** Rectangle height */
  height: number;
  /** Rectangle normal direction */
  normal: [number, number, number];
  /** Texture for projection */
  texture?: string;
  /** Treat as area light */
  treatAsArea?: boolean;
}

/**
 * Cylinder light
 */
export interface ICylinderLight extends ILightPrim {
  lightType: 'cylinder';
  /** Cylinder radius */
  radius: number;
  /** Cylinder length */
  length: number;
  /** Cylinder axis direction */
  axis: [number, number, number];
  /** Treat as area light */
  treatAsArea?: boolean;
}

/**
 * Geometry light (mesh light)
 */
export interface IGeometryLight extends ILightPrim {
  lightType: 'geometry';
  /** Reference to geometry prim */
  geometry: string;
  /** Double-sided emission */
  doubleSided?: boolean;
  /** Normalize by area */
  normalizeByArea?: boolean;
}

/**
 * Light linking configuration
 */
export interface LightLinking {
  /** Light path */
  lightPath: string;
  /** Linked objects */
  objects: string[];
  /** Link type */
  type: 'include' | 'exclude';
}

/**
 * Light group
 */
export interface LightGroup {
  /** Group name */
  name: string;
  /** Light paths in group */
  lights: string[];
  /** Group properties */
  properties?: Record<string, unknown>;
}

/**
 * Light rig configuration
 */
export interface LightRig {
  /** Rig name */
  name: string;
  /** Rig type */
  type: 'studio' | 'natural' | 'volumetric' | 'custom';
  /** Lights in rig */
  lights: ILightPrim[];
  /** Rig settings */
  settings?: {
    intensityMultiplier?: number;
    colorTemperature?: number;
    shadowQuality?: number;
  };
}

/**
 * Light transport configuration
 */
export interface LightTransport {
  /** Enable light transport */
  enable: boolean;
  /** Transport algorithm */
  algorithm: 'pathTracing' | 'photonMapping' | 'bidirectional';
  /** Max bounce count */
  maxBounces?: number;
  /** Sampling settings */
  sampling?: {
    PerPixel?: number;
    adaptive?: boolean;
    threshold?: number;
  };
}

/**
 * Light state for runtime
 */
export interface LightState {
  /** Light ID */
  id: string;
  /** Light type */
  type: LightType;
  /** Current color */
  color: [number, number, number];
  /** Current intensity */
  intensity: number;
  /** Current position */
  position?: [number, number, number];
  /** Current direction */
  direction?: [number, number, number];
  /** Light properties */
  properties: Record<string, unknown>;
  /** Shadow state */
  shadow?: {
    enabled: boolean;
    map?: unknown;
    matrix?: number[];
  };
  /** Is light visible */
  visible: boolean;
}
