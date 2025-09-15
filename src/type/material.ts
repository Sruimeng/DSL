/**
 * USD Material Type Definitions
 *
 * Defines types for USD materials, including surface models,
 * shaders, textures, and material properties.
 */

import { USDPrim } from './scene';

/**
 * Material model types
 */
export type MaterialModel = 'usdPreviewSurface' | 'mdl' | 'custom';

/**
 * Shader stages
 */
export type ShaderStage = 'vertex' | 'fragment' | 'compute' | 'geometry' | 'tessellation';

/**
 * Texture coordinate sets
 */
export type TexCoordSet = 'st' | 'uv' | 'st0' | 'uv0' | 'st1' | 'uv1';

/**
 * Texture types
 */
export type TextureType = 'color' | 'normal' | 'roughness' | 'metallic' | 'emissive' | 'opacity' | 'displacement' | 'occlusion';

/**
 * Texture wrapping modes
 */
export type TextureWrap = 'repeat' | 'clamp' | 'mirror' | 'black' | 'white';

/**
 * Texture filtering modes
 */
export type TextureFilter = 'nearest' | 'linear' | 'mipmap';

/**
 * Texture information
 */
export interface TextureInfo {
  /** Texture asset path */
  asset: string;
  /** Texture coordinate set */
  uvSet?: TexCoordSet;
  /** Wrap mode */
  wrap?: TextureWrap;
  /** Filter mode */
  filter?: TextureFilter;
  /** Transform matrix */
  transform?: number[];
  /** Channel selection */
  channel?: 'r' | 'g' | 'b' | 'a' | 'rgb';
}

/**
 * USD Preview Surface shader inputs
 */
export interface PreviewSurfaceInputs {
  /** Base color */
  diffuseColor?: [number, number, number, number] | TextureInfo;
  /** Emissive color */
  emissiveColor?: [number, number, number] | TextureInfo;
  /** Specular color */
  specularColor?: [number, number, number] | TextureInfo;
  /** Metallic value (0-1) */
  metallic?: number | TextureInfo;
  /** Roughness value (0-1) */
  roughness?: number | TextureInfo;
  /** Clearcoat strength (0-1) */
  clearcoat?: number | TextureInfo;
  /** Clearcoat roughness (0-1) */
  clearcoatRoughness?: number | TextureInfo;
  /** Opacity (0-1) */
  opacity?: number | TextureInfo;
  /** Opacity threshold */
  opacityThreshold?: number;
  /** Normal map */
  normal?: TextureInfo;
  /** Displacement map */
  displacement?: TextureInfo;
  /** Ambient occlusion */
  occlusion?: TextureInfo;
  /** IOR (Index of Refraction) */
  ior?: number;
  /** Use spec workflow instead of metallic */
  useSpecularWorkflow?: number;
}

/**
 * MDL material definition
 */
export interface MDLMaterial {
  /** MDL module name */
  module: string;
  /** Material name */
  name: string;
  /** Material parameters */
  parameters: Record<string, any>;
  /** MDL source code */
  source?: string;
}

/**
 * Custom shader definition
 */
export interface CustomShader {
  /** Shader stages */
  stages: Record<ShaderStage, string>;
  /** Uniform variables */
  uniforms: Record<string, {
    type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'sampler2D';
    value: any;
  }>;
  /** Vertex attributes */
  attributes?: string[];
  /** Varying variables */
  varyings?: Record<string, string>;
}

/**
 * Material prim interface
 */
export interface MaterialPrim extends USDPrim {
  type: 'Material';
  /** Material model */
  model: MaterialModel;
  /** Preview surface inputs */
  previewSurface?: PreviewSurfaceInputs;
  /** MDL material */
  mdl?: MDLMaterial;
  /** Custom shader */
  customShader?: CustomShader;
  /** Material outputs */
  outputs?: {
    surface?: string;
    displacement?: string;
    volume?: string;
  };
}

/**
 * Shader network node
 */
export interface ShaderNode {
  /** Node identifier */
  id: string;
  /** Node type */
  type: string;
  /** Input connections */
  inputs: Record<string, {
    type: 'uniform' | 'attribute' | 'connection';
    value?: any;
    connection?: string;
  }>;
  /** Output connections */
  outputs: Record<string, string>;
}

/**
 * Material graph representation
 */
export interface MaterialGraph {
  /** Graph name */
  name: string;
  /** Nodes in the graph */
  nodes: ShaderNode[];
  /** Output connections */
  outputs: {
    surface: string;
    displacement?: string;
    volume?: string;
  };
}

/**
 * Material variant
 */
export interface MaterialVariant {
  /** Variant name */
  name: string;
  /** Variant selection */
  selection: Record<string, string>;
  /** Variant properties */
  properties?: Record<string, any>;
}

/**
 * Material collection with variants
 */
export interface MaterialCollection {
  /** Collection name */
  name: string;
  /** Base material */
  base: MaterialPrim;
  /** Material variants */
  variants: MaterialVariant[];
}

/**
 * Material binding information
 */
export interface MaterialBinding {
  /** Material path */
  materialPath: string;
  /** Binding purpose */
  purpose: 'full' | 'preview' | 'geometry' | 'render';
  /** Collection selection */
  collection?: {
    name: string;
    variant?: string;
  };
  /** Strength of binding */
  strength?: number;
}

/**
 * Material library organization
 */
export interface MaterialLibrary {
  /** Library name */
  name: string;
  /** Materials in library */
  materials: Record<string, MaterialPrim>;
  /** Material collections */
  collections: Record<string, MaterialCollection>;
  /** Material lookups */
  lookups: Record<string, string>;
}

/**
 * Material state for runtime
 */
export interface MaterialState {
  /** Material ID */
  id: string;
  /** Is material loaded */
  isLoaded: boolean;
  /** Compiled shaders */
  shaders: Record<string, any>;
  /** Texture references */
  textures: Map<string, any>;
  /** Uniform values */
  uniforms: Map<string, any>;
  /** Material properties */
  properties: PreviewSurfaceInputs | Record<string, any>;
}