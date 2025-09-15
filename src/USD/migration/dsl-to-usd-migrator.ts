import type { DSLScene, SceneObject, MaterialInline, Transform } from '../../DSL/types';
import type { UsdStageImpl } from '../stage';
import type { MaterialManager } from '../materials';
import { SdfPath } from '../types';
import { USDDSLEngine } from '../dsl-integration';

/**
 * DSL到USD迁移器
 */
export class DSLToUSDMigrator {
  private stage: UsdStageImpl;
  private materialManager: MaterialManager;
  private migrationLog: string[] = [];

  constructor(stage: UsdStageImpl, materialManager: MaterialManager) {
    this.stage = stage;
    this.materialManager = materialManager;
  }

  /**
   * 迁移DSL场景到USD
   */
  async migrate(dslScene: DSLScene): Promise<{
    success: boolean;
    log: string[];
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    this.log('开始迁移DSL场景到USD...');

    try {
      // 1. 创建根结构
      this.createRootStructure();

      // 2. 迁移材质
      this.log('迁移材质...');
      const materialMapping = this.migrateMaterials(dslScene.materials as MaterialInline[], warnings);

      // 3. 迁移对象层级
      this.log('迁移对象层级...');
      const objectMapping = this.migrateObjects(dslScene.objects, materialMapping, warnings);

      // 4. 迁移相机
      this.log('迁移相机...');
      this.migrateCamera(dslScene.camera, warnings);

      // 5. 迁移灯光
      this.log('迁移灯光...');
      this.migrateLights(dslScene.lights, warnings);

      // 6. 迁移环境设置
      this.log('迁移环境设置...');
      this.migrateEnvironment(dslScene.environment, warnings);

      // 7. 验证迁移结果
      this.log('验证迁移结果...');
      const validationResult = this.validateMigration();
      
      if (validationResult.errors.length > 0) {
        errors.push(...validationResult.errors);
      }
      if (validationResult.warnings.length > 0) {
        warnings.push(...validationResult.warnings);
      }

      this.log('迁移完成！');

      return {
        success: errors.length === 0,
        log: this.migrationLog,
        warnings,
        errors,
      };
    } catch (error) {
      errors.push(`迁移失败: ${error.message}`);
      return {
        success: false,
        log: this.migrationLog,
        warnings,
        errors,
      };
    }
  }

  /**
   * 创建USD根结构
   */
  private createRootStructure(): void {
    // 创建主要层级
    const rootPaths = [
      '/World',
      '/World/Geometry',
      '/World/Materials',
      '/World/Lights',
      '/World/Cameras',
      '/Render',
      '/Render/Settings',
    ];

    for (const path of rootPaths) {
      this.stage.definePrim(new SdfPath(path), path.includes('Render') ? 'Scope' : 'Xform');
    }

    this.log('创建了USD根结构');
  }

  /**
   * 迁移材质
   */
  private migrateMaterials(materials: MaterialInline[], warnings: string[]): Map<string, SdfPath> {
    const materialMapping = new Map<string, SdfPath>();

    for (const material of materials) {
      try {
        const materialPath = new SdfPath(`/World/Materials/Material_${material.id || generateId()}`);
        
        // 转换材质参数
        const params = this.convertMaterialParams(material, warnings);
        
        // 创建USD材质
        this.materialManager.createMaterial({
          materialPath,
          materialName: material.name || `Material_${material.id}`,
          surfaceShader: {
            type: 'UsdPreviewSurface',
            params,
          },
        });

        materialMapping.set(material.id!, materialPath);
        this.log(`迁移了材质: ${material.name} -> ${materialPath.pathString}`);
      } catch (error) {
        warnings.push(`材质迁移失败 ${material.name}: ${error.message}`);
      }
    }

    return materialMapping;
  }

