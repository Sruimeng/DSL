import { EventEmitter } from 'eventemitter3';
import { LayerManager } from '../layer-system';
import type { MaterialManager } from '../materials';
import type { UsdStageImpl } from '../stage';
import { SdfPath } from '../types';

/**
 * USD场景描述 - 使用USD格式构建和管理3D场景
 */
export class USDScene extends EventEmitter {
  private stage: UsdStageImpl;
  private materialManager: MaterialManager;
  private rootPath: SdfPath;
  private sceneMetadata: Map<string, any> = new Map();

  constructor(stage: UsdStageImpl, materialManager: MaterialManager) {
    super();
    this.stage = stage;
    this.materialManager = materialManager;
    this.rootPath = new SdfPath('/World');
    this.initializeScene();
  }

  /**
   * 初始化场景结构
   */
  private initializeScene(): void {
    // 创建根层级结构
    const paths = [
      '/World',
      '/World/Geometry',
      '/World/Materials',
      '/World/Lights',
      '/World/Cameras',
      '/Render',
      '/Render/Settings',
    ];

    paths.forEach((path) => {
      const primType = path.includes('Render') ? 'Scope' : 'Xform';
      this.stage.definePrim(new SdfPath(path), primType);
    });

    // 设置默认场景元数据
    this.sceneMetadata.set('created', Date.now());
    this.sceneMetadata.set('modified', Date.now());
    this.sceneMetadata.set('version', '1.0');
    this.sceneMetadata.set('upAxis', 'Y');
    this.sceneMetadata.set('metersPerUnit', 1.0);
  }

  /**
   * 创建变换节点
   */
  createTransform(name: string, parentPath: string = '/World'): SdfPath {
    const path = new SdfPath(`${parentPath}/${name}`);
    this.stage.definePrim(path, 'Xform');
    return path;
  }

  /**
   * 创建网格
   */
  createMesh(name: string, parentPath: string = '/World/Geometry'): SdfPath {
    const path = new SdfPath(`${parentPath}/${name}`);
    this.stage.definePrim(path, 'Mesh');
    return path;
  }

  /**
   * 创建球体
   */
  createSphere(
    name: string,
    params: {
      radius?: number;
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Geometry/${name}`);
    this.stage.definePrim(path, 'Sphere');

    if (params.radius !== undefined) {
      this.stage.setAttributeValue(path, 'radius', params.radius);
    }

    this.setTransform(path, params);
    return path;
  }

  /**
   * 创建立方体
   */
  createCube(
    name: string,
    params: {
      size?: number;
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Geometry/${name}`);
    this.stage.definePrim(path, 'Cube');

    if (params.size !== undefined) {
      this.stage.setAttributeValue(path, 'size', params.size);
    }

    this.setTransform(path, params);
    return path;
  }

  /**
   * 创建圆柱体
   */
  createCylinder(
    name: string,
    params: {
      radius?: number;
      height?: number;
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Geometry/${name}`);
    this.stage.definePrim(path, 'Cylinder');

    if (params.radius !== undefined) {
      this.stage.setAttributeValue(path, 'radius', params.radius);
    }
    if (params.height !== undefined) {
      this.stage.setAttributeValue(path, 'height', params.height);
    }

    this.setTransform(path, params);
    return path;
  }

  /**
   * 创建平面
   */
  createPlane(
    name: string,
    params: {
      width?: number;
      height?: number;
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Geometry/${name}`);
    this.stage.definePrim(path, 'Plane');

    if (params.width !== undefined) {
      this.stage.setAttributeValue(path, 'width', params.width);
    }
    if (params.height !== undefined) {
      this.stage.setAttributeValue(path, 'height', params.height);
    }

    this.setTransform(path, params);
    return path;
  }

