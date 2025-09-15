import type { UsdStageImpl } from '../stage';
import type { SdfPath, UsdPrim } from '../types';
import type {
  UsdMaterialPrim,
  UsdShader,
  MaterialNetwork,
  MaterialCreateOptions,
  MaterialValidationResult,
  UsdShaderType,
  UsdPreviewSurfaceParams,
  UsdUVTextureParams,
} from './types';
import { generateUUID } from 'three/src/math/MathUtils.js';

/**
 * USD材质管理器
 */
export class MaterialManager {
  private stage: UsdStageImpl;
  private materialCache: Map<string, MaterialNetwork> = new Map();
  private shaderPresets: Map<UsdShaderType, Record<string, any>> = new Map();

  constructor(stage: UsdStageImpl) {
    this.stage = stage;
    this.initializeShaderPresets();
  }

  /**
   * 初始化着色器预设
   */
  private initializeShaderPresets(): void {
    // UsdPreviewSurface 默认参数
    this.shaderPresets.set('UsdPreviewSurface', {
      diffuseColor: [0.18, 0.18, 0.18],
      emissiveColor: [0, 0, 0],
      useSpecularWorkflow: false,
      specularColor: [0, 0, 0],
      metallic: 0,
      roughness: 0.5,
      clearcoat: 0,
      clearcoatRoughness: 0.01,
      opacity: 1,
      opacityThreshold: 0,
      occlusion: 1,
      normal: [0, 0, 1],
      displacement: 0,
      ior: 1.5,
    } as UsdPreviewSurfaceParams);

    // UsdUVTexture 默认参数
    this.shaderPresets.set('UsdUVTexture', {
      file: '',
      st: [0, 0],
      wrapS: 'repeat',
      wrapT: 'repeat',
      fallback: [0, 0, 0, 1],
      scale: [1, 1, 1, 1],
      bias: [0, 0, 0, 0],
      sourceColorSpace: 'auto',
      colorspace: 'auto',
    } as UsdUVTextureParams);
  }

  /**
   * 创建材质
   */
  createMaterial(options: MaterialCreateOptions): SdfPath {
    const materialPath = options.materialPath || new SdfPath(`/World/Materials/Material_${generateUUID()}`);
    const materialName = options.materialName || materialPath.name;

    // 创建材质Prim
    const materialPrim: UsdMaterialPrim = {
      path: materialPath,
      typeName: 'Material',
      specifier: 'def',
      active: true,
      attributes: new Map(),
      relationships: new Map(),
      metadata: new Map([
        ['displayName', materialName],
        ['documentation', `Material: ${materialName}`],
      ]),
      outputs: new Map(),
    };

    // 创建表面着色器
    if (options.surfaceShader) {
      const shaderPath = materialPath.appendChild('surfaceShader');
      const shader = this.createShader(
        shaderPath,
        options.surfaceShader.type,
        options.surfaceShader.params
      );

      // 连接材质输出到着色器
      materialPrim.outputs.set('surface', {
        name: 'surface',
        typeName: 'token',
        renderType: 'surface',
      });

      materialPrim.surfaceShader = shaderPath;
    }

    // 创建置换着色器
    if (options.displacementShader) {
      const shaderPath = materialPath.appendChild('displacementShader');
      this.createShader(
        shaderPath,
        options.displacementShader.type,
        options.displacementShader.params
      );
      materialPrim.displacementShader = shaderPath;
    }

    // 创建体积着色器
    if (options.volumeShader) {
      const shaderPath = materialPath.appendChild('volumeShader');
      this.createShader(
        shaderPath,
        options.volumeShader.type,
        options.volumeShader.params
      );
      materialPrim.volumeShader = shaderPath;
    }

    // 添加到Stage
    this.stage.definePrim(materialPath, 'Material');
    
    // 缓存材质网络
    const network = this.buildMaterialNetwork(materialPrim);
    this.materialCache.set(materialPath.pathString, network);

    return materialPath;
  }