  /**
   * 转换材质参数
   */
  private convertMaterialParams(material: MaterialInline, warnings: string[]): Record<string, any> {
    const params: Record<string, any> = {};

    // 基础颜色
    if (material.color) {
      params.diffuseColor = this.hexToRgb(material.color);
    }

    // 金属度和粗糙度
    if (material.metalness !== undefined) {
      params.metallic = material.metalness;
    }
    if (material.roughness !== undefined) {
      params.roughness = material.roughness;
    }

    // 透明度
    if (material.opacity !== undefined) {
      params.opacity = material.opacity;
      if (material.opacity < 1) {
        // 可能需要处理透明度阈值
        params.opacityThreshold = 0.01;
      }
    }

    // 线框模式
    if (material.wireframe) {
      warnings.push(`材质 ${material.name} 的线框模式需要特殊处理`);
    }

    // 自发光
    if (material.emissive) {
      params.emissiveColor = this.hexToRgb(material.emissive);
    }
    if (material.emissiveIntensity !== undefined) {
      // USD使用不同的自发光模型，需要转换
      params.emissiveColor = params.emissiveColor?.map((c: number) => c * material.emissiveIntensity);
    }

    // 纹理映射
    if (material.map) {
      warnings.push(`材质 ${material.name} 的漫反射纹理需要手动设置: ${material.map}`);
    }
    if (material.normalMap) {
      warnings.push(`材质 ${material.name} 的法线贴图需要手动设置: ${material.normalMap}`);
    }
    if (material.roughnessMap) {
      warnings.push(`材质 ${material.name} 的粗糙度贴图需要手动设置: ${material.roughnessMap}`);
    }
    if (material.metalnessMap) {
      warnings.push(`材质 ${material.name} 的金属度贴图需要手动设置: ${material.metalnessMap}`);
    }

    return params;
  }

  /**
   * 迁移对象
   */
  private migrateObjects(objects: SceneObject[], materialMapping: Map<string, SdfPath>, warnings: string[]): Map<string, SdfPath> {
    const objectMapping = new Map<string, SdfPath>();
    const pendingChildren: Array<{ child: SceneObject; parentPath: SdfPath }> = [];

    // 第一次遍历：创建所有对象（不包括父子关系）
    for (const object of objects) {
      try {
        const objectPath = this.migrateObject(object, materialMapping, warnings);
        objectMapping.set(object.id, objectPath);

        // 如果有父对象，先记录下来
        if (object.parent) {
          pendingChildren.push({ child: object, parentPath: new SdfPath('/World/Geometry') });
        }
      } catch (error) {
        warnings.push(`对象迁移失败 ${object.name}: ${error.message}`);
      }
    }

    // 第二次遍历：建立父子关系
    for (const { child, parentPath } of pendingChildren) {
      const childPath = objectMapping.get(child.id);
      if (childPath) {
        // 在USD中，层级通过路径隐式定义
        // 这里可以重命名路径以反映父子关系
        const newPath = parentPath.appendChild(child.name || `Object_${child.id}`);
        // 注意：实际实现需要移动Prim，这里简化处理
      }
    }

    return objectMapping;
  }

  /**
   * 迁移单个对象
   */
  private migrateObject(object: SceneObject, materialMapping: Map<string, SdfPath>, warnings: string[]): SdfPath {
    // 确定USD类型
    const usdType = this.getUsdPrimType(object);
    
    // 确定路径
    let basePath = '/World/Geometry';
    if (object.type === 'light') {
      basePath = '/World/Lights';
    }
    const objectPath = new SdfPath(`${basePath}/${object.name || `Object_${object.id}`}`);

    // 定义Prim
    this.stage.definePrim(objectPath, usdType);

    // 设置变换
    this.setTransform(objectPath, object.transform);

    // 设置可见性
    this.stage.setAttributeValue(objectPath, 'visibility', object.visible !== false ? 'inherited' : 'invisible');

    // 设置材质绑定
    if (object.material) {
      if ('id' in object.material) {
        const materialPath = materialMapping.get(object.material.id);
        if (materialPath) {
          this.stage.createRelationship(objectPath, 'material:binding', [materialPath]);
        } else {
          warnings.push(`对象 ${object.name} 引用了不存在的材质: ${object.material.id}`);
        }
      } else {
        // 内联材质
        const inlineMaterial = object.material as MaterialInline;
        const materialPath = new SdfPath(`/World/Materials/Material_${object.id}`);
        this.materialManager.createMaterial({
          materialPath,
          materialName: `${object.name}_Material`,
          surfaceShader: {
            type: 'UsdPreviewSurface',
            params: this.convertMaterialParams(inlineMaterial, warnings),
          },
        });
        this.stage.createRelationship(objectPath, 'material:binding', [materialPath]);
      }
    }

    // 设置几何体特定属性
    if (object.geometry && 'type' in object.geometry) {
      this.setGeometryAttributes(objectPath, object.geometry, warnings);
    }

    // 设置阴影
    if (object.castShadow !== undefined) {
      this.stage.setAttributeValue(objectPath, 'primvars:castShadows', object.castShadow);
    }
    if (object.receiveShadow !== undefined) {
      this.stage.setAttributeValue(objectPath, 'primvars:receiveShadows', object.receiveShadow);
    }

    this.log(`迁移了对象: ${object.name} -> ${objectPath.pathString}`);
    return objectPath;
  }

