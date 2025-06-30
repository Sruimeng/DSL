// DSL模型加载和解析系统
import { FBXLoader } from '@/engine/loaders/fbx';
import { GLTFLoader } from '@/engine/loaders/gltf';
import * as THREE from 'three';
import type { DSLScene, GeometryInline, Light, MaterialInline, SceneObject } from '../types/core';

// 支持的模型格式
export type ModelFormat = 'fbx' | 'gltf' | 'glb' | 'obj' | 'dae';

// 加载结果接口
export interface LoadResult {
  objects: SceneObject[];
  materials: MaterialInline[];
  lights: Light[];
  animations?: THREE.AnimationClip[];
  metadata?: {
    polyCount: number;
    objectCount: number;
    materialCount: number;
    textureCount: number;
  };
}

// 加载选项
export interface LoadOptions {
  format?: ModelFormat;
  scale?: number;
  mergeGeometries?: boolean;
  extractMaterials?: boolean;
  extractLights?: boolean;
  generateUVs?: boolean;
  center?: boolean;
  computeNormals?: boolean;
}

// 几何体提取器
export class GeometryExtractor {
  static fromBufferGeometry(geometry: THREE.BufferGeometry): GeometryInline {
    // 计算包围盒获取尺寸
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    // 根据几何体特征推断类型
    const vertices = geometry.attributes.position.count;
    const indices = geometry.index?.count || 0;

    // 简单启发式判断几何体类型
    if (vertices === 8 && indices === 36) {
      return {
        type: 'box',
        size: size,
      };
    } else if (vertices > 100 && this.isSpherelike(geometry)) {
      return {
        type: 'sphere',
        size: Math.max(size.x, size.y, size.z) / 2,
      };
    } else if (size.y < 0.01) {
      return {
        type: 'plane',
        size: new THREE.Vector3(size.x, size.z, 1),
      };
    } else {
      // 默认作为自定义几何体处理
      return {
        type: 'model',
        size: size,
      };
    }
  }

  private static isSpherelike(geometry: THREE.BufferGeometry): boolean {
    // 检查顶点是否大致分布在球面上
    const positions = geometry.attributes.position;
    const center = new THREE.Vector3();
    geometry.computeBoundingSphere();
    if (!geometry.boundingSphere) return false;

    center.copy(geometry.boundingSphere.center);
    const radius = geometry.boundingSphere.radius;

    // 检查顶点到中心的距离方差
    let sumSquaredDiff = 0;
    const tempVec = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      tempVec.fromBufferAttribute(positions, i);
      const distance = tempVec.distanceTo(center);
      const diff = distance - radius;
      sumSquaredDiff += diff * diff;
    }

    const variance = sumSquaredDiff / positions.count;
    return variance < radius * 0.1; // 如果方差小于半径的10%，认为是球形
  }
}

// 材质提取器
export class MaterialExtractor {
  static fromThreeMaterial(material: THREE.Material, index: number): MaterialInline {
    const extracted: MaterialInline = {
      id: `extracted_material_${index}`,
      name: material.name || `Material ${index}`,
      type: 'standard',
    };

    if (material instanceof THREE.MeshStandardMaterial) {
      extracted.type = 'standard';
      extracted.color = `#${material.color.getHexString()}`;
      extracted.metalness = material.metalness;
      extracted.roughness = material.roughness;
      extracted.opacity = material.opacity;
      extracted.transparent = material.transparent;

      if (material.emissive) {
        extracted.emissive = `#${material.emissive.getHexString()}`;
        extracted.emissiveIntensity = material.emissiveIntensity;
      }

      // 提取纹理贴图
      if (material.map) {
        extracted.map = this.extractTextureUrl(material.map);
      }
      if (material.normalMap) {
        extracted.normalMap = this.extractTextureUrl(material.normalMap);
      }
      if (material.roughnessMap) {
        extracted.roughnessMap = this.extractTextureUrl(material.roughnessMap);
      }
      if (material.metalnessMap) {
        extracted.metalnessMap = this.extractTextureUrl(material.metalnessMap);
      }
    } else if (material instanceof THREE.MeshPhongMaterial) {
      extracted.type = 'phong';
      extracted.color = `#${material.color.getHexString()}`;
      extracted.opacity = material.opacity;
      extracted.transparent = material.transparent;
    } else if (material instanceof THREE.MeshBasicMaterial) {
      extracted.type = 'basic';
      extracted.color = `#${material.color.getHexString()}`;
      extracted.opacity = material.opacity;
      extracted.transparent = material.transparent;
    }

    return extracted;
  }