  /**
   * 创建自定义网格
   */
  createCustomMesh(
    name: string,
    geometry: {
      points: number[];
      faceVertexCounts: number[];
      faceVertexIndices: number[];
      normals?: number[];
      uvs?: number[];
      colors?: number[];
    },
    params: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Geometry/${name}`);
    this.stage.definePrim(path, 'Mesh');

    // 设置几何体属性
    this.stage.setAttributeValue(path, 'points', geometry.points);
    this.stage.setAttributeValue(path, 'faceVertexCounts', geometry.faceVertexCounts);
    this.stage.setAttributeValue(path, 'faceVertexIndices', geometry.faceVertexIndices);

    if (geometry.normals) {
      this.stage.setAttributeValue(path, 'normals', geometry.normals);
    }
    if (geometry.uvs) {
      this.stage.setAttributeValue(path, 'primvars:st', geometry.uvs);
    }
    if (geometry.colors) {
      this.stage.setAttributeValue(path, 'primvars:displayColor', geometry.colors);
    }

    this.setTransform(path, params);
    return path;
  }

  /**
   * 创建材质
   */
  createMaterial(
    name: string,
    params: {
      color?: [number, number, number];
      metallic?: number;
      roughness?: number;
      opacity?: number;
      emissive?: [number, number, number];
      ior?: number;
    } = {},
  ): SdfPath {
    const materialPath = this.materialManager.createMaterial({
      materialPath: new SdfPath(`/World/Materials/${name}`),
      materialName: name,
      surfaceShader: {
        type: 'UsdPreviewSurface',
        params: {
          diffuseColor: params.color || [0.8, 0.8, 0.8],
          metallic: params.metallic ?? 0.0,
          roughness: params.roughness ?? 0.5,
          opacity: params.opacity ?? 1.0,
          emissiveColor: params.emissive || [0, 0, 0],
          ior: params.ior ?? 1.5,
        },
      },
    });

    return materialPath;
  }

  /**
   * 应用材质到Prim
   */
  assignMaterial(primPath: SdfPath, materialName: string): void {
    const materialPath = new SdfPath(`/World/Materials/${materialName}`);
    this.stage.createRelationship(primPath, 'material:binding', [materialPath]);
  }

  /**
   * 创建灯光
   */
  createLight(
    name: string,
    type: 'directional' | 'point' | 'spot' | 'dome',
    params: {
      color?: [number, number, number];
      intensity?: number;
      position?: [number, number, number];
      rotation?: [number, number, number];
      // 特定类型参数
      angle?: number; // for directional
      radius?: number; // for point
      width?: number; // for spot/rect
      height?: number; // for spot/rect
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Lights/${name}`);

    let primType: string;
    switch (type) {
      case 'directional':
        primType = 'DistantLight';
        break;
      case 'point':
        primType = 'SphereLight';
        break;
      case 'spot':
        primType = 'RectLight';
        break;
      case 'dome':
        primType = 'DomeLight';
        break;
      default:
        primType = 'DistantLight';
    }

    this.stage.definePrim(path, primType);

    // 设置灯光属性
    this.stage.setAttributeValue(path, 'color', params.color || [1, 1, 1]);
    this.stage.setAttributeValue(path, 'intensity', params.intensity ?? 1.0);

    if (params.angle !== undefined) {
      this.stage.setAttributeValue(path, 'angle', params.angle);
    }
    if (params.radius !== undefined) {
      this.stage.setAttributeValue(path, 'radius', params.radius);
    }
    if (params.width !== undefined) {
      this.stage.setAttributeValue(path, 'width', params.width);
    }
    if (params.height !== undefined) {
      this.stage.setAttributeValue(path, 'height', params.height);
    }

    this.setTransform(path, params);