  /**
   * 获取对应的USD Prim类型
   */
  private getUsdPrimType(object: SceneObject): string {
    switch (object.type) {
      case 'mesh':
        if (object.geometry && 'type' in object.geometry) {
          switch (object.geometry.type) {
            case 'box': return 'Cube';
            case 'sphere': return 'Sphere';
            case 'plane': return 'Plane';
            case 'cylinder': return 'Cylinder';
            case 'cone': return 'Cone';
            default: return 'Mesh';
          }
        }
        return 'Mesh';
      case 'group':
        return 'Xform';
      case 'light':
        return 'SphereLight'; // 默认使用球光
      default:
        return 'Xform';
    }
  }

  /**
   * 设置变换
   */
  private setTransform(path: SdfPath, transform: Transform): void {
    if (transform.position) {
      this.stage.setAttributeValue(path, 'xformOp:translate', 
        [transform.position.x, transform.position.y, transform.position.z]);
    }
    if (transform.rotation) {
      this.stage.setAttributeValue(path, 'xformOp:rotateXYZ', 
        [transform.rotation.x, transform.rotation.y, transform.rotation.z]);
    }
    if (transform.scale) {
      this.stage.setAttributeValue(path, 'xformOp:scale', 
        [transform.scale.x, transform.scale.y, transform.scale.z]);
    }
  }

  /**
   * 设置几何体属性
   */
  private setGeometryAttributes(path: SdfPath, geometry: any, warnings: string[]): void {
    switch (geometry.type) {
      case 'box':
        if (geometry.size) {
          const size = Array.isArray(geometry.size) ? geometry.size[0] : geometry.size;
          this.stage.setAttributeValue(path, 'size', size);
        }
        break;
      
      case 'sphere':
        if (geometry.radius) {
          this.stage.setAttributeValue(path, 'radius', geometry.radius);
        } else if (geometry.size) {
          const size = Array.isArray(geometry.size) ? geometry.size[0] : geometry.size;
          this.stage.setAttributeValue(path, 'radius', size / 2);
        }
        break;
      
      case 'plane':
        if (geometry.size) {
          const size = Array.isArray(geometry.size) ? geometry.size : [geometry.size, geometry.size];
          this.stage.setAttributeValue(path, 'width', size[0]);
          this.stage.setAttributeValue(path, 'height', size[1] || size[0]);
        }
        break;
      
      case 'cylinder':
      case 'cone':
        if (geometry.radius) {
          this.stage.setAttributeValue(path, 'radius', geometry.radius);
        }
        if (geometry.height) {
          this.stage.setAttributeValue(path, 'height', geometry.height);
        }
        break;
      
      case 'model':
        warnings.push(`模型类型需要手动加载: ${geometry.url}`);
        break;
    }

    if (geometry.segments) {
      warnings.push(`几何体细分参数需要手动设置: ${geometry.segments}`);
    }
  }

  /**
   * 迁移相机
   */
  private migrateCamera(camera: any, warnings: string[]): void {
    const cameraPath = new SdfPath('/World/Cameras/MainCamera');
    this.stage.definePrim(cameraPath, 'Camera');

    // 设置变换
    this.stage.setAttributeValue(cameraPath, 'xformOp:translate', 
      [camera.position.x, camera.position.y, camera.position.z]);

    // 计算看向目标的旋转
    const direction = {
      x: camera.target.x - camera.position.x,
      y: camera.target.y - camera.position.y,
      z: camera.target.z - camera.position.z,
    };
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.y /= length;
      direction.z /= length;
    }

    // 简化的旋转计算
    const yaw = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
    const pitch = Math.asin(direction.y) * 180 / Math.PI;
    
    this.stage.setAttributeValue(cameraPath, 'xformOp:rotateXYZ', [pitch, yaw, 0]);

