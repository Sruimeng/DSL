import type { SdfPath, UsdPrim, UsdAttribute } from '../types';

// USD材质网络类型
export type ShaderId = string;
export type NodeGraphId = string;

// 标准USD着色器类型（基于UsdPreviewSurface）
export type UsdShaderType =
  | 'UsdPreviewSurface'
  | 'UsdUVTexture'
  | 'UsdTransform2d'
  | 'UsdPrimvarReader'
  | 'UsdTransform'
  | 'UsdShadeNodeGraph'
  | string;

// 材质输出类型
export type MaterialOutputType =
  | 'surface'
  | 'displacement'
  | 'volume'
  | 'light'
  | 'lightFilter'
  | 'custom';

// 材质连接
export interface UsdShadeConnection {
  sourcePath: SdfPath;
  sourceOutput: string;
  type: 'connection' | 'value';
}

// 着色器输入
export interface UsdShadeInput {
  name: string;
  typeName: string;
  value?: any;
  connection?: UsdShadeConnection;
  documentation?: string;
  colorSpace?: string;
  rawValue?: boolean;
}

// 着色器输出
export interface UsdShadeOutput {
  name: string;
  typeName: string;
  renderType?: string;
  documentation?: string;
}

// USD着色器Prim
export interface UsdShader extends UsdPrim {
  shaderId: ShaderId;
  shaderType: UsdShaderType;
  inputs: Map<string, UsdShadeInput>;
  outputs: Map<string, UsdShadeOutput>;
  implementationSource?: 'id' | 'sourceAsset' | 'sourceCode';
  sourceAsset?: string;
  sourceAssetSubIdentifier?: string;
  sourceCode?: string;
}

// USD材质Prim
export interface UsdMaterialPrim extends UsdPrim {
  outputs: Map<string, UsdShadeOutput>;
  surfaceShader?: SdfPath;
  displacementShader?: SdfPath;
  volumeShader?: SdfPath;
  lightShader?: SdfPath;
}

// 节点图
export interface UsdNodeGraph extends UsdPrim {
  nodeGraphId: NodeGraphId;
  inputs: Map<string, UsdShadeInput>;
  outputs: Map<string, UsdShadeOutput>;
  nodes: UsdShader[];
}

// 材质网络
export interface MaterialNetwork {
  materialPath: SdfPath;
  surfaceShader?: UsdShader;
  displacementShader?: UsdShader;
  volumeShader?: UsdShader;
  nodes: UsdShader[];
  nodeGraphs: UsdNodeGraph[];
  connections: UsdShadeConnection[];
}

// 标准USD预览表面参数
export interface UsdPreviewSurfaceParams {
  diffuseColor: [number, number, number];
  emissiveColor: [number, number, number];
  useSpecularWorkflow: boolean;
  specularColor: [number, number, number];
  metallic: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  opacity: number;
  opacityThreshold: number;
  occlusion: number;
  normal: [number, number, number];
  displacement: number;
  ior: number;
}

// UV纹理参数
export interface UsdUVTextureParams {
  file: string;
  st: [number, number];
  wrapS: 'black' | 'clamp' | 'repeat' | 'mirror';
  wrapT: 'black' | 'clamp' | 'repeat' | 'mirror';
  fallback: [number, number, number, number];
  scale: [number, number, number, number];
  bias: [number, number, number, number];
  sourceColorSpace: 'raw' | 'sRGB' | 'auto';
  colorspace: 'raw' | 'sRGB' | 'auto';
}

// 变换2D参数
export interface UsdTransform2dParams {
  in: [number, number];
  rotation: number;
  scale: [number, number];
  translation: [number, number];
}

// Primvar读取器参数
export interface UsdPrimvarReaderParams {
  varname: string;
  fallback?: any;
  type: 'float' | 'float2' | 'float3' | 'float4' | 'int' | 'string' | 'token';
}

