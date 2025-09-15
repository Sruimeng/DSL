import * as THREE from 'three';
import type { MaterialManager } from '../materials';
import { AttributeResolver } from '../resolvers';
import type { UsdStageImpl } from '../stage';
import type { SdfPath, UsdPrim } from '../types';

/**
 * Three.js 适配器 - 将USD场景转换为Three.js对象
 */
export class ThreeJSAdapter {
  private stage: UsdStageImpl;
  private materialManager: MaterialManager;
  private attributeResolver: AttributeResolver;
  private scene: THREE.Scene;
  private primToObject: Map<string, THREE.Object3D> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();

  constructor(stage: UsdStageImpl, materialManager: MaterialManager) {
    this.stage = stage;
    this.materialManager = materialManager;
    this.attributeResolver = new AttributeResolver(stage);
    this.scene = new THREE.Scene();
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.stage.on('primAdded', (path: SdfPath) => {
      this.syncPrimToThreeJS(path);
    });

    this.stage.on('primRemoved', (path: SdfPath) => {
      this.removePrimFromThreeJS(path);
    });

    this.stage.on('attributeChanged', (path: SdfPath, attrName: string) => {
      this.updatePrimAttribute(path, attrName);
    });
  }

  /**
   * 同步Prim到Three.js
   */
  private syncPrimToThreeJS(path: SdfPath): void {
    const prim = this.stage.getPrimAtPath(path);
    if (!prim) return;

    // 根据Prim类型创建对应的Three.js对象
    let object: THREE.Object3D | null = null;

    switch (prim.typeName) {
      case 'Xform':
      case 'Scope':
        object = new THREE.Group();
        break;

      case 'Mesh':
        object = this.createMeshFromPrim(prim);
        break;

      case 'Sphere':
        object = this.createSphereFromPrim(prim);
        break;

      case 'Cube':
        object = this.createCubeFromPrim(prim);
        break;

      case 'Cylinder':
        object = this.createCylinderFromPrim(prim);
        break;

      case 'Plane':
        object = this.createPlaneFromPrim(prim);
        break;

      case 'Camera':
        object = this.createCameraFromPrim(prim);
        break;

      case 'DistantLight':
      case 'DomeLight':
      case 'RectLight':
      case 'SphereLight':
        object = this.createLightFromPrim(prim);
        break;

      case 'Material':
        // 材质由MaterialManager处理
        return;

      default:
        console.warn(`未支持的Prim类型: ${prim.typeName}`);
        object = new THREE.Group();
        break;
    }

    if (object) {
      // 设置变换
      this.applyTransform(object, prim);

      // 设置可见性
      const visible = this.attributeResolver.resolve(prim, 'visibility')?.value !== 'invisible';
      object.visible = visible;

      // 添加到场景
      const parentPath = path.parentPath;
      if (parentPath.pathString === '/') {
        this.scene.add(object);
      } else {
        const parentObject = this.primToObject.get(parentPath.pathString);
        if (parentObject) {
          parentObject.add(object);
        } else {
          this.scene.add(object);
        }
      }

      // 缓存映射
      this.primToObject.set(path.pathString, object);
    }
  }