    // 设置相机参数
    if (camera.type === 'perspective') {
      this.stage.setAttributeValue(cameraPath, 'projection', 'perspective');
      this.stage.setAttributeValue(cameraPath, 'focalLength', camera.fov || 50);
      this.stage.setAttributeValue(cameraPath, 'aspectRatio', camera.aspect || 16/9);
    } else {
      this.stage.setAttributeValue(cameraPath, 'projection', 'orthographic');
      this.stage.setAttributeValue(cameraPath, 'horizontalAperture', (camera.right - camera.left) * 10);
      this.stage.setAttributeValue(cameraPath, 'verticalAperture', (camera.top - camera.bottom) * 10);
    }

    this.stage.setAttributeValue(cameraPath, 'clippingRange', [camera.near || 0.1, camera.far || 1000]);
    
    this.log(`迁移了相机: ${cameraPath.pathString}`);
  }

  /**
   * 迁移灯光
   */
  private migrateLights(lights: any[], warnings: string[]): void {
    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const lightPath = new SdfPath(`/World/Lights/Light_${i}`);
      
      // 根据类型创建对应的USD灯光
      let lightType: string;
      switch (light.type) {
        case 'ambient':
          // USD没有环境光，使用DomeLight模拟
          lightType = 'DomeLight';
          this.stage.definePrim(lightPath, lightType);
          this.stage.setAttributeValue(lightPath, 'color', [1, 1, 1]);
          this.stage.setAttributeValue(lightPath, 'intensity', light.intensity * 0.1); // 降低强度
          break;
        
        case 'directional':
          lightType = 'DistantLight';
          this.stage.definePrim(lightPath, lightType);
          this.stage.setAttributeValue(lightPath, 'color', this.hexToRgb(light.color || '#ffffff'));
          this.stage.setAttributeValue(lightPath, 'intensity', light.intensity);
          
          // 设置方向
          const direction = this.calculateDirection(light.position, light.target);
          this.stage.setAttributeValue(lightPath, 'angle', 0.53); // 默认角度
          break;
        
        case 'point':
          lightType = 'SphereLight';
          this.stage.definePrim(lightPath, lightType);
          this.stage.setAttributeValue(lightPath, 'xformOp:translate', 
            [light.position.x, light.position.y, light.position.z]);
          this.stage.setAttributeValue(lightPath, 'color', this.hexToRgb(light.color || '#ffffff'));
          this.stage.setAttributeValue(lightPath, 'intensity', light.intensity);
          
          if (light.distance !== undefined) {
            this.stage.setAttributeValue(lightPath, 'radius', light.distance / 10); // 简化转换
          }
          break;
        
        case 'spot':
          lightType = 'DiskLight'; // 使用DiskLight模拟聚光灯
          this.stage.definePrim(lightPath, lightType);
          this.stage.setAttributeValue(lightPath, 'xformOp:translate', 
            [light.position.x, light.position.y, light.position.z]);
          this.stage.setAttributeValue(lightPath, 'color', this.hexToRgb(light.color || '#ffffff'));
          this.stage.setAttributeValue(lightPath, 'intensity', light.intensity);
          
          if (light.angle !== undefined) {
            this.stage.setAttributeValue(lightPath, 'angle', light.angle * 180 / Math.PI); // 转换为角度
          }
          if (light.penumbra !== undefined) {
            warnings.push(`聚光灯的半影角需要特殊处理: ${light.penumbra}`);
          }
          break;
        
        case 'hemisphere':
          lightType = 'DomeLight';
          this.stage.definePrim(lightPath, lightType);
          this.stage.setAttributeValue(lightPath, 'color', this.hexToRgb(light.color || '#ffffff'));
          this.stage.setAttributeValue(lightPath, 'intensity', light.intensity * 0.5);
          // USD的DomeLight没有groundColor概念，需要特殊处理
          if (light.groundColor) {
            warnings.push(`半球光的地面颜色需要特殊处理: ${light.groundColor}`);
          }
          break;
        
        default:
          warnings.push(`不支持的灯光类型: ${light.type}`);
          continue;
      }

      // 设置阴影
      if (light.castShadow !== undefined) {
        this.stage.setAttributeValue(lightPath, 'shadow:enable', light.castShadow);
      }

      this.log(`迁移了灯光: ${lightPath.pathString} (${lightType})`);
    }
  }

  /**
   * 迁移环境设置
   */
  private migrateEnvironment(environment: any, warnings: string[]): void {
    if (environment.background) {
      const renderSettingsPath = new SdfPath('/Render/Settings');
      
      switch (environment.background.type) {
        case 'color':
          this.stage.setAttributeValue(renderSettingsPath, 'backgroundColor', 
            this.hexToRgb(environment.background.color));
          break;
        
        case 'texture':
          warnings.push(`背景纹理需要手动设置: ${environment.background.value}`);
          break;
        
        case 'hdri':
          warnings.push(`HDRI背景需要手动设置: ${environment.background.value}`);
          // 可以创建一个DomeLight来模拟
          const hdriPath = new SdfPath('/World/Lights/HDRI');
          this.stage.definePrim(hdriPath, 'DomeLight');
          this.stage.setAttributeValue(hdriPath, 'texture:file', environment.background.value);
          break;
      }
    }

    if (environment.fog) {
      warnings.push(`雾效需要特殊处理`);
      // USD没有内置的雾效，需要通过渲染设置或着色器实现
    }

    if (environment.shadows?.enabled) {
      this.stage.setAttributeValue(new SdfPath('/Render/Settings'), 'shadow:enable', true);
      
      switch (environment.shadows.type) {
        case 'basic':
          this.stage.setAttributeValue(new SdfPath('/Render/Settings'), 'shadow:filter', 'none');
          break;
        case 'pcf':
          this.stage.setAttributeValue(new SdfPath('/Render/Settings'), 'shadow:filter', 'pcf');
          break;
        case 'pcfsoft':
          this.stage.setAttributeValue(new SdfPath('/Render/Settings'), 'shadow:filter', 'pcf');
          this.stage.setAttributeValue(new SdfPath('/Render/Settings'), 'shadow:blur', 1.0);
          break;
      }
      
      this.stage.setAttributeValue(new SdfPath('/Render/Settings'), 'shadow:resolution', environment.shadows.mapSize);
    }

    this.log('迁移了环境设置');
  }

  /**
   * 验证迁移结果
   */
  private validateMigration(): {
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查必要的根Prim
    const requiredPaths = ['/World', '/World/Geometry', '/World/Materials', '/Render'];
    for (const path of requiredPaths) {
      if (!this.stage.hasPrim(new SdfPath(path))) {
        errors.push(`缺少必要的Prim: ${path}`);
      }
    }

    // 检查材质网络
    const materials = this.materialManager.getAllMaterials();
    for (const materialPath of materials) {
      const validation = this.materialManager.validateMaterial(materialPath);
      if (!validation.isValid) {
        warnings.push(`材质验证失败 ${materialPath.pathString}: ${validation.errors.join(', ')}`);
      }
    }

    // 检查变换属性
    for (const prim of this.stage.traverse()) {
      if (prim.path.pathString === '/') continue;
      
      // 检查是否有变换操作
      const hasTransform = prim.attributes.has('xformOp:translate') || 
                           prim.attributes.has('xformOp:rotateXYZ') || 
                           prim.attributes.has('xformOp:scale');
      
      if (!hasTransform && prim.typeName !== 'Material' && prim.typeName !== 'Shader') {
        // 添加默认变换
        this.stage.setAttributeValue(prim.path, 'xformOp:translate', [0, 0, 0]);
        this.stage.setAttributeValue(prim.path, 'xformOp:rotateXYZ', [0, 0, 0]);
        this.stage.setAttributeValue(prim.path, 'xformOp:scale', [1, 1, 1]);
      }
    }

    return { warnings, errors };
  }

  /**
   * 工具函数
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ] : [0.18, 0.18, 0.18];
  }

  private calculateDirection(position: any, target: any): [number, number, number] {
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const dz = target.z - position.z;
    const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    return [dx/length, dy/length, dz/length];
  }

  private log(message: string): void {
    this.migrationLog.push(`[${new Date().toISOString()}] ${message}`);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * 迁移配置
 */
export interface MigrationConfig {
  // 是否保留原始ID
  preserveIds: boolean;
  // 是否创建备份层
  createBackupLayer: boolean;
  // 材质转换策略
  materialConversion: 'previewSurface' | 'custom' | 'reference';
  // 几何体精度
  geometryPrecision: 'high' | 'medium' | 'low';
  // 纹理处理
  textureHandling: 'embed' | 'reference' | 'optimize';
  // 动画处理
  animationHandling: 'bake' | 'preserve' | 'ignore';
  // 验证级别
  validationLevel: 'strict' | 'normal' | 'none';
}

/**
 * 默认迁移配置
 */
export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  preserveIds: false,
  createBackupLayer: true,
  materialConversion: 'previewSurface',
  geometryPrecision: 'high',
  textureHandling: 'reference',
  animationHandling: 'preserve',
  validationLevel: 'normal',
};