  private static extractTextureUrl(texture: THREE.Texture): string {
    // 如果纹理有userData中的原始URL，使用它
    if (texture.userData.url) {
      return texture.userData.url;
    }

    // 否则尝试从image源获取
    if (texture.image && texture.image.src) {
      return texture.image.src;
    }

    // 生成数据URL作为后备方案
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx && texture.image) {
      canvas.width = texture.image.width || 256;
      canvas.height = texture.image.height || 256;
      ctx.drawImage(texture.image, 0, 0);
      return canvas.toDataURL();
    }

    return '';
  }
}

// 光源提取器
export class LightExtractor {
  static fromThreeLight(light: THREE.Light, index: number): Light {
    const base: Light = {
      id: `extracted_light_${index}`,
      name: light.name || `Light ${index}`,
      type: 'ambient',
      color: `#${light.color.getHexString()}`,
      intensity: light.intensity,
      position: light.position.clone(),
    };

    if (light instanceof THREE.DirectionalLight) {
      base.type = 'directional';
      base.target = light.target.position.clone();
      base.castShadow = light.castShadow;
    } else if (light instanceof THREE.PointLight) {
      base.type = 'point';
      base.distance = light.distance;
      base.decay = light.decay;
      base.castShadow = light.castShadow;
    } else if (light instanceof THREE.SpotLight) {
      base.type = 'spot';
      base.distance = light.distance;
      base.angle = light.angle;
      base.penumbra = light.penumbra;
      base.decay = light.decay;
      base.target = light.target.position.clone();
      base.castShadow = light.castShadow;
    } else if (light instanceof THREE.HemisphereLight) {
      base.type = 'hemisphere';
      base.groundColor = `#${light.groundColor.getHexString()}`;
    }

    return base;
  }
}

// 主加载器类
export class TripoModelLoader {
  private fbxLoader: FBXLoader;
  private gltfLoader: GLTFLoader;

  constructor() {
    const manager = new THREE.LoadingManager();
    this.fbxLoader = new FBXLoader(manager);
    this.gltfLoader = new GLTFLoader(manager);
  }

  async load(url: string, options: LoadOptions = {}): Promise<LoadResult> {
    const format = options.format || this.detectFormat(url);

    try {
      const object3d = await this.loadByFormat(url, format);
      return this.extractFromObject3D(object3d, options);
    } catch (error) {
      console.error('模型加载失败:', error);
      throw new Error(`无法加载模型: ${url}`);
    }
  }

