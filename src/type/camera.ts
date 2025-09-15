/**
 * USD 相机类型定义
 *
 * 定义 USD 相机描述的类型，包括各种投影类型、
 * 立体设置和相机属性。
 */

import type { IUSDPrim } from './scene';

/**
 * Camera projection types
 */
export type ProjectionType = 'perspective' | 'orthographic';

/**
 * Camera stereo modes
 */
export type StereoMode = 'none' | 'left' | 'right' | 'mono';

/**
 * Film gate aperture sizes (in inches)
 */
export type FilmGate =
  | 'user'
  | '16mm'
  | 'super16mm'
  | '35mm'
  | 'super35mm'
  | '65mm'
  | '70mm'
  | 'vistaVision'
  | 'academy';

/**
 * Camera projection attributes
 */
export interface ProjectionAttributes {
  /** Projection type */
  projection: ProjectionType;
  /** Horizontal aperture in millimeters */
  horizontalAperture: number;
  /** Vertical aperture in millimeters */
  verticalAperture: number;
  /** Horizontal aperture offset in millimeters */
  horizontalApertureOffset: number;
  /** Vertical aperture offset in millimeters */
  verticalApertureOffset: number;
  /** Focal length in millimeters */
  focalLength: number;
  /** Clipping near plane */
  clippingRange: [number, number];
}

/**
 * Perspective camera specific attributes
 */
export interface PerspectiveAttributes extends ProjectionAttributes {
  projection: 'perspective';
  /** Field of view (degrees) */
  fovy?: number;
  /** Depth of field */
  dof?: {
    focusDistance: number;
    fStop: number;
    focusTint?: [number, number, number];
  };
}

/**
 * Orthographic camera specific attributes
 */
export interface OrthographicAttributes extends ProjectionAttributes {
  projection: 'orthographic';
  /** Orthographic width */
  width: number;
  /** Orthographic height */
  height: number;
}

/**
 * Camera exposure attributes
 */
export interface ExposureAttributes {
  /** Exposure compensation in stops */
  exposure: number;
  /** Camera ISO sensitivity */
  iso?: number;
}

/**
 * Camera clipping plane
 */
export interface ClippingPlane {
  /** Normal vector */
  normal: [number, number, number];
  /** Distance from origin */
  distance: number;
}

/**
 * Stereo camera setup
 */
export interface StereoSetup {
  /** Stereo mode */
  mode: StereoMode;
  /** Interocular distance (eye separation) */
  interocularDistance: number;
  /** Convergence distance */
  convergenceDistance: number;
  /** Eye to screen distance */
  eyeToScreenDistance?: number;
}

/**
 * Camera shutter configuration
 */
export interface ShutterConfig {
  /** Shutter open time */
  open: number;
  /** Shutter close time */
  close: number;
  /** Shutter rolling shutter angle */
  rollingShutter?: number;
}

/**
 * Camera prim base interface
 */
export interface ICameraPrim extends IUSDPrim {
  type: 'Camera';
  /** Camera projection attributes */
  attributes: PerspectiveAttributes | OrthographicAttributes;
  /** Exposure attributes */
  exposure?: ExposureAttributes;
  /** Film gate type */
  filmGate?: FilmGate;
  /** Clipping planes */
  clippingPlanes?: ClippingPlane[];
  /** Stereo setup */
  stereo?: StereoSetup;
  /** Shutter configuration */
  shutter?: ShutterConfig;
  /** Camera focus target */
  focusTarget?: string;
  /** Camera follow mode */
  followMode?: 'static' | 'follow' | 'lookAt';
  /** Camera priority in multi-camera setups */
  priority?: number;
}

/**
 * Animated camera parameters
 */
export interface AnimatedCameraParams {
  /** Animated focal length */
  focalLength?: {
    times: number[];
    values: number[];
  };
  /** Animated position */
  position?: {
    times: number[];
    values: [number, number, number][];
  };
  /** Animated rotation */
  rotation?: {
    times: number[];
    values: [number, number, number][];
  };
  /** Animated focus distance */
  focusDistance?: {
    times: number[];
    values: number[];
  };
}

/**
 * Camera rig configuration
 */
export interface CameraRig {
  /** Rig name */
  name: string;
  /** Root camera */
  root: string;
  /** Slave cameras */
  slaves: string[];
  /** Rig type */
  type: 'single' | 'stereo' | 'array' | 'vr';
  /** Rig constraints */
  constraints?: {
    position?: {
      min: [number, number, number];
      max: [number, number, number];
    };
    rotation?: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

/**
 * Multi-camera setup
 */
export interface MultiCameraSetup {
  /** Main/active camera */
  mainCamera: string;
  /** All cameras in the setup */
  cameras: ICameraPrim[];
  /** Camera rigs */
  rigs?: CameraRig[];
  /** Camera switches (time-based) */
  switches?: {
    time: number;
    camera: string;
  }[];
}

/**
 * Camera state for scene management
 */
export interface CameraState {
  /** Current camera position */
  position: [number, number, number];
  /** Current camera rotation */
  rotation: [number, number, number];
  /** Current projection matrix */
  projectionMatrix: number[];
  /** Current view matrix */
  viewMatrix: number[];
  /** Current field of view */
  fov: number;
  /** Current near/far planes */
  clippingRange: [number, number];
  /** Is camera active */
  isActive: boolean;
  /** Camera viewport */
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
