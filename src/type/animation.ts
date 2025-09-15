/**
 * USD Animation Type Definitions
 *
 * Defines types for USD animations, including time sampling,
 * clips, layers, and animation curves.
 */

/**
 * Time sampling type
 */
export type TimeSamplingType = 'uniform' | 'cyclic' | 'nonuniform';

/**
 * Interpolation type
 */
export type InterpolationType = 'linear' | 'hold' | 'cubic' | 'bezier' | 'hermite';

/**
 * Animation layer type
 */
export type LayerType = 'base' | 'override' | 'add' | 'subtract' | 'multiply';

/**
 * Clip time mapping
 */
export interface ClipTimeMapping {
  /** Source clip time */
  sourceTime: number;
  /** Target scene time */
  targetTime: number;
}

/**
 * Time sampling
 */
export interface TimeSampling {
  /** Sampling type */
  type: TimeSamplingType;
  /** Time samples */
  times: number[];
  /** Interpolation type */
  interpolation: InterpolationType;
  /** Cycle interval (for cyclic sampling) */
  cycleInterval?: [number, number];
}

/**
 * Animation curve
 */
export interface AnimationCurve {
  /** Curve name */
  name: string;
  /** Attribute being animated */
  attribute: string;
  /** Time sampling reference */
  timeSampling: string;
  /** Keyframe values */
  values: any[];
  /** Keyframe tangents (for cubic interpolation) */
  tangents?: {
    in?: number[];
    out?: number[];
  };
  /** Keyframe weights (for bezier interpolation) */
  weights?: {
    in?: number[];
    out?: number[];
  };
  /** Pre-infinity behavior */
  preInfinity?: 'constant' | 'linear' | 'cycle' | 'cycleRelative' | 'oscillate';
  /** Post-infinity behavior */
  postInfinity?: 'constant' | 'linear' | 'cycle' | 'cycleRelative' | 'oscillate';
  /** Enable/disable curve */
  enabled: boolean;
}

/**
 * Animation layer
 */
export interface AnimationLayer {
  /** Layer name */
  name: string;
  /** Layer type */
  type: LayerType;
  /** Layer weight */
  weight: number;
  /** Parent layer */
  parent?: string;
  /** Animation curves in layer */
  curves: AnimationCurve[];
  /** Layer attributes */
  attributes?: Record<string, any>;
  /** Enable/disable layer */
  enabled: boolean;
  /** Layer color (for UI) */
  color?: [number, number, number];
}

/**
 * Animation clip
 */
export interface AnimationClip {
  /** Clip name */
  name: string;
  /** Clip start time */
  startTime: number;
  /** Clip end time */
  endTime: number;
  /** Clip duration */
  duration: number;
  /** Time scaling */
  timeScale: number;
  /** Time offset */
  timeOffset: number;
  /** Clip loop count (0 = infinite) */
  loopCount: number;
  /** Time mapping */
  timeMapping?: ClipTimeMapping[];
  /** Animation layers in clip */
  layers: AnimationLayer[];
  /** Clip metadata */
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
  };
}

/**
 * Blend shape animation
 */
export interface BlendShapeAnimation {
  /** Target name */
  targetName: string;
  /** Weight curve */
  weightCurve: AnimationCurve;
  /** In-between shapes */
  inBetweens?: {
    weight: number;
    targetName: string;
  }[];
}

/**
 * Skeletal animation
 */
export interface SkeletalAnimation {
  /** Joint name */
  jointName: string;
  /** Transform curves */
  transform?: {
    translate?: AnimationCurve;
    rotate?: AnimationCurve;
    scale?: AnimationCurve;
  };
  /** Joint hierarchy */
  hierarchy?: string[];
}

/**
 * Morph animation
 */
export interface MorphAnimation {
  /** Morph target name */
  targetName: string;
  /** Influence curves */
  influences: {
    [target: string]: AnimationCurve;
  };
}

/**
 * Camera animation
 */
export interface CameraAnimation {
  /** Animation curves */
  curves: {
    focalLength?: AnimationCurve;
    focusDistance?: AnimationCurve;
    aperture?: AnimationCurve;
  };
  /** Camera shake */
  shake?: {
    intensity: number;
    frequency: number;
    decay: number;
  };
}

/**
 * Light animation
 */
export interface LightAnimation {
  /** Animation curves */
  curves: {
    intensity?: AnimationCurve;
    color?: AnimationCurve;
    position?: AnimationCurve;
  };
}

/**
 * Material animation
 */
export interface MaterialAnimation {
  /** Animated parameters */
  parameters: {
    [paramName: string]: AnimationCurve;
  };
}

/**
 * Animation track group
 */
export interface TrackGroup {
  /** Group name */
  name: string;
  /** Animation tracks */
  tracks: AnimationCurve[];
  /** Group type */
  type: 'transform' | 'material' | 'camera' | 'light' | 'custom';
  /** Target object path */
  targetPath: string;
}

/**
 * Animation sequence
 */
export interface AnimationSequence {
  /** Sequence name */
  name: string;
  /** Animation clips */
  clips: AnimationClip[];
  /** Track groups */
  trackGroups: TrackGroup[];
  /** Sequence duration */
  duration: number;
  /** Frame rate */
  frameRate: number;
  /** Loop mode */
  loopMode: 'none' | 'loop' | 'pingPong';
  /** Enable/disable sequence */
  enabled: boolean;
}

/**
 * Animation state machine state
 */
export interface AnimationState {
  /** State name */
  name: string;
  /** Animation clip */
  clip?: string;
  /** State transitions */
  transitions: AnimationTransition[];
  /** State speed multiplier */
  speed: number;
  /** State blending */
  blending?: {
    mode: 'none' | 'override' | 'additive';
    weight: number;
  };
}

/**
 * Animation transition
 */
export interface AnimationTransition {
  /** Target state name */
  toState: string;
  /** Transition duration */
  duration: number;
  /** Transition conditions */
  conditions?: {
    parameter: string;
    operator: 'equals' | 'notEquals' | 'greater' | 'less';
    value: any;
  }[];
  /** Transition blend mode */
  blendMode?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/**
 * Animation controller
 */
export interface AnimationController {
  /** Controller name */
  name: string;
  /** Animation states */
  states: AnimationState[];
  /** Default state */
  defaultState: string;
  /** Current state */
  currentState: string;
  /** Controller parameters */
  parameters: Record<string, any>;
}

/**
 * Animation timeline marker
 */
export interface TimelineMarker {
  /** Marker name */
  name: string;
  /** Marker time */
  time: number;
  /** Marker color */
  color?: [number, number, number];
  /** Marker description */
  description?: string;
}

/**
 * Animation timeline
 */
export interface AnimationTimeline {
  /** Timeline duration */
  duration: number;
  /** Timeline markers */
  markers: TimelineMarker[];
  /** Timeline events */
  events: {
    time: number;
    callback: string;
    parameters?: any;
  }[];
}

/**
 * Animation state for runtime
 */
export interface AnimationStateRuntime {
  /** Animation ID */
  id: string;
  /** Current time */
  currentTime: number;
  /** Is playing */
  isPlaying: boolean;
  /** Play speed */
  speed: number;
  /** Loop mode */
  loopMode: 'none' | 'loop' | 'pingPong';
  /** Current frame */
  currentFrame: number;
  /** Total frames */
  totalFrames: number;
}