  /**
   * 创建着色器
   */
  private createShader(path: SdfPath, type: UsdShaderType, params?: Record<string, any>): UsdShader {
    const shader: UsdShader = {
      path,
      typeName: 'Shader',
      specifier: 'def',
      active: true,
      attributes: new Map(),
      relationships: new Map(),
      metadata: new Map(),
      shaderId: type,
      shaderType: type,
      inputs: new Map(),
      outputs: new Map(),
    };

    // 设置预设参数
    const preset = this.shaderPresets.get(type);
    if (preset) {
      for (const [key, value] of Object.entries(preset)) {
        shader.inputs.set(key, {
          name: key,
          typeName: this.getInputTypeName(key, type),
          value: params?.[key] ?? value,
        });
      }
    }

    // 添加自定义参数
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (!shader.inputs.has(key)) {
          shader.inputs.set(key, {
            name: key,
            typeName: this.guessTypeName(value),
            value,
          });
        }
      }
    }

    // 设置标准输出
    switch (type) {
      case 'UsdPreviewSurface':
        shader.outputs.set('surface', {
          name: 'surface',
          typeName: 'token',
        });
        shader.outputs.set('displacement', {
          name: 'displacement',
          typeName: 'token',
        });
        break;
      case 'UsdUVTexture':
        shader.outputs.set('rgb', {
          name: 'rgb',
          typeName: 'color3f',
        });
        shader.outputs.set('r', {
          name: 'r',
          typeName: 'float',
        });
        shader.outputs.set('g', {
          name: 'g',
          typeName: 'float',
        });
        shader.outputs.set('b', {
          name: 'b',
          typeName: 'float',
        });
        shader.outputs.set('a', {
          name: 'a',
          typeName: 'float',
        });
        break;
    }

    // 添加到Stage
    this.stage.definePrim(path, 'Shader');

    return shader;
  }

  /**
   * 获取输入参数的类型名
   */
  private getInputTypeName(paramName: string, shaderType: UsdShaderType): string {
    const typeMap: Record<string, Record<string, string>> = {
      'UsdPreviewSurface': {
        diffuseColor: 'color3f',
        emissiveColor: 'color3f',
        specularColor: 'color3f',
        normal: 'normal3f',
        metallic: 'float',
        roughness: 'float',
        clearcoat: 'float',
        clearcoatRoughness: 'float',
        opacity: 'float',
        opacityThreshold: 'float',
        occlusion: 'float',
        displacement: 'float',
        ior: 'float',
        useSpecularWorkflow: 'bool',
      },
      'UsdUVTexture': {
        file: 'asset',
        st: 'texCoord2f',
        wrapS: 'token',
        wrapT: 'token',
        fallback: 'color4f',
        scale: 'color4f',
        bias: 'color4f',
        sourceColorSpace: 'token',
        colorspace: 'token',
      },
    };

    return typeMap[shaderType]?.[paramName] || this.guessTypeName(paramName);
  }

  /**
   * 猜测值的类型名
   */
  private guessTypeName(value: any): string {
    if (typeof value === 'number') return 'float';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'string') {
      if (value.endsWith('.jpg') || value.endsWith('.png') || value.endsWith('.exr')) {
        return 'asset';
      }
      return 'string';
    }
    if (Array.isArray(value)) {
      switch (value.length) {
        case 2: return 'float2';
        case 3: return 'color3f';
        case 4: return 'color4f';
      }
    }
    return 'token';
  }

  /**
   * 构建材质网络
   */
  private buildMaterialNetwork(materialPrim: UsdMaterialPrim): MaterialNetwork {
    const network: MaterialNetwork = {
      materialPath: materialPrim.path,
      nodes: [],
      nodeGraphs: [],
      connections: [],
    };

    // 获取表面着色器
    if (materialPrim.surfaceShader) {
      const shaderPrim = this.stage.getPrimAtPath(materialPrim.surfaceShader);
      if (shaderPrim) {
        network.surfaceShader = shaderPrim as UsdShader;
        network.nodes.push(network.surfaceShader);
      }
    }

    return network;
  }

  /**
   * 应用材质到Prim
   */
  applyMaterial(primPath: SdfPath, materialPath: SdfPath): boolean {
    const prim = this.stage.getPrimAtPath(primPath);
    if (!prim) return false;

    // 创建材质绑定关系
    const materialBinding: UsdPrim['relationships'] = prim.relationships || new Map();
    materialBinding.set('material:binding', {
      name: 'material:binding',
      targets: [materialPath],
    });

    prim.relationships = materialBinding;
    return true;
  }

  /**
   * 获取Prim的材质
   */
  getBoundMaterial(primPath: SdfPath): UsdPrim | null {
    const prim = this.stage.getPrimAtPath(primPath);
    if (!prim || !prim.relationships) return null;

    const binding = prim.relationships.get('material:binding');
    if (!binding || binding.targets.length === 0) return null;

    return this.stage.getPrimAtPath(binding.targets[0]);
  }

  /**
   * 验证材质网络
   */
  validateMaterial(materialPath: SdfPath): MaterialValidationResult {
    const result: MaterialValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      brokenConnections: [],
      missingShaders: [],
      missingTextures: [],
      circularDependencies: [],
    };

    const network = this.materialCache.get(materialPath.pathString);
    if (!network) {
      result.isValid = false;
      result.errors.push(`Material network not found: ${materialPath.pathString}`);
      return result;
    }

    // 检查表面着色器
    if (!network.surfaceShader) {
      result.warnings.push('No surface shader found');
    }

    // 检查着色器连接
    for (const shader of network.nodes) {
      for (const [inputName, input] of shader.inputs) {
        if (input.connection) {
          const sourceShader = this.stage.getPrimAtPath(input.connection.sourcePath);
          if (!sourceShader) {
            result.isValid = false;
            result.brokenConnections.push(
              `${shader.path.pathString}.${inputName} -> ${input.connection.sourcePath.pathString}`
            );
          }
        }

        // 检查纹理文件
        if (inputName === 'file' && typeof input.value === 'string') {
          // 这里应该检查文件是否存在
          // 暂时只检查是否为有效路径
          if (!input.value || input.value.trim() === '') {
            result.warnings.push(`Empty texture path in ${shader.path.pathString}`);
          }
        }
      }
    }

    return result;
  }

  /**
   * 获取材质网络
   */
  getMaterialNetwork(materialPath: SdfPath): MaterialNetwork | null {
    return this.materialCache.get(materialPath.pathString) || null;
  }

  /**
   * 删除材质
   */
  removeMaterial(materialPath: SdfPath): boolean {
    // 移除材质网络缓存
    this.materialCache.delete(materialPath.pathString);

    // 从Stage中移除
    return this.stage.removePrim(materialPath);
  }

  /**
   * 获取所有材质
   */
  getAllMaterials(): SdfPath[] {
    const materials: SdfPath[] = [];
    
    for (const prim of this.stage.traverse()) {
      if (prim.typeName === 'Material') {
        materials.push(prim.path);
      }
    }

    return materials;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.materialCache.clear();
  }

  /**
   * 重新构建材质网络
   */
  rebuildMaterialNetwork(materialPath: SdfPath): void {
    const materialPrim = this.stage.getPrimAtPath(materialPath);
    if (materialPrim && materialPrim.typeName === 'Material') {
      const network = this.buildMaterialNetwork(materialPrim as UsdMaterialPrim);
      this.materialCache.set(materialPath.pathString, network);
    }
  }
}

// 扩展SdfPath类
import { SdfPath } from '../types';
SdfPath.prototype.appendChild = function(name: string): SdfPath {
  return new SdfPath(`${this.pathString}/${name}`);
};