    return path;
  }

  /**
   * 创建相机
   */
  createCamera(
    name: string,
    params: {
      type?: 'perspective' | 'orthographic';
      position?: [number, number, number];
      rotation?: [number, number, number];
      fov?: number;
      aspect?: number;
      near?: number;
      far?: number;
      // orthographic params
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    } = {},
  ): SdfPath {
    const path = new SdfPath(`/World/Cameras/${name}`);
    this.stage.definePrim(path, 'Camera');

    this.stage.setAttributeValue(path, 'projection', params.type || 'perspective');

    if (params.type === 'perspective' || !params.type) {
      if (params.fov !== undefined) {
        this.stage.setAttributeValue(path, 'focalLength', params.fov);
      }
      if (params.aspect !== undefined) {
        this.stage.setAttributeValue(path, 'aspectRatio', params.aspect);
      }
    } else {
      if (params.left !== undefined) {
        this.stage.setAttributeValue(path, 'horizontalAperture', params.right! - params.left);
      }
      if (params.top !== undefined) {
        this.stage.setAttributeValue(path, 'verticalAperture', params.top - params.bottom!);
      }
    }

    if (params.near !== undefined) {
      this.stage.setAttributeValue(path, 'clippingRange', [params.near, params.far || 1000]);
    }

    this.setTransform(path, params);

    return path;
  }

  /**
   * 设置变换
   */
  setTransform(
    primPath: SdfPath,
    params: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    },
  ): void {
    if (params.position) {
      this.stage.setAttributeValue(primPath, 'xformOp:translate', params.position);
    }
    if (params.rotation) {
      this.stage.setAttributeValue(primPath, 'xformOp:rotateXYZ', params.rotation);
    }
    if (params.scale) {
      this.stage.setAttributeValue(primPath, 'xformOp:scale', params.scale);
    }
  }

  /**
   * 设置Prim可见性
   */
  setVisibility(primPath: SdfPath, visible: boolean): void {
    this.stage.setAttributeValue(primPath, 'visibility', visible ? 'inherited' : 'invisible');
  }

  /**
   * 创建动画
   */
  createAnimation(
    primPath: SdfPath,
    attribute: string,
    timeSamples: {
      time: number;
      value: any;
    }[],
  ): void {
    // 设置时间采样
    const samples = timeSamples.map((sample) => ({
      time: sample.time,
      value: sample.value,
    }));

    this.stage.setAttributeValue(primPath, attribute, samples[0].value);
    this.stage.setAttributeValue(primPath, `${attribute}.timeSamples`, samples);
  }

  /**
   * 创建引用（组合功能）
   */
  createReference(assetPath: string, primPath?: SdfPath): void {
    const prim = this.stage.getPrimAtPath(primPath || new SdfPath('/'));
    if (prim) {
      if (!prim.references) {
        prim.references = [];
      }
      prim.references.push({
        assetPath,
        primPath: primPath || new SdfPath('/'),
      });
    }
  }

  /**
   * 创建变体集
   */
  createVariantSet(
    primPath: SdfPath,
    variantSetName: string,
    variants: {
      name: string;
      primSpec: any;
    }[],
  ): void {
    const prim = this.stage.getPrimAtPath(primPath);
    if (prim) {
      if (!prim.variants) {
        prim.variants = [];
      }

      prim.variants.push({
        name: variantSetName,
        variants: variants,
      });
    }
  }

  /**
   * 设置变体选择
   */
  setVariantSelection(primPath: SdfPath, variantSetName: string, variantName: string): void {
    const prim = this.stage.getPrimAtPath(primPath);
    if (prim && prim.variants) {
      const variantSet = prim.variants.find((vs) => vs.name === variantSetName);
      if (variantSet) {
        variantSet.selection = variantName;
      }
    }
  }

  /**
   * 获取场景信息
   */
  getSceneInfo(): {
    primCount: number;
    materialCount: number;
    lightCount: number;
    cameraCount: number;
    metadata: Record<string, any>;
  } {
    let primCount = 0;
    let materialCount = 0;
    let lightCount = 0;
    let cameraCount = 0;

    for (const prim of this.stage.traverse()) {
      primCount++;

      switch (prim.typeName) {
        case 'Material':
          materialCount++;
          break;
        case 'DistantLight':
        case 'DomeLight':
        case 'RectLight':
        case 'SphereLight':
        case 'DiskLight':
        case 'CylinderLight':
          lightCount++;
          break;
        case 'Camera':
          cameraCount++;
          break;
      }
    }

    return {
      primCount,
      materialCount,
      lightCount,
      cameraCount,
      metadata: Object.fromEntries(this.sceneMetadata),
    };
  }

  /**
   * 导出场景为USDA格式
   */
  exportToUSDA(): string {
    // 这里可以实现USDA格式的导出
    // 简化实现，实际应该使用专门的USD库
    const layerManager = new LayerManager(this.stage);
    return layerManager.exportLayer(this.stage.rootLayer, 'usda');
  }

  /**
   * 从USDA导入场景
   */
  importFromUSDA(usdaContent: string): void {
    // 这里可以实现USDA格式的导入
    // 简化实现，实际应该使用专门的USD库
    console.warn('USDA import not fully implemented');
  }

  /**
   * 清空场景
   */
  clear(): void {
    this.stage.rootLayer.rootPrims = [];
    this.sceneMetadata.clear();
    this.initializeScene();
  }

  /**
   * 获取Stage
   */
  getStage(): UsdStageImpl {
    return this.stage;
  }

  /**
   * 获取材质管理器
   */
  getMaterialManager(): MaterialManager {
    return this.materialManager;
  }

  /**
   * 获取根路径
   */
  getRootPath(): SdfPath {
    return this.rootPath;
  }

  /**
   * 设置场景元数据
   */
  setMetadata(key: string, value: any): void {
    this.sceneMetadata.set(key, value);
  }

  /**
   * 获取场景元数据
   */
  getMetadata(key: string): any {
    return this.sceneMetadata.get(key);
  }

  /**
   * 获取所有Prim路径
   */
  getAllPrimPaths(): SdfPath[] {
    const paths: SdfPath[] = [];
    for (const prim of this.stage.traverse()) {
      paths.push(prim.path);
    }
    return paths;
  }

  /**
   * 按类型查找Prim
   */
  findPrimsByType(typeName: string): SdfPath[] {
    const paths: SdfPath[] = [];
    for (const prim of this.stage.traverse()) {
      if (prim.typeName === typeName) {
        paths.push(prim.path);
      }
    }
    return paths;
  }

  /**
   * 按名称查找Prim
   */
  findPrimByName(name: string): SdfPath | null {
    for (const prim of this.stage.traverse()) {
      if (prim.path.name === name) {
        return prim.path;
      }
    }
    return null;
  }

  /**
   * 复制Prim
   */
  duplicatePrim(sourcePath: SdfPath, newName: string): SdfPath | null {
    const sourcePrim = this.stage.getPrimAtPath(sourcePath);
    if (!sourcePrim) return null;

    const parentPath = sourcePath.parentPath;
    const newPath = parentPath.appendChild(newName);

    // 复制Prim定义
    this.stage.definePrim(newPath, sourcePrim.typeName);

    // 复制属性
    for (const [attrName, attr] of sourcePrim.attributes) {
      this.stage.setAttributeValue(newPath, attrName, attr.defaultValue);
    }

    // 复制变换
    const translate = this.stage.getAttributeValue(sourcePath, 'xformOp:translate');
    if (translate) {
      this.stage.setAttributeValue(newPath, 'xformOp:translate', translate);
    }

    const rotate = this.stage.getAttributeValue(sourcePath, 'xformOp:rotateXYZ');
    if (rotate) {
      this.stage.setAttributeValue(newPath, 'xformOp:rotateXYZ', rotate);
    }

    const scale = this.stage.getAttributeValue(sourcePath, 'xformOp:scale');
    if (scale) {
      this.stage.setAttributeValue(newPath, 'xformOp:scale', scale);
    }

    return newPath;
  }

  /**
   * 删除Prim
   */
  deletePrim(path: SdfPath): boolean {
    return this.stage.removePrim(path);
  }

  /**
   * 设置父Prim
   */
  setParent(primPath: SdfPath, parentPath: SdfPath): void {
    // 在USD中，通过重命名路径来改变层级
    const newPath = parentPath.appendChild(primPath.name);
    // 这里需要实现路径重命名的逻辑
    console.warn('setParent not fully implemented', newPath);
  }

  /**
   * 获取子Prim
   */
  getChildren(parentPath: SdfPath): SdfPath[] {
    const children = this.stage.getChildren(parentPath);
    return children.map((child) => child.path);
  }

  /**
   * 获取父Prim
   */
  getParent(primPath: SdfPath): SdfPath | null {
    const parentPath = primPath.parentPath;
    if (parentPath.pathString === '/') return null;
    return parentPath;
  }
}
