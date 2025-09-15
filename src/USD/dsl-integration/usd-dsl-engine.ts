import { EventEmitter } from 'eventemitter3';
import type { MaterialManager, ThreeJSAdapter, UsdStageImpl } from '../';
import type { DSLScene, MaterialInline, SceneObject, Transform } from '../../DSL/types';
import { PluginManager } from '../plugins';
import type { UsdPrim } from '../types';
import { SdfPath } from '../types';

/**
 * USD-based DSL引擎 - 桥接DSL和USD
 */
export class USDDSLEngine extends EventEmitter {
  private stage: UsdStageImpl;
  private materialManager: MaterialManager;
  private threeJSAdapter: ThreeJSAdapter;
  private pluginManager: PluginManager;
  private dslToUsdMap: Map<string, SdfPath> = new Map();
  private usdToDslMap: Map<string, string> = new Map();

  constructor(
    stage: UsdStageImpl,
    materialManager: MaterialManager,
    threeJSAdapter: ThreeJSAdapter,
  ) {
    super();
    this.stage = stage;
    this.materialManager = materialManager;
    this.threeJSAdapter = threeJSAdapter;
    this.pluginManager = new PluginManager(stage);
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听USD事件并转换为DSL事件
    this.stage.on('primAdded', (path: SdfPath) => {
      const dslId = this.usdToDslMap.get(path.pathString);
      if (dslId) {
        this.emit('objectAdded', dslId);
      }
    });

    this.stage.on('primRemoved', (path: SdfPath) => {
      const dslId = this.usdToDslMap.get(path.pathString);
      if (dslId) {
        this.emit('objectRemoved', dslId);
        this.removeMapping(dslId);
      }
    });

    this.stage.on('attributeChanged', (path: SdfPath, attrName: string) => {
      const dslId = this.usdToDslMap.get(path.pathString);
      if (dslId) {
        this.emit('objectUpdated', dslId, attrName);
      }
    });
  }

  /**
   * 从DSL场景创建USD场景
   */
  importFromDSL(dslScene: DSLScene): void {
    // 创建根Prim
    const worldPath = new SdfPath('/World');
    this.stage.definePrim(worldPath, 'Xform');

    // 创建材质
    for (const material of dslScene.materials) {
      this.importMaterial(material as MaterialInline);
    }

    // 创建对象
    for (const object of dslScene.objects) {
      this.importObject(object);
    }

    // 设置相机
    this.importCamera(dslScene.camera);

    // 设置环境
    this.importEnvironment(dslScene.environment);
  }

