/**
 * USD Renderer Type Definitions
 *
 * Defines types for renderer configurations, render passes,
 * rendering properties, and render outputs.
 */

/**
 * Rendering API types
 */
export type RenderAPI = 'WebGL' | 'WebGL2' | 'WebGPU';

/**
 * Anti-aliasing modes
 */
export type AntiAliasing = 'none' | 'msaa' | 'fxaa' | 'taa' | 'smaa';

/**
 * Rendering quality presets
 */
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Render buffer types
 */
export type BufferType = 'color' | 'depth' | 'stencil' | 'normal' | 'position' | 'velocity';

/**
 * Render output formats
 */
export type OutputFormat =
  | 'rgba8'
  | 'rgba16f'
  | 'rgba32f'
  | 'rgb8'
  | 'rgb16f'
  | 'r32f'
  | 'depth24'
  | 'depth32f';

/**
 * Render pass types
 */
export type RenderPassType =
  | 'shadow'
  | 'prepass'
  | 'gbuffer'
  | 'lighting'
  | 'reflection'
  | 'postprocess'
  | 'composite';

/**
 * Texture filtering modes
 */
export type TextureFilter = 'nearest' | 'linear' | 'mipmap';

/**
 * Texture wrapping modes
 */
export type TextureWrap = 'repeat' | 'clamp' | 'mirror';

/**
 * Render target configuration
 */
export interface RenderTarget {
  /** Target name */
  name: string;
  /** Texture format */
  format: OutputFormat;
  /** Target dimensions */
  size: {
    width: number;
    height: number;
  };
  /** Multi-sampling samples */
  samples?: number;
  /** Generate mipmaps */
  mipmaps?: boolean;
  /** Texture filter */
  filter?: TextureFilter;
  /** Texture wrap mode */
  wrap?: TextureWrap;
  /** Clear color */
  clearColor?: [number, number, number, number];
  /** Clear on render */
  clear?: boolean;
}

/**
 * Render pass configuration
 */
export interface RenderPass {
  /** Pass name */
  name: string;
  /** Pass type */
  type: RenderPassType;
  /** Enable/disable pass */
  enabled: boolean;
  /** Render targets for this pass */
  targets: string[];
  /** Shader source */
  shader?: {
    vertex: string;
    fragment: string;
  };
  /** Pass-specific settings */
  settings?: Record<string, any>;
  /** Input dependencies */
  inputs?: string[];
  /** Output dependencies */
  outputs?: string[];
  /** Execution order */
  order: number;
}

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  /** Enable shadows */
  enabled: boolean;
  /** Shadow map size */
  size: [number, number];
  /** Shadow type */
  type: 'hard' | 'pcf' | 'pcfSoft' | 'variance';
  /** Shadow camera settings */
  camera?: {
    near: number;
    far: number;
    fov?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  /** Shadow bias */
  bias?: number;
  /** Shadow normal bias */
  normalBias?: number;
  /** Cascade settings for directional lights */
  cascades?: {
    count: number;
    splits: number[];
  };
}

/**
 * Post-processing effect configuration
 */
export interface PostProcessEffect {
  /** Effect name */
  name: string;
  /** Enable/disable effect */
  enabled: boolean;
  /** Effect parameters */
  parameters: Record<string, any>;
  /** Render order */
  order: number;
}

/**
 * Tone mapping settings
 */
export interface ToneMapping {
  /** Enable tone mapping */
  enabled: boolean;
  /** Tone mapping operator */
  operator: 'none' | 'linear' | 'reinhard' | 'aces' | 'filmic';
  /** Exposure adjustment */
  exposure: number;
  /** White point */
  whitePoint?: number;
}

/**
 * Renderer settings
 */
export interface RendererSettings {
  /** Rendering API */
  api: RenderAPI;
  /** Canvas selector */
  canvas: string;
  /** Anti-aliasing mode */
  antialias: AntiAliasing;
  /** MSAA samples (if MSAA enabled) */
  samples?: number;
  /** Quality preset */
  quality: QualityPreset;
  /** Pixel ratio */
  pixelRatio: number;
  /** Background color */
  background: {
    type: 'color' | 'gradient' | 'skybox';
    color?: [number, number, number];
    gradient?: {
      top: [number, number, number];
      bottom: [number, number, number];
    };
    skybox?: string;
  };
  /** Shadow configuration */
  shadows: ShadowConfig;
  /** Tone mapping */
  toneMapping: ToneMapping;
  /** Maximum lights */
  maxLights?: number;
  /** Render targets */
  renderTargets: Record<string, RenderTarget>;
  /** Render passes */
  renderPasses: RenderPass[];
  /** Post-processing effects */
  postProcess: PostProcessEffect[];
  /** Debug options */
  debug?: {
    wireframe?: boolean;
    normals?: boolean;
    bounds?: boolean;
    lights?: boolean;
    shadows?: boolean;
  };
  /** Performance settings */
  performance?: {
    adaptiveQuality?: boolean;
    targetFPS?: number;
    lodBias?: number;
  };
}

/**
 * Render statistics
 */
export interface RenderStats {
  /** Frame time in milliseconds */
  frameTime: number;
  /** Frames per second */
  fps: number;
  /** Draw calls */
  drawCalls: number;
  /** Triangles rendered */
  triangles: number;
  /** Texture memory usage */
  textureMemory: number;
  /** Buffer memory usage */
  bufferMemory: number;
  /** Active lights */
  activeLights: number;
  /** Shadow casters */
  shadowCasters: number;
  /** Render passes executed */
  passesExecuted: number[];
}

/**
 * Render output configuration
 */
export interface RenderOutput {
  /** Output name */
  name: string;
  /** Output type */
  type: 'image' | 'video' | 'stream';
  /** Format */
  format: 'png' | 'jpg' | 'exr' | 'mp4' | 'webm';
  /** Resolution */
  resolution: {
    width: number;
    height: number;
  };
  /** Output path */
  path?: string;
  /** Frame range */
  frameRange?: {
    start: number;
    end: number;
  };
  /** Output settings */
  settings?: {
    quality?: number;
    bitrate?: number;
    fps?: number;
  };
}

/**
 * Renderer interface for Three.js integration
 */
export interface USDRenderer {
  /** Initialize renderer with settings */
  initialize(settings: RendererSettings): Promise<void>;
  /** Render a frame */
  render(): void;
  /** Resize renderer */
  resize(width: number, height: number): void;
  /** Get render statistics */
  getStats(): RenderStats;
  /** Add render output */
  addOutput(output: RenderOutput): void;
  /** Remove render output */
  removeOutput(name: string): void;
  /** Enable/disable render pass */
  togglePass(passName: string, enabled: boolean): void;
  /** Update renderer settings */
  updateSettings(settings: Partial<RendererSettings>): void;
  /** Dispose renderer resources */
  dispose(): void;
}