// 材质创建选项
export interface MaterialCreateOptions {
  materialName?: string;
  materialPath?: SdfPath;
  surfaceShader?: {
    type: UsdShaderType;
    params?: Record<string, any>;
  };
  displacementShader?: {
    type: UsdShaderType;
    params?: Record<string, any>;
  };
  volumeShader?: {
    type: UsdShaderType;
    params?: Record<string, any>;
  };
}

// 材质应用选项
export interface MaterialApplyOptions {
  bindingPurpose?: 'full' | 'preview' | 'allPurpose';
  materialPurpose?: 'preview' | 'render';
  strength?: 'strongerThanDescendants' | 'fallback';
}

// 材质绑定
export interface MaterialBinding {
  materialPath: SdfPath;
  bindingPurpose: string;
  bindingStrength: string;
  primvars?: string[];
}

// 渲染器材质映射
export interface RendererMaterialMapping {
  rendererName: string;
  shaderName: string;
  inputMappings: Map<string, string>; // USD输入 -> 渲染器输入
  outputMappings: Map<string, string>; // USD输出 -> 渲染器输出
}

// 材质导出选项
export interface MaterialExportOptions {
  format: 'usda' | 'usdc' | 'json';
  includeSourceAssets: boolean;
  flattenConnections: boolean;
  resolveAssetPaths: boolean;
  targetRenderer?: string;
}

// 材质导入结果
export interface MaterialImportResult {
  materialPath: SdfPath;
  warnings: string[];
  errors: string[];
  importedShaders: UsdShader[];
  importedNodeGraphs: UsdNodeGraph[];
  textureDependencies: string[];
}

// 材质验证结果
export interface MaterialValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  brokenConnections: string[];
  missingShaders: string[];
  missingTextures: string[];
  circularDependencies: string[];
}

// 纹理元数据
export interface TextureMetadata {
  width: number;
  height: number;
  channels: number;
  bitDepth: number;
  colorSpace: string;
  hasAlpha: boolean;
  isHDR: boolean;
  fileSize: number;
  format: string;
  compression?: string;
}

// 材质缓存键
export interface MaterialCacheKey {
  materialPath: SdfPath;
  renderContext: string;
  time: number;
}

// 材质缓存值
export interface MaterialCacheValue {
  shaderSource: string;
  uniforms: Record<string, any>;
  textures: Record<string, TextureMetadata>;
  dependencies: string[];
  timestamp: number;
}

// 材质系统配置
export interface MaterialSystemConfig {
  defaultColorSpace: 'sRGB' | 'linear';
  textureCacheSize: number;
  shaderCacheSize: number;
  enableTextureStreaming: boolean;
  maxTextureResolution: number;
  enableMipmaps: boolean;
  textureCompression: 'none' | 'bc' | 'etc' | 'astc';
  targetRenderContexts: string[];
  shaderCompileMode: 'runtime' | 'precompile';
  materialValidation: 'none' | 'basic' | 'strict';
  allowCustomShaders: boolean;
  shaderDebugMode: boolean;
  textureDebugMode: boolean;
}

// 默认材质网络配置
export const DEFAULT_MATERIAL_NETWORK: MaterialNetwork = {
  materialPath: new SdfPath('/World/Materials/DefaultMaterial'),
  surfaceShader: {
    path: new SdfPath('/World/Materials/DefaultMaterial/PreviewSurface'),
    shaderId: 'UsdPreviewSurface',
    shaderType: 'UsdPreviewSurface',
    typeName: 'Shader',
    specifier: 'def',
    active: true,
    attributes: new Map(),
    relationships: new Map(),
    metadata: new Map(),
    inputs: new Map([
      ['diffuseColor', {
        name: 'diffuseColor',
        typeName: 'color3f',
        value: [0.18, 0.18, 0.18],
      }],
      ['metallic', {
        name: 'metallic',
        typeName: 'float',
        value: 0.0,
      }],
      ['roughness', {
        name: 'roughness',
        typeName: 'float',
        value: 0.5,
      }],
    ]),
    outputs: new Map([
      ['surface', {
        name: 'surface',
        typeName: 'token',
      }],
    ]),
  },
  nodes: [],
  nodeGraphs: [],
  connections: [],
};