  /**
   * 从Prim创建Mesh
   */
  private createMeshFromPrim(prim: UsdPrim): THREE.Mesh {
    // 获取几何体属性
    const points = this.attributeResolver.resolve(prim, 'points')?.value as number[];
    const faceVertexCounts = this.attributeResolver.resolve(prim, 'faceVertexCounts')
      ?.value as number[];
    const faceVertexIndices = this.attributeResolver.resolve(prim, 'faceVertexIndices')
      ?.value as number[];

    if (!points || !faceVertexCounts || !faceVertexIndices) {
      console.error('Mesh缺少必要的几何体数据');
      return new THREE.Mesh();
    }

    // 创建几何体
    const geometry = new THREE.BufferGeometry();

    // 设置顶点位置
    const vertices = new Float32Array(points);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // 构建索引
    const indices: number[] = [];
    let vertexIndex = 0;

    for (const count of faceVertexCounts) {
      if (count === 3) {
        // 三角形
        indices.push(
          faceVertexIndices[vertexIndex],
          faceVertexIndices[vertexIndex + 1],
          faceVertexIndices[vertexIndex + 2],
        );
      } else if (count === 4) {
        // 四边形，拆分为两个三角形
        indices.push(
          faceVertexIndices[vertexIndex],
          faceVertexIndices[vertexIndex + 1],
          faceVertexIndices[vertexIndex + 2],
          faceVertexIndices[vertexIndex],
          faceVertexIndices[vertexIndex + 2],
          faceVertexIndices[vertexIndex + 3],
        );
      } else {
        // 多边形，需要三角化（简化处理）
        for (let i = 1; i < count - 1; i++) {
          indices.push(
            faceVertexIndices[vertexIndex],
            faceVertexIndices[vertexIndex + i],
            faceVertexIndices[vertexIndex + i + 1],
          );
        }
      }
      vertexIndex += count;
    }

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // 获取材质
    const material = this.getMaterialForPrim(prim);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * 从Prim创建球体
   */
  private createSphereFromPrim(prim: UsdPrim): THREE.Mesh {
    const radius = (this.attributeResolver.resolve(prim, 'radius')?.value as number) || 1;

    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const material = this.getMaterialForPrim(prim);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * 从Prim创建立方体
   */
  private createCubeFromPrim(prim: UsdPrim): THREE.Mesh {
    const size = (this.attributeResolver.resolve(prim, 'size')?.value as number) || 1;

    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = this.getMaterialForPrim(prim);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * 从Prim创建圆柱体
   */
  private createCylinderFromPrim(prim: UsdPrim): THREE.Mesh {
    const radius = (this.attributeResolver.resolve(prim, 'radius')?.value as number) || 1;
    const height = (this.attributeResolver.resolve(prim, 'height')?.value as number) || 2;

    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = this.getMaterialForPrim(prim);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * 从Prim创建平面
   */
  private createPlaneFromPrim(prim: UsdPrim): THREE.Mesh {
    const width = (this.attributeResolver.resolve(prim, 'width')?.value as number) || 1;
    const height = (this.attributeResolver.resolve(prim, 'height')?.value as number) || 1;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = this.getMaterialForPrim(prim);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * 从Prim创建相机
   */
  private createCameraFromPrim(prim: UsdPrim): THREE.Camera {
    const projection =
      (this.attributeResolver.resolve(prim, 'projection')?.value as string) || 'perspective';

    if (projection === 'orthographic') {
      const width =
        (this.attributeResolver.resolve(prim, 'horizontalAperture')?.value as number) || 24.89;
      const height =
        (this.attributeResolver.resolve(prim, 'verticalAperture')?.value as number) || 18.66;

      const camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        1000,
      );
      return camera;
    } else {
      const fov = (this.attributeResolver.resolve(prim, 'focalLength')?.value as number) || 50;
      const aspect =
        (this.attributeResolver.resolve(prim, 'aspectRatio')?.value as number) || 16 / 9;

      // 将焦距转换为FOV（简化计算）
      const fovAngle = (2 * Math.atan(24.89 / (2 * fov)) * 180) / Math.PI;

      const camera = new THREE.PerspectiveCamera(fovAngle, aspect, 0.1, 1000);
      return camera;
    }
  }

  /**
   * 从Prim创建灯光
   */
  private createLightFromPrim(prim: UsdPrim): THREE.Light {
    const intensity = (this.attributeResolver.resolve(prim, 'intensity')?.value as number) || 1;
    const color = (this.attributeResolver.resolve(prim, 'color')?.value as [
      number,
      number,
      number,
    ]) || [1, 1, 1];

    let light: THREE.Light;

    switch (prim.typeName) {
      case 'DistantLight':
        // 平行光
        const angle = (this.attributeResolver.resolve(prim, 'angle')?.value as number) || 0.53;
        light = new THREE.DirectionalLight(
          new THREE.Color(color[0], color[1], color[2]),
          intensity,
        );
        light.angle = (angle * Math.PI) / 180; // 转换为弧度
        break;

      case 'DomeLight':
        // 环境光（使用半球光模拟）
        light = new THREE.HemisphereLight(
          new THREE.Color(color[0], color[1], color[2]),
          new THREE.Color(0.2, 0.2, 0.2),
          intensity,
        );
        break;

      case 'SphereLight':
        // 点光源
        const radius = (this.attributeResolver.resolve(prim, 'radius')?.value as number) || 0.5;
        light = new THREE.PointLight(new THREE.Color(color[0], color[1], color[2]), intensity);
        (light as THREE.PointLight).distance = radius * 10; // 简化转换
        break;

      case 'RectLight':
        // 矩形光源（使用区域光模拟）
        const width = (this.attributeResolver.resolve(prim, 'width')?.value as number) || 1;
        const height = (this.attributeResolver.resolve(prim, 'height')?.value as number) || 1;
        light = new THREE.RectAreaLight(color, intensity, width, height);
        break;

      default:
        // 默认使用点光源
        light = new THREE.PointLight(new THREE.Color(color[0], color[1], color[2]), intensity);
        break;
    }

    return light;
  }

  /**
   * 应用变换
   */
  private applyTransform(object: THREE.Object3D, prim: UsdPrim): void {
    // 获取变换属性
    const translate = (this.attributeResolver.resolve(prim, 'xformOp:translate')?.value as [
      number,
      number,
      number,
    ]) || [0, 0, 0];
    const rotateXYZ = (this.attributeResolver.resolve(prim, 'xformOp:rotateXYZ')?.value as [
      number,
      number,
      number,
    ]) || [0, 0, 0];
    const scale = (this.attributeResolver.resolve(prim, 'xformOp:scale')?.value as [
      number,
      number,
      number,
    ]) || [1, 1, 1];

    // 应用变换
    object.position.set(translate[0], translate[1], translate[2]);
    object.rotation.set(
      (rotateXYZ[0] * Math.PI) / 180,
      (rotateXYZ[1] * Math.PI) / 180,
      (rotateXYZ[2] * Math.PI) / 180,
    );
    object.scale.set(scale[0], scale[1], scale[2]);
  }

  /**
   * 获取Prim的材质
   */
  private getMaterialForPrim(prim: UsdPrim): THREE.Material {
    // 检查材质绑定
    const materialBinding = prim.relationships?.get('material:binding');
    if (materialBinding && materialBinding.targets.length > 0) {
      const materialPath = materialBinding.targets[0];
      const materialKey = materialPath.pathString;

      // 检查缓存
      if (this.materialCache.has(materialKey)) {
        return this.materialCache.get(materialKey)!;
      }

      // 获取USD材质网络
      const network = this.materialManager.getMaterialNetwork(materialPath);
      if (network?.surfaceShader) {
        const material = this.convertUsdShaderToThreeJS(network.surfaceShader);
        this.materialCache.set(materialKey, material);
        return material;
      }
    }

    // 默认材质
    return new THREE.MeshStandardMaterial({ color: 0x888888 });
  }

  /**
   * 转换USD着色器到Three.js材质
   */
  private convertUsdShaderToThreeJS(shader: any): THREE.Material {
    // 这里实现USD到Three.js材质的转换逻辑
    // 简化示例：只处理UsdPreviewSurface

    const inputs = shader.inputs;
    const material = new THREE.MeshStandardMaterial();

    // 漫反射颜色
    const diffuseColor = inputs.get('diffuseColor')?.value;
    if (diffuseColor) {
      material.color.setRGB(diffuseColor[0], diffuseColor[1], diffuseColor[2]);
    }

    // 金属度
    const metallic = inputs.get('metallic')?.value;
    if (metallic !== undefined) {
      material.metalness = metallic;
    }

    // 粗糙度
    const roughness = inputs.get('roughness')?.value;
    if (roughness !== undefined) {
      material.roughness = roughness;
    }

    // 透明度
    const opacity = inputs.get('opacity')?.value;
    if (opacity !== undefined && opacity < 1) {
      material.opacity = opacity;
      material.transparent = true;
    }

    // 法线贴图（需要加载纹理）
    const normal = inputs.get('normal')?.connection;
    if (normal) {
      // 这里应该连接法线贴图纹理
      // 简化处理
    }

    return material;
  }

  /**
   * 从Three.js移除Prim
   */
  private removePrimFromThreeJS(path: SdfPath): void {
    const object = this.primToObject.get(path.pathString);
    if (object) {
      object.parent?.remove(object);
      this.primToObject.delete(path.pathString);

      // 清理几何体和材质缓存
      // 这里可以实现更智能的缓存清理
    }
  }

  /**
   * 更新Prim属性
   */
  private updatePrimAttribute(path: SdfPath, attrName: string): void {
    const object = this.primToObject.get(path.pathString);
    if (!object) return;

    const prim = this.stage.getPrimAtPath(path);
    if (!prim) return;

    // 处理特定属性更新
    switch (attrName) {
      case 'visibility':
        const visible = this.attributeResolver.resolve(prim, 'visibility')?.value !== 'invisible';
        object.visible = visible;
        break;

      case 'xformOp:translate':
      case 'xformOp:rotateXYZ':
      case 'xformOp:scale':
        this.applyTransform(object, prim);
        break;

      case 'material:binding':
        // 重新应用材质
        if (object instanceof THREE.Mesh) {
          object.material = this.getMaterialForPrim(prim);
        }
        break;
    }
  }

  /**
   * 获取Three.js场景
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * 同步整个场景
   */
  syncScene(): void {
    // 清空当前场景
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.primToObject.clear();

    // 同步所有Prim
    for (const prim of this.stage.traverse()) {
      if (prim.path.pathString !== '/') {
        this.syncPrimToThreeJS(prim.path);
      }
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.materialCache.clear();
    this.geometryCache.clear();
    this.textureCache.clear();
  }

  /**
   * 获取Prim对应的Three.js对象
   */
  getObjectForPrim(path: SdfPath): THREE.Object3D | undefined {
    return this.primToObject.get(path.pathString);
  }

  /**
   * 获取Prim路径（从Three.js对象）
   */
  getPrimPathForObject(object: THREE.Object3D): SdfPath | undefined {
    for (const [path, obj] of this.primToObject) {
      if (obj === object) {
        return new SdfPath(path);
      }
    }
    return undefined;
  }
}

// 扩展SdfPath类
if (!SdfPath.prototype.equals) {
  SdfPath.prototype.equals = function (other: SdfPath): boolean {
    return this.pathString === other.pathString;
  };
}