  /**
   * 导出USD场景到DSL
   */
  exportToDSL(): DSLScene {
    const objects: SceneObject[] = [];
    const materials: MaterialInline[] = [];
    const lights: any[] = [];

    // 遍历所有Prim
    for (const prim of this.stage.traverse()) {
      if (prim.path.pathString === '/') continue;

      // 转换材质
      if (prim.typeName === 'Material') {
        const material = this.exportMaterial(prim);
        if (material) {
          materials.push(material);
        }
      }
      // 转换对象
      else if (['Mesh', 'Sphere', 'Cube', 'Cylinder', 'Plane'].includes(prim.typeName)) {
        const object = this.exportObject(prim);
        if (object) {
          objects.push(object);
        }
      }
      // 转换灯光
      else if (prim.typeName.includes('Light')) {
        const light = this.exportLight(prim);
        if (light) {
          lights.push(light);
        }
      }
    }

    return {
      id: generateUUID(),
      name: 'USD Scene',
      version: '1.0',
      objects,
      materials,
      lights,
      camera: this.exportCamera(),
      environment: this.exportEnvironment(),
      selection: [],
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        version: '1.0',
      },
    };
  }

  /**
   * 导入DSL对象到USD
   */
  private importObject(object: SceneObject): void {
    const usdPath = this.getOrCreateUsdPath(object.id);

    // 确定USD类型
    let usdType: string;
    switch (object.type) {
      case 'mesh':
        if (object.geometry) {
          if ('type' in object.geometry) {
            switch (object.geometry.type) {
              case 'box':
                usdType = 'Cube';
                break;
              case 'sphere':
                usdType = 'Sphere';
                break;
              case 'plane':
                usdType = 'Plane';
                break;
              case 'cylinder':
                usdType = 'Cylinder';
                break;
              case 'cone':
                usdType = 'Cone';
                break;
              case 'torus':
                usdType = 'Torus';
                break;
              default:
                usdType = 'Mesh';
            }
          } else {
            usdType = 'Mesh';
          }
        } else {
          usdType = 'Mesh';
        }
        break;
      case 'group':
        usdType = 'Xform';
        break;
      case 'light':
        usdType = 'SphereLight';
        break; // 简化处理
      default:
        usdType = 'Xform';
    }

    // 定义Prim
    this.stage.definePrim(usdPath, usdType);

    // 设置变换
    this.setTransform(usdPath, object.transform);

    // 设置可见性
    this.stage.setAttributeValue(
      usdPath,
      'visibility',
      object.visible !== false ? 'inherited' : 'invisible',
    );

    // 设置材质绑定
    if (object.material) {
      if ('id' in object.material) {
        const materialPath = this.getOrCreateUsdPath(object.material.id, '/World/Materials');
        this.stage.createRelationship(usdPath, 'material:binding', [materialPath]);
      }
    }

    // 设置父子关系
    if (object.parent) {
      const parentPath = this.dslToUsdMap.get(object.parent);
      if (parentPath) {
        // USD的层级通过路径隐式定义，这里不需要额外操作
      }
    }

    // 设置阴影
    if (object.castShadow !== undefined) {
      this.stage.setAttributeValue(usdPath, 'primvars:castShadows', object.castShadow);
    }
    if (object.receiveShadow !== undefined) {
      this.stage.setAttributeValue(usdPath, 'primvars:receiveShadows', object.receiveShadow);
    }

    // 设置用户数据
    if (object.userData) {
      for (const [key, value] of Object.entries(object.userData)) {
        this.stage.setMetadata(usdPath, `userData:${key}`, value);
      }
    }
  }

  /**
   * 导入DSL材质到USD
   */
  private importMaterial(material: MaterialInline): void {
    const materialPath = this.getOrCreateUsdPath(material.id!, '/World/Materials');

    this.materialManager.createMaterial({
      materialPath,
      materialName: material.name,
      surfaceShader: {
        type: 'UsdPreviewSurface',
        params: {
          diffuseColor: material.color ? this.hexToRgb(material.color) : [0.18, 0.18, 0.18],
          metallic: material.metalness ?? 0,
          roughness: material.roughness ?? 0.5,
          opacity: material.opacity ?? 1,
        },
      },
    });
  }

  /**
   * 导入相机
   */
  private importCamera(dslCamera: any): void {
    const cameraPath = new SdfPath('/World/Camera');
    this.stage.definePrim(cameraPath, 'Camera');

    // 设置相机参数
    this.stage.setAttributeValue(cameraPath, 'xformOp:translate', [
      dslCamera.position.x,
      dslCamera.position.y,
      dslCamera.position.z,
    ]);

    this.stage.setAttributeValue(cameraPath, 'xformOp:rotateXYZ', [0, 0, 0]);

    if (dslCamera.type === 'perspective') {
      this.stage.setAttributeValue(cameraPath, 'projection', 'perspective');
      this.stage.setAttributeValue(cameraPath, 'focalLength', dslCamera.fov || 50);
    } else {
      this.stage.setAttributeValue(cameraPath, 'projection', 'orthographic');
      this.stage.setAttributeValue(
        cameraPath,
        'horizontalAperture',
        (dslCamera.right - dslCamera.left) * 10,
      );
      this.stage.setAttributeValue(
        cameraPath,
        'verticalAperture',
        (dslCamera.top - dslCamera.bottom) * 10,
      );
    }
  }

  /**
   * 导入环境
   */
  private importEnvironment(environment: any): void {
    if (environment.background) {
      const renderSettingsPath = new SdfPath('/Render/Settings');
      this.stage.definePrim(renderSettingsPath, 'RenderSettings');

      if (environment.background.type === 'color') {
        this.stage.setAttributeValue(
          renderSettingsPath,
          'backgroundColor',
          this.hexToRgb(environment.background.color),
        );
      }
    }
  }

  /**
   * 导出USD对象到DSL
   */
  private exportObject(prim: UsdPrim): SceneObject | null {
    const dslId = this.usdToDslMap.get(prim.path.pathString) || this.generateDslId();

    const object: SceneObject = {
      id: dslId,
      name: prim.metadata.get('displayName') || prim.path.name,
      type: this.getDslObjectType(prim.typeName),
      transform: this.getTransform(prim),
      visible: this.stage.getAttributeValue(prim.path, 'visibility') !== 'invisible',
    };

    // 获取材质绑定
    const materialBinding = prim.relationships?.get('material:binding');
    if (materialBinding && materialBinding.targets.length > 0) {
      const materialPath = materialBinding.targets[0];
      const materialId = this.usdToDslMap.get(materialPath.pathString);
      if (materialId) {
        object.material = { id: materialId };
      }
    }

    // 获取父对象
    if (prim.path.parentPath.pathString !== '/') {
      const parentId = this.usdToDslMap.get(prim.path.parentPath.pathString);
      if (parentId) {
        object.parent = parentId;
      }
    }

    return object;
  }

  /**
   * 导出USD材质到DSL
   */
  private exportMaterial(prim: UsdPrim): MaterialInline | null {
    const dslId = this.usdToDslMap.get(prim.path.pathString) || this.generateDslId();

    // 获取表面着色器参数
    const surfaceShaderPath = prim.relationships?.get('surfaceShader')?.targets[0];
    if (surfaceShaderPath) {
      const shader = this.stage.getPrimAtPath(surfaceShaderPath);
      if (shader) {
        const diffuseColor = this.stage.getAttributeValue(surfaceShaderPath, 'diffuseColor');
        const metallic = this.stage.getAttributeValue(surfaceShaderPath, 'metallic');
        const roughness = this.stage.getAttributeValue(surfaceShaderPath, 'roughness');
        const opacity = this.stage.getAttributeValue(surfaceShaderPath, 'opacity');

        return {
          id: dslId,
          name: prim.metadata.get('displayName') || prim.path.name,
          type: 'standard',
          color: diffuseColor ? this.rgbToHex(diffuseColor) : '#ffffff',
          metalness: metallic ?? 0,
          roughness: roughness ?? 0.5,
          opacity: opacity ?? 1,
        };
      }
    }

    return null;
  }

  /**
   * 工具函数
   */
  private getOrCreateUsdPath(dslId: string, basePath: string = '/World'): SdfPath {
    let usdPath = this.dslToUsdMap.get(dslId);
    if (!usdPath) {
      usdPath = new SdfPath(`${basePath}/${dslId}`);
      this.dslToUsdMap.set(dslId, usdPath);
      this.usdToDslMap.set(usdPath.pathString, dslId);
    }
    return usdPath;
  }

  private setTransform(path: SdfPath, transform: Transform): void {
    if (transform.position) {
      this.stage.setAttributeValue(path, 'xformOp:translate', [
        transform.position.x,
        transform.position.y,
        transform.position.z,
      ]);
    }
    if (transform.rotation) {
      this.stage.setAttributeValue(path, 'xformOp:rotateXYZ', [
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
      ]);
    }
    if (transform.scale) {
      this.stage.setAttributeValue(path, 'xformOp:scale', [
        transform.scale.x,
        transform.scale.y,
        transform.scale.z,
      ]);
    }
  }

  private getTransform(prim: UsdPrim): Transform {
    const transform: Transform = {};

    const translate = this.stage.getAttributeValue(prim.path, 'xformOp:translate');
    if (translate) {
      transform.position = { x: translate[0], y: translate[1], z: translate[2] };
    }

    const rotate = this.stage.getAttributeValue(prim.path, 'xformOp:rotateXYZ');
    if (rotate) {
      transform.rotation = { x: rotate[0], y: rotate[1], z: rotate[2] };
    }

    const scale = this.stage.getAttributeValue(prim.path, 'xformOp:scale');
    if (scale) {
      transform.scale = { x: scale[0], y: scale[1], z: scale[2] };
    }

    return transform;
  }

  private getDslObjectType(usdType: string): 'mesh' | 'group' | 'light' | 'helper' {
    switch (usdType) {
      case 'Mesh':
      case 'Sphere':
      case 'Cube':
      case 'Cylinder':
      case 'Plane':
        return 'mesh';
      case 'Xform':
      case 'Scope':
        return 'group';
      case 'DistantLight':
      case 'DomeLight':
      case 'RectLight':
      case 'SphereLight':
        return 'light';
      default:
        return 'helper';
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [0.18, 0.18, 0.18];
  }

  private rgbToHex(rgb: [number, number, number]): string {
    return (
      '#' +
      rgb
        .map((c) => {
          const hex = Math.round(c * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  private generateDslId(): string {
    return 'obj_' + Math.random().toString(36).substr(2, 9);
  }

  private removeMapping(dslId: string): void {
    const usdPath = this.dslToUsdMap.get(dslId);
    if (usdPath) {
      this.usdToDslMap.delete(usdPath.pathString);
      this.dslToUsdMap.delete(dslId);
    }
  }

  // 需要导入generateUUID
  private exportCamera(): any {
    // 简化实现
    return {
      type: 'perspective',
      position: { x: 0, y: 0, z: 5 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50,
    };
  }

  private exportEnvironment(): any {
    // 简化实现
    return {};
  }

  private exportLight(prim: UsdPrim): any {
    // 简化实现
    return null;
  }

  /**
   * 获取插件管理器
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * 同步场景
   */
  sync(): void {
    this.threeJSAdapter.syncScene();
  }
}

// 需要导入generateUUID函数
import { generateUUID } from 'three/src/math/MathUtils.js';