  private detectFormat(url: string): ModelFormat {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'fbx':
        return 'fbx';
      case 'gltf':
        return 'gltf';
      case 'glb':
        return 'glb';
      case 'obj':
        return 'obj';
      case 'dae':
        return 'dae';
      default:
        throw new Error(`不支持的文件格式: ${extension}`);
    }
  }

  private async loadByFormat(url: string, format: ModelFormat): Promise<THREE.Object3D> {
    switch (format) {
      case 'fbx':
        return new Promise((resolve, reject) => {
          this.fbxLoader.load(url, resolve, undefined, reject);
        });

      case 'gltf':
      case 'glb':
        return new Promise((resolve, reject) => {
          this.gltfLoader.load(url, (gltf: any) => resolve(gltf.scene), undefined, reject);
        });

      default:
        throw new Error(`暂不支持格式: ${format}`);
    }
  }

  private extractFromObject3D(object3d: THREE.Object3D, options: LoadOptions): LoadResult {
    const objects: SceneObject[] = [];
    const materials: MaterialInline[] = [];
    const lights: Light[] = [];
    const materialMap = new Map<THREE.Material, string>();

    // 应用缩放
    if (options.scale && options.scale !== 1) {
      object3d.scale.multiplyScalar(options.scale);
    }

    // 居中
    if (options.center) {
      const box = new THREE.Box3().setFromObject(object3d);
      const center = new THREE.Vector3();
      box.getCenter(center);
      object3d.position.sub(center);
    }

    let materialIndex = 0;
    let lightIndex = 0;

    // 遍历场景图
    object3d.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 处理网格对象
        let materialId: string | undefined;

        if (child.material && options.extractMaterials !== false) {
          if (!materialMap.has(child.material as THREE.Material)) {
            const extractedMaterial = MaterialExtractor.fromThreeMaterial(
              child.material as THREE.Material,
              materialIndex++,
            );
            materials.push(extractedMaterial);
            materialMap.set(child.material as THREE.Material, extractedMaterial.id!);
          }
          materialId = materialMap.get(child.material as THREE.Material);
        }

        const sceneObject: SceneObject = {
          id: child.uuid,
          name: child.name || `Mesh_${objects.length}`,
          type: 'mesh',
          geometry: GeometryExtractor.fromBufferGeometry(child.geometry),
          material: materialId ? { id: materialId } : undefined,
          transform: {
            position: child.position.clone(),
            rotation: new THREE.Vector3(child.rotation.x, child.rotation.y, child.rotation.z),
            scale: child.scale.clone(),
          },
          visible: child.visible,
          castShadow: child.castShadow,
          receiveShadow: child.receiveShadow,
          userData: { ...child.userData },
        };

        objects.push(sceneObject);
      } else if (child instanceof THREE.Light && options.extractLights !== false) {
        // 处理光源
        const light = LightExtractor.fromThreeLight(child, lightIndex++);
        lights.push(light);
      }
    });

    // 计算元数据
    const metadata = {
      polyCount: this.countPolygons(object3d),
      objectCount: objects.length,
      materialCount: materials.length,
      textureCount: this.countTextures(materials),
    };

    return {
      objects,
      materials,
      lights,
      metadata,
    };
  }

  private countPolygons(object3d: THREE.Object3D): number {
    let count = 0;
    object3d.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        if (geometry.index) {
          count += geometry.index.count / 3;
        } else {
          count += geometry.attributes.position.count / 3;
        }
      }
    });
    return Math.floor(count);
  }

  private countTextures(materials: MaterialInline[]): number {
    const textures = new Set<string>();

    materials.forEach((material) => {
      if (material.map) textures.add(material.map);
      if (material.normalMap) textures.add(material.normalMap);
      if (material.roughnessMap) textures.add(material.roughnessMap);
      if (material.metalnessMap) textures.add(material.metalnessMap);
    });

    return textures.size;
  }
}

// 导出实例
export const modelLoader = new TripoModelLoader();

// 便捷函数
export async function loadModelToScene(url: string, options?: LoadOptions): Promise<LoadResult> {
  return modelLoader.load(url, options);
}

// DSL场景集成函数
export function integrateLoadResult(
  scene: DSLScene,
  loadResult: LoadResult,
  options: { prefix?: string; replaceExisting?: boolean } = {},
): DSLScene {
  const { prefix = 'imported_', replaceExisting = false } = options;

  // 如果需要替换现有内容，清空场景
  const newScene = { ...scene };

  if (replaceExisting) {
    newScene.objects = [];
    newScene.materials = [];
    newScene.lights = newScene.lights.filter(
      (light) => light.type === 'ambient', // 保留环境光
    );
  }

  // 添加加载的内容，确保ID唯一
  const newObjects = loadResult.objects.map((obj) => ({
    ...obj,
    id: `${prefix}${obj.id}`,
    name: `${prefix}${obj.name}`,
  }));

  const newMaterials = loadResult.materials.map((mat) => ({
    ...mat,
    id: `${prefix}${mat.id}`,
    name: `${prefix}${mat.name}`,
  }));

  const newLights = loadResult.lights.map((light) => ({
    ...light,
    id: `${prefix}${light.id}`,
    name: `${prefix}${light.name}`,
  }));

  return {
    ...newScene,
    objects: [...newScene.objects, ...newObjects],
    materials: [...newScene.materials, ...newMaterials],
    lights: [...newScene.lights, ...newLights],
    metadata: {
      ...newScene.metadata,
      modified: Date.now(),
    },
  };
}
